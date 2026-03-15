import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc,
  updateDoc,
  getDocFromServer
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { Toilet, Review, UserProfile, OperationType, FirestoreErrorInfo } from '../types';

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
};

export const createUserProfile = async (user: UserProfile) => {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getToilets = (callback: (toilets: Toilet[]) => void) => {
  const path = 'toilets';
  return onSnapshot(collection(db, path), (snapshot) => {
    const toilets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Toilet));
    callback(toilets);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addToilet = async (toilet: Omit<Toilet, 'id'>) => {
  const path = 'toilets';
  try {
    const docRef = await addDoc(collection(db, path), toilet);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const addReview = async (review: Omit<Review, 'id'>) => {
  const path = 'reviews';
  try {
    await addDoc(collection(db, path), review);
    // Also update toilet hygiene score (simplified logic)
    const toiletRef = doc(db, 'toilets', review.toilet_id);
    const toiletSnap = await getDoc(toiletRef);
    if (toiletSnap.exists()) {
      const toiletData = toiletSnap.data() as Toilet;
      const newScore = (toiletData.hygiene_score + review.rating * 20) / 2; // Very simple average
      await updateDoc(toiletRef, { hygiene_score: newScore });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const uploadToiletPhoto = async (file: File) => {
  const storageRef = ref(storage, `toilets/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

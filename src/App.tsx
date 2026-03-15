import React, { useEffect, useState, useRef, Component, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Search, 
  Plus, 
  Star, 
  Droplets, 
  Wind, 
  ShieldCheck, 
  Camera, 
  Navigation, 
  LogOut, 
  User as UserIcon,
  AlertCircle,
  X,
  ChevronRight,
  Image as ImageIcon
} from "lucide-react";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { 
  getToilets, 
  addToilet, 
  uploadToiletPhoto, 
  createUserProfile,
  testConnection 
} from "./services/firebaseService";
import { Toilet, UserProfile } from "./types";

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
    this.props = props;
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">Something went wrong</h2>
            <p className="text-zinc-500 text-sm mb-6">
              {this.state.errorMessage.startsWith('{') ? "A database error occurred. Please try again later." : this.state.errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-900 text-white rounded-2xl font-medium hover:bg-zinc-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    testConnection();
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile: UserProfile = {
          id: currentUser.uid,
          name: currentUser.displayName || "Anonymous",
          email: currentUser.email || "",
          joined_date: new Date().toISOString()
        };
        await createUserProfile(profile);
      }
      setLoading(false);
    });

    const unsubscribeToilets = getToilets((data) => {
      setToilets(data);
    });

    // Get Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error("Geolocation error:", error)
      );
    }

    return () => {
      unsubscribeAuth();
      unsubscribeToilets();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const filteredToilets = toilets.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
        {!user ? (
          <WelcomeScreen onLogin={handleLogin} />
        ) : (
          <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative flex flex-col">
            {/* Header */}
            <header className="p-6 pb-4 sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center">
                    <MapPin className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold tracking-tight">Hygiene Hub</h1>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Sanitation for All</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                  <LogOut className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search nearby facilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all"
                />
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 pb-24 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Nearby Facilities</h2>
                <span className="text-xs text-zinc-400">{filteredToilets.length} found</span>
              </div>

              {filteredToilets.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-zinc-300" />
                  </div>
                  <p className="text-zinc-500 text-sm">No facilities found nearby.<br/>Be the first to add one!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredToilets.map((toilet) => (
                    <React.Fragment key={toilet.id}>
                      <ToiletCard toilet={toilet} />
                    </React.Fragment>
                  ))}
                </div>
              )}
            </main>

            {/* Bottom Nav / FAB */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-zinc-900 text-white px-6 py-4 rounded-full shadow-2xl shadow-zinc-900/40 flex items-center gap-2 hover:scale-105 transition-transform active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold text-sm">Add Facility</span>
              </button>
            </div>

            <AnimatePresence>
              {isAddModalOpen && (
                <AddToiletModal 
                  onClose={() => setIsAddModalOpen(false)} 
                  userLocation={userLocation}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function WelcomeScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="w-20 h-20 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-zinc-900/20">
          <MapPin className="text-white w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-zinc-900">Hygiene Hub</h1>
        <p className="text-zinc-500 max-w-xs mx-auto leading-relaxed">
          Ensuring safe and clean sanitation facilities are accessible to everyone, everywhere.
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={onLogin}
        className="w-full max-w-xs py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors shadow-xl shadow-zinc-900/10"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
        Sign in with Google
      </motion.button>
      
      <p className="mt-8 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
        Sanitation for All • 2026
      </p>
    </div>
  );
}

interface ToiletCardProps {
  toilet: Toilet;
}

function ToiletCard({ toilet }: ToiletCardProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-zinc-100 p-5 rounded-3xl hover:border-zinc-200 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-zinc-900 group-hover:text-zinc-700 transition-colors">{toilet.name}</h3>
          <div className="flex items-center gap-1 text-zinc-400 text-xs mt-1">
            <Navigation className="w-3 h-3" />
            <span>Nearby • {Math.round(Math.random() * 500)}m away</span>
          </div>
        </div>
        <div className="bg-zinc-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-zinc-900 fill-zinc-900" />
          <span className="text-sm font-bold">{Math.round(toilet.hygiene_score / 20 * 10) / 10}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <RatingBadge icon={<Droplets className="w-3 h-3" />} label="Water" active={toilet.water_available} />
        <RatingBadge icon={<Wind className="w-3 h-3" />} label="Smell" active={toilet.smell_rating > 3} />
        <RatingBadge icon={<ShieldCheck className="w-3 h-3" />} label="Safe" active={toilet.safety_rating > 3} />
        <RatingBadge icon={<Plus className="w-3 h-3" />} label="Clean" active={toilet.cleanliness_rating > 3} />
      </div>

      {toilet.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {toilet.photos.map((p, i) => (
            <img key={i} src={p} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-zinc-100" referrerPolicy="no-referrer" />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function RatingBadge({ icon, label, active }: { icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-colors ${active ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-400"}`}>
      {icon}
      <span className="text-[8px] font-bold uppercase tracking-tighter">{label}</span>
    </div>
  );
}

function AddToiletModal({ onClose, userLocation }: { onClose: () => void, userLocation: { lat: number, lng: number } | null }) {
  const [name, setName] = useState("");
  const [cleanliness, setCleanliness] = useState(3);
  const [smell, setSmell] = useState(3);
  const [safety, setSafety] = useState(3);
  const [water, setWater] = useState(true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !userLocation) return;

    setSubmitting(true);
    try {
      let photoUrl = "";
      if (photo) {
        photoUrl = await uploadToiletPhoto(photo);
      }

      const hygiene_score = ((cleanliness + smell + safety + (water ? 5 : 0)) / 20) * 100;

      await addToilet({
        name,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        cleanliness_rating: cleanliness,
        smell_rating: smell,
        safety_rating: safety,
        water_available: water,
        hygiene_score,
        photos: photoUrl ? [photoUrl] : [],
        comments: []
      });
      onClose();
    } catch (error) {
      console.error("Add toilet error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-8 pb-10 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Add Facility</h2>
          <button onClick={onClose} className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Facility Name</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Central Park Public Restroom"
              className="w-full bg-zinc-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <RatingInput label="Clean" value={cleanliness} onChange={setCleanliness} />
            <RatingInput label="Smell" value={smell} onChange={setSmell} />
            <RatingInput label="Safety" value={safety} onChange={setSafety} />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <Droplets className="w-5 h-5 text-zinc-900" />
              <span className="text-sm font-semibold">Water Available?</span>
            </div>
            <button 
              type="button"
              onClick={() => setWater(!water)}
              className={`w-12 h-6 rounded-full transition-colors relative ${water ? "bg-zinc-900" : "bg-zinc-200"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${water ? "left-7" : "left-1"}`} />
            </button>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-100 rounded-3xl p-8 text-center cursor-pointer hover:border-zinc-200 transition-colors"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
            {photo ? (
              <div className="flex items-center justify-center gap-2 text-zinc-900 font-bold">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm truncate max-w-[200px]">{photo.name}</span>
              </div>
            ) : (
              <>
                <Camera className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 font-medium">Upload a photo of the condition</p>
              </>
            )}
          </div>

          <button 
            type="submit"
            disabled={submitting || !userLocation}
            className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-bold shadow-xl shadow-zinc-900/20 disabled:opacity-50 hover:bg-zinc-800 transition-colors"
          >
            {submitting ? "Adding Facility..." : "Confirm & Add"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function RatingInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="text-center">
      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">{label}</label>
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button 
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5"
          >
            <Star className={`w-4 h-4 ${star <= value ? "text-zinc-900 fill-zinc-900" : "text-zinc-100"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}


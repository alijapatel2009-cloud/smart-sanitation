export interface UserProfile {
  id: string;
  name: string;
  email: string;
  joined_date: string;
}

export interface Toilet {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  cleanliness_rating: number;
  smell_rating: number;
  water_available: boolean;
  safety_rating: number;
  hygiene_score: number;
  photos: string[];
  comments: string[];
}

export interface Review {
  id?: string;
  user_id: string;
  toilet_id: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

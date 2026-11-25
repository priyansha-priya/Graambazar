import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

export interface DbUserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  role: string;
  activeVillageCode: string | null;
}

interface AuthContextValue {
  firebaseUser: User | null;
  dbProfile: DbUserProfile | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<User>;
  signOutUser: () => Promise<void>;
  getAuthHeaders: () => Promise<Record<string, string> | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [dbProfile, setDbProfile] = useState<DbUserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const syncUserProfile = useCallback(async (user: User) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDbProfile(data.user ?? null);
      }
    } catch {
      // Keep UI resilient if profile sync is momentarily unavailable
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await syncUserProfile(user);
      } else {
        setDbProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserProfile]);

  const signInWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, googleAuthProvider);
    setFirebaseUser(credential.user);
    await syncUserProfile(credential.user);
    return credential.user;
  }, [syncUserProfile]);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setDbProfile(null);
  }, []);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string> | null> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    const token = await currentUser.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbProfile,
        authLoading,
        signInWithGoogle,
        signOutUser,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

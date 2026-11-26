import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authClient, authErrorMessage, toIndianE164 } from '../lib/authClient';

/** App user from GET /api/auth/me (public.users + role). */
export interface DbUserProfile {
  id: string;
  /** Better Auth user id. */
  uid: string;
  email: string | null;
  displayName: string;
  phone: string;
  role: string;
  activeVillageCode: string | null;
}

/** The signed-in Better Auth identity (exists before the phone number is verified). */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
}

interface AuthContextValue {
  authUser: AuthUser | null;
  dbProfile: DbUserProfile | null;
  /** Signed in, but no verified phone yet: the API refuses protected requests until then. */
  needsPhoneVerification: boolean;
  authLoading: boolean;
  /** Redirects to Google; the page reloads signed in. */
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  /** Sends an SMS code to a 10-digit Indian mobile number. */
  sendPhoneOtp: (mobile: string) => Promise<void>;
  /**
   * Checks the SMS code. Signed out: signs in (creating the account on first use).
   * Signed in: adds the verified number to the current account.
   */
  verifyPhoneOtp: (mobile: string, code: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Headers for API calls. The session cookie is sent automatically; null when signed out. */
  getAuthHeaders: () => Promise<Record<string, string> | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Better Auth's placeholder address for phone-only accounts is not shown to users. */
const visibleEmail = (email: string | null | undefined) =>
  email && !email.endsWith('@phone.grambazaar.local') ? email : null;

function requireMobile(mobile: string): string {
  const phone = toIndianE164(mobile);
  if (!phone) throw new Error('Please enter a valid 10-digit Indian mobile number.');
  return phone;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, isPending } = authClient.useSession();
  const [dbProfile, setDbProfile] = useState<DbUserProfile | null>(null);
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const sessionUser = session?.user ?? null;
  const authUser: AuthUser | null = sessionUser
    ? {
        uid: sessionUser.id,
        email: visibleEmail(sessionUser.email),
        displayName: sessionUser.name || null,
        phoneNumber: (sessionUser as { phoneNumber?: string | null }).phoneNumber ?? null,
      }
    : null;
  const sessionKey = sessionUser
    ? `${sessionUser.id}:${(sessionUser as { phoneNumberVerified?: boolean | null }).phoneNumberVerified ?? false}`
    : null;

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = (await response.json()) as {
          user: DbUserProfile | null;
          needsPhoneVerification: boolean;
        };
        setDbProfile(data.user);
        setNeedsPhoneVerification(data.needsPhoneVerification);
      } else {
        setDbProfile(null);
        setNeedsPhoneVerification(false);
      }
    } catch {
      // Keep the UI usable if the profile sync is momentarily unavailable
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Load the app profile whenever the signed-in user (or their phone status) changes.
  useEffect(() => {
    if (sessionKey) {
      void refreshProfile();
    } else {
      setDbProfile(null);
      setNeedsPhoneVerification(false);
    }
  }, [sessionKey, refreshProfile]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.href,
    });
    if (error) throw new Error(authErrorMessage(error, 'Google sign-in is not available right now.'));
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string, rememberMe = true) => {
    const { error } = await authClient.signIn.email({ email: email.trim(), password, rememberMe });
    if (error) throw new Error(authErrorMessage(error, 'Unable to sign in right now.'));
  }, []);

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    if (error) throw new Error(authErrorMessage(error, 'Unable to create your account right now.'));
  }, []);

  const sendPhoneOtp = useCallback(async (mobile: string) => {
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: requireMobile(mobile) });
    if (error) throw new Error(authErrorMessage(error, 'Unable to send the code right now.'));
  }, []);

  const verifyPhoneOtp = useCallback(
    async (mobile: string, code: string) => {
      const { error } = await authClient.phoneNumber.verify({
        phoneNumber: requireMobile(mobile),
        code: code.trim(),
        updatePhoneNumber: Boolean(sessionUser),
      });
      if (error) throw new Error(authErrorMessage(error, 'Unable to verify the code right now.'));
      await refreshProfile();
    },
    [sessionUser, refreshProfile]
  );

  const signOutUser = useCallback(async () => {
    await authClient.signOut();
    setDbProfile(null);
    setNeedsPhoneVerification(false);
  }, []);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string> | null> => {
    if (!sessionUser) return null;
    return { 'Content-Type': 'application/json' };
  }, [sessionUser]);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        dbProfile,
        needsPhoneVerification,
        authLoading: isPending || profileLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPhoneOtp,
        verifyPhoneOtp,
        signOutUser,
        refreshProfile,
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

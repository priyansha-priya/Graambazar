import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

/** "Continue with Google": redirects to Google and back, signed in. */
export const GoogleSignInButton: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleClick = async () => {
    setError(undefined);
    setLoading(true);
    try {
      await signInWithGoogle(); // navigates away on success
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in is not available right now.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className="w-full h-11 px-4 rounded-xl border border-[#D1D5DB] bg-white hover:bg-[#F8FAFC] text-sm font-semibold text-[#1F2937] flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4-3.1Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4 3.1c.95-2.84 3.6-4.95 6.72-4.95Z"
          />
        </svg>
        <span>{loading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
      </button>
      {error && <p className="text-xs font-medium text-[#DC2626]">{error}</p>}
    </div>
  );
};

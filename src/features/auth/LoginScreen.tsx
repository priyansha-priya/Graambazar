import React, { FormEvent, useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './components/AuthLayout';
import { AuthPasswordField } from './components/AuthPasswordField';
import { AuthScreenType } from './types';

export interface LoginScreenProps {
  onChangeScreen: (screen: AuthScreenType) => void;
  onReturnToMarketplace: () => void;
  onAuthComplete: (message: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onChangeScreen,
  onReturnToMarketplace,
  onAuthComplete,
}) => {
  const { signInWithGoogle } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    google?: string;
  }>({});

  const handleGoogleSignIn = async () => {
    setErrors((prev) => ({ ...prev, google: undefined }));
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      onAuthComplete(`Welcome back, ${user.displayName || user.email || 'GramBazaar Member'}!`);
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes('popup-closed-by-user')
          ? 'Google sign-in popup was closed before completing.'
          : 'Unable to sign in with Google right now. Please try again.';
      setErrors((prev) => ({ ...prev, google: message }));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      nextErrors.identifier = 'Please enter your mobile number or email address.';
    }
    if (!password.trim()) {
      nextErrors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onAuthComplete('Welcome back to GramBazaar!');
  };

  return (
    <AuthLayout
      activeScreen="LOGIN"
      visualVariant="marketplace"
      editorialEyebrow="Village Food & Grocery Marketplace"
      editorialHeading="Fresh groceries & homestyle meals, straight from your village."
      editorialSubtext="Connect with trusted nearby kirana stores, dhabas, and village kitchens with transparent prices and doorstep delivery."
      onChangeScreen={onChangeScreen}
      onReturnToMarketplace={onReturnToMarketplace}
    >
      <div className="space-y-6">
        {/* Card Header */}
        <div className="space-y-2 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#218838]">
            Welcome Back
          </p>
          <h1 className="auth-display text-2xl sm:text-[1.75rem] font-extrabold text-[#1F2937] tracking-tight leading-tight">
            Sign in to GramBazaar
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Enter your mobile number or email to continue shopping from your nearby village stores.
          </p>
        </div>

        {/* Google Sign-In */}
        <div className="space-y-2">
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
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
            <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>
          {errors.google && (
            <p className="text-xs font-medium text-[#DC2626]">{errors.google}</p>
          )}
        </div>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-[#E5E7EB]" />
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
            or sign in with mobile / email
          </span>
          <div className="flex-grow border-t border-[#E5E7EB]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Mobile Number or Email"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="e.g. 98765 43210 or name@example.com"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) {
                setErrors((prev) => ({ ...prev, identifier: undefined }));
              }
            }}
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.identifier}
            required
          />

          <AuthPasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            error={errors.password}
            required
          />

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <label className="inline-flex items-center gap-2.5 text-xs font-medium text-[#4B5563] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#CBD5E1] text-[#218838] accent-[#218838] cursor-pointer"
              />
              <span>Remember me on this device</span>
            </label>

            <button
              type="button"
              onClick={() => onChangeScreen('FORGOT_PASSWORD')}
              className="text-xs font-semibold text-[#218838] hover:text-[#176B2C] hover:underline transition-colors cursor-pointer shrink-0"
            >
              Forgot Password?
            </button>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Bottom Switch Link */}
        <div className="pt-5 border-t border-[#E5E7EB] text-center">
          <p className="text-sm text-[#6B7280]">
            New to GramBazaar?{' '}
            <button
              type="button"
              onClick={() => onChangeScreen('SIGNUP')}
              className="font-semibold text-[#218838] hover:text-[#176B2C] hover:underline transition-colors cursor-pointer"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

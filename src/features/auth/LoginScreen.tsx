import React, { FormEvent, useState } from 'react';
import { ArrowRight, Mail, Smartphone } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './components/AuthLayout';
import { AuthPasswordField } from './components/AuthPasswordField';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { PhoneOtpForm } from './components/PhoneOtpForm';
import { AuthScreenType } from './types';

export interface LoginScreenProps {
  onChangeScreen: (screen: AuthScreenType) => void;
  onReturnToMarketplace: () => void;
  onAuthComplete: (message: string) => void;
}

type LoginMode = 'MOBILE' | 'EMAIL';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onChangeScreen,
  onReturnToMarketplace,
  onAuthComplete,
}) => {
  const { signInWithEmail } = useAuth();
  const [mode, setMode] = useState<LoginMode>('MOBILE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Please enter your password.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await signInWithEmail(email, password, rememberMe);
      onAuthComplete('Welcome back to GramBazaar!');
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Unable to sign in right now.' });
    } finally {
      setSubmitting(false);
    }
  };

  const modeButton = (value: LoginMode, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => {
        setMode(value);
        setErrors({});
      }}
      className={`flex-1 h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
        mode === value ? 'bg-white text-[#1F2937] shadow-sm' : 'text-[#6B7280] hover:text-[#1F2937]'
      }`}
      aria-pressed={mode === value}
    >
      {icon}
      {label}
    </button>
  );

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
            Use your mobile number or email to continue shopping from your nearby village stores.
          </p>
        </div>

        <GoogleSignInButton />

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-[#E5E7EB]" />
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
            or sign in with mobile / email
          </span>
          <div className="flex-grow border-t border-[#E5E7EB]" />
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-[#F1F5F9]">
          {modeButton('MOBILE', 'Mobile OTP', <Smartphone className="w-3.5 h-3.5" />)}
          {modeButton('EMAIL', 'Email & Password', <Mail className="w-3.5 h-3.5" />)}
        </div>

        {mode === 'MOBILE' ? (
          <PhoneOtpForm
            verifyLabel="Verify & Sign In"
            onVerified={() => onAuthComplete('Welcome to GramBazaar!')}
          />
        ) : (
          <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email || errors.form) setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email}
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
                if (errors.password || errors.form) setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
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

            {errors.form && <p className="text-xs font-medium text-[#DC2626]">{errors.form}</p>}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={submitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        )}

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

import React, { FormEvent, useState } from 'react';
import { ArrowRight, CheckCircle2, Mail, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from './components/AuthLayout';
import { AuthPasswordField } from './components/AuthPasswordField';
import { PhoneOtpForm } from './components/PhoneOtpForm';
import { useAuth } from '../../contexts/AuthContext';
import { toIndianE164 } from '../../lib/authClient';
import { AuthScreenType } from './types';

export interface SignUpScreenProps {
  onChangeScreen: (screen: AuthScreenType) => void;
  onReturnToMarketplace: () => void;
  onAuthComplete: (message: string) => void;
}

interface SignUpErrors {
  fullName?: string;
  mobile?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  form?: string;
}

/** FORM: details → VERIFY: SMS code for the mobile number → DONE */
type SignUpStep = 'FORM' | 'VERIFY' | 'DONE';

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onChangeScreen,
  onReturnToMarketplace,
  onAuthComplete,
}) => {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [step, setStep] = useState<SignUpStep>('FORM');
  const [submitting, setSubmitting] = useState(false);
  const { signUpWithEmail } = useAuth();

  const clearFieldError = (field: keyof SignUpErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getPasswordStrength = (value: string): { score: number; label: string } => {
    if (!value) return { score: 0, label: '' };
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { score, label: labels[score] || 'Weak' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: SignUpErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Please enter your full name.';
    }
    if (!mobile.replace(/\D/g, '')) {
      nextErrors.mobile = 'Please enter your 10-digit mobile number.';
    } else if (!toIndianE164(mobile)) {
      nextErrors.mobile = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Please create a password.';
    } else if (password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.';
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!acceptedTerms) {
      nextErrors.terms = 'Please agree to the Terms & Conditions to continue.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await signUpWithEmail(fullName, email, password);
      setStep('VERIFY');
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Unable to create your account right now.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      activeScreen="SIGNUP"
      visualVariant="culinary"
      editorialEyebrow="Join Your Local Community"
      editorialHeading="One account for every trusted shop in your village."
      editorialSubtext="Order daily essentials, fresh seasonal vegetables, and warm restaurant meals with simple village-first delivery."
      onChangeScreen={onChangeScreen}
      onReturnToMarketplace={onReturnToMarketplace}
    >
      {step === 'VERIFY' ? (
        <div className="space-y-5">
          <div className="space-y-1.5 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#218838]">
              One last step
            </p>
            <h1 className="auth-display text-2xl sm:text-[1.7rem] font-extrabold text-[#1F2937] tracking-tight leading-tight">
              Verify your mobile number
            </h1>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              We sent a code by SMS. Shops use this number to reach you about your orders.
            </p>
          </div>
          <PhoneOtpForm
            initialMobile={mobile}
            sendOnMount
            verifyLabel="Verify Mobile Number"
            onVerified={() => setStep('DONE')}
          />
        </div>
      ) : step === 'DONE' ? (
        <div className="space-y-6 py-2 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#218838] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="auth-display text-2xl font-extrabold text-[#1F2937] tracking-tight">
              Account created, {fullName.trim().split(' ')[0]}!
            </h1>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-sm mx-auto">
              Your GramBazaar profile for{' '}
              <span className="font-semibold text-[#1F2937]">+91 {mobile}</span>{' '}
              is ready to explore local shops and kitchens.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => onAuthComplete(`Welcome to GramBazaar, ${fullName.trim()}!`)}
            >
              Explore GramBazaar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Card Header */}
          <div className="space-y-1.5 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#218838]">
              Create Account
            </p>
            <h1 className="auth-display text-2xl sm:text-[1.7rem] font-extrabold text-[#1F2937] tracking-tight leading-tight">
              Join GramBazaar
            </h1>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Set up your account in under a minute to order from local stores.
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearFieldError('fullName');
                }}
                leftIcon={<User className="w-4 h-4" />}
                error={errors.fullName}
                required
              />

              <Input
                label="Mobile Number"
                name="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                leftAddon="+91"
                placeholder="98765 43210"
                value={mobile}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
                  setMobile(cleaned);
                  clearFieldError('mobile');
                }}
                error={errors.mobile}
                required
              />
            </div>

            <Input
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ramesh@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email}
              required
            />

            <div className="space-y-2">
              <AuthPasswordField
                label="Password"
                name="newPassword"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                error={errors.password}
                required
              />

              {/* Subtle Strength Indicator */}
              {password.length > 0 && (
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="flex-1 grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 rounded-full transition-colors ${
                          strength.score >= level
                            ? strength.score <= 1
                              ? 'bg-[#DC2626]'
                              : strength.score === 2
                              ? 'bg-[#D97706]'
                              : 'bg-[#218838]'
                            : 'bg-[#E5E7EB]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-[#6B7280] min-w-[44px] text-right">
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <AuthPasswordField
              label="Confirm Password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError('confirmPassword');
              }}
              error={errors.confirmPassword}
              required
            />

            {/* Terms & Conditions */}
            <div className="space-y-1.5 pt-0.5">
              <label className="flex items-start gap-2.5 text-xs text-[#4B5563] cursor-pointer select-none leading-relaxed">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    clearFieldError('terms');
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] text-[#218838] accent-[#218838] cursor-pointer shrink-0"
                />
                <span>
                  I agree to the GramBazaar{' '}
                  <span className="font-semibold text-[#218838]">
                    Terms &amp; Conditions
                  </span>{' '}
                  and{' '}
                  <span className="font-semibold text-[#218838]">
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>
              {errors.terms && (
                <p className="text-xs text-[#DC2626] font-medium">
                  {errors.terms}
                </p>
              )}
            </div>

            {errors.form && <p className="text-xs font-medium text-[#DC2626]">{errors.form}</p>}

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={submitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {submitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          {/* Bottom Switch Link */}
          <div className="pt-4 border-t border-[#E5E7EB] text-center">
            <p className="text-sm text-[#6B7280]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onChangeScreen('LOGIN')}
                className="font-semibold text-[#218838] hover:text-[#176B2C] hover:underline transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

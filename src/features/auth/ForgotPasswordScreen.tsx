import React, { FormEvent, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from './components/AuthLayout';
import { AuthScreenType } from './types';

export interface ForgotPasswordScreenProps {
  onChangeScreen: (screen: AuthScreenType) => void;
  onReturnToMarketplace: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onChangeScreen,
  onReturnToMarketplace,
}) => {
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSent, setIsSent] = useState(false);
  const [resentNote, setResentNote] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!contact.trim()) {
      setError('Please enter your registered mobile number or email address.');
      return;
    }

    setError(undefined);
    setIsSent(true);
    setResentNote(false);
  };

  const handleResend = () => {
    setResentNote(true);
  };

  return (
    <AuthLayout
      activeScreen="FORGOT_PASSWORD"
      visualVariant="marketplace"
      editorialEyebrow="Account Recovery"
      editorialHeading="Get back to your local marketplace in moments."
      editorialSubtext="Your saved delivery addresses, order history, and village store preferences stay protected while you recover access."
      onChangeScreen={onChangeScreen}
      onReturnToMarketplace={onReturnToMarketplace}
    >
      {isSent ? (
        <div className="space-y-6 py-2 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#218838] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#218838]">
              Reset Link Sent
            </p>
            <h1 className="auth-display text-2xl font-extrabold text-[#1F2937] tracking-tight">
              Check your inbox or SMS
            </h1>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-sm mx-auto">
              We&apos;ve sent password reset instructions to{' '}
              <span className="font-semibold text-[#1F2937] break-all">
                {contact}
              </span>
              . Follow the link to choose a new password.
            </p>
          </div>

          {resentNote && (
            <p className="text-xs font-medium text-[#16A34A]">
              A fresh reset link has been sent again.
            </p>
          )}

          <div className="space-y-2.5 pt-1">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => onChangeScreen('RESET_PASSWORD')}
            >
              Continue to Reset Password
            </Button>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleResend}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#218838] hover:text-[#176B2C] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resend Link</span>
              </button>

              <span className="text-[#CBD5E1]" aria-hidden="true">
                &middot;
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsSent(false);
                  setResentNote(false);
                }}
                className="text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] transition-colors cursor-pointer"
              >
                Try another email/mobile
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => onChangeScreen('LOGIN')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#218838] hover:text-[#176B2C] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3 text-left">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] text-[#218838] flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h1 className="auth-display text-2xl sm:text-[1.75rem] font-extrabold text-[#1F2937] tracking-tight leading-tight">
                Forgot your password?
              </h1>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                No worries. Enter the mobile number or email linked to your GramBazaar account and we&apos;ll send you a reset link.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input
              label="Registered Mobile Number or Email"
              name="recoveryContact"
              type="text"
              autoComplete="username"
              placeholder="e.g. 98765 43210 or name@example.com"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                if (error) setError(undefined);
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              error={error}
              helperText="We'll send a one-time secure recovery link."
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Send Reset Link
            </Button>
          </form>

          {/* Back to Login */}
          <div className="pt-5 border-t border-[#E5E7EB] text-center">
            <button
              type="button"
              onClick={() => onChangeScreen('LOGIN')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#218838] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

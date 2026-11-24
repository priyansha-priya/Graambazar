import React, { FormEvent, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AuthLayout } from './components/AuthLayout';
import { AuthPasswordField } from './components/AuthPasswordField';
import { AuthScreenType } from './types';

export interface ResetPasswordScreenProps {
  onChangeScreen: (screen: AuthScreenType) => void;
  onReturnToMarketplace: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  onChangeScreen,
  onReturnToMarketplace,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isResetComplete, setIsResetComplete] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      nextErrors.newPassword = 'Please enter a new password.';
    } else if (!hasMinLength) {
      nextErrors.newPassword = 'Password must be at least 8 characters long.';
    } else if (!hasNumber) {
      nextErrors.newPassword = 'Include at least one number for better security.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password.';
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsResetComplete(true);
  };

  const rules = [
    { label: 'At least 8 characters', met: hasMinLength },
    { label: 'Contains a number (0–9)', met: hasNumber },
    { label: 'Passwords match', met: passwordsMatch },
  ];

  return (
    <AuthLayout
      activeScreen="RESET_PASSWORD"
      visualVariant="marketplace"
      editorialEyebrow="Account Security"
      editorialHeading="Set a fresh password and shop with peace of mind."
      editorialSubtext="A strong password keeps your personal orders, saved addresses, and local store udhari records safe."
      onChangeScreen={onChangeScreen}
      onReturnToMarketplace={onReturnToMarketplace}
    >
      {isResetComplete ? (
        <div className="space-y-6 py-2 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#218838] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#218838]">
              All Set
            </p>
            <h1 className="auth-display text-2xl font-extrabold text-[#1F2937] tracking-tight">
              Password updated successfully
            </h1>
            <p className="text-sm text-[#6B7280] leading-relaxed max-w-sm mx-auto">
              Your GramBazaar password has been changed. You can now sign in with your new credentials.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => onChangeScreen('LOGIN')}
            >
              Sign In to GramBazaar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3 text-left">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] text-[#218838] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h1 className="auth-display text-2xl sm:text-[1.75rem] font-extrabold text-[#1F2937] tracking-tight leading-tight">
                Create a new password
              </h1>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Enter your new password below. Make sure it&apos;s easy for you to remember and hard for others to guess.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <AuthPasswordField
              label="New Password"
              name="resetNewPassword"
              autoComplete="new-password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) {
                  setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }
              }}
              error={errors.newPassword}
              required
            />

            <AuthPasswordField
              label="Confirm New Password"
              name="resetConfirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              error={errors.confirmPassword}
              required
            />

            {/* Clean Unboxed Password Checklist */}
            <ul
              aria-label="Password requirements"
              className="space-y-1.5 pt-1 text-xs"
            >
              {rules.map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 transition-colors ${
                    rule.met ? 'text-[#16A34A] font-medium' : 'text-[#6B7280]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      rule.met
                        ? 'bg-[#E8F5E9] text-[#16A34A]'
                        : 'bg-[#F1F5F9] text-[#9CA3AF]'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                  <span>{rule.label}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Reset Password
              </Button>
            </div>
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

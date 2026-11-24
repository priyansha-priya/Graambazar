import React, { FormEvent, useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

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

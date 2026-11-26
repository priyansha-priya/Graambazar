import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthLayout } from './components/AuthLayout';
import { PhoneOtpForm } from './components/PhoneOtpForm';
import { AuthScreenType } from './types';

export interface VerifyPhoneScreenProps {
  onChangeScreen: (screen: AuthScreenType) => void;
  onReturnToMarketplace: () => void;
  onAuthComplete: (message: string) => void;
}

/**
 * Shown after email or Google sign-in when the account has no verified mobile number yet.
 * Orders and other account features need one, so the API refuses them until this is done.
 */
export const VerifyPhoneScreen: React.FC<VerifyPhoneScreenProps> = ({
  onChangeScreen,
  onReturnToMarketplace,
  onAuthComplete,
}) => {
  const { authUser, signOutUser } = useAuth();

  return (
    <AuthLayout
      activeScreen="VERIFY_PHONE"
      visualVariant="marketplace"
      editorialEyebrow="Village Food & Grocery Marketplace"
      editorialHeading="Shops reach you on your mobile."
      editorialSubtext="Your number is used for order updates and delivery calls from your village stores."
      onChangeScreen={onChangeScreen}
      onReturnToMarketplace={onReturnToMarketplace}
    >
      <div className="space-y-6">
        <div className="space-y-2 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#218838]">
            One last step
          </p>
          <h1 className="auth-display text-2xl sm:text-[1.75rem] font-extrabold text-[#1F2937] tracking-tight leading-tight">
            Verify your mobile number
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            {authUser?.email ? (
              <>
                Signed in as <span className="font-semibold text-[#1F2937]">{authUser.email}</span>.{' '}
              </>
            ) : null}
            Add your mobile number to place orders and manage your account.
          </p>
        </div>

        <PhoneOtpForm
          verifyLabel="Verify Mobile Number"
          onVerified={() => onAuthComplete('Mobile number verified. Welcome to GramBazaar!')}
        />

        <div className="pt-5 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onReturnToMarketplace}
            className="font-semibold text-[#6B7280] hover:text-[#1F2937] cursor-pointer"
          >
            Do this later
          </button>
          <button
            type="button"
            onClick={() => {
              void signOutUser();
              onChangeScreen('LOGIN');
            }}
            className="font-semibold text-[#218838] hover:underline cursor-pointer"
          >
            Use a different account
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

import React from 'react';
import { LoginScreen } from './LoginScreen';
import { SignUpScreen } from './SignUpScreen';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';
import { VerifyPhoneScreen } from './VerifyPhoneScreen';
import { AuthScreenType } from './types';

export interface AuthExperienceProps {
  activeScreen: AuthScreenType;
  onChangeScreen: (screen: AuthScreenType) => void;
  onReturnToMarketplace: () => void;
  onAuthComplete: (message: string) => void;
}

export const AuthExperience: React.FC<AuthExperienceProps> = ({
  activeScreen,
  onChangeScreen,
  onReturnToMarketplace,
  onAuthComplete,
}) => {
  switch (activeScreen) {
    case 'SIGNUP':
      return (
        <SignUpScreen
          onChangeScreen={onChangeScreen}
          onReturnToMarketplace={onReturnToMarketplace}
          onAuthComplete={onAuthComplete}
        />
      );
    case 'FORGOT_PASSWORD':
      return (
        <ForgotPasswordScreen
          onChangeScreen={onChangeScreen}
          onReturnToMarketplace={onReturnToMarketplace}
        />
      );
    case 'VERIFY_PHONE':
      return (
        <VerifyPhoneScreen
          onChangeScreen={onChangeScreen}
          onReturnToMarketplace={onReturnToMarketplace}
          onAuthComplete={onAuthComplete}
        />
      );
    case 'RESET_PASSWORD':
      return (
        <ResetPasswordScreen
          onChangeScreen={onChangeScreen}
          onReturnToMarketplace={onReturnToMarketplace}
        />
      );
    case 'LOGIN':
    default:
      return (
        <LoginScreen
          onChangeScreen={onChangeScreen}
          onReturnToMarketplace={onReturnToMarketplace}
          onAuthComplete={onAuthComplete}
        />
      );
  }
};

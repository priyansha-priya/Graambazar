import { createAuthClient } from 'better-auth/react';
import { phoneNumberClient } from 'better-auth/client/plugins';

/**
 * Better Auth client. The backend serves auth under /api/auth on the same origin (the Vite
 * dev server proxies /api to it), so no base URL is needed; the session lives in a cookie.
 */
export const authClient = createAuthClient({
  plugins: [phoneNumberClient()],
});

/** "98765 43210" / "+91 98765 43210" -> "+919876543210"; null if not an Indian mobile. */
export function toIndianE164(input: string): string | null {
  const digits = input.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

/** Turns a Better Auth error into a message for the user. */
export function authErrorMessage(
  error: { message?: string; code?: string } | null | undefined,
  fallback: string
): string {
  if (!error) return fallback;
  switch (error.code) {
    case 'INVALID_OTP':
      return 'That code is not correct. Please check the SMS and try again.';
    case 'OTP_EXPIRED':
      return 'This code has expired. Please request a new one.';
    case 'TOO_MANY_ATTEMPTS':
      return 'Too many attempts. Please request a new code.';
    case 'INVALID_PHONE_NUMBER':
      return 'Please enter a valid 10-digit Indian mobile number.';
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'Email or password is incorrect.';
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'An account with this email already exists. Please sign in instead.';
    case 'PROVIDER_NOT_FOUND':
      return 'Google sign-in is not set up yet. Please use your mobile number or email.';
    case 'PASSWORD_TOO_SHORT':
      return 'Password must be at least 8 characters.';
    default:
      return error.message || fallback;
  }
}

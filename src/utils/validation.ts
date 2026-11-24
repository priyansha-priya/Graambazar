/**
 * Form Validation Helpers
 */

export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function isValidLandmark(landmark: string): boolean {
  const trimmed = landmark.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
}

export function isValidOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp.trim());
}

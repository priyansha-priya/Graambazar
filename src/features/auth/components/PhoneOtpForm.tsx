import React, { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, KeyRound, Smartphone } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../contexts/AuthContext';
import { toIndianE164 } from '../../../lib/authClient';

const RESEND_SECONDS = 30;

export interface PhoneOtpFormProps {
  /** Pre-filled mobile number (e.g. from the sign-up form). */
  initialMobile?: string;
  /** Skip straight to the code step for `initialMobile` (code is sent on mount). */
  sendOnMount?: boolean;
  verifyLabel?: string;
  onVerified: () => void;
}

/**
 * Two steps: enter a mobile number and get an SMS code, then enter the code.
 * Signed out this signs in (creating the account on first use); signed in it adds the
 * verified number to the current account.
 */
export const PhoneOtpForm: React.FC<PhoneOtpFormProps> = ({
  initialMobile = '',
  sendOnMount = false,
  verifyLabel = 'Verify & Continue',
  onVerified,
}) => {
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [mobile, setMobile] = useState(initialMobile);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'MOBILE' | 'CODE'>('MOBILE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const sendCode = async () => {
    setError(undefined);
    if (!toIndianE164(mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setBusy(true);
    try {
      await sendPhoneOtp(mobile);
      setStep('CODE');
      setCode('');
      setResendIn(RESEND_SECONDS);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send the code right now.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (sendOnMount && initialMobile) void sendCode();
    // Send once for the initial number only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (step === 'MOBILE') {
      await sendCode();
      return;
    }
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError('Please enter the code from the SMS.');
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await verifyPhoneOtp(mobile, code);
      onVerified();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to verify the code right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Mobile Number"
        name="mobile"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="e.g. 98765 43210"
        value={mobile}
        disabled={step === 'CODE'}
        onChange={(e) => {
          setMobile(e.target.value);
          setError(undefined);
        }}
        leftIcon={<Smartphone className="w-4 h-4" />}
        error={step === 'MOBILE' ? error : undefined}
        required
      />

      {step === 'CODE' && (
        <>
          <Input
            label="SMS Code"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 8));
              setError(undefined);
            }}
            leftIcon={<KeyRound className="w-4 h-4" />}
            error={error}
            autoFocus
            required
          />
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setStep('MOBILE');
                setError(undefined);
              }}
              className="font-semibold text-[#6B7280] hover:text-[#1F2937] cursor-pointer"
            >
              Change number
            </button>
            <button
              type="button"
              disabled={resendIn > 0 || busy}
              onClick={() => void sendCode()}
              className="font-semibold text-[#218838] hover:underline disabled:text-[#9CA3AF] disabled:no-underline cursor-pointer disabled:cursor-default"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
        </>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={busy}
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        {busy ? 'Please wait...' : step === 'MOBILE' ? 'Send OTP' : verifyLabel}
      </Button>
    </form>
  );
};

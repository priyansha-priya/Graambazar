import React, { InputHTMLAttributes, useId, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export interface AuthPasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  showLeftIcon?: boolean;
}

/**
 * Password field tailored to GramBazaar's centralized Input tokens
 * (h-11, rounded-xl, #E5E7EB border, #218838 focus ring) with an
 * accessible interactive Show/Hide password toggle button.
 */
export const AuthPasswordField: React.FC<AuthPasswordFieldProps> = ({
  label,
  error,
  helperText,
  showLeftIcon = true,
  id,
  className = '',
  disabled,
  required,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const generatedId = useId();
  const inputId = id || props.name || generatedId;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] flex items-center gap-1"
        >
          {label}
          {required && <span className="text-[#DC2626] font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {showLeftIcon && (
          <span
            className="absolute left-3.5 flex items-center pointer-events-none text-[#6B7280]"
            aria-hidden="true"
          >
            <Lock className="w-4 h-4" />
          </span>
        )}

        <input
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          disabled={disabled}
          required={required}
          className={`auth-password-input w-full h-11 pr-12 text-sm text-[#1F2937] bg-white border rounded-xl placeholder-[#9CA3AF] transition-colors outline-none
            ${showLeftIcon ? 'pl-10' : 'pl-3.5'}
            ${
              error
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]'
                : 'border-[#E5E7EB] focus:border-[#218838] focus:ring-1 focus:ring-[#218838]'
            }
            ${disabled ? 'bg-[#F8FAFC] text-[#9CA3AF] cursor-not-allowed' : ''}
            ${className}`}
          {...props}
        />

        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          disabled={disabled}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          aria-controls={inputId}
          title={isVisible ? 'Hide password' : 'Show password'}
          className={`absolute right-1.5 z-10 w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isVisible
              ? 'text-[#218838] bg-[#E8F5E9] hover:bg-[#DCFCE7]'
              : 'text-[#4B5563] hover:text-[#218838] hover:bg-[#F1F5F9]'
          }`}
        >
          {isVisible ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-[#6B7280]">{helperText}</p>
      )}
    </div>
  );
};

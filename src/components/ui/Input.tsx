import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftAddon?: string; // e.g. "+91"
  rightAddon?: string; // e.g. "kg"
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      id,
      className = '',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

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
          {leftAddon && (
            <span className="inline-flex items-center px-3.5 h-11 text-sm font-medium text-[#6B7280] bg-[#F1F5F9] border border-r-0 border-[#E5E7EB] rounded-l-xl select-none">
              {leftAddon}
            </span>
          )}

          {leftIcon && !leftAddon && (
            <span className="absolute left-3.5 flex items-center pointer-events-none text-[#6B7280]">
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full h-11 px-3.5 text-sm text-[#1F2937] bg-white border placeholder-[#9CA3AF] transition-colors
              ${leftAddon ? 'rounded-r-xl' : leftIcon ? 'pl-10 rounded-xl' : 'rounded-xl'}
              ${rightAddon ? 'rounded-r-none' : rightIcon ? 'pr-10' : ''}
              ${
                error
                  ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]'
                  : 'border-[#E5E7EB] focus:border-[#218838] focus:ring-1 focus:ring-[#218838]'
              }
              ${disabled ? 'bg-[#F8FAFC] text-[#9CA3AF] cursor-not-allowed' : ''}
              outline-none ${className}`}
            {...props}
          />

          {rightIcon && !rightAddon && (
            <span className="absolute right-3.5 flex items-center pointer-events-none text-[#6B7280]">
              {rightIcon}
            </span>
          )}

          {rightAddon && (
            <span className="inline-flex items-center px-3.5 h-11 text-sm font-medium text-[#6B7280] bg-[#F1F5F9] border border-l-0 border-[#E5E7EB] rounded-r-xl select-none">
              {rightAddon}
            </span>
          )}
        </div>

        {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[#6B7280]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

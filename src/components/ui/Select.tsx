import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      placeholder = 'Select an option',
      id,
      className = '',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] flex items-center gap-1"
          >
            {label}
            {required && <span className="text-[#DC2626] font-bold">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`w-full h-11 pl-3.5 pr-10 text-sm text-[#1F2937] bg-white border rounded-xl appearance-none transition-colors
              ${
                error
                  ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]'
                  : 'border-[#E5E7EB] focus:border-[#218838] focus:ring-1 focus:ring-[#218838]'
              }
              ${disabled ? 'bg-[#F8FAFC] text-[#9CA3AF] cursor-not-allowed' : 'cursor-pointer'}
              outline-none ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <span className="absolute right-3.5 pointer-events-none text-[#6B7280]">
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>

        {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[#6B7280]">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

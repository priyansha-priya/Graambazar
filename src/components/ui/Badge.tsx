import React, { ReactNode } from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulsing?: boolean;
  className?: string;
  children: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulsing = false,
  className = '',
  children,
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dotColor: string }> = {
    success: {
      bg: 'bg-[#DCFCE7] border border-[#86EFAC]',
      text: 'text-[#166534]',
      dotColor: 'bg-[#16A34A]',
    },
    warning: {
      bg: 'bg-[#FEF3C7] border border-[#FCD34D]',
      text: 'text-[#92400E]',
      dotColor: 'bg-[#D97706]',
    },
    error: {
      bg: 'bg-[#FEE2E2] border border-[#FCA5A5]',
      text: 'text-[#991B1B]',
      dotColor: 'bg-[#DC2626]',
    },
    info: {
      bg: 'bg-[#DBEAFE] border border-[#93C5FD]',
      text: 'text-[#1E40AF]',
      dotColor: 'bg-[#2563EB]',
    },
    neutral: {
      bg: 'bg-[#F1F5F9] border border-[#CBD5E1]',
      text: 'text-[#475569]',
      dotColor: 'bg-[#64748B]',
    },
    primary: {
      bg: 'bg-[#E8F5E9] border border-[#A7F3D0]',
      text: 'text-[#176B2C]',
      dotColor: 'bg-[#218838]',
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
  };

  const current = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full select-none ${sizeStyles[size]} ${current.bg} ${current.text} ${className}`}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulsing && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dotColor}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${current.dotColor}`}
          />
        </span>
      )}
      {children}
    </span>
  );
};

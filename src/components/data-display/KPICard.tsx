import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  helperText?: string;
  badgeText?: string;
  iconBgClass?: string;
  className?: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
  actionLabel?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  trend,
  helperText,
  badgeText,
  iconBgClass = 'bg-[#E8F5E9] text-[#218838]',
  className = '',
  size = 'md',
  onClick,
  actionLabel,
}) => {
  const isCompact = size === 'sm';
  const baseClasses = `w-full h-full text-left bg-white rounded-xl border border-[#E5E7EB] shadow-xs transition-all flex flex-col justify-between ${
    isCompact ? 'p-4' : 'p-5'
  } ${
    onClick
      ? 'group cursor-pointer hover:border-[#218838]/60 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#218838] focus-visible:ring-offset-1'
      : 'hover:shadow-sm'
  } ${className}`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-2.5">
        <p
          className={`font-semibold uppercase tracking-wider text-[#6B7280] leading-snug ${
            isCompact ? 'text-[11px]' : 'text-xs'
          }`}
        >
          {title}
        </p>
        <div
          className={`${
            isCompact ? 'w-9 h-9 rounded-lg' : 'w-10 h-10 rounded-xl'
          } flex items-center justify-center shrink-0 ${iconBgClass}`}
        >
          {icon}
        </div>
      </div>

      <div className={isCompact ? 'mt-2.5' : 'mt-3'}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className={`${
                isCompact ? 'text-xl' : 'text-2xl'
              } font-bold tracking-tight text-[#1F2937] tabular-nums truncate`}
            >
              {value}
            </span>
            {badgeText && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] shrink-0">
                {badgeText}
              </span>
            )}
          </div>
          {onClick && (
            <ArrowUpRight className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#218838] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2 min-w-0">
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold shrink-0 ${
                  trend.isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {trend.value}
              </span>
            )}
            {helperText && (
              <span
                className={`${
                  isCompact ? 'text-[11px]' : 'text-xs'
                } text-[#6B7280] truncate`}
              >
                {helperText}
              </span>
            )}
          </div>
          {onClick && actionLabel && (
            <span className="text-[10px] font-semibold text-[#218838] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {actionLabel}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClasses}>
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
};

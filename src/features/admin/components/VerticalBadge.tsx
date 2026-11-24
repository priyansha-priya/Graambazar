/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

const VERTICAL_STYLES: Record<string, string> = {
  FOOD: 'bg-amber-50 text-amber-800 border-amber-200',
  GROCERY: 'bg-[#E8F5E9] text-[#176B2C] border-emerald-200',
  AGRICULTURE: 'bg-lime-50 text-lime-800 border-lime-200',
  HARDWARE: 'bg-blue-50 text-blue-800 border-blue-200',
  ELECTRONICS: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  APPAREL: 'bg-purple-50 text-purple-800 border-purple-200',
  FURNITURE: 'bg-teal-50 text-teal-800 border-teal-200',
  ALL: 'bg-slate-100 text-slate-700 border-slate-300',
};

export interface VerticalBadgeProps {
  vertical: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const VerticalBadge: React.FC<VerticalBadgeProps> = ({
  vertical,
  size = 'sm',
  className = '',
}) => {
  const key = vertical.toUpperCase();
  const style =
    VERTICAL_STYLES[key] || 'bg-slate-100 text-slate-700 border-slate-200';
  const sizeClass =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 font-bold'
      : 'text-xs px-2.5 py-1 font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-full border uppercase tracking-wide select-none whitespace-nowrap ${style} ${sizeClass} ${className}`}
    >
      {vertical.replace(/_/g, ' ')}
    </span>
  );
};

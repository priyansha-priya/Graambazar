import React, { ReactNode } from 'react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-[#E5E7EB] ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-2xl bg-[#E8F5E9] text-[#218838]">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-[#1F2937]">{title}</h4>
      <p className="text-sm text-[#6B7280] max-w-sm mt-1.5 mb-5">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

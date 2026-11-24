/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export interface MasterPageShellProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  totalCount: number;
  activeCount: number;
  addButtonLabel: string;
  onAddNew?: () => void;
  canManage: boolean;
  feedback?: string | null;
  children: React.ReactNode;
}

export const MasterPageShell: React.FC<MasterPageShellProps> = ({
  icon,
  title,
  subtitle,
  totalCount,
  activeCount,
  addButtonLabel,
  onAddNew,
  canManage,
  feedback,
  children,
}) => {
  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Consistent Master Page Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] text-[#218838] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-[#1F2937]">{title}</h1>
              <Badge variant="primary" size="sm">
                {activeCount} Active / {totalCount} Total
              </Badge>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">{subtitle}</p>
          </div>
        </div>

        {canManage && onAddNew && (
          <div className="shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={onAddNew}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {addButtonLabel}
            </Button>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Content (Unified MasterDataTable) */}
      {children}
    </div>
  );
};

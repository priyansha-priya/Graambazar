import React from 'react';
import { LogOut, MapPin } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { AuthAccountSummary } from '../types';

export interface LogoutConfirmModalProps {
  isOpen: boolean;
  account: AuthAccountSummary;
  onCancel: () => void;
  onConfirmLogout: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  account,
  onCancel,
  onConfirmLogout,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Sign out of GramBazaar?"
      description="You can sign back in anytime with your mobile number or email."
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onCancel}>
            Stay Signed In
          </Button>
          <Button
            variant="destructive"
            size="md"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={onConfirmLogout}
          >
            Sign Out
          </Button>
        </>
      }
    >
      <div className="auth-surface space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-left">
            <p className="text-sm font-semibold text-[#1F2937]">
              Confirm ending your current session
            </p>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Your saved village preferences, local orders, and udhari records remain safely preserved for your next visit.
            </p>
          </div>
        </div>

        {/* Active Account Summary Row */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
          <div className="w-9 h-9 rounded-full bg-[#218838] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {account.initials}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-bold text-[#1F2937] truncate">
              {account.name}
            </p>
            <p className="text-[11px] text-[#6B7280] truncate">
              {account.identifier} &middot; {account.roleLabel}
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7280] shrink-0">
            <MapPin className="w-3 h-3 text-[#218838]" />
            <span>{account.locationLabel}</span>
          </span>
        </div>
      </div>
    </Modal>
  );
};

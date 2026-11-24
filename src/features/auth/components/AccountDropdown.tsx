import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  KeyRound,
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { AuthAccountSummary, AuthScreenType } from '../types';

export interface AccountDropdownProps {
  account: AuthAccountSummary;
  onOpenAuthScreen: (screen: AuthScreenType) => void;
  onRequestLogout: () => void;
}

export const AccountDropdown: React.FC<AccountDropdownProps> = ({
  account,
  onOpenAuthScreen,
  onRequestLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const avatarTone =
    account.portal === 'ADMIN'
      ? 'bg-indigo-950 text-white'
      : account.portal === 'SELLER'
      ? 'bg-slate-900 text-white'
      : 'bg-[#218838] text-white';

  const handleNavigate = (screen: AuthScreenType) => {
    setIsOpen(false);
    onOpenAuthScreen(screen);
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onRequestLogout();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Account Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open account menu"
        className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border transition-all cursor-pointer ${
          isOpen
            ? 'bg-[#F8FAFC] border-[#218838] ring-2 ring-[#E8F5E9]'
            : 'bg-white border-[#E5E7EB] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'
        }`}
      >
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold tracking-tight shrink-0 ${avatarTone}`}
        >
          {account.initials}
        </span>

        <span className="hidden xl:flex flex-col items-start text-left leading-tight max-w-[110px]">
          <span className="text-xs font-semibold text-[#1F2937] truncate w-full">
            {account.name}
          </span>
          <span className="text-[10px] text-[#6B7280] truncate w-full">
            {account.roleLabel}
          </span>
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#218838]' : ''
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Account options"
          className="auth-surface absolute right-0 mt-2 w-72 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in"
        >
          {/* User Identity Header */}
          <div className="px-4 py-3.5 bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarTone}`}
              >
                {account.initials}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-bold text-[#1F2937] truncate">
                  {account.name}
                </p>
                <p className="text-xs text-[#6B7280] truncate">
                  {account.identifier}
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <span className="font-semibold text-[#176B2C]">
                {account.roleLabel}
              </span>
              <span aria-hidden="true">&middot;</span>
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-[#218838] shrink-0" />
                <span className="truncate">{account.locationLabel}</span>
              </span>
            </div>
          </div>

          {/* Auth Screen Navigation Items */}
          <div className="p-1.5">
            <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] text-left">
              Account &amp; Security Screens
            </p>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleNavigate('LOGIN')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-[#1F2937] hover:bg-[#F8FAFC] hover:text-[#218838] transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#6B7280]" />
              <span>Sign In Page</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleNavigate('SIGNUP')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-[#1F2937] hover:bg-[#F8FAFC] hover:text-[#218838] transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#6B7280]" />
              <span>Create Account (Sign Up)</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleNavigate('FORGOT_PASSWORD')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-[#1F2937] hover:bg-[#F8FAFC] hover:text-[#218838] transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-[#6B7280]" />
              <span>Forgot Password</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleNavigate('RESET_PASSWORD')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium text-[#1F2937] hover:bg-[#F8FAFC] hover:text-[#218838] transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#6B7280]" />
              <span>Reset Password</span>
            </button>
          </div>

          {/* Logout Action */}
          <div className="p-1.5 border-t border-[#E5E7EB]">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#DC2626]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

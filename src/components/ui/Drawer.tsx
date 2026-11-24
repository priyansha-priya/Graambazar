import React, { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { lockBodyScroll } from '../../utils/scrollLock';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-md',
}) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const unlockScroll = lockBodyScroll();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unlockScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const drawerMarkup = (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full h-full flex pl-6 sm:pl-10 pointer-events-none">
        <div
          className={`pointer-events-auto w-screen ${width} h-full max-h-[100dvh] bg-white shadow-2xl flex flex-col overflow-hidden border-l border-[#E5E7EB]`}
        >
          {/* Drawer Header */}
          <div className="shrink-0 px-5 sm:px-6 py-4 sm:py-5 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between gap-3">
            <div className="min-w-0 text-left">
              <h3 className="text-base sm:text-lg font-bold text-[#1F2937] truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs text-[#6B7280] mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#E2E8F0] rounded-full transition-colors cursor-pointer shrink-0"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Drawer Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain modal-scroll p-5 sm:p-6">
            {children}
          </div>

          {/* Drawer Footer */}
          {footer && (
            <div className="shrink-0 p-4 sm:p-5 border-t border-[#E5E7EB] bg-[#F8FAFC] flex flex-wrap items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return drawerMarkup;
  return createPortal(drawerMarkup, document.body);
};

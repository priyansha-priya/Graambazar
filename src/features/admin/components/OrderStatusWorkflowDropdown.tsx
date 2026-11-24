/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ShieldAlert } from 'lucide-react';
import { OrderStatus } from '../../../types/order';
import {
  ORDER_STATUS_META,
  WORKFLOW_STATUS_OPTIONS,
  WorkflowStatusKey,
  mapOrderStatusToWorkflowKey,
} from './orderManagementHelpers';

/* ============================================================================
 * 1. INLINE ORDER ROW STATUS WORKFLOW DROPDOWN (Updates an order's status)
 * ========================================================================== */

export interface OrderStatusWorkflowDropdownProps {
  currentStatus: OrderStatus;
  fulfilmentMode: 'DELIVERY' | 'PICKUP';
  disabled?: boolean;
  openUpward?: boolean;
  onSelectWorkflowStatus: (nextKey: WorkflowStatusKey) => void;
}

export const OrderStatusWorkflowDropdown: React.FC<OrderStatusWorkflowDropdownProps> = ({
  currentStatus,
  fulfilmentMode,
  disabled = false,
  openUpward = false,
  onSelectWorkflowStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMeta = ORDER_STATUS_META[currentStatus];
  const currentKey = mapOrderStatusToWorkflowKey(currentStatus);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Order status: ${currentMeta.label}. Click to change workflow status`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap ${
          currentMeta.bgClass
        } ${currentMeta.textClass} ${currentMeta.borderClass} ${
          disabled ? 'opacity-80 cursor-default' : `${currentMeta.hoverClass} cursor-pointer shadow-2xs`
        }`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${currentMeta.dotClass}`} />
        <span>{currentMeta.label}</span>
        {!disabled && (
          <ChevronDown
            className={`w-3 h-3 opacity-80 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 sm:right-0 sm:left-auto ${
            openUpward ? 'bottom-full mb-1.5' : 'mt-1.5'
          } w-60 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-1.5 z-50 animate-fade-in`}
        >
          <div className="px-3 py-1.5 border-b border-[#E5E7EB] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Status Workflow
            </span>
            <span className="text-[10px] font-semibold text-[#94A3B8]">
              {fulfilmentMode === 'PICKUP' ? 'Pickup' : 'Delivery'}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1 divide-y divide-[#F1F5F9]">
            {WORKFLOW_STATUS_OPTIONS.map((opt) => {
              const isSelected = currentKey === opt.key && currentStatus !== 'delivery_failed';
              const displayLabel =
                opt.key === 'ready'
                  ? fulfilmentMode === 'PICKUP'
                    ? 'Ready (Pickup)'
                    : 'Ready (Delivery)'
                  : opt.label;

              return (
                <button
                  key={opt.key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setIsOpen(false);
                    if (!isSelected) {
                      onSelectWorkflowStatus(opt.key);
                    }
                  }}
                  className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                    isSelected ? `${opt.bgClass}/60` : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${opt.bgClass} ${opt.textClass} ${opt.borderClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dotClass}`} />
                      {displayLabel}
                    </span>
                    {opt.requiresConfirmation && !isSelected && (
                      <span title="Requires confirmation modal">
                        <ShieldAlert className="w-3 h-3 text-[#94A3B8] shrink-0" />
                      </span>
                    )}
                  </div>

                  {isSelected && <Check className={`w-3.5 h-3.5 shrink-0 ${opt.textClass}`} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 2. FILTER BAR STATUS WORKFLOW DROPDOWN (Filters orders by workflow stage)
 * ========================================================================== */

export interface OrderStatusFilterDropdownProps {
  value: 'ALL' | WorkflowStatusKey;
  counts: Record<string, number>;
  totalCount: number;
  onChange: (next: 'ALL' | WorkflowStatusKey) => void;
}

export const OrderStatusFilterDropdown: React.FC<OrderStatusFilterDropdownProps> = ({
  value,
  counts,
  totalCount,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    value === 'ALL' ? null : WORKFLOW_STATUS_OPTIONS.find((o) => o.key === value) || null;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-9 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
          selectedOption
            ? `${selectedOption.bgClass} ${selectedOption.textClass} ${selectedOption.borderClass}`
            : 'bg-[#F8FAFC] text-[#1F2937] border-[#E5E7EB] hover:border-[#218838]'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <>
              <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOption.dotClass}`} />
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="truncate">All Workflow Statuses</span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 opacity-75 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-1.5 min-w-[230px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl py-1.5 z-40 animate-fade-in"
        >
          <button
            type="button"
            role="option"
            aria-selected={value === 'ALL'}
            onClick={() => {
              onChange('ALL');
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
              value === 'ALL' ? 'bg-[#E8F5E9] text-[#176B2C]' : 'text-[#1F2937] hover:bg-[#F8FAFC]'
            }`}
          >
            <span>All Workflow Statuses</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569]">
              {totalCount}
            </span>
          </button>

          <div className="my-1 border-t border-[#E5E7EB]" />

          <div className="max-h-72 overflow-y-auto">
            {WORKFLOW_STATUS_OPTIONS.map((opt) => {
              const isSelected = value === opt.key;
              const count = counts[opt.key] || 0;
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.key);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected ? `${opt.bgClass}/60` : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${opt.bgClass} ${opt.textClass} ${opt.borderClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dotClass}`} />
                    {opt.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#6B7280]">{count}</span>
                    {isSelected && <Check className={`w-3.5 h-3.5 ${opt.textClass}`} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  IndianRupee,
  Power,
  Boxes,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { formatINR } from '../../../utils/currency';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export interface BulkInventoryTargetItem {
  id: string;
  name: string;
  categoryName: string;
  pricePaise: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export type BulkPriceMode = 'FIXED' | 'INCREASE_PERCENT' | 'DECREASE_PERCENT' | 'ADJUST_RUPEES';
export type BulkStockMode = 'SET_EXACT' | 'ADD_STOCK' | 'DEDUCT_STOCK';
export type BulkAvailabilityAction = 'UNCHANGED' | 'AVAILABLE' | 'SOLD_OUT';

export interface BulkInventoryUpdatePayload {
  applyPrice: boolean;
  priceMode: BulkPriceMode;
  priceValue: number;
  availabilityAction: BulkAvailabilityAction;
  applyStock: boolean;
  stockMode: BulkStockMode;
  stockValue: number;
}

export function computeBulkNextPricePaise(
  currentPricePaise: number,
  mode: BulkPriceMode,
  value: number
): number {
  if (!Number.isFinite(value)) return currentPricePaise;
  switch (mode) {
    case 'FIXED':
      return Math.max(100, Math.round(value * 100));
    case 'INCREASE_PERCENT':
      return Math.max(100, Math.round(currentPricePaise * (1 + value / 100)));
    case 'DECREASE_PERCENT':
      return Math.max(100, Math.round(currentPricePaise * (1 - value / 100)));
    case 'ADJUST_RUPEES':
      return Math.max(100, Math.round(currentPricePaise + value * 100));
  }
}

export function computeBulkNextStock(
  currentStock: number,
  mode: BulkStockMode,
  value: number
): number {
  const safeVal = Number.isFinite(value) ? Math.floor(value) : 0;
  switch (mode) {
    case 'SET_EXACT':
      return Math.max(0, safeVal);
    case 'ADD_STOCK':
      return Math.max(0, currentStock + Math.max(0, safeVal));
    case 'DEDUCT_STOCK':
      return Math.max(0, currentStock - Math.max(0, safeVal));
  }
}

export interface BulkInventoryUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: BulkInventoryTargetItem[];
  onApply: (payload: BulkInventoryUpdatePayload) => void;
}

export const BulkInventoryUpdateModal: React.FC<BulkInventoryUpdateModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  onApply,
}) => {
  const [applyPrice, setApplyPrice] = useState(false);
  const [priceMode, setPriceMode] = useState<BulkPriceMode>('INCREASE_PERCENT');
  const [priceValueStr, setPriceValueStr] = useState('5');

  const [availabilityAction, setAvailabilityAction] =
    useState<BulkAvailabilityAction>('UNCHANGED');

  const [applyStock, setApplyStock] = useState(true);
  const [stockMode, setStockMode] = useState<BulkStockMode>('ADD_STOCK');
  const [stockValueStr, setStockValueStr] = useState('10');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setApplyPrice(false);
    setPriceMode('INCREASE_PERCENT');
    setPriceValueStr('5');
    setAvailabilityAction('UNCHANGED');
    setApplyStock(true);
    setStockMode('ADD_STOCK');
    setStockValueStr('10');
  }, [isOpen]);

  const priceNum = Number(priceValueStr);
  const stockNum = Number(stockValueStr);

  const hasAnyChange =
    applyPrice || availabilityAction !== 'UNCHANGED' || applyStock;

  const previewRows = useMemo(() => {
    return selectedItems.slice(0, 5).map((item) => {
      const nextPricePaise = applyPrice
        ? computeBulkNextPricePaise(item.pricePaise, priceMode, priceNum)
        : item.pricePaise;
      const nextStock = applyStock
        ? computeBulkNextStock(item.stockQuantity, stockMode, stockNum)
        : item.stockQuantity;
      const nextAvailable =
        availabilityAction === 'UNCHANGED'
          ? item.isAvailable
          : availabilityAction === 'AVAILABLE';

      return {
        ...item,
        nextPricePaise,
        nextStock,
        nextAvailable,
      };
    });
  }, [
    selectedItems,
    applyPrice,
    priceMode,
    priceNum,
    applyStock,
    stockMode,
    stockNum,
    availabilityAction,
  ]);

  const handleConfirm = () => {
    if (!hasAnyChange) {
      setErrorMsg('Enable at least one change (Price, Availability, or Stock) to apply.');
      return;
    }
    if (applyPrice) {
      if (!Number.isFinite(priceNum)) {
        setErrorMsg('Please enter a valid numeric value for Price.');
        return;
      }
      if (priceMode === 'FIXED' && priceNum <= 0) {
        setErrorMsg('Fixed selling price must be greater than ₹0.');
        return;
      }
      if (priceMode === 'DECREASE_PERCENT' && (priceNum < 0 || priceNum >= 100)) {
        setErrorMsg('Percentage decrease must be between 0% and 99%.');
        return;
      }
    }
    if (applyStock && (!Number.isFinite(stockNum) || stockNum < 0)) {
      setErrorMsg('Stock value must be 0 or greater.');
      return;
    }

    onApply({
      applyPrice,
      priceMode,
      priceValue: priceNum,
      availabilityAction,
      applyStock,
      stockMode,
      stockValue: stockNum,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Update Inventory (${selectedItems.length} Selected)`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <p className="text-[11px] text-[#6B7280] tabular-nums">
            Changes will apply simultaneously to all {selectedItems.length} selected items.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              disabled={!hasAnyChange}
              onClick={handleConfirm}
            >
              Apply to {selectedItems.length} Items
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-left">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-semibold text-[#B91C1C] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. BULK PRICE UPDATE */}
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-3">
          <label className="flex items-center justify-between gap-2 cursor-pointer">
            <span className="flex items-center gap-2 text-xs font-bold text-[#1F2937]">
              <IndianRupee className="w-4 h-4 text-[#218838]" />
              <span>Update Selling Price</span>
            </span>
            <input
              type="checkbox"
              checked={applyPrice}
              onChange={(e) => {
                setApplyPrice(e.target.checked);
                setErrorMsg(null);
              }}
              className="w-4 h-4 accent-[#218838] cursor-pointer"
            />
          </label>

          {applyPrice && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9]">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Price Adjustment Mode
                </label>
                <select
                  value={priceMode}
                  onChange={(e) => setPriceMode(e.target.value as BulkPriceMode)}
                  className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
                >
                  <option value="INCREASE_PERCENT">Increase by %</option>
                  <option value="DECREASE_PERCENT">Decrease by %</option>
                  <option value="ADJUST_RUPEES">Add / Subtract Fixed ₹ (use - for discount)</option>
                  <option value="FIXED">Set Exact Fixed Price (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  {priceMode === 'FIXED'
                    ? 'New Price (₹)'
                    : priceMode === 'ADJUST_RUPEES'
                    ? 'Amount Change (±₹)'
                    : 'Percentage (%)'}
                </label>
                <input
                  type="number"
                  value={priceValueStr}
                  onChange={(e) => setPriceValueStr(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#1F2937] outline-none focus:border-[#218838] tabular-nums"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. BULK AVAILABILITY STATUS */}
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1F2937]">
            <Power className="w-4 h-4 text-[#218838]" />
            <span>Availability Status</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: 'UNCHANGED', label: 'Keep Unchanged' },
                { key: 'AVAILABLE', label: 'Mark Available' },
                { key: 'SOLD_OUT', label: 'Mark Sold Out' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setAvailabilityAction(opt.key);
                  setErrorMsg(null);
                }}
                className={`h-9 px-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  availabilityAction === opt.key
                    ? opt.key === 'SOLD_OUT'
                      ? 'bg-[#FEE2E2] border-[#DC2626] text-[#B91C1C]'
                      : opt.key === 'AVAILABLE'
                      ? 'bg-[#E8F5E9] border-[#218838] text-[#176B2C]'
                      : 'bg-[#F1F5F9] border-[#94A3B8] text-[#1F2937]'
                    : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8FAFC]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. BULK STOCK COUNT UPDATE */}
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white space-y-3">
          <label className="flex items-center justify-between gap-2 cursor-pointer">
            <span className="flex items-center gap-2 text-xs font-bold text-[#1F2937]">
              <Boxes className="w-4 h-4 text-[#218838]" />
              <span>Update Stock Quantity</span>
            </span>
            <input
              type="checkbox"
              checked={applyStock}
              onChange={(e) => {
                setApplyStock(e.target.checked);
                setErrorMsg(null);
              }}
              className="w-4 h-4 accent-[#218838] cursor-pointer"
            />
          </label>

          {applyStock && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9]">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Stock Operation
                </label>
                <select
                  value={stockMode}
                  onChange={(e) => setStockMode(e.target.value as BulkStockMode)}
                  className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#1F2937] outline-none focus:border-[#218838]"
                >
                  <option value="ADD_STOCK">Add Stock (+ Restock)</option>
                  <option value="SET_EXACT">Set Exact Stock Quantity</option>
                  <option value="DEDUCT_STOCK">Deduct Stock (- Adjust)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">
                  Units
                </label>
                <input
                  type="number"
                  min={0}
                  value={stockValueStr}
                  onChange={(e) => setStockValueStr(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#1F2937] outline-none focus:border-[#218838] tabular-nums"
                />
              </div>
            </div>
          )}
        </div>

        {/* LIVE BEFORE -> AFTER PREVIEW */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
            <span className="font-bold uppercase tracking-wider">Live Update Preview</span>
            <span>
              Showing {previewRows.length} of {selectedItems.length} selected items
            </span>
          </div>

          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead className="bg-[#F8FAFC] text-[#6B7280] border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3 text-right">Price</th>
                  <th className="py-2 px-3 text-right">Stock</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] bg-white">
                {previewRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 px-3 font-semibold text-[#1F2937] truncate max-w-[180px]">
                      {row.name}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap">
                      {row.nextPricePaise !== row.pricePaise ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-[#9CA3AF] line-through">
                            {formatINR(row.pricePaise)}
                          </span>
                          <ArrowRight className="w-2.5 h-2.5 text-[#6B7280]" />
                          <strong className="text-[#176B2C]">
                            {formatINR(row.nextPricePaise)}
                          </strong>
                        </span>
                      ) : (
                        <span className="text-[#475569]">{formatINR(row.pricePaise)}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap">
                      {row.nextStock !== row.stockQuantity ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-[#9CA3AF]">{row.stockQuantity}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-[#6B7280]" />
                          <strong className="text-[#176B2C]">{row.nextStock}</strong>
                        </span>
                      ) : (
                        <span className="text-[#475569]">{row.stockQuantity}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          row.nextAvailable ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {row.nextAvailable ? 'Available' : 'Sold Out'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { formatINR } from '../../../utils/currency';
import { LocalUnitDefinition } from '../../../types/product';
import { Button } from '../../../components/ui/Button';
import { Info, Plus, Minus } from 'lucide-react';

export interface QuantityOption {
  label: string;
  quantityValue: number;
  unit: string;
  pricePaise: number;
}

export interface QuantitySelectorProps {
  basePricePaise: number; // e.g. 6000 for ₹60.00 / kg
  unitBasis: string; // e.g. "kg", "plate", "piece"
  quantityMode: 'FIXED_PACK' | 'PREDEFINED_OPTIONS' | 'CUSTOM_QUANTITY';
  predefinedOptions?: QuantityOption[];
  sellerLocalUnit?: LocalUnitDefinition; // e.g. pav
  minQuantity?: number;
  quantityStep?: number;
  onConfirmSelection: (result: {
    quantity: number;
    unitLabel: string;
    calculatedPricePaise: number;
    customerNote?: string;
  }) => void;
  className?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  basePricePaise,
  unitBasis,
  quantityMode,
  predefinedOptions,
  sellerLocalUnit,
  minQuantity = 0.25,
  quantityStep = 0.25,
  onConfirmSelection,
  className = '',
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(
    predefinedOptions && predefinedOptions.length > 0
      ? predefinedOptions[0].label
      : sellerLocalUnit
      ? sellerLocalUnit.label
      : '1 kg'
  );

  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customQty, setCustomQty] = useState<number>(minQuantity);
  const [customUnit, setCustomUnit] = useState<string>(unitBasis);
  const [customerNote, setCustomerNote] = useState<string>('');
  const [estimatedPricePaise, setEstimatedPricePaise] = useState<number>(basePricePaise);

  // Recalculate price whenever selection changes
  useEffect(() => {
    if (isCustomMode) {
      let multiplier = customQty;
      if (customUnit === 'g' || customUnit === 'gram') {
        multiplier = customQty / 1000;
      }
      const calculated = Math.round(basePricePaise * multiplier);
      setEstimatedPricePaise(calculated);
    } else {
      if (predefinedOptions) {
        const found = predefinedOptions.find((o) => o.label === selectedOption);
        if (found) {
          setEstimatedPricePaise(found.pricePaise);
          return;
        }
      }
      if (sellerLocalUnit && selectedOption === sellerLocalUnit.label) {
        const multiplier = sellerLocalUnit.conversionGrams / 1000;
        setEstimatedPricePaise(Math.round(basePricePaise * multiplier));
        return;
      }
      setEstimatedPricePaise(basePricePaise);
    }
  }, [selectedOption, isCustomMode, customQty, customUnit, basePricePaise, predefinedOptions, sellerLocalUnit]);

  const handleCustomStep = (delta: number) => {
    const next = Math.max(minQuantity, Math.round((customQty + delta) * 100) / 100);
    setCustomQty(next);
  };

  const handleConfirm = () => {
    let finalLabel = selectedOption;
    let finalQty = 1;

    if (isCustomMode) {
      finalLabel = `${customQty} ${customUnit}`;
      finalQty = customQty;
    } else if (predefinedOptions) {
      const found = predefinedOptions.find((o) => o.label === selectedOption);
      if (found) finalQty = found.quantityValue;
    } else if (sellerLocalUnit && selectedOption === sellerLocalUnit.label) {
      finalLabel = `1 ${sellerLocalUnit.label} (${sellerLocalUnit.conversionGrams}g)`;
      finalQty = sellerLocalUnit.conversionGrams / 1000;
    }

    onConfirmSelection({
      quantity: finalQty,
      unitLabel: finalLabel,
      calculatedPricePaise: estimatedPricePaise,
      customerNote: customerNote.trim() || undefined,
    });
  };

  return (
    <div className={`flex flex-col gap-4 text-left ${className}`}>
      {/* Price basis headline */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div>
          <span className="text-xs uppercase font-semibold text-[#6B7280]">Price Basis</span>
          <p className="text-base font-bold text-[#1F2937]">
            {formatINR(basePricePaise)} / {unitBasis}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase font-semibold text-[#6B7280]">Estimated Total</span>
          <p className="text-lg font-bold text-[#218838]">
            {formatINR(estimatedPricePaise)}
          </p>
        </div>
      </div>

      {/* Predefined Chips & Local Unit Chips */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block mb-2">
          Choose Quantity / Pack Size
        </label>
        <div className="flex flex-wrap gap-2">
          {predefinedOptions?.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                setIsCustomMode(false);
                setSelectedOption(opt.label);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !isCustomMode && selectedOption === opt.label
                  ? 'bg-[#E8F5E9] text-[#176B2C] border-[#218838] shadow-xs ring-1 ring-[#218838]'
                  : 'bg-white text-[#1F2937] border-[#E5E7EB] hover:bg-[#F8FAFC]'
              }`}
            >
              {opt.label} • {formatINR(opt.pricePaise)}
            </button>
          ))}

          {/* Seller-defined Local Unit (Pav) */}
          {sellerLocalUnit && (
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(false);
                setSelectedOption(sellerLocalUnit.label);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                !isCustomMode && selectedOption === sellerLocalUnit.label
                  ? 'bg-[#E8F5E9] text-[#176B2C] border-[#218838] shadow-xs ring-1 ring-[#218838]'
                  : 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D] hover:bg-[#FDE68A]'
              }`}
            >
              <span>1 {sellerLocalUnit.label}</span>
              <span className="text-[10px] font-normal text-[#92400E]">
                ({sellerLocalUnit.conversionGrams}g)
              </span>
            </button>
          )}

          {/* Custom Quantity Mode Trigger */}
          {quantityMode === 'CUSTOM_QUANTITY' && (
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isCustomMode
                  ? 'bg-[#E8F5E9] text-[#176B2C] border-[#218838] shadow-xs ring-1 ring-[#218838]'
                  : 'bg-white text-[#1F2937] border-dashed border-[#CBD5E1] hover:bg-[#F8FAFC]'
              }`}
            >
              + Custom Quantity
            </button>
          )}
        </div>

        {/* Local unit explanatory banner */}
        {sellerLocalUnit && !isCustomMode && selectedOption === sellerLocalUnit.label && (
          <div className="flex items-center gap-2 mt-2.5 p-2.5 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl text-xs text-[#92400E]">
            <Info className="w-4 h-4 shrink-0 text-[#D97706]" />
            <span>
              <strong>Dukandar ki paribhasha:</strong> {sellerLocalUnit.definitionNote}
            </span>
          </div>
        )}
      </div>

      {/* Custom Quantity Stepper & Input */}
      {isCustomMode && (
        <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1F2937]">Enter Quantity</span>
            <span className="text-xs text-[#6B7280]">
              Step size: {quantityStep} {customUnit}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-[#E5E7EB] bg-white rounded-xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => handleCustomStep(-quantityStep)}
                className="p-2.5 hover:bg-[#F1F5F9] text-[#1F2937] cursor-pointer"
                disabled={customQty <= minQuantity}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={customQty}
                onChange={(e) => setCustomQty(Math.max(minQuantity, parseFloat(e.target.value) || minQuantity))}
                step={quantityStep}
                min={minQuantity}
                className="w-20 text-center font-bold text-sm text-[#1F2937] outline-none"
              />
              <button
                type="button"
                onClick={() => handleCustomStep(quantityStep)}
                className="p-2.5 hover:bg-[#F1F5F9] text-[#1F2937] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none"
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="g">Gram (g)</option>
              <option value="piece">Piece</option>
            </select>
          </div>
        </div>
      )}

      {/* Special instruction / customer note */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
          Special Note / Khash Hidayat (Optional)
        </label>
        <input
          type="text"
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          placeholder="e.g. Zyada pake huye tamatar mat dena / kam mirchi"
          maxLength={100}
          className="w-full h-10 px-3.5 text-xs text-[#1F2937] bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838] focus:ring-1 focus:ring-[#218838]"
        />
      </div>

      {/* Confirm CTA */}
      <Button
        variant="primary"
        size="md"
        fullWidth
        onClick={handleConfirm}
      >
        Add to Cart • {formatINR(estimatedPricePaise)}
      </Button>
    </div>
  );
};

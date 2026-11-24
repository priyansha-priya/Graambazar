import React, { useState } from 'react';
import { GroceryProduct } from '../../../types/product';
import { formatINR } from '../../../utils/currency';
import { Badge } from '../../../components/ui/Badge';
import { Minus, Plus, Scale, ShoppingBag } from 'lucide-react';

export interface GroceryItemCardProps {
  item: GroceryProduct;
  quantityInCart?: number;
  activeUnitLabel?: string;
  onQuickAdd: (item: GroceryProduct) => void;
  onIncrement?: (item: GroceryProduct) => void;
  onDecrement?: (item: GroceryProduct) => void;
  onSelectQuantity: (item: GroceryProduct) => void;
  className?: string;
}

export const GroceryItemCard: React.FC<GroceryItemCardProps> = ({
  item,
  quantityInCart = 0,
  activeUnitLabel,
  onQuickAdd,
  onIncrement,
  onDecrement,
  onSelectQuantity,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const defaultOption = item.predefinedOptions?.[0];
  const displayPricePaise = defaultOption ? defaultOption.pricePaise : item.pricePaise;
  const displayPackLabel = activeUnitLabel || defaultOption?.label || `1 ${item.unitBasis}`;
  const hasMultiplePacks =
    (item.predefinedOptions && item.predefinedOptions.length > 1) ||
    item.quantityMode === 'CUSTOM_QUANTITY';

  return (
    <div
      className={`w-full px-3 py-3 sm:px-4 sm:py-3.5 bg-white hover:bg-[#F8FAFC] transition-colors flex items-center gap-3 sm:gap-4 text-left ${className}`}
    >
      {/* Square Grocery Product Image */}
      <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-center">
        {item.imageUrl && !imgError ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#DCFCE7] text-[#166534] flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Grocery Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="font-bold text-sm sm:text-[15px] text-[#1F2937] leading-snug truncate max-w-full">
            {item.name}
          </h4>

          {item.sellerLocalUnit && (
            <Badge variant="warning" size="sm">
              1 {item.sellerLocalUnit.label} = {item.sellerLocalUnit.conversionGrams}g
            </Badge>
          )}
        </div>

        {item.description && (
          <p className="text-xs text-[#6B7280] line-clamp-1 sm:line-clamp-2 mt-0.5">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          <span className="text-sm font-extrabold text-[#1F2937] tabular-nums">
            {formatINR(displayPricePaise)}
            <span className="text-[11px] font-normal text-[#6B7280]"> / {displayPackLabel}</span>
          </span>

          {hasMultiplePacks && (
            <button
              type="button"
              onClick={() => onSelectQuantity(item)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#218838] hover:underline cursor-pointer"
            >
              <Scale className="w-3 h-3" />
              {item.predefinedOptions && item.predefinedOptions.length > 1
                ? `${item.predefinedOptions.length} pack sizes`
                : 'Custom weight'}
            </button>
          )}
        </div>
      </div>

      {/* Right Action: ADD Button OR [ -  Qty  + ] Stepper */}
      <div className="shrink-0 flex flex-col items-end justify-center gap-1">
        {quantityInCart > 0 ? (
          <div
            className="inline-flex items-center bg-[#218838] text-white rounded-xl shadow-xs overflow-hidden border border-[#176B2C]"
            aria-label={`Quantity of ${item.name}`}
          >
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.name}`}
              onClick={() => onDecrement?.(item)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-[#176B2C] active:scale-95 transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.75]" />
            </button>

            <span className="min-w-[26px] text-center text-xs sm:text-sm font-extrabold tabular-nums select-none">
              {quantityInCart}
            </span>

            <button
              type="button"
              aria-label={`Increase quantity of ${item.name}`}
              onClick={() => onIncrement?.(item)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-[#176B2C] active:scale-95 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onQuickAdd(item)}
            className="inline-flex items-center justify-center gap-1.5 min-w-[82px] sm:min-w-[92px] h-8 sm:h-9 px-3 rounded-xl bg-white hover:bg-[#E8F5E9] text-[#218838] border border-[#218838] font-extrabold text-xs tracking-wide shadow-2xs transition-colors cursor-pointer"
          >
            <span>ADD</span>
            <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
          </button>
        )}

        {quantityInCart > 0 && (
          <span className="text-[10px] font-semibold text-[#176B2C] tabular-nums">
            {displayPackLabel}
          </span>
        )}
      </div>
    </div>
  );
};

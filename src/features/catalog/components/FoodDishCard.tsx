import React, { useState } from 'react';
import { FoodProduct } from '../../../types/product';
import { formatINR } from '../../../utils/currency';
import { Clock, Minus, Plus, SlidersHorizontal, Utensils } from 'lucide-react';

export interface FoodDishCardProps {
  dish: FoodProduct;
  quantityInCart?: number;
  onQuickAdd: (dish: FoodProduct) => void;
  onIncrement?: (dish: FoodProduct) => void;
  onDecrement?: (dish: FoodProduct) => void;
  onCustomize: (dish: FoodProduct) => void;
  className?: string;
}

export const FoodDishCard: React.FC<FoodDishCardProps> = ({
  dish,
  quantityInCart = 0,
  onQuickAdd,
  onIncrement,
  onDecrement,
  onCustomize,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const hasOptions =
    (dish.portionOptions && dish.portionOptions.length > 0) ||
    (dish.addons && dish.addons.length > 0);

  return (
    <div
      className={`w-full px-3 py-3 sm:px-4 sm:py-3.5 bg-white hover:bg-[#F8FAFC] transition-colors flex items-center gap-3 sm:gap-4 text-left ${className}`}
    >
      {/* Square Dish Thumbnail Image */}
      <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-center">
        {dish.imageUrl && !imgError ? (
          <img
            src={dish.imageUrl}
            alt={dish.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#FEF3C7] text-[#92400E] flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
        )}

        {/* Compact Veg dot badge on image corner */}
        <span
          title={dish.dietType}
          className="absolute top-1.5 left-1.5 w-4 h-4 rounded-xs bg-white/95 border border-[#16A34A] flex items-center justify-center shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
        </span>
      </div>

      {/* Dish Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-sm sm:text-[15px] text-[#1F2937] leading-snug truncate max-w-full">
            {dish.name}
          </h4>
        </div>

        {dish.description && (
          <p className="text-xs text-[#6B7280] line-clamp-1 sm:line-clamp-2 mt-0.5">
            {dish.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          <span className="text-sm font-extrabold text-[#1F2937] tabular-nums">
            {formatINR(dish.pricePaise)}
            <span className="text-[11px] font-normal text-[#6B7280]"> / {dish.unitBasis}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7280]">
            <Clock className="w-3 h-3 text-[#F59E0B]" />
            {dish.preparationTimeMinutes} min
          </span>

          {hasOptions && (
            <button
              type="button"
              onClick={() => onCustomize(dish)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#218838] hover:underline cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              Customise
            </button>
          )}
        </div>
      </div>

      {/* Right Action: ADD Button OR [ -  Qty  + ] Stepper */}
      <div className="shrink-0 flex flex-col items-end justify-center gap-1">
        {quantityInCart > 0 ? (
          <div
            className="inline-flex items-center bg-[#218838] text-white rounded-xl shadow-xs overflow-hidden border border-[#176B2C]"
            aria-label={`Quantity of ${dish.name}`}
          >
            <button
              type="button"
              aria-label={`Decrease quantity of ${dish.name}`}
              onClick={() => onDecrement?.(dish)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-[#176B2C] active:scale-95 transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.75]" />
            </button>

            <span className="min-w-[26px] text-center text-xs sm:text-sm font-extrabold tabular-nums select-none">
              {quantityInCart}
            </span>

            <button
              type="button"
              aria-label={`Increase quantity of ${dish.name}`}
              onClick={() => onIncrement?.(dish)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-[#176B2C] active:scale-95 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onQuickAdd(dish)}
            className="inline-flex items-center justify-center gap-1.5 min-w-[82px] sm:min-w-[92px] h-8 sm:h-9 px-3 rounded-xl bg-white hover:bg-[#E8F5E9] text-[#218838] border border-[#218838] font-extrabold text-xs tracking-wide shadow-2xs transition-colors cursor-pointer"
          >
            <span>ADD</span>
            <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
          </button>
        )}

        {quantityInCart > 0 && (
          <span className="text-[10px] font-semibold text-[#176B2C] tabular-nums">
            {formatINR(dish.pricePaise * quantityInCart)}
          </span>
        )}
      </div>
    </div>
  );
};

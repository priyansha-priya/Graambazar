import React, { useState } from 'react';
import { Seller } from '../../../types/merchant';
import { DeliveryRelationship } from '../../../contexts/VillageContext';
import { useSafety } from '../../../contexts/SafetyContext';
import { formatINR } from '../../../utils/currency';
import {
  Star,
  Clock,
  MapPin,
  Truck,
  ShoppingBag,
  Utensils,
  ChevronRight,
  Store,
  ShieldCheck,
} from 'lucide-react';

export interface StoreCardProps {
  seller: Seller;
  deliveryRelationship: DeliveryRelationship;
  onClick: () => void;
  variant?: 'list' | 'grid';
}

export const StoreCard: React.FC<StoreCardProps> = ({
  seller,
  deliveryRelationship,
  onClick,
  variant = 'list',
}) => {
  const [imgError, setImgError] = useState(false);
  const { getSellerMetrics } = useSafety();
  const safetyMetrics = getSellerMetrics(seller.id);

  const isFood = seller.primaryVertical === 'FOOD';
  const isLocal = deliveryRelationship.coverageType === 'LOCAL';
  const isNeighbor = deliveryRelationship.coverageType === 'NEIGHBOR';
  const isServiceable = deliveryRelationship.isServiceable;

  const etaLabel = isLocal
    ? isFood
      ? '20–30 min'
      : '30–45 min'
    : isNeighbor
    ? isFood
      ? '35–45 min'
      : '45–60 min'
    : 'Pickup / Other Village';

  const coverageBadgeClasses = isLocal
    ? 'bg-[#E8F5E9] text-[#176B2C]'
    : isNeighbor
    ? 'bg-[#DBEAFE] text-[#1E40AF]'
    : 'bg-[#F1F5F9] text-[#475569]';

  const coverageText = isLocal
    ? deliveryRelationship.badgeLabel || `In ${seller.villageName}`
    : isNeighbor
    ? deliveryRelationship.badgeLabel || `From ${seller.villageName}`
    : `${seller.villageName} Village`;

  const renderShopImage = (sizeClass: string) => (
    <div
      className={`relative ${sizeClass} rounded-xl overflow-hidden shrink-0 border border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-center`}
    >
      {seller.bannerUrl && !imgError ? (
        <img
          src={seller.bannerUrl}
          alt={seller.publicName}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center ${
            isFood ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#DCFCE7] text-[#166534]'
          }`}
        >
          {isFood ? (
            <Utensils className="w-5 h-5" />
          ) : (
            <Store className="w-5 h-5" />
          )}
        </div>
      )}

      {/* Compact live open indicator dot */}
      <span
        title={seller.isOpenNow && !seller.isPaused ? 'Open Now' : 'Closed'}
        className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
          seller.isOpenNow && !seller.isPaused ? 'bg-[#16A34A]' : 'bg-[#9CA3AF]'
        }`}
      />
    </div>
  );

  /* ========================================================================
   * COMPACT LIST VIEW (Space-efficient horizontal row)
   * ====================================================================== */
  if (variant === 'list') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className="group w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-center gap-3 sm:gap-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#218838] focus-visible:ring-inset"
      >
        {/* Shop Image Thumbnail */}
        {renderShopImage('w-14 h-14 sm:w-16 sm:h-16')}

        {/* Shop Identity & Quick Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h3 className="font-bold text-sm sm:text-[15px] text-[#1F2937] group-hover:text-[#218838] transition-colors truncate max-w-full">
              {seller.publicName}
            </h3>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                isFood
                  ? 'bg-[#FEF3C7] text-[#92400E]'
                  : 'bg-[#DCFCE7] text-[#166534]'
              }`}
            >
              {isFood ? (
                <Utensils className="w-2.5 h-2.5" />
              ) : (
                <ShoppingBag className="w-2.5 h-2.5" />
              )}
              {seller.sellerType}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${coverageBadgeClasses}`}
            >
              <MapPin className="w-2.5 h-2.5" />
              {coverageText}
            </span>
          </div>

          {seller.description && (
            <p className="text-xs text-[#6B7280] truncate mt-0.5">
              {seller.description}
            </p>
          )}

          {/* Compact inline metadata bar */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-[#6B7280]">
            <span className="inline-flex items-center gap-1 font-bold text-[#1F2937]">
              <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
              {seller.rating}
              <span className="font-normal text-[#6B7280]">({seller.reviewCount})</span>
            </span>

            <span className="inline-flex items-center gap-1 text-[#1F2937] font-medium">
              <Clock className="w-3 h-3 text-[#218838]" />
              {etaLabel}
            </span>

            <span className="hidden sm:inline">
              Min: <strong className="text-[#1F2937]">{formatINR(seller.minimumOrderPaise)}</strong>
            </span>

            {isServiceable ? (
              <span className="inline-flex items-center gap-1 font-semibold text-[#218838]">
                <Truck className="w-3 h-3" />
                {formatINR(deliveryRelationship.deliveryFeePaise)}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-[#D97706]">
                Pickup Only
              </span>
            )}

            {safetyMetrics.isCertified && (
              <span
                className="inline-flex items-center gap-1 font-semibold text-[#176B2C]"
                title={`GramBazaar Certified (${safetyMetrics.overallComplianceScore}% compliance)`}
              >
                <ShieldCheck className="w-3 h-3 text-[#218838]" />
                {safetyMetrics.badgeLabel}
              </span>
            )}
          </div>
        </div>

        {/* Right Action Chevron */}
        <div className="hidden md:flex flex-col items-end shrink-0 gap-1 pl-2">
          <span className="text-[11px] text-[#6B7280] max-w-[150px] truncate">
            {seller.addressLine.split(',')[0]}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#218838] group-hover:translate-x-0.5 transition-transform">
            Open Shop
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#218838] shrink-0 md:hidden" />
      </div>
    );
  }

  /* ========================================================================
   * GRID CARD VIEW (Optional toggle view with shop image)
   * ====================================================================== */
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group bg-white rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
        isLocal
          ? 'border-[#E5E7EB] hover:border-[#218838]'
          : isNeighbor
          ? 'border-blue-200 bg-blue-50/15 hover:border-blue-400'
          : 'border-[#E5E7EB] hover:border-[#9CA3AF]'
      }`}
    >
      <div>
        <div className="flex items-start gap-3 mb-3">
          {renderShopImage('w-16 h-16')}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isFood
                    ? 'bg-[#FEF3C7] text-[#92400E]'
                    : 'bg-[#DCFCE7] text-[#166534]'
                }`}
              >
                {isFood ? (
                  <Utensils className="w-2.5 h-2.5" />
                ) : (
                  <ShoppingBag className="w-2.5 h-2.5" />
                )}
                {seller.sellerType}
              </span>

              <div className="flex items-center gap-1 text-xs font-bold text-[#1F2937] bg-[#F8FAFC] px-1.5 py-0.5 rounded-md border border-[#E5E7EB] shrink-0">
                <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                <span>{seller.rating}</span>
              </div>
            </div>

            <h3 className="font-bold text-sm text-[#1F2937] group-hover:text-[#218838] transition-colors leading-snug line-clamp-1">
              {seller.publicName}
            </h3>

            <span
              className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${coverageBadgeClasses}`}
            >
              <MapPin className="w-2.5 h-2.5" />
              {coverageText}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#6B7280] line-clamp-2 mb-3">
          {seller.description}
        </p>
      </div>

      <div className="pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between gap-2 text-[11px] text-[#6B7280]">
        <span className="flex items-center gap-1 font-medium text-[#1F2937]">
          <Clock className="w-3 h-3 text-[#218838]" />
          {etaLabel}
        </span>

        {isServiceable ? (
          <span className="flex items-center gap-1 font-bold text-[#218838]">
            <Truck className="w-3 h-3" />
            {formatINR(deliveryRelationship.deliveryFeePaise)}
          </span>
        ) : (
          <span className="font-semibold text-[#D97706]">Pickup Only</span>
        )}
      </div>
    </div>
  );
};

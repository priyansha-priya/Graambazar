import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { formatINR } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export interface CartViewProps {
  onBackToShopping: () => void;
  onProceedToCheckout: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  onBackToShopping,
  onProceedToCheckout,
}) => {
  const {
    seller,
    items,
    fulfilmentMode,
    setFulfilmentMode,
    updateQuantity,
    removeItem,
    clearCart,
    itemSubtotalPaise,
    deliveryFeePaise,
    packagingFeePaise,
    platformFeePaise,
    totalPaise,
    isMinimumOrderMet,
    minOrderShortfallPaise,
  } = useCart();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  if (!seller || items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-left">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBackToShopping}
          className="mb-6"
        >
          Continue Shopping
        </Button>
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Aapka Cart Khali Hai"
          description="Aapne abhi tak koi food ya grocery item cart mein add nahi kiya hai. Apne gaon ke dhabe ya kirana se shuru karein."
          actionText="Explore Village Stores"
          onAction={onBackToShopping}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-left animate-fade-in">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBackToShopping}
        >
          Back to Store
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Items List & Fulfillment (8 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Seller Header Banner */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                  Ordering from
                </span>
                <h2 className="text-xl font-bold text-[#1F2937] leading-tight">
                  {seller.publicName}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {seller.villageName} • {seller.addressLine.split(',')[0]}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] flex items-center gap-1 cursor-pointer transition-colors p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            </div>

            {/* Fulfilment Mode Switcher */}
            <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block mb-2">
                Choose Fulfilment Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfilmentMode('DELIVERY')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    fulfilmentMode === 'DELIVERY'
                      ? 'border-[#218838] bg-[#E8F5E9] text-[#176B2C] shadow-xs ring-1 ring-[#218838]'
                      : 'border-[#E5E7EB] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Seller Delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfilmentMode('PICKUP')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    fulfilmentMode === 'PICKUP'
                      ? 'border-[#218838] bg-[#E8F5E9] text-[#176B2C] shadow-xs ring-1 ring-[#218838]'
                      : 'border-[#E5E7EB] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Self Pickup</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cart Line Items */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F2937] mb-4">
              Items in Cart ({items.length})
            </h3>

            <div className="divide-y divide-[#E5E7EB]">
              {items.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1F2937]">
                        {item.productName}
                      </span>
                      <Badge variant={item.catalogueType === 'FOOD' ? 'warning' : 'primary'} size="sm">
                        {item.catalogueType}
                      </Badge>
                    </div>

                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Selected: <strong className="text-[#1F2937]">{item.unitLabel}</strong> •{' '}
                      {formatINR(item.unitPricePaise)} each
                    </p>

                    {item.customerNote && (
                      <p className="text-[11px] text-[#D97706] italic mt-1 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                        Note: "{item.customerNote}"
                      </p>
                    )}
                  </div>

                  {/* Quantity Stepper & Price */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[#E5E7EB] rounded-full bg-[#F8FAFC] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-[#E2E8F0] text-[#1F2937] cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-bold text-xs text-[#1F2937]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-[#E2E8F0] text-[#1F2937] cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-bold text-sm text-[#1F2937] min-w-[70px] text-right">
                      {formatINR(item.lineTotalPaise)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Bill Summary & Action CTA (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Minimum Order Check Card */}
          {!isMinimumOrderMet && (
            <div className="p-4 bg-[#FEF3C7] border border-[#FCD34D] rounded-2xl flex items-start gap-3 text-xs text-[#92400E]">
              <AlertCircle className="w-5 h-5 shrink-0 text-[#D97706] mt-0.5" />
              <div>
                <p className="font-bold">Minimum Order Shortfall</p>
                <p className="mt-0.5">
                  Is dukaan ka minimum order{' '}
                  <strong>{formatINR(seller.minimumOrderPaise)}</strong> hai. Order karne ke liye{' '}
                  <strong>{formatINR(minOrderShortfallPaise)}</strong> ka aur saaman jodiye.
                </p>
              </div>
            </div>
          )}

          {/* Itemized Bill Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F2937]">
              Bill Details
            </h3>

            <div className="space-y-2.5 text-xs text-[#475569] border-b border-[#E5E7EB] pb-4">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-[#1F2937]">{formatINR(itemSubtotalPaise)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>
                  Delivery Charges{' '}
                  {fulfilmentMode === 'PICKUP' && (
                    <span className="text-[10px] text-[#16A34A]">(Pickup Free)</span>
                  )}
                </span>
                <span className="font-semibold text-[#1F2937]">
                  {deliveryFeePaise === 0 ? (
                    <span className="text-[#16A34A] font-bold">FREE</span>
                  ) : (
                    formatINR(deliveryFeePaise)
                  )}
                </span>
              </div>

              {packagingFeePaise > 0 && (
                <div className="flex justify-between">
                  <span>Restaurant Packaging Charge</span>
                  <span className="font-semibold text-[#1F2937]">{formatINR(packagingFeePaise)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Platform Fee</span>
                <span className="text-[#16A34A] font-bold">FREE (Pilot)</span>
              </div>
            </div>

            {/* Total Payable */}
            <div className="flex items-center justify-between text-base font-bold text-[#1F2937]">
              <span>To Pay</span>
              <span className="text-xl font-extrabold text-[#218838]">
                {formatINR(totalPaise)}
              </span>
            </div>

            {/* Rural Trust Badge */}
            <div className="p-2.5 bg-[#F8FAFC] rounded-xl flex items-center gap-2 text-[11px] text-[#6B7280]">
              <ShieldCheck className="w-4 h-4 text-[#218838] shrink-0" />
              <span>Transparent village billing. Cash on delivery accepted.</span>
            </div>

            {/* Checkout CTA */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<ArrowRight className="w-4 h-4" />}
              disabled={!isMinimumOrderMet}
              onClick={onProceedToCheckout}
            >
              {isMinimumOrderMet
                ? `Proceed to Checkout • ${formatINR(totalPaise)}`
                : `Add ${formatINR(minOrderShortfallPaise)} More to Order`}
            </Button>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => {
          clearCart();
          setIsClearModalOpen(false);
        }}
        isDestructive
        title="Cart Khali Karein?"
        message="Kya aap sure hain ki aap cart ke sabhi items hatana chahte hain?"
        confirmText="Yes, Clear Cart"
        cancelText="Cancel"
      />
    </div>
  );
};

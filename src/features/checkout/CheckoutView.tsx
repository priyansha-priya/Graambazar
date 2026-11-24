import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useVillage } from '../../contexts/VillageContext';
import { useOrders } from '../../contexts/OrderContext';
import { useUdhari } from '../../contexts/UdhariContext';
import { CustomerAddress } from '../../types/village';
import { PaymentMethod } from '../../types/order';
import { formatINR } from '../../utils/currency';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Banknote,
  QrCode,
  BookOpen,
  Plus,
  ShieldCheck,
  Store,
  AlertCircle,
} from 'lucide-react';

export interface CheckoutViewProps {
  onBackToCart: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  onBackToCart,
  onOrderSuccess,
}) => {
  const {
    seller,
    items,
    fulfilmentMode,
    itemSubtotalPaise,
    deliveryFeePaise,
    packagingFeePaise,
    totalPaise,
    clearCart,
  } = useCart();

  const { activeVillage, selectedLandmark } = useVillage();
  const { createOrder } = useOrders();
  const { isShopCreditEnabled, getCustomerProfile, postCreditSale } = useUdhari();

  // Saved Addresses for customer
  const [addresses, setAddresses] = useState<CustomerAddress[]>([
    {
      id: 'addr_1',
      userId: 'user_cust_1',
      recipientName: 'Ramesh Patel',
      recipientPhone: '9876543210',
      villageId: activeVillage.id,
      villageName: activeVillage.name,
      addressLine1: 'House No. 18, Purani Basti',
      landmark: selectedLandmark || 'Near Kali Mandir Chowk',
      addressLabel: 'Home',
      isDefault: true,
      createdAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'addr_2',
      userId: 'user_cust_1',
      recipientName: 'Ramesh Patel (Dukaan)',
      recipientPhone: '9876543210',
      villageId: activeVillage.id,
      villageName: activeVillage.name,
      addressLine1: 'Main Market, Shop 4',
      landmark: 'Opposite Panchayat Bhavan',
      addressLabel: 'Work',
      isDefault: false,
      createdAt: '2026-08-15T00:00:00Z',
    },
  ]);

  const [selectedAddressId, setSelectedAddressId] = useState<string>(addresses[0].id);
  const [deliveryNote, setDeliveryNote] = useState<string>('Ghar ke paas aake call karein');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Address Modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('Ramesh Patel');
  const [newRecipientPhone, setNewRecipientPhone] = useState('9876543210');
  const [newAddressLine1, setNewAddressLine1] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newAddressLabel, setNewAddressLabel] = useState<'Home' | 'Work' | 'Other'>('Home');

  if (!seller || items.length === 0) {
    onBackToCart();
    return null;
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  // Dynamic Udhari credit check for this customer at this specific seller
  const creditProfile = getCustomerProfile('user_cust_1', seller.id);
  const isCreditEligible =
    isShopCreditEnabled &&
    creditProfile &&
    creditProfile.status === 'ACTIVE' &&
    creditProfile.availableCreditPaise >= totalPaise;

  const handleAddNewAddress = () => {
    if (!newAddressLine1.trim() || !newLandmark.trim()) {
      alert('Kripya ghar ka pata aur landmark dono bharein.');
      return;
    }

    const created: CustomerAddress = {
      id: `addr_${Date.now()}`,
      userId: 'user_cust_1',
      recipientName: newRecipientName.trim(),
      recipientPhone: newRecipientPhone.trim(),
      villageId: activeVillage.id,
      villageName: activeVillage.name,
      addressLine1: newAddressLine1.trim(),
      landmark: newLandmark.trim(),
      addressLabel: newAddressLabel,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    setAddresses((prev) => [...prev, created]);
    setSelectedAddressId(created.id);
    setIsAddressModalOpen(false);
    setNewAddressLine1('');
    setNewLandmark('');
  };

  const handleConfirmOrder = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      // 1. Create order
      const order = createOrder({
        customerId: 'user_cust_1',
        customerName: selectedAddress.recipientName,
        customerPhone: selectedAddress.recipientPhone,
        sellerId: seller.id,
        sellerName: seller.publicName,
        sellerPhone: seller.contactPhone,
        villageId: activeVillage.id,
        fulfilmentMode,
        deliveryAddress: fulfilmentMode === 'DELIVERY' ? selectedAddress : undefined,
        deliveryNote: deliveryNote.trim() || undefined,
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          catalogueType: i.catalogueType,
          unitPricePaise: i.unitPricePaise,
          requestedQuantity: i.quantity,
          requestedUnitLabel: i.unitLabel,
          lineTotalPaise: i.lineTotalPaise,
          customerNote: i.customerNote,
        })),
        paymentMethod,
        paymentStatus: paymentMethod === 'UDHAR' ? 'pending' : 'pending',
        itemSubtotalPaise,
        deliveryFeePaise,
        packagingFeePaise,
        platformFeePaise: 0,
        totalPaise,
      });

      // 2. If Udhari chosen, atomically post to digital ledger
      if (paymentMethod === 'UDHAR') {
        postCreditSale({
          sellerId: seller.id,
          customerId: 'user_cust_1',
          orderId: order.orderNumber,
          amountPaise: totalPaise,
          dueDays: creditProfile?.dueDays || 15,
        });
      }

      clearCart();
      setIsSubmitting(false);
      onOrderSuccess(order.id);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-left animate-fade-in">
      <div className="mb-4">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBackToCart}
        >
          Back to Cart
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-[#1F2937] mb-1">Rural Village Checkout</h1>
      <p className="text-xs text-[#6B7280] mb-6">
        Order from <strong>{seller.publicName}</strong> • {seller.villageName}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Address, Notes, Payment (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Fulfilment & Address Section */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#218838] text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F2937]">
                  {fulfilmentMode === 'DELIVERY' ? 'Village Delivery Address' : 'Self Pickup Details'}
                </h3>
              </div>

              {fulfilmentMode === 'DELIVERY' && (
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-xs font-semibold text-[#218838] hover:text-[#176B2C] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {fulfilmentMode === 'DELIVERY' ? (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = addr.id === selectedAddressId;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#218838] bg-[#E8F5E9] shadow-xs'
                          : 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1F2937]">
                            {addr.recipientName}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569]">
                            {addr.addressLabel}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#218838]" />
                        )}
                      </div>

                      <p className="text-xs text-[#475569]">{addr.addressLine1}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#176B2C] bg-white/60 p-2 rounded-lg border border-[#A7F3D0]">
                        <MapPin className="w-3.5 h-3.5 text-[#218838] shrink-0" />
                        <span>Landmark: {addr.landmark}</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-1.5">
                        Phone: +91 {addr.recipientPhone} • Village: {addr.villageName}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs space-y-2">
                <p className="font-bold text-[#1F2937] flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[#218838]" />
                  <span>Pickup from Store Counter:</span>
                </p>
                <p className="text-[#475569]">{seller.addressLine}</p>
                <p className="text-[#6B7280]">
                  Order ready hone par counter par jakar apna Order ID batayein. Delivery fee ₹0 lagegi.
                </p>
              </div>
            )}

            {/* Delivery Instructions */}
            {fulfilmentMode === 'DELIVERY' && (
              <div className="pt-3 border-t border-[#E5E7EB]">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
                  Delivery Boy / Runner Note
                </label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="e.g. Purani Basti mandir ke peeche pehla ghar"
                  className="w-full h-10 px-3.5 text-xs text-[#1F2937] bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl outline-none focus:border-[#218838]"
                />
              </div>
            )}
          </div>

          {/* 2. Payment Method Section */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#218838] text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F2937]">
                Payment Method
              </h3>
            </div>

            <div className="space-y-3">
              {/* Cash on Delivery (COD) */}
              <label
                className={`flex items-start justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'COD'
                    ? 'border-[#218838] bg-[#E8F5E9] shadow-xs'
                    : 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 text-[#218838]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-[#16A34A]" />
                      <span className="font-bold text-sm text-[#1F2937]">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Pay cash directly to shop delivery runner when you receive your order.
                    </p>
                  </div>
                </div>
              </label>

              {/* Direct Seller UPI */}
              <label
                className={`flex items-start justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'SELLER_UPI'
                    ? 'border-[#218838] bg-[#E8F5E9] shadow-xs'
                    : 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'SELLER_UPI'}
                    onChange={() => setPaymentMethod('SELLER_UPI')}
                    className="mt-1 text-[#218838]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#2563EB]" />
                      <span className="font-bold text-sm text-[#1F2937]">
                        Direct Seller UPI (Scan QR at delivery)
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Pay directly to seller's UPI account via PhonePe, GPay, or Paytm upon delivery.
                    </p>
                  </div>
                </div>
              </label>

              {/* Udhari (Seller Customer Credit) */}
              <label
                className={`flex items-start justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'UDHAR'
                    ? 'border-[#218838] bg-[#E8F5E9] shadow-xs'
                    : !isCreditEligible
                    ? 'border-[#E5E7EB] bg-[#F8FAFC] opacity-75'
                    : 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment"
                    disabled={!isCreditEligible}
                    checked={paymentMethod === 'UDHAR'}
                    onChange={() => setPaymentMethod('UDHAR')}
                    className="mt-1 text-[#218838]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#D97706]" />
                      <span className="font-bold text-sm text-[#1F2937]">
                        Udhari / Pay Later (Khata)
                      </span>
                      {isCreditEligible ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                          Pre-Approved Limit
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
                          Credit Unavailable
                        </span>
                      )}
                    </div>

                    {creditProfile ? (
                      <p className="text-xs text-[#6B7280] mt-1">
                        Limit: <strong>{formatINR(creditProfile.creditLimitPaise)}</strong> • Available:{' '}
                        <strong className="text-[#16A34A]">{formatINR(creditProfile.availableCreditPaise)}</strong> (Account managed by {seller.publicName}).
                        {!isCreditEligible && creditProfile.availableCreditPaise < totalPaise && (
                          <span className="text-[#DC2626] font-semibold block mt-0.5">
                            Order amount ({formatINR(totalPaise)}) exceeds available credit ({formatINR(creditProfile.availableCreditPaise)}).
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-[#6B7280] mt-1">
                        Credit account not configured by {seller.publicName}. Choose COD or UPI.
                      </p>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Snapshot & Confirmation (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F2937]">
              Order Summary ({items.length} items)
            </h3>

            {/* Items mini list */}
            <div className="max-h-48 overflow-y-auto divide-y divide-[#E5E7EB] text-xs">
              {items.map((i) => (
                <div key={i.id} className="py-2 flex justify-between">
                  <span className="text-[#475569]">
                    {i.productName} ({i.unitLabel}) x {i.quantity}
                  </span>
                  <span className="font-semibold text-[#1F2937]">
                    {formatINR(i.lineTotalPaise)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial breakdown */}
            <div className="pt-3 border-t border-[#E5E7EB] space-y-2 text-xs text-[#6B7280]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#1F2937]">{formatINR(itemSubtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-[#1F2937]">
                  {deliveryFeePaise === 0 ? 'FREE' : formatINR(deliveryFeePaise)}
                </span>
              </div>
              {packagingFeePaise > 0 && (
                <div className="flex justify-between">
                  <span>Packaging Fee</span>
                  <span className="font-semibold text-[#1F2937]">{formatINR(packagingFeePaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#1F2937] pt-2 border-t border-[#E5E7EB]">
                <span>Total Amount</span>
                <span className="text-xl text-[#218838] font-extrabold">{formatINR(totalPaise)}</span>
              </div>
            </div>

            <div className="p-3 bg-[#E8F5E9] rounded-xl flex items-center gap-2 text-xs text-[#166534]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#218838]" />
              <span>100% server-verified pricing and idempotent order protection.</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              onClick={handleConfirmOrder}
            >
              Confirm & Place Order ({formatINR(totalPaise)})
            </Button>
          </div>
        </div>
      </div>

      {/* Add New Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add Village Delivery Address"
        description={`In ${activeVillage.name} (${activeVillage.district})`}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsAddressModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleAddNewAddress}>
              Save Address
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left">
          <Input
            label="Recipient Name"
            required
            value={newRecipientName}
            onChange={(e) => setNewRecipientName(e.target.value)}
          />

          <Input
            label="Contact Mobile"
            required
            leftAddon="+91"
            value={newRecipientPhone}
            onChange={(e) => setNewRecipientPhone(e.target.value)}
          />

          <Input
            label="House / Plot / Tola"
            required
            placeholder="e.g. House No. 24, Purani Basti"
            value={newAddressLine1}
            onChange={(e) => setNewAddressLine1(e.target.value)}
          />

          <Input
            label="Mandatory Landmark"
            required
            leftIcon={<MapPin className="w-4 h-4 text-[#218838]" />}
            placeholder="e.g. Near Kali Mandir / Panchayat Bhavan"
            value={newLandmark}
            onChange={(e) => setNewLandmark(e.target.value)}
            helperText="Delivery runner uses this to reach you without needing GPS"
          />
        </div>
      </Modal>
    </div>
  );
};

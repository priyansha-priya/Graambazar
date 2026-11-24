import React, { useState } from 'react';
import { useUdhari } from '../../contexts/UdhariContext';
import { formatINR } from '../../utils/currency';
import { formatDateTime, formatDate } from '../../utils/dates';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  BookOpen,
  Store,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export interface CustomerUdharViewProps {
  onBackToShopping: () => void;
}

export const CustomerUdharView: React.FC<CustomerUdharViewProps> = ({
  onBackToShopping,
}) => {
  const { getCustomerLedgersGrouped, createDispute } = useUdhari();
  const customerLedgers = getCustomerLedgersGrouped('user_cust_1');

  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    customerLedgers.length > 0 ? customerLedgers[0].sellerId : ''
  );

  // Dispute modal state
  const [disputeEntryId, setDisputeEntryId] = useState<string | null>(null);
  const [disputeReasonCode, setDisputeReasonCode] = useState<
    'WRONG_AMOUNT' | 'PAYMENT_NOT_RECORDED' | 'ORDER_CANCELLED' | 'OTHER'
  >('WRONG_AMOUNT');
  const [disputeDescription, setDisputeDescription] = useState<string>('');

  const activeGroup =
    customerLedgers.find((g) => g.sellerId === selectedSellerId) || customerLedgers[0];

  const totalOutstandingAcrossShops = customerLedgers.reduce(
    (acc, curr) => acc + curr.profile.outstandingBalancePaise,
    0
  );

  const handleOpenDispute = (entryId: string) => {
    setDisputeEntryId(entryId);
    setDisputeDescription('');
  };

  const handleConfirmDispute = () => {
    if (!disputeEntryId || !activeGroup || !disputeDescription.trim()) {
      alert('Kripya vivad ka karan vistrit likhein.');
      return;
    }

    createDispute({
      sellerId: activeGroup.sellerId,
      customerId: 'user_cust_1',
      ledgerEntryId: disputeEntryId,
      reasonCode: disputeReasonCode,
      description: disputeDescription.trim(),
    });

    setDisputeEntryId(null);
    alert('Aapka vivad darj kar liya gaya hai. Dukandar aur support team iski jaanch karenge.');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-left animate-fade-in space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={onBackToShopping}
            className="mb-2"
          >
            Back to Shopping
          </Button>
          <h1 className="text-2xl font-bold text-[#1F2937]">
            Mera Udhar Khata (Customer Ledger)
          </h1>
          <p className="text-xs text-[#6B7280]">
            Transparent digital hisaab with your trusted local village shops.
          </p>
        </div>

        {/* Total Outstanding Pill */}
        <div className="p-4 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs text-right">
          <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
            Total Baaki Across All Shops
          </span>
          <span className="text-2xl font-extrabold text-[#DC2626]">
            {formatINR(totalOutstandingAcrossShops)}
          </span>
        </div>
      </div>

      {customerLedgers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E7EB]">
          <BookOpen className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-base font-bold text-[#1F2937]">No Active Credit Accounts</p>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            You do not currently have an active udhari account with any shopkeeper. Credit is offered by local sellers at their discretion.
          </p>
        </div>
      ) : (
        <>
          {/* Shop Switcher Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {customerLedgers.map((group) => {
              const isSelected = group.sellerId === selectedSellerId;
              return (
                <button
                  key={group.sellerId}
                  onClick={() => setSelectedSellerId(group.sellerId)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#218838] text-white border-[#218838] shadow-xs'
                      : 'bg-white text-[#475569] border-[#E5E7EB] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>{group.sellerName}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FEE2E2] text-[#DC2626]'
                    }`}
                  >
                    {formatINR(group.profile.outstandingBalancePaise)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Store Credit Card Summary */}
          {activeGroup && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
                <div>
                  <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                    Khata at
                  </span>
                  <h2 className="text-xl font-bold text-[#1F2937]">
                    {activeGroup.sellerName}
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Pre-approved limit set directly by this shopkeeper.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                      Amount Owed
                    </span>
                    <span className="text-2xl font-bold text-[#DC2626]">
                      {formatINR(activeGroup.profile.outstandingBalancePaise)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Credit Terms & Available */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                  <span className="text-[#6B7280] block text-[11px]">Approved Credit Limit</span>
                  <strong className="text-sm text-[#1F2937]">{formatINR(activeGroup.profile.creditLimitPaise)}</strong>
                </div>

                <div className="p-3 bg-[#E8F5E9] border border-[#A7F3D0] rounded-xl">
                  <span className="text-[#176B2C] block text-[11px]">Available to Spend</span>
                  <strong className="text-sm text-[#16A34A]">{formatINR(activeGroup.profile.availableCreditPaise)}</strong>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
                  <span className="text-[#6B7280] block text-[11px]">Payment Terms</span>
                  <strong className="text-sm text-[#1F2937]">{activeGroup.profile.dueDays} Days Cycle</strong>
                </div>
              </div>

              {/* Repayment Guidance */}
              <div className="p-3.5 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl text-xs text-[#92400E] flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#D97706] mt-0.5" />
                <div>
                  <strong>Kaise Chukayein / Payment Instructions:</strong>
                  <p className="mt-0.5">
                    Aap dukaan counter par jakar cash jama kar sakte hain ya shopkeeper ka UPI QR scan karke direct pay kar sakte hain. Dukandar entry record karte hi yahan receipt update ho jayegi.
                  </p>
                </div>
              </div>

              {/* Immutable Transaction History Table */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F2937] mb-3">
                  Transaction History & Receipts
                </h3>

                <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider">
                        <th className="p-3">Date</th>
                        <th className="p-3">Reference</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Debit (+) / Credit (-)</th>
                        <th className="p-3 text-right">Balance</th>
                        <th className="p-3 text-center">Dispute</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {activeGroup.entries.map((entry) => {
                        const isSale = entry.entryType === 'CREDIT_SALE';
                        return (
                          <tr key={entry.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="p-3 text-[#475569]">
                              {formatDateTime(entry.postedAt)}
                            </td>
                            <td className="p-3 font-mono font-bold text-[#1F2937]">
                              {entry.ledgerReference}
                            </td>
                            <td className="p-3 text-[#1F2937]">
                              <span className="font-semibold block">
                                {isSale ? 'Credit Order' : 'Repayment Received'}
                              </span>
                              {entry.reason && (
                                <span className="text-[11px] text-[#6B7280]">
                                  {entry.reason}
                                </span>
                              )}
                            </td>
                            <td className={`p-3 text-right font-bold ${isSale ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                              {isSale ? `+${formatINR(entry.amountPaise)}` : `-${formatINR(entry.amountPaise)}`}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-[#1F2937]">
                              {formatINR(entry.runningBalancePaise)}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleOpenDispute(entry.id)}
                                className="text-[11px] font-semibold text-[#DC2626] hover:underline cursor-pointer"
                              >
                                Report
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* DISPUTE MODAL */}
      {disputeEntryId && (
        <Modal
          isOpen={true}
          onClose={() => setDisputeEntryId(null)}
          title="Report Ledger Mismatch / Vivad Darj Karein"
          description="If you notice an incorrect entry, submit a dispute for shopkeeper verification."
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setDisputeEntryId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="md" onClick={handleConfirmDispute}>
                Submit Dispute
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-left text-xs">
            <div>
              <label className="font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
                Reason for Dispute
              </label>
              <select
                value={disputeReasonCode}
                onChange={(e) => setDisputeReasonCode(e.target.value as typeof disputeReasonCode)}
                className="w-full h-11 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none"
              >
                <option value="WRONG_AMOUNT">Wrong Amount Recorded / Rashi Galat Hai</option>
                <option value="PAYMENT_NOT_RECORDED">Payment Done But Not Recorded / Paise Diye Par Entry Nahi Huyi</option>
                <option value="ORDER_CANCELLED">Order Was Cancelled / Order Cancel Ho Chuka Tha</option>
                <option value="OTHER">Other Discrepancy / Anya Karan</option>
              </select>
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
                Explain Details / Vivad Ka Vivaran
              </label>
              <textarea
                rows={3}
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                placeholder="Explain what is incorrect so the shopkeeper can verify their counter register or UPI..."
                className="w-full p-3 border border-[#E5E7EB] rounded-xl text-xs outline-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

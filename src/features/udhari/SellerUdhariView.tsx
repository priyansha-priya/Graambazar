import React, { useState } from 'react';
import { useSeller } from '../../contexts/SellerContext';
import { useUdhari } from '../../contexts/UdhariContext';
import { CustomerCreditProfile, CreditLedgerEntry } from '../../types/credit';
import { formatINR, paiseToRupees, rupeesToPaise } from '../../utils/currency';
import { formatDateTime, formatDate } from '../../utils/dates';
import { KPICard } from '../../components/data-display/KPICard';
import { DataTable } from '../../components/data-display/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  BookOpen,
  IndianRupee,
  Clock,
  Users,
  ShieldAlert,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export const SellerUdhariView: React.FC = () => {
  const { activeSeller } = useSeller();
  const {
    isShopCreditEnabled,
    enableShopCreditWithPolicyAcknowledgement,
    sellerProfiles,
    allLedgerEntries,
    allDisputes,
    setCustomerCreditLimit,
    recordRepayment,
    resolveDispute,
  } = useUdhari();

  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'LEDGER' | 'AGEING' | 'DISPUTES'>('CUSTOMERS');

  // Repayment Drawer State
  const [isRepaymentDrawerOpen, setIsRepaymentDrawerOpen] = useState(false);
  const [repaymentCustomerId, setRepaymentCustomerId] = useState<string>('');
  const [repaymentAmountRupees, setRepaymentAmountRupees] = useState<string>('');
  const [repaymentMethod, setRepaymentMethod] = useState<'CASH' | 'SELLER_UPI_DIRECT' | 'BANK_TRANSFER'>('CASH');
  const [repaymentRef, setRepaymentRef] = useState<string>('');
  const [repaymentNote, setRepaymentNote] = useState<string>('');

  // Credit Limit Modal State
  const [editingProfile, setEditingProfile] = useState<CustomerCreditProfile | null>(null);
  const [newLimitRupees, setNewLimitRupees] = useState<string>('');
  const [newInternalNote, setNewInternalNote] = useState<string>('');

  // Risk Policy Acknowledgement Modal
  const [isRiskPolicyModalOpen, setIsRiskPolicyModalOpen] = useState(false);

  // Financial KPI totals
  const totalOutstandingPaise = sellerProfiles.reduce((acc, curr) => acc + curr.outstandingBalancePaise, 0);
  const overdueTotalPaise = sellerProfiles.reduce((acc, curr) => acc + curr.overdueAmountPaise, 0);
  const activeCustomersCount = sellerProfiles.filter((p) => p.status === 'ACTIVE').length;

  const totalRepaymentsPaise = allLedgerEntries
    .filter((e) => e.entryType === 'REPAYMENT')
    .reduce((acc, curr) => acc + curr.amountPaise, 0);

  const selectedRepaymentProfile = sellerProfiles.find((p) => p.customerId === repaymentCustomerId);

  const handleOpenRepayment = (customerId?: string) => {
    if (customerId) {
      setRepaymentCustomerId(customerId);
      const prof = sellerProfiles.find((p) => p.customerId === customerId);
      if (prof) {
        setRepaymentAmountRupees(paiseToRupees(prof.outstandingBalancePaise).toString());
      }
    } else if (sellerProfiles.length > 0) {
      setRepaymentCustomerId(sellerProfiles[0].customerId);
      setRepaymentAmountRupees(paiseToRupees(sellerProfiles[0].outstandingBalancePaise).toString());
    }
    setIsRepaymentDrawerOpen(true);
  };

  const handlePostRepayment = () => {
    if (!repaymentCustomerId || !repaymentAmountRupees) return;
    const amountPaise = rupeesToPaise(repaymentAmountRupees);

    const result = recordRepayment({
      sellerId: activeSeller.id,
      customerId: repaymentCustomerId,
      amountPaise,
      method: repaymentMethod,
      referenceNumber: repaymentRef.trim() || undefined,
      note: repaymentNote.trim() || undefined,
    });

    if (result.success) {
      setIsRepaymentDrawerOpen(false);
      setRepaymentAmountRupees('');
      setRepaymentRef('');
      setRepaymentNote('');
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleSaveCreditLimit = () => {
    if (!editingProfile || !newLimitRupees) return;
    const limitPaise = rupeesToPaise(newLimitRupees);

    setCustomerCreditLimit(
      editingProfile.customerId,
      activeSeller.id,
      limitPaise,
      newInternalNote.trim()
    );

    setEditingProfile(null);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Top Banner & Risk Disclaimer */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-[#6B7280]">
              Seller-Managed Customer Credit
            </span>
            <Badge variant={isShopCreditEnabled ? 'success' : 'neutral'} dot>
              {isShopCreditEnabled ? 'UDHARI KHATA ACTIVE' : 'CREDIT FEATURE DISABLED'}
            </Badge>
          </div>

          <h1 className="text-xl font-bold text-[#1F2937]">
            {activeSeller.publicName} — Digital Udhari Khata
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Credit is offered solely at the seller's discretion and risk. The platform provides immutable record-keeping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isShopCreditEnabled ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ShieldAlert className="w-4 h-4" />}
              onClick={() => setIsRiskPolicyModalOpen(true)}
            >
              Enable Udhari Feature
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => handleOpenRepayment()}
            >
              Record Customer Repayment
            </Button>
          )}
        </div>
      </div>

      {/* Financial Health KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Outstanding Udhar"
          value={formatINR(totalOutstandingPaise)}
          icon={<IndianRupee className="w-5 h-5" />}
          badgeText="Active Debt"
          helperText={`Across ${sellerProfiles.length} customer ledgers`}
        />

        <KPICard
          title="Overdue Balances (> 30d)"
          value={formatINR(overdueTotalPaise)}
          icon={<Clock className="w-5 h-5" />}
          badgeText={overdueTotalPaise > 0 ? 'Attention' : 'Clean'}
          trend={{ value: overdueTotalPaise > 0 ? 'Follow-up required' : 'Zero default', isPositive: overdueTotalPaise === 0 }}
          helperText="Balances exceeding due terms"
        />

        <KPICard
          title="Credit Customers"
          value={`${activeCustomersCount} Accounts`}
          icon={<Users className="w-5 h-5" />}
          helperText="Approved village buyers"
        />

        <KPICard
          title="Repayments Collected"
          value={formatINR(totalRepaymentsPaise)}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={{ value: 'Cash & UPI direct', isPositive: true }}
          helperText="Reconciled into running ledger"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
        <button
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
            activeTab === 'CUSTOMERS'
              ? 'bg-[#218838] text-white shadow-xs'
              : 'bg-white text-[#475569] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
          }`}
        >
          Customer Balances ({sellerProfiles.length})
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
            activeTab === 'LEDGER'
              ? 'bg-[#218838] text-white shadow-xs'
              : 'bg-white text-[#475569] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
          }`}
        >
          Immutable Transactions ({allLedgerEntries.length})
        </button>

        <button
          onClick={() => setActiveTab('AGEING')}
          className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
            activeTab === 'AGEING'
              ? 'bg-[#218838] text-white shadow-xs'
              : 'bg-white text-[#475569] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
          }`}
        >
          Ageing Buckets
        </button>

        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
            activeTab === 'DISPUTES'
              ? 'bg-[#218838] text-white shadow-xs'
              : 'bg-white text-[#475569] border border-[#E5E7EB] hover:bg-[#F8FAFC]'
          }`}
        >
          Reported Disputes ({allDisputes.length})
        </button>
      </div>

      {/* TAB 1: CUSTOMER BALANCES DIRECTORY */}
      {activeTab === 'CUSTOMERS' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F2937]">
              Customer Credit Directory
            </h3>
            <span className="text-xs text-[#6B7280]">
              Credit limits and balances are scoped exclusively to {activeSeller.publicName}
            </span>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {sellerProfiles.map((prof) => (
              <div
                key={prof.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1F2937]">
                      {prof.customerName}
                    </span>
                    <Badge variant={prof.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                      {prof.status}
                    </Badge>
                    <span className="text-[#6B7280]">
                      +91 {prof.customerPhone} ({prof.villageName})
                    </span>
                  </div>

                  {prof.internalNote && (
                    <p className="text-[11px] text-[#475569] italic bg-slate-50 px-2 py-0.5 rounded-md inline-block">
                      Seller Note: "{prof.internalNote}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[#6B7280] pt-1">
                    <span>
                      Credit Limit: <strong className="text-[#1F2937]">{formatINR(prof.creditLimitPaise)}</strong>
                    </span>
                    <span>
                      Available: <strong className="text-[#16A34A]">{formatINR(prof.availableCreditPaise)}</strong>
                    </span>
                    <span>
                      Due Terms: <strong className="text-[#1F2937]">{prof.dueDays} days</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#6B7280] block">
                      Outstanding Baaki
                    </span>
                    <span className="text-base font-extrabold text-[#DC2626]">
                      {formatINR(prof.outstandingBalancePaise)}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenRepayment(prof.customerId)}
                  >
                    Record Repayment
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingProfile(prof);
                      setNewLimitRupees(paiseToRupees(prof.creditLimitPaise).toString());
                      setNewInternalNote(prof.internalNote || '');
                    }}
                  >
                    Edit Limit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: IMMUTABLE TRANSACTION LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F2937]">
              Complete Double-Entry Ledger
            </h3>
            <span className="text-xs text-[#6B7280]">
              Every entry is timestamped, immutable, and reconciles to running balances.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider">
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Ref / Order</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Transaction Type</th>
                  <th className="p-3.5 text-right">Debit (+) / Credit (-)</th>
                  <th className="p-3.5 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {allLedgerEntries.map((entry) => {
                  const isSale = entry.entryType === 'CREDIT_SALE';
                  return (
                    <tr key={entry.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3.5 text-[#475569]">
                        {formatDateTime(entry.postedAt)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#1F2937]">
                        {entry.ledgerReference}
                      </td>
                      <td className="p-3.5 font-medium text-[#1F2937]">
                        {sellerProfiles.find((p) => p.customerId === entry.customerId)?.customerName || 'Customer'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isSale ? 'text-[#DC2626]' : 'text-[#16A34A]'
                          }`}
                        >
                          {isSale ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          )}
                          {isSale ? 'Added to amount owed' : 'Payment received'}
                        </span>
                      </td>
                      <td className={`p-3.5 text-right font-bold ${isSale ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                        {isSale ? `+${formatINR(entry.amountPaise)}` : `-${formatINR(entry.amountPaise)}`}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-[#1F2937]">
                        {formatINR(entry.runningBalancePaise)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AGEING BUCKETS */}
      {activeTab === 'AGEING' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <span className="text-xs uppercase font-bold text-[#16A34A] block mb-1">Current (Not Due)</span>
            <span className="text-2xl font-bold text-[#1F2937] block">{formatINR(totalOutstandingPaise - overdueTotalPaise)}</span>
            <span className="text-[11px] text-[#6B7280]">Within configured payment terms</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <span className="text-xs uppercase font-bold text-[#D97706] block mb-1">1–7 Days Overdue</span>
            <span className="text-2xl font-bold text-[#1F2937] block">{formatINR(0)}</span>
            <span className="text-[11px] text-[#6B7280]">Grace period follow-up</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <span className="text-xs uppercase font-bold text-[#EA580C] block mb-1">8–30 Days Overdue</span>
            <span className="text-2xl font-bold text-[#1F2937] block">{formatINR(0)}</span>
            <span className="text-[11px] text-[#6B7280]">Formal payment notice</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#FCA5A5] bg-red-50/20 shadow-xs">
            <span className="text-xs uppercase font-bold text-[#DC2626] block mb-1">Over 30 Days Overdue</span>
            <span className="text-2xl font-bold text-[#DC2626] block">{formatINR(overdueTotalPaise)}</span>
            <span className="text-[11px] text-[#991B1B]">Requires seller direct visit</span>
          </div>
        </div>
      )}

      {/* TAB 4: DISPUTES & MISMATCHES */}
      {activeTab === 'DISPUTES' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <h3 className="font-bold text-sm uppercase tracking-wider text-[#1F2937] mb-3">
            Reported Discrepancies & Ledger Disputes
          </h3>

          {allDisputes.length === 0 ? (
            <p className="text-xs text-[#6B7280] py-8 text-center">
              No open customer disputes. All ledger entries are reconciled.
            </p>
          ) : (
            <div className="space-y-3">
              {allDisputes.map((d) => (
                <div key={d.id} className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#1F2937] block">
                      Dispute #{d.id} • Reason: {d.reasonCode.replace('_', ' ')}
                    </span>
                    <p className="text-[#475569] mt-0.5">{d.description}</p>
                    <span className="text-[11px] text-[#6B7280]">Opened on {formatDate(d.openedAt)}</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      resolveDispute(d.id, 'Verified cash memo and reconciled balance.');
                      alert('Dispute marked resolved.');
                    }}
                  >
                    Resolve Dispute
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RECORD REPAYMENT DRAWER */}
      <Drawer
        isOpen={isRepaymentDrawerOpen}
        onClose={() => setIsRepaymentDrawerOpen(false)}
        title="Record Customer Repayment"
        subtitle={`Shop: ${activeSeller.publicName}`}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsRepaymentDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handlePostRepayment}>
              Post Repayment & Update Ledger
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left text-xs">
          <div>
            <label className="font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
              Select Customer
            </label>
            <select
              value={repaymentCustomerId}
              onChange={(e) => {
                setRepaymentCustomerId(e.target.value);
                const prof = sellerProfiles.find((p) => p.customerId === e.target.value);
                if (prof) setRepaymentAmountRupees(paiseToRupees(prof.outstandingBalancePaise).toString());
              }}
              className="w-full h-11 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none"
            >
              {sellerProfiles.map((p) => (
                <option key={p.customerId} value={p.customerId}>
                  {p.customerName} (+91 {p.customerPhone}) — Baaki: {formatINR(p.outstandingBalancePaise)}
                </option>
              ))}
            </select>
          </div>

          {selectedRepaymentProfile && (
            <div className="p-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl text-[#92400E]">
              Current Outstanding Balance:{' '}
              <strong className="text-base">{formatINR(selectedRepaymentProfile.outstandingBalancePaise)}</strong>
            </div>
          )}

          <Input
            label="Amount Received (in Rupees ₹)"
            required
            type="number"
            value={repaymentAmountRupees}
            onChange={(e) => setRepaymentAmountRupees(e.target.value)}
            placeholder="e.g. 500"
            helperText="Cannot exceed outstanding balance"
          />

          <div>
            <label className="font-semibold uppercase tracking-wider text-[#1F2937] block mb-1.5">
              Payment Method
            </label>
            <select
              value={repaymentMethod}
              onChange={(e) => setRepaymentMethod(e.target.value as typeof repaymentMethod)}
              className="w-full h-11 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none"
            >
              <option value="CASH">Cash Paid at Counter / Received</option>
              <option value="SELLER_UPI_DIRECT">Direct Seller UPI (PhonePe / GPay / Paytm)</option>
              <option value="BANK_TRANSFER">Direct Bank Transfer</option>
            </select>
          </div>

          <Input
            label="Transaction / Receipt Reference Number (Optional)"
            placeholder="e.g. UTR # or Cash Memo No."
            value={repaymentRef}
            onChange={(e) => setRepaymentRef(e.target.value)}
          />

          <Input
            label="Internal Notes"
            placeholder="e.g. Received by shopkeeper personally"
            value={repaymentNote}
            onChange={(e) => setRepaymentNote(e.target.value)}
          />
        </div>
      </Drawer>

      {/* ADJUST CREDIT LIMIT MODAL */}
      {editingProfile && (
        <Modal
          isOpen={true}
          onClose={() => setEditingProfile(null)}
          title={`Adjust Credit Limit for ${editingProfile.customerName}`}
          description={`Customer phone: +91 ${editingProfile.customerPhone}`}
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setEditingProfile(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSaveCreditLimit}>
                Save Credit Limit
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-left text-xs">
            <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl space-y-1">
              <p>Current Credit Limit: <strong>{formatINR(editingProfile.creditLimitPaise)}</strong></p>
              <p>Current Outstanding Debt: <strong className="text-[#DC2626]">{formatINR(editingProfile.outstandingBalancePaise)}</strong></p>
            </div>

            <Input
              label="New Credit Limit (in Rupees ₹)"
              required
              type="number"
              value={newLimitRupees}
              onChange={(e) => setNewLimitRupees(e.target.value)}
              placeholder="e.g. 3000"
              helperText="Set to 0 to block further credit orders"
            />

            <Input
              label="Private Seller Note"
              value={newInternalNote}
              onChange={(e) => setNewInternalNote(e.target.value)}
              placeholder="e.g. Verified residence, good repayment history"
              helperText="This note is private and never visible to the customer"
            />
          </div>
        </Modal>
      )}

      {/* MANDATORY RISK POLICY ACKNOWLEDGEMENT MODAL */}
      <Modal
        isOpen={isRiskPolicyModalOpen}
        onClose={() => setIsRiskPolicyModalOpen(false)}
        title="Udhari Feature Risk Policy Acknowledgement"
        size="md"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsRiskPolicyModalOpen(false)}>
              Decline & Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                enableShopCreditWithPolicyAcknowledgement();
                setIsRiskPolicyModalOpen(false);
              }}
            >
              I Acknowledge & Enable
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-left text-xs leading-relaxed text-[#475569]">
          <div className="p-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl text-[#92400E] font-bold">
            Important Compliance Notice:
          </div>
          <p>
            "Credit is offered by my shop at my own risk; the GramBazaar platform does not guarantee repayment, act as a debt collector, or lend money."
          </p>
          <p>
            By enabling this digital khata, you acknowledge that you independently assess customer creditworthiness, set limits, and collect repayments. The platform provides transparent ledger records and reminders only.
          </p>
        </div>
      </Modal>
    </div>
  );
};

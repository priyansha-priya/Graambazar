/**
 * Udhari (Customer Credit) Domain Types
 */

export type CreditEntryType =
  | 'CREDIT_SALE'
  | 'REPAYMENT'
  | 'SALE_REVERSAL'
  | 'REPAYMENT_REVERSAL'
  | 'ADJUSTMENT_INCREASE'
  | 'ADJUSTMENT_DECREASE';

export type RepaymentMethod = 'CASH' | 'SELLER_UPI_DIRECT' | 'BANK_TRANSFER' | 'OTHER';

export interface CustomerCreditProfile {
  id: string;
  sellerId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  villageName: string;
  status: 'ACTIVE' | 'DISABLED' | 'BLOCKED';
  creditLimitPaise: number;
  outstandingBalancePaise: number;
  availableCreditPaise: number;
  overdueAmountPaise: number;
  dueDays: number;
  lastPaymentDate?: string;
  internalNote?: string;
}

export interface CreditLedgerEntry {
  id: string;
  ledgerReference: string; // e.g. "LED-2026-0089"
  sellerId: string;
  customerId: string;
  orderId?: string;
  repaymentId?: string;
  entryType: CreditEntryType;
  direction: 'INCREASES_OWED' | 'DECREASES_OWED';
  amountPaise: number;
  runningBalancePaise: number;
  dueDate?: string;
  isOverdue: boolean;
  status: 'POSTED' | 'REVERSED' | 'DISPUTED';
  reason?: string;
  recordedBy: string;
  postedAt: string;
}

export interface CreditRepayment {
  id: string;
  repaymentReference: string; // e.g. "REC-9912"
  sellerId: string;
  customerId: string;
  amountPaise: number;
  method: RepaymentMethod;
  referenceNumber?: string;
  receivedAt: string;
  note?: string;
  recordedBy: string;
}

export interface CreditDispute {
  id: string;
  sellerId: string;
  customerId: string;
  ledgerEntryId: string;
  reasonCode: 'WRONG_AMOUNT' | 'PAYMENT_NOT_RECORDED' | 'ORDER_CANCELLED' | 'OTHER';
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolutionNote?: string;
  openedAt: string;
  resolvedAt?: string;
}

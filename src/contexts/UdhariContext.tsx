import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  CustomerCreditProfile,
  CreditLedgerEntry,
  CreditRepayment,
  CreditDispute,
  RepaymentMethod,
} from '../types/credit';
import { useSeller } from './SellerContext';

interface UdhariContextType {
  isShopCreditEnabled: boolean;
  enableShopCreditWithPolicyAcknowledgement: () => void;
  sellerProfiles: CustomerCreditProfile[];
  allLedgerEntries: CreditLedgerEntry[];
  allDisputes: CreditDispute[];
  platformProfiles: CustomerCreditProfile[];
  platformLedgerEntries: CreditLedgerEntry[];
  platformDisputes: CreditDispute[];
  sellerCreditSettings: Record<string, { enabled: boolean; acknowledgedAt?: string }>;
  getCustomerProfile: (customerId: string, sellerId: string) => CustomerCreditProfile | undefined;
  setCustomerCreditLimit: (customerId: string, sellerId: string, limitPaise: number, internalNote?: string) => void;
  toggleCustomerCreditStatus: (customerId: string, sellerId: string, status: 'ACTIVE' | 'DISABLED') => void;
  postCreditSale: (params: {
    sellerId: string;
    customerId: string;
    orderId: string;
    amountPaise: number;
    dueDays?: number;
  }) => { success: boolean; message: string; ledgerReference?: string };
  recordRepayment: (params: {
    sellerId: string;
    customerId: string;
    amountPaise: number;
    method: RepaymentMethod;
    referenceNumber?: string;
    note?: string;
  }) => { success: boolean; message: string; receiptReference?: string };
  createDispute: (params: {
    sellerId: string;
    customerId: string;
    ledgerEntryId: string;
    reasonCode: 'WRONG_AMOUNT' | 'PAYMENT_NOT_RECORDED' | 'ORDER_CANCELLED' | 'OTHER';
    description: string;
  }) => { success: boolean; message: string };
  resolveDispute: (disputeId: string, resolutionNote: string) => void;
  getCustomerLedgersGrouped: (customerId: string) => {
    sellerId: string;
    sellerName: string;
    profile: CustomerCreditProfile;
    entries: CreditLedgerEntry[];
  }[];
}

const UdhariContext = createContext<UdhariContextType | undefined>(undefined);

export const UdhariProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { activeSeller, allSellers } = useSeller();

  // Master switch per seller: Credit feature enabled & policy acknowledged
  const [sellerCreditSettings, setSellerCreditSettings] = useState<Record<string, { enabled: boolean; acknowledgedAt?: string }>>(() => {
    const saved = localStorage.getItem('grambazaar_udhari_settings');
    return saved
      ? JSON.parse(saved)
      : {
          seller_gupta_kirana: { enabled: true, acknowledgedAt: '2026-08-10T10:00:00Z' },
          seller_sharma_dhaba: { enabled: true, acknowledgedAt: '2026-08-15T10:00:00Z' },
        };
  });

  // Customer Credit Profiles
  const [profiles, setProfiles] = useState<CustomerCreditProfile[]>(() => {
    const saved = localStorage.getItem('grambazaar_udhari_profiles');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'prof_1',
            sellerId: 'seller_gupta_kirana',
            customerId: 'user_cust_1',
            customerName: 'Ramesh Patel',
            customerPhone: '9876543210',
            villageName: 'Rampur',
            status: 'ACTIVE',
            creditLimitPaise: 250000, // ₹2,500.00
            outstandingBalancePaise: 85000, // ₹850.00
            availableCreditPaise: 165000, // ₹1,650.00
            overdueAmountPaise: 0,
            dueDays: 15,
            lastPaymentDate: '2026-10-15T11:00:00Z',
            internalNote: 'Pados ke nivaasi, har mahine salary aane par hisaab chukate hain.',
          },
          {
            id: 'prof_2',
            sellerId: 'seller_sharma_dhaba',
            customerId: 'user_cust_1',
            customerName: 'Ramesh Patel',
            customerPhone: '9876543210',
            villageName: 'Rampur',
            status: 'ACTIVE',
            creditLimitPaise: 150000, // ₹1,500.00
            outstandingBalancePaise: 34000, // ₹340.00
            availableCreditPaise: 116000, // ₹1,160.00
            overdueAmountPaise: 0,
            dueDays: 7,
            lastPaymentDate: '2026-10-20T14:30:00Z',
            internalNote: 'Regular customer for evening thali.',
          },
          {
            id: 'prof_3',
            sellerId: 'seller_gupta_kirana',
            customerId: 'user_cust_2',
            customerName: 'Suresh Yadav',
            customerPhone: '9876543233',
            villageName: 'Rampur',
            status: 'ACTIVE',
            creditLimitPaise: 300000, // ₹3,000.00
            outstandingBalancePaise: 210000, // ₹2,100.00
            availableCreditPaise: 90000, // ₹900.00
            overdueAmountPaise: 75000, // ₹750.00 Overdue > 30 days
            dueDays: 15,
            lastPaymentDate: '2026-09-12T09:00:00Z',
            internalNote: 'Reminder bhejna hai, pichle mahine ka baki hai.',
          },
        ];
  });

  // Double-Entry Immutable Ledger
  const [ledgerEntries, setLedgerEntries] = useState<CreditLedgerEntry[]>(() => {
    const saved = localStorage.getItem('grambazaar_udhari_ledger');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'led_1',
            ledgerReference: 'LED-2026-0012',
            sellerId: 'seller_gupta_kirana',
            customerId: 'user_cust_1',
            orderId: 'GB-2026-0012',
            entryType: 'CREDIT_SALE',
            direction: 'INCREASES_OWED',
            amountPaise: 135000, // ₹1,350.00
            runningBalancePaise: 135000,
            dueDate: '2026-10-25T00:00:00Z',
            isOverdue: false,
            status: 'POSTED',
            recordedBy: 'Gupta Kirana Counter',
            postedAt: '2026-10-10T12:00:00Z',
          },
          {
            id: 'led_2',
            ledgerReference: 'REC-2026-0045',
            sellerId: 'seller_gupta_kirana',
            customerId: 'user_cust_1',
            repaymentId: 'rep_1',
            entryType: 'REPAYMENT',
            direction: 'DECREASES_OWED',
            amountPaise: 50000, // ₹500.00
            runningBalancePaise: 85000,
            isOverdue: false,
            status: 'POSTED',
            reason: 'Cash paid at shop counter',
            recordedBy: 'Gupta Kirana Owner',
            postedAt: '2026-10-15T11:00:00Z',
          },
          {
            id: 'led_3',
            ledgerReference: 'LED-2026-0038',
            sellerId: 'seller_sharma_dhaba',
            customerId: 'user_cust_1',
            orderId: 'GB-2026-0038',
            entryType: 'CREDIT_SALE',
            direction: 'INCREASES_OWED',
            amountPaise: 34000, // ₹340.00
            runningBalancePaise: 34000,
            dueDate: '2026-11-04T00:00:00Z',
            isOverdue: false,
            status: 'POSTED',
            recordedBy: 'Sharma Dhaba Cashier',
            postedAt: '2026-10-28T19:30:00Z',
          },
        ];
  });

  // Disputes list
  const [disputes, setDisputes] = useState<CreditDispute[]>(() => {
    const saved = localStorage.getItem('grambazaar_udhari_disputes');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('grambazaar_udhari_settings', JSON.stringify(sellerCreditSettings));
  }, [sellerCreditSettings]);

  useEffect(() => {
    localStorage.setItem('grambazaar_udhari_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('grambazaar_udhari_ledger', JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  useEffect(() => {
    localStorage.setItem('grambazaar_udhari_disputes', JSON.stringify(disputes));
  }, [disputes]);

  const isShopCreditEnabled =
    sellerCreditSettings[activeSeller.id]?.enabled ?? false;

  const enableShopCreditWithPolicyAcknowledgement = () => {
    setSellerCreditSettings((prev) => ({
      ...prev,
      [activeSeller.id]: {
        enabled: true,
        acknowledgedAt: new Date().toISOString(),
      },
    }));
  };

  const getCustomerProfile = (customerId: string, sellerId: string) => {
    return profiles.find((p) => p.customerId === customerId && p.sellerId === sellerId);
  };

  const setCustomerCreditLimit = (
    customerId: string,
    sellerId: string,
    limitPaise: number,
    internalNote?: string
  ) => {
    setProfiles((prev) => {
      const existing = prev.find((p) => p.customerId === customerId && p.sellerId === sellerId);
      if (existing) {
        return prev.map((p) => {
          if (p.customerId === customerId && p.sellerId === sellerId) {
            const newAvail = Math.max(0, limitPaise - p.outstandingBalancePaise);
            return {
              ...p,
              creditLimitPaise: limitPaise,
              availableCreditPaise: newAvail,
              internalNote: internalNote !== undefined ? internalNote : p.internalNote,
            };
          }
          return p;
        });
      }

      // Create new profile for customer at this shop
      const newProf: CustomerCreditProfile = {
        id: `prof_${Date.now()}`,
        sellerId,
        customerId,
        customerName: 'Customer',
        customerPhone: '9876543210',
        villageName: 'Rampur',
        status: 'ACTIVE',
        creditLimitPaise: limitPaise,
        outstandingBalancePaise: 0,
        availableCreditPaise: limitPaise,
        overdueAmountPaise: 0,
        dueDays: 15,
        internalNote,
      };
      return [...prev, newProf];
    });
  };

  const toggleCustomerCreditStatus = (
    customerId: string,
    sellerId: string,
    status: 'ACTIVE' | 'DISABLED'
  ) => {
    setProfiles((prev) =>
      prev.map((p) => (p.customerId === customerId && p.sellerId === sellerId ? { ...p, status } : p))
    );
  };

  /**
   * Posts a CREDIT_SALE transaction atomically linked to an order
   */
  const postCreditSale = ({
    sellerId,
    customerId,
    orderId,
    amountPaise,
    dueDays = 15,
  }: {
    sellerId: string;
    customerId: string;
    orderId: string;
    amountPaise: number;
    dueDays?: number;
  }) => {
    const prof = getCustomerProfile(customerId, sellerId);
    if (!prof) {
      return { success: false, message: 'Customer has no credit account with this seller.' };
    }

    if (prof.status !== 'ACTIVE') {
      return { success: false, message: 'Credit is disabled for this customer.' };
    }

    const projectedOutstanding = prof.outstandingBalancePaise + amountPaise;
    if (projectedOutstanding > prof.creditLimitPaise) {
      return { success: false, message: 'Projected outstanding exceeds customer credit limit.' };
    }

    const timestamp = new Date().toISOString();
    const dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString();
    const refSeq = (ledgerEntries.length + 1).toString().padStart(4, '0');
    const ledgerRef = `LED-2026-${refSeq}`;

    // 1. Append immutable double-entry record
    const newEntry: CreditLedgerEntry = {
      id: `led_${Date.now()}`,
      ledgerReference: ledgerRef,
      sellerId,
      customerId,
      orderId,
      entryType: 'CREDIT_SALE',
      direction: 'INCREASES_OWED',
      amountPaise,
      runningBalancePaise: projectedOutstanding,
      dueDate,
      isOverdue: false,
      status: 'POSTED',
      recordedBy: 'Order Checkout Engine',
      postedAt: timestamp,
    };

    setLedgerEntries((prev) => [newEntry, ...prev]);

    // 2. Update cached customer balance atomically
    setProfiles((prev) =>
      prev.map((p) =>
        p.customerId === customerId && p.sellerId === sellerId
          ? {
              ...p,
              outstandingBalancePaise: projectedOutstanding,
              availableCreditPaise: Math.max(0, p.creditLimitPaise - projectedOutstanding),
            }
          : p
      )
    );

    return { success: true, message: 'Credit sale posted to ledger', ledgerReference: ledgerRef };
  };

  /**
   * Records a customer repayment (Cash / Direct UPI) and updates running balance
   */
  const recordRepayment = ({
    sellerId,
    customerId,
    amountPaise,
    method,
    referenceNumber,
    note,
  }: {
    sellerId: string;
    customerId: string;
    amountPaise: number;
    method: RepaymentMethod;
    referenceNumber?: string;
    note?: string;
  }) => {
    const prof = getCustomerProfile(customerId, sellerId);
    if (!prof) {
      return { success: false, message: 'Customer credit profile not found.' };
    }

    if (amountPaise <= 0) {
      return { success: false, message: 'Repayment amount must be greater than zero.' };
    }

    // Overpayment check
    if (amountPaise > prof.outstandingBalancePaise) {
      return {
        success: false,
        message: 'Repayment amount cannot exceed current outstanding balance in MVP.',
      };
    }

    const timestamp = new Date().toISOString();
    const newOutstanding = prof.outstandingBalancePaise - amountPaise;
    const refSeq = (ledgerEntries.length + 1).toString().padStart(4, '0');
    const receiptRef = `REC-2026-${refSeq}`;

    const newEntry: CreditLedgerEntry = {
      id: `led_${Date.now()}`,
      ledgerReference: receiptRef,
      sellerId,
      customerId,
      entryType: 'REPAYMENT',
      direction: 'DECREASES_OWED',
      amountPaise,
      runningBalancePaise: newOutstanding,
      isOverdue: false,
      status: 'POSTED',
      reason: `${method.replace('_', ' ')} repayment recorded by seller${
        referenceNumber ? ` (Ref: ${referenceNumber})` : ''
      }`,
      recordedBy: activeSeller.publicName,
      postedAt: timestamp,
    };

    setLedgerEntries((prev) => [newEntry, ...prev]);

    // Update customer profile balance
    setProfiles((prev) =>
      prev.map((p) =>
        p.customerId === customerId && p.sellerId === sellerId
          ? {
              ...p,
              outstandingBalancePaise: newOutstanding,
              availableCreditPaise: Math.max(0, p.creditLimitPaise - newOutstanding),
              lastPaymentDate: timestamp,
            }
          : p
      )
    );

    return {
      success: true,
      message: 'Repayment successfully recorded and receipt issued.',
      receiptReference: receiptRef,
    };
  };

  const createDispute = ({
    sellerId,
    customerId,
    ledgerEntryId,
    reasonCode,
    description,
  }: {
    sellerId: string;
    customerId: string;
    ledgerEntryId: string;
    reasonCode: 'WRONG_AMOUNT' | 'PAYMENT_NOT_RECORDED' | 'ORDER_CANCELLED' | 'OTHER';
    description: string;
  }) => {
    const newDispute: CreditDispute = {
      id: `disp_${Date.now()}`,
      sellerId,
      customerId,
      ledgerEntryId,
      reasonCode,
      description,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
    };

    setDisputes((prev) => [newDispute, ...prev]);
    return { success: true, message: 'Dispute submitted for review.' };
  };

  const resolveDispute = (disputeId: string, resolutionNote: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: 'RESOLVED',
              resolutionNote,
              resolvedAt: new Date().toISOString(),
            }
          : d
      )
    );
  };

  const getCustomerLedgersGrouped = (customerId: string) => {
    const customerProfiles = profiles.filter((p) => p.customerId === customerId);
    return customerProfiles.map((p) => {
      const seller = allSellers.find((s) => s.id === p.sellerId);
      const entries = ledgerEntries.filter(
        (e) => e.customerId === customerId && e.sellerId === p.sellerId
      );
      return {
        sellerId: p.sellerId,
        sellerName: seller ? seller.publicName : 'Village Store',
        profile: p,
        entries,
      };
    });
  };

  return (
    <UdhariContext.Provider
      value={{
        isShopCreditEnabled,
        enableShopCreditWithPolicyAcknowledgement,
        sellerProfiles: profiles.filter((p) => p.sellerId === activeSeller.id),
        allLedgerEntries: ledgerEntries.filter((e) => e.sellerId === activeSeller.id),
        allDisputes: disputes.filter((d) => d.sellerId === activeSeller.id),
        platformProfiles: profiles,
        platformLedgerEntries: ledgerEntries,
        platformDisputes: disputes,
        sellerCreditSettings,
        getCustomerProfile,
        setCustomerCreditLimit,
        toggleCustomerCreditStatus,
        postCreditSale,
        recordRepayment,
        createDispute,
        resolveDispute,
        getCustomerLedgersGrouped,
      }}
    >
      {children}
    </UdhariContext.Provider>
  );
};

export function useUdhari(): UdhariContextType {
  const context = useContext(UdhariContext);
  if (!context) {
    throw new Error('useUdhari must be used within an UdhariProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  CustomerCreditProfile,
  CreditLedgerEntry,
  CreditDispute,
  RepaymentMethod,
} from '../types/credit';
import { useSeller } from './SellerContext';
import { useAuth } from './AuthContext';

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
  const { authUser, getAuthHeaders } = useAuth();

  // Hydrated directly from PostgreSQL (/api/udhari/summary) when signed in
  const [sellerCreditSettings, setSellerCreditSettings] = useState<
    Record<string, { enabled: boolean; acknowledgedAt?: string }>
  >({});
  const [profiles, setProfiles] = useState<CustomerCreditProfile[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<CreditLedgerEntry[]>([]);
  const [disputes, setDisputes] = useState<CreditDispute[]>([]);

  const udhariRequest = useCallback(
    async <T,>(url: string, init: RequestInit): Promise<T | null> => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return null;
        const res = await fetch(url, {
          ...init,
          headers: {
            ...headers,
            ...(init.headers || {}),
          },
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
      } catch (error) {
        console.error(`Udhari API request failed (${url}):`, error);
        return null;
      }
    },
    [getAuthHeaders]
  );

  const hydrateUdhari = useCallback(async () => {
    if (!authUser) {
      setSellerCreditSettings({});
      setProfiles([]);
      setLedgerEntries([]);
      setDisputes([]);
      return;
    }

    const data = await udhariRequest<{
      sellerCreditSettings?: Record<string, { enabled: boolean; acknowledgedAt?: string }>;
      profiles?: CustomerCreditProfile[];
      ledgerEntries?: CreditLedgerEntry[];
      disputes?: CreditDispute[];
    }>('/api/udhari/summary', { method: 'GET' });

    if (!data) return;
    if (data.sellerCreditSettings) setSellerCreditSettings(data.sellerCreditSettings);
    if (Array.isArray(data.profiles)) setProfiles(data.profiles);
    if (Array.isArray(data.ledgerEntries)) setLedgerEntries(data.ledgerEntries);
    if (Array.isArray(data.disputes)) setDisputes(data.disputes);
  }, [authUser, udhariRequest]);

  useEffect(() => {
    void hydrateUdhari();
  }, [hydrateUdhari]);

  const isShopCreditEnabled =
    sellerCreditSettings[activeSeller.id]?.enabled ?? false;

  const enableShopCreditWithPolicyAcknowledgement = () => {
    const acknowledgedAt = new Date().toISOString();
    const targetSellerId = activeSeller.id;
    setSellerCreditSettings((prev) => ({
      ...prev,
      [targetSellerId]: {
        enabled: true,
        acknowledgedAt,
      },
    }));

    void udhariRequest<{ setting?: { sellerCode: string; enabled: boolean; acknowledgedAt: string } }>(
      `/api/udhari/sellers/${encodeURIComponent(targetSellerId)}/enable`,
      { method: 'PATCH' }
    ).then((res) => {
      if (res?.setting) {
        setSellerCreditSettings((prev) => ({
          ...prev,
          [res.setting!.sellerCode]: {
            enabled: res.setting!.enabled,
            acknowledgedAt: res.setting!.acknowledgedAt,
          },
        }));
      } else {
        void hydrateUdhari();
      }
    });
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
    const tempId = `prof_${Date.now()}`;
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

      const newProf: CustomerCreditProfile = {
        id: tempId,
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

    void udhariRequest<{ profile?: CustomerCreditProfile }>('/api/udhari/profiles', {
      method: 'PUT',
      body: JSON.stringify({
        sellerId,
        customerId,
        limitPaise,
        internalNote,
      }),
    }).then((res) => {
      if (res?.profile) {
        const persisted = res.profile;
        setProfiles((prev) => {
          const exists = prev.some(
            (p) => p.customerId === persisted.customerId && p.sellerId === persisted.sellerId
          );
          if (exists) {
            return prev.map((p) =>
              p.customerId === persisted.customerId && p.sellerId === persisted.sellerId
                ? persisted
                : p
            );
          }
          return [...prev, persisted];
        });
      } else {
        void hydrateUdhari();
      }
    });
  };

  const toggleCustomerCreditStatus = (
    customerId: string,
    sellerId: string,
    status: 'ACTIVE' | 'DISABLED'
  ) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.customerId === customerId && p.sellerId === sellerId ? { ...p, status } : p
      )
    );

    void udhariRequest<{ profile?: CustomerCreditProfile }>('/api/udhari/profiles/status', {
      method: 'PATCH',
      body: JSON.stringify({ sellerId, customerId, status }),
    }).then((res) => {
      if (res?.profile) {
        const persisted = res.profile;
        setProfiles((prev) =>
          prev.map((p) =>
            p.customerId === persisted.customerId && p.sellerId === persisted.sellerId
              ? persisted
              : p
          )
        );
      } else {
        void hydrateUdhari();
      }
    });
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
    const tempId = `led_${Date.now()}`;

    const newEntry: CreditLedgerEntry = {
      id: tempId,
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

    void udhariRequest<{
      success?: boolean;
      entry?: CreditLedgerEntry;
      profile?: CustomerCreditProfile;
    }>('/api/udhari/credit-sales', {
      method: 'POST',
      body: JSON.stringify({
        sellerId,
        customerId,
        orderId,
        amountPaise,
        dueDays,
        recordedBy: 'Order Checkout Engine',
      }),
    }).then((res) => {
      if (res?.entry && res?.profile) {
        setLedgerEntries((prev) => prev.map((e) => (e.id === tempId ? res.entry! : e)));
        setProfiles((prev) =>
          prev.map((p) =>
            p.customerId === customerId && p.sellerId === sellerId ? res.profile! : p
          )
        );
      } else {
        void hydrateUdhari();
      }
    });

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
    const tempId = `led_${Date.now()}`;

    const newEntry: CreditLedgerEntry = {
      id: tempId,
      ledgerReference: receiptRef,
      sellerId,
      customerId,
      entryType: 'REPAYMENT',
      direction: 'DECREASES_OWED',
      amountPaise,
      runningBalancePaise: newOutstanding,
      isOverdue: false,
      status: 'POSTED',
      reason:
        note ||
        `${method.replace('_', ' ')} repayment recorded by seller${
          referenceNumber ? ` (Ref: ${referenceNumber})` : ''
        }`,
      recordedBy: activeSeller.publicName,
      postedAt: timestamp,
    };

    setLedgerEntries((prev) => [newEntry, ...prev]);
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

    void udhariRequest<{
      success?: boolean;
      entry?: CreditLedgerEntry;
      profile?: CustomerCreditProfile;
    }>('/api/udhari/repayments', {
      method: 'POST',
      body: JSON.stringify({
        sellerId,
        customerId,
        amountPaise,
        method,
        referenceNumber,
        note,
        recordedBy: activeSeller.publicName,
      }),
    }).then((res) => {
      if (res?.entry && res?.profile) {
        setLedgerEntries((prev) => prev.map((e) => (e.id === tempId ? res.entry! : e)));
        setProfiles((prev) =>
          prev.map((p) =>
            p.customerId === customerId && p.sellerId === sellerId ? res.profile! : p
          )
        );
      } else {
        void hydrateUdhari();
      }
    });

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
    const id = `disp_${Date.now()}`;
    const newDispute: CreditDispute = {
      id,
      sellerId,
      customerId,
      ledgerEntryId,
      reasonCode,
      description,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
    };

    setDisputes((prev) => [newDispute, ...prev]);

    void udhariRequest<{ dispute?: CreditDispute }>('/api/udhari/disputes', {
      method: 'POST',
      body: JSON.stringify({
        id,
        sellerId,
        customerId,
        ledgerEntryId,
        reasonCode,
        description,
      }),
    }).then((res) => {
      if (res?.dispute) {
        setDisputes((prev) => prev.map((d) => (d.id === id ? res.dispute! : d)));
      } else {
        void hydrateUdhari();
      }
    });

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

    void udhariRequest<{ dispute?: CreditDispute }>(
      `/api/udhari/disputes/${encodeURIComponent(disputeId)}/resolve`,
      {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNote }),
      }
    ).then((res) => {
      if (res?.dispute) {
        setDisputes((prev) => prev.map((d) => (d.id === disputeId ? res.dispute! : d)));
      } else {
        void hydrateUdhari();
      }
    });
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

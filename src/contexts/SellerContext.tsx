import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Seller } from '../types/merchant';
import { MOCK_SELLERS } from '../constants/mockData';
import { useAuth } from './AuthContext';

export interface InHouseRunner {
  id: string;
  name: string;
  phone: string;
  role: 'Shop Runner' | 'Delivery Staff' | 'Family Helper';
  activeOrdersCount: number;
  isAvailable: boolean;
}

export interface SellerProfileUpdatePayload {
  publicName?: string;
  contactPhone?: string;
  upiId?: string;
  deliveryRadiusKm?: number;
  openingHours?: string;
  minimumOrderPaise?: number;
  packagingFeePaise?: number;
  deliveryFeePaise?: number;
}

interface SellerContextType {
  activeSeller: Seller;
  allSellers: Seller[];
  setActiveSellerId: (sellerId: string) => void;
  toggleShopOpenState: () => void;
  updateSellerProfile: (
    patch: SellerProfileUpdatePayload
  ) => Promise<{ success: boolean; message: string }>;
  isBuzzerEnabled: boolean;
  toggleBuzzer: () => void;
  runners: InHouseRunner[];
  addRunner: (runner: {
    name: string;
    phone: string;
    role: InHouseRunner['role'];
  }) => Promise<{ success: boolean; message: string }>;
  toggleRunnerAvailability: (runnerId: string) => void;
  deleteRunner: (runnerId: string) => void;
  assignRunnerToOrder: (orderNumberOrId: string, runnerId: string) => void;
  refreshSellerRunners: () => Promise<void>;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

const FALLBACK_RUNNERS: InHouseRunner[] = [
  {
    id: 'run_1',
    name: 'Ramesh Patel',
    phone: '9876543220',
    role: 'Shop Runner',
    activeOrdersCount: 1,
    isAvailable: true,
  },
  {
    id: 'run_2',
    name: 'Mahesh Kumar',
    phone: '9876543221',
    role: 'Delivery Staff',
    activeOrdersCount: 0,
    isAvailable: true,
  },
  {
    id: 'run_3',
    name: 'Sonu Sharma',
    phone: '9876543222',
    role: 'Family Helper',
    activeOrdersCount: 0,
    isAvailable: true,
  },
];

export const SellerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authUser, getAuthHeaders } = useAuth();

  const [activeSellerId, setActiveSellerId] = useState<string>(() => {
    return localStorage.getItem('grambazaar_active_seller_id') || 'seller_gupta_kirana';
  });

  // Base seller metadata hydrated with live operational profiles from PostgreSQL
  const [sellers, setSellers] = useState<Seller[]>(MOCK_SELLERS);
  const [isBuzzerEnabled, setIsBuzzerEnabled] = useState<boolean>(true);
  const [runners, setRunners] = useState<InHouseRunner[]>(FALLBACK_RUNNERS);

  const hydrateSellerProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog/seller-profiles');
      if (!res.ok) return;
      const data = (await res.json()) as {
        profiles?: Array<{
          id: string;
          publicName: string;
          contactPhone: string;
          upiId: string;
          deliveryRadiusKm: number;
          openingHours: string;
          isOpenNow: boolean;
          isPaused: boolean;
          minimumOrderPaise: number;
          packagingFeePaise: number;
          deliveryFeePaise: number;
        }>;
      };
      if (!Array.isArray(data.profiles) || data.profiles.length === 0) return;

      const profileMap = new Map(data.profiles.map((p) => [p.id, p]));
      setSellers((prev) =>
        prev.map((seller) => {
          const dbProf = profileMap.get(seller.id);
          return dbProf
            ? {
                ...seller,
                publicName: dbProf.publicName || seller.publicName,
                contactPhone: dbProf.contactPhone || seller.contactPhone,
                upiId: dbProf.upiId,
                deliveryRadiusKm: dbProf.deliveryRadiusKm,
                openingHoursText: dbProf.openingHours,
                isOpenNow: dbProf.isOpenNow,
                isPaused: dbProf.isPaused,
                minimumOrderPaise: dbProf.minimumOrderPaise,
                packagingFeePaise: dbProf.packagingFeePaise,
                deliveryFeePaise: dbProf.deliveryFeePaise,
              }
            : seller;
        })
      );
    } catch (error) {
      console.error('Failed to hydrate seller profiles from PostgreSQL:', error);
    }
  }, []);

  const refreshSellerRunners = useCallback(async () => {
    if (!authUser) {
      setRunners(FALLBACK_RUNNERS);
      return;
    }
    try {
      const headers = await getAuthHeaders();
      if (!headers) return;
      const res = await fetch(
        `/api/seller/${encodeURIComponent(activeSellerId)}/runners`,
        { headers }
      );
      if (!res.ok) return;
      const data = (await res.json()) as { runners?: InHouseRunner[] };
      if (Array.isArray(data.runners)) {
        setRunners(data.runners);
      }
    } catch (error) {
      console.error('Failed to load seller runners from PostgreSQL:', error);
    }
  }, [activeSellerId, authUser, getAuthHeaders]);

  useEffect(() => {
    void hydrateSellerProfiles();
  }, [hydrateSellerProfiles]);

  useEffect(() => {
    void refreshSellerRunners();
  }, [refreshSellerRunners]);

  useEffect(() => {
    localStorage.setItem('grambazaar_active_seller_id', activeSellerId);
  }, [activeSellerId]);

  const activeSeller =
    sellers.find((s) => s.id === activeSellerId) || sellers[0];

  const toggleShopOpenState = () => {
    const current = sellers.find((s) => s.id === activeSellerId);
    if (!current) return;
    const nextPaused = !current.isPaused;
    const targetId = current.id;

    setSellers((prev) =>
      prev.map((s) =>
        s.id === targetId
          ? {
              ...s,
              isPaused: nextPaused,
              isOpenNow: !nextPaused,
            }
          : s
      )
    );

    void (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) {
          void hydrateSellerProfiles();
          return;
        }
        const res = await fetch(`/api/seller/${encodeURIComponent(targetId)}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ isPaused: nextPaused }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            status?: { id: string; isOpenNow: boolean; isPaused: boolean };
          };
          if (data.status) {
            setSellers((prev) =>
              prev.map((s) =>
                s.id === targetId
                  ? {
                      ...s,
                      isOpenNow: data.status!.isOpenNow,
                      isPaused: data.status!.isPaused,
                    }
                  : s
              )
            );
            return;
          }
        }
        void hydrateSellerProfiles();
      } catch (error) {
        console.error('Failed to persist seller availability status:', error);
        void hydrateSellerProfiles();
      }
    })();
  };

  const updateSellerProfile = async (
    patch: SellerProfileUpdatePayload
  ): Promise<{ success: boolean; message: string }> => {
    const targetId = activeSeller.id;
    const headers = await getAuthHeaders();
    if (!headers) {
      return {
        success: false,
        message: 'Please sign in first to save store settings to the database.',
      };
    }

    try {
      const res = await fetch(`/api/seller/${encodeURIComponent(targetId)}/profile`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as {
        error?: string;
        profile?: {
          publicName: string;
          contactPhone: string;
          upiId: string;
          deliveryRadiusKm: number;
          openingHours: string;
          minimumOrderPaise: number;
          packagingFeePaise: number;
          deliveryFeePaise: number;
        };
      };

      if (!res.ok || !data.profile) {
        return {
          success: false,
          message: data.error || 'Unable to save store settings.',
        };
      }

      setSellers((prev) =>
        prev.map((s) =>
          s.id === targetId
            ? {
                ...s,
                publicName: data.profile!.publicName,
                contactPhone: data.profile!.contactPhone,
                upiId: data.profile!.upiId,
                deliveryRadiusKm: data.profile!.deliveryRadiusKm,
                openingHoursText: data.profile!.openingHours,
                minimumOrderPaise: data.profile!.minimumOrderPaise,
                packagingFeePaise: data.profile!.packagingFeePaise,
                deliveryFeePaise: data.profile!.deliveryFeePaise,
              }
            : s
        )
      );

      return { success: true, message: 'Store profile saved to database.' };
    } catch (error) {
      console.error('Failed to update seller profile:', error);
      return { success: false, message: 'Network error while saving store profile.' };
    }
  };

  const addRunner = async (runner: {
    name: string;
    phone: string;
    role: InHouseRunner['role'];
  }): Promise<{ success: boolean; message: string }> => {
    const headers = await getAuthHeaders();
    if (!headers) {
      return { success: false, message: 'Please sign in first to add a delivery runner.' };
    }
    try {
      const res = await fetch(
        `/api/seller/${encodeURIComponent(activeSeller.id)}/runners`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(runner),
        }
      );
      const data = (await res.json()) as { error?: string; runner?: InHouseRunner };
      if (!res.ok || !data.runner) {
        return { success: false, message: data.error || 'Unable to add runner.' };
      }
      setRunners((prev) => [...prev, data.runner!]);
      return { success: true, message: `Added ${data.runner.name} to store fleet.` };
    } catch (error) {
      console.error('Failed to add runner:', error);
      return { success: false, message: 'Network error while adding runner.' };
    }
  };

  const toggleRunnerAvailability = (runnerId: string) => {
    const target = runners.find((r) => r.id === runnerId);
    if (!target) return;
    const nextAvailable = !target.isAvailable;

    setRunners((prev) =>
      prev.map((r) => (r.id === runnerId ? { ...r, isAvailable: nextAvailable } : r))
    );

    void (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) {
          void refreshSellerRunners();
          return;
        }
        const res = await fetch(
          `/api/seller/${encodeURIComponent(activeSeller.id)}/runners/${encodeURIComponent(runnerId)}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ isAvailable: nextAvailable }),
          }
        );
        if (!res.ok) {
          void refreshSellerRunners();
        }
      } catch {
        void refreshSellerRunners();
      }
    })();
  };

  const deleteRunner = (runnerId: string) => {
    setRunners((prev) => prev.filter((r) => r.id !== runnerId));
    void (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) {
          void refreshSellerRunners();
          return;
        }
        const res = await fetch(
          `/api/seller/${encodeURIComponent(activeSeller.id)}/runners/${encodeURIComponent(runnerId)}`,
          {
            method: 'DELETE',
            headers,
          }
        );
        if (!res.ok) {
          void refreshSellerRunners();
        }
      } catch {
        void refreshSellerRunners();
      }
    })();
  };

  const toggleBuzzer = () => {
    setIsBuzzerEnabled((prev) => !prev);
  };

  const assignRunnerToOrder = (orderNumberOrId: string, runnerId: string) => {
    setRunners((prev) =>
      prev.map((r) =>
        r.id === runnerId
          ? { ...r, activeOrdersCount: r.activeOrdersCount + 1 }
          : r
      )
    );

    void (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return;
        const res = await fetch(
          `/api/seller/${encodeURIComponent(activeSeller.id)}/orders/${encodeURIComponent(orderNumberOrId)}/assign-runner`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ runnerId }),
          }
        );
        if (res.ok) {
          const data = (await res.json()) as { runner?: InHouseRunner };
          if (data.runner) {
            setRunners((prev) =>
              prev.map((r) => (r.id === runnerId ? data.runner! : r))
            );
          }
        }
      } catch (error) {
        console.error('Failed to persist runner assignment:', error);
      }
    })();
  };

  return (
    <SellerContext.Provider
      value={{
        activeSeller,
        allSellers: sellers,
        setActiveSellerId,
        toggleShopOpenState,
        updateSellerProfile,
        isBuzzerEnabled,
        toggleBuzzer,
        runners,
        addRunner,
        toggleRunnerAvailability,
        deleteRunner,
        assignRunnerToOrder,
        refreshSellerRunners,
      }}
    >
      {children}
    </SellerContext.Provider>
  );
};

export function useSeller(): SellerContextType {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error('useSeller must be used within a SellerProvider');
  }
  return context;
}

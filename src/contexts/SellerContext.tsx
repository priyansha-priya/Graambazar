import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Seller } from '../types/merchant';
import { MOCK_SELLERS } from '../constants/mockData';

export interface InHouseRunner {
  id: string;
  name: string;
  phone: string;
  role: 'Shop Runner' | 'Delivery Staff' | 'Family Helper';
  activeOrdersCount: number;
  isAvailable: boolean;
}

interface SellerContextType {
  activeSeller: Seller;
  allSellers: Seller[];
  setActiveSellerId: (sellerId: string) => void;
  toggleShopOpenState: () => void;
  isBuzzerEnabled: boolean;
  toggleBuzzer: () => void;
  runners: InHouseRunner[];
  assignRunnerToOrder: (orderId: string, runnerId: string) => void;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

export const SellerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSellerId, setActiveSellerId] = useState<string>(() => {
    return localStorage.getItem('grambazaar_active_seller_id') || 'seller_gupta_kirana';
  });

  const [sellers, setSellers] = useState<Seller[]>(() => {
    const saved = localStorage.getItem('grambazaar_sellers_state');
    if (saved) {
      try {
        const parsed: Seller[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedMap = new Map(parsed.map((s) => [s.id, s]));
          // Merge latest MOCK_SELLERS (including images & newly added shops) while preserving pause/open state
          return MOCK_SELLERS.map((mockSeller) => {
            const existing = savedMap.get(mockSeller.id);
            return existing
              ? {
                  ...mockSeller,
                  isOpenNow: existing.isOpenNow,
                  isPaused: existing.isPaused,
                }
              : mockSeller;
          });
        }
      } catch {
        // Fallback to MOCK_SELLERS
      }
    }
    return MOCK_SELLERS;
  });

  const [isBuzzerEnabled, setIsBuzzerEnabled] = useState<boolean>(true);

  // In-house delivery boys / runners for village merchants
  const [runners, setRunners] = useState<InHouseRunner[]>([
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
  ]);

  useEffect(() => {
    localStorage.setItem('grambazaar_active_seller_id', activeSellerId);
  }, [activeSellerId]);

  useEffect(() => {
    localStorage.setItem('grambazaar_sellers_state', JSON.stringify(sellers));
  }, [sellers]);

  const activeSeller =
    sellers.find((s) => s.id === activeSellerId) || sellers[0];

  const toggleShopOpenState = () => {
    setSellers((prev) =>
      prev.map((s) => {
        if (s.id === activeSellerId) {
          const nextPaused = !s.isPaused;
          return {
            ...s,
            isPaused: nextPaused,
            isOpenNow: !nextPaused,
          };
        }
        return s;
      })
    );
  };

  const toggleBuzzer = () => {
    setIsBuzzerEnabled((prev) => !prev);
  };

  const assignRunnerToOrder = (orderId: string, runnerId: string) => {
    setRunners((prev) =>
      prev.map((r) =>
        r.id === runnerId
          ? { ...r, activeOrdersCount: r.activeOrdersCount + 1 }
          : r
      )
    );
  };

  return (
    <SellerContext.Provider
      value={{
        activeSeller,
        allSellers: sellers,
        setActiveSellerId,
        toggleShopOpenState,
        isBuzzerEnabled,
        toggleBuzzer,
        runners,
        assignRunnerToOrder,
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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Village } from '../types/village';
import { MULTI_VILLAGES_REGISTRY } from '../constants/villages';
import { Seller } from '../types/merchant';

export type DeliveryCoverageType = 'LOCAL' | 'NEIGHBOR' | 'OUTSIDE_RANGE';

export interface DeliveryRelationship {
  coverageType: DeliveryCoverageType;
  isServiceable: boolean;
  distanceKm?: number;
  deliveryFeePaise: number;
  badgeLabel?: string;
}

interface VillageContextType {
  activeVillage: Village;
  villages: Village[];
  selectedLandmark: string;
  selectVillage: (villageId: string) => void;
  setLandmark: (landmark: string) => void;
  detectCurrentLocation: () => Promise<string>;
  getDeliveryRelationship: (seller: Seller) => DeliveryRelationship;
}

const VillageContext = createContext<VillageContextType | undefined>(undefined);

export const VillageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeVillageId, setActiveVillageId] = useState<string>(() => {
    return localStorage.getItem('grambazaar_active_village') || 'rampur';
  });

  const [selectedLandmark, setSelectedLandmark] = useState<string>(() => {
    return localStorage.getItem('grambazaar_landmark') || 'Purani Basti';
  });

  const activeVillage =
    MULTI_VILLAGES_REGISTRY.find((v) => v.id === activeVillageId) || MULTI_VILLAGES_REGISTRY[0];

  useEffect(() => {
    localStorage.setItem('grambazaar_active_village', activeVillageId);
  }, [activeVillageId]);

  useEffect(() => {
    localStorage.setItem('grambazaar_landmark', selectedLandmark);
  }, [selectedLandmark]);

  const selectVillage = (id: string) => {
    const found = MULTI_VILLAGES_REGISTRY.find((v) => v.id === id);
    if (found) {
      setActiveVillageId(found.id);
      if (found.popularLandmarks.length > 0) {
        setSelectedLandmark(found.popularLandmarks[0]);
      }
    }
  };

  // Simulates mobile GPS / browser location detection to match closest village
  const detectCurrentLocation = async (): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Automatically resolves to Rampur or Madhopur based on simulation
        const detected = MULTI_VILLAGES_REGISTRY[0];
        setActiveVillageId(detected.id);
        setSelectedLandmark(detected.popularLandmarks[0]);
        resolve(detected.name);
      }, 700);
    });
  };

  /**
   * Calculates delivery relationship and fee based on customer's selected village
   */
  const getDeliveryRelationship = (seller: Seller): DeliveryRelationship => {
    // Case 1: Store is in the exact same village as customer
    if (seller.villageId === activeVillage.id) {
      return {
        coverageType: 'LOCAL',
        isServiceable: true,
        distanceKm: 1.2,
        deliveryFeePaise: seller.deliveryFeePaise,
        badgeLabel: `In ${activeVillage.name}`,
      };
    }

    // Case 2: Store is in a neighboring village that this seller can deliver to
    const isCoveredBySeller = seller.serviceableVillageIds.includes(activeVillage.id);
    const neighborInfo = activeVillage.neighbors.find((n) => n.villageId === seller.villageId);

    if (isCoveredBySeller && neighborInfo) {
      return {
        coverageType: 'NEIGHBOR',
        isServiceable: true,
        distanceKm: neighborInfo.distanceKm,
        deliveryFeePaise: seller.deliveryFeePaise + neighborInfo.interVillageFeePaise,
        badgeLabel: `From ${seller.villageName} (${neighborInfo.distanceKm} km)`,
      };
    }

    // Case 3: Outside delivery range
    return {
      coverageType: 'OUTSIDE_RANGE',
      isServiceable: false,
      deliveryFeePaise: 0,
      badgeLabel: `Cannot deliver to ${activeVillage.name}`,
    };
  };

  return (
    <VillageContext.Provider
      value={{
        activeVillage,
        villages: MULTI_VILLAGES_REGISTRY,
        selectedLandmark,
        selectVillage,
        setLandmark: setSelectedLandmark,
        detectCurrentLocation,
        getDeliveryRelationship,
      }}
    >
      {children}
    </VillageContext.Provider>
  );
};

export function useVillage(): VillageContextType {
  const context = useContext(VillageContext);
  if (!context) {
    throw new Error('useVillage must be used within a VillageProvider');
  }
  return context;
}

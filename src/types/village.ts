/**
 * Village & Location Domain Types
 * Scalable to N multiple villages with dynamic geo-serviceability.
 */

export interface VillageNeighbor {
  villageId: string;
  distanceKm: number;
  interVillageFeePaise: number;
}

export interface Village {
  id: string;
  name: string;
  hindiName?: string;
  district: string;
  state: string;
  postalCodes: string[];
  activeStoresCount: number;
  foodStoresCount: number;
  groceryStoresCount: number;
  isActive: boolean;
  popularLandmarks: string[];
  neighbors: VillageNeighbor[];
}

export interface CustomerAddress {
  id: string;
  userId: string;
  recipientName: string;
  recipientPhone: string;
  villageId: string;
  villageName: string;
  addressLine1: string;
  landmark: string; // Mandatory for rural addresses
  addressLabel: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
  createdAt: string;
}

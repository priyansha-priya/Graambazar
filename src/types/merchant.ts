/**
 * Merchant / Seller Domain Types
 * Supports multi-village serviceability mapping.
 */

export type SellerType = 'RESTAURANT' | 'DHABA' | 'KIRANA' | 'BAKERY' | 'SNACKS';

export type SellerStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type FulfilmentMode = 'DELIVERY' | 'PICKUP';

export interface OperatingHours {
  openingTime: string; // e.g. "08:00 AM"
  closingTime: string; // e.g. "09:30 PM"
  closedDays: string[]; // e.g. ["Tuesday"]
}

export interface Seller {
  id: string;
  ownerUserId: string;
  publicName: string;
  sellerType: SellerType;
  primaryVertical: 'FOOD' | 'GROCERY' | 'BOTH';
  description?: string;
  contactPhone: string;
  villageId: string;
  villageName: string;
  serviceableVillageIds: string[]; // List of villages this seller delivers to
  addressLine: string;
  status: SellerStatus;
  isOpenNow: boolean;
  isPaused: boolean; // Manual pause overrides hours
  fulfilmentModes: FulfilmentMode[];
  deliveryRadiusKm: number;
  minimumOrderPaise: number;
  packagingFeePaise: number;
  deliveryFeePaise: number;
  operatingHours: OperatingHours;
  fssaiNumber?: string;
  bannerUrl?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

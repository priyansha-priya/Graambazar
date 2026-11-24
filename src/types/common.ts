/**
 * Common TypeScript Domain Types
 */

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: { field: string; issue: string }[];
    requestId?: string;
  };
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type UserRole =
  | 'GUEST'
  | 'CUSTOMER'
  | 'SELLER_OWNER'
  | 'SELLER_STAFF'
  | 'SELLER_RUNNER'
  | 'SUPER_ADMIN'
  | 'ADMIN_OPS'
  | 'ADMIN_FINANCE'
  | 'ADMIN_SUPPORT';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  displayName: string;
  roles: UserRole[];
  activeVillageId?: string;
  createdAt: string;
}

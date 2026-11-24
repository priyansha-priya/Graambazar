# GramBazaar — React Folder & File Architecture (Sub-Phase 1.10)

This document establishes the **Feature-Based React Architecture** for GramBazaar. It defines the folder tree and explains the role, responsibilities, imports, and exports of each key file.

---

## 1. Directory Tree Overview

```
src/
├── assets/                  # Brand vectors, village badges, illustrations
├── config/                  # Centralized theme tokens, breakpoints, navigation
│   ├── theme.ts             # Palette, typography, spacing, dimensions
│   └── navigation.ts        # Role-based menu links and breadcrumb trees
├── types/                   # Strict TypeScript domain interfaces
│   ├── common.ts            # ApiResponse, Pagination, Idempotency
│   ├── village.ts           # Village, ServiceArea, Landmark
│   ├── merchant.ts          # Seller, OperatingHours, FulfilmentModes
│   ├── product.ts           # Product, FoodAttributes, GroceryAttributes, Units
│   ├── order.ts             # Order, OrderItem, OrderEvent, FulfilmentStatus
│   └── credit.ts            # UdhariSettings, CustomerCredit, LedgerEntry, Dispute
├── constants/               # Master enums, village list, seed presets
│   ├── villages.ts          # Rampur and Madhopur master configurations
│   ├── units.ts             # Standard measurement units and conversion factors
│   └── orderStatus.ts       # State machine status codes and badge mappings
├── utils/                   # Pure helper functions
│   ├── currency.ts          # Paise-to-Rupees formatting (formatINR)
│   ├── dates.ts             # UTC-to-local date/time display
│   ├── units.ts             # Quantity step validation & conversions
│   └── validation.ts        # Indian phone regex, landmark validator
├── hooks/                   # Custom reusable React hooks
│   ├── useVillage.ts        # Access active village context & serviceability
│   ├── useCart.ts           # Access single-seller cart, line totals, quote
│   ├── useAuth.ts           # User profile, role verification, token state
│   └── useDebounce.ts       # Search input debouncing
├── contexts/                # React Context providers for global state
│   ├── VillageContext.tsx   # Persisted village selection state
│   ├── CartContext.tsx      # In-memory & local-persisted single-seller cart
│   └── AuthContext.tsx      # Current user session and role guard state
├── components/              # Shared Reusable Design System Components
│   ├── ui/                  # Atoms: Button, Input, Select, Badge, Tabs, Modal, Drawer
│   ├── feedback/            # Loader, EmptyState, ConfirmDialog, Toast
│   ├── data-display/        # KPICard, DataTable, Pagination, StatusPill
│   └── layout/              # Header, ResponsiveSidebar, MobileNavbar, Breadcrumbs
├── layouts/                 # Page shell layouts per user role
│   ├── CustomerLayout.tsx   # Village header badge, search shortcut, mobile bottom nav
│   ├── SellerLayout.tsx     # Merchant sidebar, live order buzzer, store open switch
│   └── AdminLayout.tsx      # Collapsible enterprise sidebar, top breadcrumb bar
├── features/                # Modular feature slices (UI, hooks, sub-components)
│   ├── customer/            # Customer screens: Home, StoreView, Search, Profile
│   ├── catalog/             # Product cards, Food dish modal, Grocery quantity selector
│   ├── cart/                # Cart line list, bill breakdown, cross-seller conflict modal
│   ├── checkout/            # Address selector, payment selection, order confirm CTA
│   ├── orders/              # Live order timeline tracker, order history list
│   ├── seller/              # Dashboard KPIs, Live order terminal, Menu manager, Inventory
│   ├── admin/               # KYC applications, Seller directory, Service areas, Fee rules
│   └── udhari/              # Seller credit console, Customer "My Udhar", Repayment drawer
├── services/                # API client abstraction layer
│   ├── apiClient.ts         # Axios/Fetch wrapper with standard error envelopes & idempotency
│   ├── catalogService.ts    # Fetch stores, dishes, groceries, local units
│   ├── orderService.ts      # Create order, state transitions, timeline polling
│   └── udhariService.ts     # Ledger queries, credit limits, repayment postings
├── routes/                  # React Router configuration
│   ├── AppRoutes.tsx        # Central route tree declarations
│   └── RoleGuard.tsx        # Route authorization protecting Seller and Admin routes
├── styles/                  # Global styles & Tailwind entry
│   └── globals.css          # Tailwind imports, font definitions
├── App.tsx                  # Root app provider orchestration
└── main.tsx                 # DOM mounting entry point
```

---

## 2. Key File Responsibilities & Interaction Architecture

### 2.1 Theme & Design Configuration (`src/config/theme.ts`)
- **Contents**: Exports `themeColors`, `themeTypography`, `themeSpacing`, and `themeBreakpoints`.
- **Imported By**: Tailwind config, UI components (`Button.tsx`, `Badge.tsx`, `DataTable.tsx`), Layouts.
- **Why It Exists**: Eliminates arbitrary utility values and guarantees that changing brand green (`#218838`) or card backgrounds centrally updates all 35+ screens simultaneously.

### 2.2 Global State Contexts (`src/contexts/`)
- `VillageContext.tsx`:
  - **Responsibility**: Stores the customer's selected village (e.g., `Rampur`). Persists to `localStorage`.
  - **Exports**: `useVillage()` hook providing `activeVillage`, `selectVillage(id)`, and `isServiceable(sellerVillage)`.
- `CartContext.tsx`:
  - **Responsibility**: Manages the single-seller active cart. Automatically computes item subtotal in paise, applies packaging fees, and manages the cross-seller conflict prompt when a customer attempts to add an item from a different shop.
  - **Exports**: `useCart()` hook providing `cart`, `addItem()`, `updateQuantity()`, `removeItem()`, `clearCart()`.
- `AuthContext.tsx`:
  - **Responsibility**: Tracks whether the user is a `Guest`, `Customer`, `Seller`, or `Admin`. Handles OTP login flow and role-based redirecting.

### 2.3 Polymorphic Product Modeling (`src/types/product.ts`)
- **Contents**:
  ```typescript
  export type CatalogueType = 'FOOD' | 'GROCERY';
  export type QuantityMode = 'FIXED_PACK' | 'PREDEFINED_OPTIONS' | 'CUSTOM_QUANTITY';

  export interface BaseProduct {
    id: string;
    sellerId: string;
    categoryId: string;
    name: string;
    description?: string;
    catalogueType: CatalogueType;
    pricePaise: number;
    unitBasis: string;
    active: boolean;
    imageUrl?: string;
  }

  export interface FoodProduct extends BaseProduct {
    catalogueType: 'FOOD';
    dietType: 'VEG' | 'NON_VEG' | 'EGG';
    preparationTimeMinutes: number;
    portionOptions?: { name: string; priceDeltaPaise: number }[];
    addons?: { name: string; priceDeltaPaise: number }[];
  }

  export interface GroceryProduct extends BaseProduct {
    catalogueType: 'GROCERY';
    quantityMode: QuantityMode;
    allowedUnits: string[]; // e.g. ['250g', '500g', '1kg', 'pav']
    sellerLocalUnit?: { label: string; definition: string; conversionGrams: number };
    minQuantity: number;
    quantityStep: number;
    trackStock: boolean;
    stockQuantity?: number;
  }
  ```
- **Why It Exists**: Ensures Food and Grocery behaviors stay distinct in UI components while sharing an extensible foundation capable of ingesting future categories (*Agriculture, Hardware, Apparel*).

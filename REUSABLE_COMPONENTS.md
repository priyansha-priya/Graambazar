# GramBazaar — Reusable Component Catalogue (Sub-Phase 1.9)

This document details the **20 Reusable Design System Components** that ensure visual consistency, accessibility, and zero-code duplication across the entire GramBazaar codebase.

---

## 1. Button (`src/components/ui/Button.tsx`)
- **Purpose**: Interactive trigger for actions, forms, and workflows.
- **Design Standard**: Rounded pill (`rounded-full`) with visible focus ring and touch target $\ge 44\text{px}$.
- **Variants**:
  - `primary`: Background `#218838`, text white, hover `#176B2C`.
  - `secondary`: Background white, border `1px solid #E5E7EB`, text `#1F2937`, hover `#F8FAFC`.
  - `outline`: Border `1.5px solid #218838`, text `#218838`, hover `#E8F5E9`.
  - `destructive`: Background `#DC2626`, text white, hover `#B91C1C`.
  - `ghost`: Transparent background, text `#1F2937`, hover `#F1F5F9`.
- **Sizes**: `sm` (32px), `md` (42px, default), `lg` (50px, full-width checkout CTA).
- **Props**: `variant`, `size`, `isLoading`, `leftIcon`, `rightIcon`, `disabled`, `fullWidth`, `children`.
- **Accessibility**: Native `<button>`, `aria-disabled`, `aria-busy` when loading, visible `focus-visible:ring-2 ring-[#218838] ring-offset-2`.

---

## 2. Form Input (`src/components/ui/Input.tsx`)
- **Purpose**: Single-line text, number, and telephone data entry.
- **Variants**: `default`, `error`, `success`.
- **Props**: `label`, `error`, `helperText`, `required`, `leftIcon`, `rightAddon` (e.g. `+91`), `id`, `name`, `type`, `value`, `onChange`.
- **Design Standard**: Height 44px (`h-11`), border `border-[#E5E7EB]`, focus border `focus:border-[#218838] focus:ring-1 focus:ring-[#218838]`, text-sm.
- **States**: Default, Focused, Filled, Disabled, Error (red border + message below).

---

## 3. Select Dropdown (`src/components/ui/Select.tsx`)
- **Purpose**: Accessible single-choice dropdown selection for categories, units, and reasons.
- **Props**: `label`, `options: { label: string; value: string | number }[]`, `value`, `onChange`, `error`, `placeholder`, `disabled`.
- **Design Standard**: Height 44px, custom chevron-down icon from Lucide React, consistent border and focus states.

---

## 4. Status Badge / Pill (`src/components/ui/Badge.tsx`)
- **Purpose**: Communicates order state, diet type (Veg/Non-veg), and KYC status.
- **Variants**:
  - `success` (Green): Background `#DCFCE7`, text `#166534`.
  - `warning` (Amber): Background `#FEF3C7`, text `#92400E`.
  - `error` (Red): Background `#FEE2E2`, text `#991B1B`.
  - `info` (Blue): Background `#DBEAFE`, text `#1E40AF`.
  - `neutral` (Gray): Background `#F1F5F9`, text `#475569`.
- **Props**: `variant`, `size` (`sm` | `md`), `dot` (boolean indicator dot), `children`.
- **Accessibility**: Never relies solely on color; includes descriptive screen-reader text.

---

## 5. KPI Metric Card (`src/components/data-display/KPICard.tsx`)
- **Purpose**: Displays high-level analytics, GMV, and order counters.
- **Props**: `title`, `value`, `icon: LucideIcon`, `trend?: { value: number; isPositive: boolean }`, `helperText`, `variant?: 'default' | 'highlight'`.
- **Structure**: Clean white card (`rounded-xl p-5 border border-[#E5E7EB]`), icon inside a 40x40px tinted rounded square, large metric in bold 24px (`text-2xl font-bold text-[#1F2937]`).

---

## 6. Data Table (`src/components/data-display/DataTable.tsx`)
- **Purpose**: Standard tabular rendering for Admin orders, Seller inventory, and KYC lists.
- **Props**:
  - `columns: { key: string; header: string; width?: string; align?: 'left' | 'center' | 'right'; render?: (row: T) => ReactNode }[]`
  - `data: T[]`
  - `isLoading: boolean`
  - `emptyMessage: string`
  - `onRowClick?: (row: T) => void`
- **Design Standard**: White card wrapper, subtle header background `#F8FAFC`, header typography `text-xs font-semibold uppercase text-[#6B7280]`, row height 52px, zebra hover `#F8FAFC`.
- **Mobile Treatment**: Automatic transition from grid table to stacked responsive cards on viewports $< 768\text{px}$.

---

## 7. Pagination Controls (`src/components/data-display/Pagination.tsx`)
- **Purpose**: Page navigation for growing administrative and merchant records.
- **Props**: `currentPage`, `totalPages`, `pageSize`, `totalRecords`, `onPageChange(page: number)`.
- **Visuals**: Displays *"Showing 1 to 15 of 124 results"* with Previous/Next pill buttons and active page indicator.

---

## 8. Tabs Switcher (`src/components/ui/Tabs.tsx`)
- **Purpose**: Tabbed navigation between Food and Grocery or order queues.
- **Variants**:
  - `pill`: Large rounded pill switch (used for Top-level Food 🍔 vs Grocery 🛒).
  - `underline`: Enterprise administrative tab with bottom active border indicator `#218838`.
- **Props**: `tabs: { id: string; label: string; icon?: LucideIcon; count?: number }[]`, `activeTab`, `onChange`.

---

## 9. Modal Dialog (`src/components/ui/Modal.tsx`)
- **Purpose**: Focused interactive dialog for customization, confirmations, and rejections.
- **Props**: `isOpen`, `onClose`, `title`, `description?`, `children`, `footer?`, `size?: 'sm' | 'md' | 'lg'`.
- **Design Standard**: Centered overlay with backdrop blur `backdrop-blur-sm bg-black/50`, card container `rounded-2xl bg-white p-6 shadow-2xl`, top-right `X` close icon, accessible focus trap (`Esc` key dismiss).

---

## 10. Drawer / Slide-Over (`src/components/ui/Drawer.tsx`)
- **Purpose**: Deep inspection panels for Order Timeline, KYC Document Review, and Record Repayment.
- **Props**: `isOpen`, `onClose`, `title`, `position?: 'right' | 'bottom'`, `children`.
- **Design Standard**: Smooth slide-in transition from right (desktop) or bottom sheet (mobile), full height, fixed action footer.

---

## 11. Breadcrumbs (`src/components/layout/Breadcrumbs.tsx`)
- **Purpose**: Wayfinding navigation for multi-tier desktop routes.
- **Props**: `items: { label: string; href?: string }[]`.
- **Visuals**: `Home / Rampur / Sharma Dhaba` with chevron-right dividers (`text-xs text-[#6B7280]`).

---

## 12. Page Header (`src/components/layout/PageHeader.tsx`)
- **Purpose**: Uniform title block for all screens.
- **Props**: `title`, `description?`, `breadcrumbs?`, `actions?: ReactNode`.
- **Structure**: Breadcrumbs at top, bold title (24px) on left, action pill buttons on right, divider border below.

---

## 13. Empty State (`src/components/feedback/EmptyState.tsx`)
- **Purpose**: Clear, friendly guidance when no records, cart items, or search results exist.
- **Props**: `icon: LucideIcon`, `title`, `description`, `actionButton?: { label: string; onClick: () => void }`.
- **Visuals**: Light green circle icon container, centered text, actionable pill CTA button.

---

## 14. Confirmation Dialog (`src/components/feedback/ConfirmDialog.tsx`)
- **Purpose**: Protect against accidental destructive actions (e.g., clearing cart, suspending seller).
- **Props**: `isOpen`, `title`, `message`, `confirmText`, `cancelText`, `isDestructive?`, `onConfirm`, `onCancel`.

---

## 15. Loading Spinner & Skeleton (`src/components/feedback/Loader.tsx`)
- **Purpose**: Prevent layout shift (CLS) during API fetching.
- **Components**:
  - `Spinner`: Smooth rotating SVG wheel in Primary Green `#218838`.
  - `Skeleton`: Pulsing neutral placeholder rectangles for card grids, tables, and product images.

---

## 16. Quantity & Unit Selector (`src/features/catalog/components/QuantitySelector.tsx`)
- **Purpose**: Handles both standard increments (250g, 500g, 1kg) and seller local units (*1 pav*).
- **Props**: `priceBasis`, `allowedUnits`, `sellerLocalUnit?`, `currentQty`, `onChange`.
- **Features**: Live recalculation of price estimate, step-increment enforcement, and seller-unit definition tooltip.

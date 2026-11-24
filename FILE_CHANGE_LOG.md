# GramBazaar – File Change Log & Repository Inventory

**Audit Date:** November 2, 2026  
**Repository Branch:** main  
**Total Tracked Source Files:** 52 code/config files + 18 documentation files

---

## 1. Complete File Tree Inventory

```
/
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── DOCUMENTATION ARCHITECTURE:
│   ├── PROJECT_OVERVIEW.md
│   ├── PROJECT_CONTEXT.md
│   ├── MODULE_BREAKDOWN.md
│   ├── PAGE_WISE_UI_SPECIFICATION.md
│   ├── PAGE_WISE_FORM_FIELDS.md
│   ├── PAGE_WISE_TABLE_SPECIFICATION.md
│   ├── IMAGE_AND_MEDIA_GUIDELINES.md
│   ├── DESIGN_SYSTEM.md
│   ├── REUSABLE_COMPONENTS.md
│   ├── REACT_FOLDER_STRUCTURE.md
│   ├── ROUTE_MAP.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── PROJECT_PROGRESS_TRACKER.md
│   ├── COMPLETED_WORK_RECORD.md
│   ├── PENDING_TASKS.md
│   ├── FILE_CHANGE_LOG.md
│   ├── REQUIREMENT_COVERAGE_MATRIX.md
│   └── TESTING_REPORT.md
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    │
    ├── components/
    │   ├── ui/
    │   │   ├── Badge.tsx
    │   │   ├── Button.tsx
    │   │   ├── Drawer.tsx
    │   │   ├── Input.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Select.tsx
    │   │   └── Tabs.tsx
    │   ├── data-display/
    │   │   ├── DataTable.tsx
    │   │   ├── KPICard.tsx
    │   │   └── Pagination.tsx
    │   ├── feedback/
    │   │   ├── ConfirmDialog.tsx
    │   │   ├── EmptyState.tsx
    │   │   └── Loader.tsx
    │   └── layout/
    │       ├── AdminSidebar.tsx
    │       ├── Breadcrumbs.tsx
    │       ├── CustomerDrawer.tsx
    │       ├── PageHeader.tsx
    │       └── SellerSidebar.tsx
    │
    ├── config/
    │   └── theme.ts
    │
    ├── constants/
    │   ├── categories.ts
    │   ├── mockData.ts
    │   └── villages.ts
    │
    ├── contexts/
    │   ├── AdminContext.tsx
    │   ├── CartContext.tsx
    │   ├── OrderContext.tsx
    │   ├── SellerContext.tsx
    │   ├── UdhariContext.tsx
    │   └── VillageContext.tsx
    │
    ├── features/
    │   ├── admin/
    │   │   ├── components/
    │   │   │   ├── AdminOrderDetailDrawer.tsx
    │   │   │   └── DocumentPreviewModal.tsx
    │   │   ├── AdminAuditLogsView.tsx
    │   │   ├── AdminCategoriesView.tsx
    │   │   ├── AdminDashboardView.tsx
    │   │   ├── AdminFeeRulesView.tsx
    │   │   ├── AdminOrdersView.tsx
    │   │   ├── AdminSellerApplicationsView.tsx
    │   │   ├── AdminSellerDirectoryView.tsx
    │   │   ├── AdminServiceAreasView.tsx
    │   │   ├── AdminSupportView.tsx
    │   │   └── AdminVerticalsView.tsx
    │   ├── cart/
    │   │   └── CartView.tsx
    │   ├── catalog/
    │   │   └── components/
    │   │       ├── FoodDishCard.tsx
    │   │       ├── GroceryItemCard.tsx
    │   │       └── QuantitySelector.tsx
    │   ├── checkout/
    │   │   └── CheckoutView.tsx
    │   ├── customer/
    │   │   └── components/
    │   │       ├── StoreCard.tsx
    │   │       ├── StorefrontView.tsx
    │   │       └── VillageSelectorModal.tsx
    │   ├── orders/
    │   │   ├── components/
    │   │   │   └── GranularOrderStatusTracker.tsx
    │   │   ├── OrderHistoryView.tsx
    │   │   └── OrderTrackingView.tsx
    │   ├── seller/
    │   │   ├── SellerAnalyticsView.tsx
    │   │   ├── SellerCatalogView.tsx
    │   │   ├── SellerDashboardView.tsx
    │   │   ├── SellerDispatchView.tsx
    │   │   ├── SellerOrdersTerminal.tsx
    │   │   └── SellerSettingsView.tsx
    │   └── udhari/
    │       ├── CustomerUdharView.tsx
    │       └── SellerUdhariView.tsx
    │
    ├── types/
    │   ├── admin.ts
    │   ├── common.ts
    │   ├── credit.ts
    │   ├── merchant.ts
    │   ├── order.ts
    │   ├── product.ts
    │   └── village.ts
    │
    └── utils/
        ├── currency.ts
        ├── dates.ts
        └── validation.ts
```

---

## 2. Chronological Creation & Modification Record

| Batch / Event | Files Impacted | Rationale & Changes |
|---|---|---|
| **Initial Foundation & Phase 1 Blueprint** | 12 root `.md` files, `package.json`, `index.html`, `metadata.json`, `vite.config.ts` | Established project specifications, folder structure, design constitution, route hierarchy, and project dependencies. |
| **Phase 2: Design Tokens & Reusable UI** | `/src/config/theme.ts`, `/src/components/ui/*`, `/src/components/data-display/*`, `/src/components/feedback/*`, `/src/components/layout/*`, `/src/index.css` | Implemented centralized theme tokens, custom Tailwind v4 palette, and 18 atomic components. |
| **Phase 3: Multi-Village Discovery & Dual Catalog** | `/src/contexts/VillageContext.tsx`, `/src/constants/villages.ts`, `/src/constants/categories.ts`, `/src/constants/mockData.ts`, `/src/types/*`, `/src/features/customer/*`, `/src/features/catalog/*` | Created village detection engine, food dish cards with spice/veg badges, grocery cards with weight selectors, and storefront view. |
| **Phase 4: Cart Integrity & Rural Checkout** | `/src/contexts/CartContext.tsx`, `/src/contexts/OrderContext.tsx`, `/src/features/cart/CartView.tsx`, `/src/features/checkout/CheckoutView.tsx`, `/src/features/orders/*` | Built single-seller cart conflict validator, landmark picker, cash on delivery / UPI QR / udhari payment options, order state machine, and live order tracking. |
| **Phase 5: Seller Terminal & Store Analytics** | `/src/contexts/SellerContext.tsx`, `/src/features/seller/*` | Implemented real-time order queue terminal with acoustic alerts, dispatch runner assignment, catalog inventory manager, store settings, and analytics dashboard with daily volume charts. |
| **Phase 6: Trust-Based Udhari Khata Ledger** | `/src/contexts/UdhariContext.tsx`, `/src/types/credit.ts`, `/src/features/udhari/*` | Created merchant khata manager, pending credit approval workflow, repayment ledger, customer account view, and receipt generator. |
| **Phase 7: Super Admin Suite Expansion** | `/src/contexts/AdminContext.tsx`, `/src/types/admin.ts`, `/src/features/admin/*` (10 views), `/src/components/layout/AdminSidebar.tsx`, `/src/App.tsx` | Built complete 10-view administrative control deck, multi-village switcher, fee rules engine, merchant KYC approval workflow, and immutable audit logs. |
| **Audit & Documentation Hardening** | 6 tracking documents: `PROJECT_PROGRESS_TRACKER.md`, `COMPLETED_WORK_RECORD.md`, `PENDING_TASKS.md`, `FILE_CHANGE_LOG.md`, `REQUIREMENT_COVERAGE_MATRIX.md`, `TESTING_REPORT.md` | Formalized verifiable project audit, file mapping, coverage matrix, and test reports. |
| **Granular Status Tracking in Order History** | `/src/features/orders/components/GranularOrderStatusTracker.tsx`, `/src/features/orders/OrderHistoryView.tsx`, `/src/utils/dates.ts`, `/src/contexts/OrderContext.tsx` | Created granular milestone tracker for customer order history displaying 'Accepted', 'Preparing', 'Out for Delivery', and 'Delivered' with visual progress indicators, event timestamps, handover OTP display, and interactive timeline details. |
| **Phase 7: Admin Panel Frontend Completion** | `/src/utils/exportCsv.ts`, `/src/features/admin/components/DocumentPreviewModal.tsx`, `/src/features/admin/AdminSellerApplicationsView.tsx`, `/src/features/admin/AdminOrdersView.tsx`, `/src/features/admin/AdminSellerDirectoryView.tsx`, `/src/features/admin/AdminAuditLogsView.tsx`, `/src/features/admin/AdminFeeRulesView.tsx`, `/src/contexts/AdminContext.tsx` | Implemented ADM-02 (localStorage audit trail and state persistence with purge/reset handlers), ADM-03 (client-side CSV generator with UTF-8 BOM integrated into Orders, Seller Directory, Audit Trail, and Fee Rules), and ADM-04 (zoomable/rotatable KYC document preview lightbox supporting FSSAI, Aadhaar, PAN, and Storefront inspection photo). |
| **Admin Orders Detailed View & Item Breakdown** | `/src/features/admin/components/AdminOrderDetailDrawer.tsx`, `/src/features/admin/AdminOrdersView.tsx` | Added comprehensive AdminOrderDetailDrawer component allowing administrators to click any order row or inspect button to view complete itemized breakdown (quantities, units, prices, customer notes), subtotal, delivery fee, packaging fee, platform fee, grand total in INR, customer & delivery destination (rural landmark, village, phone), merchant shop details, runner dispatch status, status override controls, printable slip generator, and WhatsApp slip exporter without leaving `/admin/orders`. |

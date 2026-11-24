# GramBazaar — Routing & Navigation Map (Sub-Phase 1.11)

This document maps all application routes, layout wrappers, allowed roles, menu labels, and authorization statuses.

---

## 1. Master Route Map

| Route Path | Page Component | Layout Shell | Allowed Roles | Menu Label | Parent Menu | Access Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `SplashPage` | None (Fullscreen) | Guest, All | None | None | Public |
| `/select-village` | `VillageSelectPage` | CustomerLayout | Guest, All | Select Village | Header | Public |
| `/auth/login` | `CustomerLoginPage` | CustomerLayout | Guest | Login | Header | Public |
| `/home` | `CustomerHomePage` | CustomerLayout | Guest, Customer | Home | BottomNav / TopNav | Public / Optional Auth |
| `/search` | `SearchPage` | CustomerLayout | Guest, Customer | Search | BottomNav / TopNav | Public |
| `/store/:sellerId` | `StorefrontPage` | CustomerLayout | Guest, Customer | Storefront | None (Dynamic) | Public |
| `/cart` | `CartPage` | CustomerLayout | Guest, Customer | Cart | TopNav / FloatingBar | Public (Auth at checkout) |
| `/checkout` | `CheckoutPage` | CustomerLayout | Customer | Checkout | Cart | **Protected (Customer)** |
| `/order-success/:id`| `OrderSuccessPage`| CustomerLayout | Customer | Order Confirmed | None (Post-Order) | **Protected (Owner)** |
| `/orders/:orderId` | `OrderTrackingPage`| CustomerLayout | Customer, Admin | Track Order | Orders | **Protected (Owner/Admin)** |
| `/orders` | `OrderHistoryPage` | CustomerLayout | Customer | My Orders | BottomNav / Profile | **Protected (Customer)** |
| `/profile` | `CustomerProfilePage`| CustomerLayout| Customer | Profile | BottomNav / TopNav | **Protected (Customer)** |
| `/my-udhar` | `CustomerUdharPage` | CustomerLayout | Customer | My Udhar | Profile / Menu | **Protected (Customer)** |
| `/support` | `SupportTicketPage`| CustomerLayout | Customer | Support & Help | Profile / Footer | **Protected (Customer)** |
| `/seller/register` | `SellerRegisterPage`| PublicShell | Guest, Merchant| Register Shop | Header / Footer | Public |
| `/seller/login` | `SellerLoginPage` | PublicShell | Seller Roles | Seller Login | Header | Public |
| `/seller/dashboard` | `SellerDashboard` | SellerLayout | Seller Owner/Staff| Dashboard | Sidebar Root | **Protected (Seller)** |
| `/seller/orders` | `SellerOrdersPage` | SellerLayout | Seller Owner/Staff| Live Orders | Sidebar Root | **Protected (Seller)** |
| `/seller/catalog` | `SellerCatalogPage`| SellerLayout | Seller Owner/Staff| Menu & Catalog | Sidebar Root | **Protected (Seller)** |
| `/seller/inventory` | `SellerInventoryPage`| SellerLayout | Seller Owner/Staff| Inventory & Pav | Sidebar Root | **Protected (Seller)** |
| `/seller/profile` | `SellerProfilePage`| SellerLayout | Seller Owner | Store Settings | Sidebar Root | **Protected (Seller Owner)** |
| `/seller/udhari` | `SellerUdhariPage` | SellerLayout | Seller Owner/Cashier| Udhari Ledger | Sidebar Root | **Protected (Seller Finance)**|
| `/seller/dispatch` | `SellerDispatchPage`| SellerLayout | Seller Staff/Runner| Dispatch Runner | Sidebar Root | **Protected (Seller Staff)** |
| `/admin/login` | `AdminLoginPage` | PublicShell | Admin Roles | Admin Login | Direct URL | Public |
| `/admin/dashboard` | `AdminDashboardPage`| AdminLayout | Super Admin, Ops | Overview | Sidebar Root | **Protected (Admin)** |
| `/admin/seller-applications`| `KYCReviewPage`| AdminLayout | Super Admin, Ops | Seller KYC | Sidebar: Merchants | **Protected (Admin Ops)** |
| `/admin/sellers` | `SellerDirectoryPage`| AdminLayout | Super Admin, Ops | Seller Directory| Sidebar: Merchants | **Protected (Admin Ops)** |
| `/admin/categories` | `CategoryMasterPage`| AdminLayout | Super Admin, Catalog| Categories | Sidebar: Catalog | **Protected (Admin Catalog)**|
| `/admin/service-areas`| `ServiceAreasPage`| AdminLayout | Super Admin | Villages & Areas| Sidebar: Logistics | **Protected (Super Admin)** |
| `/admin/fee-rules` | `FeeRulesPage` | AdminLayout | Super Admin, Finance| Fee Rules | Sidebar: Finance | **Protected (Admin Finance)** |
| `/admin/orders` | `AdminOrdersPage` | AdminLayout | Super Admin, Support| Order Oversight | Sidebar: Operations | **Protected (Admin Support)** |
| `/admin/support-cases`| `SupportCasesPage`| AdminLayout | Super Admin, Support| Disputes & Cases| Sidebar: Operations | **Protected (Admin Support)** |
| `/admin/audit-logs` | `AuditLogsPage` | AdminLayout | Super Admin, Auditor| Audit Logs | Sidebar: Security | **Protected (Super Admin)** |
| `/admin/ai-controls`| `AIControlsPage` | AdminLayout | Super Admin, Tech | AI Controls | Sidebar: Settings | **Protected (Super Admin)** |
| `/admin/verticals` | `VerticalsConfigPage`| AdminLayout| Super Admin | Multi-Vertical | Sidebar: Settings | **Protected (Super Admin)** |

---

## 2. Navigation Structure & Shell Layouts

### 2.1 Customer Navigation
- **Desktop Header**: Logo, Village Selector Badge (`📍 Rampur ▼`), Search Bar shortcut, Language Switcher (हिन्दी / English), My Udhar link, Cart Button (with counter), User Avatar dropdown.
- **Mobile Bottom Navigation Bar** (Sticky at viewport bottom on screens $< 768\text{px}$):
  1. 🏠 **Home** (`/home`)
  2. 🔍 **Search** (`/search`)
  3. 📋 **Orders** (`/orders`)
  4. 📖 **My Udhar** (`/my-udhar`)
  5. 👤 **Profile** (`/profile`)

### 2.2 Seller Console Navigation
- **Top Bar**: Store Name, Open/Paused live status switch, Audio Buzzer toggle, Profile / Logout.
- **Collapsible Sidebar**:
  - `Dashboard`
  - `Live Orders` (with badge for pending orders)
  - `Menu / Catalog`
  - `Inventory & Units` (*pav* config)
  - `Udhari Khata` (Customer credit ledger)
  - `Dispatch / Runner`
  - `Store Settings`

### 2.3 Admin Suite Navigation
- **Collapsible Enterprise Sidebar**:
  - `Overview`
  - **Merchants**: `Applications & KYC`, `Seller Directory`
  - **Catalog**: `Categories & Taxonomy`, `Product Moderation`
  - **Logistics**: `Villages & Service Areas`
  - **Operations**: `All Orders`, `Support & Disputes`
  - **Financials**: `Fee Rules & Commissions`
  - **System**: `Audit Trail`, `AI Safety Controls`, `Multi-Vertical Config`

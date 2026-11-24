# GramBazaar — Page-Wise UI Specification (Sub-Phases 1.3 & 1.4)

This specification details the **Complete Page Inventory** and **In-Depth UI Specification** for every single Customer, Seller, and Admin page across the GramBazaar platform.

---

## 1. Master Page Inventory & Route Map

| Page ID | Page Name | Panel | Module | Proposed Route | Primary Role | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C01** | Splash / App Bootstrap | Customer | Core Bootstrap | `/` | Guest / All | Initialize app configuration, verify session, detect village. |
| **C02** | Village Selector | Customer | Location Engine | `/select-village` | Guest / Customer | Select active village/hamlet (Rampur or Madhopur). |
| **C03** | Customer Phone Sign-in | Customer | Auth | `/auth/login` | Guest | 10-digit mobile number input, OTP verification, privacy terms. |
| **C04** | Customer Home | Customer | Catalog Engine | `/home` | Guest / Customer | Top-level Food & Grocery tabs, banner notices, nearby shops. |
| **C05** | Search & Results | Customer | Catalog / AI | `/search` | Guest / Customer | Natural language/Hinglish search, category chips, filter drawer. |
| **C06** | Seller Storefront | Customer | Catalog Engine | `/store/:sellerId` | Guest / Customer | Merchant profile, open/pause status, categories, dish/item cards. |
| **C07** | Product Detail & Custom Qty | Customer | Catalog Engine | Modal / Drawer | Guest / Customer | Dish options / Grocery custom quantity (*1 pav*, 250g, 500g, 1kg). |
| **C08** | Customer Cart | Customer | Cart Engine | `/cart` | Customer | Single-seller items, quantity adjustments, itemized subtotal. |
| **C09** | Checkout | Customer | Checkout Engine | `/checkout` | Customer | Address selection, delivery instructions, payment mode (COD/UPI/Udhar). |
| **C10** | Order Confirmation | Customer | Order Engine | `/order-success/:orderId`| Customer | Confirmation stamp, unique order number, estimated prep/dispatch. |
| **C11** | Order Tracking & Live Timeline | Customer | Order Engine | `/orders/:orderId` | Customer | Authoritative status progression, contact seller, cancel (if eligible). |
| **C12** | Order History | Customer | Order Engine | `/orders` | Customer | Active & past orders list, item snapshots, one-tap reorder. |
| **C13** | Customer Profile & Addresses | Customer | Profile Engine | `/profile` | Customer | Manage village delivery addresses with landmarks, phone number. |
| **C14** | Ratings & Feedback | Customer | Review Engine | `/rate-order/:orderId` | Customer | 1–5 star rating, food quality feedback, seller review text. |
| **C15** | Help & Support | Customer | Support Engine | `/support` | Customer | Order issue reporting, complaint ticket generation. |
| **C16** | Customer "My Udhar" | Customer | Udhari Credit | `/my-udhar` | Customer | Seller-specific credit balances, ledger transactions, dispute entry. |
| **S01** | Seller Registration / KYC | Seller | Onboarding | `/seller/register` | Merchant Applicant | Shop registration, owner contact, village, operating hours, docs. |
| **S02** | Seller Dashboard | Seller | Core Console | `/seller/dashboard` | Seller Owner/Staff | Today's orders KPI, sales vs udhari, store open/paused switch. |
| **S03** | Seller Order Processing Hub | Seller | Order Engine | `/seller/orders` | Seller Owner/Staff | Live order cards: Accept (prep time), Reject, Ready, Dispatch, Complete. |
| **S04** | Seller Catalog & Menu Manager| Seller | Catalog Engine | `/seller/catalog` | Seller Owner/Staff | Add/edit dishes & grocery items, price in paise, quantity options. |
| **S05** | Local Unit & Inventory Controller | Seller | Inventory | `/seller/inventory` | Seller Owner/Staff | Define *pav* conversion, stock on-hand, low-stock alerts, out-of-stock. |
| **S06** | Store Profile & Delivery Rules| Seller | Settings | `/seller/profile` | Seller Owner | Delivery radius, minimum order, pickup instructions, business hours. |
| **S07** | Seller Udhari Ledger Console | Seller | Udhari Credit | `/seller/udhari` | Seller Owner/Cashier | Customer credit limits, credit ledger, ageing buckets (1–7d, 8–30d). |
| **S08** | Record Repayment Drawer | Seller | Udhari Credit | Drawer on `/seller/udhari`| Seller Owner/Cashier | Record cash/direct UPI repayment, receipt generation, new balance. |
| **S09** | Delivery Runner Assignment | Seller | Dispatch Engine | `/seller/dispatch` | Seller Staff/Runner | Assign shop boy to out-for-delivery order, recipient phone/landmark. |
| **A01** | Admin Authentication | Admin | Admin Auth | `/admin/login` | Admin Roles | Secure admin login, MFA token verification, session timeout. |
| **A02** | Marketplace Overview | Admin | Dashboard | `/admin/dashboard` | Super Admin / Ops | GMV metrics, order volumes, active sellers per village, dispute summary. |
| **A03** | Seller Application Review | Admin | KYC Governance | `/admin/seller-applications`| Admin / Ops | Review applicant documents, verify shop, Approve/Reject with reason. |
| **A04** | Seller Master Directory | Admin | Seller Ops | `/admin/sellers` | Admin / Ops | Master list of approved sellers, suspend/reactivate with audit reason. |
| **A05** | Category & Taxonomy Master | Admin | Catalog Ops | `/admin/categories` | Admin / Catalog Ops | Food categories, Grocery categories, future vertical schemas. |
| **A06** | Service Area & Villages Hub | Admin | Location Engine | `/admin/service-areas` | Super Admin | Manage Rampur, Madhopur, village polygons, inter-village delivery rules. |
| **A07** | Fee, Commission & Settlement | Admin | Finance | `/admin/fee-rules` | Super Admin / Finance | Versioned commission rates (shadow mode), delivery fee caps. |
| **A08** | Admin Order Oversight | Admin | Order Governance| `/admin/orders` | Admin / Support | Platform-wide search, inspect immutable event history, cancel with reason. |
| **A09** | Support Ticket & Dispute Hub | Admin | Support Ops | `/admin/support-cases` | Admin / Support | Resolve customer complaints, food safety flags, Udhari mismatches. |
| **A10** | Immutable Audit Log | Admin | Security/Audit | `/admin/audit-logs` | Super Admin / Auditor| Append-only log of sensitive admin actions, actor, target, before/after. |
| **A11** | AI Controls & Safety Gateway | Admin | AI Governance | `/admin/ai-controls` | Tech Lead / Admin | AI feature flags, prompt safety templates, model latency/cost tracker. |
| **A12** | Multi-Vertical Schema Config | Admin | Architecture | `/admin/verticals` | Super Admin | Schema configuration for Agriculture, Hardware, Apparel expansions. |

---

## 2. Customer Panel — Detailed UI Specifications

### C01: Splash / App Bootstrap (`/`)
- **Purpose**: Validate active session, fetch public village configuration, and direct user to either Village Selection or Home.
- **Layout**: Centered, distraction-free branding view with progressive loading spinner.
- **Header Actions**: None.
- **Sections**:
  1. Brand Mark: GramBazaar village emblem + tagline (*"Aapke Gaon Ki Apni Dukaan"*).
  2. Status Spinner: Smooth CSS pulsing loader with network connectivity status.
  3. Action Fallback: "Tap to retry" button if offline or backend cold-start occurs.
- **States**: Loading, Network Offline, Service Maintenance.
- **Responsive Treatment**: Fluid centering across mobile (320px–428px) and desktop viewports.

### C02: Village Selector (`/select-village`)
- **Purpose**: Mandatory or editable step defining customer's geographic shopping context.
- **Layout**: Modal dialog on desktop; full-screen bottom sheet on mobile.
- **Header Actions**: "Close" (if village already set); Language Toggle (Hindi / English).
- **Sections**:
  1. Header: *"Apna Gaon Chuniye / Select Your Village"*.
  2. Search Field: Instant filter input for village name or postal pincode.
  3. Village Cards Grid:
     - Card 1: **Rampur** (Active • 18 Open Stores • Food & Grocery Available).
     - Card 2: **Madhopur** (Active • 14 Open Stores • Food & Grocery Available).
     - Card 3: *Nearby Hamlets (Coming Soon)* — disabled state with "Notify Me" pill.
  4. Manual Landmark / Tola Option: Text field for specific locality (*e.g., Purani Basti, Mandir Chowk*).
- **Buttons**: `Confirm Village` (Primary Green Pill button, disabled until selection made).
- **States**: Active selection, Empty search results, Network error.

### C03: Customer Phone Sign-in (`/auth/login`)
- **Purpose**: Secure, passwordless customer authentication using 10-digit Indian mobile number and OTP.
- **Layout**: Clean card container (max-w-md mx-auto) with subtle borders.
- **Sections**:
  1. Step 1 (Phone Input): Prefix `+91`, 10-digit numeric input with live validation. `Get OTP` pill button.
  2. Step 2 (OTP Verification): 6-digit split OTP input boxes, 45-second resend countdown timer, `Verify & Continue` button.
  3. Terms & Privacy notice: Plain text explaining data security and terms.
- **States**: Default, OTP Pending, Resend Active, Rate-limited warning, Invalid code error banner.

### C04: Customer Home (`/home`)
- **Purpose**: Primary discovery hub with prominent Food and Grocery top-level tabs.
- **Breadcrumb**: `Home > [Selected Village: Rampur]`
- **Header Actions**: Village Selector Trigger Badge (*"📍 Rampur ▼"*), Search Bar shortcut, Cart Icon with active badge count, Profile avatar.
- **Layout Sections (Top to Bottom)**:
  1. **Top-Level Vertical Switcher**: Two large, prominent pill-tabs:
     - 🍔 **Food Delivery** (Hot meals, dhabas, fast food, bakery).
     - 🛒 **Grocery & Essentials** (Atta, dal, oil, fresh veggies, dairy).
  2. **Promotional & Village Notices Carousel**: Seasonal harvest notices, festival sweets announcement, store holiday alerts.
  3. **Category Chips Row**: Horizontal scrollable categories corresponding to active tab (e.g. For Food: *Thali, Snacks, Mithai, Biryani, Chai*; For Grocery: *Atta & Rice, Dal & Pulses, Oil & Ghee, Masale, Sabzi*).
  4. **Active & Open Stores Section**: Grid of merchant cards showing shop photo, name, rating badge, prep/packing estimate (*"20-30 min"*), minimum order, and fulfillment badges (*"Seller Delivery"* / *"Pickup Available"*).
  5. **Quick Reorder Shelf** (for logged-in customers with past orders): Horizontal cards of previously ordered items.
- **Responsive Treatment**: 1 column on mobile (320px–640px), 2 columns on tablet (768px), 3–4 columns on desktop (1024px–1440px).

### C05: Search & Results (`/search`)
- **Purpose**: Natural-language and keyword-based discovery across Food and Grocery.
- **Header Actions**: Back button, Search input with clear button, Voice search mic icon.
- **Layout Sections**:
  1. **Search Scope Tabs**: `All`, `Food Only`, `Grocery Only`.
  2. **Filter & Sort Bar**:
     - Filter Chips: `Open Now`, `Pure Veg (Food)`, `In Stock (Grocery)`, `Offers Credit (Udhar)`.
     - Sort Dropdown: `Relevance`, `Rating: High to Low`, `Delivery Time: Fastest`, `Price: Low to High`.
  3. **Results View**: Dual-layout showing matching Stores at top and matching individual Products below.
  4. **Empty State**: Friendly illustration (*"Koshish karein doosra naam khojne ki"*) with suggested popular searches.

### C06: Seller Storefront (`/store/:sellerId`)
- **Purpose**: Showcase an individual merchant's identity, operational status, and complete menu/inventory.
- **Breadcrumb**: `Home > [Village] > [Store Name]`
- **Header Banner**: Store cover image, verified checkmark, FSSAI / registration badge, store open/closed indicator, delivery timing (*"Delivers in 30 mins"*), and minimum order value.
- **Layout Sections**:
  1. **Store Operational Notice**: If paused/closed, prominent amber banner (*"Shop is currently closed. Opens at 8:00 AM"*).
  2. **Store Category Navigation**: Sticky horizontal bar jumping to menu sections.
  3. **Product Listing Grid**:
     - **Food Card Layout**: Dish photo, Veg/Non-veg green/red square icon, title, description, price in ₹, prep time, `ADD` pill button (triggers customization modal if portion/add-ons exist).
     - **Grocery Card Layout**: Product image, brand name, item title, price basis (*"₹60 / kg"*), pack/unit badge, `Choose Quantity` button.
- **Floating Cart Bar**: Appears at bottom if cart has items from this store showing item count, total price in ₹, and `View Cart →` button.

### C07: Product Detail & Custom Quantity Modal (Dialog)
- **Purpose**: Prevent ambiguous purchases by configuring exact portions or weight units before cart entry.
- **For Food Items**:
  - Portions: Radio chips (*Half Plate / Full Plate / Family Pack*).
  - Add-ons: Checkbox list with price deltas (*Extra Raita +₹20, Extra Chutney +₹10*).
  - Special Instructions: Textarea (*e.g., "Kam mirchi rakhna"*).
- **For Grocery Items**:
  - Predefined Weight Chips: `250 g`, `500 g`, `1 kg`, `2 kg`, `5 kg`.
  - Seller-Defined Local Unit Chip (where configured): e.g. `1 pav (250g approx)` with seller note clearly visible.
  - Custom Quantity Input: Structured numeric input + Unit dropdown (*e.g. 1.5 + kg*) with live price calculation: `Estimated Total: ₹90.00`.
  - Step validation message: *"Kripya 250g ke multiples mein order karein"*.
- **Footer Button**: `Add to Cart • ₹[Total]` (Rounded pill).

### C08: Customer Cart (`/cart`)
- **Purpose**: Review order items, quantities, and price breakdown for a single merchant.
- **Layout**: Two-column layout on desktop (Items list on left, Bill summary on right); single-column on mobile.
- **Sections**:
  1. **Seller Header**: Merchant name, village location, and fulfillment mode selector tabs: `🚚 Delivery` vs `🛍️ Pickup`.
  2. **Cart Lines**:
     - Item name, category badge (Food/Grocery).
     - Selected unit/quantity label snapshot (*"1 kg"* or *"Full Plate"*).
     - Minus / Quantity / Plus pill counter.
     - Line total in ₹.
  3. **Cross-Seller Conflict Modal (Conditional)**: If user tries to add an item from Store B while Store A is in cart, dialog pops up: *"Aapke cart mein Sharma Dhaba ke items hain. Kya aap cart ko khali karke Gupta Kirana se order karna chahte hain?"* with buttons: `Keep Existing Cart` and `Clear & Add New`.
  4. **Bill Breakdown Card**:
     - Item Subtotal (₹)
     - Delivery Fee (₹) — *Free or calculated based on village rules*
     - Packaging Charge (₹)
     - Platform Fee (₹0 during pilot)
     - **Grand Total (₹)**
  5. **Checkout Action Button**: `Proceed to Checkout →` (Primary Green Pill).

### C09: Checkout (`/checkout`)
- **Purpose**: Finalize delivery address, delivery instructions, and payment method selection.
- **Breadcrumb**: `Cart > Checkout`
- **Sections**:
  1. **Delivery Address Selector**:
     - Radio selection of saved village addresses.
     - Address card displaying Recipient Name, Mobile, Village, Landmark (*"Near Kali Mandir"*).
     - `+ Add New Address` trigger modal.
  2. **Delivery / Contact Instructions**: Text input for delivery boy (*"Ghar ke paas aake call karein"*).
  3. **Payment Method Options**:
     - `Cash on Delivery (COD)`: Pay cash directly to seller delivery person.
     - `UPI / Direct Store Pay`: QR / UPI handle provided at delivery.
     - `Pay Later / Udhari (Khata)`: Enabled **only** if seller has approved customer credit limit and projected total is within limit. Displays: *"Available Credit: ₹1,500.00 | This Order: ₹450.00"*.
- **Order Placement Button**: `Confirm Order • ₹[Grand Total]` (Triggers idempotent order creation).

### C10: Order Confirmation (`/order-success/:orderId`)
- **Purpose**: Immediate post-purchase reassurance with clear next steps.
- **Visuals**: Animated green checkmark badge, congratulatory message.
- **Order Summary Card**: Order ID (`#GB-2026-0042`), Seller name, Village, Total amount, Payment mode selected.
- **Estimated SLA Note**: *"Sharma Dhaba usually confirms orders in 5 minutes"*.
- **Action Buttons**: `Track Order Status` (Primary), `Continue Shopping` (Secondary Outline).

### C11: Order Tracking & Live Timeline (`/orders/:orderId`)
- **Purpose**: Authoritative status progression and contact point for active order.
- **State Machine Timeline Component**:
  - Step 1: `Order Placed` (Timestamp)
  - Step 2: `Seller Accepted` (Estimated prep time)
  - Step 3: `Preparing / Packing`
  - Step 4: `Ready for Delivery / Pickup`
  - Step 5: `Out for Delivery` (Shows assigned runner name & phone call button)
  - Step 6: `Delivered & Completed`
- **Actions Bar**:
  - `Cancel Order` button (Visible **only** while order status is `placed` and before seller acceptance).
  - `Call Seller` button (Direct phone link to shop owner).
  - `Need Help?` link to support ticket creation.

### C12: Order History (`/orders`)
- **Purpose**: Comprehensive list of past orders with filterable tabs.
- **Tabs**: `Active Orders`, `Past Orders`, `Cancelled`.
- **Order Card**: Order number, date/time, store name, item count, total price, status badge, `View Details` link, `Reorder` button.

### C13: Customer Profile & Addresses (`/profile`)
- **Purpose**: Maintain personal identity and village address book.
- **Sections**:
  1. Profile Info: Name, Verified Phone Number (+91), Preferred Language (Hindi/English).
  2. Saved Addresses List: Cards with default badge, edit button, and delete button.
  3. Address Add/Edit Modal: Full address form with mandatory Landmark input.

### C14: Ratings & Feedback (`/rate-order/:orderId`)
- **Purpose**: Collect verified feedback after order completion.
- **Content**: Seller name, ordered items snapshot, 1–5 Star Rating selector, review comments textarea, food taste/packaging quality tags.

### C15: Help & Support (`/support`)
- **Purpose**: Assist customers with complaints or questions.
- **Sections**:
  1. Quick FAQ accordion (Ordering, Delivery, Udhari, Cancellation).
  2. Raise a Complaint: Select recent order, pick issue category (*Missing item, Damaged pack, Late delivery*), description textarea, submit ticket.

### C16: Customer "My Udhar" Ledger (`/my-udhar`)
- **Purpose**: Transparent ledger showing credit purchases and repayments per seller.
- **Store Credit Cards**: Total Outstanding (₹), Credit Limit (₹), Available Credit (₹), Next Due Date.
- **Transaction Ledger Table**:
  - Columns: `Date`, `Store`, `Entry Type` (*Added to amount owed* vs *Payment received*), `Amount (₹)`, `Running Balance (₹)`, `Receipt/Order ID`.
- **Dispute Entry Trigger**: Link to report mismatch with comment.

---

## 3. Seller Panel — Detailed UI Specifications

### S01: Seller Registration / KYC (`/seller/register`)
- **Purpose**: Structured multi-step vendor application.
- **Step 1: Shop & Owner Details**: Shop name, owner full name, phone number, village selection, address & landmark.
- **Step 2: Business Category & Fulfilment**: Store vertical (*Food Restaurant / Dhaba / Kirana / Bakery*), Fulfilment modes (*Delivery, Pickup, or Both*), Delivery radius in km.
- **Step 3: Operating Schedule & Compliance**: Opening time, closing time, weekly off-day, FSSAI / Trade license number, document image upload.
- **Step 4: Declaration**: *"I confirm the above details are authentic and agree to marketplace terms"*.

### S02: Seller Dashboard (`/seller/dashboard`)
- **Purpose**: High-level store command center.
- **Top Bar**: Store Open / Temporary Pause live switch, New order sound alert indicator.
- **KPI Metrics Cards**:
  1. Today's Total Orders (Count & GMV ₹)
  2. Pending Orders Needing Action (Count)
  3. Cash Collected vs Credit Sales (₹)
  4. Out-of-Stock / Low-Stock Alerts (Count)
- **Recent Orders Table**: Quick snippet of last 5 orders with one-click Accept button.

### S03: Seller Live Order Processing Hub (`/seller/orders`)
- **Purpose**: Real-time kitchen display and grocery packing terminal.
- **Status Filter Tabs**: `Incoming / New`, `Preparing / Packing`, `Ready for Dispatch`, `Out for Delivery`, `Completed`, `Cancelled/Rejected`.
- **Interactive Order Card**:
  - Header: Order ID, customer name, delivery mode badge (*Delivery vs Pickup*), order timer elapsed.
  - Item List: Line items with exact quantities (*e.g. 2 x Full Plate Butter Paneer, 1 x 500g Besan*), special instructions highlighted in amber box.
  - Action Controls:
    - If `New`: Time selector (*"15 min", "25 min", "40 min"*), `Accept Order` (Green), `Reject` (Red with mandatory rejection reason dropdown).
    - If `Preparing`: `Mark Ready for Delivery` button.
    - If `Ready`: Assign delivery runner dropdown, `Dispatch Order` button.
    - If `Out for Delivery`: `Mark Delivered & Collect ₹[Amount]` button.

### S04: Seller Catalog & Menu Manager (`/seller/catalog`)
- **Purpose**: Complete item lifecycle management.
- **Header Actions**: Filter by Category, Search items, `+ Add New Item` button.
- **Item Cards / Table Grid**:
  - Product Image thumbnail, Name, Category.
  - Food Attributes: Veg/Non-Veg badge, preparation time in minutes.
  - Grocery Attributes: Base unit (*kg, g, piece*), stock on hand.
  - Price: Displayed in ₹ (stored in integer paise).
  - Quick Toggle: Live In-Stock / Out-of-Stock switch.
  - Row Actions: `Edit`, `Duplicate`, `Archive`.

### S05: Inventory & Local Units Controller (`/seller/inventory`)
- **Purpose**: Stock tracking and custom village unit definitions.
- **Section 1: Local Measurement Units**:
  - Configure seller-defined units (*e.g. "1 pav = 250 grams", "1 lota = 500 ml", "1 bundle = 10 pieces"*).
  - Add/edit local unit modal with conversion factor.
- **Section 2: Stock Tracking Grid**:
  - Table of tracked products, current stock, low-stock threshold, manual stock adjustment button (*+ / - with reason: Stock arrival, Spoilage, Manual sale*).

### S06: Store Profile & Delivery Settings (`/seller/profile`)
- **Purpose**: Merchant configuration and policies.
- **Sections**:
  - Shop name, description, address, map landmark.
  - Operating hours per day, holiday calendar.
  - Minimum order amount (₹).
  - Delivery charge rule: Free delivery threshold or flat delivery fee.
  - Pickup instructions (*"Shop counter par aakar order number batayein"*).

### S07: Seller Udhari Ledger Console (`/seller/udhari`)
- **Purpose**: Comprehensive customer credit management at seller's own risk.
- **Summary KPI Cards**:
  - Total Outstanding Credit (₹)
  - Overdue Balances > 30 Days (₹)
  - Active Credit Customers (Count)
  - Repayments Received This Month (₹)
- **Customer Credit Directory Table**:
  - Columns: Customer Name, Village, Phone, Credit Limit (₹), Outstanding Balance (₹), Available Credit (₹), Overdue Status, Action (`Record Repayment`, `Adjust Limit`, `View Ledger`).
- **Ageing Reports Tab**: Breakdown of credit buckets: *Current / 1–7 Days / 8–30 Days / 30+ Days Overdue*.

### S08: Record Repayment Drawer (`/seller/udhari/repay`)
- **Purpose**: Post verified cash or direct UPI payments against customer balance.
- **Fields**: Customer selector, Outstanding amount (read-only), Amount received (₹), Payment mode (*Cash / Seller Direct UPI / Bank Transfer*), Reference number, Notes.
- **Actions**: `Post Repayment & Update Ledger` (Includes idempotency deduplication).

### S09: Delivery Runner Assignment (`/seller/dispatch`)
- **Purpose**: Coordinate shop delivery boys.
- **Sections**: Active dispatch queue, Staff runner dropdown (*"Ramesh (Shop Boy)", "Mahesh (Delivery Staff)"*), customer landmark instructions, phone trigger.

---

## 4. Platform Super Admin Suite — Detailed UI Specifications

### A01: Admin Authentication (`/admin/login`)
- **Purpose**: Restrict access to authorized marketplace staff with role-based privilege checks.
- **Layout**: Centered enterprise login form, 2FA code input, audit warning statement.

### A02: Marketplace Overview / Health (`/admin/dashboard`)
- **Breadcrumb**: `Admin > Overview`
- **Header Actions**: Date range picker (*Today / Last 7 Days / Month-to-date*), Village filter dropdown (*All / Rampur / Madhopur*), Export Data button.
- **Executive KPI Cards**:
  1. Gross Merchandise Value (GMV ₹)
  2. Total Completed Orders
  3. Active Verified Merchants
  4. Open Customer Disputes / Food Complaints
- **Charts & Visualizations**:
  - Daily Order Volume Bar Chart (Food vs Grocery split).
  - Village-wise GMV comparison.
- **Operational Feeds**: Live system alerts (Seller rejection spikes, low-stock alerts, overdue KYC applications).

### A03: Seller Application Review (`/admin/seller-applications`)
- **Purpose**: Thorough vetting and KYC approval for prospective merchants.
- **Table Columns**: Application ID, Shop Name, Owner Name, Village, Category (*Food/Grocery*), Submission Date, Status (`Pending Review`, `Changes Requested`, `Approved`, `Rejected`), Action (`Review`).
- **Application Review Drawer**:
  - Shop photos, uploaded FSSAI / trade documents viewer with zoom.
  - Reviewer Checklist: Address verification, phone confirmation, hygiene compliance.
  - Decision Buttons: `Approve Seller` (Green), `Request Document Changes` (Amber), `Reject Application` (Red with mandatory audit reason).

### A04: Seller Directory & Moderation (`/admin/sellers`)
- **Purpose**: Oversight of all active, paused, or suspended merchants.
- **Search & Filters**: Search by shop name/owner phone, filter by village, active status, order volume.
- **Table Columns**: Seller ID, Shop Name, Village, Vertical, Total Orders, Lifetime GMV (₹), Rating, Status (`Active`, `Paused`, `Suspended`), Actions (`View Profile`, `Audit History`, `Suspend/Reactivate`).

### A05: Category & Taxonomy Master (`/admin/categories`)
- **Purpose**: Manage universal product taxonomy and future verticals.
- **Tabs**: `Food Categories`, `Grocery Categories`, `Future Verticals (Agriculture, Hardware, Apparel)`.
- **Tree Table**: Category Name, Slug, Parent Category, Active Status, Sort Order, Products Count, Actions (`Edit`, `Deactivate`, `Add Subcategory`).

### A06: Service Area & Delivery Boundaries (`/admin/service-areas`)
- **Purpose**: Configure villages, boundary limits, and delivery radius.
- **Table**: Village Name (*Rampur, Madhopur*), State/District, Postal Codes, Active Status, Registered Sellers Count, Actions (`Edit Bounds`, `Configure Delivery Fee`).

### A07: Fee, Commission & Settlement Governance (`/admin/fee-rules`)
- **Purpose**: Configure financial rules without application code changes.
- **Versioned Rules Table**: Rule Name, Service Area, Merchant Type, Platform Commission % (0% during pilot shadow mode), Delivery Fee Rule, Effective Date Range, Status (`Active`, `Scheduled`, `Archived`).

### A08: Admin Order Oversight (`/admin/orders`)
- **Purpose**: Master order search and exceptional dispute resolution.
- **Filters**: Date range, Order ID, Village, Merchant, Customer Phone, Status.
- **Order Inspector Drawer**: Complete immutable order event history with timestamps, actor IDs, address snapshot, financial breakdown, and administrative cancellation override.

### A09: Support Ticket & Dispute Hub (`/admin/support-cases`)
- **Purpose**: Manage customer grievances and seller disputes.
- **Table**: Case ID, Linked Order, Category (*Missing Item, Food Quality, Udhari Dispute*), Customer, Seller, Priority, Status (`Open`, `Under Investigation`, `Resolved`, `Closed`).
- **Ticket Detail**: Internal investigation notes (hidden from customer), resolution action buttons.

### A10: Immutable Audit Log (`/admin/audit-logs`)
- **Purpose**: Security, compliance, and tamper-evident administrative records.
- **Table**: Timestamp (UTC), Actor ID & Role, Target Entity (*Seller, Fee Rule, Order, Credit Limit*), Action (*APPROVE, SUSPEND, REVERSE, ADJUST*), Reason, Before/After Snapshot JSON viewer.

### A11: AI Health & Controls (`/admin/ai-controls`)
- **Purpose**: Oversight of practical AI assistants.
- **Toggles**: Enable/Disable Smart Search, Enable/Disable Seller Listing Helper, Enable/Disable Support Assistant.
- **Metrics**: API latency, provider fallback rate, search query success rate, token consumption.

### A12: Multi-Vertical Schema Configurator (`/admin/verticals`)
- **Purpose**: Define dynamic attributes for future verticals (e.g. Agriculture: *Seed variety, germination %*; Hardware: *Material, wattage*).
- **Interface**: Field builder defining attribute names, data types, and mandatory flags without altering core checkout engine.

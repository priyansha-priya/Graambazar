# GramBazaar — Page-Wise Table & Listing Specification (Sub-Phase 1.6)

This document specifies **every single table, data listing, and queue** across the Customer, Seller, and Admin surfaces, with exact columns, ordering, filters, formatting, row actions, status badges, and responsive treatments.

---

## 1. Customer Surface Listings

### Table C-TBL-01: Customer Order History (`/orders`)
- **Display Mode**: Responsive Cards on Mobile; High-Density Row Cards on Desktop.
- **Search & Filters**: Search by Store Name or Order ID; Status Filter Tabs (`All`, `Active`, `Delivered`, `Cancelled`).
- **Sorting**: Date/Time (Newest first, default).
- **Pagination**: 10 orders per page (Cursor-based infinite scroll or numbered pagination).
- **Exact Columns / Row Attributes**:
  1. `Order ID`: e.g. `#GB-2026-0042` (Bold mono font).
  2. `Date & Time`: Formatted as `DD MMM YYYY, hh:mm A` (e.g. `28 Oct 2026, 02:15 PM`).
  3. `Seller Details`: Shop Name, Village badge (`Rampur`), Category icon (`Food` / `Grocery`).
  4. `Items Snapshot`: e.g. *"2 items (Paneer Butter Masala x 1, Tandoori Roti x 4)"*.
  5. `Total Amount`: Formatted INR `₹340.00` (Bold).
  6. `Status Badge`:
     - `Placed`: Blue pill badge.
     - `Preparing`: Yellow/Amber pill badge.
     - `Out for Delivery`: Purple pill badge.
     - `Delivered`: Green pill badge.
     - `Cancelled / Rejected`: Red/Gray pill badge.
  7. `Row Actions`: `Track Order` (Primary Pill), `Reorder` (Outline Pill, re-validates stock & current prices).
- **Empty State**: Friendly basket illustration: *"Aapne abhi tak koi order nahi kiya hai"* with `Browse Food & Grocery` button.

### Table C-TBL-02: Customer "My Udhar" Transaction Ledger (`/my-udhar`)
- **Display Mode**: Tabular Grid on Desktop; Dated Transaction Cards on Mobile.
- **Filters**: Seller Dropdown (`All Sellers`, or specific store e.g. `Gupta Kirana`), Date Range.
- **Sorting**: Transaction Date (Descending).
- **Pagination**: 15 records per page.
- **Exact Columns**:
  1. `Date & Time`: Formatted `DD MMM YYYY, hh:mm A`.
  2. `Store Name`: Public name of local shop.
  3. `Entry Type`:
     - Credit Sale: *"Added to amount owed"* (Red text with `+` sign).
     - Repayment: *"Payment received"* (Green text with `-` sign).
     - Adjustment/Reversal: *"Reversal / Adjustment"* (Neutral amber text).
  4. `Linked Reference`: Order Number (e.g. `#GB-2026-0042`) or Repayment Receipt `#REC-9912`.
  5. `Amount`: Formatted INR `₹450.00`.
  6. `Running Balance`: Formatted INR `₹1,250.00` (Current balance after this transaction).
  7. `Due Date`: Formatted `DD MMM YYYY` (or `Paid` / `Settled`).
  8. `Action`: `Report Mismatch` (Triggers dispute modal).
- **Empty State**: Checkmark graphic: *"Aapka hisaab bilkul clear hai. Koi baaki rashi nahi hai."*

---

## 2. Seller Portal Tables

### Table S-TBL-01: Seller Live Order Processing Queue (`/seller/orders`)
- **Display Mode**: High-velocity Kitchen/Packing Cards or Dense Operational Table.
- **Filters**: Filter Tabs with Live Count Badges:
  - `New / Incoming (3)`
  - `Preparing / Packing (2)`
  - `Ready for Dispatch (1)`
  - `Out for Delivery (4)`
  - `Completed Today (18)`
  - `Rejected / Cancelled (1)`
- **Sorting**: Priority Queue (Oldest unaccepted first; prep time remaining ascending).
- **Exact Columns / Card Data**:
  1. `Order # & Elapsed Time`: `#GB-0089` • `Timer: 3 min ago` (Pulsing amber if > 5 min).
  2. `Customer Info`: Name, Village, Landmark (*"Kali Mandir ke paas"*), Contact icon.
  3. `Fulfilment Mode`: `Delivery (Seller Boy)` or `Customer Pickup` badge.
  4. `Items & Quantities`: Detailed item rows with diet icon, custom quantity (*"1.5 kg Aata"*, *"1 pav Besan (250g)"*), customer notes highlighted.
  5. `Payment Mode & Total`: `COD (Collect ₹380)` or `Direct UPI` or `Udhari (Approved)`.
  6. `Status Action Group`:
     - For New: `Prep Time Dropdown (15/30/45m)` + `Accept Order` (Green) + `Reject` (Red).
     - For Preparing: `Mark Ready for Dispatch` (Green).
     - For Ready: `Assign Runner Dropdown` + `Dispatch` (Purple).
     - For Out for Delivery: `Mark Delivered & Collected` (Green).
- **Empty State**: *"Abhi koi naya order nahi hai. Naye order aane par buzzer bajega."*

### Table S-TBL-02: Seller Catalog / Menu Manager (`/seller/catalog`)
- **Display Mode**: Data Table with Image Thumbnails.
- **Search & Filters**: Search item name; Category Filter Dropdown; Catalogue Type (`Food` vs `Grocery`); Stock Filter (`In Stock`, `Low Stock`, `Out of Stock`).
- **Sorting**: Category, Item Name, Price.
- **Pagination**: 20 items per page.
- **Exact Columns**:
  1. `Image`: 48x48 rounded thumbnail.
  2. `Item Name & Type`: Name, Veg/Non-Veg icon (Food) or Unit type (Grocery).
  3. `Category`: Category badge (*e.g., Thali, Pulses*).
  4. `Price Basis & Selling Price`: e.g. `₹140.00 / plate` or `₹60.00 / kg` (Calculated from integer paise).
  5. `Quantity Mode`: `Fixed Pack`, `Predefined Chips`, or `Custom Quantity (*pav* supported)`.
  6. `Stock Status`: Live Toggle Switch (`Available` vs `Unavailable`) + Quantity number.
  7. `Row Actions`: `Edit` (Opens item drawer), `Duplicate`, `Archive / Deactivate`.
- **Bulk Actions**: `Mark Selected Available`, `Mark Selected Unavailable`, `Bulk Price Edit`.

### Table S-TBL-03: Seller Inventory & Stock Management (`/seller/inventory`)
- **Display Mode**: Dense Inventory Grid.
- **Filters**: Category Dropdown, Stock Alert Filter (`All`, `Below Threshold`, `Out of Stock`).
- **Exact Columns**:
  1. `Item SKU / Name`: Item name and category.
  2. `Current On-Hand Stock`: Formatted number + Unit (*e.g., 42.5 kg*).
  3. `Low-Stock Threshold`: e.g. `10.0 kg` (Triggers warning badge when on-hand <= threshold).
  4. `Stock Health Status`:
     - `Healthy`: Green pill.
     - `Low Stock`: Amber pill.
     - `Out of Stock`: Red pill.
  5. `Last Updated`: Timestamp of last stock entry.
  6. `Stock Adjustment`: `+ / - Adjust Stock` button (Opens modal with mandatory reason).
  7. `History Link`: `View Stock Movement Log`.

### Table S-TBL-04: Seller Customer Credit (Udhari) Directory (`/seller/udhari`)
- **Display Mode**: Enterprise SaaS Data Table.
- **Filters**: Search Customer Name or Phone; Village Filter; Status Filter (`Active`, `Overdue`, `Limit Reached`, `Disabled`).
- **Sorting**: Outstanding Balance (Highest first), Overdue Days, Customer Name.
- **Pagination**: 15 customers per page.
- **Exact Columns**:
  1. `Customer Name & Phone`: e.g. *Suresh Patel (+91 98765 12345)*.
  2. `Village / Hamlet`: *Rampur (Purani Basti)*.
  3. `Credit Limit`: Formatted INR `₹3,000.00`.
  4. `Outstanding Balance`: Formatted INR `₹1,850.00` (Bold text).
  5. `Available Credit`: Formatted INR `₹1,150.00` (Calculated: Limit - Outstanding).
  6. `Credit Health / Ageing`:
     - `Within Due Date`: Green badge.
     - `1–7 Days Overdue`: Yellow badge.
     - `8–30 Days Overdue`: Orange badge.
     - `30+ Days Overdue`: Red badge.
  7. `Last Payment Date`: Formatted `DD MMM YYYY` (or `Never`).
  8. `Row Actions`: `Record Repayment` (Primary Pill), `Edit Limit`, `View Complete Ledger`.
- **Bulk Action**: `Send Polite Payment Reminder` (Uses pre-approved Hindi/English template).

---

## 3. Platform Admin Suite Tables

### Table A-TBL-01: Seller KYC & Application Review (`/admin/seller-applications`)
- **Display Mode**: High-Information Table.
- **Filters**: Search Shop/Owner; Status Tabs (`Pending Review`, `Changes Requested`, `Approved`, `Rejected`); Village Filter.
- **Sorting**: Submission Date (Oldest pending first).
- **Pagination**: 15 applications per page.
- **Exact Columns**:
  1. `Application ID`: `#APP-2026-018` (Mono font).
  2. `Shop Name & Type`: Name + Vertical badge (*Dhaba / Kirana*).
  3. `Owner Name & Phone`: Verified contact details.
  4. `Village Location`: Rampur or Madhopur.
  5. `Submission Date`: Formatted `DD MMM YYYY, hh:mm A`.
  6. `KYC Docs`: Count of attached documents with preview link.
  7. `Review Status`:
     - `Pending Review`: Yellow badge.
     - `Changes Requested`: Amber badge.
     - `Approved`: Green badge.
     - `Rejected`: Red badge.
  8. `Action`: `Inspect & Review` (Opens drawer with document viewer and decision buttons).

### Table A-TBL-02: Master Seller Directory (`/admin/sellers`)
- **Display Mode**: Master Administrative Grid.
- **Filters**: Search Shop Name; Village Filter; Vertical Filter; Operating Status (`All`, `Active`, `Paused`, `Suspended`).
- **Exact Columns**:
  1. `Seller ID`: `#SEL-104` (Mono).
  2. `Shop Name`: Name + Address snippet.
  3. `Village`: Rampur or Madhopur.
  4. `Category / Vertical`: Food or Grocery.
  5. `Total Orders`: Lifetime orders completed.
  6. `Gross Sales (GMV)`: Total sales in ₹.
  7. `Average Rating`: e.g. `★ 4.6 (128 reviews)`.
  8. `Store State`: `Active`, `Paused by Seller`, `Suspended by Admin`.
  9. `Actions`: `View Store Profile`, `Inspect Audit History`, `Suspend / Reactivate` (Requires reason).

### Table A-TBL-03: Master Order Oversight (`/admin/orders`)
- **Display Mode**: Searchable Audit Table.
- **Filters**: Date Range Picker, Village Filter, Seller Filter, Customer Phone Search, Status Filter.
- **Exact Columns**:
  1. `Order Number`: `#GB-2026-0042`.
  2. `Date & Time`: Formatted `DD MMM YYYY, hh:mm:ss UTC`.
  3. `Village`: Rampur / Madhopur.
  4. `Seller Name`: Merchant public name.
  5. `Customer Name & Phone`: Customer contact details.
  6. `Total Amount`: Formatted INR `₹450.00`.
  7. `Payment & Fulfilment`: `COD • Seller Delivery` or `Udhari • Pickup`.
  8. `Current Status`: Standard status badge.
  9. `Row Action`: `Inspect Timeline` (Opens drawer showing raw immutable event sequence).

### Table A-TBL-04: Immutable Audit Log (`/admin/audit-logs`)
- **Display Mode**: Security Audit Log (Append-Only).
- **Filters**: Actor Role (`Super Admin`, `Ops Admin`, `Finance`, `Seller Owner`), Entity Type (`Seller`, `Order`, `Credit Limit`, `Fee Rule`), Date Range.
- **Exact Columns**:
  1. `Log ID`: UUID snippet.
  2. `Timestamp`: `YYYY-MM-DD hh:mm:ss UTC`.
  3. `Actor`: User ID + Role (*e.g., admin_01 (Super Admin)*).
  4. `Action Type`: `SELLER_APPROVED`, `SELLER_SUSPENDED`, `FEE_RULE_UPDATED`, `CREDIT_LIMIT_OVERRIDE`, `ORDER_CANCELLED_ADMIN`.
  5. `Target Entity`: Entity Name & Target ID.
  6. `Reason / Justification`: Plain-text rationale supplied by actor.
  7. `Snapshot Diff`: `View JSON Diff` button (Shows before/after states with PII/secrets redacted).

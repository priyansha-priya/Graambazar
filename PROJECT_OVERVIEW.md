# GramBazaar — Project Overview & Master Foundation (Phase 1)

## 1. Executive Summary & Vision
**GramBazaar** is a hyper-local, village-first food and grocery marketplace engineered to bridge the commerce divide for rural and semi-rural ecosystems. It provides a reliable, transparent, and low-bandwidth-friendly platform connecting local residents (village buyers) with village merchants (kirana stores, dhabas, local eateries, bakeries, and daily essentials vendors).

### Core Principles
1. **Trust Before Scale**: Sellers must be thoroughly verified and approved by administrators before listing products or accepting live public orders.
2. **Local-First UX**: Service area, seller operating hours, village landmarks, direct phone contact policies, and fulfillment availability must be immediately obvious.
3. **Server-Authoritative Commerce**: Pricing, fee rules, stock validation, access permissions, and order lifecycle transitions are computed and enforced server-side.
4. **Transparent Checkout**: Customers see the exact itemized payable amount (subtotal, delivery fee, packaging, platform fee, discounts) before placing orders.
5. **Separation of Food & Grocery**: Food ordering (instant preparation, portion/dietary options) and Grocery ordering (weight-based quantities, local units like *pav*, stock tracking) are clearly separated across distinct top-level tabs and checkout parameters.
6. **Seller-Managed Fulfillment**: In the MVP phase, deliveries are handled directly by the sellers' own staff/runners or customer pickup.
7. **Modular Extensibility**: The domain schema is built to accommodate future verticals (Agriculture & Farm Inputs, Hardware & Electrical, Apparel, Electronics, Furniture) without requiring fundamental architecture redesigns.

---

## 2. Product Scope & Non-Goals

### 2.1 In-Scope for MVP
- **Geography**: Initial rollout in **two pilot villages** with expandable multi-village serviceability architecture.
- **Verticals**:
  - **Food Delivery**: Local restaurants, dhabas, tea stalls, and snack centers.
  - **Grocery Delivery**: Kirana shops, daily essentials, grains, pulses, dairy, and local produce.
- **Quantity & Measurement**: Predefined standard units (250g, 500g, 1kg, pieces, plates) plus seller-defined local units (e.g., *1 pav* with seller-configured conversion) and structured custom quantities.
- **Cart Model**: Single-seller active cart per checkout. Clear prompt when adding items from a different seller.
- **Fulfillment Modes**: Seller delivery and in-store pickup, configurable per seller.
- **Payment Methods**: Cash on Delivery (COD) and Seller UPI / Direct payment simulation.
- **Udhari (Seller-Managed Customer Credit)**: Digital khata ledger where sellers extend credit at their own risk with customer-specific credit limits, double-entry audit records, and dispute handling.
- **AI-Assisted Capabilities (Advisory Guardrails)**: Smart Hindi/Hinglish search intent parsing, seller listing assistant, and store performance insights. AI never executes financial or order mutations autonomously.
- **Multi-Role Portals**: Responsive Customer Web + Mobile Web, Seller Management Console, and Super Admin Management Suite.

### 2.2 Explicit Non-Goals for MVP
- Multi-seller combined single checkout.
- Automated third-party courier routing or live GPS tracking.
- Recurring tiffin subscriptions or meal plans.
- Loyalty points, coupons/rewards engine, or platform-funded wallets.
- Native iOS application (Customer Web and Android responsive first).
- Platform-guaranteed credit lending or automated debt collection.
- Automatic substitutions for out-of-stock items without customer approval.

---

## 3. Master Decision Register (Status & Owner)

| Decision ID | Topic | Master Specification Baseline | Status / Owner |
| :--- | :--- | :--- | :--- |
| **D-01** | Pilot & Expansion Geography | Dynamic multi-village registry (scalable to N villages; e.g. Rampur, Madhopur, Shivpur, Kalyanpur, Haridaspur, Chandpur) with location-wise discovery and distance-based serviceability | **CONFIRMED** |
| **D-02** | Delivery Model | Seller-managed delivery or customer pickup | **CONFIRMED** |
| **D-03** | COD Collection Process | Seller/delivery boy marks collected at delivery handover | **CONFIRMED** |
| **D-04** | Payment Gateway | COD enabled; Online Gateway disabled until full reconciliation | **CONFIRMED** |
| **D-05** | Commission & Delivery Fees | Configurable versioned rules; ₹0 platform fee in pilot | **CONFIRMED** |
| **D-06** | Seller Compliance/KYC | Phone verification + FSSAI / Shop registration document | **CONFIRMED** |
| **D-07** | Languages | Dual-language architecture: Hindi & English with Hinglish search | **CONFIRMED** |
| **D-08** | Cancellation Policy | Customer self-cancel allowed only before seller acceptance | **CONFIRMED** |
| **D-09** | Cart Policy | Single seller per checkout; prompt on cross-seller add | **CONFIRMED** |
| **D-10** | Local Units (e.g. Pav) | Seller defines conversion/weight; no hardcoded global weight | **CONFIRMED** |
| **D-11** | Udhari Credit Risk | Credit provided at seller's own risk; platform does not lend | **CONFIRMED** |
| **D-12** | AI Safety Boundary | AI is advisory; cannot place orders or edit ledgers | **CONFIRMED** |
| **D-13** | Tiffin Subscriptions | Excluded from MVP; one-time orders only | **CONFIRMED** |
| **D-14** | Stock Tracking | Mandatory for tracked groceries; optional for prepared food | **CONFIRMED** |

---

## 4. Key Requirement Traceability Prefixes

All requirements, tests, database entities, and UI screens map to standardized traceability prefixes:
- `AUTH-`: Authentication, OTP, Session Management, RBAC.
- `CAT-`: Categories, Food & Grocery Tabs, Universal Catalog, Seller Listings.
- `QTY-`: Measurement Units, Seller Custom Units (*pav*), Custom Quantity, Step Validation.
- `INV-`: Stock Tracking, Low-Stock Alerts, Stock Movements, Reservations.
- `ORD-`: Cart, Checkout, Order State Machine, Cancellation, Fulfillment.
- `PAY-`: COD, Payment Records, Refunds, Reconciliations.
- `DEL-`: Multi-Village Serviceability, Seller Delivery, Store Pickup.
- `FIN-`: Commission Rules, Settlement Ledgers, Merchant Expenses.
- `CR-`: Udhari Settings, Customer Limits, Credit Sales, Repayments, Disputes.
- `AI-`: Smart Search Intent, Hindi/Hinglish Assistant, Listing Helper, Insights.
- `SUP-`: Support Cases, Order Disputes, Customer Feedback.
- `SEC-`: Multi-Tenant Isolation, Audit Logs, Data Redaction, IDOR Defense.
- `QA-`: Automated Test Suites, Responsive Verification, Release Gates.

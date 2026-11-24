# GramBazaar — Project Context & Persistent Knowledge Base

This file serves as the **Persistent Knowledge Base** for GramBazaar across all development sessions. Any future engineering turn or AI model must inspect and adhere to the guidelines, decisions, and constraints recorded here.

---

## 1. Project Mission & Identity
- **Name**: GramBazaar
- **Tagline**: *Aapke Gaon Ki Apni Dukaan* (Your Village's Own Marketplace)
- **Primary Mission**: Hyper-local food and grocery marketplace for rural and semi-rural village clusters, starting with two pilot villages (**Rampur** and **Madhopur**), supporting seller-managed deliveries, customer credit (*Udhari*), and extensible multi-vertical commerce.

---

## 2. Immutable Architecture Principles
1. **Single Source of Truth**: All domain logic, schemas, and requirements derive strictly from `Village_Food_Grocery_Marketplace_Master_Specification_v5` and `Village_Food_Grocery_Marketplace_Phase_1_Blueprint`.
2. **Server-Authoritative Finances**: All monetary calculations use **integer paise** (e.g. ₹450.00 is stored as `45000`). Totals submitted by clients are discarded; the server computes line subtotals, packaging, delivery fees, and grand totals.
3. **Single-Seller Cart Policy**: A customer checkout contains items from exactly one seller at a time. Attempting to add an item from another shop requires an explicit customer confirmation dialog to switch stores or clear the cart.
4. **Food vs. Grocery Separation**:
   - **Food**: Prepared meals, snacks, dhabas, portion sizes (Half/Full), veg/non-veg diet types, cooking notes, preparation lead times.
   - **Grocery**: Daily essentials, packaged items, weight-based selections (250g, 500g, 1kg), seller-defined local units (e.g., *1 pav*), stock inventory tracking.
5. **Udhari (Seller-Managed Customer Credit) Boundary**:
   - Credit is provided at the seller's sole risk and discretion.
   - The platform does not lend money, act as a debt collector, charge interest, or guarantee repayment.
   - Customer-specific limits are configured individually per seller.
   - Every transaction is an immutable double-entry ledger record. No hard deletions.
6. **AI Safety Boundary**:
   - AI assistance (Smart search intent in Hindi/Hinglish, listing drafts, store summaries) is purely advisory.
   - AI **never** alters ledger balances, modifies stock, updates prices, changes credit limits, or submits orders autonomously.
7. **Zero Slop & Enterprise UI Quality**:
   - Pill-styled interactive buttons (`rounded-full`), clean neutral card surfaces (`bg-white border border-[#E5E7EB]`), responsive layouts (320px to 2550px), accessible WCAG AA contrast, and Lucide React icons.

---

## 3. Master Decision Register Snapshot

- **D-01 (Geography & Location Serviceability)**: Scalable to N multiple villages (e.g. Rampur, Madhopur, Shivpur, Kalyanpur, Haridaspur, Chandpur) with location-wise discovery, auto-detect location, and neighbor distance rules.
- **D-02 (Delivery Model)**: Seller-managed delivery or customer store pickup in MVP.
- **D-03 (COD Collection)**: Seller runner marks collected at physical handover.
- **D-04 (Payment Gateway)**: Keep online gateway disabled until complete banking/reconciliation integration; use COD and verified Seller Direct UPI.
- **D-05 (Commission/Fees)**: Versioned configurable rules; ₹0 platform commission during pilot shadow mode.
- **D-06 (Seller Compliance)**: Phone verification + FSSAI / Shop registration document upload.
- **D-07 (Languages)**: Hindi & English dual-language architecture with Hinglish search keyword mapping.
- **D-08 (Cancellation)**: Customer self-cancellation permitted only while status is `placed` (before seller acceptance).
- **D-09 (Cart Scope)**: Single seller per checkout.
- **D-10 (Local Units)**: Seller defines local unit conversion (e.g. *1 pav = 250g*); never hardcode a global weight.
- **D-11 (Credit Risk)**: Risk remains strictly with the local merchant.
- **D-12 (AI Role)**: Strictly advisory; human confirmation required for all consequential operations.
- **D-13 (Tiffin Subscriptions)**: Excluded from MVP; one-time orders only.
- **D-14 (Stock Tracking)**: Mandatory for counted groceries; optional for prepared food.

---

## 4. Current Repository Status
- **Current Phase**: Phase 1 (Planning & Blueprint Specification Complete).
- **Code State**: Ready for Phase 2 (Centralized Theme & Reusable Component System) upon explicit project owner approval.

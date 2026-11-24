# GramBazaar — Module Breakdown (Sub-Phase 1.2)

This document provides the exhaustive breakdown of all modules across the **Customer Surface**, **Seller Portal**, **Admin Portal**, and **Core Platform Services**, including dependencies, MVP classification, and ownership.

---

## 1. Customer Surface Modules

| Module ID | Module Name | Primary Purpose | Dependencies | MVP Status | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **C-MOD-01** | **Location & Village Serviceability** | Lets user select active village/hamlet (e.g., Rampur, Madhopur); filters public merchants and products based on geographic serviceability. | Admin Service Area config | **MVP (P0)** | Customer / Ops |
| **C-MOD-02** | **Auth & Phone OTP** | Passwordless authentication using mobile number and 6-digit OTP with rate limiting and secure session issuance. | SMS OTP service abstraction | **MVP (P0)** | Engineering |
| **C-MOD-03** | **Dual-Vertical Discovery (Food & Grocery)** | Prominent top-level tabs separating "Food" (restaurants/dhabas, preparation time, veg/non-veg) and "Grocery" (essentials, weight-based units, stock). | Catalog Engine, Village Context | **MVP (P0)** | Product / UX |
| **C-MOD-04** | **Custom Quantity & Local Unit Selector** | Enables selection of standard chips (250g, 500g, 1kg) or seller-defined local units (e.g. *1 pav*), plus custom quantity input with step validation. | Measurement Units Engine | **MVP (P0)** | Product / Engineering |
| **C-MOD-05** | **Single-Seller Cart & Quote Engine** | Enforces single-seller cart rule with switch confirmation; requests short-lived server-authoritative checkout quote. | Product Catalog, Pricing Rules | **MVP (P0)** | Engineering |
| **C-MOD-06** | **Checkout & Address Hub** | Handles village address selection with landmark emphasis, delivery instructions, payment choice (COD/UPI), and order placement. | Cart, Address API, Serviceability | **MVP (P0)** | Product / Ops |
| **C-MOD-07** | **Order Tracker & History** | Real-time visual timeline of order lifecycle (Placed → Accepted → Preparing → Ready → Out for Delivery → Completed), order snapshots, and reordering. | Order State Machine | **MVP (P0)** | Product / UX |
| **C-MOD-08** | **Customer "My Udhar" (Credit Ledger)** | Transparent view of credit purchases, repayments, due dates, outstanding balances per seller, and dispute submission. | Udhari Credit Engine | **MVP (P0)** | Finance / Product |
| **C-MOD-09** | **AI Smart Search & Assistant** | Natural language / Hinglish query interpretation, advisory voice-to-search intent, and app-guidance assistant. | AI Orchestration Service | **MVP (P0)** | AI / Engineering |
| **C-MOD-10** | **Customer Support & Disputes** | Ticket submission for damaged items, wrong quantity, late delivery, or ledger discrepancies with order linking. | Support Ticket Engine | **MVP (P1)** | Ops / Support |

---

## 2. Seller Portal Modules

| Module ID | Module Name | Primary Purpose | Dependencies | MVP Status | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S-MOD-01** | **Seller Onboarding & KYC** | Multi-step application submission for new vendors (shop identity, owner phone, village, operating hours, FSSAI/doc uploads). | Admin Review Module | **MVP (P0)** | Ops / Legal |
| **S-MOD-02** | **Store Control Center (Dashboard)** | Real-time overview of incoming orders, store open/paused status, low-stock alerts, and daily sales metrics. | Order Engine, Inventory Engine | **MVP (P0)** | Product / UX |
| **S-MOD-03** | **Live Order Processing Queue** | Operational order terminal with audio-visual alerts: Accept (with prep time), Reject (with reason), Ready, Dispatch, and Complete. | Order State Machine | **MVP (P0)** | Engineering / Ops |
| **S-MOD-04** | **Menu & Catalog Manager** | Add/edit/archive food items and grocery products; toggle veg/non-veg, configure quantity modes, and set prep times. | Universal Catalog Schema | **MVP (P0)** | Product / Engineering |
| **S-MOD-05** | **Local Unit & Custom Quantity Configurator** | Define custom local units (e.g. *1 pav = 250g*), step sizes, minimum order weights, and pricing bases (per kg, per 100g, per piece). | Measurement Units Engine | **MVP (P0)** | Product / Engineering |
| **S-MOD-06** | **Inventory & Stock Controller** | On-hand quantity tracking, low-stock threshold alerts, manual stock adjustment with auditable reason, and daily batch toggles. | Inventory Movement Service | **MVP (P0)** | Ops / Engineering |
| **S-MOD-07** | **Seller Udhari Ledger & Repayment Console** | Manage customer credit limits, approve credit orders, record verified cash/UPI repayments, and inspect ageing buckets (1–7d, 8–30d, 30d+). | Udhari Credit Engine | **MVP (P0)** | Finance / Ops |
| **S-MOD-08** | **In-House Delivery Staff Assignment** | Assign shop runner or family member to out-for-delivery orders with recipient contact and landmark details. | Seller Staff Management | **MVP (P0)** | Operations |
| **S-MOD-09** | **Seller AI Assistant** | Automated generation of product descriptions, category suggestions, and weekly business performance summaries. | AI Orchestration Service | **MVP (P1)** | Engineering / AI |

---

## 3. Platform Admin Suite Modules

| Module ID | Module Name | Primary Purpose | Dependencies | MVP Status | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A-MOD-01** | **Admin Auth & RBAC** | Privileged session management, MFA, role assignments (Super Admin, Ops, Finance, Support), and session timeouts. | Auth Engine | **MVP (P0)** | Security |
| **A-MOD-02** | **Marketplace Health Dashboard** | High-level GMV metrics, order fulfillment rates, active seller counts, village-level breakdown, and open dispute tallies. | Reporting Aggregators | **MVP (P0)** | Executive / Ops |
| **A-MOD-03** | **Seller Application & KYC Governance** | Review vendor documents, verify shop authenticity, approve, reject with reason, or request document changes. | Seller Onboarding Module | **MVP (P0)** | Operations |
| **A-MOD-04** | **Seller Directory & Store Moderation** | Master directory of approved merchants with suspension/reactivation actions, performance history, and audit trails. | Seller Engine | **MVP (P0)** | Operations |
| **A-MOD-05** | **Universal Catalog & Category Master** | Hierarchical taxonomy governance (Food categories, Grocery categories, future verticals), category icon mappings, and moderation. | Catalog Engine | **MVP (P0)** | Catalog Ops |
| **A-MOD-06** | **Service Area & Delivery Boundary Hub** | Configure supported villages, boundaries, inter-village eligibility, delivery fee rules, and minimum order rules. | Location Engine, Fee Engine | **MVP (P0)** | Operations |
| **A-MOD-07** | **Fee, Commission & Settlement Governance** | Set versioned platform commission rates (shadow mode in pilot) and review seller payout/settlement reconciliations. | Financial Settlement Engine | **MVP (P0)** | Finance |
| **A-MOD-08** | **Order Oversight & Exception Resolution** | Search platform-wide orders, inspect immutable event logs, and perform authorized emergency cancellations/refunds with reason. | Order State Machine | **MVP (P0)** | Support / Ops |
| **A-MOD-09** | **Support Tickets & Dispute Resolution** | Handle escalated customer complaints, food-safety flags, and Udhari ledger disputes with auditable notes. | Support Engine | **MVP (P0)** | Support |
| **A-MOD-10** | **Immutable Audit Log & Security Monitor** | Append-only logging of all administrative actions, role changes, seller approvals, credit limit adjustments, and data exports. | Audit Logging Service | **MVP (P0)** | Compliance |
| **A-MOD-11** | **Multi-Vertical Expansion Engine** | Architectural module to enable future commercial verticals (Agriculture, Hardware, Apparel) via dynamic attribute schemas. | Dynamic Schema Engine | **Future (P2)** | Product / Tech Lead |

---

## 4. Cross-Cutting Core Domain Services

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CROSS-CUTTING DOMAIN SERVICES                         │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│ Order State       │ Udhari Ledger     │ Universal Catalog │ Location & Fee  │
│ Machine (OSM)     │ Service (ULS)     │ Service (UCS)     │ Engine (LFE)    │
├───────────────────┼───────────────────┼───────────────────┼─────────────────┤
│ AI Orchestration  │ Inventory & Stock │ Notification &    │ Audit & Event   │
│ Gateway (AIG)     │ Service (ISS)     │ Dispatch (NDS)    │ Store (AES)     │
└───────────────────┴───────────────────┴───────────────────┴─────────────────┘
```

1. **Order State Machine (OSM)**: Authoritative state progression (`placed` → `accepted` → `preparing` → `ready_for_pickup` / `ready_for_delivery` → `out_for_delivery` → `completed` / `rejected` / `cancelled`). Rejects invalid transitions server-side.
2. **Udhari Ledger Service (ULS)**: Atomic, double-entry transactional service managing customer limits, credit checks, repayment posting, reversals, and debt ageing.
3. **Universal Catalog Service (UCS)**: Supports polymorphic product representations for Food attributes (veg/non-veg, prep time, toppings) and Grocery attributes (measurement unit, custom quantity, stock tracking).
4. **Location & Fee Engine (LFE)**: Evaluates village serviceability, calculates distance/landmark-based delivery fees, and checks minimum order thresholds.
5. **AI Orchestration Gateway (AIG)**: Proxies model calls behind strict schemas, executes grounding against active catalog items, and applies safety guardrails preventing hallucinated commitments.

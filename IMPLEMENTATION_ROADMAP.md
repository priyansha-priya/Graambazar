# GramBazaar — Implementation Roadmap & Execution Gates (Sub-Phase 1.13)

This document outlines the **Phased Implementation Roadmap**, component dependencies, exit criteria, and release gates for GramBazaar.

---

## 1. Development Phases Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPMENT ROADMAP                               │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ Phase 1       │ Foundation & Complete Page-Wise UI Blueprint (Current)      │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Phase 2       │ Centralized Theme Tokens & 20+ Reusable Components           │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Phase 3       │ Multi-Village Serviceability & Dual-Catalog Engine          │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Phase 4       │ Single-Seller Cart, Rural Checkout & Order State Machine    │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Phase 5       │ Seller Live Order Terminal & Dispatch Management            │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Phase 6       │ Udhari (Seller-Managed Customer Credit) Double-Entry Ledger │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Phase 7       │ Super Admin Management Suite & Multi-Vertical Scalability   │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ Phase 8       │ Practical AI Assistance (Smart Search) & Production Release │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Phase Breakdown & Exit Criteria

### Phase 1: Foundation & Page-Wise Blueprint (Current)
- **Scope**: Master specification analysis, module breakdown, 35+ page inventory, UI specifications, forms & fields catalog, tables specification, media plan, design tokens, folder structure, routing, and gap analysis.
- **Deliverables**: The 12 canonical documentation files in the repository root.
- **Exit Criteria**: Strict approval from project owner; zero unaddressed ambiguities.

### Phase 2: Centralized Theme & Design System Components
- **Scope**: Implement `src/config/theme.ts`, global CSS tokens, and build the 20 reusable UI components (`Button`, `Input`, `Select`, `Badge`, `KPICard`, `DataTable`, `Tabs`, `Modal`, `Drawer`, etc.).
- **Exit Criteria**: All components render across light/dark backgrounds, support WCAG AA contrast, and pass interactive state tests.

### Phase 3: Village Serviceability & Dual-Catalog Engine
- **Scope**: Implement Village selection context (`Rampur` and `Madhopur`), Food tab (portion sizes, veg/non-veg, prep times) vs Grocery tab (weight-based quantities, *pav* local unit conversions, stock tracking), and search filtering.
- **Exit Criteria**: Switching villages dynamically filters merchants; Food and Grocery items maintain strict separation.

### Phase 4: Single-Seller Cart, Rural Checkout & Order State Machine
- **Scope**: Implement single-seller cart logic with conflict modal, rural address book with landmark-first validation, order summary, and the 7-stage order state machine (`placed` → `completed`).
- **Exit Criteria**: Cart rejects mixing sellers without explicit prompt; orders transition accurately with server-authoritative integer paise calculations.

### Phase 5: Seller Order Terminal & In-House Delivery Dispatch
- **Scope**: Implement Seller Live Order Processing Terminal, audio-visual new order alert, Accept/Reject with reason, prep timer, ready state, runner assignment, and store open/pause switch.
- **Exit Criteria**: Seller can manage complete order lifecycle from incoming alert to delivery completion.

### Phase 6: Udhari (Seller Customer Credit) Double-Entry Ledger
- **Scope**: Implement customer credit limits per seller, credit eligibility check at checkout, immutable double-entry ledger entries, cash/UPI repayment recording, customer "My Udhar" screen, ageing reports, and dispute workflow.
- **Exit Criteria**: Credit sales and repayments reconcile to exact zero on settlement; credit limit checks are concurrency-safe; no cross-seller data leakage.

### Phase 7: Super Admin Suite & Multi-Vertical Scalability
- **Scope**: Implement Admin Overview dashboard, Seller KYC application review with document viewer, master seller directory, fee rule governance, audit log viewer, and multi-vertical schema configurator.
- **Exit Criteria**: Sensitive admin actions require mandatory justification and are logged in append-only audit trail.

### Phase 8: Practical AI Features & Release Hardening
- **Scope**: Natural language Hindi/Hinglish search intent parsing, seller product listing helper, test suite execution (AUTH, CART, ORDER, UDHARI, SEC), and responsive audits across 320px–2550px.
- **Exit Criteria**: Zero high-severity defects; all acceptance criteria from Master Specification v5 pass.

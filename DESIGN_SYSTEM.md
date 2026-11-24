# GramBazaar — Centralized Design System & Theme Specification (Sub-Phase 1.8)

This document establishes the **Single Source of Truth** for GramBazaar’s design system, design tokens, color palette, typography, spacing, shadows, and component states.

---

## 1. Master Color Palette & Theme Tokens

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GRAMBAZAAR COLOR TOKENS                               │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ Primary Green        │ #218838              │ Brand primary, checkout CTA   │
│ Primary Green Dark   │ #176B2C              │ Hover state, active borders   │
│ Primary Green Light  │ #E8F5E9              │ Soft badge background, tints  │
│ Accent Orange        │ #F59E0B              │ Food badges, alerts, timers   │
│ Page Background      │ #F8FAFC              │ Neutral slate page canvas     │
│ Card Background      │ #FFFFFF              │ Clean white card container    │
│ Main Text            │ #1F2937              │ High contrast body copy       │
│ Secondary Text       │ #6B7280              │ Subtitles, timestamps, hints  │
│ Border               │ #E5E7EB              │ Subtle dividers & card rims   │
│ Success Green        │ #16A34A              │ Completed status, paid state  │
│ Warning Amber        │ #D97706              │ Pending review, low stock     │
│ Error Red            │ #DC2626              │ Rejections, cancellations     │
│ Info Blue            │ #2563EB              │ Placed status, hyperlinks     │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### Semantic Token Mapping
```typescript
export const themeColors = {
  primary: {
    DEFAULT: '#218838', // Buttons, active tabs, brand accents
    dark: '#176B2C',    // Button hover, pressed state
    light: '#E8F5E9',   // Background pills, success chips
    contrast: '#FFFFFF',// Text on primary buttons
  },
  accent: {
    DEFAULT: '#F59E0B', // Food badges, urgent timers, stars
    light: '#FEF3C7',
    dark: '#B45309',
  },
  surface: {
    page: '#F8FAFC',    // App background
    card: '#FFFFFF',    // Container cards, modals, tables
    subtle: '#F1F5F9',  // Table header background, chip unselected
    overlay: 'rgba(15, 23, 42, 0.6)', // Modal backdrops
  },
  text: {
    primary: '#1F2937',   // Headlines, labels, primary data
    secondary: '#6B7280', // Subtitles, timestamps, unit labels
    muted: '#9CA3AF',     // Placeholder text, disabled icons
    inverted: '#FFFFFF',  // Text on dark/primary surfaces
  },
  border: {
    DEFAULT: '#E5E7EB', // Card borders, dividers, table rows
    focus: '#218838',   // Accessible input focus rings
    error: '#DC2626',   // Invalid input borders
  },
  status: {
    success: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
    warning: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
    error:   { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
    info:    { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  }
};
```

---

## 2. Typography Hierarchy

The typographic system uses clean, highly legible system fonts optimized for readability in English, Hindi, and Hinglish.

- **Primary Font Family**: `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace Font Family (for Order IDs, UTRs, Paise)**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

| Scale Token | Font Size | Line Height | Font Weight | Recommended Application |
| :--- | :--- | :--- | :--- | :--- |
| `text-xs` | 12px (0.75rem) | 16px | 400 / 500 | Badges, timestamps, fine print, table metadata |
| `text-sm` | 14px (0.875rem)| 20px | 400 / 500 / 600 | Form field inputs, table cell copy, secondary buttons |
| `text-base` | 16px (1.000rem)| 24px | 400 / 500 / 600 | Body copy, card titles, primary button text |
| `text-lg` | 18px (1.125rem)| 28px | 600 / 700 | Product names, section subheadings, modal titles |
| `text-xl` | 20px (1.250rem)| 28px | 600 / 700 | Storefront titles, page section headers |
| `text-2xl` | 24px (1.500rem)| 32px | 700 / 800 | Page titles, KPI card primary metrics |
| `text-3xl` | 30px (1.875rem)| 36px | 800 | Marketing banners, splash screen brand title |

---

## 3. Spacing & Grid System

All margins, paddings, and component gaps align with an **8pt geometric scale**:

- `space-1`: 4px (0.25rem) — micro gaps (icon to text)
- `space-2`: 8px (0.5rem) — chip padding, table cell vertical padding
- `space-3`: 12px (0.75rem) — card internal compact padding
- `space-4`: 16px (1.0rem) — default container padding, button horizontal padding
- `space-5`: 20px (1.25rem) — form field vertical separation
- `space-6`: 24px (1.5rem) — section separation, modal internal padding
- `space-8`: 32px (2.0rem) — page header to content block spacing
- `space-12`: 48px (3.0rem) — major dashboard module separation

---

## 4. Border Radius & Pill Standards

To satisfy enterprise UI requirements while maintaining high touch-affordability:
- **Rounded Pill (`rounded-full`)**: Exclusively reserved for interactive **Buttons** (`<Button />`), **Search Inputs**, and **Status Badges** (`<Badge />`).
- **Card & Container Radius (`rounded-xl` / 12px)**: Used for all product cards, KPI cards, table containers, and modals.
- **Micro Radius (`rounded-md` / 6px)**: Used for select dropdown menus, tooltips, and table cell image thumbnails.

---

## 5. Elevation & Shadows

- `shadow-none`: Flat elements with visible `1px border border-[#E5E7EB]`.
- `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` — Cards at rest, table containers.
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` — Cards on hover, sticky headers.
- `shadow-xl`: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` — Floating cart bar, drawers, modal dialogs.

---

## 6. Standard Component Dimensions

| Component | Standard Height | Minimum Width | Padding |
| :--- | :--- | :--- | :--- |
| **Pill Button (Small)** | 32px (h-8) | 72px | px-3 |
| **Pill Button (Medium / Default)** | 42px (h-[42px])| 110px | px-5 |
| **Pill Button (Large / Checkout)**| 50px (h-[50px])| 160px | px-8 |
| **Form Input / Select Field** | 44px (h-11) | Full width | px-4 |
| **Table Row Height** | 52px (h-[52px])| Full width | px-4 py-2 |
| **Desktop Sidebar Width** | 260px (w-64) | 260px (Collapsible to 72px)| p-4 |
| **Top Navigation Header** | 64px (h-16) | 100vw | px-6 |
| **Standard Modal Width** | Dynamic | Max 540px (`max-w-lg`) | p-6 |

---

## 7. Responsive Breakpoint Rules

| Breakpoint Name | Min Width | Target Devices & Screen Types | Layout Behavior |
| :--- | :--- | :--- | :--- |
| `mobile-sm` | 320px | Compact Android devices (JioPhone, entry-level) | 1 column, stacked controls, hidden non-essential icons |
| `mobile-md` | 375px | Standard smartphones (iPhone, Redmi, Samsung) | 1 column, full-width pill buttons, horizontal category scroll |
| `tablet` | 768px | iPads, Android tablets | 2-column card grid, collapsible mobile sidebar drawer |
| `desktop` | 1024px | Small laptops, 13-inch displays | Fixed 260px sidebar, 3-column store grid, 2-column checkout |
| `desktop-wide` | 1440px | Standard 24-inch enterprise monitors | Max content constraint `max-w-7xl mx-auto`, 4-column store grid |
| `ultra-wide` | 1920px–2550px | Large desktop displays | Centered bounded container, ultra-high contrast crisp layout |

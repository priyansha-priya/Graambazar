# GramBazaar — Image & Media Guidelines (Sub-Phase 1.7)

This document establishes the **Image and Media Architecture** for GramBazaar. It defines exact dimensions, aspect ratios, allowed formats, proposed file size limits, compression pipelines, and fallback strategies.

---

## 1. Per-Page Image Usage Matrix

| Page ID | Page Name | Image Used? | Purpose & Placement | Aspect Ratio | Dimensions (WxH) | Allowed Formats | Max File Size (Assumption) | Fallback Graphic |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C01** | Splash / Bootstrap | Yes | Brand Logo in center | 1:1 | 120 x 120 px | SVG / WebP | 50 KB | SVG Village Emblem |
| **C02** | Village Selector | Yes | Village illustration card | 16:9 | 320 x 180 px | WebP / PNG | 150 KB | Stylized Village Outline Icon |
| **C04** | Customer Home | Yes | 1. Village Banner Carousel<br>2. Category Tile Icons<br>3. Storefront thumbnails | 1. 21:9 (Banner)<br>2. 1:1 (Category)<br>3. 4:3 (Store Card) | 1. 1200 x 514 px<br>2. 80 x 80 px<br>3. 320 x 240 px | WebP / JPEG | 1. 300 KB<br>2. 40 KB<br>3. 150 KB | 1. Solid Green Gradient Banner<br>2. Lucide Icon in tinted circle<br>3. Shopfront Illustration |
| **C05** | Search Results | Yes | Item / Store thumbnail rows | 1:1 | 64 x 64 px | WebP / JPEG | 60 KB | Food / Grocery generic icon |
| **C06** | Seller Storefront | Yes | 1. Store Header Hero Cover<br>2. Menu Item thumbnails | 1. 16:6 (Cover)<br>2. 1:1 (Dish/Pack) | 1. 1200 x 450 px<br>2. 120 x 120 px | WebP / JPEG | 1. 400 KB<br>2. 100 KB | 1. Village marketplace pattern<br>2. Veg / Non-Veg stylized badge |
| **C07** | Product Detail Modal | Yes | Featured Item Photo | 4:3 | 480 x 360 px | WebP / JPEG | 200 KB | Category-specific vector fallback |
| **C08** | Cart | Yes | Small item thumbnail in line | 1:1 | 48 x 48 px | WebP / JPEG | 40 KB | Minimal unit badge |
| **C10** | Order Confirmation | Yes | Success animation / emblem | 1:1 | 96 x 96 px | SVG | 30 KB | Green Checkmark SVG |
| **C13** | Customer Profile | Optional | User profile avatar | 1:1 | 80 x 80 px | WebP / PNG | 100 KB | Initials Avatar (e.g. "RK") |
| **C15** | Support / Complaint | Yes (Upload)| Evidence of damaged pack/spoilage | Any (Photo) | Max 1920x1080 px | JPEG / PNG | 4 MB (Assumption) | Document icon with filename |
| **S01** | Seller Onboarding | Yes (Upload)| 1. Shopfront Photo<br>2. Trade / FSSAI License doc | 1. 4:3 (Shop)<br>2. Document | 1. 800 x 600 px<br>2. Standard A4/Scan | JPEG / PNG / PDF | 5 MB (Assumption) | Placeholder upload box |
| **S04** | Seller Catalog Manager| Yes (Upload)| Dish or Pack Image | 1:1 or 4:3 | 600 x 600 px | WebP / JPEG | 1.5 MB (Assumption) | Category default picture |
| **A03** | KYC Review | Yes (Display)| Applicant Document Viewer | 100% Zoomable| Original scan | Secure Signed URL | Server Streamed | PDF / Doc reader frame |

---

## 2. Image Optimization & Compression Guidelines

1. **Format Strategy**:
   - Modern browsers and Android apps consume **WebP** for photographic assets (reduces payload by 30–40% vs legacy JPEG).
   - Icons, logos, and UI markers must use pure **SVG** to eliminate pixelation across high-DPI displays.
2. **Client-Side Pre-Upload Compression**:
   - For Seller product photo uploads and customer complaint photos, client-side canvas resizing compresses raw phone camera images (often 8–15 MB) down to $\le 600\text{ KB}$ before upload.
3. **Aspect Ratio Enforcement**:
   - Product thumbnails enforce `aspect-square` (`1:1`) with `object-cover` and `rounded-lg` borders to prevent layout shift (CLS).
   - Storefront banners enforce `aspect-[16/6]` on desktop and `aspect-[16/9]` on mobile.
4. **Security & Privacy for Documents**:
   - Seller KYC documents (FSSAI licenses, ID scans, shop trade receipts) are stored in **private, non-public storage buckets**.
   - These assets are **never** rendered with public URLs. Access is granted exclusively via **short-lived time-stamped signed URLs (valid for 15 minutes)** verified against active Admin or Seller Owner sessions.

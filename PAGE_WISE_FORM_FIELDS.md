# GramBazaar — Page-Wise Form Fields Specification (Sub-Phase 1.5)

This document specifies **every single form, modal, and drawer input field** in the application, including validation rules, field behavior, and conditional visibility.

---

## 1. Customer Surface Forms

### Form 1.1: Customer Phone Authentication (`/auth/login`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `country_code` | Country | Static / Dropdown | Yes | Exactly `+91` | `+91` | `+91` | Fixed for Indian mobile numbers. |
| `phone_number` | Mobile Number | Tel / Numeric | Yes | Regex `^[6-9]\d{9}$`, 10 digits | `98765 43210` | Empty | OTP will be sent to this number. |
| `otp_code` | 6-Digit OTP | Number / Split | Yes (Step 2) | Exactly 6 digits, numeric | `• • • • • •` | Empty | Valid for 5 minutes. Resend in 45s. |

### Form 1.2: Customer Village & Landmark Selector (`/select-village`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `village_id` | Village / Hamlet | Radio Cards | Yes | Must match active service area ID | Select Rampur or Madhopur | None | Public sellers are filtered by this village. |
| `landmark_note` | Mohalla / Landmark | Text | Optional | Max 100 characters | *e.g., Purani Basti, Mandir ke paas* | Empty | Helps sellers identify your hamlet cluster. |

### Form 1.3: Customer Delivery Address (`/profile` & `/checkout`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `recipient_name` | Full Name | Text | Yes | Min 2, max 60 chars, trimmed | *e.g., Ramesh Kumar* | Empty | Recipient receiving the order. |
| `recipient_phone`| Contact Phone | Tel | Yes | Regex `^[6-9]\d{9}$` | `98765 43210` | Auto-filled from Auth | Delivery person will call on this number. |
| `village_id` | Village | Select | Yes | Must be active village | Select Village | Active Village | Determines seller delivery eligibility. |
| `address_line1` | House / Plot / Shop | Text | Yes | Min 3, max 100 chars | *e.g., House No. 14, Main Road* | Empty | Specific physical location. |
| `landmark` | Prominent Landmark | Text | **Yes** | Min 3, max 100 chars | *e.g., Kali Mandir ke samne / Panchayat Bhavan* | Empty | **Critical in rural areas without street names.** |
| `address_label` | Address Type | Radio Chips | Optional | `Home`, `Work`, `Other` | `Home` | `Home` | For easy re-use in future orders. |
| `is_default` | Set as Default | Checkbox | Optional | Boolean | N/A | `false` | Sets default address for checkout. |

### Form 1.4: Grocery Custom Quantity & Local Unit Form (Product Modal)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `quantity_mode` | Mode | Radio Chips | Yes | `PREDEFINED` or `CUSTOM` | Predefined / Custom | `PREDEFINED` | Controls predefined chips vs custom input. |
| `predefined_unit`| Pack Size | Chip Buttons | Conditional | Must belong to product unit options | `250 g`, `500 g`, `1 kg` | `1 kg` | Active when mode = `PREDEFINED`. |
| `custom_quantity`| Enter Quantity | Number | Conditional | Positive decimal, step multiple (e.g. 0.25) | *e.g., 1.5* | Min Qty | Active when mode = `CUSTOM`. |
| `custom_unit_id` | Measurement Unit | Dropdown | Conditional | Must belong to product's allowed units | `kg`, `gram`, `pav` | Base Unit | If *pav* is chosen, displays seller definition. |
| `customer_note` | Special Request | Textarea | Optional | Max 120 chars | *e.g., Zyada pake huye tamatar mat dena* | Empty | Request note, does not alter price. |

### Form 1.5: Food Dish Customization Form (Dish Modal)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `portion_size` | Portion Size | Radio Group | Yes | Exactly 1 option selected | `Half Plate`, `Full Plate` | First option | Adjusts dish base price. |
| `selected_addons`| Add-ons | Multi-Checkbox| Optional | Min/Max add-on bounds | *Extra Chutney (+₹10)* | None | Sums price deltas in paise. |
| `spice_level` | Preparation Style | Radio Chips | Optional | `Normal`, `Medium`, `Spicy` | `Normal` | `Normal` | Kitchen preparation instruction. |
| `cooking_note` | Cooking Request | Text | Optional | Max 100 chars | *e.g., Bina pyaaz ke banayein* | Empty | Communicated directly to cook. |

### Form 1.6: Checkout Submission Form (`/checkout`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `fulfilment_mode`| Fulfilment Mode | Toggle / Radio | Yes | `DELIVERY` or `PICKUP` | Delivery / Store Pickup | `DELIVERY` | If seller doesn't support delivery, defaults to Pickup. |
| `address_id` | Delivery Address | Radio Cards | Conditional | Required if mode = `DELIVERY` | Select saved address | Default Addr | Validates village serviceability. |
| `delivery_note` | Delivery Boy Note | Text | Optional | Max 120 chars | *e.g., Gate band ho to aawaz lagayein* | Empty | Printed on delivery ticket. |
| `payment_method`| Payment Option | Radio Group | Yes | `COD`, `SELLER_UPI`, `UDHAR` | Select Payment | `COD` | `UDHAR` only available if customer credit is eligible. |

### Form 1.7: Customer Udhari Dispute Form (`/my-udhar`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ledger_entry_id`| Transaction | Hidden / Select| Yes | Valid ledger entry ID owned by user | Auto-selected | Selected ID | Links dispute to exact entry. |
| `reason_code` | Dispute Reason | Dropdown | Yes | `WRONG_AMOUNT`, `PAYMENT_NOT_RECORDED`, `ORDER_CANCELLED` | Select Reason | None | Standard categorization for seller/support. |
| `description` | Explanation | Textarea | Yes | Min 10, max 300 chars | Explain what is incorrect... | Empty | Describe the payment or order mismatch. |

---

## 2. Seller Portal Forms

### Form 2.1: Seller Onboarding & KYC Form (`/seller/register`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `shop_name` | Shop / Dhaba Name | Text | Yes | Min 3, max 70 chars | *e.g., Sharma Shuddh Shakahari Dhaba* | Empty | Public name displayed to customers. |
| `seller_type` | Business Type | Dropdown | Yes | `RESTAURANT`, `DHABA`, `KIRANA`, `BAKERY`, `SNACKS` | Select Shop Type | None | Determines default catalog tabs & units. |
| `owner_name` | Owner Full Name | Text | Yes | Min 2, max 60 chars | *e.g., Ramcharan Sharma* | Empty | Used for legal and administrative records. |
| `contact_phone` | Owner Phone | Tel | Yes | Regex `^[6-9]\d{9}$` | `98765 43210` | Empty | For order alert calls and SMS. |
| `village_id` | Store Village | Select | Yes | Must be active village | Select Rampur or Madhopur | None | Physical shop location. |
| `address_line` | Shop Address | Text | Yes | Min 5, max 120 chars | *e.g., Station Road, Near Post Office* | Empty | Shop pickup & dispatch origin. |
| `fulfilment_modes`| Supported Modes | Multi-Checkbox| Yes | At least one: `DELIVERY`, `PICKUP` | Check supported options | `[DELIVERY, PICKUP]` | Configures how orders can be fulfilled. |
| `delivery_radius_km`| Delivery Radius | Number | Conditional | 0.5 km to 15 km | `3.0` | `3.0` | Required if DELIVERY is checked. |
| `opening_time` | Opening Time | Time | Yes | Valid 24h/12h time | `08:00 AM` | `08:00 AM` | Shop opens automatically. |
| `closing_time` | Closing Time | Time | Yes | Valid time > opening time | `09:30 PM` | `09:30 PM` | Shop closes automatically. |
| `fssai_number` | FSSAI / Reg. No. | Text | Optional/P1 | Alphanumeric 14 digits if Food | *e.g., 12345678901234* | Empty | For food hygiene compliance. |
| `doc_upload` | Shop / KYC Photo | File Upload | Yes | JPG, PNG, PDF <= 5MB | Select file | None | Photo of shop board or registration doc. |

### Form 2.2: Seller Product / Dish Item Add/Edit (`/seller/catalog`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `catalogue_type`| Tab / Vertical | Radio Group | Yes | `FOOD` or `GROCERY` | Food / Grocery | `GROCERY` | Determines display tab and pricing options. |
| `product_name` | Item Name | Text | Yes | Min 2, max 80 chars | *e.g., Shahi Paneer or Desi Chana* | Empty | Public item name. |
| `category_id` | Category | Select | Yes | Must belong to selected catalogue_type | Select Category | None | Master category taxonomy. |
| `price_rupees` | Selling Price (₹)| Number / Decimal| Yes | >= 1.00, converted to integer paise | `120.00` | Empty | Internal storage in paise (12000). |
| `unit_basis` | Price Basis / Unit | Select | Yes | `plate`, `piece`, `kg`, `g`, `pack`, `local_unit` | Select Unit | `kg` (Grocery), `plate` (Food) | Basis of the entered price. |
| `is_veg` | Diet Classification | Radio Chips | Conditional | `VEG`, `NON_VEG`, `EGG` | Veg / Non-Veg | `VEG` | Required if catalogue_type = `FOOD`. |
| `prep_minutes` | Prep Time (mins)| Number | Conditional | 5 to 90 mins | `20` | `20` | Food cooking time estimate. |
| `custom_qty_ok` | Allow Custom Qty | Checkbox | Conditional | Boolean | Enable | `false` | For loose groceries (e.g. 1.25 kg). |
| `step_increment`| Step Increment | Decimal | Conditional | 0.05 to 1.0 (e.g. 0.25 kg) | `0.25` | `0.25` | Active if custom quantity is enabled. |
| `stock_tracking`| Track Stock Qty | Checkbox | Optional | Boolean | Enable | `true` (Grocery) | If enabled, enforces concurrency check. |
| `stock_quantity`| Initial Stock | Number | Conditional | Integer >= 0 | `50` | `0` | Active if stock_tracking is enabled. |
| `description` | Description | Textarea | Optional | Max 250 chars | Ingredients, taste, fresh notes... | Empty | Item description. |

### Form 2.3: Seller Local Unit Configurator (`/seller/inventory`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `unit_label` | Local Unit Name | Text | Yes | Min 2, max 20 chars | *e.g., pav, lota, mutthi, thaili* | Empty | Village colloquial unit. |
| `conversion_qty`| Equivalent Qty | Decimal | Yes | Positive decimal > 0 | `250` | `250` | e.g. 250. |
| `canonical_unit`| Standard Unit | Select | Yes | `gram`, `kilogram`, `millilitre`, `litre`, `piece` | Select Unit | `gram` | Target canonical unit. |
| `definition_note`| Customer Description| Text | Yes | Min 5, max 100 chars | *e.g., 1 pav hamare yahan 250g hota hai* | Empty | Shown directly on product card. |

### Form 2.4: Seller Order Rejection Form (Modal)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `rejection_reason`| Reason | Dropdown | Yes | `OUT_OF_STOCK`, `KITCHEN_BUSY`, `DELIVERY_UNAVAILABLE`, `STORE_CLOSING`, `OTHER` | Select Reason | None | Mandatory rejection categorization. |
| `custom_notes` | Additional Details| Text | Conditional | Required if reason = `OTHER` | Explain reason to customer... | Empty | Sent to customer order screen. |

### Form 2.5: Seller Customer Credit Limit Form (`/seller/udhari`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `customer_id` | Customer | Search / Select | Yes | Valid customer registered in village | Select Customer | Selected | Scoped to seller's shop. |
| `credit_status` | Credit Status | Radio Chips | Yes | `ACTIVE`, `DISABLED`, `BLOCKED` | Active / Disabled | `ACTIVE` | Master switch for customer. |
| `credit_limit` | Credit Limit (₹)| Number / Decimal| Yes | Non-negative integer paise | `2000.00` | `1000.00` | Max unpaid balance allowed. |
| `due_days` | Default Due Days | Number | Optional | 1 to 90 days | `15` | `15` | Due date for credit sales. |
| `internal_note` | Seller Private Note| Textarea | Optional | Max 200 chars | *e.g., Pados ke dukandar, time par payment dete hain* | Empty | **Private; never shown to customer.** |

### Form 2.6: Seller Record Repayment Form (Drawer on `/seller/udhari`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `customer_id` | Customer | Read-only / Select| Yes | Valid customer with outstanding balance | Auto-filled | Selected | Customer making payment. |
| `amount_received`| Amount Received (₹)| Decimal | Yes | > 0 and <= current outstanding balance | `500.00` | Outstanding | Overpayment rejected in MVP. |
| `payment_method`| Payment Method | Select | Yes | `CASH`, `SELLER_UPI_DIRECT`, `BANK_TRANSFER`, `OTHER` | Select Method | `CASH` | Verified payment channel. |
| `reference_number`| Transaction Ref | Text | Conditional | Required for UPI / Bank Transfer | UTR / UPI Ref / Cash Memo # | Empty | Audit trail reference. |
| `notes` | Note | Text | Optional | Max 150 chars | Received at shop counter... | Empty | Internal ledger note. |

---

## 3. Platform Admin Forms

### Form 3.1: Admin Seller KYC Approval / Rejection Form (`/admin/seller-applications`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `decision` | Decision | Radio Group | Yes | `APPROVE`, `REQUEST_CHANGES`, `REJECT` | Approve / Changes / Reject | None | Operational verdict. |
| `decision_reason`| Decision Reason | Dropdown / Text | Yes | Mandatory for Rejection or Changes | Select Reason | None | Communicated to applicant. |
| `reviewer_notes`| Internal Audit Note| Textarea | Yes | Min 5, max 300 chars | Documents checked against village survey... | Empty | Saved in immutable audit log. |

### Form 3.2: Admin Service Area Add/Edit Form (`/admin/service-areas`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `village_name` | Village Name | Text | Yes | Min 2, max 50 chars | *e.g., Rampur* | Empty | Name shown to buyers and sellers. |
| `district_state`| District & State | Text | Yes | Min 3, max 60 chars | *e.g., Varanasi, Uttar Pradesh* | Empty | Administrative boundary. |
| `postal_codes` | Postal PIN Codes | Text (Comma sep) | Yes | 6-digit PIN codes | *e.g., 221001, 221002* | Empty | Geo-lookup matching. |
| `is_active` | Service Status | Checkbox | Yes | Boolean | Active | `true` | Allows buyers to select village. |
| `inter_village_fee`| Cross-Village Fee(₹)| Decimal | Optional | >= 0 | `15.00` | `10.00` | Fee when seller delivers to adjacent village. |

### Form 3.3: Admin Category Master Form (`/admin/categories`)
| Field Name | Label | Input Type | Required? | Validation Rules | Placeholder / Format | Default | Help Text / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `category_name`| Category Name | Text | Yes | Min 2, max 50 chars | *e.g., Dal & Pulses / Snacks & Sweets* | Empty | Public display name. |
| `catalogue_type`| Primary Vertical | Select | Yes | `FOOD`, `GROCERY`, `FUTURE_VERTICAL` | Food / Grocery | `GROCERY` | Maps to top-level customer tabs. |
| `slug` | URL Slug | Text | Yes | Lowercase alphanumeric + dashes | *e.g., dal-pulses* | Auto-slug | Unique URL identifier. |
| `parent_id` | Parent Category | Select | Optional | Valid category ID or root | None (Top-level) | None | For sub-categories. |
| `sort_order` | Display Order | Number | Yes | Integer >= 0 | `1` | `10` | Sort sequence in navigation. |
| `icon_name` | Lucide Icon Key | Text / Select | Yes | Valid Lucide icon string | `Utensils`, `Wheat`, `ShoppingBag` | `ShoppingBag` | Rendered on category cards. |

# MealBox — Operational & Business Blueprint
> Translated from: *Tiffin Service Management Application: Operational & Business Blueprint (June 11, 2026)*
> This document defines how the tiffin business actually works and maps every rule to what must be built, changed, or removed in the codebase.

---

## Overview

The system is a **single-operator internal tool** running a **post-paid digital Khata book**. The owner cooks and delivers daily. At month-end, the accumulated ledger auto-calculates into a WhatsApp-ready invoice per customer.

The entire billing model rests on **daily precision** — every day's delivery is recorded with its exact modifiers, locked, and accumulated. The bill is the sum of those locked daily records, not a retrospective calculation from a date range.

This is fundamentally different from the current app, which calculates billing backwards from subscription dates. **That architecture must change.**

---

## 1. Plan Types (Menu Tiers)

Every active customer is assigned exactly one base plan. Prices are fixed by the system — not free-form entry.

| # | Plan Name | Price | What's Included |
|---|---|---|---|
| 1 | **Regular Tiffin** | ₹80 | 5 Chapatis, Rice, Daal, Sabji, Salad |
| 2 | **Trial / One-Timer** | ₹90 | 5 Chapatis, Rice, Daal, Sabji, Salad — single-day flag only |
| 3 | **Customize / Sunday Special** | ₹100 | Customized baseline or Sunday thematic menu |
| 4 | **Premium Tiffin** | ₹150 | 6 Butter Chapatis, Basmati Rice, Special Daal, Salad, Papad |

### Rules

- **Regular** — standard daily recurring customer.
- **Trial / One-Timer** — one-time delivery only. The system must flag this as a single-day record and never auto-include it in future daily runs. After delivery, the profile becomes inactive or is converted to a regular plan.
- **Customize / Sunday Special** — applies either a customer-specific custom menu or the owner's Sunday thematic menu (changes weekly). Priced at ₹100 regardless of what the customisation is.
- **Premium** — higher-tier recurring customer.

### What This Means for the Codebase

The current app has no plan tiers at all. It stores a free-form `price` number per client. This must be replaced with a `planType` field constrained to: `regular | trial | customize | premium` with prices derived from the plan, not entered manually.

The current `customerType: "subscribed" | "ondemand"` maps partially to this but is not the same:

| Current App | Blueprint |
|---|---|
| `subscribed` | `regular` or `premium` (recurring plans) |
| `ondemand` | `trial` (one-time, single-day) |
| *(nothing)* | `customize` (new — does not exist) |

---

## 2. The Modifier Engine

Because billing is post-paid and daily, every day's record must store the exact modifiers applied that day. There are two categories with different effects.

### A. Billing Modifiers — These Change the Day's Cost

Applied on top of the base plan price. Every modifier is logged per daily record, not per client profile.

| Modifier | Symbol | Billing Effect | Example |
|---|---|---|---|
| Extra Chapati | `+chapati` | +₹5 per unit | 2 extra → +₹10 |
| Reduced Chapati | `-chapati` | ₹0 reduction (configurable) | Logged for kitchen, no price change by default |
| Extra Tiffin | `+1 base` | +1× the customer's base plan price | Regular client → +₹80 for that day |
| Extra Curd | `+curd` | +₹15 fixed | — |
| Extra Side Dish | `+side` | +₹20 fixed | — |

**Day's total = Base plan price + sum of all billing modifiers applied that day.**

The `+chapati` rate (₹7), `+curd` rate (₹15), and `+side` rate (₹20) should be configurable from the Settings page, not hardcoded.

### B. Kitchen Preference Modifiers — These Change Kitchen Output Only, Not Price

| Modifier | Options | Default | Effect |
|---|---|---|---|
| Spice Level | `Low` / `Medium` / `High` | `Medium` | Alters cook's seasoning batch, zero billing impact |
| Rice Volume | `Less` / `Normal` / `More` | `Normal` | Alters cook's rice quantity, zero billing impact |

These are stored on the **customer profile** (they apply every day unless changed) and are also overridable on any individual day's record.

### What This Means for the Codebase

The current app stores `preferences.rotiCount`, `preferences.rice` (Yes/No binary), and `preferences.spiceLevel` on the client document. These are one-time profile settings with no day-by-day override capability and no billing impact.

The modifier engine requires:
1. Removing the freeform `rotiCount` count from the profile (it becomes derivable from plan type: Regular/Trial/Customize = 5 chapatis, Premium = 6 butter chapatis).
2. Adding a **daily record** document where per-day modifiers are logged (see Section 3).
3. The `price` field on the client profile disappears. Price is derived from `planType` at calculation time.

---

## 3. Core Data Flow — The Daily Khata Model

The system is a continuous rolling ledger. The current app is a retrospective calculator. These are opposite architectures.

### The Flow

```
[Customer Profile Created]
        │
        ▼
[Every morning: Daily Run]
  For each active, non-paused customer:
  → Create a DailyRecord document with:
     - base plan price
     - any pre-set modifiers from profile (spice, rice)
     - status: "pending"
        │
        ▼
[Owner delivers tiffins]
  → Updates each DailyRecord:
     - adds any day-specific modifiers (+chapati, +curd, etc.)
     - marks status: "delivered" | "skipped"
        │
        ▼
[Daily Closing Confirmation]
  → Locks all "delivered" records for the day
  → Locked records are immutable — cannot be deleted, only
    administratively overridden (see Section 5, Anomaly 2)
        │
        ▼
[Month-End]
  → Billing script sums all locked "delivered" DailyRecords
    for each customer in the current cycle
  → Generates WhatsApp-ready invoice string
  → "Mark as Paid" archives the cycle, resets balance to ₹0
```

### New Firestore Schema Required

The current schema has no `dailyRecords` collection. This is the most significant structural change needed.

```
firestore/

├── customers/{customerId}                    ← renamed from "clients"
│   ├── name, phone, address
│   ├── ownerId
│   ├── status                               ← "active" | "paused" | "inactive"
│   ├── planType                             ← "regular"|"trial"|"customize"|"premium"
│   ├── deliverySchedule                     ← { monday..sunday: bool }
│   ├── deliverySlot                         ← "12-1pm" | "1-2pm" | "7-8pm" | "8-9pm"
│   ├── defaultModifiers                     ← kitchen prefs stored per profile
│   │   ├── spiceLevel                       ← "low" | "medium" | "high"
│   │   └── riceVolume                       ← "less" | "normal" | "more"
│   ├── routeArea                            ← locality/sector for delivery grouping
│   ├── createdAt (Timestamp)
│   │
│   ├── dailyRecords/{YYYY-MM-DD}            ← one document per delivery day
│   │   ├── date                             ← "YYYY-MM-DD"
│   │   ├── planType                         ← snapshot of plan at time of delivery
│   │   ├── basePriceSnapshot               ← price at time of delivery (₹80/90/100/150)
│   │   ├── status                           ← "pending"|"delivered"|"skipped"|"locked"
│   │   ├── billingModifiers[]               ← array of applied modifiers
│   │   │   └── { type, qty, unitPrice, totalAdded }
│   │   │       e.g. { type:"chapati", qty:2, unitPrice:5, totalAdded:10 }
│   │   │       e.g. { type:"curd",    qty:1, unitPrice:15, totalAdded:15 }
│   │   │       e.g. { type:"extra_tiffin", qty:1, unitPrice:80, totalAdded:80 }
│   │   ├── kitchenOverrides                 ← day-specific kitchen prefs (optional)
│   │   │   ├── spiceLevel                   ← overrides profile default for this day
│   │   │   └── riceVolume
│   │   ├── dayTotal                         ← basePriceSnapshot + sum(billingModifiers)
│   │   └── lockedAt (Timestamp)             ← set when status → "locked"
│   │
│   └── cycles/{YYYY-MM}                     ← one document per billing month
│       ├── month                            ← "YYYY-MM"
│       ├── status                           ← "active" | "settled" | "paid"
│       ├── totalDelivered                   ← count of locked "delivered" days
│       ├── totalAmount                      ← sum of dayTotal across locked records
│       ├── paymentMode                      ← "cash"|"upi"|"bank" (set on Mark as Paid)
│       ├── paidAt (Timestamp)
│       └── invoiceString                    ← WhatsApp-formatted text (generated)
│
├── bills/{billId}                           ← keep for backward compat, or migrate
│
└── settings/{ownerId}
    ├── businessName
    ├── phone
    ├── email
    ├── upiId
    └── modifierRates
        ├── extraChapati                     ← default ₹5
        ├── curd                             ← default ₹15
        └── extraSide                        ← default ₹20
```

### Why the Document ID is the Date

Using `dailyRecords/2026-06-11` (date as document ID) instead of an auto-ID gives:
- O(1) lookup for "today's record for customer X" — no query needed
- Natural sort order
- Easy range queries for month-end billing: `where(date >= "2026-06-01" && date <= "2026-06-30")`
- Prevents duplicate daily records (Firestore setDoc with merge is idempotent)

---

## 4. The Three Daily Views

### View A — Kitchen View (Cook Sheet)

What the cook sees each morning before starting prep. **No customer names** — only aggregate totals.

```
─── KITCHEN SUMMARY — Wednesday, 11 June 2026 ─────────────

  TIFFIN BOXES TO PACK
  ┌─────────────────┬───────┐
  │ Regular (₹80)   │  12   │
  │ Trial (₹90)     │   2   │
  │ Customize (₹100)│   3   │
  │ Premium (₹150)  │   4   │
  │ TOTAL BOXES     │  21   │
  └─────────────────┴───────┘

  CHAPATI PRODUCTION
  Base chapatis (5×17 + 6×4)         = 109
  + Extra chapatis requested          =  +6
  - Reduced chapatis requested        =  -2
  ─────────────────────────────────────────
  TOTAL CHAPATIS TO ROLL              = 113

  SPICE BATCHES
  Low spice    :  3 portions
  Medium spice : 15 portions
  High spice   :  3 portions

  RICE
  Less rice    :  2 portions
  Normal rice  : 17 portions
  More rice    :  2 portions

  ADD-ONS
  Extra curd   :  4 portions
  Extra side   :  1 portion
```

**Current state:** Does not exist. The DailyDeliveryPage is broken and only shows a client list. This entire view must be built from scratch using today's `dailyRecords`.

### View B — Delivery Routing View

What the delivery person (owner) takes on the route. Grouped by area/sector. Every modification is flagged inline so packing mistakes cannot happen.

```
─── DELIVERY ROUTE — 11 June 2026 ─────────────────────────

  SECTOR: Nagar Road (Lunch Slot: 12pm–1pm)
  ───────────────────────────────────────────
  1. Ramesh Sharma    │ Regular  │ ⚠ +2 Chapati, HIGH SPICE
  2. Priya Mehta      │ Premium  │ ✓ Standard
  3. Flat 302, Tower B│ Regular  │ ⚠ +Curd, LESS RICE

  SECTOR: Station Area (Lunch Slot: 1pm–2pm)
  ───────────────────────────────────────────
  4. Sunita Verma     │ Customize│ ⚠ No Rice, LOW SPICE
  5. Trial Customer   │ Trial    │ ⚠ ONE-TIME — do not schedule again

  SECTOR: Civil Lines (Dinner Slot: 7pm–8pm)
  ───────────────────────────────────────────
  6. Anil Kumar       │ Regular  │ ✓ Standard
  7. Deepak Joshi     │ Premium  │ ⚠ +Extra Side
```

**Current state:** The broken DailyDeliveryPage shows an unsorted flat list with no modifications flagged and wrong day-of-week logic. This needs a full rewrite using `dailyRecords` for today grouped by `routeArea`.

### View C — Billing Ledger

A chronological, per-customer audit trail. Every locked daily record is a line. Cannot be deleted (only administratively overridden — see Section 5).

```
─── ACCOUNT LEDGER — Ramesh Sharma ─────────────────────────
   Billing Cycle: June 2026

   Date        Plan       Modifiers          Day Total
   ──────────────────────────────────────────────────
   01 Jun      Regular    —                  ₹80
   02 Jun      Regular    +2 Chapati         ₹90
   03 Jun      —          PAUSED             ₹0
   04 Jun      Regular    +Curd              ₹95
   05 Jun      Regular    —                  ₹80
   ...
   ──────────────────────────────────────────────────
   Delivered: 22 days     Running Total:     ₹1,820
   Paused:     3 days
   Pending:    5 days (rest of month)
```

**Current state:** `BillingHistoryCard` shows past bills (monthly totals). There is no per-day ledger view at all.

---

## 5. End-of-Month Billing & Exception Handling

### Standard Month-End Flow

On the last day of the month (or whenever the owner triggers it):
1. Billing script iterates all locked `dailyRecords` with `status: "delivered"` for the current cycle
2. Sums `dayTotal` for each record
3. Generates invoice string formatted for WhatsApp
4. Owner sends it via WhatsApp (tap-to-send link in app)
5. Customer pays
6. Owner hits "Mark as Paid" → cycle is archived, balance resets to ₹0

### WhatsApp Invoice Format

```
MealBox Tiffin Service
Bill for: Ramesh Sharma
Period: 1 Jun – 30 Jun 2026

01 Jun – Regular        ₹80
02 Jun – Regular +2 Roti ₹90
04 Jun – Regular +Curd  ₹95
[...]

Total Delivered: 22 days
─────────────────────────
TOTAL DUE: ₹1,820

Pay via UPI: 9174867756@ybl
Thank you!
```

A "Send on WhatsApp" button generates a `wa.me` link with this text pre-filled. No WhatsApp API or Business Account needed.

### Anomaly 1 — Mid-Month Exit (Interim Settlement)

A customer leaves before the month ends. The owner must be able to:
1. Press "Interim Settlement" on the customer's profile
2. System immediately generates a prorated invoice for all locked records up to today
3. Future daily runs stop including this customer (status → `inactive`)
4. The cycle document is marked `settled` instead of waiting for month-end

**Current state:** Not possible. There is no concept of stopping mid-cycle without manually generating a bill.

### Anomaly 2 — Retroactive Delivery Adjustment

A customer calls and says they cancelled yesterday's delivery but the owner forgot to log it. The system must allow:
1. Owner opens yesterday's record for that customer
2. Changes status from `delivered` → `skipped`
3. `dayTotal` for that record is set to ₹0
4. Running total for the cycle automatically decreases

This is the **only allowed mutation on a locked record** — and only the owner can do it, logged with a timestamp. The record is not deleted; its status changes and an `adjustedBy` + `adjustedAt` field is written.

**Current state:** Not possible. Bills are static documents. Past entries have no edit mechanism.

### Anomaly 3 — Cycle Reset (Mark as Paid)

When a customer pays:
1. `paymentMode` is recorded on the cycle document (Cash / UPI / Bank Transfer)
2. Cycle `status` → `paid`, `paidAt` → current timestamp
3. The cycle's `dailyRecords` remain permanently readable (audit trail)
4. A new cycle document for the next month is created
5. Running balance ticker on the customer profile resets to ₹0

**Current state:** Bills have a `status: "paid" | "unpaid"` toggle. No payment mode. No cycle concept. No audit trail locking.

---

## 6. Gap Analysis — Blueprint vs Current App

### Critical Gaps (New Architecture Required)

| Blueprint Requirement | Current App | Action |
|---|---|---|
| 4 fixed plan tiers (₹80/90/100/150) | Free-form price entry per client | Replace `price` field with `planType` enum |
| Trial/One-Timer plan type | Not implemented | New plan type + single-day flag logic |
| Customize / Sunday Special plan | Not implemented | New plan type |
| Daily record per customer (Khata) | Retrospective date-range calculation | New `dailyRecords` subcollection |
| Daily closing / lock mechanism | No locking — bills are editable | Add `status: locked` + `lockedAt` |
| Billing modifier engine (+chapati, +curd, +tiffin, +side) | Not implemented | New `billingModifiers[]` array on dailyRecord |
| Kitchen aggregate view (total chapatis, spice matrix) | Not implemented — DailyDeliveryPage is broken | New Kitchen View page |
| Delivery routing view (grouped by area, modifiers flagged) | Broken DailyDeliveryPage | Rewrite as Routing View |
| Retroactive adjustment (change Delivered → Skipped) | Not implemented | Admin override on dailyRecord |
| Interim Settlement (mid-month exit) | Not implemented | New button + prorated invoice logic |
| WhatsApp invoice dispatch | Not implemented | wa.me link generator |
| Cycle Reset (Mark as Paid locks history) | Bills have toggle status only | New `cycles` subcollection + archive |
| Per-day modifier override (spice/rice) | Profile-level only, no daily override | Override fields on dailyRecord |
| Route area grouping per customer | Not implemented | New `routeArea` field on customer |
| Settings page (UPI, modifier rates) | Hardcoded in pdfGenerator.js | New `settings/{ownerId}` document |

### Existing Features That Align

| Blueprint Requirement | Current App | Status |
|---|---|---|
| Customer profile (name, phone, address) | `clients/{id}` document | Keep, rename/extend |
| Delivery schedule (Mon–Sun toggles) | `deliverySchedule` object | Keep as-is |
| Pause management | `pauses` subcollection + calendar | Keep — logic is correct |
| Kitchen preference: spice level | `preferences.spiceLevel` | Migrate to `defaultModifiers.spiceLevel` |
| PDF invoice generation | `pdfGenerator.js` + jsPDF | Keep, update to use new cycle/dailyRecord data |
| Auth (email + Google) | Firebase Auth | Keep |
| Revenue charts | `RevenueAnalytics.jsx` | Keep, update data source |

### Existing Features That Must Be Removed or Replaced

| Current Feature | Reason |
|---|---|
| Free-form `price` entry in AddClientModal | Replaced by fixed `planType` prices |
| `plan.lunch` / `plan.dinner` subscription model | Replaced by planType + dailyRecord model |
| `plan.startDate` / `plan.endDate` on client | Replaced by active cycle dates |
| `orders` subcollection (single extra tiffins) | Replaced by billing modifiers on dailyRecord |
| `GenerateBillPage` (retrospective calculation) | Replaced by summing locked dailyRecords |
| `calculateBillForClient()` in `billing.js` | Replaced by dailyRecord aggregation |
| `preferences.rotiCount` free-form field | Derived from planType (Regular=5, Premium=6) |
| `preferences.rice` (Yes/No binary) | Replaced by `defaultModifiers.riceVolume` (Less/Normal/More) |

---

## 7. New Firestore Schema (Complete)

```
firestore/

├── customers/{customerId}
│   ├── name                  (string)
│   ├── phone                 (string)
│   ├── address               (string)
│   ├── routeArea             (string)   ← locality for delivery grouping
│   ├── ownerId               (string)
│   ├── status                (string)   "active" | "paused" | "inactive"
│   ├── planType              (string)   "regular" | "trial" | "customize" | "premium"
│   ├── deliverySchedule      (map)      { monday: bool, ..., sunday: bool }
│   ├── deliverySlot          (string)   "12-1pm" | "1-2pm" | "7-8pm" | "8-9pm"
│   ├── defaultModifiers      (map)
│   │   ├── spiceLevel        (string)   "low" | "medium" | "high"  (default: "medium")
│   │   └── riceVolume        (string)   "less" | "normal" | "more" (default: "normal")
│   ├── notes                 (string)   freeform special instructions
│   ├── createdAt             (Timestamp)
│   │
│   ├── dailyRecords/{YYYY-MM-DD}        ← document ID IS the date
│   │   ├── date              (string)   "YYYY-MM-DD"
│   │   ├── planType          (string)   snapshot — plan at time of delivery
│   │   ├── basePriceSnapshot (number)   price at time of delivery
│   │   ├── status            (string)   "pending"|"delivered"|"skipped"|"locked"
│   │   ├── billingModifiers  (array)
│   │   │   └── { type, qty, unitPrice, totalAdded }
│   │   ├── kitchenOverrides  (map)      optional day-specific override
│   │   │   ├── spiceLevel    (string)
│   │   │   └── riceVolume    (string)
│   │   ├── dayTotal          (number)   basePriceSnapshot + sum(billingModifiers)
│   │   ├── lockedAt          (Timestamp)
│   │   ├── adjustedBy        (string)   set if retroactively changed
│   │   └── adjustedAt        (Timestamp)
│   │
│   ├── pauses/{pauseId}                 ← keep existing structure
│   │   └── startDate, endDate, mealType, createdAt
│   │
│   └── cycles/{YYYY-MM}
│       ├── month             (string)   "YYYY-MM"
│       ├── status            (string)   "active" | "settled" | "paid"
│       ├── totalDelivered    (number)
│       ├── totalAmount       (number)   sum of dayTotal across locked delivered records
│       ├── paymentMode       (string)   "cash" | "upi" | "bank"
│       ├── paidAt            (Timestamp)
│       └── invoiceString     (string)   WhatsApp-formatted invoice text
│
└── settings/{ownerId}
    ├── businessName          (string)
    ├── ownerName             (string)
    ├── phone                 (string)
    ├── email                 (string)
    ├── upiId                 (string)
    └── modifierRates         (map)
        ├── extraChapati      (number)   default: 5
        ├── curd              (number)   default: 15
        └── extraSide         (number)   default: 20
```

---

## 8. New Pages & Components Required

### New Pages

| Page | Route | Purpose |
|---|---|---|
| Kitchen View | `/kitchen` | Today's aggregate cook sheet — total chapatis, spice matrix, box count by plan |
| Delivery Route | `/delivery` | Today's delivery list grouped by area, modifiers flagged per customer |
| Daily Ledger | `/customers/:id/ledger` | Per-customer calendar of all daily records with edit/override |
| Settings | `/settings` | Business info, UPI, modifier rates |

### Modified Pages

| Page | Current Route | Change Needed |
|---|---|---|
| Customer List | `/clients` | Rename, replace plan fields with planType selector |
| Customer Detail | `/clients/:id` | Replace plan cards with cycle summary + daily record viewer |
| Billing | `/billing` | Drive from `cycles` collection instead of `bills` |
| Dashboard | `/dashboard` | Drive today's stats from `dailyRecords` not retrospective queries |

### Components to Build

| Component | Purpose |
|---|---|
| `DailyRecordCard` | Single day's record with modifiers, status toggle, override button |
| `ModifierPanel` | UI for adding billing modifiers to a daily record (+chapati, +curd, etc.) |
| `KitchenSummary` | Aggregate totals view — chapatis, spice matrix, box counts |
| `DeliveryRouteList` | Grouped delivery list with modifications flagged inline |
| `WhatsAppBillButton` | Generates wa.me link with formatted invoice text |
| `CycleCard` | Per-month cycle summary with Mark as Paid / Interim Settlement |
| `PlanTypeBadge` | Visual badge for Regular / Trial / Customize / Premium |
| `SettingsForm` | Edit business info, UPI, modifier rates |

---

## 9. Implementation Order

Work in this sequence. Each phase is independently deployable.

### Phase 1 — Foundation (schema migration, no UI changes yet)
1. Add `planType` field to existing client documents (map old `subscribed` → `regular`, `ondemand` → `trial`)
2. Add `routeArea` field to client form
3. Add `settings/{ownerId}` document with current hardcoded values
4. Add Firestore security rules (critical — see MEALBOX_AUDIT.md B4)
5. Create `settings` page (read/write business info, UPI, modifier rates)

### Phase 2 — Daily Record Engine
1. Build `createDailyRecords()` utility — generates today's `dailyRecords` documents for all active, non-paused customers on schedule
2. Build the **Kitchen View** (`/kitchen`) — reads today's dailyRecords, aggregates chapatis, spice, rice, box counts
3. Build the **Delivery Route View** (`/delivery`) — reads today's dailyRecords, groups by routeArea, flags modifiers
4. Build the **Modifier Panel** — UI to add +chapati, +curd, +tiffin, +side to a daily record
5. Build the **Daily Closing Confirmation** — locks all "delivered" records for the day

### Phase 3 — Billing Engine
1. Build `CycleCard` and `cycles` subcollection logic
2. Build month-end invoice generation — sum locked dailyRecords, write invoiceString
3. Build **WhatsApp Bill Button** — wa.me link generator
4. Build **Interim Settlement** — prorate cycle, mark inactive
5. Build **Retroactive Adjustment** — change delivered → skipped, recalculate cycle total
6. Build **Mark as Paid** — archive cycle, log payment mode, reset balance

### Phase 4 — Customer Ledger View
1. Build per-customer daily ledger page (`/customers/:id/ledger`)
2. Calendar heatmap showing delivered / skipped / paused per day
3. Running total ticker showing current cycle amount

### Phase 5 — Clean Up Old System
1. Remove `GenerateBillPage` and `calculateBillForClient()`
2. Remove `orders` subcollection usage
3. Remove free-form `price` and `plan.lunch/dinner` from AddClientModal
4. Migrate existing client data to new schema

---

## 10. Business Rules Reference Card

Quick lookup for implementation — every rule the code must enforce.

```
PLAN PRICES (immutable, from settings)
  regular   → ₹80
  trial     → ₹90  (one-time only, auto-inactive after delivery)
  customize → ₹100
  premium   → ₹150

CHAPATI COUNTS (derived from plan, not stored)
  regular / trial / customize → 5 chapatis
  premium                     → 6 butter chapatis

BILLING MODIFIER RATES (configurable in settings)
  +chapati    → +₹5 per unit (default)
  -chapati    → ₹0 reduction (default, configurable)
  +curd       → +₹15 (default)
  +side       → +₹20 (default)
  +1 tiffin   → +1× base plan price

KITCHEN MODIFIERS (no billing effect)
  spiceLevel  → "low" | "medium" | "high"    default: medium
  riceVolume  → "less" | "normal" | "more"   default: normal

DAILY RECORD STATUS TRANSITIONS
  pending → delivered  (owner confirms delivery)
  pending → skipped    (customer not home / cancelled)
  delivered → locked   (daily close confirmation)
  locked → skipped     (retroactive override, logged with timestamp)
  skipped → delivered  (retroactive correction, logged with timestamp)
  NOTE: locked records can only be overridden, never deleted

CYCLE STATUS TRANSITIONS
  active → settled     (interim settlement, mid-month exit)
  active → paid        (end of month, Mark as Paid)
  settled → paid       (customer pays after interim)
  NOTE: paid cycles are immutable — no further changes

TRIAL CUSTOMER RULE
  After delivery day passes → status auto-sets to "inactive"
  Never appears in future daily runs
  Can be manually converted to regular/premium plan

PAUSE RULE
  Paused days: no dailyRecord created, no billing, customer skipped in kitchen/route views
  Pause data stays in existing pauses/ subcollection (no change needed)
```

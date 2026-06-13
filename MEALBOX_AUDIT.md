# MealBox — Complete Project Audit
> Owner-only tiffin service management panel
> Audit date: 2026-06-11 · Updated: 2026-06-13 (Version 2.5.2 — full post-v2 review)

---

## 1. What This App Is

MealBox is a single-owner admin panel to run a home tiffin service business. No multi-tenancy (one Firebase Auth user = one business). The goal is to reduce the daily management overhead of:

- Knowing who gets tiffin today and what they want
- Tracking pauses and special orders
- Generating monthly bills and PDF invoices
- Monitoring revenue and outstanding payments

There is a public-facing landing page (`/`) that shows if not logged in; if logged in it redirects directly to `/dashboard`. The entire app behind `/dashboard` is owner-only. A customer-facing portal does not exist yet.

---

## 2. Tech Stack — Current

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 19.1 |
| Build tool | Vite | 7.x |
| Routing | React Router | 7.x |
| Styling | Tailwind CSS | 3.3 |
| Database | Firebase Firestore | 12.x |
| Auth | Firebase Auth | 12.x |
| Charts | Recharts | 3.x |
| PDF | jsPDF + autotable | 3.x |
| QR code | qrcode.react | 4.x |
| PWA | vite-plugin-pwa | — |
| Android | Capacitor | 6.x |
| Hosting | Vercel | — |
| Icons | Heroicons | 2.x |

**FullCalendar removed.** PauseManager is now an inline accordion inside ClientInfoCard.

---

### Android Strategy — Current Status

**PWA** is live. `vite.config.js` uses `VitePWA` with `autoUpdate` registration, manifest for home-screen install, and a `NetworkOnly` handler for all Firebase traffic (to prevent the Cache.put error on Firestore WebChannel connections).

**Capacitor Android project** is committed to `android/`. The APK can be built by running `npx cap open android` in Android Studio. The web app and APK share 100% of the React code.

---

### Firebase — Stay On Firebase

Still the right call. See previous audit for the detailed Supabase comparison. At current scale (50 clients × 5 reads/day = 7,500 reads/day vs the 50,000 limit) you have 6.6× headroom.

---

## 3. Architecture & Data Flow

```
Browser / Android (PWA or Capacitor APK)
  │
  ├── LandingPage1 (/)         ← Public marketing/login gateway
  │                              (redirects to /dashboard if logged in)
  │
  └── AuthProvider (Firebase Auth)
        │
        └── SettingsProvider (settings/{uid} Firestore doc)
              │
              └── ProtectedRoute
                    ├── Checks auth → /auth if unauthenticated
                    ├── Checks settings.setupComplete → /setup if first run
                    └── Layout (Sidebar + Navbar + BottomNavBar + FAB)
                          │
                          ├── /dashboard             → DashboardPage
                          ├── /dashboard/analytics   → AnalyticsPage (lazy)
                          ├── /kitchen               → KitchenPage         ← NEW
                          ├── /deliveries            → DeliveryRoutePage   ← NEW
                          ├── /clients               → ClientListPage
                          ├── /clients/:id           → ClientDetailPage
                          ├── /clients/:id/ledger    → CustomerLedgerPage  ← NEW
                          ├── /broadcast             → BroadcastPage       ← NEW
                          ├── /billing               → BillingPage
                          ├── /bills/:id             → BillDetailPage
                          ├── /clients/:id/generate-bill → GenerateBillPage
                          ├── /settings              → SettingsPage        ← NEW
                          └── /profile               → UserProfile
  │
  └── /setup                   → SetupPage (first-run wizard, outside Layout)
```

### Firestore Schema

```
firestore/
│
├── settings/{userId}
│   ├── businessName, ownerName, phone, email, upiId, businessAddress
│   ├── logoUrl           ← base64 image string (max 512 KB)
│   ├── setupComplete     ← first-run wizard completed flag
│   ├── setupLocked       ← prevents editing plans after setup
│   ├── modifierRates
│   │   └── extraChapati, extraCurd, extraSide (₹ each)
│   ├── routeAreas[]      ← locality names for delivery grouping
│   └── plans[]           ← dynamic plan definitions
│       └── { id, label, price, chapatis, description, isOnetime, badgeColor }
│
├── clients/{clientId}
│   ├── name, phone, address, routeArea
│   ├── ownerId
│   ├── status               ← "active" | "paused" | "inactive"
│   ├── customerType         ← "subscribed" | "ondemand"
│   ├── planType             ← plan id from settings.plans[] (NEW in v2)
│   ├── deliveryTimePreference
│   ├── plan
│   │   ├── (subscribed)  startDate, endDate
│   │   │                 lunch: { subscribed, price }
│   │   │                 dinner: { subscribed, price }
│   │   └── (ondemand)    date, mealType, price
│   ├── preferences
│   │   └── rotiCount, rice / riceVolume, spiceLevel, notes
│   ├── deliverySchedule
│   │   └── monday..sunday (booleans)
│   ├── createdAt (Timestamp)
│   │
│   ├── pauses/{pauseId}
│   │   └── startDate, endDate, mealType, createdAt
│   │
│   ├── orders/{orderId}
│   │   └── orderDate, mealType, price, status, createdAt
│   │
│   ├── dailyRecords/{date}       ← NEW in v2 — one doc per delivery day
│   │   ├── date, customerId, ownerId, customerName, phone, routeArea
│   │   ├── planType, basePriceSnapshot, dayTotal
│   │   ├── status               ← "pending" | "delivered" | "skipped" | "locked"
│   │   ├── mealSlot             ← "lunch" | "dinner"
│   │   ├── billingModifiers[]   ← [{type, qty, rate, total}]
│   │   ├── kitchenOverrides     ← {spiceLevel, riceVolume} or null
│   │   ├── chapatis, defaultSpice, defaultRice, notes
│   │   └── deliveryTimePreference
│   │
│   └── cycles/{month}            ← NEW in v2 — "YYYY-MM" billing cycle
│       ├── month, customerId, ownerId, customerName
│       ├── totalDelivered, totalSkipped, totalAmount
│       └── status               ← "open" | "settled" | "paid"
│
├── bills/{billId}                ← Legacy billing (still used by GenerateBillPage)
│   ├── clientId, clientName, ownerId
│   ├── billingPeriod: { start, end }
│   ├── billingMonth             ← "YYYY-MM"
│   ├── finalAmount
│   ├── status                   ← "paid" | "unpaid"
│   ├── generatedAt (Timestamp)
│   └── details
│       └── lunchesDelivered, dinnerPrice, extraOrders[], etc.
│
└── notifications/{notifId}       ← NEW in v2 — milestones
    ├── ownerId, customerId, customerName, customerPhone
    ├── type                     ← "milestone"
    ├── milestone                ← 10 | 30 | 50 | 100
    └── read (boolean)
```

---

## 4. What Was Removed in Version 2

The following items from the original audit have been completed — all deleted or fixed.

| Item | Status |
|---|---|
| `DeliveryInsights.jsx` — wrong fields, fake random data | ✅ DELETED |
| `SmartRecommendations.jsx` — broken fields, no-op buttons | ✅ DELETED |
| `BusinessSummary.jsx` — commented-out, never used | ✅ DELETED |
| `LiveNotifications.jsx` — not wired up, wrong field name | ✅ DELETED |
| `useDailyDeliveries.js` — unused hook | ✅ DELETED |
| `AuthPage.old.jsx` — stale file | ✅ DELETED |
| `ClientInfoCard_fixed.jsx` — abandoned patch | ✅ DELETED |
| Facebook auth (`facebookProvider`, `signInWithFacebook`) | ✅ REMOVED |
| Original SaaS landing page (`LandingPage.jsx` SaaS marketing) | ✅ REPLACED — now `LandingPage1.jsx` (clean gateway, redirects when logged in) |
| Hardcoded fake change indicators on Dashboard | ✅ FIXED — Dashboard completely rewritten with real data |
| Dead state `deliverySuccessRate: 98.5` | ✅ REMOVED |
| Debug `console.log('[DEBUG]')` in GenerateBillPage | ✅ REMOVED |

> **Note:** The file `src/pages/LandingPage.jsx` (old SaaS marketing version) and `src/pages/DailyDeliveryPage.jsx` (old broken delivery page) still exist in the filesystem but are not routed anywhere — both are dead code. Delete them to reduce confusion.

---

## 5. Bugs — Version 2 Status

### FIXED in Version 2

| Bug | Fix |
|---|---|
| B1 — Daily Delivery Page wrong | ✅ FIXED — `delivery.js` utility extracted. `DeliveryRoutePage` replaces the old page with dailyRecords-based workflow. Old `DailyDeliveryPage.jsx` is orphaned (delete it). |
| B2 — `billingMonth` not saved | ✅ FIXED — `GenerateBillPage.jsx:89` now saves `billingMonth: startDate.substring(0, 7)` |
| B3 — Analytics top cards hardcoded zeros | ✅ FIXED — `AnalyticsPage.jsx` completely rewritten using real `cycles` + `dailyRecords` collectionGroup data |
| B4 — No Firestore security rules | ✅ FIXED — `firestore.rules` deployed with full ownerId enforcement for all collections incl. `dailyRecords`, `cycles`, `notifications`, `settings` |
| B5 — On-demand client edit saves wrong plan shape | ✅ FIXED — `AddClientModal.jsx` completely rewritten with `planType` model |
| B7 — Debug console.logs in production | ✅ FIXED — Only appropriate `console.error` in catch blocks remain |
| B8 — Dark mode `.dark` class not applied | ✅ FIXED — `ThemeContext.jsx` now toggles `.dark` on `document.documentElement` |

### STILL OPEN

#### B6 — SmartAlerts uses old field names
**File:** `src/components/SmartAlerts.jsx:54-57`
The "High Volume Day" alert still checks `client.customerType === 'subscribed'` and `client.plan.lunch.subscribed`. These are the legacy fields — they work for existing data but should be updated to check `planType` from `settings.plans[]` once all clients are migrated.

The old "low activity flags subscribed clients" bug is gone. However, SmartAlerts does not yet check for expiring subscriptions (`plan.endDate` approaching) — that alert was planned but not built.

#### B9 (NEW) — DashboardPage quick nav tile has wrong path
**File:** `src/pages/DashboardPage.jsx:40`
The NAV tile for "Delivery" links to `/delivery` (no trailing `ies`). The actual route is `/deliveries`. This tile leads to a 404.

```js
// Line 40: wrong
{ label:'Delivery',  hint:'Mark deliveries done', icon:'🚚', to:'/delivery', … },
// Should be:
{ label:'Delivery',  hint:'Mark deliveries done', icon:'🚚', to:'/deliveries', … },
```

#### B10 (NEW) — SmartAlerts N+1 Firestore reads still present
**File:** `src/components/SmartAlerts.jsx:47-58`
Fetches all active clients then loops over each to compute today's delivery count. Same N+1 pattern as before. Fix with a `collectionGroup('dailyRecords')` query filtered to today instead.

---

## 6. New Pages & Features (Version 2)

### Setup Wizard (`/setup`) — NEW, WORKING
- 3-step wizard: Business Info → Meal Plans → Delivery Areas
- Runs automatically for new signups (`ProtectedRoute` checks `settings.setupComplete`)
- Default plans seeded: Regular (₹80), Trial (₹90), Customize (₹100), Premium (₹150)
- Plans are fully editable before locking; lock/unlock mechanism in SetupPage and SettingsPage
- Logo upload as base64 (max 512 KB, stored in `settings/{uid}.logoUrl`)

### Settings Page (`/settings`) — NEW, WORKING
- Business Info: name, owner, phone, email, UPI ID, address, logo
- Billing Modifier Rates: extra chapati, extra curd, extra side dish (₹ per item)
- Delivery Route Areas: add/remove locality names used for grouping deliveries
- Data Migration utility: assigns `planType` to old clients (subscribed → regular, ondemand → trial)
- **Resolves M4** (hardcoded UPI/contact in `pdfGenerator.js`)

### Kitchen Page (`/kitchen`) — NEW, WORKING
- "Start Today's Kitchen" creates `dailyRecords` for all active clients scheduled for today
- Idempotent — safe to tap multiple times (skips already-created records)
- Hero stat card: total tiffins, estimated revenue, delivered/skipped/pending progress bar
- Boxes to pack: count per plan type
- Chapatis to roll: base count + modifier extras summed across all records
- Spice batches: Low/Medium/High client counts
- Rice volumes: Less/Normal/More client counts
- Add-ons: curd and extra side dish counts (shown only when non-zero)
- Milestone notifications: shows unread customer milestone cards
- Link to `/deliveries` when records exist
- **Resolves M1** (cook sheet)

### Delivery Route Page (`/deliveries`) — REPLACED, WORKING
Replaces the old broken `DailyDeliveryPage`. Uses `dailyRecords` subcollection (real-time `onSnapshot`).
- Lunch / Dinner tabs
- Per-record card: name, plan badge, delivery time, area, status pill
- Mark delivered / skipped with one tap
- Modifier Panel: add extra chapatis, curd, side dish; override spice level and rice volume per delivery; saves to `billingModifiers` and `kitchenOverrides` on the `dailyRecord`
- Close Slot: locks all delivered records for a meal slot (status → "locked"), triggers milestone check
- Milestone check fires after slot close (writes to `notifications` collection at 10/30/50/100 deliveries)
- **Resolves M1 partial (delivery tracking), M9 (delivery sequence with area grouping)**

### Customer Ledger Page (`/clients/:id/ledger`) — NEW, WORKING
Per-customer delivery calendar and monthly billing cycle view.
- Monthly calendar grid (Mon–Sun) showing delivery status per day (colour coded: green = delivered/locked, amber = skipped, orange = pending)
- Navigate months with prev/next arrows
- Generate Cycle: aggregates the month's locked/delivered records into a `cycles/{month}` document with `totalDelivered`, `totalSkipped`, `totalAmount`
- WhatsApp bill link: pre-formatted itemized bill message sent via `wa.me` link (uses `whatsapp.js`)
- WhatsApp reminder link: short payment reminder message
- Status controls: mark cycle as open / settled / paid
- **Resolves M7 partial (per-cycle payment status tracking), M8 (WhatsApp bill send)**

### Broadcast Page (`/broadcast`) — NEW, WORKING
- Message templates: Custom, Sunday Special, Day Off, Promo Offer
- Filter recipients by plan type (All Active / Regular / Trial / Customize / Premium)
- Preview: shows per-client WhatsApp `wa.me` links
- Each link opens WhatsApp with the message pre-filled for that client's phone number
- `{name}` / `[name]` placeholders auto-replaced per client
- **Resolves M8 partial (WhatsApp broadcast messaging)**

---

## 7. Pages & Features — Current State

### Dashboard (`/dashboard`) — WORKING
- Hero greeting card with business name (from `settings`)
- Stats: today's tiffins (from `dailyRecords`), active clients, outstanding payments, collected this month (from `cycles`)
- Quick nav tiles: Kitchen / Delivery / Customers / Billing
- **Bug B9:** Delivery tile links to `/delivery` (wrong) — should be `/deliveries`
- Recent clients list (last 3 added)
- All stats are real; no hardcoded values remain

### Analytics (`/dashboard/analytics`) — WORKING (lazy loaded)
- Revenue bar chart: last 6 months collected vs outstanding (from `cycles`)
- Client breakdown: active/paused/inactive, subscribed/ondemand, plan distribution pie
- Total lifetime collected, total outstanding, total deliveries ever
- **No more broken components, no hardcoded zeros**

### Kitchen (`/kitchen`) — WORKING (see Section 6)

### Delivery Route (`/deliveries`) — WORKING (see Section 6)

### Client List (`/clients`) — WORKING
- Real-time `onSnapshot` listener
- Stats pill: total / active / paused / inactive
- iOS-style segmented tabs: Subscriptions / One-time
- Card-style list (no table) with edit and delete
- Broadcast button → `/broadcast`
- **Still missing:** Search/filter by name or phone (M10 — not built)

### Client Detail (`/clients/:id`) — WORKING
- ClientInfoCard: inline status control (Active/Paused/Inactive segmented toggle), inline pause accordion, plan badge, delivery schedule grid, preferences
- Links to `/clients/:id/ledger` for monthly billing view
- Simplified layout (single column, no FullCalendar)

### Customer Ledger (`/clients/:id/ledger`) — WORKING (see Section 6)

### Billing Page (`/billing`) — WORKING
- Bills list, search, filter by status, stats, mark paid

### Generate Bill (`/clients/:id/generate-bill`) — WORKING
- Legacy billing flow (pre-v2 subscription model)
- `billingMonth` is now saved correctly (B2 fixed)
- No debug logs remain

### Bill Detail (`/bills/:id`) — WORKING

### Settings (`/settings`) — WORKING (see Section 6)

### Auth (`/auth`, `/login`) — WORKING
- Email/password, Google OAuth, email verification, forgot password, resend verification
- Facebook auth removed

### Landing Page (`/`) — WORKING
- `LandingPage1.jsx` — clean marketing/login gateway
- Redirects to `/dashboard` if already logged in

### Broadcast (`/broadcast`) — WORKING (see Section 6)

---

## 8. Performance Issues

### P1 — N+1 Firestore reads in delivery.js (legacy path)
**File:** `src/utils/delivery.js:38-48`
The old `getTodayDeliveries()` function (used by the orphaned `DailyDeliveryPage.jsx`) fetches pauses for each subscribed client in a loop. The new `DeliveryRoutePage` uses `collectionGroup('dailyRecords')` — a single query — so P1 only affects dead code now.

### P2 — SmartAlerts N+1 still present
**File:** `src/components/SmartAlerts.jsx:47-58`
Same loop-per-client pattern. See B10 above.

### P3 — No shared state, every page refetches
Each page fetches independently. Dashboard → Clients → Dashboard triggers 3 full fetches. React Query or Zustand would reduce this. Low priority at current scale.

### P4 — `collectionGroup` queries require Firestore composite indexes
`firestore.indexes.json` is committed. If the index is still building after a fresh deploy, `KitchenPage` and `DeliveryRoutePage` will show a `failed-precondition` error. KitchenPage handles this gracefully with an error toast.

---

## 9. What's Still Missing

### M2 — Bulk Bill Generation (high value, not built)
Bills are generated one client at a time. For month-end with 20 clients that's 20 operations. Add "Generate cycles for all active subscribers for [month]" to the Billing page.

### M3 — Subscription Renewal Alerts (not built)
No alert when `plan.endDate` is within 3 days or already past. Add to SmartAlerts. Current logic does not check expiry.

### M6 — Holiday / Closed Day (not built)
No single-action "mark as holiday" that blocks all deliveries for a day and excludes it from billing. Workaround today: don't press "Start Today's Kitchen."

### M10 — Search in Client List (not built)
`ClientListPage.jsx` has tabs but no text input to filter by name or phone number. Add a `useState` for the search term and filter `filteredClients` before passing to `ClientTable`.

### Payment Mode on Legacy Bills (partial)
`CustomerLedgerPage` tracks cycle status (open/settled/paid) but the `bills` collection (legacy) still has no `paymentMode` field. Low priority now that the cycle-based workflow is the main path.

---

## 10. Data Model Notes

### Two Parallel Billing Systems
Version 2 introduced a new cycle-based billing system:
- **New (v2):** `clients/{id}/dailyRecords` → `clients/{id}/cycles/{month}` — tracks every delivery day, generates monthly cycle summaries, used by `CustomerLedgerPage`
- **Legacy (v1):** `clients/{id}/orders` → `bills/{billId}` — manual date-range billing used by `GenerateBillPage`

Both are live. The plan is to migrate entirely to the cycle-based system eventually. The `SettingsPage` migration utility assigns `planType` to legacy clients to bridge the two models.

### planType vs customerType
- `customerType` (`subscribed` | `ondemand`) — legacy field, still read by `SmartAlerts` and parts of `ClientListPage`
- `planType` — new field matching a `settings.plans[].id` (e.g. `regular`, `trial`, `premium`)
- All new v2 code reads `planType` from `settings.plans[]` via `planMap`
- Run the migration in SettingsPage to ensure all old clients have `planType`

---

## 11. File Inventory — Current Status

| File | Status | Notes |
|---|---|---|
| `src/pages/DashboardPage.jsx` | Working | B9: `/delivery` nav tile is wrong path |
| `src/pages/ClientListPage.jsx` | Working | Missing search (M10) |
| `src/pages/ClientDetailPage.jsx` | Working | — |
| `src/pages/DailyDeliveryPage.jsx` | **DELETE** | Orphaned — not in any route |
| `src/pages/DeliveryRoutePage.jsx` | Working | Main delivery workflow |
| `src/pages/KitchenPage.jsx` | Working | Cook sheet |
| `src/pages/CustomerLedgerPage.jsx` | Working | Monthly ledger + cycles |
| `src/pages/BroadcastPage.jsx` | Working | WhatsApp broadcast |
| `src/pages/BillingPage.jsx` | Working | — |
| `src/pages/GenerateBillPage.jsx` | Working | Legacy billing flow |
| `src/pages/BillDetailPage.jsx` | Working | — |
| `src/pages/AnalyticsPage.jsx` | Working | Real data, lazy loaded |
| `src/pages/AuthPage.jsx` | Working | Facebook removed |
| `src/pages/LandingPage.jsx` | **DELETE** | Old SaaS version, not routed |
| `src/pages/LandingPage1.jsx` | Working | Current landing page |
| `src/pages/SettingsPage.jsx` | Working | Business settings |
| `src/pages/SetupPage.jsx` | Working | First-run wizard |
| `src/pages/UserProfile.jsx` | Working | — |
| `src/components/AddClientModal.jsx` | Working | Rewritten for planType model |
| `src/components/ClientInfoCard.jsx` | Working | Inline status toggle, pause accordion |
| `src/components/PauseManager.jsx` | Working | Still used inside ClientInfoCard |
| `src/components/OrderManager.jsx` | Working | — |
| `src/components/BillingHistoryCard.jsx` | Working | Legacy billing history |
| `src/components/BillsTable.jsx` | Working | — |
| `src/components/RevenueAnalytics.jsx` | Working | Used in AnalyticsPage |
| `src/components/SmartAlerts.jsx` | Partial | B6/B10: old fields + N+1 |
| `src/components/ModifierPanel.jsx` | Working | Per-delivery add-ons |
| `src/components/MilestoneCard.jsx` | Working | Shown in KitchenPage |
| `src/components/BottomNavBar.jsx` | Working | Mobile nav with FAB |
| `src/components/Sidebar.jsx` | Working | All links present incl. Analytics |
| `src/components/Layout.jsx` | Working | — |
| `src/components/Navbar.jsx` | Working | — |
| `src/components/ClientTable.jsx` | Working | Card-style list |
| `src/components/ErrorBoundary.jsx` | Working | Wraps all protected routes |
| `src/components/GeneratePDFButton.jsx` | Working | — |
| `src/components/BillPDFButton.jsx` | Working | PDF for legacy bills |
| `src/components/QuickActions.jsx` | Working | — |
| `src/components/RecentActivity.jsx` | Working | — |
| `src/components/ui/Skeleton.jsx` | Working | AppShellSkeleton, CardSkeleton, etc. |
| `src/components/ui/Toast.jsx` | Working | Used app-wide |
| `src/utils/billing.js` | Working | Legacy billing calculations |
| `src/utils/delivery.js` | Working | Legacy delivery logic (also orphaned from DailyDeliveryPage) |
| `src/utils/dailyRecords.js` | Working | Core v2 delivery record management |
| `src/utils/cycles.js` | Working | Monthly billing cycle generation |
| `src/utils/milestones.js` | Working | 10/30/50/100 tiffin milestone detection |
| `src/utils/whatsapp.js` | Working | Bill/reminder/broadcast/milestone WA links |
| `src/utils/deleteClient.js` | Working | Client deletion with subcollections |
| `src/utils/pdfGenerator.js` | Working | Now reads UPI/contact from settings |
| `src/hooks/useSettings.js` | Working | Re-exports from SettingsContext |
| `src/hooks/useLocalNotifications.js` | Working | — |
| `src/context/AuthContext.jsx` | Working | Facebook removed |
| `src/context/ThemeContext.jsx` | Working | Dark mode fixed (`.dark` on `<html>`) |
| `src/context/SettingsContext.jsx` | Working | Core settings + plans |
| `src/config/firebase.js` | Working | Facebook provider removed |
| `src/config/plans.js` | DEPRECATED | All UI reads `settings.plans[]` via `useSettings()` |
| `src/routes/AppRoutes.jsx` | Working | All v2 routes wired |
| `src/routes/ProtectedRoute.jsx` | Working | Checks auth + setupComplete |
| `firestore.rules` | Deployed | Full ownerId rules for all collections |
| `firestore.indexes.json` | Committed | Composite indexes for collectionGroup queries |
| `vite.config.js` | Working | PWA plugin configured |
| `capacitor.config.json` | Working | Capacitor project root config |
| `android/` | Working | Full Android Studio project |

---

## 12. Priority Order — Remaining Work

```
IMMEDIATE (bugs affecting daily use)
  1. Fix /delivery → /deliveries nav tile on Dashboard   [B9]
  2. Delete DailyDeliveryPage.jsx (orphaned)
  3. Delete LandingPage.jsx (old SaaS version, orphaned)
  4. Delete config/plans.js (deprecated)

HIGH (daily friction, missing features)
  5. Add search/filter to Client List                    [M10]
  6. Subscription renewal alerts in SmartAlerts          [M3]
  7. Fix SmartAlerts to use planType + collectionGroup   [B6, B10]

MEDIUM (quality of life)
  8. Bulk cycle generation for billing month-end         [M2]
  9. Holiday / closed day feature                        [M6]
 10. Migrate fully off legacy bills → cycles

LOW (cleanup + future)
 11. Fix N+1 reads in SmartAlerts                        [P2]
 12. Add React Query for shared state/caching            [P3]
 13. Customer portal (separate login, view bills)
```

---

## 13. Future Roadmap

### Phase 3 — Android Distribution (ready now)
Capacitor project is committed. Run `npm run build && npx cap sync && npx cap open android` to build an APK in Android Studio. The APK can be shared directly via WhatsApp (side-load) — no Play Store required.

### Phase 4 — Customer Portal (future)
- Separate customer login
- Customers view their subscription, bills, request pauses
- Requires multi-tenant Firestore security rules
- WhatsApp Bot integration for delivery ETAs

### Phase 5 — Scale (if it becomes a product)
- Multi-owner support (`ownerId` already in schema)
- Multiple delivery persons with route assignment
- Ingredient cost tracking for real profit calculation
- React Native app (would make sense at this scale)

# MealBox — Complete Project Audit
> Owner-only tiffin service management panel
> Audit date: 2026-06-11 · Updated: 2026-06-11 (tech stack migration + removals added)

---

## 1. What This App Is

MealBox is a single-owner admin panel to run a home tiffin service business. No multi-tenancy (one Firebase Auth user = one business). The goal is to reduce the daily management overhead of:

- Knowing who gets tiffin today and what they want
- Tracking pauses and special orders
- Generating monthly bills and PDF invoices
- Monitoring revenue and outstanding payments

There is a public-facing landing page (`/`) that markets the product, but the entire app behind `/dashboard` is owner-only. No customer-facing portal exists yet.

---

## 2. Tech Stack — Current vs Recommended

### Current Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 19.1 |
| Build tool | Vite | 7.x |
| Routing | React Router | 7.x |
| Styling | Tailwind CSS | 3.3 |
| Database | Firebase Firestore | 12.x |
| Auth | Firebase Auth | 12.x |
| Charts | Recharts | 3.x |
| Calendar | FullCalendar | 6.x |
| PDF | jsPDF + autotable | 3.x |
| QR code | qrcode.react | 4.x |
| Hosting | Vercel | — |
| Icons | Heroicons | 2.x |

---

### Android Strategy — DO NOT use React Native

You asked about React Native for both browser and Android. Here is the honest breakdown:

**Why React Native is the wrong choice here:**
- React Native does NOT run in the browser. Components are `<View>`, `<Text>`, `<FlatList>` — not HTML. You cannot reuse a single line of current UI code.
- Getting it to work in a browser requires React Native Web, which is a separate compatibility layer with its own bugs and missing features.
- That means rewriting 100% of the UI twice — once for native, once to patch browser gaps.
- This is months of work, for zero user benefit.

**The right path: Capacitor**

Capacitor (by the Ionic team) wraps your existing React + Vite app as a native Android (and iOS) APK. It is specifically built for this scenario.

- Zero UI rewrite — your current React components work as-is
- You add ~5 config files and run 3 commands
- Output: an installable `.apk` file for Android
- The web version on Vercel continues to work identically
- Access to native Android APIs (camera, vibration, local notifications) via plugins if needed later
- 100% free, open source

**Steps to add Android support (Capacitor):**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init MealBox com.mealbox.app --web-dir=dist
npx cap add android
npm run build
npx cap sync
npx cap open android   # Opens Android Studio to build APK
```

Android Studio is free. The APK can be shared directly (side-loaded) — no Play Store required (Play Store costs $25 one-time if you want to publish later).

**PWA as a simpler alternative:**
If you don't need a real APK and just want Android home screen installation + offline support, a Progressive Web App (PWA) is even simpler:
```bash
npm install vite-plugin-pwa
```
Add the plugin to `vite.config.js` and users can "Add to Home Screen" from Chrome on Android. No APK, no Android Studio, works immediately. Limitation: no access to native Android APIs.

**Recommendation:**
- **Now:** Add PWA support (30-minute setup, immediate Android installability)
- **Later when needed:** Add Capacitor for a proper APK

---

### Firebase vs Supabase — Stay on Firebase

You mentioned Firebase restrictions. Before switching, here is the honest free-tier comparison:

| | Firebase Spark (free) | Supabase (free) |
|---|---|---|
| Database | Firestore: 1 GB, 50K reads/day, 20K writes/day | PostgreSQL: 500 MB |
| Auth | Unlimited | Unlimited |
| **Project pausing** | **Never paused** | **Paused after 7 days of inactivity** |
| Real-time | Yes (onSnapshot) | Yes (subscriptions) |
| Self-hostable | No | Yes |
| Query style | NoSQL (document) | SQL (PostgreSQL) |
| Migration cost | — | Full rewrite of all DB queries |

**The 7-day pause is a dealbreaker.** If you take a week off for a festival or holiday, you come back and your app is down until you manually wake it up from the Supabase dashboard. For a tiffin business running 6 days a week, this will happen. To avoid pausing you need Supabase Pro at $25/month — that is not free.

**Firebase Spark for your scale:**
- 50 clients × 30 days × 5 reads/client/day = 7,500 reads/day
- Your limit is 50,000 reads/day
- You have 6.6× headroom before hitting any limit
- You will not hit Firebase limits at your current or near-future scale

**The real Firebase problem is not Firebase — it is the missing security rules.** Any authenticated user can read your client data right now. Fix that (see Bug B4) and Firebase is solid for years.

**Recommendation: Stay on Firebase.** Do not migrate. The migration would rewrite every database query in the app for zero functional gain at your scale.

---

## 3. Architecture & Data Flow

```
Browser / Android (via PWA or Capacitor)
  │
  ├── LandingPage (/)           ← Public marketing page
  │
  └── AuthProvider (Firebase Auth)
        │
        └── ThemeProvider (localStorage)
              │
              └── Layout (Sidebar + Navbar)
                    │
                    ├── /dashboard             → DashboardPage
                    ├── /dashboard/analytics   → AnalyticsPage
                    ├── /clients               → ClientListPage
                    ├── /clients/:id           → ClientDetailPage
                    ├── /deliveries            → DailyDeliveryPage
                    ├── /billing               → BillingPage
                    ├── /bills/:id             → BillDetailPage
                    ├── /clients/:id/generate-bill → GenerateBillPage
                    └── /profile               → UserProfile
```

### Firestore Schema

```
firestore/
│
├── clients/{clientId}
│   ├── name, phone, address
│   ├── ownerId              ← owner's Firebase Auth UID
│   ├── status               ← "active" | "paused" | "inactive"
│   ├── customerType         ← "subscribed" | "ondemand"
│   ├── deliveryTimePreference
│   ├── plan
│   │   ├── (subscribed)  startDate, endDate
│   │   │                 lunch: { subscribed, price }
│   │   │                 dinner: { subscribed, price }
│   │   └── (ondemand)    date, mealType, price
│   ├── preferences
│   │   └── rotiCount, rice, spiceLevel, notes
│   ├── deliverySchedule
│   │   └── monday..sunday   ← booleans
│   ├── createdAt (Timestamp)
│   │
│   ├── pauses/{pauseId}
│   │   └── startDate, endDate, mealType, createdAt
│   │
│   └── orders/{orderId}     ← single extra tiffin orders
│       └── orderDate, mealType, price, status, createdAt
│
└── bills/{billId}
    ├── clientId, clientName, ownerId
    ├── billingPeriod: { start, end }
    ├── billingMonth         ← "YYYY-MM" (NOT always present — bug B2)
    ├── finalAmount
    ├── status               ← "paid" | "unpaid"
    ├── generatedAt (Timestamp)
    └── details
        ├── (subscribed) lunchesDelivered, lunchPrice, dinnersDelivered, dinnerPrice
        ├── (ondemand)   mainOrder, mainOrderAmount
        └── (both)       extraOrdersCount, extraOrdersAmount, extraOrders[]
```

---

## 4. What to Remove — Completely

These files and features waste complexity, show fake data, or have no place in a personal owner-only app. Delete or gut them.

### Remove: Landing Page (`src/pages/LandingPage.jsx`)

This is a full SaaS marketing page — hero, testimonials, pricing section, FAQ, "1st Tiffin Management Software of India" badge. You are building a personal tool for yourself. Nobody else is signing up. This page serves zero operational purpose and costs you maintenance time. The route `/` can redirect directly to `/login`.

**Remove when:** now — before any further development.

### Remove: Facebook Auth (`src/context/AuthContext.jsx`, `src/config/firebase.js`)

Facebook OAuth requires:
- Submitting your app for Facebook review
- Keeping a Privacy Policy URL live
- App going through periodic re-verification
- Business account setup

You are the only user. You log in with Google or email. Facebook auth has never been used and adds maintenance overhead every time Facebook changes its OAuth policy.

**Lines to remove:** `facebookProvider` import and export in `firebase.js`, `signInWithFacebook` in `AuthContext.jsx`, the Facebook button in `AuthPage.jsx`.

### Remove: `DeliveryInsights.jsx` — broken, shows fake data

This component:
- Uses wrong field names (`client.clientType` instead of `client.customerType`, `client.lunchEnabled` instead of `client.plan.lunch.subscribed`) — **all data it shows is zero or wrong**
- The "Peak Delivery Hours" chart generates values with `Math.floor(Math.random() * 20) + 15` — **literally random numbers on every page load**
- Has no `ownerId` filter — **fetches all clients from the database, not just yours**
- The weekly trends bar chart shows all zeros because of date format mismatch

It is imported into `AnalyticsPage.jsx` and renders, but shows completely wrong data. Users looking at it would make decisions based on fake numbers.

**Remove:** Delete the file, remove the import and usage in `AnalyticsPage.jsx`.

### Remove: `SmartRecommendations.jsx` — wrong data, no-op buttons, irrelevant for personal use

This component:
- Uses wrong field names (`client.clientType`, `client.lunchEnabled`, `bill.totalAmount`) — all calculations are based on wrong data
- Has no `ownerId` filter — reads all clients and bills in your Firestore, not just yours
- "Action" buttons (`Create Promotion`, `Design Subscription Offer`, `Scale Marketing`) do nothing — they have no `onClick` handlers
- The label "AI-Powered Insights" is false — it is simple if/else rules
- The recommendations ("Boost Customer Acquisition", "Run promotions", "Balance meals") are irrelevant for a single-person home tiffin service. You are not running a marketing campaign.

**Remove:** Delete the file, remove the import and usage in `AnalyticsPage.jsx`.

### Remove: `BusinessSummary.jsx` — already commented out

Already commented out in `AnalyticsPage.jsx`. Not used anywhere. Delete the file.

### Remove: `LiveNotifications.jsx` — not wired into Navbar, wrong field name

The component exists and is built, but:
- Uses `bill.totalAmount` instead of `bill.finalAmount` — shows wrong amounts
- No `ownerId` filter on queries
- Not imported or used in `Navbar.jsx` (it is just a floating file)

Since you are the only user and you are always on the app when something happens, real-time notifications add complexity without value. Delete it.

### Remove: `useDailyDeliveries.js` hook — unused

`src/hooks/useDailyDeliveries.js` exists but is not imported anywhere in the project. Dead code.

### Remove: `AuthPage.old.jsx` — stale

Old version of the auth page replaced by `AuthPage.jsx`. Delete it.

### Remove: `ClientInfoCard_fixed.jsx` — abandoned patch

An in-progress replacement for `ClientInfoCard.jsx` that was never merged or completed. The original is in use. Delete this.

### Remove: Hardcoded fake stats on Dashboard

In `DashboardPage.jsx`, the StatsCard change indicators show:
- `"+5 from yesterday"` — hardcoded
- `"+3 this week"` — hardcoded
- `"+12% from last month"` — hardcoded
- `"-8% from last week"` — hardcoded

These are fabricated. Remove the `change` and `changeType` props from these StatsCards entirely rather than display false information.

### Remove: `deliverySuccessRate: 98.5` from Dashboard state

`DashboardPage.jsx` line 41 initializes `deliverySuccessRate: 98.5` in state. This value is never calculated, never updated, and never displayed anywhere in the rendered output. Dead state.

### Remove: AnalyticsPage top StatsCards (or replace)

The four StatsCards at the top of `AnalyticsPage` — Revenue Insights `₹0`, Customer Analytics `0`, Growth Rate `0%`, Performance `0%` — are hardcoded zeros. They have been there since the page was written. Either wire them to real Firestore data or remove them entirely. Currently they actively mislead.

### Remove: All `console.log('[DEBUG]')` in GenerateBillPage

`src/pages/GenerateBillPage.jsx` has 6 debug console.logs that were never cleaned up. They print internal bill calculations to every user's browser console.

---

## 5. Pages & Features — Current State

### Dashboard (`/dashboard`) — MOSTLY WORKING
- Pulls active client count, monthly revenue (paid bills), pending payments, today's delivery list, new clients (last 48h)
- Delivery logic correctly handles subscription schedule by day-of-week, lunch/dinner pauses, single extra orders, on-demand orders
- **Issue:** Change indicators are hardcoded fake strings (see Remove section)
- **Issue:** N+1 Firestore queries — fetches pauses for each client in a loop

### Client List (`/clients`) — WORKING
- Tab view: Subscribed / On-Demand
- Add, edit, stats cards
- **Missing:** Search/filter by name or phone

### Add Client Modal — WORKING
- 3-step wizard for both client types
- **Bug:** Editing on-demand clients can save wrong plan shape (see B5)

### Client Detail (`/clients/:id`) — WORKING
- ClientInfoCard, BillingHistoryCard, OrderManager (real-time), PauseManager (FullCalendar)

### Daily Delivery Page (`/deliveries`) — BROKEN — priority rewrite
- Does not check `deliverySchedule[dayName]` — shows clients on days they don't get delivery
- No meal type split (lunch vs dinner)
- No delivery time, no price summary
- Dashboard has the correct logic — extract to a shared utility and reuse

### Billing Page (`/billing`) — WORKING
- Bills list, search, filter, stats, mark paid

### Generate Bill (`/clients/:id/generate-bill`) — MOSTLY WORKING
- **Bug:** Does not save `billingMonth` field — monthly revenue on Dashboard/Analytics breaks
- Has debug console.logs

### Bill Detail (`/bills/:id`) — WORKING

### Analytics (`/dashboard/analytics`) — PARTIALLY WORKING
- `RevenueAnalytics`: Line chart (6-month revenue), Pie chart (meal type), Bar chart (customer type) — real data, working
- `DeliveryInsights`: Broken — delete it (see Remove section)
- `SmartRecommendations`: Broken — delete it (see Remove section)
- Top StatsCards: All hardcoded zeros — remove or fix
- Analytics link in Sidebar: Commented out

### Auth (`/auth`) — WORKING
- Email/password, Google, email verification, forgot password, resend verification
- Facebook: working but should be removed (see Remove section)

### Landing Page (`/`) — WORKING but irrelevant — remove (see Remove section)

---

## 6. Bugs (Fix These First)

### B1 — Daily Delivery Page is wrong
**File:** `src/pages/DailyDeliveryPage.jsx`
Does not check `deliverySchedule[dayName]` — clients appear on days they don't get delivery. No meal type split. Rewrite using the logic from `DashboardPage.fetchDeliveryListPromise()`. Extract that logic to `src/utils/delivery.js` first.

### B2 — `billingMonth` not saved when generating bills
**File:** `src/pages/GenerateBillPage.jsx:94`
Add `billingMonth: startDate.substring(0, 7)` to the `addDoc` payload. The Dashboard monthly revenue query and RevenueAnalytics both depend on this field.

### B3 — Analytics top cards show hardcoded zeros
**File:** `src/pages/AnalyticsPage.jsx:52-85`
Either delete the cards or wire them to real queries.

### B4 — No Firestore security rules
Every Firestore query filters by `ownerId` in JavaScript — but the database has no rules. Any authenticated user with access to your Firebase project can read all data directly. Add security rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clients/{clientId} {
      allow read, write: if request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null;
      match /{subcollection}/{docId} {
        allow read, write: if request.auth.uid == get(/databases/$(database)/documents/clients/$(clientId)).data.ownerId;
      }
    }
    match /bills/{billId} {
      allow read, write: if request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null;
    }
  }
}
```

### B5 — On-demand client edit mode saves wrong plan shape
**File:** `src/components/AddClientModal.jsx:124`
When editing an on-demand client, `handleSubmit` enters the `mode === 'edit'` branch which saves subscription fields (`plan.lunch`, `plan.dinner`, `plan.startDate`). Add a separate branch for `formData.customerType === 'ondemand'` inside edit mode.

### B6 — Low activity alert logic is wrong
**File:** `src/components/SmartAlerts.jsx:93-123`
Flags subscribed clients with zero single-order documents as "low activity." Subscribed clients are active by definition. Better signal: `plan.endDate` is in the past (subscription expired).

### B7 — Debug console.logs in production
**File:** `src/pages/GenerateBillPage.jsx` lines 47, 48, 52, 76, 164, 165

### B8 — Dark mode incomplete
`ThemeContext` sets `data-theme` attribute but Tailwind's `dark:` classes need the `.dark` class on `<html>`. The two approaches conflict.

---

## 7. Performance Issues

### P1 — N+1 Firestore reads on dashboard and delivery
For each active client, a separate query fetches that client's `pauses` subcollection in a `for` loop. 20 clients = 21+ sequential round trips. Fix with `collectionGroup('pauses')` or cache in memory.

### P2 — SmartAlerts.jsx has its own N+1
Same pattern — loops over all subscribed clients fetching their orders subcollection.

### P3 — No shared state, every page refetches
Dashboard → Clients → Dashboard triggers 3 full data fetches. Introduce React Query or Zustand for shared caching.

### P4 — No `ownerId` filter in DeliveryInsights and SmartRecommendations
These components fetch `getDocs(collection(db, 'clients'))` with no filter — pulling the entire clients collection. (Another reason to delete them.)

---

## 8. What's Missing (Owner App Priorities)

### M1 — Cook Sheet (most important for daily ops)
A single-view "what do I cook today" summary:
- Total lunches and dinners for today
- Total rotis (sum of `preferences.rotiCount` for today's clients)
- Rice count (yes/no breakdown)
- Per-client row: name, meal type, roti count, spice level, delivery time window
Currently you have to mentally sum this every morning. A printable/shareable version would halve prep time.

### M2 — Bulk Bill Generation
Bills are generated one client at a time. For month-end with 20 clients that's 20 operations. Need "Generate bills for all active subscribers for [month]" on the Billing page.

### M3 — Subscription Renewal Alerts
No alert when `plan.endDate` is approaching (3 days) or has already passed. Add to SmartAlerts.

### M4 — Business Settings Page
Currently hardcoded in `pdfGenerator.js`:
- UPI ID: `9174867756@ybl` (line 134)
- Phone: `+91-9174867756` (line 144)
- Email: `mealbox@gmail.com` (line 144)

Store these in Firestore at `settings/{userId}` and build an editable Settings page. Every PDF will automatically use the right contact details.

### M5 — Client Status Management UI
The `status` field (`active/paused/inactive`) exists but there is no UI to change it. Add an "Activate / Deactivate" toggle directly on `ClientInfoCard`.

### M6 — Holiday / Closed Day
Pausing individual clients for a day off means N manual operations. Need a "Mark as holiday" feature — one action that blocks all deliveries and excludes that day from all billing calculations.

### M7 — Payment Mode Tracking
Bills are `paid/unpaid` with no record of how payment was received. Add a `paymentMode` field (Cash / UPI / Bank Transfer) shown when marking as paid. Useful for daily cash reconciliation.

### M8 — WhatsApp Quick Send
In India, this is how tiffin businesses actually communicate with clients. No WhatsApp API needed — just pre-built links:
- "Send bill reminder": `https://wa.me/91{phone}?text=Hello+{name},+your+tiffin+bill+of+%E2%82%B9{amount}+is+due`
- "Send today's cook summary": formatted text with the day's list
Add these as buttons on the billing page and client detail page.

### M9 — Delivery Sequence
The delivery list has no order. Add a drag-to-reorder or numbered sequence so you know exactly which route to take.

### M10 — Search in Client List
Add a text input that filters the client table by name or phone number.

---

## 9. Future Roadmap

### Phase 1 — Stabilize (do now)
Fix B1 (daily delivery page), B2 (billingMonth), B4 (Firestore rules), remove everything in Section 4. Add PWA support.

### Phase 2 — Productivity (1-2 months)
M1 (cook sheet), M2 (bulk billing), M3 (renewal alerts), M4 (settings page), M5 (status toggle), M6 (holidays), M7 (payment mode), M8 (WhatsApp links), M10 (search).

### Phase 3 — Android (when needed)
Add Capacitor to generate a proper Android APK. Use Capacitor's local notification plugin for morning delivery reminders.

### Phase 4 — Customer Portal (future)
- Separate customer login
- Customers view their subscription, bills, request pauses
- Requires multi-tenant Firestore security rules
- WhatsApp Bot integration for delivery ETAs

### Phase 5 — Scale (if it becomes a product)
- Multi-owner support (ownerId already in schema)
- Multiple delivery persons with route assignment
- Ingredient cost tracking for real profit calculation
- Mobile app (React Native at this point makes sense)

---

## 10. File Inventory — Status

| File | Status | Action |
|---|---|---|
| `src/pages/DashboardPage.jsx` | Working, issues | Fix fake stats, N+1 queries |
| `src/pages/ClientListPage.jsx` | Working | Add search |
| `src/pages/ClientDetailPage.jsx` | Working | Fix loading state |
| `src/pages/DailyDeliveryPage.jsx` | **Broken** | **Rewrite** |
| `src/pages/BillingPage.jsx` | Working | — |
| `src/pages/GenerateBillPage.jsx` | Working, bugs | Fix billingMonth, remove debug logs |
| `src/pages/BillDetailPage.jsx` | Working | — |
| `src/pages/AnalyticsPage.jsx` | Partial | Remove fake cards, remove broken components |
| `src/pages/AuthPage.jsx` | Working | Remove Facebook button |
| `src/pages/AuthPage.old.jsx` | **DELETE** | Stale file |
| `src/pages/LandingPage.jsx` | **REMOVE** | Not needed for personal tool |
| `src/pages/UserProfile.jsx` | Working | — |
| `src/components/AddClientModal.jsx` | Working, bug | Fix on-demand edit plan shape |
| `src/components/ClientInfoCard.jsx` | Working | Add status toggle |
| `src/components/ClientInfoCard_fixed.jsx` | **DELETE** | Orphan |
| `src/components/PauseManager.jsx` | Working | — |
| `src/components/OrderManager.jsx` | Working | — |
| `src/components/BillingHistoryCard.jsx` | Working | — |
| `src/components/BillsTable.jsx` | Working | — |
| `src/components/RevenueAnalytics.jsx` | Working | Real data, keep |
| `src/components/DeliveryInsights.jsx` | **DELETE** | Wrong fields, fake random data |
| `src/components/SmartAlerts.jsx` | Partial | Fix low-activity logic, keep rest |
| `src/components/SmartRecommendations.jsx` | **DELETE** | Wrong fields, no-op buttons, irrelevant |
| `src/components/BusinessSummary.jsx` | **DELETE** | Commented out, never used |
| `src/components/LiveNotifications.jsx` | **DELETE** | Not wired up, wrong field name |
| `src/components/Sidebar.jsx` | Working | Uncomment Analytics link |
| `src/components/Layout.jsx` | Working | — |
| `src/components/Navbar.jsx` | Working | — |
| `src/components/GeneratePDFButton.jsx` | Working | — |
| `src/components/QuickActions.jsx` | Working | — |
| `src/components/RecentActivity.jsx` | Working | — |
| `src/utils/billing.js` | Working | Core logic correct |
| `src/utils/pdfGenerator.js` | Working | Move hardcoded UPI/contact to settings |
| `src/hooks/useDailyDeliveries.js` | **DELETE** | Unused |
| `src/context/AuthContext.jsx` | Working | Remove Facebook, fix loading flash |
| `src/context/ThemeContext.jsx` | Working | — |
| `src/config/firebase.js` | Working | Remove facebookProvider |

---

## 11. Priority Order (Recommended)

```
IMMEDIATE (breaks operations or security)
  1. Add Firestore security rules              [B4]
  2. Rewrite DailyDeliveryPage                [B1]
  3. Fix billingMonth on bill save            [B2]
  4. Delete junk files (6 files)             [Section 4]
  5. Remove Facebook auth                    [Section 4]

HIGH (daily friction)
  6. Cook sheet page                         [M1]
  7. Business settings page (UPI, contact)   [M4]
  8. Client status toggle UI                 [M5]
  9. Fix billingMonth so analytics works     [B2]
 10. Add search to client list               [M10]

MEDIUM (quality of life)
 11. Bulk bill generation                    [M2]
 12. Subscription renewal alerts             [M3]
 13. WhatsApp quick links                    [M8]
 14. Holiday / closed day management         [M6]
 15. Payment mode tracking                   [M7]
 16. Fix analytics top cards                 [B3]

LOW (cleanup + future)
 17. Remove Landing Page                     [Section 4]
 18. Add PWA support (Android install)       [Tech Stack]
 19. Fix dark mode inconsistency             [B8]
 20. Fix N+1 Firestore queries               [P1, P2]
 21. Add React Query for caching             [P3]
 22. Add Capacitor for native Android APK    [Tech Stack]
```

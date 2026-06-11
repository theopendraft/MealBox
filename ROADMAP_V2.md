# MealBox — Version 2 Complete Roadmap
> Single source of truth for all planning, UI/UX, and implementation decisions.
> Built from: MEALBOX_AUDIT.md + BUSINESS_BLUEPRINT.md
> Date: 2026-06-11

---

## The North Star

One person runs a home tiffin service. Every morning they cook. Every afternoon and evening they deliver. At month-end they collect payment. The app must make each of those three moments effortless — not add overhead to them.

**Design contract:** Every core daily action must be completable in ≤ 2 taps from wherever the owner is in the app.

---

## How the Owner Actually Uses This App (Workflow First)

Before any UI or code decision, this is the real daily sequence:

```
6:00 AM  — Wake up, open app
           → Need to know: how many tiffins, total chapatis, spice breakdown
           → Kitchen View is the HOME SCREEN

7:00 AM  — Start cooking using Kitchen View numbers

12:00 PM — Start lunch deliveries
           → Delivery Route View: ordered list grouped by area
           → For each stop: tap delivered / add modifier / skip
           → No navigation away from the list — inline actions only

2:00 PM  — Lunch done
           → "Close Lunch" button locks all lunch records

7:00 PM  — Start dinner deliveries (same flow)

9:00 PM  — Dinner done
           → "Close Dinner" locks records
           → App shows today's revenue total

[Month-end, any evening]
           → Open Billing tab
           → See each customer's running total
           → Tap "Generate & Send Bill" → WhatsApp opens, pre-filled
           → Customer pays → tap "Mark Paid" → balance resets to ₹0

[Anytime]
           → Customer calls to pause → open their profile → tap Pause
           → New customer → tap "+" → 3 fields → done in 30 seconds
           → Customer hits 30 tiffins → see loyalty card → tap to WhatsApp them
```

This workflow drives every decision below.

---

## UI/UX Design System

### Navigation — Bottom Bar (Mobile First)

The app is used primarily on a phone, one-handed, often while doing other things. No sidebar on mobile. A persistent bottom navigation bar with 4 items:

```
┌──────────────────────────────────────────────┐
│                                              │
│              [page content]                  │
│                                              │
├──────┬──────────┬───────────┬────────────────┤
│  🍳  │    🚚    │    👥     │      ₹         │
│Kitchen│ Delivery │ Customers │   Billing      │
└──────┴──────────┴───────────┴────────────────┘
```

The sidebar (current design) stays for desktop/tablet. On mobile (<768px), it is replaced by the bottom bar.

### Color System

| Color | Meaning | Usage |
|---|---|---|
| Red (#EF4444) | Brand / Primary | Buttons, active nav, plan badges |
| Green (#10B981) | Delivered / Paid / Good | Status: delivered, paid |
| Orange (#F97316) | Pending / In-progress | Status: pending, running total |
| Amber (#F59E0B) | Paused / Warning | Status: paused, alerts |
| Gray (#6B7280) | Skipped / Inactive | Status: skipped, inactive clients |
| Blue (#3B82F6) | Information / Neutral | Analytics, info cards |

### Plan Type Badges

Every plan type has a consistent visual identity used everywhere (list, delivery card, kitchen view, bill):

```
[Regular]   — white text on red-600 bg         ₹80
[Trial]     — white text on amber-500 bg        ₹90
[Customize] — white text on purple-600 bg       ₹100
[Premium]   — white text on yellow-600 bg       ₹150
             (gold feel — star icon prefix)
```

### Interaction Principles

1. **No confirmation dialogs for reversible actions.** "Mark Delivered" can be undone by tapping again. No `window.confirm()`.
2. **Inline actions on cards.** The delivery card shows the action buttons directly. No navigating into a detail page to mark delivered.
3. **Swipe gestures on mobile delivery list.** Swipe right = delivered (green flash). Swipe left = skip (gray flash). Visual feedback only — no dialog.
4. **Large tap targets.** Minimum 48×48px for all interactive elements. The owner may be tapping with wet hands in a kitchen.
5. **Skeleton loaders, not spinners.** Every loading state shows the shape of the content, not a spinning circle.
6. **Toast notifications for actions.** No alert(). A toast appears bottom-center for 2 seconds: "✓ Ramesh marked as delivered" or "✓ Bill sent".
7. **Morning / Delivery / Evening context.** The app detects time of day and surfaces the right default tab:
   - 6 AM–11 AM → Kitchen View highlighted
   - 11 AM–2 PM → Delivery View (Lunch) highlighted
   - 3 PM–6 PM → Customers / Billing
   - 6 PM–10 PM → Delivery View (Dinner) highlighted

### Typography & Spacing

- Use existing Tailwind setup — no new font imports needed
- Key numbers (chapati count, revenue total, tiffin count) always render at `text-4xl font-bold`
- Section headers: `text-lg font-semibold text-gray-800`
- Customer names in delivery cards: `text-base font-semibold`
- Addresses and secondary info: `text-sm text-gray-500`
- Minimum body font: `text-sm` — never `text-xs` for actionable content

---

## WhatsApp Integration — 3 Tiers

### Tier 1 — wa.me Links (Zero Setup, Available Now)

Every "Send on WhatsApp" button generates a `https://wa.me/91{phone}?text={encoded_message}` URL. Tapping it opens WhatsApp with the message pre-filled. Owner taps Send. Done.

**Works for:**
- Monthly bill text message
- Loyalty milestone messages ("You've had 30 tiffins with us!")
- Promotional announcements ("This Sunday: Special Rajma Chawal — ₹100")
- Payment reminders

**Limitation:** Cannot send PDFs via wa.me links. One tap per customer (not bulk-automated).

**Used in:** Phase 3 (billing), Phase 4 (milestones, promos).

### Tier 2 — WhatsApp Cloud API (Free, Setup Required)

Meta's official WhatsApp Business Cloud API has a permanent free tier:
- 1,000 free business-initiated conversations per month
- Sends text, PDFs, images, template messages
- No monthly cost — only pay above 1,000 conversations

**Setup process (one-time, ~2 hours):**
1. Create Meta Business Manager account (free)
2. Add a WhatsApp Business Account
3. Register a phone number (can be your existing number)
4. Get API access token
5. Store token in Firebase settings document or `.env`

**Required for:**
- Sending the bill PDF directly to customer (not just a text)
- Automated milestone messages triggered by Firestore (no manual tap)
- Bulk promotional sends to all active customers at once

**Used in:** Phase 4 (automated sends).

### Tier 3 — Firebase Cloud Functions Triggers (Free Tier)

Firebase free tier includes 125,000 Cloud Function invocations/month. Use these to:
- Watch `dailyRecords` writes → check if customer hits milestone (30, 50, 100 delivered)
- If milestone hit → write a notification document to Firestore
- App reads notification → shows milestone card
- (With Tier 2 API) → auto-send WhatsApp message

**Used in:** Phase 4.

### WhatsApp Message Templates

#### Bill Message
```
*MealBox Tiffin — Monthly Bill*

Hi {name} 🙏

Your bill for *{month}*:

{line items: date — plan — modifiers — ₹amount}

Total Delivered: {N} days
*Total Due: ₹{amount}*

Pay via UPI: {upiId}
Or Cash on next delivery.

Thank you! 🍱
```

#### Loyalty Milestone (30 Tiffins)
```
Hi {name}! 🎉

You've completed *30 tiffins* with MealBox!
Thank you for your trust and loyalty.

As a token of appreciation, your next tiffin is *on us* ☺️
(or whatever reward the owner decides)

See you tomorrow! — MealBox 🍱
```

#### Promotional Message
```
*MealBox — Special Announcement* 🍱

Hi {name}!

{custom message — owner types this}

— MealBox Tiffin Service
```

#### Payment Reminder
```
Hi {name},

A gentle reminder that your MealBox bill of *₹{amount}* for {month} is pending.

Pay via UPI: {upiId}

Thanks 🙏
```

---

## Phase 0 — Cleanup (Week 1)
> No new features. Get the codebase to a stable, correct baseline.

### Goals
- App works correctly for its current functions
- No broken pages, no fake data, no dead files
- Security rules in place

### Tasks

**Delete these files immediately**
- `src/pages/AuthPage.old.jsx`
- `src/pages/LandingPage.jsx` → replace `/` route with redirect to `/login`
- `src/components/ClientInfoCard_fixed.jsx`
- `src/components/DeliveryInsights.jsx`
- `src/components/SmartRecommendations.jsx`
- `src/components/BusinessSummary.jsx`
- `src/components/LiveNotifications.jsx`
- `src/hooks/useDailyDeliveries.js`

**Fix critical bugs**
- Remove all `console.log('[DEBUG]')` from `GenerateBillPage.jsx`
- Remove Facebook auth from `AuthContext.jsx`, `firebase.js`, `AuthPage.jsx`
- Add `billingMonth: startDate.substring(0, 7)` to bill save in `GenerateBillPage.jsx`
- Remove hardcoded change text from all StatsCards on Dashboard
- Remove `deliverySuccessRate: 98.5` dead state from Dashboard

**Add Firestore security rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clients/{clientId} {
      allow read, write: if request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null
                    && request.resource.data.ownerId == request.auth.uid;
      match /{sub}/{docId} {
        allow read, write: if request.auth.uid ==
          get(/databases/$(database)/documents/clients/$(clientId)).data.ownerId;
      }
    }
    match /bills/{billId} {
      allow read, write: if request.auth.uid == resource.data.ownerId;
      allow create: if request.auth != null
                    && request.resource.data.ownerId == request.auth.uid;
    }
    match /settings/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

**Fix Daily Delivery Page (B1)**
Rewrite `DailyDeliveryPage.jsx` using the correct logic already present in `DashboardPage.fetchDeliveryListPromise()`. Extract to `src/utils/delivery.js` first so both pages share it.

**Fix Analytics sidebar link**
Uncomment the Analytics link in `Sidebar.jsx`.

**Replace `alert()` and `window.confirm()`**
Wire the existing `Toast.jsx` component to a `ToastContext`. Replace every `alert()` and `window.confirm()` call across the codebase.

### Deliverable
A working v1 app with no broken pages, no fake data, no dead files, and security rules active.

---

## Phase 1 — Foundation (Weeks 2–3)
> New data model, settings page, plan types. No UI overhaul yet.

### Goals
- The new Firestore schema from BUSINESS_BLUEPRINT.md is in place (alongside old data)
- Owner can configure their business details
- Customer profiles use `planType` instead of free-form price

### Tasks

**Settings Page (`/settings`)**

New page accessible from the bottom nav or profile. Fields:
- Business Name
- Owner Name
- Phone
- Email
- UPI ID
- Modifier Rates: Extra Chapati (₹), Curd (₹), Extra Side (₹)

Stored in `settings/{ownerId}` Firestore document. All PDFs and WhatsApp messages pull from here — no hardcoded values anywhere.

```
┌─────────────────────────────────────────┐
│  ⚙ Settings                             │
├─────────────────────────────────────────┤
│  Business Name    [MealBox Tiffin     ] │
│  Your Phone       [+91 91748 67756   ] │
│  UPI ID           [9174867756@ybl    ] │
│                                         │
│  ── Modifier Rates ──────────────────   │
│  Extra Chapati    [₹ 7 ]               │  ← updated to ₹7 per blueprint edit
│  Extra Curd       [₹ 15]               │
│  Extra Side Dish  [₹ 20]               │
│                                         │
│         [Save Settings]                 │
└─────────────────────────────────────────┘
```

**Update AddClientModal — Plan Type System**

Replace current plan fields with the 4-tier system:

Step 3 of the modal becomes:
```
┌─────────────────────────────────────────┐
│  Select Plan                            │
│                                         │
│  ○ Regular    ₹80   5 Chapatis, Rice…   │
│  ○ Trial      ₹90   One-time only       │
│  ○ Customize  ₹100  Custom/Sunday menu  │
│  ● Premium    ₹150  6 Butter Chapatis…  │  ← selected
│                                         │
│  Delivery Days  [Mon Tue Wed Thu Fri]   │
│  Delivery Slot  [12pm–1pm ▼]            │
│  Route Area     [Nagar Road ▼]          │  ← new field
│                                         │
│  Default Preferences                    │
│  Spice   [Medium ▼]   Rice [Normal ▼]   │
│  Notes   [                           ]  │
└─────────────────────────────────────────┘
```

Remove from modal:
- Free-form price entry
- `plan.lunch` / `plan.dinner` checkboxes
- `plan.startDate` / `plan.endDate` (no longer needed for recurring plans)
- `rotiCount` numeric input (derived from planType)
- `rice: Yes/No` binary (replaced by `riceVolume: Less/Normal/More`)

**Add `routeArea` to customer profiles**

Predefined list of locality names (editable from Settings). Owner adds area names once; each customer is assigned one. Used for grouping in the Delivery Route View.

**Migration utility**

Write a one-time migration script (run manually from browser console or a hidden admin page):
- `clients` where `customerType === 'subscribed'` → set `planType = 'regular'`
- `clients` where `customerType === 'ondemand'` → set `planType = 'trial'`
- Preserve all other data unchanged

Old `customerType` field kept for backward compat during transition, removed in Phase 5.

**Client Status Toggle**

Add an "Active / Pause / Deactivate" toggle directly on `ClientInfoCard`. Currently only editable in Firestore directly.

```
┌─ Ramesh Sharma ──────────────────────── [Edit] ─┐
│  📞 9876543210                                   │
│  📍 Flat 302, Tower B, Nagar Road                │
│  ⏰ 12pm–1pm  •  [Regular] ₹80                  │
│                                                  │
│  Status: ● Active                               │
│  [● Active]  [⏸ Pause]  [✕ Deactivate]          │
└──────────────────────────────────────────────────┘
```

### Deliverable
All customers have `planType`. Settings page live. Route areas configured. Client status toggleable from UI.

---

## Phase 2 — Daily Operations Engine (Weeks 4–6)
> The core of the new architecture. This is where the biggest work is.

### Goals
- `dailyRecords` subcollection exists and is populated
- Kitchen View is the home screen
- Delivery Route View works correctly with inline actions
- Modifiers can be added per delivery
- Daily closing locks records

### 2A — Daily Record Generation

**`src/utils/dailyRecords.js`** — core utility

```javascript
// Called every morning (or on-demand from Kitchen View)
// Creates dailyRecord documents for all active, non-paused customers
// scheduled for today

createTodayRecords(ownerId, settings)
  → for each active customer where deliverySchedule[today] === true
  → check pauses subcollection — skip if paused today
  → setDoc(customers/{id}/dailyRecords/{YYYY-MM-DD}, {
      date: "YYYY-MM-DD",
      planType: customer.planType,
      basePriceSnapshot: PLAN_PRICES[customer.planType],
      status: "pending",
      billingModifiers: [],
      kitchenOverrides: null,
      dayTotal: PLAN_PRICES[customer.planType],
      createdAt: serverTimestamp()
    }, { merge: true })   // idempotent — safe to call multiple times
```

Records use the date as the document ID (`2026-06-11`) so calling this twice on the same day is safe.

**When is this called?**
The owner taps "Start Today" on the Kitchen View when they open the app each morning. No automated cron on free Firebase plan — manual trigger is simpler and more reliable for a single operator.

### 2B — Kitchen View (`/kitchen`) — New Home Screen

This is what the owner sees first thing in the morning.

```
┌─────────────────────────────────────────────────┐
│  🍳 Kitchen View          Wednesday, 11 Jun     │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  21  Total Tiffins Today                │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  BOXES TO PACK                                   │
│  ┌───────────┬──────┐  ┌───────────┬──────┐    │
│  │ Regular   │  12  │  │ Trial     │   2  │    │
│  │ Customize │   3  │  │ Premium   │   4  │    │
│  └───────────┴──────┘  └───────────┴──────┘    │
│                                                  │
│  CHAPATIS TO ROLL                    113         │
│  Base (5×17 + 6×4)     109                      │
│  + Extra requested       +6                      │
│  - Reduced requested     -2                      │
│                                                  │
│  SPICE BATCHES                                   │
│  🟢 Low      3    🟡 Medium   15    🔴 High   3  │
│                                                  │
│  RICE                                            │
│  Less: 2  │  Normal: 17  │  More: 2             │
│                                                  │
│  ADD-ONS                                         │
│  Extra Curd: 4    Extra Side: 1                  │
│                                                  │
│  ─────────────────────────────────────────────  │
│  [  Start Today's Records  ]   [Go to Delivery→] │
└─────────────────────────────────────────────────┘
```

"Start Today's Records" calls `createTodayRecords()`. The button becomes "Records Ready ✓" after running. Idempotent — safe to tap again.

All numbers come from today's `dailyRecords` documents aggregated in real-time via `onSnapshot` on a `collectionGroup('dailyRecords')` query filtered by `date === today` and `ownerId`.

### 2C — Delivery Route View (`/delivery`) — Replaces DailyDeliveryPage

Two tabs: **Lunch** and **Dinner** (based on delivery slot).

```
┌─────────────────────────────────────────────────┐
│  🚚 Delivery Route           11 Jun  [Lunch▼]   │
│                                                  │
│  12/21 delivered  ████████░░░░  57%              │
│                                                  │
│  ── Nagar Road ─────────────────────────────    │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Ramesh Sharma         [Regular] ₹80      │   │
│  │ Flat 302, Tower B  •  ⚠ +2 Roti, HIGH   │   │
│  │                                          │   │
│  │  [✓ Delivered]  [Skip]  [+ Modify]       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Priya Mehta           [Premium] ₹150     │   │
│  │ Shop 5, Main Market   •  Standard        │   │
│  │                                          │   │
│  │  [✓ Delivered]  [Skip]  [+ Modify]       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ── Station Area ───────────────────────────    │
│  ...                                            │
│                                                  │
│  ─────────────────────────────────────────────  │
│          [  🔒 Close Lunch (12 delivered)  ]     │
└─────────────────────────────────────────────────┘
```

**Delivered:** Updates `dailyRecord.status → "delivered"`. Card turns green. Progress bar increments.

**Skip:** Updates `dailyRecord.status → "skipped"`. Card turns gray. No billing for that day.

**+ Modify:** Opens a bottom sheet (not a new page):

```
┌─ Add Modifier — Ramesh Sharma ──────────────────┐
│                                                  │
│  Base: Regular ₹80                              │
│                                                  │
│  BILLING MODIFIERS                               │
│  [+ Extra Chapati] (₹7 each)  — qty: [0] [+][-] │
│  [+ Extra Tiffin]  (+₹80)                        │
│  [+ Curd]          (+₹15)      ☑                 │
│  [+ Extra Side]    (+₹20)                        │
│                                                  │
│  KITCHEN OVERRIDES (today only)                  │
│  Spice  [Low] [Medium●] [High]                   │
│  Rice   [Less] [Normal●] [More]                  │
│                                                  │
│  Today's Total: ₹80 + ₹15 (Curd) = ₹95          │
│                                                  │
│  [Save Modifiers]                                │
└──────────────────────────────────────────────────┘
```

Bottom sheet saves to `dailyRecord.billingModifiers[]` and recalculates `dayTotal`. Closes on save. No page navigation.

**Close Lunch / Close Dinner:** Locks all records with `status: "delivered"` for that slot. Sets `status → "locked"`. The close button is disabled until at least one delivery is confirmed. Shows count of delivered vs total.

### 2D — Customer Ledger View (`/customers/:id/ledger`)

Replaces the current `BillingHistoryCard`. Shows the full month calendar of daily records.

```
┌─ Ramesh Sharma — June 2026 Ledger ──────────────┐
│                                                  │
│  Running Total: ₹1,820    Delivered: 22 days     │
│                                                  │
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun               │
│  [80] [90] [P ] [80] [95] [80] [ ]               │  ← Jun 1-7
│  [80] [80] [80] [SK] [80] [80] [ ]               │  ← Jun 8-14
│  ...                                             │
│                                                  │
│  Legend: [₹] Delivered  [P] Paused  [SK] Skipped │
│                                                  │
│  ── June Detail ─────────────────────────────── │
│  04 Jun  Regular + Curd          ₹95             │
│  03 Jun  PAUSED                  ₹0              │
│  02 Jun  Regular + 2 Roti        ₹94             │  ← 80 + 2×7
│  01 Jun  Regular                 ₹80             │
│                                                  │
│  [← May]                             [Jul →]     │
└──────────────────────────────────────────────────┘
```

Tapping any delivered day shows the modifier detail. Tapping a delivered/locked day shows an "Override" option (retroactive adjustment — changes delivered → skipped, recalculates total, logs timestamp).

### Deliverable
Full daily operations flow working: Kitchen View → Delivery Route → Modifiers → Close Day → Ledger visible per customer.

---

## Phase 3 — Billing Engine (Weeks 7–8)
> Month-end invoice generation, WhatsApp sending, payment recording.

### Goals
- Billing is driven by `dailyRecords` not retrospective date calculation
- Invoice auto-generated from locked records
- WhatsApp send button on every bill
- Retroactive adjustments and interim settlements work
- Mark as Paid archives the cycle

### 3A — Cycles Subcollection

Each customer gets a `cycles/{YYYY-MM}` document that aggregates their month's locked records.

**`src/utils/cycles.js`**
```javascript
// Called when generating a bill — reads all locked dailyRecords for the month
// and writes/updates the cycle document
generateCycle(customerId, month)  // month = "2026-06"
  → query dailyRecords where date starts with "2026-06"
                        and status in ["locked", "delivered"]
  → sum dayTotal → write cycles/2026-06

// Called when a record is retroactively adjusted
recalculateCycle(customerId, month)
  → same aggregation, overwrites cycle total
```

### 3B — Billing Page Redesign

The current Billing page (`/billing`) shows a flat list of `bills`. The new version shows active cycles grouped by customer.

```
┌─────────────────────────────────────────────────┐
│  ₹ Billing — June 2026              [All ▼]     │
│                                                  │
│  Total Outstanding: ₹14,200                     │
│  Collected this month: ₹8,800                   │
│                                                  │
│  ── Unpaid ────────────────────────────────     │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Ramesh Sharma                [Regular]   │   │
│  │ 22 days delivered            ₹1,820 DUE  │   │
│  │ [View Ledger] [Generate Bill] [WhatsApp] │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Priya Mehta                  [Premium]   │   │
│  │ 20 days delivered            ₹3,000 DUE  │   │
│  │ [View Ledger] [Generate Bill] [WhatsApp] │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ── Paid ──────────────────────────────────     │
│  Sunita Verma     ₹1,600   ✓ Paid via UPI       │
│  ...                                            │
│                                                  │
│  [Generate Bills for All Unpaid Customers]       │
└─────────────────────────────────────────────────┘
```

### 3C — Bill Generation Flow

Tapping "Generate Bill" on a customer:
1. System reads their cycle document (pre-aggregated) — no calculation needed
2. Shows a review screen (same as current BillDetailPage but driven by daily records)
3. Two buttons: **Download PDF** and **Send on WhatsApp**

**WhatsApp Bill Button:**
```javascript
const buildWhatsAppLink = (customer, cycle, settings) => {
  const lines = cycle.dailyRecords
    .filter(r => r.status === 'locked' || r.status === 'delivered')
    .map(r => `${formatDate(r.date)} — ${r.planType} ${formatModifiers(r)} ₹${r.dayTotal}`)
    .join('\n');

  const message = `*MealBox Tiffin — Monthly Bill*\n\n`
    + `Hi ${customer.name} 🙏\n\n`
    + `Your bill for *${cycle.month}*:\n\n`
    + `${lines}\n\n`
    + `Total Delivered: ${cycle.totalDelivered} days\n`
    + `*Total Due: ₹${cycle.totalAmount}*\n\n`
    + `Pay via UPI: ${settings.upiId}\n\n`
    + `Thank you! 🍱`;

  return `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
};
```

One tap → WhatsApp opens → one more tap → sent. Total: 2 taps from billing page to bill delivered.

### 3D — Mark as Paid

When the owner taps "Mark as Paid" on a customer's cycle:
- Modal appears: **Payment Mode** selector (Cash / UPI / Bank Transfer)
- On confirm: `cycles/{month}.status → "paid"`, `paymentMode` logged, `paidAt` set
- Customer's running balance on their profile shows ₹0
- Cycle is now read-only (no further edits)
- Toast: "✓ Ramesh Sharma — June 2026 marked as paid (UPI)"

### 3E — Interim Settlement (Mid-Month Exit)

Button on customer profile: "Settle Now". Used when a customer stops mid-month.

Flow:
1. Tap "Settle Now" on ClientInfoCard
2. System shows: "Generate bill up to today (22 Jun)? 15 days delivered = ₹1,200"
3. Owner confirms
4. Cycle marked `settled`, bill generated, customer status → `inactive`
5. Future daily runs stop including this customer automatically

### 3F — Retroactive Delivery Adjustment

On the Customer Ledger View, tapping a locked delivered day shows:

```
┌─ 04 June 2026 ──────────────────────────────────┐
│  Status: DELIVERED (Locked)                      │
│  Regular + Curd = ₹95                            │
│                                                  │
│  Customer says this delivery didn't happen?      │
│  [Mark as Skipped — removes ₹95 from bill]       │
│                                                  │
│  This action is logged and cannot be undone.     │
└──────────────────────────────────────────────────┘
```

Tapping "Mark as Skipped":
- `dailyRecord.status → "skipped"`, `adjustedAt`, `adjustedBy` written
- `recalculateCycle()` runs → cycle total updates immediately
- Toast: "✓ 04 Jun removed — bill reduced by ₹95"

### Deliverable
Complete billing engine. Owner can go from "month is done" → "WhatsApp bill sent" → "Mark as Paid" in under 2 minutes per customer. Bulk bill action handles all customers at once.

---

## Phase 4 — WhatsApp Engagement System (Weeks 9–10)
> Milestone notifications, promotional messages, automated sends.

### Goals
- Owner is notified when a customer hits a tiffin milestone
- Owner can send promotional messages to all customers in 3 taps
- (Optional) WhatsApp Cloud API for automated PDF sending

### 4A — Milestone System

**Milestones tracked:**
| Milestone | Trigger | Message |
|---|---|---|
| 10 tiffins | Total delivered = 10 | "Welcome to the MealBox family!" |
| 30 tiffins | Total delivered = 30 | Loyalty reward / thank you |
| 50 tiffins | Total delivered = 50 | Special mention |
| 100 tiffins | Total delivered = 100 | Premium loyalty reward |

**How it works (Firebase Cloud Functions — free tier):**

```javascript
// Firestore trigger on dailyRecord write
exports.checkMilestone = onDocumentWritten(
  'customers/{customerId}/dailyRecords/{date}',
  async (event) => {
    const after = event.data.after.data();
    if (after.status !== 'locked') return;

    // Count total delivered records for this customer
    const allRecords = await getDocs(
      query(collectionGroup('dailyRecords'),
            where('customerId', '==', event.params.customerId),
            where('status', '==', 'locked'))
    );
    const count = allRecords.size;
    const milestones = [10, 30, 50, 100];

    if (milestones.includes(count)) {
      // Write a notification document
      await addDoc(collection(db, 'notifications'), {
        ownerId: after.ownerId,
        customerId: event.params.customerId,
        type: 'milestone',
        milestone: count,
        read: false,
        createdAt: serverTimestamp()
      });
    }
  }
);
```

**In-app milestone card (on Dashboard/Kitchen View):**

```
┌─────────────────────────────────────────────────┐
│  🎉 Milestone Reached!                     [✕]  │
│                                                  │
│  Ramesh Sharma has had 30 tiffins with you!      │
│                                                  │
│  [Send Loyalty Message on WhatsApp]              │
└─────────────────────────────────────────────────┘
```

Tapping "Send Loyalty Message" opens a pre-filled wa.me link. One tap to deliver.

Milestone cards stack if multiple fire at once. Owner can dismiss without sending.

### 4B — Promotional Broadcast

A "Broadcast" button in the Customers page header. Owner types one message and gets wa.me links for every active customer — tap each one to send.

```
┌─ Send Promotional Message ──────────────────────┐
│                                                  │
│  Template: [Sunday Special ▼]  or type custom   │
│                                                  │
│  Message:                                        │
│  ┌────────────────────────────────────────────┐ │
│  │ This Sunday: Special Rajma Chawal Tiffin   │ │
│  │ at the regular price of ₹80.               │ │
│  │ Limited slots — confirm by Saturday 8pm!   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Send to: ● All Active (21)  ○ Regular only      │
│           ○ Premium only     ○ Custom select      │
│                                                  │
│  [Generate WhatsApp Links]                       │
│                                                  │
│  ─── Ready to Send ──────────────────────────── │
│  Ramesh Sharma    [Open WhatsApp ↗]              │
│  Priya Mehta      [Open WhatsApp ↗]              │
│  ...                                            │
└──────────────────────────────────────────────────┘
```

Each link is a `wa.me` deep link. Owner taps each, sends, taps back. Not automated — personal touch maintained, which matters for a home tiffin service relationship.

### 4C — WhatsApp Cloud API (Optional Automation)

If the owner wants to eliminate the manual "tap each link" step for billing and milestone messages:

1. Set up WhatsApp Cloud API (see Tier 2 above)
2. Store API token in `settings/{ownerId}.whatsappToken`
3. Bill sending becomes one button → API sends message + PDF attachment to all unpaid customers
4. Milestone messages auto-send when Cloud Function fires (no in-app card needed)

This is marked optional because:
- The Meta Business verification process takes 1–3 days
- `wa.me` links already work well for small customer counts
- Adds a dependency on Meta's API uptime

**Implement this only when manual sending becomes a bottleneck (20+ customers).**

### Deliverable
Milestone notifications appear automatically. Owner can broadcast a promo in 3 taps. Bill sending is 2 taps per customer (or 1 tap total with Cloud API).

---

## Phase 5 — Android & PWA (Week 11)
> Make the app installable on Android without a Play Store.

### Step 1 — PWA (30 minutes, deploy immediately)

Install `vite-plugin-pwa`. Configure service worker. Add to `vite.config.js`:

```javascript
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'MealBox',
    short_name: 'MealBox',
    theme_color: '#EF4444',
    background_color: '#ffffff',
    display: 'standalone',        // full screen, no browser bar
    orientation: 'portrait',
    icons: [{ src: '/MealBox.png', sizes: '192x192', type: 'image/png' }]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [{
      urlPattern: /^https:\/\/firestore\.googleapis\.com/,
      handler: 'NetworkFirst',
      options: { cacheName: 'firestore-cache' }
    }]
  }
})
```

After deploying: visit the app in Chrome on Android → browser shows "Add to Home Screen" banner → installed. Opens full screen, no URL bar, looks like an app.

**Offline support:** Kitchen View and Delivery Route View cache today's data. If signal drops mid-delivery, the app still shows the list. Actions queue and sync when signal returns.

### Step 2 — Capacitor APK (when needed)

When the owner wants a real shareable `.apk` file:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init MealBox com.mealbox.app --web-dir=dist
npx cap add android

# Add local notification plugin for morning delivery reminders
npm install @capacitor/local-notifications
npx cap sync
```

Add a morning notification (9 AM daily):
```javascript
import { LocalNotifications } from '@capacitor/local-notifications';

// Scheduled once when app first opens
LocalNotifications.schedule({
  notifications: [{
    id: 1,
    title: 'MealBox — Kitchen Time',
    body: `Open app to see today's cook sheet`,
    schedule: { every: 'day', at: new Date().setHours(9, 0, 0, 0) }
  }]
});
```

Generate APK in Android Studio → share as direct download or WhatsApp file (no Play Store needed).

### Deliverable
App installs from Chrome on Android (PWA). Optional APK available. Morning notification works.

---

## Phase 6 — Polish & Stability (Week 12)
> Performance, error handling, edge cases. Before calling it v2.

### Tasks

**Performance**
- Implement `collectionGroup('dailyRecords')` with composite indexes for Kitchen View aggregation instead of N+1 queries
- Add `React.memo` to delivery card components (list can be 20–30 items, all re-rendering on each status update)
- Lazy load Analytics page (heavy chart components)

**Offline resilience**
- Firestore's built-in offline cache handles most cases
- Add `enableIndexedDbPersistence(db)` to `firebase.js` — enables offline reads and queued writes

**Error boundaries**
- Wrap each page in an `ErrorBoundary` component
- If Kitchen View fails to load, show a fallback with a manual refresh button — not a white screen

**Edge cases**
- Customer with no records this month (new customer, joined mid-month) → billing shows ₹0, "No deliveries yet"
- Trial customer delivered → auto-set `status: inactive` → removed from next day's run
- Month rollover at midnight → new cycle document created, Kitchen View clears to 0
- Duplicate "Start Today" tap → idempotent `setDoc` with merge — no duplicate records

**Dark mode fix**
- Standardize on Tailwind `class` strategy. Remove `data-theme` attribute approach.
- Add `.dark` to `<html>` element when theme is dark. All existing `dark:` classes will work.

---

## Complete Feature Map — V1 vs V2

| Feature | V1 Status | V2 Status | Phase |
|---|---|---|---|
| Firebase security rules | Missing | Added | 0 |
| Daily Delivery Page | Broken | Replaced by Delivery Route View | 0+2 |
| Landing Page | Irrelevant | Removed | 0 |
| Facebook Auth | Unused | Removed | 0 |
| Toast notifications | Built, unused | Wired everywhere | 0 |
| 4 Plan Tiers (₹80/90/100/150) | None | Full system | 1 |
| Settings Page (UPI, rates) | Hardcoded | Editable | 1 |
| Route Area grouping | None | Per-customer field | 1 |
| Client Status Toggle | No UI | Inline toggle | 1 |
| Daily Records (Khata) | None | Core engine | 2 |
| Kitchen View (Cook Sheet) | None | New home screen | 2 |
| Delivery Route View | None (broken page) | Grouped, inline actions | 2 |
| Modifier Engine (+chapati, +curd) | None | Per-delivery bottom sheet | 2 |
| Daily Closing / Lock | None | Lunch + Dinner close buttons | 2 |
| Customer Ledger (per-day calendar) | None | Full calendar view | 2 |
| Billing from daily records | None | Cycle aggregation | 3 |
| WhatsApp bill sending | None | wa.me pre-filled link | 3 |
| Retroactive adjustment | None | Override on locked record | 3 |
| Interim Settlement | None | Settle Now button | 3 |
| Mark as Paid (with payment mode) | Toggle only | Full cycle archive | 3 |
| Bulk bill generation | None | One button for all | 3 |
| Milestone notifications (30 tiffins) | None | Cloud Function + in-app card | 4 |
| Promotional broadcast | None | Template + wa.me links | 4 |
| WhatsApp Cloud API (auto send) | None | Optional, Token-based | 4 |
| PWA (installable on Android) | None | vite-plugin-pwa | 5 |
| Morning notification | None | Capacitor local notification | 5 |
| Android APK | None | Capacitor build | 5 |
| Offline support | None | Firestore persistence + SW | 5+6 |
| Error boundaries | None | Per-page boundary | 6 |
| Performance (N+1 fix) | Has N+1 | collectionGroup queries | 6 |

---

## New Firestore Indexes Required

Composite indexes to add in Firebase Console (or `firestore.indexes.json`):

```json
{
  "indexes": [
    {
      "collectionGroup": "dailyRecords",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "date",    "order": "ASCENDING" },
        { "fieldPath": "status",  "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "dailyRecords",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "date",    "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "cycles",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "status",  "order": "ASCENDING" },
        { "fieldPath": "month",   "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## New File Structure (V2 Target)

```
src/
├── components/
│   ├── ui/                       ← keep all, add ToastContext
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── StatsCard.jsx
│   │   ├── Toast.jsx             ← wire to ToastContext
│   │   ├── BottomSheet.jsx       ← NEW: modifier panel container
│   │   └── PlanBadge.jsx         ← NEW: Regular/Trial/Customize/Premium badge
│   ├── AddClientModal.jsx        ← update: planType system
│   ├── ClientInfoCard.jsx        ← update: status toggle, planType display
│   ├── BillingHistoryCard.jsx    ← replace: point to CustomerLedger
│   ├── BillsTable.jsx            ← update: driven by cycles
│   ├── DeliveryCard.jsx          ← NEW: single customer card in route view
│   ├── ModifierPanel.jsx         ← NEW: bottom sheet for +chapati, +curd, etc.
│   ├── MilestoneCard.jsx         ← NEW: "🎉 30 tiffins!" dismissable card
│   ├── WhatsAppButton.jsx        ← NEW: reusable wa.me link button
│   ├── Layout.jsx                ← update: bottom nav on mobile
│   ├── Sidebar.jsx               ← keep for desktop
│   ├── BottomNavBar.jsx          ← NEW: mobile bottom nav
│   ├── Navbar.jsx                ← keep
│   ├── GeneratePDFButton.jsx     ← keep, update data source
│   ├── PauseManager.jsx          ← keep as-is
│   ├── OrderManager.jsx          ← remove (replaced by daily records)
│   ├── QuickActions.jsx          ← update links
│   ├── RecentActivity.jsx        ← keep
│   ├── RevenueAnalytics.jsx      ← keep, update data source
│   └── SmartAlerts.jsx           ← keep, fix low-activity logic, add milestone
│
├── pages/
│   ├── KitchenPage.jsx           ← NEW: home screen
│   ├── DeliveryRoutePage.jsx     ← NEW: replaces DailyDeliveryPage
│   ├── CustomerListPage.jsx      ← rename from ClientListPage, update
│   ├── CustomerDetailPage.jsx    ← rename from ClientDetailPage, update
│   ├── CustomerLedgerPage.jsx    ← NEW: per-day record calendar
│   ├── BillingPage.jsx           ← update: cycle-driven
│   ├── BillDetailPage.jsx        ← keep, update data source
│   ├── SettingsPage.jsx          ← NEW
│   ├── AnalyticsPage.jsx         ← fix top cards, remove broken components
│   ├── AuthPage.jsx              ← keep, remove Facebook
│   └── UserProfile.jsx           ← keep
│
├── routes/
│   ├── AppRoutes.jsx             ← update routes, add new pages
│   └── ProtectedRoute.jsx        ← keep
│
├── context/
│   ├── AuthContext.jsx           ← remove Facebook
│   ├── ThemeContext.jsx          ← fix dark mode to .dark class
│   └── ToastContext.jsx          ← NEW: global toast system
│
├── hooks/
│   ├── useTodayRecords.js        ← NEW: onSnapshot for today's dailyRecords
│   ├── useCustomerCycle.js       ← NEW: current month cycle for a customer
│   └── useSettings.js           ← NEW: owner settings from Firestore
│
├── utils/
│   ├── dailyRecords.js           ← NEW: createTodayRecords, lockRecords
│   ├── cycles.js                 ← NEW: generateCycle, recalculateCycle
│   ├── whatsapp.js               ← NEW: buildBillLink, buildMilestoneLink, buildPromoLink
│   ├── delivery.js               ← NEW: shared delivery list logic (extracted from Dashboard)
│   ├── pdfGenerator.js           ← update: pull from settings, cycle data
│   └── billing.js                ← keep temporarily, remove in Phase 5
│
├── config/
│   └── firebase.js               ← remove facebookProvider
│       plans.js                  ← NEW: PLAN_TYPES constant { regular: 80, ... }
│
└── styles/
    ├── index.css
    ├── animations.css
    └── theme.css                 ← fix dark mode to .dark class strategy
```

---

## Timeline Summary

| Phase | Name | Duration | Key Output |
|---|---|---|---|
| 0 | Cleanup | Week 1 | Stable, secure, correct v1 |
| 1 | Foundation | Weeks 2–3 | Plan tiers, settings, route areas |
| 2 | Daily Operations | Weeks 4–6 | Kitchen View, Delivery Route, Modifier Engine |
| 3 | Billing Engine | Weeks 7–8 | WhatsApp bills, retroactive edits, Mark as Paid |
| 4 | WhatsApp Engagement | Weeks 9–10 | Milestones, promos, optional API |
| 5 | Android | Week 11 | PWA + optional APK |
| 6 | Polish | Week 12 | Performance, offline, error handling |

**Total: 12 weeks from start to stable V2.**

Each phase is independently deployable. Deploy at end of every phase — don't batch.

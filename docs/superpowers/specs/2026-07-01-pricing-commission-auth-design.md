# Pricing, Commission & Auth — Design Spec

**Date:** 2026-07-01
**Project:** HAB Barbershop POS System
**Status:** Approved — ready for implementation

---

## Overview

Four improvements in one spec, split into two implementation plans:

- **Plan A — Pricing & Commission:** barber tiers, booking price, product commission
- **Plan B — Auth & Roles:** PIN login, lock screen, role-based access control

---

## 1. Barber Tiers

### Concept

Each barber optionally belongs to a tier (`junior`, `senior`, `master`). Services optionally define a price per tier. When a barber is selected at the POS or Appointments, service prices auto-update to match the barber's tier price. Services without tier pricing stay at their flat price regardless of barber.

### Data changes

**Barbers** — add one field:
```js
tier: 'junior' | 'senior' | 'master' | null
// null = no tier; flat service prices always apply to this barber
```

**Services** — add one field:
```js
tierPrices: { junior: number, senior: number, master: number } | null
// null = service has no tier pricing; single flat price applies to everyone
// if set, all three tiers must have a value
```

### Price resolution logic

```
function resolvePrice(service, barber):
  if service.tierPrices != null AND barber.tier != null:
    return service.tierPrices[barber.tier]
  return service.price
```

This function is used in POS (when barber changes or service is added) and in Appointments (when showing the effective price).

### POS behaviour

- When the barber is selected or changed in the POS, every **service** item already in the cart has its unit price recalculated via `resolvePrice()`.
- **Inventory/product items** in the cart are never affected by tier changes.
- The recalculated price is shown immediately; subtotal and total update.

### Services management

- Service edit modal gains a **"Tier Pricing"** toggle (checkbox).
- When OFF: single price field (current behaviour).
- When ON: three price inputs — Junior, Senior, Master — replace the single price field.
- Toggling OFF after tier prices were set clears `tierPrices` and restores `price` as the single flat value. Warn with a confirm dialog before clearing.

### Appointments

- When barber + service are both selected in the appointment form, display the effective price (resolved via `resolvePrice()`).
- The appointment record stores `bookedPrice: number` — the resolved price at creation time. This is the price used if the appointment is converted to a POS transaction.

---

## 2. Booking Price

### Concept

Some services may charge a different price for pre-booked appointments vs walk-ins. This is an optional override per service. If not set, bookings use the same price as walk-ins (after tier resolution).

### Data change

**Services** — add one field:
```js
bookingPrice: number | null
// null = use walk-in price (after tier resolution) for bookings
// if set, this price applies to all bookings regardless of barber tier
```

### Price resolution for appointments

```
function resolveBookingPrice(service, barber):
  if service.bookingPrice != null:
    return service.bookingPrice       // booking price overrides tier pricing
  return resolvePrice(service, barber) // fall back to tier/flat price
```

### Services management

- Service edit modal gains an optional **"Booking Price (RM)"** input field below the main price.
- Leave blank for no override. Shows placeholder "Same as walk-in".

### Appointment booking form

- Show the resolved booking price next to the service selector as a label: e.g. `Haircut — RM 25 (booking rate)` or `Haircut — RM 20`.
- The appointment record stores `bookedPrice` using `resolveBookingPrice()`.

### "Process Payment" button

- Each appointment card in the Appointments view gains a **"Process Payment"** button (shown for `confirmed` and `completed` status appointments).
- Clicking it calls `POS.prefill({ barberId, serviceId, price: bookedPrice })` and navigates to the POS view.
- POS `prefill()` method: clears the current order, adds the service item at `bookedPrice` (bypassing standard price resolution), selects the barber, sets customer name from the appointment.
- Staff reviews the pre-filled order and proceeds to payment normally.

---

## 3. Product Commission

### Concept

Each inventory product can have a fixed RM commission amount. When a barber sells that product at the POS, they earn that commission. Commissions are snapshotted into the transaction at sale time and surfaced in Analytics per barber.

### Data change

**Inventory items** — add one field:
```js
commissionRM: number | null
// null or 0 = no commission for this product
// e.g. 5 means selling barber earns RM 5 per unit sold
```

**Transaction items** (objects inside `transaction.services[]`) — add two fields:
```js
type: 'service' | 'product'
// 'service' = haircut/treatment/etc; 'product' = inventory item sold
commissionRM: number | null
// snapshot of commissionRM at sale time (only present when type === 'product')
```

Existing transactions without `type` are treated as `type: 'service'` for backward compatibility.

### POS behaviour

- When an inventory item is added to the cart, it is tagged `type: 'product'` and carries `commissionRM` from the inventory record.
- On payment confirmation, each cart item is saved into the transaction with its `type` and `commissionRM` values.
- No change to the cart UI — commission is invisible to staff at checkout.

### Inventory management

- Product edit modal gains an optional **"Commission (RM)"** field.
- Leave blank or 0 for no commission. Accepts decimal values (e.g. 2.50).

### Analytics — Commission section

New section added at the bottom of the Analytics view, below existing charts.

**Title:** Staff Commission Report

**Display:** Table, one row per barber, filtered by the existing date-range selector.

| Barber | Products Sold | Product Revenue | Commission Earned |
|--------|--------------|-----------------|-------------------|
| Razif Hakim | 8 units | RM 200 | RM 40 |

**Calculation per barber:**
```
For each transaction in date range where barberId matches:
  For each item where type === 'product' AND commissionRM > 0:
    productsSold += item.qty
    productRevenue += item.price * item.qty
    commissionEarned += item.commissionRM * item.qty
```

**Visibility:** Commission section is only visible when the user has owner role (Plan B). In the meantime (before Plan B is built), it is always visible.

---

## 4. Auth & Roles

### Concept

PIN-based session authentication. One owner PIN, one staff PIN. Role is stored in `sessionStorage` — cleared when the browser tab closes. Staff role hides restricted nav items and blocks direct navigation to restricted modules.

### Data change

**Settings** — add two fields:
```js
pins: {
  owner: '1234',   // default — owner should change on first use
  staff: '0000'    // default — owner sets this for their team
},
staffAccess: {
  analytics:  false,
  services:   false,
  barbers:    false,
  inventory:  false,
  settings:   false,
  customers:  true    // staff can access Customers by default
}
```

Note: `customers: true` by default since staff needs to look up customers. All other non-operational modules default to false.

### Session storage

```js
sessionStorage.getItem('hab_role')  // 'owner' | 'staff' | null
```

`null` means not authenticated — PIN screen is shown.

### PIN screen

- Full-screen overlay rendered in `index.php` before the main app layout.
- Controlled by `Auth.init()` called at the very top of app boot.
- Shows the shop name and a 4-digit PIN dot display.
- User clicks digit buttons (0–9) or types on keyboard.
- Auto-submits on the 4th digit.
- Correct owner PIN → `sessionStorage.setItem('hab_role', 'owner')` → hide overlay.
- Correct staff PIN → `sessionStorage.setItem('hab_role', 'staff')` → hide overlay.
- Wrong PIN → shake animation, clear input, show "Incorrect PIN".
- No lockout after wrong attempts (simple POS, not a high-security system).

### Lock button

- Sidebar footer gets a **"Lock"** button (replaces or sits beside the collapse button).
- `Auth.lock()`: `sessionStorage.removeItem('hab_role')` → show PIN overlay.

### Module access enforcement

**Nav item visibility:** On app boot (after auth), `Auth.applyRole()` runs:
- Reads current role from sessionStorage.
- If `'staff'`: hides nav items for each module where `staffAccess[module] === false`.
- If `'owner'`: all nav items visible.

**Router guard:** `Router.go(view)` checks `Auth.canAccess(view)` before switching:
```
Auth.canAccess(view):
  if role === 'owner': return true
  if role === 'staff': return staffAccess[view] ?? true  // unknown views default to accessible
  return false
```
If access denied → stay on current view + `showToast('Access restricted', 'error')`.

### Settings — Security section

New collapsible section in Settings (visible to owner only via role guard):

- **Owner PIN** — current PIN shown as dots, "Change" button opens a mini-modal: enter new PIN twice to confirm.
- **Staff PIN** — same pattern.
- **Staff module access** — a grid of toggles, one per restricted module. Owner flips toggles to grant/revoke access. Saved to `AppData.settings.staffAccess` immediately.
- Changes to `staffAccess` take effect immediately — saving triggers `Auth.applyRole()` to re-apply nav visibility without requiring a lock/re-login.

### New files

| File | Purpose |
|------|---------|
| `assets/js/auth.js` | `Auth` object — init, lock, canAccess, applyRole |
| `views/pin-screen.php` | PIN overlay HTML (included in index.php, hidden after auth) |

`auth.js` loads first — before all other module scripts.

---

## Files Changed

### Plan A — Pricing & Commission

| Action | File |
|--------|------|
| Modify | `assets/js/app.js` — add `tier` to barber data, `tierPrices`/`bookingPrice` to service data, `commissionRM` to inventory data |
| Modify | `assets/js/services-mgmt.js` — tier pricing toggle + booking price field in edit modal |
| Modify | `assets/js/pos.js` — price recalc on barber change, tag items as service/product, save commissionRM, `POS.prefill()` method |
| Modify | `assets/js/appointments.js` — show effective price, store `bookedPrice`, "Process Payment" button |
| Modify | `assets/js/barbers.js` — tier field in add/edit modal |
| Modify | `assets/js/analytics.js` — commission table section |
| Modify | `assets/js/inventory.js` — commissionRM field in edit modal |

### Plan B — Auth & Roles

| Action | File |
|--------|------|
| Create | `assets/js/auth.js` |
| Create | `views/pin-screen.php` |
| Modify | `assets/js/app.js` — `pins` + `staffAccess` in DEFAULT_DATA.settings |
| Modify | `index.php` — include pin-screen.php, load auth.js first |
| Modify | `assets/js/app.js` — Router.go() calls Auth.canAccess() |
| Modify | `partials/sidebar.php` — Lock button, Auth.applyRole() on boot |
| Modify | `assets/js/settings.js` — Security section with PIN change + staffAccess toggles |

---

## Implementation Order

Build Plan A first. Auth (Plan B) can be layered on top cleanly because:
- Plan A features are testable without auth
- Plan B reads existing module names that Plan A may add to Router.pages
- Auth is the final gate before client handover

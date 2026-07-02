# Onboarding / Setup Wizard — Design Spec

**Date:** 2026-07-02
**Project:** HAB Barbershop POS System
**Status:** Approved — ready for implementation

---

## Overview

A guided setup wizard that lets the shop owner clear demo data and configure the system before handing it to the client. Triggered manually from Settings → Security (owner-only). Covers: branch name/details, owner and staff PINs, first barber, and first services for branch 1.

---

## 1. Trigger

The wizard is triggered by an "Initial Setup" button in the Security section of Settings (`views/settings.php`). This section is already owner-only (hidden from staff via `Auth.applyRole()`). The button calls `SetupWizard.open()`.

The wizard can be run more than once — useful if the owner wants to re-onboard or reset. Each run wipes and rewrites the relevant data.

---

## 2. Structure

A full-screen overlay (`position: fixed`, `z-index: 9998` — below the PIN screen at `9999`). Lives in `views/setup-wizard.php`. JS logic in `assets/js/setup-wizard.js`.

The overlay starts **hidden** (`id="setup-wizard" class="hidden"`) and is revealed by `SetupWizard.open()`. Clicking outside or pressing ESC does nothing — the wizard cannot be abandoned mid-way. Only "Finish" on step 7 commits data and closes the overlay.

**7 steps, forward-only navigation.** A row of 7 progress dots at the top fills in gold (`#C9A84C`) as the user advances. No back button.

### Steps

| # | Title | Required inputs |
|---|-------|----------------|
| 1 | Welcome | None — intro screen, "Start Setup" button |
| 2 | Branch Details | Branch name (text), address (text), phone (text) |
| 3 | Owner PIN | 4-digit PIN + confirm |
| 4 | Staff PIN | 4-digit PIN + confirm |
| 5 | First Barber | Name (text), initials (auto-generated, editable) |
| 6 | Add Services | Table of rows: service name + price (RM). At least 1 row required. |
| 7 | Done | Summary + "Go to Dashboard" button |

---

## 3. Validation

Each step blocks the Next button until required fields are satisfied:

- **Step 2:** Branch name required. Address and phone optional.
- **Step 3:** Exactly 4 digits entered. Confirm matches.
- **Step 4:** Exactly 4 digits entered. Confirm matches.
- **Step 5:** Name required. Initials auto-generated from name (first letter of each word, max 2 chars, uppercase) but editable.
- **Step 6:** At least one service row with a non-empty name and a numeric price ≥ 0.

PIN input on steps 3–4 uses `<input type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*">` — not the PIN dot UI (that's for the lock screen only).

---

## 4. Services Step Detail

Displayed as a table. Each row: Name (text input), Price RM (number input), Delete button (trash icon). A "+ Add service" link appends a blank row. Minimum 1 row, no maximum enforced.

New services are saved with these defaults:
- `cat: 'hair'`
- `icon: 'fa-scissors'`
- `duration: 30`
- `is_active: true`
- `tierPrices: null`
- `bookingPrice: null`
- `branchId: 1`

The owner edits category, icon, and duration later via Services Management.

---

## 5. Data Clearing (on Finish)

On "Go to Dashboard" (step 7), `SetupWizard._finish()` executes:

**Cleared keys** (set to empty arrays):
- `AppData.barbers = []`
- `AppData.services = []`
- `AppData.appointments = []`
- `AppData.transactions = []`
- `AppData.inventory = []`
- `AppData.queue = []`
- `AppData.customers = []`

**Updated in-place** (not cleared):
- `AppData.settings.pins.owner` ← wizard owner PIN
- `AppData.settings.pins.staff` ← wizard staff PIN
- `AppData.branches[0].name` ← wizard branch name
- `AppData.branches[0].address` ← wizard address (if entered)
- `AppData.branches[0].phone` ← wizard phone (if entered)

**Written from wizard inputs:**
- One barber pushed to `AppData.barbers` with `branchId: 1`, auto-assigned color from a fixed palette (index 0)
- All service rows pushed to `AppData.services` with defaults above

**Save calls** (one per changed key):
```js
AppData.save('barbers');
AppData.save('services');
AppData.save('appointments');
AppData.save('transactions');
AppData.save('inventory');
AppData.save('queue');
AppData.save('customers');
AppData.save('settings');
AppData.save('branches');
```

**After saving:** Close wizard (`#setup-wizard` gets `hidden` class back), call `Auth.lock()` to return to the PIN screen so the owner logs back in with the new PIN on fresh data.

Branch 2 data (barbers, services, etc.) is also wiped. The owner sets up branch 2 through normal Settings → Branches and Services Management after the wizard.

---

## 6. Step 7 — Done Screen

Shows a read-only summary:
- Branch name
- "Owner and staff PINs set"
- Barber name
- Number of services added

Single button: "Finish Setup" — triggers `_finish()`. After saving, the wizard closes and `Auth.lock()` is called, returning to the PIN screen so the owner verifies the new PIN works before handing over the device.

---

## 7. Files Changed

| File | Change |
|------|--------|
| `views/setup-wizard.php` | New — overlay HTML: 7 step panels, progress dots, form fields |
| `assets/js/setup-wizard.js` | New — `SetupWizard` object: step navigation, validation, data commit |
| `assets/css/style.css` | Append wizard styles (panel show/hide, progress dot fill, service table) |
| `index.php` | Include `setup-wizard.php` after `pin-screen.php`; add `setup-wizard.js` script tag |
| `views/settings.php` | Add "Initial Setup" button in Security section |

---

## 8. Out of Scope

- Setting up branch 2 via the wizard (done through normal Settings after)
- Adding barbers for branch 2 in the wizard
- Inventory setup (done through Inventory management after)
- Category/icon/duration editing for services (done through Services Management after)
- Auto-triggering on first load (manual trigger only)
- Undo / back navigation within the wizard

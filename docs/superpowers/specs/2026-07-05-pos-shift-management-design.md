# POS Shift Management Design

## Overview

Add session-based opening and closing to the POS. Before any payment can be processed, a shift must be opened for the day with an opening cash float. At the end of the day the owner closes the shift and reviews a summary: revenue by payment method, per-barber performance, and a cash variance (expected vs actual counted).

---

## Requirements

- **One shift per branch per day.** Once a shift is closed it cannot be re-opened.
- **Anyone can open** (staff or owner, no PIN required).
- **Only the owner can close** (requires owner PIN).
- **Hard block:** The POS view shows a locked screen until a shift is open. No items can be added or payments processed without an open session.
- **Cross-device sync:** Shift state propagates to other devices within 30 seconds via the existing poll cycle.

---

## Data Model

### New MySQL table: `shifts`

```sql
CREATE TABLE shifts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  branch_id   INT NOT NULL,
  date        DATE NOT NULL,
  open_time   TIME NOT NULL,
  open_by     VARCHAR(20) NOT NULL,        -- 'owner' or 'staff'
  open_float  DECIMAL(10,2) NOT NULL DEFAULT 0,
  close_time  TIME DEFAULT NULL,
  close_float DECIMAL(10,2) DEFAULT NULL,  -- actual cash counted at close
  close_note  VARCHAR(255) DEFAULT NULL,
  status      ENUM('open','closed') NOT NULL DEFAULT 'open',
  UNIQUE KEY uq_branch_date (branch_id, date)
);
```

One row per branch per day. The `UNIQUE KEY` on `(branch_id, date)` prevents duplicate shifts.

---

## API

### `api/shifts.php`

All requests require the `X-API-Token` header (same token as all other endpoints).

| Method | Params | Action |
|--------|--------|--------|
| `GET`  | `?branch_id=1&date=2026-07-05` | Returns today's shift row as JSON, or `{ "shift": null }` if none exists |
| `POST` | Body: `{ branch_id, open_by, open_float }` | Inserts a new shift row with `status='open'`, returns `{ ok: true, shift: { id, ... } }` |
| `PATCH`| Body: `{ id, close_float, close_note }` | Sets `close_time=NOW()`, `status='closed'`, returns `{ ok: true }` |

---

## JavaScript Architecture

### `App.session` (on the existing `App` object)

Initialised at boot from the GET response:

```js
App.session = {
  isOpen:    false,
  id:        null,
  date:      null,
  openTime:  null,
  openBy:    null,
  openFloat: 0
}
```

Hydrated by `SessionManager.load(shiftRow)` at boot and after each poll cycle.

### New file: `assets/js/session.js`

**`SessionManager` object — public API:**

| Method | Description |
|--------|-------------|
| `load(shiftRow)` | Hydrates `App.session` from a shift row (or resets to closed if `null`) |
| `open(float, openedBy)` | POSTs to `api/shifts.php`, hydrates `App.session`, calls `POS.init()` to unlock |
| `close(closeFloat, closeNote)` | PATCHes `api/shifts.php`, locks POS, renders close report modal |
| `renderLockedScreen()` | Injects the "POS Closed" overlay into the POS view panel |
| `renderStatusBar()` | Injects the thin shift-info strip above POS controls |
| `requireOwnerPin(callback)` | Shows a PIN input dialog; calls `Auth.verifyPin('owner', pin)` and invokes `callback` only on success |

### `api/shifts.php` integration in `app.js`

- **`API.fetchShift(branchId, date)`** — `GET api/shifts.php?branch_id=X&date=Y`
- **`API.openShift(payload)`** — `POST api/shifts.php`
- **`API.closeShift(payload)`** — `PATCH api/shifts.php`

These three methods are added to the existing `API` object in `app.js`.

### Boot sequence change (`App.init()`)

After `fetchAll()` resolves, also call `API.fetchShift(branchId, today)` and pass the result to `SessionManager.load()`. Both calls can be parallelised with `Promise.all`.

### Poll change (`App._startPolling()`)

Every 30s poll also calls `API.fetchShift()`. If the returned shift status differs from `App.session.isOpen`, call `SessionManager.load()` and re-evaluate the POS gate.

### POS gate (`pos.js → init()`)

```js
init() {
  if (!App.session.isOpen) {
    SessionManager.renderLockedScreen();
    return;
  }
  SessionManager.renderStatusBar();
  // ... existing init logic ...
}
```

Router navigating to the POS view also re-calls `POS.init()` so the gate re-evaluates on every visit.

---

## UI

### Locked Screen

Shown inside the POS view area (replaces service grid + cart) when no session is open. Contains:
- Lock icon + "POS Closed" heading
- Today's date
- Gold "Open Session" button

No route change — the locked screen renders in-place inside `#view-pos`.

### Open Session Modal (`modal-open-session`)

- Input: "Opening Cash Float (RM)" (number, default 0)
- Button: "Open Session" — calls `SessionManager.open(float, openedBy)`
- No PIN required

### POS Status Bar (injected above POS controls when session is open)

```
Session opened at 09:30  ·  Float: RM 150          [Close Session]
```

"Close Session" is a gold-outlined button. Clicking it calls `SessionManager.requireOwnerPin()`.

### Close Session Modal (`modal-close-session`)

Two steps in one modal:

**Step 1 — Cash count:**
- Input: "Actual Cash in Drawer (RM)"
- Input: "Note (optional)"
- Button: "Generate Report" — computes totals and renders Step 2 inline

**Step 2 — Shift report (rendered inline after confirming cash count):**
- Total revenue + transaction count for the shift
- Breakdown by payment method: Cash · Card · QR
- Per-barber table: barber name · transactions · revenue
- Cash reconciliation:
  - Opening float + total cash sales = Expected cash in drawer
  - Actual cash entered by staff
  - **Variance** = Actual − Expected (shown green if ≥ 0, red if negative)
- Button: "Print" — calls `window.print()`; the report section is wrapped in `<div id="shift-report-print">` and a `@media print` CSS rule hides everything except that div
- Button: "Close Session" → calls `SessionManager.close()`, locks POS

---

## File Changes Summary

| File | Change |
|------|--------|
| `database.sql` | Add `CREATE TABLE shifts` |
| `api/shifts.php` | New file — GET / POST / PATCH |
| `assets/js/app.js` | Add `API.fetchShift`, `API.openShift`, `API.closeShift`; update `App.session`; update `App.init()` and `App._startPolling()` |
| `assets/js/session.js` | New file — `SessionManager` object |
| `assets/js/pos.js` | Add session gate at top of `init()` |
| `views/pos.php` | Add locked screen placeholder + open/close modals HTML |
| `index.php` | Add `<script src="assets/js/session.js">` |

---

## Error & Edge Cases

- **Shift already exists for today:** The `UNIQUE KEY` constraint rejects a duplicate POST. API returns `{ ok: false, error: 'shift_exists', shift: { ... } }` with the existing row. Client silently hydrates `App.session` from the returned shift and unlocks the POS — this is a normal idempotent re-open.
- **Previous day's shift still open:** On boot, `api/shifts.php` GET checks if the returned shift's `date` is before today. If so, the server auto-closes it (`status='closed'`, `close_time=NOW()`, `close_note='Auto-closed'`, `close_float=NULL`) and returns `{ shift: null }`. The client then shows the "Open Session" locked screen for today.
- **Offline:** If `API.fetchShift()` fails, `App.session.isOpen` remains `false` and the POS stays locked. A toast informs the user the server is unreachable.
- **Close fails (network error):** `SessionManager.close()` shows an error toast and keeps the modal open so the owner can retry.

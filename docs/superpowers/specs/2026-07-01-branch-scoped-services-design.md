# Branch-Scoped Services — Design Spec

**Date:** 2026-07-01
**Project:** HAB Barbershop POS System
**Status:** Approved — ready for implementation

---

## Overview

Services are currently a global flat array shared across all branches. This spec makes services branch-scoped: each service belongs to exactly one branch, so Branch A and Branch B can have different service menus and independent prices.

The pattern mirrors how barbers and inventory already work — a `branchId` field on each record, filtered by `App.currentBranch` at the point of use.

---

## 1. Data Model

### Change

Add one field to each service record:

```js
branchId: number  // which branch this service belongs to
```

### Migration

Existing localStorage data has services without `branchId`. On app boot, a one-time migration pass assigns `branchId: 1` to any service record missing the field. No DATA_VERSION bump — this is additive and non-destructive.

```js
// In App.init(), before any module loads:
if (AppData.services.some(s => s.branchId == null)) {
  AppData.services.forEach(s => { if (s.branchId == null) s.branchId = 1; });
  AppData.save('services');
}
```

Only saves when orphan services actually exist. After the first boot, all records have `branchId` and the guard short-circuits.

### DEFAULT_DATA

The 10 sample services are split between branches for realistic demo data:
- Branch 1 (Kota Bharu): Haircut, Beard Trim, Hair Wash, Hair Coloring, Kids Haircut, Full Package
- Branch 2 (Kedai Lalat): Hot Towel Shave, Hair Treatment, Eyebrow Trim, Hair Styling

---

## 2. Behaviour Changes

### Services Management — `assets/js/services-mgmt.js`

- `init()`: filter `AppData.services` by `App.currentBranch` before rendering cards. Staff only sees and manages services for the currently active branch.
- `save()` — add branch: when adding a new service, write `branchId: App.currentBranch` into the new record.
- `save()` — edit branch: when editing an existing service, preserve its existing `branchId` unchanged.

### POS Service Grid — `assets/js/pos.js`

- `renderServiceGrid()`: filter `AppData.services` by `App.currentBranch` before rendering the service buttons. The cashier only sees services available at their branch.

### Appointments Booking Modal — `assets/js/appointments.js`

- Service `<select>` population: filter `AppData.services` by `App.currentBranch` when building the dropdown options.
- `getServiceById(id)` (used for price resolution and `processPayment`): searches ALL services regardless of branch. This is intentional — existing booked appointments may reference a service ID from a branch that is no longer the active branch, and those records must still resolve correctly.

### Analytics — `assets/js/analytics.js`

No change. Analytics reads service names from transaction snapshots (stored as strings at sale time), not from the live services array.

### Branch Switching

No extra work. `App.setBranch()` already calls `Router.go(Router.current)`, which re-initialises the current view module. Since each module filters on `App.currentBranch` at init time, switching branches automatically shows the correct service list everywhere.

---

## 3. Files Changed

| File | Change |
|------|--------|
| `assets/js/app.js` | Add `branchId` to DEFAULT_DATA.services; add migration pass in `App.init()` |
| `assets/js/services-mgmt.js` | Filter by `App.currentBranch` in `init()`; write `branchId` on new service save |
| `assets/js/pos.js` | Filter by `App.currentBranch` in `renderServiceGrid()` |
| `assets/js/appointments.js` | Filter by `App.currentBranch` when populating service select |

---

## 4. Out of Scope

- Copying a service from one branch to another (can be done manually by adding the same service in each branch)
- Shared service catalog with per-branch price overrides (not needed — full independence is the requirement)
- Any change to how service names are stored in transactions (already snapshots at sale time)

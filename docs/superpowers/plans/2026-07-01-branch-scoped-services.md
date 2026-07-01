# Branch-Scoped Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make services branch-specific so each branch has its own independent service menu and prices.

**Architecture:** Add `branchId` to every service record (matching the existing pattern for barbers and inventory). Add a `branchServices()` helper in `app.js` alongside the existing `branchBarbers()` family. A one-time migration in `App.init()` assigns `branchId: 1` to any service that is missing it (protects existing localStorage data). Each consumer — Services management, POS grid, Appointments booking form — switches from `AppData.services` to `branchServices()`. `getServiceById()` stays global so old appointment records still resolve.

**Tech Stack:** Vanilla JS, PHP includes, localStorage via `AppData`/`StorageManager`. No build step. No automated test suite — verify by switching branches in the browser.

---

## File Map

| File | Change |
|------|--------|
| `assets/js/app.js` | Add `branchId` to DEFAULT_DATA.services; add `branchServices()` helper; add migration in `App.init()` |
| `assets/js/services-mgmt.js` | Filter by `branchServices()` in `render()` and `_renderSummary()`; write `branchId` on new service save |
| `assets/js/pos.js` | Filter by `branchServices()` in `renderServiceGrid()` |
| `assets/js/appointments.js` | Filter by `branchServices()` in `populateDropdowns()` |

---

### Task 1: `app.js` — branchId on data, branchServices() helper, migration

**Files:**
- Modify: `assets/js/app.js`

Context: `DEFAULT_DATA.services` is at lines 9–20. The `branchBarbers()` helper family is at lines 237–240. `App.init()` starts at line 452, with `Auth.init()` as the first call (line 469), followed by `this.currentBranch = StorageManager.load('currentBranch', 1)`. `AppData.services` is populated at module eval time (line 155), so it is already loaded when `App.init()` runs.

- [ ] **Step 1: Add `branchId` to DEFAULT_DATA.services**

Read `assets/js/app.js` lines 9–20 to confirm the current services array. Replace the entire services array in DEFAULT_DATA with:

```js
  services: [
    { id:1,  name:'Haircut',         price:20,  duration:45,  cat:'hair',      icon:'fa-scissors',           desc:'Classic & modern cuts',      is_active:true, tierPrices:null, bookingPrice:null, branchId:1 },
    { id:2,  name:'Beard Trim',      price:12,  duration:30,  cat:'beard',     icon:'fa-face-grin-beam',     desc:'Shape & clean your beard',   is_active:true, tierPrices:null, bookingPrice:null, branchId:1 },
    { id:3,  name:'Hair Wash',       price:8,   duration:20,  cat:'hair',      icon:'fa-shower',             desc:'Shampoo & conditioning',     is_active:true, tierPrices:null, bookingPrice:null, branchId:1 },
    { id:4,  name:'Hair Coloring',   price:80,  duration:90,  cat:'treatment', icon:'fa-palette',            desc:'Full color treatment',        is_active:true, tierPrices:null, bookingPrice:null, branchId:1 },
    { id:5,  name:'Kids Haircut',    price:15,  duration:30,  cat:'hair',      icon:'fa-child',              desc:'For kids under 12 yrs',      is_active:true, tierPrices:null, bookingPrice:null, branchId:1 },
    { id:6,  name:'Full Package',    price:88,  duration:120, cat:'package',   icon:'fa-crown',              desc:'Haircut + Beard + Wash',     is_active:true, tierPrices:null, bookingPrice:null, branchId:1 },
    { id:7,  name:'Hot Towel Shave', price:18,  duration:40,  cat:'beard',     icon:'fa-fire-flame-curved',  desc:'Traditional wet shave',      is_active:true, tierPrices:null, bookingPrice:null, branchId:2 },
    { id:8,  name:'Hair Treatment',  price:45,  duration:60,  cat:'treatment', icon:'fa-spa',                desc:'Keratin & deep repair',       is_active:true, tierPrices:null, bookingPrice:null, branchId:2 },
    { id:9,  name:'Eyebrow Trim',    price:8,   duration:15,  cat:'beard',     icon:'fa-eye',                desc:'Define & shape brows',       is_active:true, tierPrices:null, bookingPrice:null, branchId:2 },
    { id:10, name:'Hair Styling',    price:15,  duration:30,  cat:'hair',      icon:'fa-wind',               desc:'Pomade finish & styling',    is_active:true, tierPrices:null, bookingPrice:null, branchId:2 },
  ],
```

- [ ] **Step 2: Add `branchServices()` helper**

Read lines 236–241 to see the existing helper family. Add `branchServices` on the same line pattern, immediately after `branchInventory`:

Current (around line 237–240):
```js
function branchBarbers(bid)      { const b = bid ?? App.currentBranch; return b === 0 ? AppData.barbers      : AppData.barbers.filter(x => x.branchId === b); }
function branchTransactions(bid) { const b = bid ?? App.currentBranch; return b === 0 ? AppData.transactions  : AppData.transactions.filter(x => x.branchId === b); }
function branchAppointments(bid) { const b = bid ?? App.currentBranch; return b === 0 ? AppData.appointments  : AppData.appointments.filter(x => x.branchId === b); }
function branchInventory(bid)    { const b = bid ?? App.currentBranch; return b === 0 ? AppData.inventory     : AppData.inventory.filter(x => x.branchId === b); }
```

Add one line after `branchInventory`:
```js
function branchServices(bid)     { const b = bid ?? App.currentBranch; return b === 0 ? AppData.services     : AppData.services.filter(x => x.branchId === b); }
```

- [ ] **Step 3: Add migration pass in `App.init()`**

Read `App.init()` (around line 452). It currently starts:
```js
  init() {
    Auth.init();
    this.currentBranch = StorageManager.load('currentBranch', 1);
    startClock();
```

Add the migration immediately after `this.currentBranch = ...`:
```js
  init() {
    Auth.init();
    this.currentBranch = StorageManager.load('currentBranch', 1);
    if (AppData.services.some(s => s.branchId == null)) {
      AppData.services.forEach(s => { if (s.branchId == null) s.branchId = 1; });
      AppData.save('services');
    }
    startClock();
```

- [ ] **Step 4: Verify**

Read `assets/js/app.js` to confirm:
- All 10 services in DEFAULT_DATA have `branchId` (1–6 → branch 1, 7–10 → branch 2)
- `branchServices()` is present after `branchInventory()`
- Migration block is inside `App.init()` after `this.currentBranch` assignment

- [ ] **Step 5: Commit**

```
git add assets/js/app.js
git commit -m "feat: add branchId to services data, branchServices() helper, and migration"
```

---

### Task 2: `services-mgmt.js` — filter by branch, assign branch on save

**Files:**
- Modify: `assets/js/services-mgmt.js`

Context: `render()` filters `AppData.services` at line 33. `_renderSummary()` uses `AppData.services` at lines 112–113. `save()` pushes a new service at line 246 without `branchId`.

- [ ] **Step 1: Filter by branch in `render()`**

Read `services-mgmt.js` lines 28–46. The `render()` method currently starts:
```js
    const services = AppData.services.filter(s => {
```

Change to:
```js
    const services = branchServices().filter(s => {
```

- [ ] **Step 2: Filter by branch in `_renderSummary()`**

Read lines 109–115. Currently:
```js
    const total  = AppData.services.length;
    const active = AppData.services.filter(s => s.is_active !== false).length;
    el.textContent = `${total} services · ${active} visible in POS · ${total - active} hidden`;
```

Change to:
```js
    const bs     = branchServices();
    const total  = bs.length;
    const active = bs.filter(s => s.is_active !== false).length;
    el.textContent = `${total} services · ${active} visible in POS · ${total - active} hidden`;
```

- [ ] **Step 3: Write `branchId` when adding a new service**

Read lines 239–248. The add branch in `save()` currently pushes:
```js
      AppData.services.push({ id: nextNumId(AppData.services), name, price, duration, cat, icon, desc, is_active: isActive, tierPrices, bookingPrice });
```

Change to:
```js
      AppData.services.push({ id: nextNumId(AppData.services), name, price, duration, cat, icon, desc, is_active: isActive, tierPrices, bookingPrice, branchId: App.currentBranch });
```

- [ ] **Step 4: Verify**

Read back the three changed locations and confirm:
- `render()` uses `branchServices().filter(`
- `_renderSummary()` uses `const bs = branchServices()`
- New service push includes `branchId: App.currentBranch`
- Edit branch (`AppData.services[idx] = { ...AppData.services[idx], ... }`) is unchanged — spread preserves the existing `branchId`

- [ ] **Step 5: Commit**

```
git add assets/js/services-mgmt.js
git commit -m "feat: filter services by branch in services management"
```

---

### Task 3: `pos.js` — filter service grid by branch

**Files:**
- Modify: `assets/js/pos.js`

Context: `renderServiceGrid()` at line 87. The filter on line 91 currently reads `AppData.services.filter(s =>`.

- [ ] **Step 1: Filter by branch in `renderServiceGrid()`**

Read `pos.js` lines 87–105. Change line 91 from:
```js
    const filtered = AppData.services.filter(s =>
```
to:
```js
    const filtered = branchServices().filter(s =>
```

- [ ] **Step 2: Verify**

Read lines 87–96 to confirm the change is in place and the rest of the filter (cat, search query, is_active) is unchanged.

- [ ] **Step 3: Commit**

```
git add assets/js/pos.js
git commit -m "feat: filter POS service grid by current branch"
```

---

### Task 4: `appointments.js` — filter service select by branch

**Files:**
- Modify: `assets/js/appointments.js`

Context: `populateDropdowns()` at lines 15–28. The service select is populated at line 22–23 using `AppData.services.filter(s => s.is_active !== false)`.

- [ ] **Step 1: Filter by branch in `populateDropdowns()`**

Read `appointments.js` lines 15–28. Change lines 22–23 from:
```js
      svcSel.innerHTML = '<option value="">Select service</option>' +
        AppData.services.filter(s => s.is_active !== false).map(s => `<option value="${s.id}">${s.name} — ${formatRp(s.price)}</option>`).join('');
```
to:
```js
      svcSel.innerHTML = '<option value="">Select service</option>' +
        branchServices().filter(s => s.is_active !== false).map(s => `<option value="${s.id}">${s.name} — ${formatRp(s.price)}</option>`).join('');
```

- [ ] **Step 2: Verify `getServiceById` is NOT changed**

Read `app.js` lines 232–234 to confirm `getServiceById()` still searches all of `AppData.services` (not filtered by branch). This is intentional — existing appointments may reference service IDs from any branch and must still resolve.

- [ ] **Step 3: Commit**

```
git add assets/js/appointments.js
git commit -m "feat: filter appointment service selector by current branch"
```

---

### Task 5: Push and deploy

- [ ] **Step 1: Push to GitHub**

```
git push origin main
```

- [ ] **Step 2: Deploy to Hostinger**

```
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 "cd ~/domains/nextapmy.com/public_html/__HAB && bash deploy.sh"
```

- [ ] **Step 3: Smoke test in browser**

1. Open the app logged in as owner on Branch 1 (Kota Bharu).
2. Go to **Services** — only Haircut, Beard Trim, Hair Wash, Hair Coloring, Kids Haircut, Full Package appear (6 services).
3. Go to **POS** → Services panel — same 6 services.
4. Go to **Appointments** → Book — service dropdown shows only those 6.
5. Switch to Branch 2 (Kedai Lalat) via the branch switcher.
6. Go to **Services** — only Hot Towel Shave, Hair Treatment, Eyebrow Trim, Hair Styling appear (4 services).
7. Go to **POS** → Services panel — same 4 services.
8. Add a new service on Branch 2 — it should only appear on Branch 2, not Branch 1.
9. Switch back to Branch 1 — new service is absent.

---

## Key Implementation Notes

- **`branchServices()` with no argument** uses `App.currentBranch` — the same pattern as `branchBarbers()`.
- **Migration is additive** — existing services without `branchId` silently get `branchId: 1`. No data is lost.
- **`getServiceById()` stays global** — appointment records and transaction snapshots may reference any service ID regardless of which branch is active. Do not filter it.
- **Edit preserves `branchId`** — the spread `{ ...AppData.services[idx], ... }` in `save()` keeps the original `branchId`. No changes needed there.
- **Branch switch auto-refreshes** — `App.setBranch()` calls `Router.go(Router.current)` which re-inits the current module. No extra wiring needed.

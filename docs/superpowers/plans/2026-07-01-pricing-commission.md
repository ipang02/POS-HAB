# Pricing & Commission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add barber tier pricing, per-service booking price, and fixed-RM product commission tracking across the POS system.

**Architecture:** All data is in localStorage (AppData). Three additive fields are added to existing data structures (`tier` on barbers, `tierPrices`/`bookingPrice` on services, `commissionRM` on inventory items). Two global helper functions handle price resolution. No DATA_VERSION bump needed — new fields are optional and existing data treats missing fields as null.

**Tech Stack:** Vanilla JS, PHP includes, localStorage. No framework, no build step. Test by opening the browser at `hab.nextapmy.com` or the local file — no automated test suite exists.

---

## File Map

| File | Change |
|------|--------|
| `assets/js/app.js` | Add `resolvePrice()` + `resolveBookingPrice()` helpers; add new fields to DEFAULT_DATA |
| `modals/modal-barber.php` | Add Tier select field |
| `assets/js/barbers.js` | Handle tier in modal open/save, show tier badge in card |
| `modals/modal-service.php` | Add Tier Pricing toggle + 3 price inputs + Booking Price input |
| `assets/js/services-mgmt.js` | Handle tierPrices + bookingPrice in modal open/save |
| `views/inventory.php` | Add Commission (RM) input to the inline modal |
| `assets/js/inventory.js` | Handle commissionRM in modal open/save, show badge in card |
| `assets/js/pos.js` | Price recalc on barber change, commissionRM in transactions, `prefill()` method |
| `assets/js/appointments.js` | Effective price display, store `bookedPrice`, Process Payment button |
| `assets/js/analytics.js` | Add `_renderCommissionTable()` method |
| `views/analytics.php` | Add commission section HTML container |

---

### Task 1: Helper functions + DEFAULT_DATA fields

**Files:**
- Modify: `assets/js/app.js`

Context: `app.js` line 125 has `const DATA_VERSION = '5'`. Line 178 has `function today()`. Lines 9–20 are DEFAULT_DATA.services, lines 22–27 are DEFAULT_DATA.barbers, lines 57–70 are DEFAULT_DATA.inventory.

- [ ] **Step 1: Add two price-resolution helpers after `today()` (around line 179)**

```js
function resolvePrice(svc, barber) {
  if (svc?.tierPrices && barber?.tier && svc.tierPrices[barber.tier] != null) {
    return svc.tierPrices[barber.tier];
  }
  return svc?.price ?? 0;
}

function resolveBookingPrice(svc, barber) {
  if (svc?.bookingPrice != null) return svc.bookingPrice;
  return resolvePrice(svc, barber);
}
```

- [ ] **Step 2: Add `tier: null` to each barber in DEFAULT_DATA.barbers**

Existing pattern (line 23):
```js
{ id:1, name:'Razif Hakim', initials:'RH', color:'#6366f1', status:'available', skills:[...], commission:30, phone:'...', branchId:1 },
```
Add `tier: null` before `branchId` on all four barber records:
```js
{ id:1, name:'Razif Hakim',     initials:'RH', color:'#6366f1', status:'available', skills:['Fade','Pompadour','Beard Styling'],     commission:30, phone:'019-3456789',  tier: null, branchId:1 },
{ id:2, name:'Hafizuddin Azmi', initials:'HA', color:'#f59e0b', status:'busy',      skills:['Classic Cut','Hair Coloring','Keratin'], commission:30, phone:'011-23456789', tier: null, branchId:1 },
{ id:3, name:'Amran bin Yusof', initials:'AY', color:'#22c55e', status:'available', skills:['Modern Style','Undercut','Kids Cut'],    commission:25, phone:'017-8901234',  tier: null, branchId:2 },
{ id:4, name:'Shahrul Nizam',   initials:'SN', color:'#ec4899', status:'off',       skills:['Traditional Shave','Eyebrow Trim'],      commission:25, phone:'013-4567890',  tier: null, branchId:2 },
```

- [ ] **Step 3: Add `tierPrices: null, bookingPrice: null` to each service in DEFAULT_DATA.services**

Existing pattern (line 10):
```js
{ id:1, name:'Haircut', price:20, duration:45, cat:'hair', icon:'fa-scissors', desc:'Classic & modern cuts', is_active:true },
```
Add both new fields at the end of every service record (before the closing `}`):
```js
{ id:1,  name:'Haircut',        price:20, duration:45,  cat:'hair',      icon:'fa-scissors',          desc:'Classic & modern cuts',     is_active:true, tierPrices:null, bookingPrice:null },
{ id:2,  name:'Beard Trim',     price:12, duration:30,  cat:'beard',     icon:'fa-face-grin-beam',    desc:'Shape & clean your beard',  is_active:true, tierPrices:null, bookingPrice:null },
{ id:3,  name:'Hair Wash',      price:8,  duration:20,  cat:'hair',      icon:'fa-shower',            desc:'Shampoo & conditioning',    is_active:true, tierPrices:null, bookingPrice:null },
{ id:4,  name:'Hair Coloring',  price:80, duration:90,  cat:'treatment', icon:'fa-palette',           desc:'Full color treatment',      is_active:true, tierPrices:null, bookingPrice:null },
{ id:5,  name:'Kids Haircut',   price:15, duration:30,  cat:'hair',      icon:'fa-child',             desc:'For kids under 12 yrs',     is_active:true, tierPrices:null, bookingPrice:null },
{ id:6,  name:'Hot Towel Shave',price:18, duration:40,  cat:'beard',     icon:'fa-fire-flame-curved', desc:'Traditional wet shave',     is_active:true, tierPrices:null, bookingPrice:null },
{ id:7,  name:'Hair Treatment', price:45, duration:60,  cat:'treatment', icon:'fa-spa',               desc:'Keratin & deep repair',     is_active:true, tierPrices:null, bookingPrice:null },
{ id:8,  name:'Full Package',   price:88, duration:120, cat:'package',   icon:'fa-crown',             desc:'Haircut + Beard + Wash',    is_active:true, tierPrices:null, bookingPrice:null },
{ id:9,  name:'Eyebrow Trim',   price:8,  duration:15,  cat:'beard',     icon:'fa-eye',               desc:'Define & shape brows',      is_active:true, tierPrices:null, bookingPrice:null },
{ id:10, name:'Hair Styling',   price:15, duration:30,  cat:'hair',      icon:'fa-wind',              desc:'Pomade finish & styling',   is_active:true, tierPrices:null, bookingPrice:null },
```

- [ ] **Step 4: Add `commissionRM: null` to each inventory item in DEFAULT_DATA.inventory**

Existing pattern (line 58):
```js
{ id:1, name:'Pomade Strong Hold', cat:'styling', stock:12, minStock:5, price:25, unit:'pcs', branchId:1 },
```
Add `commissionRM: null` before `branchId` on all 12 inventory records:
```js
{ id:1,  name:'Pomade Strong Hold',   cat:'styling',  stock:12, minStock:5,  price:25,  unit:'pcs',  commissionRM:null, branchId:1 },
{ id:2,  name:'Barber Scissors Pro',  cat:'tools',    stock:3,  minStock:5,  price:85,  unit:'pcs',  commissionRM:null, branchId:1 },
{ id:3,  name:'Shaving Foam',         cat:'shaving',  stock:8,  minStock:3,  price:15,  unit:'pcs',  commissionRM:null, branchId:1 },
{ id:4,  name:'Hair Clipper Wahl',    cat:'tools',    stock:2,  minStock:3,  price:150, unit:'unit', commissionRM:null, branchId:1 },
{ id:5,  name:'Conditioner L\'Oreal', cat:'haircare', stock:15, minStock:5,  price:22,  unit:'btl',  commissionRM:null, branchId:1 },
{ id:6,  name:'Shampoo Kerastase',    cat:'haircare', stock:10, minStock:5,  price:28,  unit:'btl',  commissionRM:null, branchId:1 },
{ id:7,  name:'Hair Wax Matt',        cat:'styling',  stock:20, minStock:8,  price:18,  unit:'pcs',  commissionRM:null, branchId:2 },
{ id:8,  name:'Razor Blades 100pcs',  cat:'shaving',  stock:4,  minStock:10, price:12,  unit:'box',  commissionRM:null, branchId:2 },
{ id:9,  name:'Barber Cape',          cat:'tools',    stock:6,  minStock:3,  price:40,  unit:'pcs',  commissionRM:null, branchId:2 },
{ id:10, name:'Hair Spray',           cat:'styling',  stock:7,  minStock:5,  price:16,  unit:'pcs',  commissionRM:null, branchId:2 },
{ id:11, name:'Neck Strip Roll',      cat:'tools',    stock:2,  minStock:5,  price:8,   unit:'roll', commissionRM:null, branchId:2 },
{ id:12, name:'Beard Oil Premium',    cat:'beard',    stock:9,  minStock:4,  price:35,  unit:'btl',  commissionRM:null, branchId:2 },
```

- [ ] **Step 5: Verify in browser**

Open the app in the browser. Open DevTools Console and run:
```js
console.log(typeof resolvePrice, typeof resolveBookingPrice);
// Expected: "function function"

const svc = { price: 20, tierPrices: { junior: 20, senior: 30, master: 40 } };
const seniorBarber = { tier: 'senior' };
const noTierBarber = { tier: null };
console.log(resolvePrice(svc, seniorBarber)); // Expected: 30
console.log(resolvePrice(svc, noTierBarber)); // Expected: 20
console.log(resolveBookingPrice({ price: 20, bookingPrice: 25 }, null)); // Expected: 25
console.log(resolveBookingPrice({ price: 20, bookingPrice: null }, seniorBarber)); // Expected: 30
```

- [ ] **Step 6: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: add resolvePrice/resolveBookingPrice helpers and tier/commission fields to DEFAULT_DATA"
```

---

### Task 2: Barber tier — modal field + JS

**Files:**
- Modify: `modals/modal-barber.php`
- Modify: `assets/js/barbers.js`

Context: `modal-barber.php` has a `grid grid-cols-2` at line 47 with Commission and Status fields. `barbers.js` `openAddModal()` is at line 172, `openEditModal()` at line 191, `save()` at line 285, `_barberCard()` at line 56.

- [ ] **Step 1: Add Tier select to `modals/modal-barber.php`**

In the `space-y-4` div (after the Commission/Status grid at line ~63), add a Tier select directly below that grid:

```html
<!-- Tier -->
<div>
  <label class="text-xs text-white/45 mb-1.5 block font-medium">Tier</label>
  <select id="barber-tier" class="sel">
    <option value="">No tier (flat pricing applies)</option>
    <option value="junior">Junior</option>
    <option value="senior">Senior</option>
    <option value="master">Master</option>
  </select>
  <p class="text-[10px] text-white/30 mt-1">Determines which tier price applies when this barber is selected in POS</p>
</div>
```

- [ ] **Step 2: Reset tier in `openAddModal()` in `assets/js/barbers.js`**

After `document.getElementById('barber-status').value = 'available';` (line ~181), add:
```js
document.getElementById('barber-tier').value = '';
```

- [ ] **Step 3: Populate tier in `openEditModal()` in `assets/js/barbers.js`**

After `document.getElementById('barber-status').value = b.status;` (line ~202), add:
```js
document.getElementById('barber-tier').value = b.tier || '';
```

- [ ] **Step 4: Save tier in `BarbersCRUD.save()` in `assets/js/barbers.js`**

After `const status = document.getElementById('barber-status').value;` (line ~289), add:
```js
const tier = document.getElementById('barber-tier').value || null;
```

In the edit branch (`AppData.barbers[idx] = { ...AppData.barbers[idx], name, phone, commission, status, initials, color: this._color, skills: [...this._skills] }`), add `tier` to the object:
```js
AppData.barbers[idx] = {
  ...AppData.barbers[idx],
  name, phone, commission, status, tier,
  initials, color: this._color,
  skills: [...this._skills]
};
```

In the add branch (`AppData.barbers.push({ ... })`), add `tier`:
```js
AppData.barbers.push({
  id:         nextNumId(AppData.barbers),
  name, phone, commission, status, tier,
  initials,   color: this._color,
  skills:     [...this._skills],
  branchId:   App.currentBranch || 1
});
```

- [ ] **Step 5: Show tier badge in `_barberCard()` in `assets/js/barbers.js`**

In `_barberCard(b)`, after the skills div (the `flex flex-wrap gap-1 mb-4` div, around line 101), add a tier badge:
```js
${b.tier ? `<div class="mb-3">
  <span class="text-[10px] font-semibold px-2.5 py-1 rounded-full
    ${b.tier === 'master' ? 'text-amber-400 bg-amber-400/10' : b.tier === 'senior' ? 'text-blue-400 bg-blue-400/10' : 'text-green-400 bg-green-400/10'}">
    <i class="fa-solid fa-layer-group mr-1 text-[9px]"></i>${b.tier.charAt(0).toUpperCase() + b.tier.slice(1)}
  </span>
</div>` : ''}
```

- [ ] **Step 6: Verify in browser**

1. Navigate to Barbers → click Edit on any barber
2. Confirm the Tier dropdown appears with 4 options
3. Select "Senior" → Save
4. Re-open Edit — confirm "Senior" is pre-selected
5. Confirm tier badge appears on the barber card

- [ ] **Step 7: Commit**

```bash
git add modals/modal-barber.php assets/js/barbers.js
git commit -m "feat: add tier field to barber modal and card"
```

---

### Task 3: Service tier pricing + booking price

**Files:**
- Modify: `modals/modal-service.php`
- Modify: `assets/js/services-mgmt.js`

Context: `modal-service.php` ends with an Active Toggle section (lines 98–107) followed by Actions. `services-mgmt.js` `openAddModal()` is at line 131, `openEditModal()` at line 148, `save()` at line 186, `_card()` at line 49.

- [ ] **Step 1: Add Tier Pricing toggle + inputs + Booking Price to `modals/modal-service.php`**

Add the following block inside the `space-y-4` div, AFTER the Active Toggle section (after line 107, before the closing `</div>` of `space-y-4`):

```html
<!-- Booking Price (optional) -->
<div class="border-t border-white/6 pt-4">
  <label class="text-xs text-white/45 mb-1.5 block font-medium">Booking Price (RM) <span class="text-white/25">(optional)</span></label>
  <div class="relative">
    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold">RM</span>
    <input type="number" id="svc-booking-price" min="0" step="0.50" placeholder="Same as walk-in price" class="inp pl-10">
  </div>
  <p class="text-[10px] text-white/30 mt-1">If set, appointments use this price instead of the walk-in price</p>
</div>

<!-- Tier Pricing toggle -->
<div class="flex items-center justify-between py-2 border-t border-white/6 pt-4">
  <div>
    <p class="text-sm text-white font-medium">Tier Pricing</p>
    <p class="text-xs text-white/35">Set different prices for Junior, Senior & Master barbers</p>
  </div>
  <label class="tog">
    <input type="checkbox" id="svc-tier-enabled" onchange="ServicesMgmt.toggleTierPricing(this.checked)">
    <span class="tog-slider"></span>
  </label>
</div>

<!-- Tier price inputs (hidden by default) -->
<div id="svc-tier-prices" class="hidden grid grid-cols-3 gap-3">
  <div>
    <label class="text-xs text-white/45 mb-1.5 block font-medium">Junior (RM)</label>
    <input type="number" id="svc-tier-junior" min="0" step="0.50" placeholder="0" class="inp">
  </div>
  <div>
    <label class="text-xs text-white/45 mb-1.5 block font-medium">Senior (RM)</label>
    <input type="number" id="svc-tier-senior" min="0" step="0.50" placeholder="0" class="inp">
  </div>
  <div>
    <label class="text-xs text-white/45 mb-1.5 block font-medium">Master (RM)</label>
    <input type="number" id="svc-tier-master" min="0" step="0.50" placeholder="0" class="inp">
  </div>
</div>
```

- [ ] **Step 2: Add `toggleTierPricing()` to `assets/js/services-mgmt.js`**

Add after the `_bindPreview()` method (after line ~177):
```js
toggleTierPricing(enabled) {
  const wrap = document.getElementById('svc-tier-prices');
  if (wrap) wrap.classList.toggle('hidden', !enabled);
},
```

- [ ] **Step 3: Reset tier/booking fields in `openAddModal()` in `assets/js/services-mgmt.js`**

After `document.getElementById('svc-active').checked = true;` (line ~141), add:
```js
document.getElementById('svc-booking-price').value = '';
document.getElementById('svc-tier-enabled').checked = false;
document.getElementById('svc-tier-prices').classList.add('hidden');
document.getElementById('svc-tier-junior').value = '';
document.getElementById('svc-tier-senior').value = '';
document.getElementById('svc-tier-master').value = '';
```

- [ ] **Step 4: Populate tier/booking fields in `openEditModal()` in `assets/js/services-mgmt.js`**

After `document.getElementById('svc-active').checked = s.is_active !== false;` (line ~160), add:
```js
document.getElementById('svc-booking-price').value = s.bookingPrice ?? '';
const hasTier = s.tierPrices != null;
document.getElementById('svc-tier-enabled').checked = hasTier;
document.getElementById('svc-tier-prices').classList.toggle('hidden', !hasTier);
document.getElementById('svc-tier-junior').value = s.tierPrices?.junior ?? '';
document.getElementById('svc-tier-senior').value = s.tierPrices?.senior ?? '';
document.getElementById('svc-tier-master').value = s.tierPrices?.master ?? '';
```

- [ ] **Step 5: Read and save tier/booking in `save()` in `assets/js/services-mgmt.js`**

After reading `isActive` (line ~193), add:
```js
const bookingPriceRaw = parseFloat(document.getElementById('svc-booking-price').value);
const bookingPrice    = isNaN(bookingPriceRaw) ? null : bookingPriceRaw;

const tierEnabled = document.getElementById('svc-tier-enabled').checked;
let tierPrices = null;
if (tierEnabled) {
  const j = parseFloat(document.getElementById('svc-tier-junior').value);
  const s = parseFloat(document.getElementById('svc-tier-senior').value);
  const m = parseFloat(document.getElementById('svc-tier-master').value);
  if (isNaN(j) || isNaN(s) || isNaN(m)) {
    showToast('Enter all three tier prices (Junior, Senior, Master)', 'error');
    return;
  }
  tierPrices = { junior: j, senior: s, master: m };
}
```

In the edit branch, spread `tierPrices` and `bookingPrice` into the saved object:
```js
AppData.services[idx] = { ...AppData.services[idx], name, price, duration, cat, icon, desc, is_active: isActive, tierPrices, bookingPrice };
```

In the add branch:
```js
AppData.services.push({ id: nextNumId(AppData.services), name, price, duration, cat, icon, desc, is_active: isActive, tierPrices, bookingPrice });
```

- [ ] **Step 6: Show tier badge in `_card()` in `assets/js/services-mgmt.js`**

In the Stats grid section (`grid grid-cols-3` around line 76), update the Price cell to indicate tier pricing:
```js
<div class="text-center">
  <div class="text-sm font-bold gold-text">${s.tierPrices ? 'Tiered' : formatRp(s.price)}</div>
  <div class="text-[9px] text-white/30 uppercase tracking-wide">${s.tierPrices ? 'Junior–Master' : 'Price'}</div>
</div>
```

- [ ] **Step 7: Verify in browser**

1. Navigate to Services → Edit any service
2. Confirm "Booking Price" input and "Tier Pricing" toggle appear
3. Toggle on → three price inputs appear
4. Fill in Junior: 20, Senior: 30, Master: 40, Booking: 25 → Save
5. Re-open Edit → confirm values are pre-filled
6. Check DevTools Console: `AppData.services.find(s => s.tierPrices)` — should show the updated service with `tierPrices` object

- [ ] **Step 8: Commit**

```bash
git add modals/modal-service.php assets/js/services-mgmt.js
git commit -m "feat: add tier pricing and booking price fields to service management"
```

---

### Task 4: Inventory commission RM

**Files:**
- Modify: `views/inventory.php`
- Modify: `assets/js/inventory.js`

Context: `views/inventory.php` has the inventory modal inline starting at line 52. The Price input is around line 101. `inventory.js` `openAddModal()` is at line 128, `openEditModal()` at line 140, `save()` at line 154, `_card()` at line 43.

- [ ] **Step 1: Add Commission (RM) input to `views/inventory.php`**

In the inventory modal (`modal-inv`), add the following block AFTER the Price input div (after the `<div>` containing `id="inv-price"`, around line 103):

```html
<div>
  <label class="text-xs text-white/50 mb-1.5 block font-medium">Commission per unit (RM) <span class="text-white/25">(optional)</span></label>
  <div class="relative">
    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold">RM</span>
    <input type="number" id="inv-commission" min="0" step="0.50" placeholder="0 = no commission" class="inp pl-10">
  </div>
  <p class="text-[10px] text-white/30 mt-1">Selling barber earns this fixed amount for each unit sold</p>
</div>
```

- [ ] **Step 2: Reset commission in `openAddModal()` in `assets/js/inventory.js`**

After `document.getElementById('inv-price').value = '';` (line ~136), add:
```js
document.getElementById('inv-commission').value = '';
```

- [ ] **Step 3: Populate commission in `openEditModal()` in `assets/js/inventory.js`**

After `document.getElementById('inv-price').value = item.price;` (line ~150), add:
```js
document.getElementById('inv-commission').value = item.commissionRM ?? '';
```

- [ ] **Step 4: Save commission in `save()` in `assets/js/inventory.js`**

After `const price = parseInt(document.getElementById('inv-price').value) || 0;` (line ~160), add:
```js
const commissionRM = parseFloat(document.getElementById('inv-commission').value) || null;
```

In the edit branch (`Object.assign(AppData.inventory[idx], { ... })`), add `commissionRM`:
```js
Object.assign(AppData.inventory[idx], { name, cat, unit, stock, minStock, price, commissionRM });
```

In the add branch (`AppData.inventory.push({ ... })`), add `commissionRM`:
```js
AppData.inventory.push({ id: nextNumId(AppData.inventory), name, cat, unit, stock, minStock, price, commissionRM, branchId: App.currentBranch || 1 });
```

- [ ] **Step 5: Show commission badge in `_card()` in `assets/js/inventory.js`**

In `_card(item)`, add a commission badge after the stock bar section (after the `stock-bar` div, before the Actions div):
```js
${item.commissionRM ? `<p class="text-[10px] text-green-400 mt-2">
  <i class="fa-solid fa-hand-holding-dollar mr-1"></i>RM ${item.commissionRM} commission/unit
</p>` : ''}
```

- [ ] **Step 6: Verify in browser**

1. Navigate to Inventory → click the edit (pen) icon on any product
2. Confirm "Commission per unit (RM)" input appears
3. Enter `5` → Save
4. Confirm green "RM 5 commission/unit" badge appears on the card
5. DevTools: `AppData.inventory.find(i => i.commissionRM)` → should show commissionRM: 5

- [ ] **Step 7: Commit**

```bash
git add views/inventory.php assets/js/inventory.js
git commit -m "feat: add commissionRM field to inventory products"
```

---

### Task 5: POS — tier price recalc + commission tracking + prefill

**Files:**
- Modify: `assets/js/pos.js`

Context: `pos.js` has `addToCart()` at line 143, `init()` at line 13, `confirmPayment()` at line 340, `openPayment()` at line 279. The cart item structure is `{ key, type, id, name, price, qty }`.

- [ ] **Step 1: Add `_getSelectedBarber()` helper to POS object**

Add after the `activePanel: 'services'` and `payMethod: 'cash'` properties, as the first method of the POS object (before `init()`):
```js
_getSelectedBarber() {
  const id = parseInt(document.getElementById('pos-barber')?.value) || 0;
  return id ? getBarberById(id) : null;
},

_prefillCustomer: '',
```

- [ ] **Step 2: Add `_recalcCartPrices()` method**

Add after `_getSelectedBarber()`:
```js
_recalcCartPrices() {
  const barber = this._getSelectedBarber();
  this.cart.forEach(item => {
    if (item.type !== 'service') return;
    const svc = getServiceById(item.id);
    if (svc) item.price = resolvePrice(svc, barber);
  });
  this.renderCart();
  this.recalc();
},
```

- [ ] **Step 3: Bind barber change to `_recalcCartPrices()` in `init()`**

At the end of `init()`, after `this.switchPanel(...)`, add:
```js
document.getElementById('pos-barber')?.addEventListener('change', () => this._recalcCartPrices());
```

- [ ] **Step 4: Use `resolvePrice()` when adding a service to cart in `addToCart()`**

In the `if (type === 'service')` branch (line ~144), change:
```js
else { this.cart.push({ key, type:'service', id, name: svc.name, price: svc.price, qty: 1 }); }
```
to:
```js
else { this.cart.push({ key, type:'service', id, name: svc.name, price: resolvePrice(svc, this._getSelectedBarber()), qty: 1 }); }
```

- [ ] **Step 5: Store `commissionRM` when adding a product to cart**

In the `else` branch (product, line ~152), change:
```js
this.cart.push({ key, type:'product', id, name: item.name, price: item.price, qty: 1, stock: item.stock });
```
to:
```js
this.cart.push({ key, type:'product', id, name: item.name, price: item.price, qty: 1, stock: item.stock, commissionRM: item.commissionRM || null });
```

- [ ] **Step 6: Snapshot `commissionRM` in transaction in `confirmPayment()`**

Find this line (around line 364):
```js
services: this.cart.map(c => ({ name: c.name, qty: c.qty, price: c.price, type: c.type })),
```
Replace with:
```js
services: this.cart.map(c => ({
  name: c.name, qty: c.qty, price: c.price, type: c.type,
  ...(c.type === 'product' && c.commissionRM ? { commissionRM: c.commissionRM } : {})
})),
```

- [ ] **Step 7: Pre-fill customer name from `_prefillCustomer` in `openPayment()`**

Find this line in `openPayment()`:
```js
document.getElementById('pay-customer-name').value  = '';
```
Replace with:
```js
document.getElementById('pay-customer-name').value  = this._prefillCustomer || '';
this._prefillCustomer = '';
```

- [ ] **Step 8: Add `prefill()` method**

Add after `newOrder()` at the end of the POS object (before the closing `}`):
```js
prefill({ barberId, serviceId, price, customer }) {
  this.clearCart();
  const svc = getServiceById(serviceId);
  if (!svc) return;
  this.cart.push({
    key: 'svc_' + serviceId,
    type: 'service',
    id: serviceId,
    name: svc.name,
    price: price ?? resolvePrice(svc, getBarberById(barberId)),
    qty: 1
  });
  const sel = document.getElementById('pos-barber');
  if (sel) sel.value = barberId || '';
  this._prefillCustomer = customer || '';
  this._refreshGrids();
  this.renderCart();
  this.recalc();
}
```

- [ ] **Step 9: Verify in browser**

1. Navigate to POS. Add "Haircut" to cart without selecting barber → price should be RM 20.
2. Edit Haircut service to have tier prices (Junior RM20, Senior RM30, Master RM40).
3. Add "Haircut" to cart → RM 20 (no barber selected).
4. Select a Senior barber → price in cart should update to RM 30.
5. Change barber to Junior → price should update to RM 20.
6. Add a product that has commissionRM set → confirm payment → DevTools: check last transaction in `AppData.transactions[0].services` — product item should have `commissionRM` field.

- [ ] **Step 10: Commit**

```bash
git add assets/js/pos.js
git commit -m "feat: tier price recalc on barber change, commission tracking, and POS prefill method"
```

---

### Task 6: Appointments — effective price, bookedPrice, Process Payment

**Files:**
- Modify: `modals/modal-appointment.php`
- Modify: `assets/js/appointments.js`

Context: `modal-appointment.php` has service and barber selects. `appointments.js` `save()` is at line 207, `renderList()` at line 109, `openDetail()` at line 257, `openBookingModal()` at line 160, `editById()` at line 176.

- [ ] **Step 1: Add effective price display to `modals/modal-appointment.php`**

Read `modals/modal-appointment.php` to find the service and barber select fields. After both selects (they are likely in a grid), add a price display paragraph:

```html
<p id="appt-effective-price" class="hidden text-xs font-semibold mt-1" style="color:#C9A84C">
  <i class="fa-solid fa-tag mr-1 text-[10px]"></i>
  <span id="appt-effective-price-val">RM 0</span>
</p>
```

Also add `onchange="Appointments.updateEffectivePrice()"` to both the service select (`id="appt-service"`) and barber select (`id="appt-barber"`) elements.

- [ ] **Step 2: Add `updateEffectivePrice()` to `appointments.js`**

Add after `updateDuration()` (after line ~204):
```js
updateEffectivePrice() {
  const svcId  = parseInt(document.getElementById('appt-service')?.value);
  const barbId = parseInt(document.getElementById('appt-barber')?.value);
  const svc    = getServiceById(svcId);
  const barb   = getBarberById(barbId);
  const priceEl = document.getElementById('appt-effective-price');
  const valEl   = document.getElementById('appt-effective-price-val');
  if (!priceEl || !valEl) return;
  if (!svc) { priceEl.classList.add('hidden'); return; }
  valEl.textContent = formatRp(resolveBookingPrice(svc, barb));
  priceEl.classList.remove('hidden');
},
```

- [ ] **Step 3: Reset effective price display in `openBookingModal()` and `editById()`**

In `openBookingModal()`, after `openModal('modal-appt');`, add:
```js
this.updateEffectivePrice();
```

In `editById()`, after setting all form values and before `openModal('modal-appt')`, add:
```js
this.updateEffectivePrice();
```

- [ ] **Step 4: Store `bookedPrice` in `save()` in `appointments.js`**

After reading all the form values (after `const status = ...`), add:
```js
const svc  = getServiceById(serviceId);
const barb = getBarberById(barberId);
const bookedPrice = svc ? resolveBookingPrice(svc, barb) : 0;
```

In the edit branch, add `bookedPrice` to the spread object:
```js
AppData.appointments[idx] = { ...AppData.appointments[idx], customer, serviceId, barberId, date, time, status,
  phone: document.getElementById('appt-phone').value,
  notes: document.getElementById('appt-notes').value,
  bookedPrice };
```

In the add branch, add `bookedPrice`:
```js
AppData.appointments.push({
  id: nextNumId(AppData.appointments), customer, serviceId, barberId, date, time, status,
  phone: document.getElementById('appt-phone').value,
  notes: document.getElementById('appt-notes').value,
  branchId: App.currentBranch || 1,
  bookedPrice
});
```

- [ ] **Step 5: Add `processPayment()` method to `appointments.js`**

Add after `deleteFromDetail()` (at the end of the Appointments object, before the closing `}`):
```js
processPayment(id) {
  const a = AppData.appointments.find(x => x.id === id);
  if (!a) return;
  const svc  = getServiceById(a.serviceId);
  const barb = getBarberById(a.barberId);
  const price = a.bookedPrice ?? (svc ? resolveBookingPrice(svc, barb) : 0);
  closeModal('modal-appt-detail');
  POS.prefill({ barberId: a.barberId, serviceId: a.serviceId, price, customer: a.customer });
  navigate('pos');
},
```

- [ ] **Step 6: Add "Process Payment" button in `renderList()` in `appointments.js`**

In `renderList()`, in the table row actions cell (the `flex items-center justify-end gap-1.5` div, around line 146), add a "Process Payment" button that shows only for `confirmed` or `completed` status:

```js
${(a.status === 'confirmed' || a.status === 'completed') ? `
  <button onclick="Appointments.processPayment(${a.id})"
    class="btn-gold h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold" title="Process payment">
    <i class="fa-solid fa-cash-register text-[10px]"></i>
    <span class="hidden sm:inline">Pay</span>
  </button>` : ''}
```

- [ ] **Step 7: Show `bookedPrice` and Process Payment in `openDetail()`**

In `openDetail()`, find the Price row (line ~275):
```js
${service ? `<div class="flex justify-between text-sm"><span class="text-white/45">Price</span><span class="gold-text font-bold">${formatRp(service.price)}</span></div>` : ''}
```
Replace with:
```js
${service ? `<div class="flex justify-between text-sm"><span class="text-white/45">Price</span><span class="gold-text font-bold">${formatRp(a.bookedPrice ?? service.price)}</span></div>` : ''}
```

Also find the button area in the detail modal (`modals/modal-appointment.php`) — it has Edit and Delete buttons. Read the file and add a "Process Payment" button before or after those buttons, shown only for confirmed/completed. Since this button is dynamically driven by `openDetail()`, add it in the JS instead:

After `openModal('modal-appt-detail');` in `openDetail()`, add:
```js
const payBtn = document.getElementById('appt-detail-pay-btn');
if (payBtn) {
  payBtn.classList.toggle('hidden', a.status !== 'confirmed' && a.status !== 'completed');
  payBtn.onclick = () => Appointments.processPayment(a.id);
}
```

In `modals/modal-appointment.php`, find the detail modal's action buttons area and add:
```html
<button id="appt-detail-pay-btn" class="btn-gold w-full py-2.5 rounded-xl text-sm font-bold mb-2 hidden">
  <i class="fa-solid fa-cash-register mr-1.5"></i> Process Payment
</button>
```
Place it above the existing Edit/Delete buttons in the detail modal.

- [ ] **Step 8: Verify in browser**

1. Navigate to Appointments → Book a new appointment with any service + barber.
2. Confirm effective price label appears (e.g. "RM 25" for booking price if set, or tier price).
3. Check AppData: `AppData.appointments[AppData.appointments.length-1].bookedPrice` — should be a number.
4. In the list, confirmed/completed appointments should show a gold "Pay" button.
5. Click "Pay" → POS view opens, cart pre-filled with correct service at booked price, barber pre-selected.

- [ ] **Step 9: Commit**

```bash
git add modals/modal-appointment.php assets/js/appointments.js
git commit -m "feat: appointment booking price display, bookedPrice storage, and Process Payment integration"
```

---

### Task 7: Analytics — commission table

**Files:**
- Modify: `assets/js/analytics.js`
- Modify: `views/analytics.php`

Context: `analytics.js` `build()` method calls `_renderSummary`, `_renderBranchComparison`, `_initCharts`, `_renderTable`. `views/analytics.php` contains the HTML structure for the analytics view.

- [ ] **Step 1: Add commission HTML section to `views/analytics.php`**

Read `views/analytics.php`. At the very bottom of the `#view-analytics` section (before the closing `</section>`), add:

```html
<!-- Commission Report -->
<div id="an-commission-wrap" class="glass rounded-2xl p-5 hidden">
  <div class="flex items-center gap-2 mb-4">
    <i class="fa-solid fa-hand-holding-dollar text-sm" style="color:#6B7280"></i>
    <h3 class="text-sm font-bold text-white">Staff Commission — Product Sales</h3>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-left">
      <thead>
        <tr class="border-b border-white/6">
          <th class="pb-2 pr-4 text-[10px] font-semibold text-white/35 uppercase tracking-wide">Barber</th>
          <th class="pb-2 pr-4 text-[10px] font-semibold text-white/35 uppercase tracking-wide">Units Sold</th>
          <th class="pb-2 pr-4 text-[10px] font-semibold text-white/35 uppercase tracking-wide">Product Revenue</th>
          <th class="pb-2 text-[10px] font-semibold text-white/35 uppercase tracking-wide text-right">Commission Earned</th>
        </tr>
      </thead>
      <tbody id="an-commission-tbody"></tbody>
    </table>
  </div>
</div>
```

- [ ] **Step 2: Add `_renderCommissionTable()` to `assets/js/analytics.js`**

Add the following method before the closing `}` of the `Analytics` object (after `_renderTable` or similar):

```js
_renderCommissionTable(trx) {
  const wrap = document.getElementById('an-commission-wrap');
  const tbody = document.getElementById('an-commission-tbody');
  if (!tbody) return;

  const barberMap = {};
  trx.forEach(t => {
    (t.services || []).forEach(s => {
      if (s.type !== 'product' || !s.commissionRM) return;
      if (!barberMap[t.barberId]) barberMap[t.barberId] = { sold: 0, revenue: 0, commission: 0 };
      barberMap[t.barberId].sold       += (s.qty || 1);
      barberMap[t.barberId].revenue    += (s.price || 0) * (s.qty || 1);
      barberMap[t.barberId].commission += s.commissionRM * (s.qty || 1);
    });
  });

  const entries = Object.entries(barberMap);
  if (wrap) wrap.classList.toggle('hidden', entries.length === 0);

  tbody.innerHTML = entries.length ? entries.map(([barberId, d]) => {
    const b = getBarberById(parseInt(barberId));
    return `<tr class="hover:bg-white/2 transition-colors border-b border-white/5 last:border-0">
      <td class="py-2.5 pr-4">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style="background:${b?.color || '#374151'}33;border:1px solid ${b?.color || '#374151'}44">${b?.initials || '?'}</div>
          <span class="text-sm text-white">${b?.name || 'Unknown'}</span>
        </div>
      </td>
      <td class="py-2.5 pr-4 text-sm text-white/60">${d.sold} unit${d.sold !== 1 ? 's' : ''}</td>
      <td class="py-2.5 pr-4 text-sm text-white">${formatRp(d.revenue)}</td>
      <td class="py-2.5 text-right text-sm font-bold text-green-400">${formatRp(d.commission)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="4" class="py-6 text-center text-xs text-white/30">No product commissions recorded in this period</td></tr>`;
},
```

- [ ] **Step 3: Call `_renderCommissionTable()` from `build()`**

In `build()`, after `this._renderTable(trx);`, add:
```js
this._renderCommissionTable(trx);
```

- [ ] **Step 4: Verify in browser**

1. Navigate to Analytics.
2. If no products have been sold with commissionRM set, the commission section is hidden — that's correct.
3. To test: go to POS, add a product that has `commissionRM` set, complete a payment.
4. Navigate back to Analytics — the commission section should appear with the barber's name and RM amounts.
5. Switching date range should re-filter commissions correctly.

- [ ] **Step 5: Commit**

```bash
git add views/analytics.php assets/js/analytics.js
git commit -m "feat: add staff commission report table to analytics"
```

---

### Final: Push and Deploy

- [ ] **Push to GitHub**

```bash
git push origin main
```

- [ ] **Deploy to server**

```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 "cd ~/domains/nextapmy.com/public_html/__HAB && bash deploy.sh"
```

- [ ] **Smoke-test on live site**

1. Barbers → Edit barber → set tier → Save → tier badge appears on card ✓
2. Services → Edit service → enable Tier Pricing → fill prices → Save ✓
3. Inventory → Edit product → set Commission RM → Save → badge appears ✓
4. POS → Select service → no barber → price is flat → select Senior barber → price updates ✓
5. Appointments → Book → see effective price label → save → "Pay" button appears in list ✓
6. Click "Pay" in appointments → POS opens pre-filled ✓
7. Complete a product sale with commission → Analytics → Commission section appears ✓

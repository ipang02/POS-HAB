# Customer Management Module — Design Spec

**Date:** 2026-07-01
**Project:** HAB Barbershop POS System
**Status:** Approved — ready for implementation

---

## Overview

Add a Customer Management module to the HAB POS system. Customers are global across all branches, identified uniquely by phone number. Profiles are created manually by staff or auto-created when a phone number is provided during a POS payment or appointment booking. Full visit history, spending stats, preferred barber, and favourite service are derived on-the-fly from existing transaction and appointment data. The data structure includes a `points` field to support a future loyalty programme without requiring structural changes.

---

## Data Structure

### Customer record (stored in `AppData.customers`)

```js
{
  id:        number,   // auto-increment integer
  name:      string,   // full name
  phone:     string,   // unique key — normalised (digits only, leading 0)
  notes:     string,   // preferences, allergies, special requests (default '')
  points:    number,   // loyalty points — default 0, reserved for future use
  createdAt: string,   // ISO date string (YYYY-MM-DD)
}
```

### Derived stats (computed on render, not stored)

| Stat | Derived from |
|------|-------------|
| `totalVisits` | Count of `AppData.transactions` where `customerPhone` matches |
| `totalSpent` | Sum of `total` across matched transactions |
| `lastVisit` | Most recent `date` across matched transactions |
| `favouriteService` | Most frequent service name in matched transaction items |
| `preferredBarber` | Barber id with most appearances in matched transactions |
| `visitHistory` | All matched transactions + appointments, sorted newest first |

> **Note:** Existing transactions have no phone field. Going forward, when a phone is provided at the POS, `POS.confirmPayment()` will add `customerPhone` to the transaction object before saving. `getStats(phone)` matches on `transaction.customerPhone` for transactions and `appointment.phone` for appointments. Old transactions without `customerPhone` will not appear in visit history.

### Phone normalisation

All phone numbers are normalised before storage and lookup:
- Strip spaces, dashes, parentheses
- Replace leading `+601` → `01`, `601` → `01`
- Store as digits-only string starting with `0`

Example: `+60 19-345 6789` → `0193456789`

### AppData addition

```js
AppData.customers = StorageManager.load('customers', DEFAULT_DATA.customers);
// DEFAULT_DATA.customers = [] (no seed data — real customers only)
```

---

## UI Components

### View — `views/customers.php`

Section `id="view-customers"`, follows the Barbers view pattern.

| Element | Description |
|---------|-------------|
| Header | Page title, total customer count label (`id="cust-summary"`), search input (`id="cust-search"`), Add Customer button |
| Tier filter tabs | All / New (1 visit) / Regular (2–9 visits) / VIP (10+ visits) |
| Cards grid | `id="cust-grid"` — responsive 2–4 col, one card per customer |
| Empty state | `id="cust-empty"` — shown when no results match |

**Customer card contents:**
- Initials avatar (2 letters, colour generated from customer id)
- Full name + phone
- Visit count badge + Total spent
- Last visit date
- Points badge (shown even if 0 — prepares UI for loyalty feature)

---

### Modal — `modal-customer` (Add / Edit)

Fields:
- Full Name (required)
- Phone Number (required) — normalised on save
- Notes textarea (optional) — preferences, allergies, special requests

Behaviour: title switches between "Add Customer" / "Edit Customer". On save, phone uniqueness is validated — if phone already exists on a different record, show an error toast and block save.

Key DOM IDs: `modal-customer`, `cust-modal-title`, `cust-edit-id`, `cust-name`, `cust-phone`, `cust-notes`

---

### Modal — `modal-customer-detail` (Profile View)

Read-only profile panel opened by clicking a customer card.

Sections:
1. **Header** — avatar, name, phone, points badge
2. **Stats row** — 4 chips: Total Visits, Total Spent, Last Visit, Favourite Service
3. **Preferred Barber** — barber avatar + name (or "—" if no visits)
4. **Notes** — staff notes for this customer (or "No notes" if empty)
5. **Visit History** — last 10 entries (transactions + appointments) newest first. Each entry shows: date, service name(s), barber, amount (for transactions) or status (for appointments)
6. **Actions** — Edit button (opens modal-customer in edit mode), Delete button (opens confirm dialog)

Key DOM IDs: `modal-customer-detail`, `cust-detail-avatar`, `cust-detail-name`, `cust-detail-phone`, `cust-detail-points`, `cust-detail-visits`, `cust-detail-spent`, `cust-detail-last-visit`, `cust-detail-fav-service`, `cust-detail-barber`, `cust-detail-notes`, `cust-detail-history`

---

### Payment modal change — `modals/modal-payment.php`

Add a **Phone Number** input directly below the existing Customer Name input:

```
Customer Name (optional)   →  keep as-is
Phone Number (optional)    →  new field, id="pay-customer-phone"
```

This enables auto-create on POS transactions.

---

## JS Module — `assets/js/customers.js`

Object: `Customers`

| Function | Description |
|----------|-------------|
| `Customers.init()` | Entry point called by Router — resets filters, renders cards |
| `Customers.render()` | Rebuilds cards grid from current filtered list |
| `Customers.filter()` | Reads search input + active tier, re-renders |
| `Customers.filterTier(btn)` | Switches active tier tab, calls filter() |
| `Customers.openAddModal()` | Clears form, sets title to "Add Customer", opens modal |
| `Customers.openEditModal(id)` | Pre-fills form from customer record, opens modal |
| `Customers.save()` | Validates, normalises phone, creates or updates record, persists to AppData |
| `Customers.openDetail(id)` | Derives stats via getStats(), renders detail modal, opens it |
| `Customers.delete(id)` | Calls showConfirm(), removes record from AppData on confirm |
| `Customers.getStats(phone)` | Returns `{ totalVisits, totalSpent, lastVisit, favouriteService, preferredBarber, history }` |
| `Customers.findOrCreate(name, phone)` | Normalises phone, looks up existing customer, creates if not found. Returns customer id. |
| `Customers.normalisePhone(raw)` | Strips formatting, normalises prefix, returns digit string |

---

## Integration Points

### POS — `assets/js/pos.js` — `POS.confirmPayment()`

After the transaction is saved to `AppData.transactions`, add:

```js
const name  = document.getElementById('pay-customer-name').value.trim();
const phone = Customers.normalisePhone(document.getElementById('pay-customer-phone').value.trim());
if (phone) {
  trx.customerPhone = phone;   // stored on the transaction for history lookup
  Customers.findOrCreate(name || 'Walk-in', phone);
}
```

### Appointments — `assets/js/appointments.js` — `Appointments.save()`

After the appointment is saved to `AppData.appointments`, add:

```js
const name  = document.getElementById('appt-customer').value.trim();
const phone = document.getElementById('appt-phone').value.trim();
if (phone) Customers.findOrCreate(name, phone);
```

---

## Sidebar change — `partials/sidebar.php`

Remove the `disabled` class and the `showToast('Coming Soon')` onclick from the Customers nav item. Replace with:

```html
<a class="nav-item" data-view="customers" data-tip="Customers" onclick="navigate('customers')">
  <i class="fa-solid fa-users nav-icon"></i>
  <span class="lbl">Customers</span>
</a>
```

---

## Router + AppData changes — `assets/js/app.js`

1. Add to `DEFAULT_DATA`: `customers: []`
2. Add to `AppData`: `customers: StorageManager.load('customers', DEFAULT_DATA.customers)`
3. Add to `AppData.saveAll()` key list: `'customers'`
4. Add to `Router.pages`:
   ```js
   customers: { title:'Customers', sub: () => 'Global customer profiles' }
   ```
5. Add to `Router.go()` inits map:
   ```js
   customers: () => Customers.init()
   ```

---

## Database — `database_upgrade.sql`

Add a `customers` table for when the app is connected to the backend:

```sql
CREATE TABLE IF NOT EXISTS `customers` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `phone`      VARCHAR(20)  NOT NULL,
  `notes`      TEXT DEFAULT NULL,
  `points`     INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Files Summary

| Action | File |
|--------|------|
| Create | `views/customers.php` |
| Create | `modals/modal-customer.php` |
| Create | `assets/js/customers.js` |
| Modify | `assets/js/app.js` |
| Modify | `assets/js/pos.js` |
| Modify | `assets/js/appointments.js` |
| Modify | `partials/sidebar.php` |
| Modify | `modals/modal-payment.php` |
| Modify | `index.php` |
| Modify | `database_upgrade.sql` |

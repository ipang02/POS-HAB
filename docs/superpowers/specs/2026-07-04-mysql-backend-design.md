# MySQL Backend Design

## Goal

Replace localStorage-only data storage with a MySQL-backed API so all devices (laptops, phones, tablets) share the same data in real time.

## Problem

The app currently stores all data in `localStorage`, which is isolated per browser per device. Multiple cashier terminals cannot share transactions, services, or settings. Data is lost if the browser cache is cleared.

## Architecture

### Data Split

Two storage strategies, chosen by data type:

**Blob store** (`app_data` table) — for configuration and reference data:
- `services`, `barbers`, `appointments`, `inventory`, `queue`, `customers`, `settings`, `branches`
- Each key stored as one JSON blob row; last-write-wins is acceptable (these are edited by the owner, rarely by two people simultaneously)

**Individual rows** (`transactions` + `transaction_items` tables, from existing `database.sql`) — for financial records:
- Each payment INSERTs its own row; two concurrent payments never overwrite each other
- This is the critical safety guarantee for multi-terminal use

### API Endpoints

Two PHP files in `api/`:

#### `api/data.php`

| Method | Params | Action |
|---|---|---|
| GET | — | Returns all 8 blob keys + today's transactions assembled from rows. Returns `{seeded: false}` if `app_data` table is empty. |
| POST | `{key, value}` | Upserts one blob key in `app_data`. |

GET response shape:
```json
{
  "seeded": true,
  "updated_at": {
    "services": "2026-07-04 10:00:00",
    "barbers":  "2026-07-04 09:30:00",
    "..."
  },
  "services":     [...],
  "barbers":      [...],
  "appointments": [...],
  "inventory":    [...],
  "queue":        [...],
  "customers":    [...],
  "settings":     {...},
  "branches":     [...],
  "transactions": [...]
}
```

Transactions in the GET response are assembled by JOINing `transactions` and `transaction_items`, reconstructing the embedded `services` array shape that the JS already expects:
```json
{
  "id": "TRX-ABC123",
  "barberId": 1,
  "branchId": 1,
  "services": [{"name":"Haircut","qty":1,"price":25,"type":"service"}],
  "discount": 0, "tax": 6, "total": 26.5,
  "method": "cash", "tendered": 30,
  "date": "2026-07-04", "time": "14:30"
}
```

#### `api/transactions.php`

| Method | Params | Action |
|---|---|---|
| POST | transaction object | INSERTs one transaction row + N item rows into `transactions` / `transaction_items`. Returns `{ok: true, id: "TRX-..."}`. |
| GET | `?all=1` | Returns all transactions (all dates) for analytics. |

### Security

A shared API token protects both endpoints. Added to `config.php` (gitignored):
```php
define('API_TOKEN', '<random-32-char-string>');
```

PHP checks every request:
```php
if ($_SERVER['HTTP_X_API_TOKEN'] !== API_TOKEN) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}
```

`index.php` prints the token into the page as a JS constant at load time (server-rendered, never committed):
```php
<script>const HAB_API_TOKEN = '<?= API_TOKEN ?>';</script>
```

All JS fetches include: `headers: {'X-API-Token': HAB_API_TOKEN}`.

### Database Schema Addition

Add to `database.sql`:
```sql
CREATE TABLE IF NOT EXISTS app_data (
  data_key   VARCHAR(50)  NOT NULL PRIMARY KEY,
  data_value LONGTEXT     NOT NULL,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

The existing `transactions` and `transaction_items` tables from `database.sql` are used, with two additions required:

1. `transactions.customer_phone VARCHAR(20) DEFAULT NULL` — exists in `database_upgrade.sql` but not in the base schema. Must be added.
2. `transaction_items.commission_rm DECIMAL(8,2) DEFAULT NULL` — not in either schema file. Must be added. Stores the per-item `commissionRM` field used by analytics.

Add to `database.sql` alongside the `app_data` table:
```sql
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20) DEFAULT NULL;

ALTER TABLE transaction_items
  ADD COLUMN IF NOT EXISTS commission_rm DECIMAL(8,2) DEFAULT NULL;
```

---

## Boot Sequence

`App.init()` becomes async:

1. Show "Connecting…" spinner overlaid on the PIN screen (user cannot interact yet)
2. `fetch GET api/data.php`
3. **Success path:**
   - If `seeded: false` → seed MySQL from localStorage (POST all 8 keys one by one) → re-fetch
   - Hydrate `AppData` from API response
   - Save each key to localStorage (warm cache)
   - Remove spinner, show PIN screen
4. **Failure path (API unreachable):**
   - Hydrate `AppData` from localStorage (existing behaviour)
   - Show small persistent banner: "Offline — using local data"
   - Remove spinner, show PIN screen
5. Start 30-second polling interval

`App.lastSyncAt` (Unix timestamp) is updated on every successful fetch.

---

## Save Flow

### Blob keys (services, barbers, etc.)

`AppData.save(key)` gains a second action:
```js
save(key) {
  StorageManager.save(key, this[key]);                          // unchanged
  API.saveBlob(key, this[key]);                                 // NEW: fire-and-forget
}
```

`API.saveBlob` is a thin helper that POSTs to `api/data.php` and silently swallows errors (the next poll will reconcile).

`AppData.save('transactions')` is **never called** — the blob path for transactions is removed. All transaction persistence goes through `api/transactions.php`.

### Transactions (pos.js only)

Replace the current payment completion block:

**Before:**
```js
AppData.transactions.push(trx);
AppData.save('transactions');
showReceipt(trx);
```

**After:**
```js
const res = await API.saveTransaction(trx);   // awaited — must confirm before receipt
if (!res.ok) { showToast('Payment failed to save. Try again.', 'error'); return; }
AppData.transactions.push(trx);               // update local cache
StorageManager.save('transactions', AppData.transactions);
showReceipt(trx);
```

This is the only `await` in the data layer. The receipt is only shown after the server confirms the INSERT succeeded.

---

## Polling & Sync

A `setInterval` fires every 30 seconds after boot:

```
Poll tick:
  fetch GET api/data.php
  → for each blob key:
        if new Date(api.updated_at[key]) > new Date(App.lastSyncAt)
          → AppData[key] = api[key]
          → StorageManager.save(key, api[key])
  → replace AppData.transactions with today's rows from api.transactions
  → App.lastSyncAt = new Date().toISOString()  // ISO string; compared with MySQL datetime strings via new Date()
  → if any key changed → triggerRerender()
```

### Re-render Rules

| Current view | Condition | Action |
|---|---|---|
| `pos` | `POS.cart.length > 0` | Skip — active transaction in progress |
| `pos` | `POS.cart.length === 0` | Refresh service/product grid only (`POS.renderServiceGrid()`, `POS.renderProductGrid()`) |
| any other view | — | `Router.go(Router.current)` (full re-render) |

### Analytics Special Case

Analytics needs all historical transactions, not just today's. `Analytics.init()` fires a one-time fetch: `GET api/transactions.php?all=1`. The 30s poll does not fetch historical transactions.

### Offline Polling

If the boot fell back to localStorage, the interval still fires every 30 seconds. A failed fetch is silently ignored. When connectivity is restored and a poll succeeds, the banner is removed and normal sync resumes.

---

## First-Run Migration

Triggered when `api/data.php` GET returns `{seeded: false}` (empty `app_data` table):

1. Client reads current localStorage for all 8 keys
2. POSTs each key to `api/data.php` sequentially
3. Re-fetches `GET api/data.php` to confirm
4. Continues with normal boot

This runs exactly once per server. After migration, MySQL is the source of truth.

---

## Files Changed

| File | Type | Change |
|---|---|---|
| `config.php` | Modify | Add `API_TOKEN` constant |
| `config.example.php` | Modify | Add `API_TOKEN` placeholder |
| `database.sql` | Modify | Add `app_data` table |
| `api/data.php` | Create | Blob CRUD + transaction GET assembly |
| `api/transactions.php` | Create | Individual transaction INSERT + full history GET |
| `assets/js/app.js` | Modify | Async boot, `API` helper object, polling interval, `StorageManager.save` API call |
| `assets/js/pos.js` | Modify | Payment completion → `await API.saveTransaction()` |
| `index.php` | Modify | Print `HAB_API_TOKEN` JS constant, include `config.php` (currently commented out) |

**Not changed:** All other JS modules (`barbers.js`, `services-mgmt.js`, `appointments.js`, `analytics.js`, `customers.js`, `dashboard.js`, `inventory.js`, `settings.js`), all view PHP files, all modals, all partials.

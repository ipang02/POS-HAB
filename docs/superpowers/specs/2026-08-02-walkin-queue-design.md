# Walk-in Queue Design

## Overview

Customers scan a QR code posted at the shop entrance. They open a public page on their phone, enter their name, phone number, and group size, then are added to the queue automatically. The page shows the live queue — updating every 5 seconds with smooth animations — so customers can see their position. When the barber marks them as serving, a "Your Turn" banner appears on their page.

Staff see the same queue in the Dashboard widget and can mark customers as Serving → Done.

---

## Requirements

- **Public join page** (`queue.php`) — no login, mobile-first
- **Fields**: name, phone, group size (interactive +/− counter)
- **Live queue view**: updates every 5s, smooth DOM diff (no full re-render)
- **Interactive animations**: slide-in on join, gold pulse on serving, fade-collapse on done
- **"Your Turn" banner**: appears on customer's page when barber marks them serving
- **Phone privacy**: display last 4 digits only (`****6789`)
- **Dashboard widget**: replaces old blob-based queue; Serve and Done action buttons per entry
- **Staff add**: "Add" button on dashboard opens a modal (name, phone, group size) for walk-ins who don't scan
- **QR code in Settings**: generated from the queue URL, copyable link, downloadable image

---

## Data Model

### New MySQL table: `queue`

```sql
CREATE TABLE IF NOT EXISTS `queue` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `session_date` DATE NOT NULL,
  `name`         VARCHAR(100) NOT NULL,
  `phone`        VARCHAR(20) NOT NULL,
  `party_size`   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `status`       ENUM('waiting','serving','done') NOT NULL DEFAULT 'waiting',
  `joined_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `served_at`    DATETIME DEFAULT NULL,
  `done_at`      DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_queue_branch_date` (`branch_id`, `session_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

One entry per customer per visit. `party_size` ≥ 1 (1 = just the customer).

---

## API

### `api/queue.php`

| Method | Auth | Params | Action |
|--------|------|--------|--------|
| GET | public | `?branch_id=1&date=YYYY-MM-DD` | Returns all `waiting` + `serving` entries ordered by `joined_at` |
| POST | public | `{ branch_id, name, phone, party_size }` | Inserts entry, returns `{ ok, entry }` |
| PATCH | X-API-Token | `{ id, status }` — status: `serving` or `done` | Updates status + timestamp, returns `{ ok }` |

---

## JavaScript Architecture

### New file: `assets/js/queue.js` — `QueueManager` object

| Method | Description |
|--------|-------------|
| `init()` | Starts 5s dashboard poll, renders widget |
| `poll()` | Fetches from `api/queue.php`, calls `renderDashboard(entries)` |
| `renderDashboard(entries)` | DOM diff: add new items with slide-in, update serving badge, remove done items with fade-collapse |
| `serve(id)` | PATCH `{ id, status: 'serving' }`, updates UI immediately |
| `done(id)` | PATCH `{ id, status: 'done' }`, triggers fade-collapse animation |
| `openAddModal()` | Opens `#modal-queue-add` (staff add walk-in) |
| `add(name, phone, partySize)` | POST to API, re-renders widget |

### `Dashboard.init()` change

Remove call to `Dashboard.renderQueue()`. Add call to `QueueManager.init()`.

### Old code removed from `dashboard.js`

- `addToQueue()` standalone function
- `Dashboard.removeFromQueue()` 
- `Dashboard.renderQueue()` (entire method)

---

## UI

### `queue.php` — Public Customer Page

**Join view (default):**
- Dark background (`#0D0D0D`), HAB gold accent — matches brand
- Name input, phone input, party size +/− counter (1–10)
- Counter label: "just me" / "me + 1 person" / "me + 2 people"
- Submit: POST to API, on success switch to Queue view

**Queue view (after joining):**
- Your Turn banner (hidden until status = serving) — gold border, pulse animation
- Live indicator (green dot, pulsing)
- Queue items: position number · name · masked phone · group badge if >1 · status badge
- "You" badge on the customer's own entry
- Polls every 5s, DOM-diff updates only changed elements

**Animations:**
- New item: `slideIn` (translateY from 16px + fade in)
- Status → serving: `goldPulse` keyframe (box-shadow rings), gold border + tint stays
- Status → done (removed by server): `fadeCollapse` (opacity + max-height → 0)
- Your Turn banner: `yourTurnIn` (scale from 0.92 + fade)

**Phone masking:** `maskPhone(phone)` shows `****6789` (last 4 digits).

**Session persistence:** Customer's entry `id` stored in `sessionStorage`. On page reload, skip join form and go straight to queue view.

### Dashboard Widget (`views/dashboard.php`)

Replace:
- Old `addToQueue()` button → `QueueManager.openAddModal()` button
- `id="queue-list"` content → rendered by `QueueManager.renderDashboard()`
- Each entry: name, masked phone, party badge, serving badge; **Serve** button (waiting→serving), **Done** button (serving→done)

### Settings QR Section (`views/settings.php`)

New card section with:
- QR image from Google Charts API: `https://chart.googleapis.com/chart?chs=180x180&cht=qr&chl=<encoded-url>`
- Read-only URL input + Copy button
- Download QR link
- URL derived from `location.href` so it works on any domain/path

---

## File Changes Summary

| File | Change |
|------|--------|
| `database.sql` | Append `CREATE TABLE IF NOT EXISTS queue` |
| `api/queue.php` | New — public GET/POST, authenticated PATCH |
| `queue.php` | New — public customer-facing queue page |
| `assets/js/queue.js` | New — `QueueManager` object |
| `modals/modal-queue.php` | New — staff add-to-queue modal |
| `views/dashboard.php` | Update queue widget HTML (Serve/Done buttons, new IDs) |
| `assets/js/dashboard.js` | Remove old queue code, call `QueueManager.init()` |
| `views/settings.php` | Add QR code section |
| `assets/js/settings.js` | Add `renderQRCode()` and `copyQueueUrl()` |
| `index.php` | Add `queue.js` script tag, include `modal-queue.php` |

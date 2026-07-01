# Services

> Service catalogue management — create, edit, hide, and organise services offered in the POS.

## Overview

The Services view is where staff manage the barbershop's service catalogue. Services can be filtered by category and active/inactive status. Any price change here applies immediately across the whole system, including the POS cashier screen. A service can be hidden from the POS without deleting it — its transaction history is preserved.

## Features

- Service cards grid with name, price, duration, and category icon
- Search by service name
- Category filter: All / Hair / Beard / Treatment / Package
- Status filter tabs: All / Active (visible in POS) / Hidden from POS
- Add Service button opens the service form modal
- Info banner reminding that price changes apply live to POS

## UI Sections

| Section | Description |
|---------|-------------|
| Header | Summary label, search input, category filter, Add Service button |
| Status filter tabs | Toggle between All / Active / Hidden views |
| Service cards grid | Card per service showing icon, name, price, duration |
| Info banner | Warning that edits apply immediately to POS |

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `svc-mgmt-summary` | Header subtitle (e.g. "12 services · 10 active") |
| `svc-mgmt-search` | Search input |
| `svc-mgmt-cat-filter` | Category filter `<select>` |
| `svc-mgmt-grid` | Service cards grid container |
| `svc-mgmt-empty` | Empty state shown when no services match filters |

## JS Module

| Function | Trigger |
|----------|---------|
| `ServicesMgmt.filter()` | Search input `oninput` and category filter `onchange` |
| `ServicesMgmt.filterStatus(btn)` | Status tab buttons |
| `ServicesMgmt.openAddModal()` | Add Service button |

## Included Modals

### modal-service — Add / Edit Service

Used for creating new services and editing existing ones. Includes a live icon preview card that updates as name, price, and icon are changed.

**Required fields:** Service Name, Price, Duration, Category.

**Features**
- Service name input
- Price (RM) and Duration (minutes) inputs
- Category select (Hair / Beard / Treatment / Package)
- Icon select (12 Font Awesome icon options)
- Live preview card showing icon, name, and price
- Optional short description (shown in POS cashier)
- "Visible in POS Cashier" toggle — hides service from cashier screen without deleting

**Key DOM IDs**

| ID | Purpose |
|----|---------|
| `modal-service` | Modal overlay root |
| `svc-modal-title` | Modal heading (Add / Edit mode) |
| `svc-modal-sub` | Modal subtitle |
| `svc-edit-id` | Hidden field storing service ID when editing |
| `svc-name` | Service name input |
| `svc-price` | Price input (RM) |
| `svc-duration` | Duration input (minutes) |
| `svc-cat` | Category `<select>` |
| `svc-icon` | Icon `<select>` |
| `svc-icon-preview` | `<i>` tag showing selected icon live |
| `svc-name-preview` | Name shown in the live preview card |
| `svc-price-preview` | Price shown in the live preview card |
| `svc-desc` | Optional description input |
| `svc-active` | POS visibility toggle checkbox |

**JS calls:** `ServicesMgmt.previewIcon(value)`, `ServicesMgmt.save()`

## Dependencies

- `modals/modal-service.php` — add/edit modal
- `modals/modal-confirm.php` — delete confirmation dialog
- `partials/sidebar.php` — navigation routing to this view
- `views/pos.php` (consumer) — reads active services into the POS service grid

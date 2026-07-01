# Inventory

> Product stock management — track inventory levels, set low-stock thresholds, and add/edit products.

## Overview

The Inventory view manages physical products sold or used in the barbershop (e.g. pomade, shaving cream, tools). Products are organised by category and displayed as cards showing stock quantity, minimum stock threshold, unit, and price. A low-stock alert banner appears automatically when any product falls below its minimum threshold. Products here also appear in the POS Products panel for sale at the cashier.

## Features

- Product cards grid with stock level, unit, price, and category badge
- Search by product name
- Category filter tabs: All / Styling / Hair Care / Shaving / Tools / Beard Care
- Low stock alert banner with a summary of affected products
- Add Product button opens the inline add/edit modal
- Stock level indicator — highlights products at or below minimum stock

## UI Sections

| Section | Description |
|---------|-------------|
| Header | Summary label, search input, Add Product button |
| Category tabs | Filter products by category |
| Low Stock Banner | Conditionally shown red alert listing low-stock products |
| Product cards grid | Card per product showing name, stock qty, price, unit |

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `inv-summary` | Header subtitle (e.g. "24 products · 3 low stock") |
| `inv-search` | Search input |
| `inv-grid` | Product cards grid container |
| `inv-empty` | Empty state shown when no products match filters |
| `low-stock-banner` | Low stock alert banner (hidden by default) |
| `low-stock-msg` | Description text inside the low stock banner |

## JS Module

| Function | Trigger |
|----------|---------|
| `Inventory.filter()` | Search input `oninput` |
| `Inventory.filterCat(btn)` | Category tab buttons |
| `Inventory.openAddModal()` | Add Product button |
| `Inventory.save()` | Save Product button inside modal |

## Included Modals

### modal-inv — Add / Edit Product

Defined inline inside `views/inventory.php` (not a separate file). Used for both creating and editing products.

**Required fields:** Product Name, Category, Unit, Stock Qty, Min Stock, Price.

**Features**
- Product name input
- Category select (Styling / Hair Care / Shaving / Tools / Beard Care)
- Unit select (pcs / bottle / box / roll / unit)
- Stock Qty and Min Stock (alert threshold) inputs
- Price (RM) input

**Key DOM IDs**

| ID | Purpose |
|----|---------|
| `modal-inv` | Modal overlay root |
| `inv-modal-title` | Modal heading (Add / Edit mode) |
| `inv-edit-id` | Hidden field storing product ID when editing |
| `inv-name` | Product name input |
| `inv-cat` | Category `<select>` |
| `inv-unit` | Unit `<select>` |
| `inv-stock` | Stock quantity input |
| `inv-min-stock` | Minimum stock alert threshold input |
| `inv-price` | Price input (RM) |

**JS calls:** `Inventory.save()`, `closeModal('modal-inv')`

## Dependencies

- `modals/modal-confirm.php` — delete confirmation dialog
- `partials/sidebar.php` — navigation routing to this view
- `views/pos.php` (consumer) — reads active products into the POS product grid
- `views/settings.php` (data) — global low-stock threshold setting (`set-low-stock`)

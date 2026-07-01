# Settings

> System configuration — branch management, tax and currency, receipt customisation, appearance, and notifications.

## Overview

The Settings view is the central configuration panel for the POS system. Changes here affect the whole application: tax rates feed into POS calculations, receipt settings control what is printed, and branch data populates the navbar branch switcher. Settings are persisted via the Save Settings button; Reset reloads the last saved state.

## Features

- Branch Management: add and edit branches (name, address, hours, contact)
- Tax & Currency: set SST tax rate, currency symbol, and global low-stock alert threshold
- Receipt Customisation: footer message, QR code toggle, tax line toggle
- Appearance: dark mode toggle
- Notifications: toggle new booking alerts, low stock alerts, payment confirmations, daily summary
- Save Settings and Reset buttons

## UI Sections

| Section | Description |
|---------|-------------|
| Branch Management | Branch cards grid + Add Branch button |
| Tax & Currency | Three inputs: tax rate, currency symbol, low-stock qty threshold |
| Receipt Customisation | Footer textarea, QR code toggle, tax line toggle |
| Appearance | Dark mode toggle |
| Notifications | 4 toggles for system alert preferences |
| Footer actions | Save Settings and Reset buttons |

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `branch-count-lbl` | Branch section subtitle (e.g. "3 branches") |
| `branch-cards-grid` | Branch cards grid container |
| `set-tax` | Tax rate input (%) |
| `set-currency` | Currency symbol input (e.g. "RM") |
| `set-low-stock` | Global low-stock alert threshold input (qty) |
| `set-receipt-footer` | Receipt footer message `<textarea>` |
| `set-receipt-qr` | "Show QR Code on Receipt" toggle checkbox |
| `set-receipt-tax` | "Show Tax on Receipt" toggle checkbox |
| `set-dark-mode` | Dark mode toggle checkbox |
| `notif-booking` | New Booking Alert toggle |
| `notif-stock` | Low Stock Alert toggle |
| `notif-payment` | Payment Notification toggle |
| `notif-daily` | Daily Summary toggle |

## JS Module

| Function | Trigger |
|----------|---------|
| `Settings.save()` | Save Settings button |
| `Settings.load()` | Reset button |
| `Settings.toggleTheme(checkbox)` | Dark mode toggle `onchange` |
| `BranchConfig.openAddModal()` | Add Branch button |

## Included Modals

### modal-branch — Add / Edit Branch

Used for creating new branches and editing existing ones. Features a live preview card showing the branch initials avatar, name, and address as they are typed. Business hours can be configured per day with open/closed toggles.

**Required fields:** Branch Name, Short Name (up to 3 characters).

**Features**
- Live preview card with auto-generated initials avatar
- Branch name and short name (used as avatar initials and receipt header)
- Phone, email, and address inputs
- Instagram handle input
- Business hours grid — open/closed toggle and time range per day of week

**Key DOM IDs**

| ID | Purpose |
|----|---------|
| `modal-branch` | Modal overlay root |
| `branch-modal-title` | Modal heading (Add / Edit mode) |
| `branch-modal-sub` | Modal subtitle |
| `branch-edit-id` | Hidden field storing branch ID when editing |
| `branch-avatar-preview` | Live avatar preview element |
| `branch-name-preview` | Branch name shown in preview card |
| `branch-addr-preview` | Address shown in preview card |
| `branch-name` | Full branch name input |
| `branch-short` | Short name input (max 3 chars, uppercase) |
| `branch-phone` | Phone number input |
| `branch-email` | Email address input |
| `branch-address` | Street address input |
| `branch-instagram` | Instagram handle input |
| `branch-hours-grid` | Business hours per-day rows container |

**JS calls:** `BranchConfig.updatePreview()`, `BranchConfig.save()`

## Dependencies

- `modals/modal-branch.php` — branch add/edit modal
- `modals/modal-confirm.php` — branch delete confirmation
- `partials/sidebar.php` — navigation routing to this view
- `partials/navbar.php` (consumer) — branch switcher reads branch data
- `views/pos.php` (consumer) — tax rate and currency symbol used in POS calculations
- `views/inventory.php` (consumer) — low-stock threshold used for alert banner

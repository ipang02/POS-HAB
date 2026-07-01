# Partial — Sidebar

> Fixed left navigation sidebar — view routing, nav badges, and collapsible state.

## Overview

`partials/sidebar.php` renders the fixed left sidebar included in `index.php`. It is the primary navigation hub: clicking a nav item calls `navigate('viewName')` which shows the corresponding `<section>` view. The sidebar supports a collapsed (icon-only) mode toggled by the Collapse button at the bottom. On mobile it slides in as an overlay.

## Features

- HAB brand logo (icon + full name, hidden when collapsed)
- Navigation sections: Main, Management, System
- Active state highlighting on current view
- Appointment badge (`nav-appt-badge`) showing pending appointment count
- Inventory low-stock badge (`nav-inv-badge`) shown when stock alert is triggered
- Collapsed/expanded mode (icon-only vs icon+label)
- "Customers" nav item marked as disabled / Coming Soon
- Admin user display at footer (avatar + name + shop name)
- Collapse toggle button with animated chevron icon

## Navigation Items

| Section | Item | View ID | Notes |
|---------|------|---------|-------|
| Main | Dashboard | `dashboard` | Default active view |
| Main | POS Cashier | `pos` | |
| Main | Services | `services` | |
| Main | Appointments | `appointments` | Shows `nav-appt-badge` |
| Main | Customers | — | Disabled — Coming Soon |
| Management | Barbers | `barbers` | |
| Management | Analytics | `analytics` | |
| Management | Inventory | `inventory` | Shows `nav-inv-badge` when low stock |
| System | Settings | `settings` | |

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `sidebar` | `<aside>` root element |
| `nav-appt-badge` | Pending appointments count badge on Appointments nav item |
| `nav-inv-badge` | Low-stock warning badge on Inventory nav item (hidden by default) |
| `sb-icon` | Chevron `<i>` icon inside the Collapse button (rotates on collapse) |

## JS Module

| Function | Trigger |
|----------|---------|
| `navigate('viewName')` | Nav item `onclick` |
| `toggleSidebar()` | Collapse button `onclick` |
| `toggleMobileSidebar()` | Called by navbar hamburger button |
| `showToast(msg, type)` | Triggered by disabled "Customers" nav item |

## Notes

- Each nav item uses `data-view="viewName"` and `data-tip="Label"` attributes. The `data-tip` is used as a tooltip label in collapsed mode.
- The `.lbl` class on text elements is hidden in collapsed state via CSS.
- `nav-appt-badge` count is updated by the Appointments module on data load.
- `nav-inv-badge` visibility is toggled by the Inventory module when low-stock products are detected.

## Dependencies

- `partials/head.php` — Font Awesome icons for all nav items

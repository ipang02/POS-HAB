# Barbers

> Barber team management — view status cards, today's assignments, and add/edit barber profiles.

## Overview

The Barbers view shows all registered barbers as cards with their current status (Available / Busy / Off Duty). Below the cards, a today's assignments table shows each barber's appointment count, commission rate, and earnings for the day. Staff can search and filter the card grid, and add or edit barbers via a modal.

## Features

- Barber card grid with status badge, initials avatar, and specialty tags
- Search by barber name
- Filter by status: All / Available / Busy / Off Duty
- Add Barber button opens the barber form modal
- Today's Assignments table: barber name, status, appointments today, commission %, earnings today

## UI Sections

| Section | Description |
|---------|-------------|
| Header | Summary label, search input, status filter, Add Barber button |
| Barber Cards grid | Responsive grid of barber profile cards |
| Today's Assignments | Table summarising each barber's day (appointments + earnings) |

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `barbers-summary` | Header subtitle (e.g. "5 barbers · 3 on shift") |
| `barber-search` | Name search input |
| `barber-status-filter` | Status filter `<select>` |
| `barbers-grid` | Barber cards grid container |
| `barbers-assignments` | `<tbody>` for today's assignments table |

## JS Module

| Function | Trigger |
|----------|---------|
| `Barbers.filter()` | Search input `oninput` and status filter `onchange` |
| `BarbersCRUD.openAddModal()` | Add Barber button |

## Included Modals

### modal-barber — Add / Edit Barber

Used for both creating new barbers and editing existing ones. Features a live avatar preview (initials + selectable colour) that updates as the name is typed.

**Required fields:** Full Name, Commission %.

**Features**
- Live avatar preview with selectable colour swatches
- Full name input (updates avatar preview in real time)
- Phone number input
- Commission % input (0–100, step 5)
- Status select (Available / Busy / Off Duty)
- Skills tag input — press Enter or `,` to add each skill tag

**Key DOM IDs**

| ID | Purpose |
|----|---------|
| `modal-barber` | Modal overlay root |
| `barber-modal-title` | Modal heading (Add / Edit mode) |
| `barber-modal-sub` | Modal subtitle |
| `barber-edit-id` | Hidden field storing barber ID when editing |
| `barber-avatar-preview` | Live avatar preview element |
| `barber-name-preview` | Name shown inside avatar preview area |
| `barber-color-swatches` | Colour swatch buttons for avatar background |
| `barber-name` | Full name input |
| `barber-phone` | Phone number input |
| `barber-commission` | Commission % input |
| `barber-status` | Status `<select>` |
| `barber-skill-tags` | Rendered skill tag chips container |
| `barber-skill-input` | Hidden text input for typing new skill tags |

**JS calls:** `BarbersCRUD.updatePreview()`, `BarbersCRUD.handleSkillKey(event)`, `BarbersCRUD.save()`

## Dependencies

- `modals/modal-barber.php` — add/edit modal
- `modals/modal-confirm.php` — delete confirmation dialog
- `partials/sidebar.php` — navigation routing to this view

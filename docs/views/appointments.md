# Appointments

> Weekly calendar and schedule management — book, view, and update appointment status.

## Overview

The Appointments view is a week-based calendar combined with a filterable today's schedule list. Staff can navigate weeks, book new appointments, and manage status (Pending → Confirmed → Completed / Cancelled). Clicking a calendar event or list row opens the appointment detail modal.

## Features

- Week navigation (prev / next / today)
- Calendar grid showing all appointments colour-coded by status
- Today's Schedule list with status and barber filters
- Book Appointment button opens the booking form modal
- Status legend: Pending (amber), Confirmed (blue), Completed (green)

## UI Sections

| Section | Description |
|---------|-------------|
| Header controls | Week navigation arrows, today button, legend, Book Appointment button |
| Calendar grid | 7-day horizontal grid, events rendered per time slot |
| Today's Schedule | Filterable table of today's appointments with action buttons |

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `cal-week-label` | Current week label (e.g. "Week of 30 Jun") |
| `cal-week-sub` | Week subtitle / date range |
| `cal-grid` | Calendar grid container (min-width 700px) |
| `appt-list-sub` | Subtitle below "Today's Schedule" heading |
| `appt-filter-status` | Status filter `<select>` (all / pending / confirmed / completed / cancelled) |
| `appt-filter-barber` | Barber filter `<select>` (populated dynamically) |
| `appt-list-tbody` | `<tbody>` for today's schedule table |
| `appt-list-empty` | Empty state shown when no appointments match filters |

## JS Module

| Function | Trigger |
|----------|---------|
| `Appointments.prevWeek()` | Left arrow button |
| `Appointments.nextWeek()` | Right arrow button |
| `Appointments.goToday()` | Today button |
| `Appointments.renderList()` | Filter dropdowns `onchange` |
| `Appointments.openBookingModal()` | Book Appointment button |

## Included Modals

### modal-appt — Book / Edit Appointment

Used for both creating new appointments and editing existing ones. The title and subtitle update depending on context (`appt-modal-title`, `appt-modal-sub`). Service selection auto-populates the estimated duration info bar.

**Required fields:** Customer Name, Service, Barber, Date, Time.

**Features**
- Customer name and phone number inputs
- Service and barber dropdowns (populated dynamically)
- Date picker and time select (30-minute slots, 09:00–20:00)
- Status select (Pending / Confirmed / Completed / Cancelled)
- Optional notes textarea
- Estimated duration info bar (shown after service is selected)

**Key DOM IDs**

| ID | Purpose |
|----|---------|
| `modal-appt` | Modal overlay root |
| `appt-modal-title` | Modal heading (Add / Edit mode) |
| `appt-modal-sub` | Modal subtitle |
| `appt-edit-id` | Hidden field storing the appointment ID when editing |
| `appt-customer` | Customer name input |
| `appt-phone` | Phone number input |
| `appt-service` | Service `<select>` |
| `appt-barber` | Barber `<select>` |
| `appt-date` | Date `<input type="date">` |
| `appt-time` | Time `<select>` |
| `appt-status` | Status `<select>` |
| `appt-notes` | Notes `<textarea>` |
| `appt-duration-info` | Duration info bar (hidden until service selected) |
| `appt-duration-lbl` | Duration value text inside info bar |

**JS calls:** `Appointments.save()`, `Appointments.updateDuration()`

---

### modal-appt-detail — Appointment Detail

Read-only detail view for a single appointment. Opened by clicking a calendar event or table row. Provides inline status change buttons and edit/delete actions.

**Features**
- Appointment detail display (customer, service, barber, time, notes)
- One-click status change buttons (Confirmed / Completed / Pending / Cancelled)
- Edit button (switches to modal-appt in edit mode)
- Delete button (triggers global confirm dialog)

**Key DOM IDs**

| ID | Purpose |
|----|---------|
| `modal-appt-detail` | Modal overlay root |
| `appt-detail-body` | Container for rendered appointment details |

**JS calls:** `Appointments.changeStatus()`, `Appointments.editFromDetail()`, `Appointments.deleteFromDetail()`

## Dependencies

- `partials/sidebar.php` — navigation routing to this view
- `modals/modal-appointment.php` — booking and detail modals
- `modals/modal-confirm.php` — delete confirmation dialog

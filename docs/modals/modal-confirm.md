# Modal — Confirm Dialog

> Global reusable destructive-action confirmation dialog used across all modules.

## Overview

`modal-confirm` is a shared confirmation dialog invoked whenever a delete or irreversible action is about to be performed. The title, message, and confirm button callback are set dynamically by the calling module before the modal is opened. It renders at `z-index: 70`, placing it above all other modals.

## Features

- Danger-styled icon (red triangle exclamation)
- Customisable title and message text
- Cancel button — closes modal without action
- Confirm button — executes the callback set by the calling module
- Highest z-index in the stack (70) — always appears on top

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `modal-confirm` | Modal overlay root (`z-index: 70`) |
| `confirm-title` | Heading text (set by calling module, default: "Are you sure?") |
| `confirm-msg` | Body message (set by calling module, default: "This action cannot be undone.") |
| `confirm-yes-btn` | Confirm/Delete button — `onclick` is assigned dynamically by the calling module |

## Usage Pattern

Each module sets the title, message, and button handler before opening:

```js
document.getElementById('confirm-title').textContent = 'Delete Barber?';
document.getElementById('confirm-msg').textContent = 'This barber will be permanently removed.';
document.getElementById('confirm-yes-btn').onclick = () => { /* delete logic */ };
openModal('modal-confirm');
```

## Used By

- `views/appointments.php` — delete appointment
- `views/barbers.php` — delete barber
- `views/services.php` — delete service
- `views/inventory.php` — delete product
- `views/settings.php` — delete branch

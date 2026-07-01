# Partial — Navbar

> Sticky top navigation bar — page title, global search, branch switcher, live clock, notifications, and user avatar.

## Overview

`partials/navbar.php` renders the sticky top bar included in `index.php`. It provides persistent global UI chrome: the current page title (updated by `navigate()`), a global search input, a branch switcher dropdown, a live digital clock, a notification bell with a dropdown, and the user avatar. On mobile it also renders the sidebar hamburger toggle.

## Features

- Mobile sidebar toggle button (visible on screens below `lg` breakpoint)
- Dynamic page title and subtitle (updated by JS on navigation)
- Global search input (hidden on small screens, expands on focus)
- Branch switcher dropdown — lists all configured branches, changes active branch context
- Live clock displaying current time in `HH:MM:SS` (updates every second)
- Notification bell with unread indicator dot and dropdown panel
- User avatar (initials, gold background)

## UI Sections

| Section | Description |
|---------|-------------|
| Left side | Mobile hamburger button + page title/subtitle |
| Right side | Search, branch switcher, clock, notifications bell, avatar |

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `navbar` | `<header>` root element |
| `page-title` | Current view title (e.g. "Dashboard") |
| `page-sub` | Current view subtitle (e.g. date or context info) |
| `global-search` | Global search `<input>` |
| `branch-label` | Active branch name text in the switcher button |
| `branch-dropdown` | Branch switcher dropdown panel (hidden by default) |
| `branch-dropdown-items` | Container for branch option rows (populated by JS) |
| `live-clock` | Live clock `<span>` (font-mono, tabular-nums) |
| `notif-dropdown` | Notification dropdown panel (hidden by default) |
| `notif-list` | Notification items container inside dropdown |

## JS Module

| Function | Trigger |
|----------|---------|
| `toggleMobileSidebar()` | Hamburger button `onclick` |
| `toggleBranchDropdown()` | Branch switcher button `onclick` |
| `toggleNotifDropdown()` | Notification bell button `onclick` |

## Notes

- `page-title` and `page-sub` are set by the `navigate()` function when switching views.
- `branch-dropdown-items` is populated dynamically from branch data stored in settings.
- The notification bell dot (`.dot-pulse`) is always visible; notification content is currently static placeholder HTML and intended to be populated by JS.
- The live clock starts on page load and updates via `setInterval`.

## Dependencies

- `partials/head.php` — Font Awesome icons used throughout the navbar
- `views/settings.php` (data) — branch list populates `branch-dropdown-items`

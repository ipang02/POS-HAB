# Dashboard

> Main landing view — daily KPIs, charts, walk-in queue, recent transactions, and end-of-day reporting.

## Overview

The Dashboard is the default active view when the app loads. It gives staff a real-time snapshot of the day: revenue, customer count, active barbers, and pending appointments. It also provides the walk-in queue manager and a shortcut to the End of Day report.

## Features

- 4 KPI cards: Revenue Today, Customers served, Active Barbers (vs total), Pending Appointments
- Weekly Revenue bar chart with a Week / Month tab toggle
- Payment Methods donut chart with dynamic legend
- Walk-in queue panel — add customers and manage queue order
- Recent Transactions table (last 8 records)
- End of Day Report button (opens modal-shift)

## UI Sections

| Section | Description |
|---------|-------------|
| KPI Cards row | Top-level metrics for the current day |
| Charts row | Revenue trend (2/3 width) + payment method donut (1/3 width) |
| Queue + Transactions row | Walk-in queue panel + last 8 transaction records |
| Footer | End of Day Report action button |

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `kpi-revenue` | Revenue Today display value |
| `kpi-customers` | Customers served today |
| `kpi-barbers` | Active barbers on shift count |
| `kpi-barbers-total` | Total registered barbers count |
| `kpi-appts` | Pending appointments count |
| `chart-dash-revenue` | Canvas for weekly/monthly revenue bar chart |
| `chart-dash-payment` | Canvas for payment method donut chart |
| `payment-legend` | Dynamic legend items for payment donut |
| `queue-list` | Walk-in queue item list container |
| `queue-count-lbl` | "N waiting" label above queue |
| `queue-empty` | Empty state shown when queue has no entries |
| `recent-trx-tbody` | `<tbody>` for recent transactions table |

## JS Module

| Function | Trigger |
|----------|---------|
| `Dashboard.switchDashChart(btn, 'week'/'month')` | Week / Month tab buttons |
| `addToQueue()` | Add button in queue panel |
| `openShiftReport()` | End of Day Report button |

## Included Modals

### modal-shift — End of Day Report

Opened via `openShiftReport()` from the Dashboard footer. Provides a full summary of the current day's shift including revenue, payment breakdown, barber performance, and cash drawer reconciliation.

**Features**
- 4 summary cards: Total Revenue, Transactions, Customers, Avg. Order
- Payment breakdown list (cash / card / QR)
- Per-barber performance (appointments + earnings)
- Cash drawer reconciliation (opening balance + cash collected = expected total)
- Print Report button (`window.print()`)

**Key DOM IDs**

| ID | Purpose |
|----|---------|
| `modal-shift` | Modal overlay root |
| `shift-date-lbl` | Date shown in modal header subtitle |
| `shift-revenue` | Total revenue for the day |
| `shift-trx-count` | Number of transactions |
| `shift-customers` | Number of unique customers |
| `shift-avg` | Average order value |
| `shift-pay-breakdown` | Payment method breakdown list |
| `shift-barber-perf` | Per-barber performance list |
| `shift-cash-collected` | Cash payments collected today |
| `shift-drawer-total` | Expected cash drawer total |

## Dependencies

- `partials/head.php` — Chart.js (renders `chart-dash-revenue`, `chart-dash-payment`)
- `partials/sidebar.php` — navigation routing to this view
- `modals/modal-shift.php` — End of Day modal

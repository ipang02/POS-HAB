# Analytics

> Sales analytics — revenue trends, service popularity, payment breakdown, barber performance, and full transaction history.

## Overview

The Analytics view gives management a deeper look at business performance over time. All charts and the transaction table respond to the selected date range. The full transactions table is searchable and the entire dataset can be exported as a CSV file.

## Features

- Date range toggle: This Week / This Month / Last 30 Days
- 4 summary KPI strips: Total Revenue, Transactions, Avg. Order, Top Service
- Revenue Trend line/bar chart (daily performance)
- Service Popularity chart (most booked services)
- Payment Methods donut chart with legend
- Barber Revenue bar chart (contribution per barber)
- Full transaction history table with search
- Export all transactions as CSV

## UI Sections

| Section | Description |
|---------|-------------|
| Header | Title, date range tabs, Export CSV button |
| Summary strip | 4 KPI tiles for the selected range |
| Charts grid | 2×2 grid: Revenue Trend, Service Popularity, Payment Methods, Barber Revenue |
| Transactions table | Full history with customer, service, barber, method, date, total |

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `an-total-rev` | Total Revenue KPI value |
| `an-total-trx` | Total Transactions KPI value |
| `an-avg-order` | Average Order Value KPI value |
| `an-top-svc` | Top Service KPI value |
| `chart-rev-trend` | Canvas for Revenue Trend chart |
| `chart-svc-pop` | Canvas for Service Popularity chart |
| `chart-pay-method` | Canvas for Payment Methods donut chart |
| `pay-method-legend` | Legend items for payment methods donut |
| `chart-barber-perf` | Canvas for Barber Revenue chart |
| `trx-search` | Transaction search input |
| `all-trx-tbody` | `<tbody>` for full transactions table |
| `trx-table-sub` | Subtitle below transactions heading (e.g. "Showing 42 records") |

## JS Module

| Function | Trigger |
|----------|---------|
| `Analytics.switchRange(btn)` | Date range tab buttons (`data-range="week/month/30d"`) |
| `Analytics.filterTrx()` | Transaction search input `oninput` |
| `Analytics.exportCSV()` | Export CSV button |

## Dependencies

- `partials/head.php` — Chart.js (renders all 4 charts)
- `partials/sidebar.php` — navigation routing to this view

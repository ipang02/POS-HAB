# POS Cashier

> Point of sale screen — select services/products, manage the cart, and process payment.

## Overview

The POS view is the main cashier interface. It uses a two-panel layout: a left panel for browsing services and products, and a right cart panel for building the order. Staff select a barber, add items to the cart, apply a discount, then process payment via cash, card, or QR Pay.

## Features

- Services panel with category tabs: All, Hair, Beard, Treatment, Packages
- Products panel with category tabs: All, Styling, Hair Care, Shaving, Tools, Beard Care
- Tab switcher between Services and Products panels
- Shared search input (keyboard shortcut `/` focuses search)
- Barber selector dropdown (required before payment)
- Cart with item list, clear button, and item count label
- Discount % input with real-time saved amount calculation
- Subtotal, SST tax, and total display
- Process Payment button (disabled until cart has items)

## UI Sections

| Section | Description |
|---------|-------------|
| Top controls | Panel tab switcher, shared search bar, barber selector |
| Services panel | Category filter tabs + scrollable service cards grid |
| Products panel | Category filter tabs + scrollable product cards grid (hidden by default) |
| Cart panel | Fixed-width right panel — item list, discount, totals, pay button |

## Key DOM IDs

| ID | Purpose |
|----|---------|
| `pos-tab-services` | Services tab button |
| `pos-tab-products` | Products tab button |
| `pos-panel-services` | Services panel container |
| `pos-panel-products` | Products panel container (hidden by default) |
| `svc-search` | Shared search input for services and products |
| `pos-barber` | Barber selector `<select>` |
| `service-grid` | Services card grid container |
| `product-grid` | Products card grid container |
| `cart-items` | Cart item list container |
| `cart-empty` | Empty cart state (hidden when items present) |
| `cart-count-lbl` | "N items selected" label |
| `pos-discount` | Discount percentage input |
| `pos-disc-amt` | Calculated discount amount (RM) |
| `pos-subtotal` | Subtotal before tax display |
| `pos-tax-pct` | Tax rate display (from settings) |
| `pos-tax-amt` | Calculated tax amount display |
| `pos-total` | Final total display |
| `btn-pay` | Process Payment button (disabled when cart empty) |

## JS Module

| Function | Trigger |
|----------|---------|
| `POS.switchPanel('services'/'products', btn)` | Panel tab buttons |
| `POS.handleSearch()` | Search input `oninput` |
| `POS.filterByCategory(btn)` | Service category tab buttons |
| `POS.filterProductCat(btn)` | Product category tab buttons |
| `POS.clearCart()` | Clear button in cart header |
| `POS.recalc()` | Discount input `oninput` |
| `POS.openPayment()` | Process Payment button |

## Included Modals

### modal-payment — Process Payment

Opened via `POS.openPayment()`. Shows an order summary and three payment method panels. Only one panel is visible at a time based on the selected method tab.

**Features**
- Order summary (subtotal, discount, tax, total)
- Payment method tabs: Cash, Card, QR Pay
- Cash panel: tendered amount input, change display, quick-amount buttons (50K / 100K / 150K / 200K)
- Card panel: instruction card + optional last-4-digits input
- QR Pay panel: generated QR code + confirmation instructions
- Optional customer name input
- Confirm Payment button

**Key DOM IDs**

| ID | Purpose |
|----|---------|
| `modal-payment` | Modal overlay root |
| `pay-subtotal` | Subtotal in order summary |
| `pay-discount` | Discount amount in order summary |
| `pay-tax` | Tax amount in order summary |
| `pay-total` | Grand total in order summary |
| `pay-panel-cash` | Cash payment panel |
| `pay-panel-card` | Card payment panel (hidden by default) |
| `pay-panel-qr` | QR Pay panel (hidden by default) |
| `cash-tendered` | Cash amount entered by customer |
| `cash-change` | Calculated change display |
| `card-last4` | Optional last-4-digits input |
| `qr-pay-code` | QR code render target |
| `pay-customer-name` | Optional customer name input |

**JS calls:** `POS.selectPayMethod(btn)`, `POS.calcChange()`, `POS.quickCash(amount)`, `POS.confirmPayment()`

---

### modal-receipt — Receipt

Shown automatically after payment is confirmed. Displays a styled receipt with transaction details. Supports browser print and starting a new order.

**Features**
- Shop header (name, address, phone — pulled from branch settings)
- Transaction info: receipt number, date/time, customer, barber
- Itemised line items with prices
- Subtotal, discount, tax, total, payment method, change
- Optional QR code (feedback/social — controlled by settings)
- Customisable footer message (from settings)
- Print button (`POS.printReceipt()`) and New Order button

**Key DOM IDs**

| ID | Purpose |
|----|---------|
| `modal-receipt-overlay` | Modal overlay root |
| `receipt-content` | Printable receipt body container |
| `rcpt-shop-name` | Branch name |
| `rcpt-address` | Branch address |
| `rcpt-phone` | Branch phone |
| `rcpt-id` | Receipt/transaction number |
| `rcpt-datetime` | Transaction date and time |
| `rcpt-customer` | Customer name (defaults to "Walk-in") |
| `rcpt-barber` | Serving barber name |
| `rcpt-items` | Line items container |
| `rcpt-subtotal` | Subtotal display |
| `rcpt-disc-row` | Discount row (hidden if no discount) |
| `rcpt-discount` | Discount amount |
| `rcpt-tax` | Tax amount |
| `rcpt-total` | Grand total |
| `rcpt-method` | Payment method label |
| `rcpt-change-row` | Change row (hidden for card/QR) |
| `rcpt-change` | Change amount |
| `rcpt-qr-wrap` | QR code section (hidden if disabled in settings) |
| `rcpt-qr` | QR code render target |
| `rcpt-footer` | Footer message text |
| `print-receipt` | Hidden container used for browser print |

**JS calls:** `POS.printReceipt()`, `POS.newOrder()`

## Dependencies

- `partials/head.php` — QRCode.js (renders QR in payment and receipt modals)
- `modals/modal-payment.php` — payment processing modal
- `modals/modal-receipt.php` — receipt display modal
- `views/services.php` (data) — service list populates `service-grid`
- `views/settings.php` (data) — tax rate, currency, receipt config

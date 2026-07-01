# Partial — Head

> HTML `<head>` partial — loads all external assets and configures Tailwind CSS and Chart.js defaults.

## Overview

`partials/head.php` is included at the top of `index.php`. It defines the page title, loads all third-party libraries via CDN, applies the custom Tailwind theme, and sets Chart.js global defaults before any chart is rendered.

## Features

- Page `<meta>` tags (charset, viewport)
- Page title: "HAB Barbershop — POS System"
- Google Fonts preconnect + load (Inter, Playfair Display)
- Font Awesome 6.5.0 (all icons used throughout the UI)
- Tailwind CSS CDN with custom theme config
- Chart.js 4.4.0 (used by Dashboard and Analytics)
- QRCode.js 1.0.0 (used by POS payment and receipt modals)
- Local stylesheet `assets/css/style.css`
- Chart.js default overrides (colour, font, border — applied on `DOMContentLoaded`)

## Tailwind Custom Theme

| Token | Value | Usage |
|-------|-------|-------|
| `gold` (default) | `#374151` | Primary accent buttons, icons, borders |
| `gold-light` | `#4B5563` | Hover states for gold elements |
| `gold-dark` | `#1F2937` | Pressed/active states |
| `ink-900` | `#F8F8F6` | Primary text |
| `ink-800` | `#F4F4F2` | Navbar/sidebar backgrounds |
| `ink-700` | `#FFFFFF` | Pure white surfaces |
| `ink-600` | `#EBEBEB` | Subtle borders |
| `ink-500` | `#E0E0DE` | Dividers |
| `font-sans` | Inter | Body and UI text |
| `font-display` | Playfair Display | HAB logo and headings |

## Chart.js Global Defaults (applied on DOMContentLoaded)

| Default | Value |
|---------|-------|
| `Chart.defaults.color` | `#6B6B6B` |
| `Chart.defaults.font.family` | `Inter` |
| `Chart.defaults.borderColor` | `#EBEBEB` |
| `Chart.defaults.backgroundColor` | `transparent` |

## External CDN Dependencies

| Library | Version | CDN |
|---------|---------|-----|
| Google Fonts (Inter, Playfair Display) | — | fonts.googleapis.com |
| Font Awesome | 6.5.0 | cdnjs.cloudflare.com |
| Tailwind CSS | CDN | cdn.tailwindcss.com |
| Chart.js | 4.4.0 | cdn.jsdelivr.net |
| QRCode.js | 1.0.0 | cdnjs.cloudflare.com |

## Local Assets

| File | Purpose |
|------|---------|
| `assets/css/style.css` | Custom component styles (glass, btn-gold, inp, sel, tog, etc.) |

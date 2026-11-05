# Milk Ledger

An offline-first, encrypted ledger app for a wholesale milk distributor. It tracks daily supply from the dairy, deliveries to each shop, collections, and pending balances. It is built as an installable Progressive Web App (PWA) that runs entirely on the phone.

**Live app:** https://sivaranjani430.github.io/milk-ledger/

## Features
- **Daily entry:** record packets received from the dairy and delivered to each shop, with one-tap "Copy yesterday" for repeat orders
- **Collections:** log payments per shop; unpaid amounts carry forward automatically as pending
- **Reports:** sales, collections, supplier payable, profit, and pending balance by shop
- **Backup and restore:** encrypted backup file that can be shared to WhatsApp or Google Drive and restored on a new phone
- **Works offline:** installs to the home screen and runs without internet via a service worker

## Security design
- PIN lock with configurable auto-lock (1–10 min) and lockout after 5 wrong attempts
- All data encrypted at rest with **AES-256-GCM**, key derived from the PIN using **PBKDF2**
- No network calls, no trackers, no third-party code, and no device permissions
- A strict **Content-Security-Policy** enforces the above

## Tech stack
Vanilla JavaScript · HTML · CSS · Web Crypto API · Service Worker · Web App Manifest · GitHub Pages

## Project structure
| File | Purpose |
|---|---|
| index.html | App shell |
| app.js | App logic, storage, encryption |
| styles.css | Mobile-first styling |
| sw.js | Service worker for offline use |
| manifest.webmanifest | PWA install metadata |

## Run it
Open the live link in Chrome on Android, then choose **Add to Home screen**. Or serve the folder with any static file server.

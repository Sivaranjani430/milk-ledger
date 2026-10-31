MILK LEDGER — setup on your father's phone (one time, ~10 minutes)

1. Put it online for free (needed so it opens like an app and works offline):
   - Create a GitHub account -> New repository (e.g. "milk-ledger", Public).
   - "Add file" -> "Upload files" -> upload ALL files from this folder -> Commit.
   - Settings -> Pages -> Source: "Deploy from a branch", Branch: main, / (root) -> Save.
   - After 1-2 minutes you get a link like https://YOURNAME.github.io/milk-ledger/
   (The files contain no data. All business data stays only on the phone.)

2. On father's Android phone, open that link in Chrome.
   - Chrome menu (⋮) -> "Add to Home screen" / "Install app".
   - Open it from the home-screen icon. It now works without internet.

3. First time: create a PIN (write it down — it cannot be recovered),
   then Settings -> set Aavin price and selling price for each packet,
   then Shops -> add shops (old pending amount can be entered per shop).

4. Every few days: Settings -> "Share backup" -> send to his own WhatsApp
   or Google Drive. The backup file is encrypted and needs the PIN.
   New phone: open the link, tap "Restore from backup" on the PIN screen.

Daily use:
   Morning  — Today tab: packets received from Aavin, then tap each shop and
              enter packets given ("Copy yesterday" fills repeat orders).
   Evening  — Collect tab: enter money received from each shop. Anything not
              paid automatically becomes pending.
   Reports  — sales, collection, Aavin amount, profit, pending by shop.

Security:
   - PIN lock, auto-lock after 1–10 minutes, lockout after 5 wrong PINs.
   - Data encrypted on the phone (AES-256-GCM, key from PIN via PBKDF2).
   - No internet connections, no trackers, no outside code, no permissions
     (camera, contacts, location, files) — enforced by a strict
     Content-Security-Policy. Only the WhatsApp reminder button opens WhatsApp.

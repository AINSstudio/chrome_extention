# AINS Studio — Glasswing

A client-side Chrome extension that improves AINS reading records at `ains.moe.gov.my/web/*`.

**Current release:** `v5.0.0` · **Codename:** Glasswing

## Highlights

- iOS-inspired glassmorphism bottom bar with five controls: Overview, Extensions, Add record, Refresh, and Back to AINS. The bar uses a muted blue, cream, and sage palette with soft lighting, frosted layers, and theme-aware dark styling.
- Compact floating translucent material with readable labels and a restrained selected-tab lens.
- Separate AINS Studio launcher remains draggable.
- Full AINS-hosted settings center at `/web/dashboard?ains-studio=settings`; the Chrome toolbar action opens this page instead of a popout.
- Global on/off control and per-feature switches for design, translation, reading dashboard, activity collection, Excel import, and clipboard support. Turn any feature off to use AINS defaults for that feature.
- Settings shortcut placed beside the AINS account control in the site navbar.
- A custom AINS Studio 404 page for unsupported Studio routes.
- An optional “Don’t show again” checkbox in the AINS announcement dialog, saved per Chrome profile; reset it from Studio settings.
- System, Light, and Dark appearance modes; supported interface labels in Bahasa Melayu, English, and Chinese.
- Reading overview with AINS-aware yearly totals, today’s count, date filtering, seven-day chart, reading streak, and CSV export for a chosen date.
- Excel/CSV book-record helper with column mapping, selectable starting row, gradual form filling, Physical book selection, five-star selection, approval prompt, and three-minute retry/reload handling.
- Excel importer requires the configured admin code and adds show/hide input plus a short cooldown after repeated incorrect attempts. Chrome stores only a salted PBKDF2-SHA-256 hash, not the plaintext code.
- Safari extension availability is labeled **Coming soon** in Studio.
- Copy, cut, paste, context menu, and text-selection behavior restored on AINS pages.
- Preferences, record snapshots, and importer state stay in Chrome extension storage; record content is not uploaded.

See [CHANGELOG.md](CHANGELOG.md) for version history and [GITHUB_RELEASE_NOTES.md](GITHUB_RELEASE_NOTES.md) for copy-and-paste release notes.

## Install or update in Chrome

1. Open `chrome://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this folder, which contains `manifest.json`. If already installed, click its reload button.
3. Refresh AINS. Use the settings shortcut beside the account control or click the Chrome toolbar icon to open the full settings page.

## AINS Studio pages

- Reading overview: `/web/dashboard?ains-studio=1`
- Extensions: `/web/dashboard?ains-studio=extensions`
- Excel import: `/web/new-record-book`

AINS Studio runs in the current browser. Its Extensions page reports AINS Studio’s own status; Chrome does not expose unrelated installed extensions without broad extension-management permission.

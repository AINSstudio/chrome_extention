# Changelog — AINS Studio / Glasswing

## [5.0.0] — 2026-10-25

### Added
- Added a full-page AINS Studio settings center with appearance and language controls.
- Added global enable/disable and individual switches for appearance, translation, dashboard, reading activity, Excel import, and clipboard support; disabled features return to AINS defaults.
- Added an account-bar settings shortcut and made the Chrome toolbar action open the full settings page.
- Added a custom Studio 404 page for unsupported Studio routes.
- Added a Safari extension “Coming soon” notice to the settings center.
- Added a “Don’t show again” checkbox to the AINS announcement dialog with a settings-page reset.

### Changed
- Removed the Chrome action popup and the floating in-page settings popout.
- Load the full redesign stylesheet only when the extension appearance is enabled, while keeping Studio settings and the account shortcut reachable.
- Removed the obsolete popup files.

## [4.36.0] — 2026-10-25

### Added
- Set the Excel importer to the supplied shared admin code; Chrome stores its salted PBKDF2-SHA-256 hash rather than the plaintext.
- Added show/hide code control and a 30-second cooldown after five incorrect attempts.
- Added a localized Safari extension “Coming soon” card in the popup and Studio extensions page.
- Updated the Extensions page to display the installed extension version dynamically.

## [4.35.0] — 2026-10-25

### Added
- Added a password gate to the Excel importer with first-use local password setup and per-tab-session unlock.
- Store only a salted PBKDF2-SHA-256 password hash in Chrome extension storage; saved imports require unlock before resuming.
- Label the importer as admin-only and explain that the local lock does not authenticate AINS server privileges.

## [4.34.0] — 2026-10-25

### Changed
- Refined the five-button Studio dock with a muted blue, cream, and sage palette, softer highlights, and calmer shadows.
- Tuned the frosted glass treatment for light and dark themes and preserved a solid-color reduced-transparency mode.

## [4.33.0] — 2026-10-24

### Changed
- Strengthened the five-button bottom bar's glassmorphism with deeper blur, layered transparency, brighter specular edges, and soft depth shadows.
- Refined the selected-tab glass lens and dark appearance; added a reduced-transparency fallback.
## [4.32.0] — 2026-10-24

### Changed
- Added Refresh as the fifth control in the floating Liquid Glass tab bar.
- Removed the separate header refresh control so all five requested controls share the bottom bar.
## [4.31.0] — 2026-10-24

### Changed
- Replaced the plain iOS-style bar with a compact floating Liquid Glass tab bar inspired by Apple's iOS 26 navigation layer.
- Added a restrained translucent surface, soft edge reflections, and a static glass selection lens; no oversized capsule outline or moving puck.
- Added light and dark glass treatments and reduced-motion support.
## [4.30.0] — 2026-10-24

### Changed
- Replaced the outlined, animated glass capsule with a conventional iOS-style bottom tab bar.
- The tab bar now spans the viewport, uses a restrained system-material background, compact icons and labels, and a static selected tint.
- Moved Refresh to the dashboard header; the navigation destinations are Overview, Extensions, Add record, and Back to AINS.
- Removed the moving glass selection puck and hover morphing from the navigation bar. The independent AINS Studio launcher remains draggable.
This changelog summarizes the product changes made during the AINS Studio redesign. It is reconstructed from the project’s release notes and conversation history; the extension folder does not contain a Git commit history.

## [4.29.0] — 2026-10-24

### Added
- Reworked dashboard navigation as a dark, bottom-centered liquid-glass dock inspired by the shared video reference.
- Added Overview, Extensions, Add record, Refresh, and Back to AINS dock actions.
- Added a translucent selection puck that glides to the active or hovered dock item, with accessible labels and reduced-motion support.

### Changed
- Kept the dock fixed at the bottom and separate from the draggable AINS Studio launcher.

## [4.28.0] — 2026-10-24

### Added
- Introduced a bottom-centered glass action bar on the Studio dashboard.

### Changed
- Refined dashboard navigation placement for a dock-style layout.

## [4.27.0] — 2026-10-24

### Added
- Reworked the AINS Studio floating launcher as a liquid-glass toggle with a draggable glass puck.

### Changed
- Returned dashboard navigation controls to the page header while the draggable launcher remained a separate control.

## [4.26.1] — 2026-10-24

### Fixed
- Reset an outdated saved dashboard-toolbar position after a layout update so the toolbar would no longer cover the dashboard title.

## [4.26.0] — 2026-10-24

### Added
- Refreshed the Reading overview with an iOS-inspired visual system: ambient gradients, frosted panels, responsive cards, and spring-like hover motion.
- Added a consecutive-day reading streak.
- Added CSV export for records on the selected date.

## [4.25.0] — 2026-10-24

### Added
- Made the AINS Studio launcher draggable, edge-snapping, and position-persistent.
- Added a movable glass action toolbar on the dashboard.

## [4.24.0] — 2026-10-24

### Added
- Added subtle Liquid Glass motion to buttons across AINS, AINS Studio, and the popup.

## Earlier feature set

- Full AINS visual redesign with System, Light, and Dark themes.
- In-page language selector for Bahasa Melayu, English, and Chinese, with batched translation and progress feedback for supported interface labels.
- Reading overview with year/today totals, date filtering, record list, seven-day chart, and full-page record scanning that checks results against AINS totals.
- Local record collection and importer progress details (current row, next row, and wait timer).
- Excel/CSV import with spreadsheet-column mapping and selectable starting row; it selects Physical book, fills the form gradually, selects five stars, and shows a short approval prompt before the normal AINS submit action.
- Import continuation after the AINS three-minute limit, with reload and retry handling.
- Confirmation-panel styling, improved dark-mode record-row contrast, and date-filter controls.
- Restored copy, cut, paste, context-menu, and text-selection behavior on AINS pages.
- Localized update toasts and locally stored appearance, language, and reading snapshots.

## Notes

- AINS Studio is client-side and works on `https://ains.moe.gov.my/web/*`.
- Reading snapshots and importer state are stored in Chrome extension storage; records are not uploaded by the extension.
- The Extensions page can report AINS Studio but cannot list unrelated installed Chrome extensions without broad extension-management permission.

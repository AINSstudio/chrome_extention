# AINS Studio v5.0.0 — Glasswing

**Glasswing** is the v5 major release of AINS Studio. This release turns the extension from a collection of page enhancements into a configurable, client-side companion for AINS. It introduces a dedicated settings center, individual feature controls, a custom Studio not-found experience, and a more transparent way to manage the AINS announcement dialog.

Glasswing is named for the glasswing butterfly: a clear, lightweight form with a distinct structure. That idea guides this release’s interface—familiar AINS workflows remain easy to reach while Studio’s tools become easier to understand and control.

## Release overview

| Field | Value |
| --- | --- |
| Product | AINS Studio |
| Version | `5.0.0` |
| Codename | Glasswing |
| Release type | Major release |
| Browser package | Chrome Extension, Manifest V3 |
| Supported pages | `https://ains.moe.gov.my/web/*` |

## What changed

### A full settings center inside AINS

The former small extension popout has been replaced with a complete settings page hosted on the AINS site for the current browser session. Open it from the Chrome extension icon or the settings shortcut beside the account control in the AINS navbar.

Settings provide one place to manage the extension’s overall state, choose which capabilities Studio should handle, select the appearance and interface language, and restore the AINS announcement after choosing not to show it again. The settings page also displays the current extension version and links to Studio’s other pages.

### Global and per-feature controls

The global AINS Studio switch enables or disables Studio’s page enhancements on this Chrome profile. Individual switches let users decide which parts of AINS Studio to use:

- Visual appearance and glass surfaces
- Translation tools
- Reading dashboard
- Local reading activity collection
- Excel record assistant
- Copy, cut, paste, and context-menu support

When a feature is disabled, the extension is intended to leave that part of the site to AINS’s default behavior. The Studio settings and extension-status pages remain available so users can turn the tools back on.

### Custom Studio not-found page

Unsupported AINS Studio routes now receive a Studio-branded 404 page with clear routes back to settings and the standard AINS dashboard. This is limited to Studio routes; ordinary AINS pages continue to be served by AINS.

### Announcement preference

The AINS “Pengumuman” dialog can now include a localized **Don’t show again** checkbox. The choice is saved in Chrome extension storage for this profile. Users can reverse the choice from the settings page, which allows the announcement to appear again.

### Existing reading tools, with clearer controls

The reading overview retains date-based counts, record snapshots, activity summaries, and CSV export. The Excel assistant retains its selectable starting row, column mapping, paced form entry, physical-book selection, and approval workflow. These tools can now be enabled or disabled individually through settings.

The Excel assistant remains an on-device convenience feature. Its local password check does not grant AINS administrator privileges or change server-side access controls. The stored credential verifier uses a salted PBKDF2-SHA-256 hash rather than storing the code as plain text.

### Browser and interface details

- Theme choices: System, Light, and Dark.
- Interface language choices: Bahasa Melayu, English, and Chinese for supported Studio and translated AINS interface text.
- Safari extension availability is described as **Coming soon**; this release does not include a Safari build.
- Extension preferences and locally collected reading snapshots remain in Chrome extension storage on the device.

## Developer notes

### Extension architecture

Glasswing uses a Manifest V3 service worker and content scripts scoped to AINS web pages. `background.js` opens the settings route from the extension action and manages the Studio stylesheets in active AINS tabs. The settings and feature configuration are stored under `ainsStudioConfigV1` in `chrome.storage.local`.

The content scripts are organized by responsibility:

- `theme.js` handles appearance, translation, clipboard behavior, announcement preference, and the update toast.
- `studio-dashboard.js` renders the reading overview, extension information, settings center, custom 404 page, and Studio navigation.
- `bulk-import.js` provides the Excel/CSV record assistant on the AINS new-record page.
- `styles.css` contains the main Studio interface and appearance styles.
- `studio-nav.css` contains the account shortcut and small extension-owned interface elements that remain available independently from the main appearance feature.

The Chrome action has no `default_popup`; its click handler opens the in-page settings center. The obsolete popup implementation is not part of this release package.

### Configuration and local data

The global and feature switches are stored in Chrome local extension storage. Appearance and language selections continue to use the Studio’s site-local preferences. Reading activity snapshots are stored locally by the extension. The extension does not upload those snapshots to an AINS Studio service.

The announcement preference is stored as `ainsStudioDismissAnnouncementV1`. Removing that value or using the settings reset control allows the announcement to display again.

### Compatibility and permissions

The release targets Chrome’s Manifest V3 extension model and matches pages under `https://ains.moe.gov.my/web/*`. Its declared permissions are `storage` and `scripting`, with host access limited to the AINS web pages. Features that rely on the AINS page structure may need maintenance if AINS changes its markup or navigation behavior.

## Upgrade and installation

1. Download `ains-polish-extension-v5.0.0.zip` from the release assets and extract it.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Choose **Load unpacked** and select the extracted folder that contains `manifest.json`.
4. If updating an existing unpacked installation, use the extension’s reload control, then refresh any open AINS tabs.
5. Open settings with the extension icon or the Studio settings shortcut in the AINS account bar.

## Release assets

- `ains-polish-extension-v5.0.0.zip` — installable unpacked-extension source archive.
- `GITHUB_RELEASE_DESCRIPTION.md` — full release text for the GitHub release description.
- `GITHUB_RELEASE_TITLE.txt` — suggested release title.
- `GITHUB_RELEASE_TAGS.txt` — suggested Git tag.

## Acknowledgements

Glasswing continues the work shaped by user feedback on readability, dark mode, translation, record counting, clipboard access, the draggable Studio control, and the Excel record workflow. The v5 settings center makes those choices visible and adjustable from one place.

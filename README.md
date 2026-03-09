# All Tabs Closure

<p align="center">
  <img src="icons/icon128.png" alt="All Tabs Closure Icon" width="96" height="96">
</p>

All Tabs Closure is a Firefox extension that lets you run configurable tab-management actions from a single popup button.

## Features

- One-click execution from popup
- Multiple close behaviors configurable in Options
- Execute without saving, save only, or save and execute
- Light/Dark theme switcher (synced across popup, options, and license page)
- Local-first behavior (no telemetry, no remote API dependency)

## Available Actions

From Options, you can choose one default action:

- Open new tab after closing except pinned
- Close all tabs (including browser)
- Close all tabs (including pinned) without closing browser
- Close all tabs except current and pinned tabs
- Close all tabs except current tab
- Close all tabs in other windows
- Close all tabs except current, pinned, group tabs
- Close other tabs in current window (keep active, pinned, and grouped)

## Project Structure

- `manifest.json` - extension manifest
- `service_worker.js` - background logic for all tab actions
- `popup/` - popup UI and behavior
- `options/` - options UI and behavior
- `options/license.html` / `options/license.js` - in-extension license viewer
- `_locales/en/messages.json` - i18n messages
- `icons/` - extension icons (SVG + PNG)
- `Third-party-icons/` - third-party theme icons + license
- `Fonts/` - bundled font + copying text

## Local Development

### Prerequisites

- Node.js
- [`web-ext`](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)

Install `web-ext` globally if needed:

```bash
npm install --global web-ext
```

### Lint

```bash
web-ext lint
```

### Build

```bash
web-ext build
```

Output artifact is created in `web-ext-artifacts/`.

## Permissions Used

- `tabs`: execute tab/window actions you trigger
- `storage`: store selected close mode and selected UI theme

## Privacy

This extension is designed to collect no personal data.

- Privacy policy: `PRIVACY_POLICY.md`

## Licenses

- Project license: `LICENSE` (MIT)
- Third-party licenses: `THIRD_PARTY_LICENSES.md`
- Font copying text: `Fonts/COPYING.txt`

You can also open licenses from inside the extension UI via the **License** button.

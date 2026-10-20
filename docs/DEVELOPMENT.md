# Development

## Requirements

- Node.js `>= 20` (`.nvmrc` pins 22 for CI)
- A userscript manager for live testing (Tampermonkey, Violentmonkey or
  ScriptCat)

## Commands

```bash
npm install
npm run dev          # Vite serve; install the generated dev script (prefix "dev:")
npm test             # node:test unit tests
npm run build        # dist/ + copies artifacts to the repository root
npm run check:i18n   # missing / unused locale keys
npm run verify:artifacts
npm run ci           # check:i18n + build + verify:artifacts
npm run harness      # mock YouTube page at http://localhost:5179 (build first)
```

## Local harness

`npm run build && npm run harness`, then open
`http://localhost:5179/watch?v=mock1`.

The harness serves a mock `ytd-app` with a guide, a watch layout, a Shorts
shelf and a `#movie_player` that implements the player API surface. GM
functions are shimmed on top of `localStorage`; the menu command buttons are
rendered bottom-right.

Query parameters:

| Parameter | Effect |
|---|---|
| `?v=<id>` | video id returned by `getVideoData()` |
| `?positions=<seconds>` | seeds a saved position for `?v` (or `mock1`) |
| `?delay-meta=1` | duration stays `NaN` for 1.5 s, then metadata fires |
| `?live=1` | `getDuration()` always returns `NaN`; the engine must not seek |
| `?corrupt=1` | stores an invalid settings blob before boot |
| `?late-guide=1` | removes the guide for 1.5 s, then inserts it |
| `?theme=light` | renders the page in light mode |

`/results` removes the player element before the script boots, so the
no-player path is exercised there.

The harness buttons (`watch`, `results`, `watch 2`) call `history.pushState`
and dispatch `yt-navigate-finish` + `yt-page-data-updated`, mirroring
YouTube's SPA contract.

## Debugging

- `localStorage.setItem('yp_debug', '1')` enables `logInfo` traces.
- Errors print as `YouTube Plus YP-#### message`; grep the code to find the
  throw site (table in [ARCHITECTURE.md](ARCHITECTURE.md#error-codes)).
- Our DOM carries `data-yp-ui`; the settings dialog root is
  `#yp-settings-root`; the interface stylesheet is `#yp-interface-style`.

## Verifying a selector against live YouTube

YouTube's markup changes often. Before adding a selector, confirm it in the
page console:

```js
// Theme
document.documentElement.hasAttribute('dark');

// Structure
[...document.querySelectorAll('ytd-guide-entry-renderer a')].map(a => [a.title, a.getAttribute('href')]);
document.querySelectorAll('grid-shelf-view-model:has(ytm-shorts-lockup-view-model)').length;
document.querySelectorAll('#secondary-inner #related yt-lockup-view-model').length;
document.querySelectorAll('ytd-comments#comments').length;

// Player
const p = document.getElementById('movie_player');
p.getVideoData();
p.getPlaybackQuality();
p.getAvailableQualityLevels();
```

Then paste the selector into `SEL` (`src/core/constants.js`) or the rule list
(`src/features/interface/rules.js`) and add its label to all locales.

## Testing rules

Unit tests cover pure logic (schema normalization, stylesheet generation,
speed/quality/position math, search, i18n). DOM behavior is verified in the
harness — see the smoke checklist in the implementation plan — and by one
manual pass with the built script on `www.youtube.com`:

1. The guide row appears once and opens the dialog.
2. Shorts shelves and the Shorts entry are hidden; toggles persist.
3. Speed, quality, resume, PiP and hotkeys behave as configured.
4. No uncaught console errors, including with `yp_debug` on.

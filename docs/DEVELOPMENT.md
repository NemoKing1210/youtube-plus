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
```

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
speed/quality/position math, search, i18n). DOM behavior is verified by one
manual pass with the built script on `www.youtube.com`:

1. The guide row appears once and opens the dialog.
2. Shorts shelves and the Shorts entry are hidden; toggles persist.
3. Speed, quality, resume, PiP and hotkeys behave as configured.
4. No uncaught console errors, including with `yp_debug` on.

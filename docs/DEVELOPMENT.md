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

## Local harness

The git-ignored `dev/harness/` serves a mock YouTube page and the built
userscript, so interface and layout rules can be checked without live
YouTube. Build first, then start the server in a second terminal:

```bash
npm run build
node dev/harness/serve.mjs   # http://localhost:5179 (PORT=<n> overrides)
```

`serve.mjs` answers `/`, `/watch`, `/results`, `/feed/subscriptions`,
`/@channel` and any path carrying `?page=`. The page script picks a fixture
template from `?page=` — `home`, `subscriptions`, `search`, `channel` or
`watch` (the default) — and inserts it into `#page-manager` before the
userscript boots. The existing shim flags keep working: `?corrupt=1`,
`?positions=<seconds>`, `?late-guide=1`, `?theme=light`, `?live=1` and
`?delay-meta=1`. `?shelf=<text>` replaces the subscriptions "Most relevant"
title (use `?page=subscriptions&shelf=Самое%20актуальное` for the Russian
case).

Manual checklist:

1. `?page=home`: Shorts are hidden by default (Shorts shelf, Shorts rich items).
   Posts, live, upcoming, watched, mixes and chips are hidden by their own
   switches (`data-fixture="home-*"` marks each target).
2. `?page=subscriptions`: "Most relevant" is hidden; it stays hidden with the
   UI language set to Russian when the title is `Самое актуальное` (`?shelf=`).
3. `?page=search`: shelves (`ytd-shelf-renderer`,
   `ytd-horizontal-card-list-renderer`), Shorts, watched, live and upcoming
   results hide.
4. `?page=channel`: Shorts tab and Shorts shelf, posts, trailer, live and
   upcoming items hide.
5. `?page=watch`: playlist panel, description, actions, transcript and the
   player pause overlay hide.
6. Layout: pick 3/4/6/auto columns and inspect
   `--ytd-rich-grid-items-per-row` on `ytd-rich-grid-renderer` in DevTools;
   resize to 360/768/1280/1920/3440 px and confirm auto columns follow.
7. Custom selectors: add `.mock-target` (watch fixture) and confirm it hides;
   `body { display:none }` must be ignored.
8. Volume/loop: enable the volume setting and confirm `video.volume` matches
   the configured percentage; enable loop and confirm `video.loop === true`.
9. Save/reload: settings survive a reload; open with `?corrupt=1` and confirm
   the old/invalid blob does not crash the script.

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

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

Open settings from the **YouTube Plus** row in the expanded guide. Check the
gear and label in both themes, and activate the row with a mouse, Enter and
Space. Replace the guide or load it late with `?late-guide=1` and verify
only one button renders. Toggle the guide button and shortcut hint in General.

For settings, open **Interface** in both themes at 1280×900, 360×740 and
640×300. Scroll to the last setting while the tabs and buttons stay visible.
Use arrow keys and Home/End to switch tabs, then use search to jump to a
setting. At phone widths, scroll across to Backup and verify that both text
areas fit. Toggle conditional controls, check that Cancel discards edits,
then confirm Reset and Save to persist the defaults.

In Backup, download the JSON, change and save a setting, then select the
downloaded file with **Import from file**. Confirm the original setting returns
immediately. Cancel the picker and try an invalid JSON file to confirm the
saved settings stay intact. At narrow widths, verify the file and text actions
can wrap inside their cards.

With the system motion preference set to its default, check section
transitions, search results and reset confirmation. Switch tabs quickly
while scrolling a long section. Then enable reduced motion and repeat to
check that the new effects are skipped and visibility stays correct.

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
   resize to 360/768/1280/1920/3440 px and confirm auto columns follow. With
   the default `targetWidth` 320 and item gap 8 the harness yields auto
   columns of about 2 / 2 / 3 / 5 / 8 at those widths.
7. Custom selectors: enable them, add `.mock-target` (watch fixture) and
   confirm it hides; `body { display:none }` must be ignored because of the
   `{`/`}`/`;` check. Confirm a pasted 301-character selector and a 51st entry
   are dropped, and that duplicates are stored once. The limits and rejected
   characters (`{ } ; @`, newline, backslash, `/*`, `*/`) live in
   `src/features/interface/custom.js`; invalid input must never break the
   stylesheet or the settings dialog.
8. Volume/loop: enable the volume setting and confirm `video.volume` matches
   the configured percentage. With **Remember volume** on, a volume set by
   hand is restored on the next video (the configured percentage applies
   until then); with memory off the configured percentage always applies.
   Enable loop and confirm `video.loop === true`.
9. Save/reload: settings survive a reload; open with `?corrupt=1` and confirm
   the old/invalid blob does not crash the script.
10. Open `?page=shorts` and enable Shorts in Settings. Use the three
    reels to verify advance on end, the 0 and 2 second delays, and a duration
    limit between the short and long fixture. During a delay, scroll manually
    or use an arrow key and confirm no extra advance. Test pausing a long
    item, raising the duration limit and disabling the feature mid-wait.
11. Enable Dislikes and change the count format, tooltip and ratio
    bar settings. Check the count on watch and Shorts, in both themes. With
    the harness response stub, use `?votes-status=404` and `?votes-status=429`
    on a watch page with a valid `v`. Use `?votes-network-error=1` for a
    simulated offline request.
    Check that the existing controls stay available when no count is shown.
    The harness substitutes a local response for the real API. Use live
    YouTube to verify the userscript manager's actual request.
12. Enable Comment Kit and open it on the watch and channel
    fixtures. Test searching, filtering, replies, pagination, seeking, the
    heatmap, transcript and chat tabs, and CSV/JSON/TXT export. Use
    `?comments=1000&chat=2000` to exercise the fixture limits. Reload in the
    same tab to check open-state and cache restoration. Repeat at 360 px and
    in both themes using only the keyboard, including the focus order and
    announced result count.

## Boot timing and flicker

The build metadata declares `@run-at document-start`. The manager must honour
it (Tampermonkey, Violentmonkey and ScriptCat do); a manager that injects at
`document-idle` will show the content this script hides for a frame before the
stylesheets apply. `src/main.js` boots immediately when
`document.documentElement` already exists and otherwise falls back to
`whenReady` (`DOMContentLoaded`). The generated stylesheet injector behaves the
same way: it appends to `document.head || document.documentElement` when one
exists and otherwise defers the append to `DOMContentLoaded`. Nothing in boot
needs `<body>`, so both paths are safe, and the `data-yp-root` guard makes
boot idempotent.

To check for flicker, build the script, install it and open
`www.youtube.com` with DevTools Network throttling set to **Slow 4G**. Hidden
blocks must not paint before the styles apply, the console must stay clean with
`localStorage.setItem('yp_debug', '1')`, and navigation, the player and the
settings dialog must still work. This is a manual step: it needs a live
browser with a userscript manager and cannot run in CI.

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
5. On live Shorts, repeat checks with 0, 2 and 10 second delays and a known
   Short longer than the limit. Test the native next button, manual navigation
   and disabling while a timer is pending.
6. On live watch and Shorts pages, enable Dislikes and inspect requests to
   `returnyoutubedislikeapi.com`. Confirm one request per uncached video ID,
   no requests with the feature disabled, no stale counts after navigation and
   the native rating controls still working. Check the layout in both themes.
7. On a watch page with a long thread, verify that Comment Kit picks up native
   replies after they are opened and adds results after scrolling to load
   more. Open a native transcript with multiple languages and check the panel
   follows the selected language. On a stream or premiere, test live chat
   search and pause/resume during a burst. Disable the feature mid-playback
   and confirm the panel, overlay and heatmap are removed. Check exported CSV
   in Excel and LibreOffice with non-Latin text.

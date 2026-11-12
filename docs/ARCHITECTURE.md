# Architecture

YouTube Plus is a set of independent **features** running on a small **core**.
A feature owns one section of the settings object, may contribute settings
tabs and reacts to a few lifecycle hooks. Everything else — persistence,
normalization, the settings UI, DOM observation, i18n — is shared.

## Repository layout

```text
src/
├── main.js                  # Boot: load settings → init/apply features → observers
├── core/
│   ├── constants.js         # Identity, storage keys, DOM conventions, SEL, timings
│   ├── schema.js            # field.bool/enum/int/record
│   ├── features.js          # Feature registry (registerFeature, hooks)
│   ├── settings.js          # Load / save / import / export + normalization
│   ├── bus.js               # Pub/sub: settings:*, scan, navigate, theme
│   ├── scan.js              # One MutationObserver + SPA navigation watch
│   ├── theme.js             # Mirrors YouTube's dark/light into data-yp-theme
│   ├── storage.js           # Safe GM_getValue / GM_setValue
│   ├── http.js              # GM_xmlhttpRequest wrapper (unused in v0.1)
│   └── debug.js             # YP-#### codes, verbose mode
├── i18n/
│   ├── index.js             # t(key, vars), configureLocale
│   ├── meta.js              # Supported locales, flags, aliases
│   └── locales/             # en ru zh es pt de fr ja — flat 'namespace.key' maps
├── features/
│   ├── general/             # UI language, guide row, hotkey, toasts
│   ├── interface/           # rules.js, finders.js, custom.js, css.js, engine.js
│   ├── layout/              # grid.js, engine.js, derived settings
│   ├── player/              # engine, speed, quality, volume, loop, positions, resume, pip, hotkeys
│   └── settings/            # dialog, renderer, controls, search, guide row, tabs
├── ui/                      # icons, toast, scroll lock
├── utils/                   # dom, format, keys
└── styles/                  # tokens, base, settings, interface, player
```

## Boot sequence

The script declares `@run-at document-start`. Boot runs as soon as
`document.documentElement` exists (falling back to `whenReady`, i.e.
`DOMContentLoaded`, for managers that inject earlier) so the hiding
stylesheets are in the document before YouTube paints its first frame. This is
safe because nothing in the boot path needs `<body>`: `ensureStyle` and the
Vite CSS injector append to `document.head || document.documentElement` when a
root exists, and the CSS injector defers the append to `DOMContentLoaded` when
a manager injects before `<html>` is created (the boot dispatch uses the same
fallback); `core/scan.js` observes `document.documentElement`, and history
hooks plus URL polling do not touch the page body. The `data-yp-root` guard keeps the second
call a no-op if a manager injects the script again. The interface rules then
hide content as soon as nodes are added, and the MutationObserver catches up
with markup rendered after boot.

```text
if (document.documentElement) boot() else whenReady(boot)
  guard: <html> already has data-yp-root → return
  set data-yp-root
  loadSettings()                  # normalize the stored blob against every schema
  observeTheme()                  # data-yp-theme follows html[dark]
  for feature in features (order):
      init()
      apply(cfg, null)
      on('settings:<id>') → apply(cfg, prev)
  on('scan')     → feature.scan(root)
  on('navigate') → feature.navigate(url)
  startScanning(); startNavigationWatch(); scanNow()
```

`general` has `order: 0`, so the UI language is configured before any other
feature renders text. Hook failures are isolated and logged (`YP-1010`); one
broken feature never blocks the rest.

## Settings

Settings are `{ [featureId]: featureSettings }`. Each feature describes its
section once with `field.*` builders (`core/schema.js`):

| Builder | Normalization |
|---------|---------------|
| `field.bool(def)` | must be a boolean |
| `field.enum(values, def)` | must be one of `values` (array or function) |
| `field.int(def, {min,max})` | rounded and clamped |
| `field.string(def, {maxLength})` | must be a string; trimmed and truncated |
| `field.list(item, {maxItems})` | must be an array; each item normalized, empty and duplicate items dropped, capped at `maxItems` |
| `field.record(fields)` | nested object, recursively normalized |

The same schema yields the defaults, the normalizer applied on **load, save
and import** (unknown keys are dropped, invalid values fall back to defaults,
so a corrupt or hostile backup can never put the script into an invalid
state), and the defaults used by Reset. `saveSettings()` persists and emits
`settings:<featureId>` for every changed section plus `settings:changed`.

Feature code reads its section with `getFeatureSettings(id)` and changes it
with `updateFeatureSettings(id, patch)`.

## Adding a feature

1. Create `src/features/<name>/index.js`:

   ```js
   import { registerFeature } from '../../core/features.js';
   import { field } from '../../core/schema.js';

   registerFeature({
     id: 'example',
     order: 40,
     fields: { enabled: field.bool(true), mode: field.enum(['a', 'b'], 'a') },
     tabs: [{
       id: 'example',
       titleKey: 'example.title',
       sections: [{
         titleKey: 'example.section',
         controls: [
           { type: 'switch', path: 'enabled', labelKey: 'example.enabled' },
           { type: 'select', path: 'mode', labelKey: 'example.mode',
             options: [{ value: 'a', labelKey: 'example.mode.a' }],
             showIf: (section) => section.enabled },
         ],
       }],
     }],
     init() {},
     apply(cfg, prev) {},
     scan(root) {},
     navigate(url) {},
   });
   ```

2. `import './features/<name>/index.js'` in `src/main.js`.
3. Add every user-facing string to **all** locales (`npm run check:i18n`
   fails otherwise).

That is all: the section is persisted, normalized, exported/imported, reset,
and gets its tab in the settings dialog.

## Settings UI

- The dialog edits a **draft** copy; nothing is saved or applied until Save.
- Tabs come from the registry (feature order, then declaration order). A tab
  is a spec (`sections` → `controls`) or fully custom (`render(ctx)`).
- Controls: `switch`, `select`, `number`, `group`, `hint`, `button`,
  `custom`. `path` is relative to the feature's section and may be dotted.
  Any control or section accepts `showIf(section, root)`.
- Search (`settings/search.js`) builds its index from the tab specs, so a
  control is searchable as soon as it has a `labelKey`. Results open the tab,
  scroll to `data-yp-find` and flash it.
- Entry points: the guide row (`settings/nav-button.js`), the manager menu
  command and `Ctrl+M` (`settings/hotkey.js`).

## Interface feature

A rule is one entry in `features/interface/rules.js`:

```js
{ group: 'watch', key: 'comments', css: ['ytd-comments#comments'] }
{ group: 'subscriptions', key: 'mostRelevant', experimental: true, find: findMostRelevant }
```

A rule's id is `<group>.<key>` (`watch.comments`). `settings.js` derives one
boolean per rule (`interface[group][key]`), plus the groups and the custom
selector fields, and the tab from the same list; `css.js` builds one
stylesheet for the enabled rules. Rules run only when `interface.enabled` is
true.

- `css` is a selector or a list, hidden with `display: none !important`.
- `find(root)` handles targets that cannot be expressed as CSS selectors
  (localized titles, overlay-derived state). It returns elements; the engine
  marks them with `data-yp-hide~="<id>"`, which the same stylesheet hides.
- `on: true` makes a rule enabled by default. `experimental: true` makes it
  **off** by default and shows the generic `interface.experimentalHint` when
  the rule has no `labelHint` of its own. Use it for rules that depend on
  localized text or a layout YouTube may change.
- `syncMarks(root, attr, id, matches)` (in `engine.js`) adds the id to every
  match and removes it from elements that no longer match, preserving other
  rules' ids in the same attribute. `runFind` visits every `find` rule on each
  scan and navigation, so a stale mark is cleared when an item stops matching.
  Find passes ride the shared scan debounce (`SCAN_DEBOUNCE_MS`); there is no
  separate throttle.

Hovering a rule's switch (the renderer emits `interface:preview`) excludes
that rule from the sheet and returns its selectors so they can be outlined
instead. For a `find` rule the preview marks matches with
`data-yp-preview~="<id>"` and outlines those. Scanning is scoped to the active
`#page-manager` so mark passes never touch previously visited pages.

Custom selectors are stored as `custom.selectors`, a `list` capped at 50
entries; each `string` item's schema `maxLength` is 1000 (a storage guard, so
over-long lines reach the sanitizer intact). `custom.js` has the authoritative
limits: an entry is rejected when it is empty, longer than 300 characters, or
contains `{`, `}`, `;`, `@`, a newline, a backslash or a CSS comment delimiter
(`/*`, `*/`); duplicates are dropped. `css.js` sanitizes again before
generating the stylesheet (defense in depth), so raw input never reaches CSS.
The sanitizer blocks CSS/HTML breakout but does not validate selector grammar,
so a malformed custom selector is dropped or can affect that rule only; no
injection is possible.

## Layout feature

The layout feature emits one generated stylesheet (`#yp-layout-style`) and is
rewritten on apply, scan, navigation and window resize (debounced). Per page
(`home`, `subscriptions`, `channel`) the user picks `auto` or 3–8 columns.
`auto` computes `floor((width + gap) / (targetWidth + gap))`, clamped to 2–8
columns, from the page's `ytd-rich-grid-renderer` width (falling back to
`window.innerWidth`). The stylesheet sets `--ytd-rich-grid-items-per-row` on
each page's renderer, `--ytd-rich-grid-gutter-margin` and
`--ytd-rich-grid-item-margin`, and optionally hides avatars or metadata and
unclamps card titles. Disabling the feature clears the stylesheet and removes
the resize listener.

## Player feature

State is keyed by video id (`getVideoData().video_id`, fallback to the URL's
`v` parameter). Per video, exactly once: apply speed, apply quality, restore
position, apply volume and loop. Quality preferences map to YouTube levels up
to `highres` (4320p / 8K); the level is applied once, verified after 2 s and
retried at most once. A manual speed change is never overwritten; changing
the speed setting re-applies it deliberately.

Volume is opt-in (`volumeEnabled`): the configured percentage is applied
unless `rememberVolume` finds a value saved from the user's last manual
change. The programmatic assignment records the applied value and suppresses
its own `volumechange`, so it never overwrites that memory; only a genuine
change writes the new value (at most every 500 ms). A pending save is
cancelled when the `<video>` element is swapped, so a stale default volume is
never persisted. `timeupdate` saves the resume position at most
every 5 s; entries expire after 90 days and are capped at 500. The PiP button
mirrors the browser's `enterpictureinpicture` /
`leavepictureinpicture` events. Disabling the feature removes the button,
unbinds hotkeys, and resets `playbackRate = 1` and `loop = false`.

## Verified selectors and platform facts

Confirmed against the source and the local harness for this version; no live
`www.youtube.com` pass was performed. Live confirmation remains a manual step
(see [DEVELOPMENT.md](DEVELOPMENT.md#verifying-a-selector-against-live-youtube)):

| Fact | Selector / API |
|---|---|
| App root | `ytd-app`, `#page-manager` |
| Guide row | `ytd-guide-entry-renderer` with `a[title]`; match links by `a#endpoint[href]`, not the localized title |
| Theme | `document.documentElement[dark]` |
| Shorts shelf | `grid-shelf-view-model:has(a[href^="/shorts/"])`, `ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])` |
| Resume overlay | `ytd-thumbnail-overlay-resume-playback-renderer` inside a video item (used by `findWatched`) |
| Most relevant shelf | `ytd-rich-shelf-renderer` title text, matched by the localized title list (`titles.js`) |
| Rich grid | `ytd-browse[page-subtype="…"] ytd-rich-grid-renderer`, `--ytd-rich-grid-items-per-row` |
| Watch page | `ytd-watch-metadata`, `#secondary-inner #related`, `yt-lockup-view-model` |
| Comments | `ytd-comments#comments` |
| Player | `#movie_player`, `getVideoData`, `getPlaybackQuality`, `setPlaybackQualityRange`, `seekTo`, `setPlaybackRate`, `getDuration` |
| Quality levels | `highres` (4320p / 8K), `hd2160` (2160p / 4K), `hd1440`, `hd1080`, `hd720`, `large`, `medium`, `small`, `tiny` |
| Navigation | `yt-navigate-finish`, `yt-page-data-updated`, `yt-player-updated` |

YouTube keeps previously visited pages in the DOM. Hiding is CSS-only and
harmless there; JS `find` passes are scoped to the active `#page-manager`.

## Error codes

| Code | Meaning |
|---|---|
| `YP-1001` | bus listener threw |
| `YP-1002` | settings persist failed |
| `YP-1003` | settings import failed |
| `YP-1010` | feature hook threw |
| `YP-1101` | interface rule threw while previewing |
| `YP-1201` | player apply failed |
| `YP-1202` | position storage failed |
| `YP-1301` | layout render failed |

Verbose traces: `localStorage.setItem('yp_debug', '1')`.

## Artifacts

`youtube-plus.user.js` and `youtube-plus.meta.js` are generated by
`npm run build` (`vite build` → `dist/`, then copied to the repository root)
and committed. `npm run verify:artifacts` proves the root files match `dist/`.

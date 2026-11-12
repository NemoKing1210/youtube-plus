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
│   ├── interface/           # rules.js, css.js, engine.js, derived settings
│   ├── player/              # engine, speed, quality, positions, resume, pip, hotkeys
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
```

`settings.js` derives the fields and the tab from the rule list; `css.js`
builds one stylesheet for the enabled rules. Hovering a rule's switch (the
renderer emits `interface:preview`) excludes that rule from the sheet and
outlines its selectors instead. Rules without a CSS selector can supply
`find(root)`; matches are marked `data-yp-hide~="<id>"` and hidden by the same
stylesheet.

## Player feature

State is keyed by video id (`getVideoData().video_id`, fallback to the URL's
`v` parameter). Per video, exactly once: apply speed, apply quality, restore
position. Quality is applied once, verified after 2 s and retried at most
once. A manual speed change is never overwritten; changing the speed setting
re-applies it deliberately.

`timeupdate` saves the position at most every 5 s; entries expire after 90
days and are capped at 500. The PiP button mirrors the browser's
`enterpictureinpicture` / `leavepictureinpicture` events. Disabling the
feature removes the button, unbinds hotkeys and restores `playbackRate = 1`.

## Verified selectors and platform facts

Checked against live `www.youtube.com` when this version was written:

| Fact | Selector / API |
|---|---|
| App root | `ytd-app`, `#page-manager` |
| Guide row | `ytd-guide-entry-renderer` with `a[title]` and `a#endpoint[href]` |
| Theme | `document.documentElement[dark]` |
| Shorts shelf | `grid-shelf-view-model:has(ytm-shorts-lockup-view-model)` |
| Watch page | `ytd-watch-metadata`, `#secondary-inner #related`, `yt-lockup-view-model` |
| Comments | `ytd-comments#comments` |
| Player | `#movie_player`, `getVideoData`, `getPlaybackQuality`, `setPlaybackQualityRange`, `seekTo`, `setPlaybackRate`, `getDuration` |
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

Verbose traces: `localStorage.setItem('yp_debug', '1')`.

## Artifacts

`youtube-plus.user.js` and `youtube-plus.meta.js` are generated by
`npm run build` (`vite build` → `dist/`, then copied to the repository root)
and committed. `npm run verify:artifacts` proves the root files match `dist/`.

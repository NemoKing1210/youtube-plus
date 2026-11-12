# YouTube Plus

A userscript for [YouTube](https://www.youtube.com) that removes clutter from
the interface and adds a few player improvements — configured from one
settings dialog that follows YouTube's light and dark themes.

> Not affiliated with YouTube or Google.

## Install

1. Install a userscript manager — [Tampermonkey](https://www.tampermonkey.net/),
   [Violentmonkey](https://violentmonkey.github.io/) or [ScriptCat](https://scriptcat.org/).
2. Install from the raw URL (the script updates itself from `main`):

```
https://raw.githubusercontent.com/NemoKing1210/youtube-plus/main/youtube-plus.user.js
```

| Manager | Path |
|---------|------|
| Tampermonkey | Dashboard → **Utilities** → **Install from URL** |
| Violentmonkey | Dashboard → **+** → **Install from URL** |
| ScriptCat | **Install from URL** with the raw URL |
| Manual | Open `youtube-plus.user.js`, copy it, create a new script and paste |

Open the settings from the **YouTube Plus** row in YouTube's left guide, from
the userscript manager's menu command, or with `Ctrl+M`.

## Features

### Interface clean-up

One switch per rule, applied instantly and reversibly. The rules are grouped
by the page they affect:

- **Guide**: Shorts, Premium / Music / Kids / Storefront, Home,
  Subscriptions, History, Playlists, Watch Later, Liked videos, Downloads,
  Explore (including Trending, Music and Shopping), the "More from YouTube"
  section and the footer.
- **Home**: Shorts shelves and Shorts cards (on by default; this rule is
  global, so it also hides Shorts results in Search), posts, live, upcoming,
  watched videos, mixes and the filter chips.
- **Subscriptions**: the "Most relevant" shelf (experimental), watched
  videos, live, upcoming and mixes.
- **Search**: shelves, watched videos, live and upcoming results.
- **Watch**: related videos, comments, live chat, merch and products, the
  playlist panel, description, actions and transcript.
- **Channel**: the Shorts tab (experimental), posts, the trailer and live or
  upcoming items.
- **Player**: end-screen suggestions, info cards and the pause overlay.

Hover a switch to preview its effect: the rule is lifted and its targets are
outlined on the page behind the dialog.

### Layout

- **Columns per page** for Home, Subscriptions and Channel: `auto`, or a fixed
  3–8 columns. `auto` picks 2–8 columns from the available width and follows
  window resizes.
- **Target card width** for `auto` mode (220–480 px, default 320 px), the
  grid **gutter** (0–64 px) and the **item gap** (0–32 px).
- **Compact cards**: hide channel avatars, hide view/date metadata, or show
  video titles in full instead of truncating them.

### Player

- **Preferred quality** up to 4320p (8K), capped by what YouTube offers;
  applied once, verified once, retried at most once
- **Volume**: an optional target volume. With **Remember volume** on, the last
  volume you set by hand is restored; until then (and always with memory off)
  the configured percentage applies
- **Loop** the current video
- **Default speed** (0.25×–2×) applied when a video starts
- **Remember position** (opt-in): resumes where you stopped, 10 s to 15 s
  before the end
- **Picture-in-picture button** in the player controls
- **Hotkeys**: `Alt+P` toggles PiP, `[` and `]` change speed by 0.25

Speed is applied once per video: a speed you pick by hand is not overwritten
until the next video.

### Advanced custom selectors

Add your own CSS selectors in the Interface tab to hide extra elements. Each
entry becomes `selector { display: none !important }` in the generated
stylesheet. To keep a pasted selector from breaking out of that rule, input is
limited to 300 characters and 50 entries; selectors containing `{`, `}`, `;`,
`@`, a newline, a backslash or a CSS comment delimiter (`/*`, `*/`) are
rejected, as are empty and duplicate entries.

### Settings

- Search across every setting, including tabs you have not opened
- Backup tab: copy the settings JSON out, paste a backup in
- About tab: version, repository, licence
- English, Russian, Chinese, Spanish, Portuguese, German, French and Japanese

## Development

```bash
npm install
npm test             # node:test unit tests
npm run build        # production bundle → dist/ + copied to the repo root
npm run ci           # i18n check + build + artifact verification
```

Architecture and feature recipes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
Development loop and selector verification:
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## License

[MIT](LICENSE)

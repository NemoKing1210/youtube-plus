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

One switch per rule, applied instantly and reversibly:

- **Shorts shelves** in feeds and search results, and the **Shorts entry** in
  the left guide (on by default)
- **Premium / Music / Kids / Storefront** links in the guide
- **Related videos**, **comments**, **live chat**, **merch and products** on
  the watch page
- **End-screen suggestions** and **info cards** in the player

Hover a switch to preview its effect: the rule is lifted and its targets are
outlined on the page behind the dialog.

### Player

- **Default speed** (0.25×–2×) applied when a video starts
- **Preferred quality** — best-effort, capped by what YouTube offers; applied
  once, verified once, retried at most once
- **Remember position** (opt-in): resumes where you stopped, 10 s to 15 s
  before the end
- **Picture-in-picture button** in the player controls
- **Hotkeys**: `Alt+P` toggles PiP, `[` and `]` change speed by 0.25

Speed is applied once per video: a speed you pick by hand is not overwritten
until the next video.

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
npm run harness      # mock YouTube page at http://localhost:5179
```

Architecture and feature recipes: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
Development loop and selector verification:
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## License

[MIT](LICENSE)

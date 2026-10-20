# AGENTS.md — YouTube Plus

Instructions for AI coding agents working in this repository.

## Project

Userscript for [YouTube](https://www.youtube.com): declarative interface
clean-up, player essentials, one settings dialog. Built with Vite +
`vite-plugin-monkey` for Tampermonkey, Violentmonkey, ScriptCat and compatible
managers. The sibling `x-plus` project is the architectural reference.

- Source entry point: `src/main.js`
- Version source of truth: `package.json`
- Generated install artifacts (committed): `youtube-plus.user.js`,
  `youtube-plus.meta.js` — produced only by `npm run build`; never hand-edit
- Docs: `README.md`, `CHANGELOG.md` (Keep a Changelog + SemVer),
  `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`
- License: MIT

## Architecture in one paragraph

A small **core** (`src/core/`: schema, feature registry, settings, bus, scan,
theme, storage, http, debug) runs independent **features**
(`src/features/*`). A feature calls
`registerFeature({ id, fields, tabs, init, apply, scan, navigate })`; its
`fields` (declarative schema) define defaults, normalization and the settings
UI, `tabs` are rendered by the shared spec renderer. Details and recipes:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Conventions

- Vanilla ES modules, no frameworks, no TypeScript. GM APIs come from `$`
  (`vite-plugin-monkey/dist/client`).
- Prefix DOM / storage keys with `yp-` / `data-yp-` / `yp_`. Create UI through
  `el()` (it tags elements with `data-yp-ui`, which scans ignore).
- Settings live in the schema; never read or write `GM_getValue` directly —
  use `getFeatureSettings` / `updateFeatureSettings` / `saveSettings`.
- Features react to settings through `apply(cfg, prev)` and to the page
  through `scan(root)`; keep both **idempotent** (they run often).
- Every YouTube-specific selector lives in `src/core/constants.js` (`SEL`) or
  at the top of the module that needs it (see "Verifying selectors" in
  `docs/DEVELOPMENT.md`). YouTube migrates `ytd-*` to `yt-*-view-model`:
  prefer element names, `aria-label` and `title` over generated classes.
- Do not expand `@connect` / `@grant` beyond what is needed; metadata lives in
  `vite.config.js`, not in built files. Never commit localhost
  `@updateURL` / `@downloadURL`.
- Colors come from `src/styles/tokens.css` (`var(--yp-*)`); UI must work in
  YouTube's light and dark themes (`data-yp-theme`).
- Errors use stable codes from `core/debug.js` (`YP-####`); user-visible
  problems also get a toast.
- Do not cancel YouTube's events, patch its router, or imply affiliation with
  YouTube or Google.

## Localization

Locales: `en`, `ru`, `zh`, `es`, `pt`, `de`, `fr`, `ja` (plus `auto` = browser).
Keys are flat `namespace.key` strings. Add every new user-facing string to
**all** locale files; `npm run check:i18n` fails on a missing key and lists
unused ones. Keep localized `@name` / `@description` in `vite.config.js`
aligned with the product description.

## Releases

1. Bump `version` in `package.json` **once per release**, not per edit.
2. `npm test && npm run ci` (i18n + build + artifact verification).
3. Add / update the `CHANGELOG.md` entry — notable user-facing changes only.
4. Update `README.md` wherever the change is user-visible, and
   `docs/ARCHITECTURE.md` when structure changes.

## Commits

- Commit only when asked. Never add yourself as a co-author: no
  `Co-Authored-By` trailer and no "Generated with …" line in commit messages
  or PR descriptions.
- Follow Conventional Commits: `type(scope): subject`, where `type` is one of
  `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
  `chore`, `revert`; optional lowercase `scope` (e.g. `interface`, `player`,
  `settings`, `i18n`); imperative subject in lower case, no trailing period.
- Write the message from the actual diff. Rebuild (`npm run build`) before
  committing source changes so the committed artifacts match `src/`.

## Do not

- Hand-edit `youtube-plus.user.js` / `youtube-plus.meta.js`.
- Add a frontend framework or TypeScript unless explicitly requested.
- Bypass the schema (unvalidated settings) or create UI outside `el()`.
- Add a network feature without adding its grants and `@connect` entries in
  the same change.

## Local testing

```bash
npm install
npm run dev          # Vite serve — install the generated dev script (prefix "dev:")
npm test             # node:test unit tests
npm run build        # production bundle → dist/ + copied to the repo root
npm run ci           # check:i18n + build + verify artifacts
```

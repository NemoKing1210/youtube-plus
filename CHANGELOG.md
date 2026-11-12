# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-11-12

### Added
- Guide, home, subscriptions, search, watch and channel hiding rules.
- Layout feature: per-page grid columns, auto mode, gutters, compact cards.
- Custom hiding selectors with validation.
- Player quality up to 8K, volume memory and loop.
- Early document-start boot for flicker-free hiding.

### Changed
- Shorts guide matching now uses `href`, not the localized title.
- Settings schema supports string and list fields.

### Fixed
- Stale `find`-rule marks are removed when an item no longer matches.

## [0.1.0] - 2026-10-20

### Added

- Userscript scaffold with a declarative settings schema, a settings dialog
  with search, backup and about tabs, eight UI locales and committed install
  artifacts.
- Interface clean-up rules: Shorts shelves and the Shorts guide entry,
  Premium / Music / Kids / Storefront links, related videos, comments, live
  chat, merch and player end cards and info cards. Rules can be previewed on
  hover and are applied through one generated stylesheet.
- Player improvements: default speed, preferred quality, optional position
  restore, a picture-in-picture button and `Alt+P` / `[` / `]` hotkeys.
- Entry points: a YouTube Plus row in the left guide, a userscript-manager
  menu command and `Ctrl+M`.
- `node:test` unit tests for the pure modules.

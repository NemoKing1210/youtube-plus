# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Opt-in Shorts auto-scroll with a configurable delay and a duration limit.
- Opt-in dislike estimates from Return YouTube Dislike for watch pages and Shorts.
- Opt-in Comment Kit for searching loaded YouTube comments, transcripts and live chat, with timestamp navigation and local exports.
- Download settings as a JSON file and restore them from a local file in Backup.

### Fixed

- Keep dislike estimates inside the Watch rating button and near Like in Shorts.
- Hide the desktop Shorts guide entry when YouTube omits its link destination.
- Recognize watched videos with YouTube's newer thumbnail progress component.
- Keep settings tabs and footer actions visible while long sections scroll.
- Restore the label and click and keyboard activation of the YouTube Plus
  button in the expanded YouTube sidebar.

### Changed
- Notifications have themed cards with status icons and a close button, plus
  motion that follows the system preference. They can appear at the top or
  bottom center, with bottom center as the default.
- Redesigned settings to match YouTube's light and dark themes, with desktop
  side navigation, scrollable tabs on smaller screens, and larger controls.
- Added quick transitions for sections, search and reset confirmation, plus
  press feedback on tabs and switches. The effects follow the system
  reduced-motion preference.

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

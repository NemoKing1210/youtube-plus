# TODO

Task backlog for YouTube Plus. Every entry is a self-contained unit of work
with a verifiable outcome. How to pick up, plan and close a task is described
in [AGENTS.md](AGENTS.md#tasks).

## Conventions

- **IDs** are stable and sequential: `YP-T-001`, `YP-T-002`, … Never reuse or
  renumber an ID, even after a task is done.
- **Statuses:** `Backlog` → `Planned` → `In progress` → `Done`. `Blocked` may
  replace any active status and must name its blocker.
- **Priorities:** `P0` release blocker, `P1` next, `P2` normal, `P3` nice to
  have. Work tasks by priority, then by ID.
- **Areas** match feature ids and shared code: `core`, `general`, `interface`,
  `layout`, `player`, `shorts`, `dislikes`, `commentKit`, `settings`, `i18n`,
  `ui`, `build`, `docs`.
- One task per change. Keep unrelated refactors out and file them separately.
- Use ISO dates (`YYYY-MM-DD`).
- A task is complete only when every acceptance criterion is checked and
  `npm test && npm run ci` passes. Move it to `## Done` with its date.

## Status overview

| Status | Meaning |
|---|---|
| `Backlog` | Captured, not scheduled |
| `Planned` | Agreed, plan written, ready to start |
| `In progress` | Being worked on |
| `Blocked` | Cannot proceed; the blocker is named in the task |
| `Done` | Acceptance criteria met and verified |

## Task template

Copy this block into the appropriate section and fill every field.

### YP-T-000 — Short imperative title

- **Status:** Backlog
- **Priority:** P2
- **Area:** core
- **Depends on:** —
- **Created:** YYYY-MM-DD
- **Goal:** One or two sentences: the problem and the intended outcome.
- **Plan:** Where the plan lives (this entry or a linked document). Write it
  before implementation.
- **Acceptance criteria:**
  - [ ] Observable behaviour stated as a testable result
  - [ ] Unit tests added or updated where the change is pure logic
  - [ ] User-facing strings added to all locales (if any)
  - [ ] `npm test && npm run ci` passes
- **Verification:** Exact commands and any harness or live-YouTube steps.
- **Notes:** Constraints, links, decisions, blockers.

## Next up

_None._

## In progress

— None —

## Blocked

### YP-T-005 — Cover Shorts auto-scroll with tests, harness and docs

- **Status:** Blocked
- **Priority:** P3
- **Area:** docs
- **Depends on:** YP-T-003, YP-T-004
- **Created:** 2026-11-22
- **Goal:** Lock the behavior with tests and make it discoverable and
  maintainable: harness coverage, a manual checklist, architecture notes and
  user-facing documentation.
- **Plan:**
  1. `tests/shorts.test.js`: cover `isShortsPath`, `shouldSkip`, the one-shot
     advance guard and schema defaults/clamping.
     `tests/settings-tabs.test.js` includes `shortsTab()`; add a migration
     case proving an old settings blob gains the `shorts` defaults.
  2. Extend the local (git-ignored) `dev/harness` with a `?page=shorts`
     fixture: three reels of different durations, working next/previous
     controls and an `is-active` switch on navigation. Use it for the manual
     pass; do not commit `dev/`.
  3. `README.md`: add a **Shorts** subsection under Features describing the
     two behaviors, the delay and the limit, and that the feature is off by
     default.
  4. `CHANGELOG.md`: add one bullet under `[Unreleased] → Added`.
  5. `docs/ARCHITECTURE.md`: add `features/shorts/` to the tree, name the
     feature in the overview, add a "Shorts feature" section (selectors,
     lifecycle, teardown), the new `SEL` rows to "Verified selectors", and
     `YP-1401` to the error-code table.
  6. `docs/DEVELOPMENT.md`: add Shorts steps to the manual checklist (harness
     and live), including delay, limit, manual-scroll and disable cases.
  7. `AGENTS.md`: add `shorts` to the current-features sentence.
  8. Rebuild the committed artifacts with `npm run build`.
- **Acceptance criteria:**
  - [x] Unit tests cover the pure decisions and fail if the one-shot guard
        regresses.
  - [ ] The manual harness pass and the live-YouTube pass both succeed.
  - [x] README, CHANGELOG, ARCHITECTURE, DEVELOPMENT and AGENTS describe the
        feature and its selectors accurately.
  - [x] No unused locale keys; `npm test && npm run ci` passes.
  - [x] The rebuilt `youtube-plus.user.js` and `youtube-plus.meta.js` match
        `src/`.
- **Verification:** `npm test && npm run ci`; manual harness checklist; live
  pass with a manager; `localStorage.setItem('yp_debug', '1')` and a clean
  console.
- **Notes:** Do not bump `package.json` here; versioning happens in the
  release task. The harness lives in the git-ignored `dev/` directory, so
  only the checklist and docs are committed.
- **Blocker:** The built script passed live Shorts playback in isolated Chrome and passed the harness. The final live pass through a userscript manager with verbose logging remains.

### YP-T-006 — Add the `dislikes` feature, API client and opt-in settings

- **Status:** Blocked
- **Priority:** P2
- **Area:** dislikes
- **Depends on:** —
- **Created:** 2026-11-22
- **Goal:** Build the foundation for restored dislike counts: an opt-in
  `dislikes` feature that fetches a video's counts from the public Return
  YouTube Dislike API, caches them and contributes settings. No page rendering
  yet. The feature is off by default because enabling it sends the current
  video ID to a third party.
- **Plan:**
  1. `vite.config.js`: add `GM_xmlhttpRequest` to `grant` and
     `returnyoutubedislikeapi.com` to `connect` (the userscript's
     `@connect`). Do not widen anything else.
  2. `src/core/constants.js`: add the watch and Shorts selectors used by the
     later tasks (`watchLike`, `watchDislike`, `shortsRoot`,
     `shortsActionBar`). Prefer element names
     (`like-button-view-model`, `dislike-button-view-model`,
     `reel-action-bar-view-model`); verify them live and record the result.
     Reuse `shortsRoot`/`shortsActive` if YP-T-002 already added them. Keep
     the API base URL at the top of `api.js`, not in `SEL`.
  3. `src/features/dislikes/settings.js`: `dislikesFields()` with
     `enabled: field.bool(false)` (explicit opt-in), `showBar: field.bool(true)`,
     `showPercent: field.bool(true)`, `colorizeBar: field.bool(false)`,
     `tooltipMode: field.enum(['dashLike', 'dashDislike', 'both', 'onlyLike',
     'onlyDislike'], 'dashLike')`,
     `format: field.enum(['compactShort', 'compactLong', 'standard'],
     'compactShort')` and `reformatLikes: field.bool(false)`.
     Export `dislikesTab()` with a consent hint naming
     `returnyoutubedislikeapi.com`, an attribution row/button linking to
     `https://returnyoutubedislike.com`, and controls gated by `enabled`.
  4. `src/features/dislikes/api.js`: `fetchVotes(videoId, { signal } = {})`
     through `gmRequest` (`core/http.js`), never `fetch`. URL-encode the id,
     send anonymously (no cookies), time out after ~8 s, accept 404 as a
     negative result, and distinguish 400/404/429/5xx. Return
     `{ likes, dislikes, viewCount, deleted }` or `null`. Abort on navigation
     or when the active id changes.
  5. `src/features/dislikes/cache.js`: in-memory `Map` keyed by video id with
     a 24 h TTL and a 300-entry cap; short TTL for negative results; `get`,
     `set`, `prune`. Do not persist this cache in GM storage.
  6. `src/features/dislikes/format.js`: `formatCount(value, mode, locale)` via
     `Intl.NumberFormat` (`notation: 'compact'` for short/long, standard
     grouping otherwise); safe for `0`, `NaN`, negatives and missing values.
  7. `src/features/dislikes/index.js`: register `id: 'dislikes', order: 28`
     with the fields/tab; `apply` stores the config and cancels work when
     disabled; `navigate` invalidates the active id. No DOM changes yet.
     Import it in `src/main.js` between `layout` and `player`.
  8. `src/core/debug.js`: add `DISLIKES_API: 'YP-1501'` and
     `DISLIKES_RENDER: 'YP-1502'`; use `YP-1501` for fetch failures.
  9. Add every `dislikes.*` string (settings, consent, attribution, runtime
     titles for later tasks) to all eight locales.
  10. Tests: URL/ID encoding, response normalization, cache TTL/prune and
      `formatCount`; verify with a stubbed transport that a disabled feature
      makes no request.
- **Acceptance criteria:**
  - [x] A Dislikes tab appears between Layout and Player; the feature is off
        by default and enabling it requires an explicit Save.
  - [x] No network request is made while disabled; with the feature on, only
        the active video id is requested.
  - [x] A repeat view within the TTL makes no second request; 404, 429,
        network errors and timeouts resolve without uncaught errors and log
        `YP-1501` at most once per failure.
  - [x] `@grant GM_xmlhttpRequest` and
        `@connect returnyoutubedislikeapi.com` are present in the built
        metadata; no other grants or connect entries changed.
  - [x] `npm test && npm run ci` passes; `npm run check:i18n` passes.
- **Verification:** Build and install; watch a video and confirm in DevTools
  that exactly one request per uncached id goes to the API; disable the
  feature and confirm no requests. Run the unit tests.
- **Notes:** API rules require attribution and impose 100 requests/minute and
  10 000/day per client. Request only the active video, cache aggressively
  and back off on 429. The reference extension is GPLv3 and this project is
  MIT: implement the behavior independently and do not copy its source.
  Out of scope for this task group: RYD comments, Patreon/GitHub accounts,
  premium analytics, vote submission and synced account state. Scope:
  restored counts, ratio bar, number formats and the built-in color options.
- **Blocker:** The stubbed manager transport passed the browser scenarios and a direct anonymous request returned live votes. The actual userscript-manager request on YouTube remains to be verified.

### YP-T-010 — Cover restored dislikes with tests, docs and attribution

- **Status:** Blocked
- **Priority:** P3
- **Area:** docs
- **Depends on:** YP-T-007, YP-T-008, YP-T-009
- **Created:** 2026-11-22
- **Goal:** Lock the feature with tests and make its network use, estimates
  and attribution explicit for users, contributors and future agents.
- **Plan:**
  1. Extend `tests/dislikes.test.js` (or add focused files) to cover the API
     URL/normalization, cache TTL/prune, formatting, ratio math, stale-result
     guards and the settings tab; include `dislikesTab()` in
     `tests/settings-tabs.test.js` and an old-blob defaults case in
     `tests/migration.test.js`.
  2. `README.md`: add a **Restored dislike counts** subsection under
     Features with the opt-in behavior, the third-party API disclosure, the
     attribution link to returnyoutubedislike.com and the estimates caveat.
  3. `CHANGELOG.md`: add one bullet under `[Unreleased] → Added`.
  4. `docs/ARCHITECTURE.md`: add `features/dislikes/` to the tree, the
     feature to the overview, a "Dislikes feature" section (API, cache,
     rate-limit backoff, selectors, rendering/cleanup), the new selectors to
     "Verified selectors" and `YP-1501` / `YP-1502` to the error-code table.
  5. `docs/DEVELOPMENT.md`: add a manual checklist for watch and Shorts,
     including disable, offline, 404, 429, navigation, theme and no-data
     cases; mention the mock/harness constraints.
  6. `AGENTS.md`: add `dislikes` to the current-features sentence and note
     the only third-party endpoint (`returnyoutubedislikeapi.com`) so future
     network changes are reviewed together with its grants/connect.
  7. `SECURITY.md`: document the opt-in request and its data (video ID only,
     anonymous), so the network scope matches the policy.
  8. Rebuild the committed artifacts with `npm run build`.
- **Acceptance criteria:**
  - [x] Unit tests cover the pure logic and fail on stale-result, ratio or
        formatting regressions.
  - [ ] The manual watch and Shorts passes succeed, including offline and
        rate-limited behavior.
  - [x] README, CHANGELOG, ARCHITECTURE, DEVELOPMENT, AGENTS and SECURITY
        describe the feature and the single external endpoint accurately.
  - [x] `npm run check:i18n` reports no missing or unused keys;
        `npm test && npm run ci` passes.
  - [x] The rebuilt `youtube-plus.user.js` and `youtube-plus.meta.js` match
        `src/`.
- **Verification:** `npm test && npm run ci`; the full manual checklist;
  `localStorage.setItem('yp_debug', '1')` with a clean console; inspect the
  built userscript header for `@grant` and `@connect`.
- **Notes:** Do not bump `package.json` here; versioning happens in the
  release task. Do not commit mock API fixtures containing real user data.
- **Blocker:** Watch and Shorts passed with a stubbed transport, including 404, 429 and offline cases. The manager-to-service pass on live YouTube remains.

### YP-T-015 — Transcript browser with search and timestamp navigation

- **Status:** Blocked
- **Priority:** P3
- **Area:** commentKit
- **Depends on:** YP-T-013
- **Created:** 2026-11-22
- **Goal:** Show the active YouTube transcript in the panel with search,
  timestamps and seek links, using only what YouTube already renders.
- **Plan:**
  1. Add selectors to `SEL` after live verification:
     `ytd-transcript-renderer`, `ytd-transcript-segment-renderer` and the
     timestamp/text nodes inside a segment. Scope to the active page.
  2. If no transcript is rendered, show an "Open transcript" button that
     activates YouTube's native "Show transcript" control (user-initiated).
     Do not fetch caption endpoints and do not open the transcript panel
     automatically.
  3. Normalize segments to `{start, text, order}`; keep an in-memory cache per
     video and language; re-read when the transcript language changes. Use
     the language currently selected in YouTube's own selector.
  4. Panel tab: search box using the shared filter/highlight helpers, segment
     list, click-to-seek, copy-full-transcript and empty/unavailable states.
  5. No network, no translation API and no new grants.
  6. Tests: segment parsing, timestamp conversion, search/highlight and cache
     invalidation on video/language changes.
- **Acceptance criteria:**
  - [ ] An open transcript appears in the panel; search filters segments;
        clicking a segment seeks; changing language refreshes the list.
  - [x] A missing transcript shows a clear action, never an error loop.
  - [x] No network or new grants; navigation/disable cleans up; tests pass.
- **Verification:** Live video with captions in two languages; harness
  fixture; both themes; keyboard-only pass.
- **Edge cases:** auto-generated captions, empty segments, duplicated lines,
  transcript opened after navigation, language switch while searching.
- **Blocker:** The native transcript button and fixture data passed. YouTube did not return live segments in the sampled session, so the two-language refresh still needs an available transcript.

### YP-T-016 — Live chat capture, search and badges

- **Status:** Blocked
- **Priority:** P3
- **Area:** commentKit
- **Depends on:** YP-T-013
- **Created:** 2026-11-22
- **Goal:** Capture visible live chat locally, search it and show roles and
  Super Chats without modifying YouTube's chat.
- **Plan:**
  1. Add selectors after live verification: `yt-live-chat-app`,
     `yt-live-chat-item-list-renderer`,
     `yt-live-chat-text-message-renderer`,
     `yt-live-chat-paid-message-renderer` and the author badge renderer.
  2. Use a dedicated MutationObserver on the chat item list because the
     shared 350 ms scan loses fast messages; batch additions and document the
     exception in the module and architecture notes. Keep a bounded ring
     buffer (2000 messages), support pause/resume/clear and disconnect on
     navigation/disable.
  3. Normalize author, text, timestamp, id, badges (owner, moderator, member,
     verified) and the Super Chat amount; ignore deleted/system events unless
     they carry useful text.
  4. Panel tab: search/filter by text, author, badge and minimum amount;
     auto-follow with pause when the user scrolls; show an unread indicator.
  5. Read-only: never send chat, click chat actions or modify YouTube's chat.
     The chat must be visible/loaded; if the Interface feature hides it, show
     an explanation.
  6. Tests: normalization, badge classification, ring buffer, dedupe and
     search.
- **Acceptance criteria:**
  - [ ] Messages arrive in order, are capped and deduped; search/filter
        works; badges and Super Chat amounts render.
  - [x] Pause/resume/clear work; leaving/disable disconnects the observer and
        releases memory.
  - [x] No network and no chat side effects; performance stays stable at high
        message rates; tests pass.
- **Verification:** Live stream/premiere plus a harness fixture; fast chat,
  theme, disable and navigation.
- **Edge cases:** membership events, deleted messages, emoji-only messages,
  duplicate mutations, chat replay, very long messages.
- **Blocker:** The browser harness passed a 2,000-message capture and an appended burst. Live chat markup was confirmed in a signed-in tab. The isolated verification profile did not load a usable chat, so the live burst and real Super Chat checks remain.

### YP-T-017 — Export comments, live chat and transcripts

- **Status:** Blocked
- **Priority:** P3
- **Area:** commentKit
- **Depends on:** YP-T-013, YP-T-015, YP-T-016
- **Created:** 2026-11-22
- **Goal:** Download normalized data locally in useful formats without a
  server or extension APIs.
- **Plan:**
  1. `export.js`: `toCSV` with RFC 4180 quoting, UTF-8 BOM and stable column
     order; `toJSON`; `toTXT`; filename sanitizer with video id and date;
     Blob + object URL download, revoked after use.
  2. Wire export for the current filtered set and for all comments: author,
     text, likes, published time, permalink, reply count. Live chat adds
     badges/amount; transcripts use start/text.
  3. XLSX: true OOXML needs a zip writer or a new dependency. Do not add one
     silently; ship CSV (Excel-compatible) now, document the gap in README
     and leave `.xlsx` to a separate dependency decision.
  4. No network and no extension APIs; all data stays local.
  5. Tests: CSV escaping (quotes, commas, newlines, non-Latin text), BOM,
     filename sanitization, empty sets and JSON shape.
- **Acceptance criteria:**
  - [x] CSV/JSON/TXT exports open correctly; the filtered export matches the
        panel; filenames are safe and unique.
  - [x] Empty data shows a clear message instead of an empty file.
  - [x] No network or new permissions; the XLSX limitation is documented.
  - [x] `npm test && npm run ci` passes.
- **Verification:** Export from harness/live; open CSV in LibreOffice and
  Excel; check UTF-8, long text and a large set.
- **Notes:** True `.xlsx` remains out of scope until a dependency is approved.
- **Blocker:** The browser downloaded CSV, JSON and TXT. Excel imported a Unicode CSV with UTF-8 and the comma delimiter. LibreOffice is unavailable in this environment, so the LibreOffice import remains.

### YP-T-018 — Cover Comment Kit with tests, docs, performance and a11y

- **Status:** Blocked
- **Priority:** P3
- **Area:** docs
- **Depends on:** YP-T-011, YP-T-012, YP-T-013, YP-T-014, YP-T-015, YP-T-016,
  YP-T-017
- **Created:** 2026-11-22
- **Goal:** Lock the feature with tests and documentation, and verify
  performance and accessibility before release.
- **Plan:**
  1. Tests: settings tab/migration, extraction/normalization, search/sort,
     timestamps, transcript, chat and export. Extend the git-ignored harness
     with comment, transcript and live-chat fixtures for the manual pass.
  2. `README.md`: add a **Comment Kit** section with the local-only statement,
     the source tabs and the known limitations. `CHANGELOG.md`: one bullet
     under `[Unreleased] → Added`.
  3. `docs/ARCHITECTURE.md`: add `features/commentKit/` to the tree, the
     feature to the overview, a "Comment Kit" section (extraction, cache,
     panel, timed comments, transcripts, live chat, export), the new
     selectors and `YP-1601`–`YP-1603`.
  4. `docs/DEVELOPMENT.md`: add the manual checklist for watch, channel,
     transcript, live chat, exports and the cache, at 360 px and in both
     themes.
  5. `AGENTS.md`: add `commentKit` to the current-features sentence. Note
     that this feature is read-only and adds no grants or hosts.
  6. Performance: measure 1000 comments and 2000 chat messages; keep
     pagination, debounce, `DocumentFragment`, passive listeners and the
     bounded buffer. No `innerHTML`.
  7. Accessibility: labels, focus order, keyboard operation, `aria-live`,
     contrast, reduced motion.
  8. Rebuild the committed artifacts with `npm run build`.
- **Acceptance criteria:**
  - [x] Unit tests cover the pure logic and fail on extraction, search,
        timestamp, chat or export regressions.
  - [ ] The manual harness and live passes succeed, including long threads
        and fast chat.
  - [x] README, CHANGELOG, ARCHITECTURE, DEVELOPMENT and AGENTS describe the
        feature and its limitations accurately.
  - [x] No new `@grant`, `@connect` or `@match` entries; no unused locale
        keys; `npm test && npm run ci` passes.
  - [x] The rebuilt artifacts match `src/`.
- **Verification:** `npm test && npm run ci`; the full manual checklist;
  `localStorage.setItem('yp_debug', '1')` with a clean console; inspect the
  built header for unchanged grants and hosts.
- **Notes:** Do not bump `package.json` here. Out of scope: My Activity
  history, screenshots, AI sentiment, automated authoring actions and true
  `.xlsx`; each needs a separate decision.
- **Blocker:** The 1,000-comment and 2,000-message harness runs passed, including keyboard navigation and the 360 px layout. The two-language live transcript, live chat burst and LibreOffice import remain open under YP-T-015, YP-T-016 and YP-T-017.

## Backlog

_None._

## Done

### YP-T-024 — Fit dislike estimates into Watch and Shorts ratings

- **Status:** Done
- **Priority:** P2
- **Area:** dislikes
- **Depends on:** YP-T-007, YP-T-008, YP-T-009
- **Created:** 2026-11-27
- **Completed:** 2026-11-27
- **Goal:** Keep Watch estimates within the native rating button and place
  the Shorts estimate alongside the ratings, above the remaining actions.
- **Plan:**
  1. Extend `tests/dislikes.test.js` with cases for Shorts action bars with a
     native dislike control, with only a Like control, and with neither.
  2. In `shorts.js` and `render.js`, show a vertical label below the
     native dislike button or an icon and count below Like. Fall back to
     the top of the action bar while its controls load. Use the existing
     localized estimate for the accessible label and tooltip.
  3. In `dislikes.css`, let the native Watch icon button grow with its count
     and fit the ratio bar into the space below the controls.
  4. Update `README.md`, `docs/ARCHITECTURE.md` and `CHANGELOG.md`. Run
     `npm test` and `npm run ci` to rebuild and verify the install files.
- **Acceptance criteria:**
  - [x] A long Watch count fits inside its native button, and the ratio bar
        stays visible below the group.
  - [x] The active Short shows one aligned estimate in the ratings area,
        using the native control when present.
  - [x] `npm test` and `npm run ci` pass.
- **Verification:** Reproduce placement with unit fixtures and inspect the
  built userscript in a browser with long and compact counts.
- **Risks and rollback:** YouTube can rebuild its action bar during playback.
  Reuse the existing rescan and cleanup paths. Revert this task's display
  changes and rebuild to roll back. Vote transport and settings are out of scope.
- **Result:** On live YouTube, test votes displayed a 1,234,567 Watch count
  with 16px of end padding and a fully visible ratio bar. The Russian Shorts
  count was centered below Like and moved to a fixture native dislike control
  without duplication. All 157 tests and CI passed.

### YP-T-023 — Add toast positions and refresh notification cards

- **Status:** Done
- **Completed:** 2026-11-27
- **Priority:** P2
- **Area:** general, ui, i18n
- **Depends on:** —
- **Created:** 2026-11-27
- **Goal:** Extend the four corner positions with top and bottom center. Use bottom center by default and make status, title, message and dismissal clear at a glance.
- **Plan:**
  1. Test settings normalization and the position control in `tests/migration.test.js`. Share the position values and default through `src/core/constants.js`, use them in General, the toast fallback and the localization check, and label both positions in all locales.
  2. Update `src/ui/toast.js`, `src/styles/settings.css` and `src/styles/tokens.css` with status icons, themed cards, a keyboard-accessible close button and directional motion. Keep existing callers and timing options, including duration zero. Pause timed notifications on hover and keyboard focus and make dismissal safe to repeat.
  3. Update `README.md` and `CHANGELOG.md`. Run the focused tests, validate the rendered cards at desktop and mobile widths in both themes, then run `npm test` and `npm run ci` to rebuild and verify the install artifacts.
- **Acceptance criteria:**
  - [x] Both center positions are available in all locales, with bottom center as the fallback and existing saved positions preserved.
  - [x] Notifications have distinct status, title and message, close manually and respect reduced motion.
  - [x] Docs and install artifacts match the source, and `npm test` and `npm run ci` pass.
- **Verification:** `node --test tests/migration.test.js`, `npm test`, `npm run ci`, and local Edge harness at 1100 px dark and 320 px light. Checked both centered positions, keyboard dismissal, focus pause, timed dismissal and reduced motion.
- **Notes:** Keep scope to the existing toast API and General settings. Roll back this task's source and documentation edits and rebuild the artifacts if necessary. Watch for clipped cards on narrow screens and timed dismissal while the close button has focus.

### YP-T-022 — Repair the settings button in the YouTube guide

- **Status:** Done
- **Completed:** 2026-11-27
- **Priority:** P1
- **Area:** settings
- **Depends on:** YP-T-019
- **Created:** 2026-11-27
- **Goal:** Restore a readable, clickable settings row in the expanded YouTube guide.
- **Plan:** Reproduce the cloned-row failure with a native-style guide fixture. Replace the clone in `settings/nav-button.js` with an owned native button and style it in `styles/settings.css`. Retain the setting and shortcut hint. A sanitized clone would still depend on YouTube renderer hydration and internal layout. Update the user docs, then rebuild through CI.
- **Acceptance criteria:**
  - [x] The row presents a gear and readable label in both themes.
  - [x] Mouse, Enter and Space open settings without navigation. The row survives guide replacement and respects its enable and hint settings.
  - [x] The browser regression check, `npm test` and `npm run ci` pass.
- **Verification:** Chromium fixture with an icon-only guide template and replaced guide list, repeated scans, both themes, native mouse and keyboard activation, and disabled settings.
- **Notes:** The expanded guide is the existing entry point. Roll back the button and its CSS together, then rebuild.
- **Result:** Reproduced the hidden label and failed click on YouTube. The final build passed both themes, mouse and keyboard activation, focus return and guide rebuild in the Chromium fixture. On live YouTube the final build displayed the label and opened through its click handler. The consent overlay in the isolated profile intercepted physical pointer input. All 155 tests and CI passed.

### YP-T-021 — Import and export settings backups as files

- **Status:** Done
- **Completed:** 2026-11-27
- **Priority:** P2
- **Area:** settings
- **Depends on:** YP-T-019
- **Created:** 2026-11-27
- **Goal:** Make it possible to download settings as JSON and restore them from a local file directly in Backup.
- **Plan:**
  1. Exercise both actions in a Chromium fixture using the built script. Check file download, restore, invalid JSON and a pending read when the dialog closes.
  2. Add file actions in `settings/tabs/backup.js` alongside copy and paste. Use the existing settings serializer and importer for both formats. Use the browser's file picker and Blob download; a separate backup schema or browser-manager permission would duplicate the current workflow.
  3. Share the local download mechanism with Comment Kit and wrap the two buttons in each backup card at narrow widths. Tie asynchronous imports to the current dialog and discard stale reads.
  4. Localize the new actions and errors in all eight locales, update README, the changelog and the manual checklist, then run the full tests and artifact build.
- **Acceptance criteria:**
  - [x] Downloaded JSON contains the saved settings and can be reimported.
  - [x] File and text imports share validation. A canceled selection, unreadable or invalid file, or stale read leaves settings intact.
  - [x] File actions are usable at narrow widths and translations and CI pass.
- **Verification:** Run `npm test && npm run ci` and exercise JSON download and restore plus failure cases in Chromium.
- **Notes:** Imports apply immediately, as in the existing text workflow. The file stays local. Roll back the UI, download utility and locale changes together, then rebuild the artifacts.
- **Result:** Chromium downloaded the saved JSON and restored it through the picker. Text import, read and parse errors, canceled selection, dialog close during a pending read, and 320 px layout passed. All 155 tests and CI passed.

### YP-T-020 — Animate settings navigation and controls

- **Status:** Done
- **Completed:** 2026-11-27
- **Priority:** P2
- **Area:** settings
- **Depends on:** YP-T-019
- **Created:** 2026-11-27
- **Goal:** Add quick visual feedback when changing sections, searching and pressing controls.
- **Plan:**
  1. Add regression coverage in `tests/settings-css.test.js` and `tests/reveal.test.js` for motion preferences and conditional rows that keep their visibility.
  2. Use opacity and short transforms in `src/styles/settings.css` for pane, search and confirmation entrances. Give tabs and switches press feedback. Use CSS transitions in place of timed or overlapping panes.
  3. In `src/features/settings/reveal.js`, retain the in-flight animation when the requested visibility repeats. Update README, changelog and the development checklist.
  4. Verify both motion preferences in Chromium and rebuild with CI.
- **Acceptance criteria:**
  - [x] Settings panes, search results and confirmation have short entrances and pressed controls respond visually.
  - [x] Rapid tab changes preserve a single visible pane and existing scroll geometry. Unchanged conditional controls do not restart their animations.
  - [x] Reduced motion skips the new effects and all checks pass.
- **Verification:** Run `npm test && npm run ci` and exercise switching tabs, searching and opening reset confirmation in Chromium with normal and reduced motion.
- **Notes:** Settings data and save semantics are outside the scope. Revert the settings CSS and visibility change, then rebuild, to roll back.
- **Result:** Chromium passed at desktop and compact widths with both motion preferences. Rapid tab changes kept a single pane visible and its scroll geometry stable. All 155 tests and CI passed.

### YP-T-019 — Rework the settings dialog layout

- **Status:** Done
- **Completed:** 2026-11-27
- **Priority:** P1
- **Area:** settings
- **Depends on:** —
- **Created:** 2026-11-27
- **Goal:** Keep long sections, navigation and footer actions visible in their own regions and make the settings feel at home on YouTube.
- **Plan:**
  1. Reproduce clipped tabs in the built harness. Check short windows, narrow screens and long localized labels.
  2. Rework `src/styles/settings.css` and `src/features/settings/panel.js` around a desktop navigation rail, compact scrolling tabs and an independent content pane. A tab-strip-only patch would leave the requested redesign unfinished.
  3. Refine rows, sections and controls in the stylesheet, renderer and control builders. Verify search announcements, confirmation and focus after backup import. Retain settings schemas, persisted data, feature order and entry points.
  4. Add a regression check in `tests/settings-css.test.js` and verify layout and keyboard behavior in Chromium. Update README, architecture, development checklist and changelog, then rebuild through CI.
- **Acceptance criteria:**
  - [x] Tabs, content and actions have distinct space in both themes on desktop and compact screens.
  - [x] Navigation, search, keyboard focus and draft actions work through the normal settings entry point.
  - [x] `npm test && npm run ci` passes and the install artifacts match the source.
- **Verification:** Run `npm test`, `npm run ci` and the browser harness at desktop, phone and short-landscape sizes. Exercise search, long sections and conditional controls.
- **Notes:** No schema migration or new permissions. Rollback consists of reverting the settings UI changes and regenerating the artifacts from the reverted source.
- **Result:** Reproduced clipped tabs before the change. The built script passed the local Chromium checks at 1280×900, 876×480, 360×740, 640×300 and 320×420 in light and dark themes, including search, save, cancel, reset, backup import and resizing from the desktop rail to the compact tab list.

### YP-T-001 — Verify selectors against live YouTube

- **Status:** Done
- **Priority:** P1
- **Area:** interface
- **Depends on:** —
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** `docs/ARCHITECTURE.md` states that selectors were confirmed
  against the source and local harness only. Perform the live-browser pass and
  fix any stale selector before the next release.
- **Plan:**
  1. Audit `src/core/constants.js` and the interface rules, finders and
     localized titles on live home, subscriptions, search, watch and channel
     pages. Count matches and inspect the markup for missing targets.
  2. For each confirmed stale selector, update its rule or finder and extend
     the focused interface test. Preserve legacy variants that may still
     appear in other YouTube layouts.
  3. Exercise the built script in the local harness and on live YouTube.
     Record observed variants and unverified cases in `docs/ARCHITECTURE.md`.
  4. Run `npm test && npm run ci`. Roll back by reverting the affected tests,
     selector and documentation changes, then rebuilding. New features are
     outside the scope of this audit.
- **Acceptance criteria:**
  - [x] Every selector in `SEL`, `rules.js`, `finders.js` and `titles.js` is
        checked in the console of live `www.youtube.com` following
        `docs/DEVELOPMENT.md`
  - [x] Renamed or missing selectors are fixed and covered by the existing
        tests where possible
  - [x] The verified-selectors table in `docs/ARCHITECTURE.md` reflects the
        result and the "no live pass" caveat is removed
  - [x] `npm test && npm run ci` passes
- **Verification:** Manual pass with the built script on live YouTube, the
  harness regression pass (`node dev/harness/serve.mjs`), then
  `npm test && npm run ci`.
- **Notes:** Needs a userscript manager and a live browser; cannot run in CI.
- **Result:** Live DOM was queried on six page types on 2026-11-26 and 2026-11-27. The desktop guide and thumbnail progress fallbacks passed the regression suite and harness.

### YP-T-002 — Add the `shorts` feature scaffold, settings and locales

- **Status:** Done
- **Priority:** P2
- **Area:** shorts
- **Depends on:** —
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** Ship auto-scroll as an independent `shorts` feature. This task
  creates the feature, its settings schema and its tab; the behavior is added
  by YP-T-003 and YP-T-004. The feature is opt-in (`enabled: false`), so
  updating the script never changes playback for existing users.
- **Plan:**
  1. `src/core/constants.js`: add the Shorts selectors to `SEL` after
     confirming them on live YouTube (`docs/DEVELOPMENT.md`): `ytd-shorts`,
     the active `ytd-reel-video-renderer`, the active video and
     `#navigation-button-down button`. Keep one-off fallbacks at the top of
     the engine module.
  2. `src/features/shorts/settings.js`: export `shortsFields()` with
     `enabled: field.bool(false)`, `autoScroll: field.bool(true)`,
     `scrollDelay: field.int(1, { min: 0, max: 10 })` (seconds),
     `skipLong: field.bool(true)` and `maxDuration: field.int(60, { min: 5,
     max: 600 })` (seconds). Export `shortsTab()` with two cards: "Auto-scroll"
     (master switch, `autoScroll`, `scrollDelay`) and "Long videos"
     (`skipLong`, `maxDuration`). Gate dependent controls with `showIf` on
     `enabled` and the matching behavior switch.
  3. `src/features/shorts/index.js`: `registerFeature({ id: 'shorts',
     order: 35, fields: shortsFields(), tabs: [shortsTab()] })` with empty
     `init` / `apply` / `scan` / `navigate` hooks wired to the engine in the
     next tasks. Do not add behavior here.
  4. `src/main.js`: import `./features/shorts/index.js` between `player` and
     `settings`.
  5. Add every `shorts.*` key to all eight locale files (`en`, `ru`, `zh`,
     `es`, `pt`, `de`, `fr`, `ja`).
  6. Add tests: defaults and clamping in `tests/shorts.test.js`, and include
     `shortsTab()` in the tab/icon/key checks in `tests/settings-tabs.test.js`.
- **Acceptance criteria:**
  - [x] The settings dialog shows a Shorts tab after Player; every control
        edits the draft and persists on Save.
  - [x] Defaults are exactly `enabled: false`, `autoScroll: true`,
        `scrollDelay: 1`, `skipLong: true`, `maxDuration: 60`; values
        normalize to their ranges.
  - [x] With the feature off, nothing about playback changes.
  - [x] Every new string exists in all eight locales; `npm run check:i18n`
        passes.
  - [x] `npm test && npm run ci` passes.
- **Verification:** `npm test && npm run ci`; open the dialog, change every
  value, save and reload. Confirm the Shorts tab and hints in light and dark
  themes.
- **Notes:** Parity target: [Youtube Shorts AutoScroll][shorts-ext] v1.2.8
  (checked 2026-11-22) — auto-advance on video end, skip long videos,
  configurable delay, independent on/off toggles, everything local. This
  project implements the same behavior in the shared settings dialog; no
  toolbar icon, network requests or new `@grant` are needed.
- **Result:** Settings saved and restored in the browser harness in dark and light themes.

### YP-T-003 — Auto-advance when a Short ends

- **Status:** Done
- **Priority:** P2
- **Area:** shorts
- **Depends on:** YP-T-002
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** On `/shorts/...`, advance to the next Short once the active video
  ends, after `scrollDelay` seconds, when `shorts.enabled && autoScroll`. Use
  YouTube's own next control instead of patching the router.
- **Plan:**
  1. Create `src/features/shorts/engine.js`. Keep module state: current
     config, active reel element, bound `<video>`, one pending timer, and the
     item the timer was armed for. Add `isShortsPath(pathname)` and use it as
     the only page guard (accept `/shorts` and `/shorts/<id>`).
  2. `bindActive()`: find the active `ytd-reel-video-renderer` and its
     `<video>`; bind once per element (`ended`, `timeupdate`,
     `loadedmetadata`, `durationchange`). Re-resolve on every `scan` and
     `navigate`; reset per-item state when the active element or video
     changes. Do not add a second MutationObserver — the shared scan is
     enough.
  3. Arm a single timer on `ended`. As a fallback for players that loop the
     element, treat `timeupdate` at `duration - 0.25` as the end. Never set
     `video.loop` yourself. Guard so one item advances at most once.
  4. `advance()`: re-check that the page, config, active item and video are
     still current, then click `#navigation-button-down button`. If the
     control is missing, find the next `ytd-reel-video-renderer` sibling and
     `scrollIntoView({ behavior: 'smooth', block: 'start' })`; if there is no
     next one, do nothing. Never patch history, cancel events or change
     playback state.
  5. Cancel the pending timer on feature/behavior disabled, manual
     scroll or keyboard navigation (`wheel`, `touchmove`, ArrowUp/Down,
     PageUp/Down, Home/End), SPA URL change and active-item change. Re-arm
     only from the next item's own lifecycle.
  6. Wire `apply(cfg, prev)`, `scan()` and `navigate()` in `shorts/index.js` to
     `applyShortsSettings`, `shortsScan` and `shortsNavigate`; wrap failures
     in `Codes.SHORTS_APPLY = 'YP-1401'` (`src/core/debug.js`) and keep the
     page usable. Teardown clears the timer and every listener; it must not
     pause, play, seek or loop the video.
  7. Extract and test the pure decisions: `isShortsPath` and a helper that
     says whether an end event may arm an advance for the current item.
- **Acceptance criteria:**
  - [x] With a 0 s delay, finishing a Short advances exactly once; with a
        2 s delay it advances after about 2 s.
  - [x] No advance when the page is not Shorts, the feature/master switch or
        `autoScroll` is off, or there is no next Short.
  - [x] A manual scroll or navigation before the timer fires cancels it; the
        next Short behaves normally.
  - [x] Navigating between Shorts rebinds without duplicate listeners;
        leaving Shorts or disabling the feature clears timers and listeners.
  - [x] Clicking the next control or scrolling is the only page change; no
        router patch, paused state or seek is introduced.
  - [x] `npm test && npm run ci` passes.
- **Verification:** Build and run on live `www.youtube.com/shorts/...` with
  delays 0, 2 and 10 s; check manual scroll, arrow keys, leaving the page and
  toggling the switch. Run with `localStorage.setItem('yp_debug', '1')` and
  confirm clean logs.
- **Edge cases:** Shorts can reuse the `<video>`; only the active reel may
  advance; `ended` and the `timeupdate` fallback must not double-advance;
  autoplay-blocked or paused videos must not trigger an advance; the last
  Short has no next control.
- **Result:** Real playback in isolated Chrome produced one native Next click after the Short looped. The harness covered the delay, navigation and teardown cases.

### YP-T-004 — Skip Shorts longer than the configured limit

- **Status:** Done
- **Priority:** P2
- **Area:** shorts
- **Depends on:** YP-T-003
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** When the active Short is longer than `maxDuration` seconds, move
  to the next one after `scrollDelay` instead of waiting for the end. Gated
  by `shorts.enabled && skipLong`.
- **Plan:**
  1. In `shorts/engine.js`, read duration from the active `<video>` when
     available, otherwise from the Shorts player (`getDuration?.()`). Evaluate
     on bind when metadata is already ready, and on `loadedmetadata` /
     `durationchange`.
  2. Add `shouldSkip(duration, maxDuration)` as a pure helper: true only for
     a finite duration greater than a positive limit. `Infinity`, `NaN`, `0`
     and a disabled switch return false, so live or unknown-duration items
     are never skipped.
  3. Route a skip through the same single-timer path as the end advance, so
     an end event and a skip can never race. Mark the current item as
     handled; repeated `durationchange` / `timeupdate` must not re-arm it.
  4. On timer fire, if the video is paused (autoplay blocked or a user
     pause), do not advance; wait for `play` and re-arm once. Manual
     scroll/navigation cancels the pending skip. Do not pause, seek or mute
     the video while waiting.
  5. React to settings: toggling `skipLong` off or raising `maxDuration`
     above the current duration cancels a pending skip; lowering it below
     the current duration arms one.
  6. Tests: `shouldSkip` boundaries (`5.1` vs `5`, `Infinity`, `NaN`, `0`,
     negative limit) and the one-shot guard.
- **Acceptance criteria:**
  - [x] A 90 s Short with a 60 s limit and a 2 s delay advances after about
        2 s; a 30 s Short is not skipped.
  - [x] Live/unknown durations (`Infinity`, `NaN`) and a paused/autoplay-
        blocked video are never skipped.
  - [x] Turning the switch off or raising the limit cancels the pending
        skip; manual scroll cancels it.
  - [x] A normal short video still advances on end via YP-T-003, with no
        double advance.
  - [x] No playback state is changed while waiting.
  - [x] `npm test && npm run ci` passes.
- **Verification:** Live YouTube with a known long Short (>60 s) and a
  normal Short; set the limit to 30 s and 120 s, delay 0 and 2 s, toggle the
  switch mid-wait, pause the video and scroll manually. Repeat with
  `yp_debug` on.
- **Notes:** If YouTube exposes no reliable duration for a Short, treat it as
  unknown and do not skip; log at `logInfo` level only.
- **Result:** A real 30.8-second Short advanced with a 5-second limit. The harness covered the 90-second fixture, changes to the limit and pause/resume.

### YP-T-007 — Show the dislike count on watch pages

- **Status:** Done
- **Priority:** P2
- **Area:** dislikes
- **Depends on:** YP-T-006
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** Put the fetched dislike count next to YouTube's dislike button on
  watch pages and keep it in sync with SPA navigation.
- **Plan:**
  1. `src/features/dislikes/engine.js` (with a small `watch.js` renderer if
     it keeps the module readable): resolve the active video id from
     `#movie_player.getVideoData().video_id`, falling back to the URL's `v`
     parameter; act only on `/watch`.
  2. Locate the active watch metadata (`ytd-watch-metadata`) and the dislike
     control (`dislike-button-view-model, #dislike-button` from `SEL`).
     Insert `span.yp-dislike-count[data-yp-ui]` inside the button's count
     area; never replace native nodes, the like count or the button's click
     handler.
  3. Fetch through the API/cache from YP-T-006; abort the previous request
     when the id changes; render once per id and remove a stale count when
     navigating to another video or leaving `/watch`.
  4. Use `formatCount` for the text and a localized `title`/`aria-label`
     ("N dislikes", estimates noted). Do not hide or rewrite the native like
     count here.
  5. React to `apply`/`scan`/`navigate`; remove the count on disable. If the
     button is missing (new layout), wait for the next scan and do not retry
     in a loop. Log render failures as `YP-1502`.
  6. Tests: pure helpers for video-id extraction, stale-result rejection and
     render/remove decisions.
- **Acceptance criteria:**
  - [x] A watch page shows the restored dislike count beside the native
        dislike control; it disappears when the feature is disabled.
  - [x] Navigating between videos updates the count once and never shows a
        previous video's number.
  - [x] Cached videos render without a new request; disabled features and
        non-watch pages make none.
  - [x] No duplicate counts after scans, no native text/aria attributes are
        overwritten, and the native controls keep working.
  - [x] `npm test && npm run ci` passes.
- **Verification:** Live YouTube: open several videos, navigate through the
  sidebar, use back/forward, toggle the feature, and check dark/light themes.
  Confirm one span per page and no console errors with `yp_debug` on.
- **Edge cases:** The player and metadata can be reused across videos; only
  the current `ytd-watch-metadata` may be touched; the dislike count can be
  absent for videos with likes hidden; API failures must leave the native UI
  untouched.
- **Result:** The exact build rendered beside the live native dislike control with a stub response. Watch navigation and the cached return passed in the browser harness.

### YP-T-008 — Add the ratio bar, number formats and appearance options

- **Status:** Done
- **Priority:** P2
- **Area:** dislikes
- **Depends on:** YP-T-007
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** Match the extension's display options: a like/dislike ratio bar
  with a tooltip, formatted counts and optional colors, all following
  YouTube's light and dark themes.
- **Plan:**
  1. `src/features/dislikes/bar.js`: compute the like share as
     `likes / (likes + dislikes)`; for zero votes show a neutral 50/50 bar
     with a localized "No votes yet" title, matching the extension; hide the
     bar when there is no usable data. Round to one decimal only for display.
  2. Insert `div.yp-rating-bar[data-yp-ui]` below the like/dislike group in
     the active watch metadata; two child segments; `aria-hidden="true"` and
     a localized `title`/`aria-label` with likes, dislikes and optional
     percentages. Never move or restyle YouTube's own buttons.
  3. Apply `showBar`, `showPercent`, `colorizeBar` and `tooltipMode`
     (`dashLike`, `dashDislike`, `both`, `onlyLike`, `onlyDislike`).
     `reformatLikes`, when enabled, formats the native like count but must
     store the original text and restore it when disabled or when the video
     changes. Recoloring YouTube's native thumbs is intentionally out of
     scope; only our own count and bar may use the RYD colors.
  4. Add `src/styles/dislikes.css` (imported from `src/main.js`) with
     `--yp-like` / `--yp-dislike` tokens for both themes and a bar that fits
     the watch layout without overflow. All our nodes go through `el()`.
  5. Reuse the cached data from YP-T-006 and update/remove the bar on
     `apply`, `scan`, `navigate` and theme changes; remove it when the
     feature is disabled or the page leaves `/watch`.
  6. Tests: ratio math (including zero and uneven counts), formatting modes,
     tooltip text and the disable/restore path for `reformatLikes`.
- **Acceptance criteria:**
  - [x] The bar shows the correct like/dislike share under the buttons and
        updates when navigating between videos.
  - [x] Zero votes produce a neutral bar with the localized "No votes yet"
        title; missing data hides the bar.
  - [x] `compactShort`, `compactLong` and `standard` produce correct,
        localized counts; changing the format updates the count and tooltip.
  - [x] `colorizeBar` looks correct in light and dark themes, and disabling
        the feature restores YouTube's original text and layout.
  - [x] The bar is absent on Shorts and non-watch pages.
  - [x] `npm test && npm run ci` passes.
- **Verification:** Live YouTube with videos of different like/dislike
  ratios; change every option, toggle themes, navigate and disable. Check the
  console with `yp_debug` on.
- **Edge cases:** likes + dislikes can be zero; counts can be enormous;
  YouTube can hide like counts entirely; the watch metadata can be reused;
  formatting the native like count must be fully reversible.
- **Result:** The browser harness confirmed a 90/10 colored split in both themes and a neutral 50/50 bar with no votes. Formatting and restoration passed unit tests.

### YP-T-009 — Show dislike counts on Shorts (read-only)

- **Status:** Done
- **Priority:** P3
- **Area:** dislikes
- **Depends on:** YP-T-007
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** Show the active Short's dislike count without fabricating an
  interactive voting control. Vote submission is out of scope, so a fake
  dislike button would be misleading.
- **Plan:**
  1. Resolve the active reel (`ytd-shorts`, the active
     `ytd-reel-video-renderer`) and its video id from the reel link or the
     Shorts URL; react to active-reel changes on `scan`/`navigate`.
  2. Use `SEL.shortsActionBar` (`reel-action-bar-view-model`). If a native
     `dislike-button-view-model` exists, reuse the YP-T-007 renderer in it.
     Otherwise insert a read-only `span.yp-shorts-dislike[data-yp-ui]` with
     the localized count and a `title`/`aria-label`; no `button` role, no
     click handler, no vote request.
  3. Fetch through the existing API/cache; abort on reel change; render once
     per id and remove the previous count when the active reel changes or the
     feature is disabled.
  4. Keep the element visually aligned with the Shorts action bar but do not
     clone YouTube's buttons or classes that imply interactivity. Add any
     needed icon (for example `thumbDown`) to `src/ui/icons.js` rather than
     using `innerHTML`.
  5. Tests: active-reel/video-id extraction, stale-result rejection and the
     read-only render decision.
- **Acceptance criteria:**
  - [x] The active Short shows its dislike count and updates when scrolling
        between Shorts.
  - [x] No duplicate counts, no vote submission, and no clickable control is
        created when YouTube has no native dislike button.
  - [x] Leaving Shorts or disabling the feature removes the count and aborts
        pending fetches.
  - [x] The action bar layout is unchanged otherwise, in light and dark
        themes.
  - [x] `npm test && npm run ci` passes.
- **Verification:** Live Shorts and the `?page=shorts` harness fixture: scroll
  forward/back, navigate away, toggle the feature, and check a video with
  dislikes hidden.
- **Edge cases:** Shorts reuses reel elements; only the active reel may be
  touched; the native action bar may appear after a delay; mobile Shorts is
  out of scope.
- **Result:** The exact build rendered the read-only count on live Shorts with a stub response. The browser harness confirmed teardown and the absence of a voting control.

### YP-T-011 — Add the `commentKit` feature, panel shell, settings and locales

- **Status:** Done
- **Priority:** P2
- **Area:** commentKit
- **Depends on:** —
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** Add an opt-in Comment Kit feature that docks a panel on watch
  pages and provides the shell for comment search, transcripts and live chat.
  This task creates the feature, settings, panel frame and toggle; data and
  tools follow in YP-T-012…017. Disabled by default so existing users see no
  change.
- **Plan:**
  1. Create `src/features/commentKit/index.js`, `settings.js` and
     `panel.js`. Register `id: 'commentKit', order: 40`; import it in
     `src/main.js` after `shorts` and before `settings`.
  2. `commentKitFields()`: `enabled: field.bool(false)`,
     `theme: field.enum(['auto', 'light', 'dark'], 'auto')`,
     `cache: field.bool(true)`, `pageSize: field.int(50, {min: 10, max: 200})`,
     `includeReplies: field.bool(true)`, `timedComments: field.bool(true)`,
     `heatmap: field.bool(true)`, `transcripts: field.bool(true)` and
     `liveChat: field.bool(true)`.
  3. Panel shell: dock at the top of `#secondary-inner` on watch pages; on
     channel pages use a fixed-position panel because there is no secondary
     column. Build everything with `el()`/`data-yp-ui`, tokens and a local
     theme scope. Include a header (title, source tabs Comments / Transcript /
     Live chat, close), a body with empty/loading/error states and a footer
     with the result count.
  4. Toggle: add a compact "Comment Kit" button to the comments header
     (`ytd-comments#comments`) that opens/closes the panel. Remember the open
     state in a `yp_comment_panel_open` storage key through `core/storage.js`,
     not in the settings schema. Do not add a guide row or global hotkey in
     this task.
  5. Settings tab: cards for Panel (enabled, theme, pageSize), Comments
     (cache, includeReplies, timedComments, heatmap) and Sources
     (transcripts, liveChat), gated by `enabled`.
  6. Add every `commentKit.*` string to all eight locales.
  7. `src/core/debug.js`: add `COMMENTKIT_RENDER: 'YP-1603'` for panel
     failures.
  8. Tests: include `commentKitTab()` in `tests/settings-tabs.test.js`; cover
     defaults and the panel open/close state helper.
- **Acceptance criteria:**
  - [x] A Comment Kit tab exists; the feature is off by default; enabling and
        saving shows the toggle, and the panel opens/closes without altering
        YouTube's native comments.
  - [x] Auto/light/dark theme scope works; the layout fits watch and channel
        pages; opening twice never creates a second panel.
  - [x] This task adds no data extraction, network request or new grant.
  - [x] Every string exists in all eight locales; `npm test && npm run ci`
        and `npm run check:i18n` pass.
- **Verification:** Harness watch/channel fixtures and live YouTube at 360,
  1280 and 1920 px in both themes; reload with the panel open and confirm a
  single panel and a clean console.
- **Notes:** Parity target: YouTube Comment Kit — Comment Search (Chrome Web
  Store ID `pfgcilgpjedghceoheogpibogofhlbke`, v1.3.1, checked 2026-11-22).
  Scope is local, read-only tooling with no new hosts. Out of scope: My
  Activity comment history (needs `myactivity.google.com`), comment
  screenshots (needs DOM-to-image or extension APIs), AI sentiment, and
  automated post/reply/edit/delete.
- **Result:** The harness confirmed settings, open-state persistence, both themes and 360, 1280 and 1920 px widths. The live watch page displayed the panel.

### YP-T-012 — Extract, normalize, cache and search comments

- **Status:** Done
- **Priority:** P2
- **Area:** commentKit
- **Depends on:** YP-T-011
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** Turn YouTube's rendered comments into a normalized, locally cached
  data set and provide the pure search/filter/sort functions the panel uses.
  No new network requests.
- **Plan:**
  1. `extract.js`: add selectors to `SEL` or the module top and verify them
     live: `ytd-comments#comments`, `ytd-comment-thread-renderer`,
     `ytd-comment-view-model` / `ytd-comment-renderer`, `#author-text`,
     `#content-text`, `#vote-count-middle`, `#published-time-text`,
     `#replies` and the more-replies control. Scope to the active
     `#page-manager` and the current video id.
  2. Support video and channel comment sections by resolving the nearest
     `ytd-comments`/comment-section root; if a channel layout differs, add
     its selectors and fail gracefully rather than throwing.
  3. Normalize each comment to `{id, author, authorUrl, text, likeCount,
     likeText, publishedText, order, replyCount, hasGif, hasLink, permalink,
     isReply, parentId}`. Use `textContent` only. Derive a stable id from the
     permalink (`lc=`) and fall back to author + text + order; drop empty and
     duplicate entries.
  4. `parse.js`: pure helpers for like counts (`1.2K`, `1,234`, localized
     suffixes) and timestamps (`m:ss`, `h:mm:ss`); tests cover non-Latin text
     and malformed input.
  5. Collection policy: read comments already rendered and never auto-click
     "Read more" or "View replies". Provide a `Load more` action that scrolls
     the comment container to trigger YouTube's lazy loading, then waits for
     the next scan with a bounded retry count. Include loaded replies when
     `includeReplies` is on.
  6. `cache.js`: persisted per-video cache under `yp_comment_cache_v1`
     through `core/storage.js` (schema version, timestamp, video id,
     comments), 24 h TTL, cap 50 videos / 2000 comments, least-recently-used
     prune. Gate writes on the `cache` setting. Store no DOM nodes and no
     data beyond the comment text already visible on the page.
  7. `search.js`: pure `filterComments(comments, query)` with text (substring
     or regex), author, min likes, `hasGif`, `hasLink`, `hasReply` and
     `includeReplies`; `sortComments` (DOM order/newest, oldest, most liked,
     most replies, author); `randomComment`. Regex input is capped at 200
     characters, wrapped in `try/catch`, and an invalid pattern falls back to
     a literal search with a visible error.
  8. `highlight.js`: return text/match segments for safe DOM construction;
     never build HTML strings.
  9. `src/core/debug.js`: add `COMMENTKIT_EXTRACT: 'YP-1601'` and
     `COMMENTKIT_CACHE: 'YP-1602'`; log and keep the panel usable.
  10. Tests: normalization, like/timestamp parsing, dedupe, cache TTL/prune/
      corrupt data, filter/sort/regex/random and highlight segments.
- **Acceptance criteria:**
  - [x] Video and channel sections produce one normalized entry per comment;
        replies follow `includeReplies`; no duplicates.
  - [x] Reloading a cached video renders without re-reading the DOM; cache
        disabled means no writes; caps hold; corrupt cache is discarded.
  - [x] Search/filter/sort return expected results; invalid regex never
        throws; random returns an item from the filtered set.
  - [x] A 1000-comment page processes without freezing; tests pass.
- **Verification:** Harness fixtures with comments, replies, GIFs and long
  threads; live pages in several locales; `yp_debug` on; `npm test && npm run
  ci`.
- **Edge cases:** Edited/deleted comments, hidden like counts, translated
  comments, the same author repeated, comments loaded after navigation,
  channel layouts and non-Latin text.
- **Result:** Live watch extraction and the 1,000-comment browser fixture worked. Unit tests covered stale comments, cache limits and search.

### YP-T-013 — Build the Comment Kit results panel

- **Status:** Done
- **Priority:** P2
- **Area:** commentKit
- **Depends on:** YP-T-012
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** Render the searchable comment list and wire safe quick actions,
  using the engine from YP-T-012.
- **Plan:**
  1. Replace the panel body placeholder with controls: text input, regex
     toggle, author filter, minimum likes, `has:gif`, `has:link`,
     `has:reply`, include replies, sort select, refresh, random picker and a
     result count.
  2. Render results page by page (`pageSize`) through a `DocumentFragment`;
     show author, published time, likes, reply count, highlighted text and
     timestamp buttons. Re-render only the list on query changes; debounce
     input at 150 ms and preserve focus/caret.
  3. Safe quick actions only: copy text, copy permalink, open the author's
     channel, seek to a timestamp and activate YouTube's native translate
     control when present. Do not automate post, reply, edit or delete.
  4. Poll tally: a small toolbar action where the user enters option labels;
     count exact matches in the filtered set and show a table. Do not infer
     poll semantics from arbitrary comment text.
  5. Random picker: choose from the filtered set, scroll to the item and
     flash it.
  6. Empty/loading/error states; `aria-live` result count; labels; keyboard
     focus; touch-sized controls; a reduced-motion-friendly flash.
  7. Tests: pagination/result-count helpers, highlight segment to node
     builder, and action availability rules.
- **Acceptance criteria:**
  - [x] Search, filters, sort, random and pagination work; 1000 comments
        render in bounded time; no `innerHTML`.
  - [x] Safe actions work; authoring/destructive actions are absent.
  - [x] The panel remains usable at 360 px, in both themes and with keyboard
        only; screen-reader labels are present.
  - [x] No network, no new grants; `npm test && npm run ci` passes.
- **Verification:** Harness and live pages with long threads, regex edge
  cases, GIF comments, translated comments, both themes and a keyboard-only
  pass.
- **Notes:** Translation uses YouTube's own control; no translation API is
  added. Authoring actions stay with YouTube's native UI.
- **Result:** The browser harness confirmed filtering, timestamps, keyboard selection and the mobile panel. Focused tests covered result actions, pagination, sorting and poll matching.

### YP-T-014 — Timed comments, clickable timestamps and seekbar heatmap

- **Status:** Done
- **Priority:** P2
- **Area:** commentKit
- **Depends on:** YP-T-013
- **Created:** 2026-11-22
- **Completed:** 2026-11-27
- **Goal:** Turn timestamps in comments into navigation and visualize comment
  density on the seek bar, without modifying YouTube's progress controls.
- **Plan:**
  1. `timestamps.js`: parse `m:ss` and `h:mm:ss`, ignore out-of-range values
     and return `{raw, seconds}`; sort and dedupe. Tests include `0:05`,
     `1:02:03`, `99:99` and URL-like text that only looks like a timestamp.
  2. Render each timestamp in the panel as a `<button>`; clicking calls a
     shared `seekTo(seconds)` that uses `#movie_player.seekTo(seconds, true)`
     when available, otherwise `video.currentTime = seconds`. Do not cancel
     events.
  3. `timedComments`: a small overlay listing comments whose timestamps fall
     within ±2 s of `currentTime`. Build a sorted index, binary-search it on
     a throttled `timeupdate` (≥250 ms), clear it on pause/leave and make it
     dismissible. Never rewrite native comment text.
  4. `heatmap`: aggregate timestamps into about 100 buckets across the
     duration and render our own marker overlay inside the player's progress
     container. Position markers by percent, add a `title` with the count,
     seek to the bucket start on click, recompute on duration/metadata/
     navigation/resize and remove the overlay on disable/non-watch pages.
  5. Do not restyle or intercept the native progress bar; our overlay carries
     `data-yp-ui` and only markers receive pointer events.
  6. Tests: parser, bucket math, binary search, clamping and the no-timestamp
     case.
- **Acceptance criteria:**
  - [x] Timestamp buttons seek correctly; invalid timestamps are ignored.
  - [x] The timed overlay appears only near matching times and can be
        dismissed.
  - [x] Heatmap markers reflect density, scale on resize, seek on click and
        clean up on navigation/disable.
  - [x] No interference with native controls; both themes; tests pass.
- **Verification:** Harness/live with timestamped comments; seek and
  back/forward; theater/fullscreen; resize; disable mid-playback.
- **Edge cases:** timestamps after the video end, duplicate timestamps,
  `Infinity` duration, Shorts (timed comments and heatmap are watch-page
  only).
- **Result:** The browser harness confirmed timed display, dismissal, heatmap seeking and SPA teardown at multiple viewport widths.

[shorts-ext]: https://chromewebstore.google.com/detail/youtube-shorts-%D0%B0%D0%B2%D1%82%D0%BE-%D1%81%D0%BA%D1%80%D0%BE%D0%BB/cfalfdakejchchmgepmoloojdclhcmif

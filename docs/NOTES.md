# Handoff notes

Unofficial Lichess plugin for TRMNL (test plugin 540460). Lichess login by OAuth only (scope `puzzle:read`). One setting `mode`: Puzzles (default), Your games or Profile (`field(input, 'mode')`; anything but `games` or `profile` is puzzles).

## Source and build

| Path | What |
|---|---|
| `source/chess.js`, `source/puzzle.js`, `source/games.js`, `source/profile.js`, `source/view.js` | Transform (Node, serverless): FEN, moves, Lichess calls, "Your games" mode, view model for Liquid |
| `source/shared.liquid` | All markup: layout, panels, move list, QR, connect screen, title bar (Framework classes only) |
| `source/draw.js`, `source/pieces.js` | The board SVG (the only custom drawing); `pieces.js` is generated |
| `source/page.js` | Page script: draws the board, settles its size, fits the panel, draws the rating chart |
| `assets/pieces/cburnett/` | Piece SVGs (BSD); `node tools/pieces.js` regenerates `source/pieces.js` |
| `plugin/src/*` | Build output (`node tools/build.js`); `settings.yml` is not built, it comes from `trmnlp pull` |

Build: `node tools/build.js`. Push: `cd plugin && trmnlp push` (test plugin only).

## Tests and renders

| What | Command | Where |
|---|---|---|
| Logic and static guards | `node --test test/` | `test/transform.test.js`, `test/view.test.js` |
| Rendered views (required before a push) | `cd plugin && trmnlp test` | `plugin/tests/*_spec.rb`, checks in `plugin/tests/view_checks.json`, helpers in `plugin/tests/support/ym.rb` |
| Lint | `cd plugin && trmnlp lint` | |
| Review sheet PNGs | `cd plugin && YM_CASES="$(cat cases.json)" YM_OUT=<dir> trmnlp test ../tools/render_sheet_spec.rb` then `montage`/`convert` | case: `{name, view, device (og_png, v2), dark, palette, scenario (owner, account, daily, case), puzzle}` |

Rendered checks on every case: no overflow, no page errors, at most 4 text sizes in the panel, equal gaps between panel blocks (2 px), side-by-side panels share top and bottom, no card content taller than its card. `view_checks.json` adds per-view checks (parts shown, move order, last-move block, board >= 97 % of the content height on X full, title bar mode, connect screen). The OAuth login in renders is seeded by `YmOAuthSeed` in `support/ym.rb`.

## Layout rules

- Only the board may carry its own SVG/CSS. Everything else: Framework classes, no `style=`, no `<style>` (guarded in `test/view.test.js`). Highcharts inline styles are the one allowed exception.
- Board left, panel column next to it at the layout gap (`flex-none` board container); the board fills the content height and gives way only if the panel needs more width.
- Panel column: one flex stack, one gap; every block the same panel (`bg--gray-75 1bit:bg--white rounded p--2`). Rating and QR side by side, same top and height.
- The move list is content height; oldest rows hide first when the stack is too tall. Then optional parts hide in this order: chart, week, chips, puzzle line, game lines (`hide()` in `page.js` also removes `lg:flex`/`lg:visible`).
- Type: heading `value value--small`, rating `value lg:value--large`, change `value value--xsmall`, everything else `label`.

## 1-bit rules

- Panels and the move-number gutter are white on 1-bit (no dither behind small text).
- Move list figurines on 1-bit: separate bold black-outline glyphs (`ym_1*` captures), no image stroke.
- Board colours come from `TRMNLPaint.bg()` tokens (dither tiles become SVG patterns); dark mode asks the inverse token so the board stays light. Last move: outline on the destination square only.

## Title bar modes

One table in `source/view.js` (`MODES`): `puzzles` "Puzzles" (with the theme: "Puzzles · Endgame"), `connect` "Connect account", `games` "Your games", `profile` "Profile"; reserved `top` "Top game", `following` "Following %s".

## Your games mode (`source/games.js`)

| State | Shown |
|---|---|
| A correspondence game to move on | The one with least time left, from your side, last move outlined, opponent, time left, moves, QR "Scan to move"; "N more games waiting" |
| Only games where the opponent is to move | The first of them: "Their turn", "Waiting for X", moves, QR; "N games waiting for opponents" (their clock is not in the API: `secondsLeft` is yours) |
| No ongoing game | Last finished correspondence game: "Last game", "vs X (rating)", "Won" + "in N moves", QR "Start a new game" (https://lichess.org/) |
| Nothing, or a failed call with no saved game | Calm screen (icon, title, one line, failure line) |
| 401 / 403 | Connect screen: reconnect |

The moves call (`/game/export`) and the last-game call run after the playing list with a deadline inside TRMNL's 5 s. The shown game is saved as `gm` for an "Offline, last game" screen. The playing list needs no scope beyond a valid token, so `oauth_scopes` stays `puzzle:read` (unproven live: tests use mocks).

## Profile mode (`source/profile.js`)

| Part | Source | Rule |
|---|---|---|
| Header | `/api/account` | name, title chip, "Member since Mon YYYY" |
| Ratings | account perfs + `/api/user/{u}/rating-history` | perfs with games > 0, most played first, max 8; `?` in its own column when provisional; change = rating now minus the last point on or before day -30 |
| Few ratings (1-2) | same | hero card (perf, big rating, change, games) instead of the table |
| Chart | rating history | most played rating perf (puzzles only if alone), last 90 days, max 45 points; y range >= 100, 3 gridlines; X only, hidden when its box is under 64 px |
| Stats | account count, playTime, puzzle, storm | games, won/lost/drawn, time played, puzzles (if played), storm best |
| Form | `/api/games/user/{u}?max=10&rated=true` | W/L/D chips, oldest left; W black, L outline, D grey box (white on 1-bit) |

- Calls: account, history and games start side by side (all at once when the name is saved in `pf`; else history and games right after the account). Failures are said on screen ("Lichess history: HTTP 503"); the saved `pf` stands in per part; account 401/403 = connect screen; no account and no saved profile = calm screen.
- Layout rules: lists are packed (row pitch <= 1.6x line height, checked); never spread to fill. Spare height goes to the chart (X) or the packed group sits as one block; the ratings table is top-aligned. Full view has two arrangements (OG: head+ratings | stats+form; X: head+ratings+stats | chart+form). The page script hides, in order: chart, ratings header, least played ratings, last stats lines.
- Quadrant: username, top 3 ratings, form chips only.
- Fixtures `plugin/tests/fixtures/profile_*`; scenarios `profile_many`, `profile_new`, `profile_fail`, `profile_partial`; unit tests `test/profile.test.js`; renders `renders/design-r3.png`.

## Quadrant

The board takes the full content height (check >= 97 %); the panel gets the rest. Short texts (`heading_short`, `time_value_short`, `+N waiting`), p--1 cards and no wide gap; optional lines (`data-ym-opp`, `more`, `meta`) are dropped before the board gives up any height (`quadrantFit` in `page.js`). One ladder in every view and mode: heading `value value--small`, figure `value`, rest `label`.

## Lichess endpoints

| Call | Scope | Timeout | Use |
|---|---|---|---|
| `GET /api/account` | puzzle:read token | 3.5 s | name, puzzle rating |
| `GET /api/puzzle/next?difficulty=` | puzzle:read | 3.5 s | the puzzle (started at once, used unless the current one is kept) |
| `GET /api/user/{name}/rating-history` | token sent, public | 3.5 s | rating chart |
| `GET /api/user/{name}/activity` | public | 3.5 s | week: solved, failed, rating change per day; failure reuses the saved week |
| `GET /api/account/playing?nb=50` | valid token | 3.5 s | Your games: ongoing games |
| `GET /game/export/{id}?moves=true` | token sent | <= 2.2 s | Your games: move list |
| `GET /api/games/user/{name}?max=1&perfType=correspondence&moves=true` | token sent | <= 2.2 s | Your games: last finished game |
| `GET /api/puzzle/activity?max=20` | puzzle:read | 2.5 s | solved check and streak only; never shown as a failure |
| `POST /api/token/test` (body: token) | none | 3.5 s | scopes; without `puzzle:read` the screen says "Reconnect Lichess" |

All calls start side by side at the top of `run()` (TRMNL's 5 s cap). A failed call is said on screen ("Lichess activity: timeout").

## Open items

- Your games is unproven against live Lichess (mocked): check `/api/account/playing` with the real token after the push.

# Handoff notes

Unofficial Lichess plugin for TRMNL (test plugin 540460). Lichess login by OAuth only (scope `puzzle:read`). Settings `mode`: Puzzles (default), Your games, Profile, Top game or Follow a player (`field(input, 'mode')`: `games`, `profile`, `top`, `following`; anything else is puzzles) and `follow_username` (only used by Follow a player).

## Source and build

| Path | What |
|---|---|
| `source/chess.js`, `source/puzzle.js`, `source/games.js`, `source/profile.js`, `source/live.js`, `source/view.js` | Transform (Node, serverless): FEN, moves, Lichess calls, "Your games", Profile, Top game and Following modes, view model for Liquid |
| `source/shared.liquid` | All markup: layout, panels, move list, QR, connect screen, title bar (Framework classes only) |
| `source/draw.js`, `source/pieces.js` | The board SVG (the only custom drawing); `pieces.js` is generated |
| `source/page.js` | Page script: draws the board, settles its size, fits the panel, draws the rating chart |
| `assets/pieces/cburnett/` | Piece SVGs (BSD); `node tools/pieces.js` regenerates `source/pieces.js` |
| `plugin/src/*` | Build output (`node tools/build.js`); `settings.yml` is not built, it comes from `trmnlp pull` |

Build: `npm install` once (terser, dev only), then `node tools/build.js`: `plugin/src/transform.js` ships minified (top-level names kept), the source stays readable; tests load the readable bundle and `test/transform.test.js` also checks the shipped file is the current minified build and answers like the source. Push: `cd plugin && trmnlp push` (test plugin only).

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
- Board colours come from `TRMNLPaint.bg()` tokens (dither tiles become SVG patterns); dark mode asks the inverse token so the board stays light. Last move: thick frame on the destination square, thinner dashed frame on the origin square (R7).

## Title bar modes

One table in `source/view.js` (`MODES`): `puzzles` "Puzzles" (with the theme: "Puzzles · Endgame"), `connect` "Connect account", `games` "Your games", `profile` "Profile", `top` "Top game · <event short name>" (or "Top game · TV"), `following` "Following <name>".

## Run budget (`source/puzzle.js`)

TRMNL stops a transform at 5 s. `run()` calls `runStart()` (RUN_MS 3500); `getRaw` clamps every call to `runLeft(cap)`, skips a call with under 300 ms left as a timeout, and races each call against the deadline (a fetch deaf to its abort cannot hold the run). A timeout shows the saved fallback and the line "Lichess ...: timeout". Guard: `test/budget.test.js` (never answers, deaf, 2.5 s per call, 1.2 s chain; every mode).

## Your games mode (`source/games.js`)

| State | Shown |
|---|---|
| A correspondence game to move on | The one with least time left, from your side, last move framed, opponent, time left, moves, QR "Scan to move"; "N more games waiting" |
| Only games where the opponent is to move | The first of them: "Their turn", "Waiting for X", moves, QR; "N games waiting for opponents" (their clock is not in the API: `secondsLeft` is yours) |
| No ongoing game | Last finished correspondence game: "Last game", "vs X (rating)", "Won" + "in N moves", QR "Start a new game" (https://lichess.org/) |
| Nothing, or a failed call with no saved game | Calm screen (icon, title, one line, failure line) |
| 401 / 403 | Connect screen: reconnect |

The moves call (`/game/export`) and the last-game call run after the playing list with a deadline inside TRMNL's 5 s. The shown game is saved as `gm` for an "Offline, last game" screen. The playing list needs no scope beyond a valid token, so `oauth_scopes` stays `puzzle:read` (unproven live: tests use mocks).

## Profile mode (`source/profile.js`)

Layout R8 (owner 2026-11-14: the table version "looks pretty weak").

| Part | Source | Rule |
|---|---|---|
| Header (full view) | `/api/account` | title chip, name, "Member since Mon YYYY"; right: "Storm best N · 14d 23h played" |
| Hero | account perfs + `/api/user/{u}/rating-history` | most played rating perf (puzzles only when alone): big rating, `?` when provisional, 30-day change, "Peak 1976 · Sep 2026" (highest history point, "now" when the current rating is higher), 90-day chart (max 45 points, y range >= 100, gridlines, no numbers) |
| Cards | same | the other perfs with games > 0, most played first (max 9, grid of 3): short name, rating, `?`, 30-day change, trend (90 days, max 16 points) |
| This week | `/api/games/user/{u}?max=30&rated=true` (ndjson) | games of the last 7 days ("30+" when all fetched games are inside), one framed bar with a segment per game (won black, drawn grey, lost white), "8 won · 2 drawn · 5 lost", hero rating change over 7 days, streak of the newest same results ("3 wins in a row", >= 2) |
| Recent games | same | newest first, max 12: chip, "opponent (rating)", time control; packed from the top of their panel |

- Calls: account, history and games start side by side (all at once when the name is saved in `pf`; else history and games right after the account). Failures are said on screen in the week card ("Lichess history: HTTP 503"); the saved `pf` (rows with change, trend, peak; recent games) stands in per part; account 401/403 = connect screen; no account and no saved profile = calm screen.
- Views: full: header over two columns (hero, week | cards, recent games). Half horizontal: hero | week, cards. Half vertical: one column (hero, week, cards, recent games). Quadrant: hero and week only.
- The hero chart and the card trends take the spare height. The page script hides, in order: the oldest recent games (down to 3), the least played cards (down to 3), the recent games, the peak line, the other cards; a hero chart under 40 px and a trend under 16 px go. A column whose blocks no longer fill it gives the height to its last card (a list stays packed from the top).
- Charts: `YM.sparks` (`{id, pts, hero}`), drawn by `spark()` in `page.js` with TRMNLCharts.
- Guards: `test/profile.test.js`; rendered checks in `view_checks.json` (hero, peak, cards sorted, week bar segments = games, lost framed and unlike drawn, recent games packed from the top, quadrant hero and week only, old layout gone; the bar, packing and quadrant checks were seen red on mutations). Fixtures `plugin/tests/fixtures/profile_*` (24 games over 14 days; new player: 5 games); scenarios `profile_many`, `profile_new`, `profile_fail`, `profile_partial`; renders `renders/design-r8.png`, `renders/design-r8-bar-1bit.png`, `renders/design-r8-new-x.png`.

## Top game and Following modes (`source/live.js`)

| Part | Rule |
|---|---|
| Top game: broadcast | `GET /api/broadcast/top` (`active`, rounds with `round.ongoing`, highest `tour.tier` first, at most 3 rounds). Boards: `GET /api/broadcast/-/-/{roundId}` (`/api/broadcast/round/{id}` is a 404). Shown: the board in play (`status` `*` with a last move) with the highest rating sum. Moves: `GET /api/study/{roundId}/{gameId}.pgn` (clock comments are dropped; a list that does not replay to the board's FEN is not shown). QR: `https://lichess.org/study/{round}/{game}` (Lichess redirects to the broadcast page; keeps the QR small). Clocks are centiseconds |
| Top game: TV | No board in play in any broadcast: `GET /api/tv/channels`, the classical game when its rating >= 2000, else `best`; `GET /game/export/{id}` JSON (moves, clocks, players) replayed with chess.js. Title bar "Top game · TV" |
| Nothing in play | The top board of a just ended broadcast round (result shown), else a calm screen "No live game right now" (no failure line when nothing failed) |
| Follow | `follow_username` (empty or invalid name: calm screen, no call). One call: `GET /api/user/{name}/current-game?moves=true&clocks=true` (public: the ongoing game, else the last game played; 404 = unknown account, calm screen "Unknown player"). Result from the followed player's side (chip "Won"/"Lost"/"Draw", the event line starts with the name). Variants are not drawn ("Lichess game: not shown"). `/api/games/user/{name}` is 404 anonymously: not used |
| Screen | Board from white's side, last move outlined. Player cards: black top, white bottom of the moves (title chip, name, rating, "to move", clock as last fetched); event card (content height, event name may wrap to 2 lines, round and board, Live chip or the result) beside the QR; the move list takes the leftover height (as many rows as fit (max 12) full, 3 rows in half horizontal, where it sits between event and QR) "Watch live" / "Watch the game". Failures: own card of lines ("Lichess broadcast: HTTP 503") |
| Views | Full: cards, moves (oldest hide first), event + QR; the board fills the height (check 97 %). Half views: one-row player cards, event + QR (QR on X only). Quadrant: board and two cards (surname, clock) only |
| Failure | Each call has its own timeout inside TRMNL's 5 s; broadcast and TV start side by side; a failed call is said on screen; the saved game (`tg`, `fw` with the user) stands in, called "Offline", never "Live"; no saved game: calm screen |
| Guard | `test/live.test.js`; each `render "main"` line in `plugin/src/*.liquid` must pass every variable the markup reads (a missing one once left the cards empty); renders `renders/design-r4.png` |

## Size budget

TRMNL refuses a transform over 102400 bytes (`trmnlp lint`: files_under_upload_limit). The build fails above 90 % of it (92160 bytes, `BUDGET` in `tools/build.js`; test `transform.js: shipped file ...` fails when the file is stale or over, and the check itself was seen failing with a lower threshold). Minified size now about 75 KB (source 102 KB readable). Do not trim comments to fit: split a module or drop code.

## Puzzle training (mode Puzzles, `source/puzzle.js`)

| Setting | Rule |
|---|---|
| `difficulty` (existing) | `/api/puzzle/next?difficulty=easiest..hardest`; "Harder" etc. is appended to the puzzle info line when not Normal |
| `puzzle_focus` | Any theme (default) or My weakest theme: `GET /api/puzzle/dashboard/30` (2 s), lowest `performance` among themes with `nb` >= 10, then `next?...&angle=<theme>`. Kept 24 h in state `fc` (`t`, `k`, `rate`; too little data is kept too, a failed call is retried next refresh). Line "Training: Fork · 54 % solved" (firstWins / nb) in the puzzle card (full) or turn card (half views); fallback line "Not enough data for a focus yet", never a problem line |
| Guards | `test/transform.test.js` (theme pick, URL, cache, fallbacks, view files pass `training`); fixtures `dashboard_themes.json`, `dashboard_sparse.json`; scenarios `focus`, `focus_sparse`, `focus_fail`; renders `renders/design-r5.png` |

## Quadrant

The board takes the full content height (check >= 97 %); the panel gets the rest. Short texts (`heading_short`, `time_value_short`, `+N waiting`), p--1 cards and no wide gap; optional lines (`data-ym-opp`, `more`, `meta`) are dropped before the board gives up any height (`quadrantFit` in `page.js`). One ladder in every view and mode: heading `value value--small`, figure `value`, rest `label`.

## Lichess endpoints

| Call | Scope | Timeout | Use |
|---|---|---|---|
| `GET /api/account` | puzzle:read token | 3.5 s | name, puzzle rating |
| `GET /api/puzzle/dashboard/30` | puzzle:read | 2 s | weakest theme (focus on only, once a day) |
| `GET /api/puzzle/next?difficulty=&angle=` | puzzle:read | 3.5 s | the puzzle (started at once, used unless the current one is kept) |
| `GET /api/user/{name}/rating-history` | token sent, public | 3.5 s | rating chart; Profile: changes, peak, trends |
| `GET /api/games/user/{name}?max=30&rated=true` | token sent, public | <= 2.2 s | Profile: this week, recent games |
| `GET /api/user/{name}/activity` | public | 3.5 s | week: solved, failed, rating change per day; failure reuses the saved week |
| `GET /api/account/playing?nb=50` | valid token | 3.5 s | Your games: ongoing games |
| `GET /game/export/{id}?moves=true` | token sent | <= 2.2 s | Your games: move list |
| `GET /api/games/user/{name}?max=1&perfType=correspondence&moves=true` | token sent | <= 2.2 s | Your games: last finished game |
| `GET /api/puzzle/activity?max=20` | puzzle:read | 2.5 s | solved check and streak only; never shown as a failure |
| `POST /api/token/test` (body: token) | none | 3.5 s | scopes; without `puzzle:read` the screen says "Reconnect Lichess" |

All calls start side by side at the top of `run()` (TRMNL's 5 s cap). A failed call is said on screen ("Lichess activity: timeout").

## Open items

- OAuth is unproven live (checked against docs only). Lichess: public clients, any client id, PKCE, no secret ("unregistered and public clients", Lichess API spec); `settings.yml` has authorize `https://lichess.org/oauth`, token `https://lichess.org/api/token`, scope `puzzle:read`, PKCE on. The client id/secret fields are in the TRMNL plugin editor, not in `settings.yml`: set any client id (e.g. `trmnl-lichess-plugin`), secret empty or any value, and tick the option that shares the OAuth app if the plugin is published. `oauth_auth_params` repeats `code_challenge_method` that PKCE may already add: if Lichess answers "invalid request", clear it.
- Owner check (needs your Lichess account): 1. Open the test plugin 540460 settings. 2. Press Connect Lichess, Authorize, confirm you land back on TRMNL with the connection shown. 3. Force a refresh: each of the five modes should show data, not the Connect screen. 4. In Lichess (Preferences, API access tokens, or Account, Applications) revoke the app, refresh: the screen must say "Lichess login expired: reconnect ..." in every mode. 5. Connect again, refresh: back to data.

- Your games is unproven against live Lichess (mocked): check `/api/account/playing` with the real token after the push.
- Top game and Following: endpoints and shapes checked by hand against live Lichess on 2026-11-14 (`/api/broadcast/top`, `/api/broadcast/-/-/{id}`, `/api/study/{round}/{game}.pgn`, `/api/tv/channels`, `/game/export/{id}`); the rendered tests use fixtures. `/api/user/{name}/current-game` checked (200 for thibault, 404 for an unknown name); the QR redirect `/study/{round}/{game}` was checked with curl (303), not from a browser.

# Handoff notes

Unofficial Lichess plugin for TRMNL (test plugin 540460). Lichess login by OAuth only (scope `puzzle:read`).

## Source and build

| Path | What |
|---|---|
| `source/chess.js`, `source/puzzle.js`, `source/view.js` | Transform (Node, serverless): FEN, moves, Lichess calls, view model for Liquid |
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

One table in `source/view.js` (`MODES`): `puzzles` "Puzzles" (with the theme: "Puzzles · Endgame"), `connect` "Connect account"; reserved `games` "Your games", `top` "Top game", `following` "Following %s".

## Lichess endpoints

| Call | Scope | Timeout | Use |
|---|---|---|---|
| `GET /api/account` | puzzle:read token | 3.5 s | name, puzzle rating |
| `GET /api/puzzle/next?difficulty=` | puzzle:read | 3.5 s | the puzzle (started at once, used unless the current one is kept) |
| `GET /api/user/{name}/rating-history` | token sent, public | 3.5 s | rating chart |
| `GET /api/user/{name}/activity` | public | 3.5 s | week: solved, failed, rating change per day; failure reuses the saved week |
| `GET /api/puzzle/activity?max=20` | puzzle:read | 2.5 s | solved check and streak only; never shown as a failure |
| `POST /api/token/test` (body: token) | none | 3.5 s | scopes; without `puzzle:read` the screen says "Reconnect Lichess" |

All calls start side by side at the top of `run()` (TRMNL's 5 s cap). A failed call is said on screen ("Lichess activity: timeout").

## Open items

- X quadrant: the board does not fill the content height (about 140 px empty under it), and "Best move for white" wraps.
- OG half_vertical: the rating panel area is underused; the QR could sit beside the rating.

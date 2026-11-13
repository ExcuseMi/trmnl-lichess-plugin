# Your Move

Chess puzzles at your level, from Lichess and Chess.com, for [TRMNL](https://trmnl.com) e-paper displays.

- A crisp board drawn for e-ink: dark squares are grey on 2-bit and 4-bit screens and hatched on 1-bit, last move framed, coordinates, own piece set.
- A QR code that opens exactly the shown puzzle (`https://lichess.org/training/<id>` or the Chess.com daily page).
- With a Lichess login: puzzles at your rating, kept on screen until you solve them, then "Solved! +N"; your rating with its change, a rating history, solved today and this week, streak and a 7-day bar row.
- Without a login: the daily puzzle and a hint to connect Lichess.
- Offline: the last good puzzle stays, marked; with nothing saved a clear "No puzzle" screen.
- All four views, 1-bit, greyscale and dark mode. Texts are English for now.

## Settings

| Setting | What it does |
|---|---|
| Puzzle source | Lichess daily, Chess.com daily, or alternate by day |
| Lichess API token | Optional. Create at <https://lichess.org/account/oauth/token/create> with only `puzzle:read`. Never shown or logged |
| Difficulty | Easiest to hardest, relative to your puzzle rating (needs the token) |
| Chess.com username | Optional. Shows your best tactics rating. Chess.com has no public per-user puzzle feed, so the puzzle stays the daily one |
| Board orientation, Coordinates, Hide title bar | As named |

## Build and test

| What | Command |
|---|---|
| Build `plugin/src/transform.js` and `shared.liquid` from `source/` | `node tools/build.js` |
| Logic tests (FEN, PGN replay, sources, token, solved detection, 401, offline, state size) | `node --test test/` |
| Review renders (needs trmnl.com for the framework CSS) | `cd plugin && YM_CASES="$(cat <cases.json>)" YM_OUT=<dir> trmnlp test ../tools/render_sheet_spec.rb` |

Edit `source/`, never the files in `plugin/src/` that the build writes.

## Choices

| Topic | Choice |
|---|---|
| Position | The puzzle's own FEN. When an answer has none, the game's PGN is replayed with chess.js (vendored, minified, in the transform: serverless has no npm) |
| Board | Drawn as SVG in the page script (needs hatching and e-ink tuning no board library offers) |
| Pieces | Drawn for this plugin. Checked and not used: Lichess sets (GPL, CC BY-SA or NC), Wikimedia cburnett (CC BY-SA / GPL) |
| QR | Platform `qr_code` Liquid filter |
| Board CSS | Exception approved by the owner, 2026-11-14: a board library's own CSS would be allowed. None is used so far |

## Licence

All rights reserved, as the other plugins of this account. chess.js 1.4.0 (BSD-2-Clause, Jeff Hlywa) is bundled in the transform; its licence is in [LICENSES/chess.js-BSD-2.txt](LICENSES/chess.js-BSD-2.txt). Puzzles belong to Lichess (CC0 database) and Chess.com; data comes from their public APIs.

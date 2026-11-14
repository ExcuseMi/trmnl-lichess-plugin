# Lichess

Unofficial. Lichess puzzles at your level for [TRMNL](https://trmnl.com) e-paper displays. Not affiliated with or endorsed by Lichess.org.

- The puzzle position on a framed board (cburnett pieces), the last move tinted, framed and drawn as an arrow.
- Side panel cards: Your turn, the puzzle and the game it comes from, the moves that led to it (Lichess-style list), your rating with the last results, sparkline and week, and a QR code that opens exactly this puzzle.
- Without a login: the Lichess daily puzzle. Connect Lichess with the OAuth button (scope `puzzle:read`): unseen puzzles at your rating, kept until solved, then "Solved! +N".
- A failed Lichess call is said on screen ("Lichess activity: timeout"); the last good activity from the saved state stands in.
- All four views, 1-bit, greyscale and dark mode. Texts are English for now.

## Settings

| Setting | What it does |
|---|---|
| Lichess (OAuth button) | Optional login, scope `puzzle:read` only. The token is never shown or logged |
| Difficulty | Easiest to hardest, relative to your puzzle rating (needs the login) |
| Mode | Puzzles (default) or Your games: your correspondence games where it is your turn |
| Board orientation, Coordinates, Hide title bar | As named |

## Build and test

| What | Command |
|---|---|
| Build `plugin/src/transform.js` and `shared.liquid` from `source/` | `node tools/build.js` |
| Regenerate `source/pieces.js` from `assets/pieces/cburnett` | `node tools/pieces.js` |
| Logic and view tests | `node --test test/` |
| Review renders (needs trmnl.com for the Framework; checks at most 4 text sizes in the panel) | `cd plugin && YM_CASES="$(cat <cases.json>)" YM_OUT=<dir> trmnlp test ../tools/render_sheet_spec.rb` |
| Lint | `cd plugin && trmnlp lint` |

Edit `source/`, never the files in `plugin/src/` that the build writes. `settings.yml` is not built: it comes from `trmnlp pull`.

## Choices

| Topic | Choice |
|---|---|
| Position and moves | The puzzle's FEN; the moves before it from the game PGN up to `initialPly`, replayed with chess.js (vendored) and dropped if they do not reach the FEN |
| Lichess calls | Activity, token scopes, account and the next puzzle start side by side (3.5 s each, inside TRMNL's 5 s) |
| Board | Drawn as SVG in the page script |
| Pieces | cburnett (Colin M.L. Burnett) from Wikimedia Commons, under the BSD option the files offer; see LICENSES/pieces.md |
| QR | Platform `qr_code` Liquid filter, whole pixels per module, never one a 1-bit panel cannot read |

## Licence

All rights reserved, as the other plugins of this account. chess.js 1.4.0 (BSD-2-Clause, Jeff Hlywa) is bundled in the transform ([LICENSES/chess.js-BSD-2.txt](LICENSES/chess.js-BSD-2.txt)); the cburnett pieces are BSD ([LICENSES/cburnett-BSD-3.txt](LICENSES/cburnett-BSD-3.txt)). Puzzles belong to Lichess (CC0 database); data comes from its public API.

// "Top game" and "Follow a player" modes (source/live.js): the broadcast pick, the TV fallback, follow (playing, last game, unknown, empty),
// clocks, the move list, parallel calls, failures and the saved fallback.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { bundle } = require('../tools/build.js');
const FXD = path.join(__dirname, '../plugin/tests/fixtures');
const J = (n) => JSON.parse(fs.readFileSync(path.join(FXD, n), 'utf8'));
const T = (n) => fs.readFileSync(path.join(FXD, n), 'utf8');
const NOW = Date.UTC(2026, 10, 14, 10) / 1000;
function load(fetchImpl) {
  const ctx = { console, setTimeout, clearTimeout, AbortController, fetch: fetchImpl, JSON, Date, Promise, Math, Object, Array, String, Number, RegExp, Error, encodeURIComponent };
  vm.createContext(ctx); vm.runInContext(bundle() + '\n;this.api = { run, clockText, shortEvent, pgnSans, boardsOf };', ctx); return ctx.api;
}
const resp = (status, body) => ({ status, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
const input = (mode, state, user) => ({ trmnl: { system: { timestamp_utc: NOW }, state, plugin_settings: { custom_fields_values: { mode, follow_username: user } }, oauth: { access_token: 'SECRET-TOKEN' } } });
function router(map, calls) {
  return async (url, opts) => { (calls || []).push(url); const h = (opts && opts.headers) || {}; for (const k of Object.keys(map)) if (url.startsWith(k)) { const v = map[k]; return typeof v === 'function' ? v(url, h) : v; } return resp(599, {}); };
}
const TOP = () => ({ 'https://lichess.org/api/broadcast/top': resp(200, J('top_broadcast.json')), 'https://lichess.org/api/broadcast/-/-/rN4xYz01': resp(200, J('top_round.json')),
  'https://lichess.org/api/broadcast/-/-/clubR001': resp(200, (() => { const r = J('top_round.json'); r.round.id = 'clubR001'; r.games = r.games.filter((g) => g.id === 'g3LiveCD').map((g) => ({ ...g, id: 'cl1LiveX', players: g.players.map((p) => ({ ...p, rating: 2900 })) })); return r; })()), 'https://lichess.org/api/study/rN4xYz01/g2LiveAB.pgn': resp(200, T('top_pgn.pgn')),
  'https://lichess.org/api/tv/channels': resp(200, J('tv_channels.json')), 'https://lichess.org/game/export/tvBest01': resp(200, J('tv_game.json')) });
const FOLLOW = (game, status) => ({ 'https://lichess.org/api/user/KnightOwl/current-game': resp(status || 200, status ? {} : J(game || 'follow_game_playing.json')) });

test('top: the broadcast of the highest tier in play; its highest rated board still in play (not a finished or unstarted one)', async () => {
  const calls = [], o = await load(router(TOP(), calls)).run(input('top'));
  assert.strictEqual(o.mode, 'top'); assert.strictEqual(o.none, false); assert.strictEqual(o.instance, 'Top game · Example International');
  const g = o.puzzle.game;
  assert.strictEqual(o.puzzle.id, 'g2LiveAB'); assert.strictEqual(g.w.name, 'Alvarez, Pedro'); assert.strictEqual(g.b.title, 'IM'); assert.strictEqual(g.status, 'live');
  assert.strictEqual(g.round, 'Round 5 · Board 2'); assert.strictEqual(g.event, 'Example International');
  assert.strictEqual(o.puzzle.url, 'https://lichess.org/study/rN4xYz01/g2LiveAB');
  assert.deepStrictEqual([g.w.clock, g.b.clock], [276000, 171000]);
  assert.ok(!calls.some((u) => u.includes('bigR0001')), 'a round that is not in play is not asked');
  assert.ok(!calls.some((u) => u.includes('clubR001')), 'one request at a time: a lower tier is not asked once the highest has a board in play'); assert.notStrictEqual(o.puzzle.id, 'cl1LiveX', 'the tier outranks the rating: a 2900 board of tier 3 does not beat tier 4');
  assert.strictEqual(o.white_bottom, true);
});

test('top: cards run black first, the side to move is marked, clocks read like a board, the move list matches the board', async () => {
  const o = await load(router(TOP())).run(input('top'));
  assert.deepStrictEqual(Array.from(o.cards).map((c) => c.side), ['b', 'w']);
  assert.strictEqual(o.cards[1].mover, true); assert.strictEqual(o.cards[0].mover, false); assert.strictEqual(o.cards[1].sub, '2712');
  assert.strictEqual(o.cards[1].clock, '46:00'); assert.strictEqual(o.cards[0].clock, '28:30');
  assert.ok(o.rows.length >= 4 && o.rows.length <= 12); assert.ok(o.puzzle.moves.length > 8, 'the whole list is kept for the page');
  assert.strictEqual(o.status_text, 'Live');
  assert.ok(o.puzzle.from >= 0 && o.puzzle.to >= 0, 'last move marked');
});

test('top: a PGN that does not reach the board shown gives no move list (never a list that does not match), the board stays', async () => {
  const bad = T('top_pgn.pgn').replace('1. e4', '1. d4');
  const o = await load(router({ ...TOP(), 'https://lichess.org/api/study/rN4xYz01/g2LiveAB.pgn': resp(200, bad) })).run(input('top'));
  assert.strictEqual(o.none, false); assert.deepStrictEqual(Array.from(o.puzzle.moves), []); assert.strictEqual(o.rows.length, 0);
  const o2 = await load(router({ ...TOP(), 'https://lichess.org/api/study/rN4xYz01/g2LiveAB.pgn': resp(503, '') })).run(input('top'));
  assert.strictEqual(o2.none, false); assert.ok(Array.from(o2.problems).some((p) => /Lichess moves: HTTP 503/.test(p)), 'said on screen');
});

test('top: no broadcast in play: Lichess TV (classical only when strong), the game from its moves, no failure line', async () => {
  const none = { ...TOP(), 'https://lichess.org/api/broadcast/top': resp(200, J('top_broadcast_none.json')) };
  const calls = [], o = await load(router(none, calls)).run(input('top', undefined));
  assert.strictEqual(o.none, false); assert.strictEqual(o.instance, 'Top game · TV'); assert.strictEqual(o.puzzle.id, 'tvBest01');
  assert.strictEqual(o.puzzle.url, 'https://lichess.org/tvBest01'); assert.strictEqual(o.puzzle.game.event, 'Lichess TV'); assert.strictEqual(o.puzzle.game.round, 'Rapid 10+5');
  assert.strictEqual(o.puzzle.turn, 'w'); assert.strictEqual(o.problems, undefined);
  assert.ok(!calls.some((u) => /\/api\/broadcast\/-\/-\//.test(u)));
  const ch = J('tv_channels.json'); ch.classical.rating = 2300;
  const o2 = await load(router({ ...none, 'https://lichess.org/api/tv/channels': resp(200, ch), 'https://lichess.org/game/export/tvClas01': resp(200, { ...J('tv_game.json'), id: 'tvClas01' }) })).run(input('top'));
  assert.strictEqual(o2.puzzle.id, 'tvClas01', 'a strong classical game is preferred');
});

test('top: one call at a time, TV only when no broadcast board is in play; the token is sent and never leaves in the answer', async () => {
  const calls = [], seen = [];
  const o = await load(router({ ...TOP(), 'https://lichess.org/api/broadcast/top': (u, h) => { seen.push(h.Authorization); return resp(200, J('top_broadcast.json')); } }, calls)).run(input('top'));
  assert.strictEqual(calls[0], 'https://lichess.org/api/broadcast/top'); assert.ok(!calls.includes('https://lichess.org/api/tv/channels'), 'no TV call: ' + calls.join(' '));
  assert.deepStrictEqual(seen, ['Bearer SECRET-TOKEN']); assert.ok(!JSON.stringify(o).includes('SECRET-TOKEN'));
  assert.ok(JSON.stringify(o.trmnl_state).length < 7500);
});

test('top: everything failing: the saved game as "Offline" with the failure lines; with none saved a calm screen with the lines', async () => {
  const down = { 'https://lichess.org/api/broadcast/top': resp(503, {}), 'https://lichess.org/api/tv/channels': resp(503, {}) };
  const good = await load(router(TOP())).run(input('top'));
  const o = await load(router(down)).run(input('top', good.trmnl_state));
  assert.strictEqual(o.stale, true); assert.strictEqual(o.puzzle.id, 'g2LiveAB'); assert.strictEqual(o.status_text, 'Offline', 'a saved game is never called live'); assert.strictEqual(o.t.scan, 'Scan to watch'); assert.strictEqual(o.instance, 'Top game · Example International');
  assert.deepStrictEqual(Array.from(o.problems), ['Lichess broadcast: HTTP 503', 'Lichess TV: HTTP 503']);
  assert.deepStrictEqual(o.trmnl_state.tg, good.trmnl_state.tg, 'the saved game is kept for the next refresh');
  const c = await load(router(down)).run(input('top'));
  assert.strictEqual(c.none, true); assert.strictEqual(c.calm_line, 'Could not reach Lichess. Showing again at the next refresh.'); assert.strictEqual(c.problems.length, 2);
  const q = await load(router({ ...down, 'https://lichess.org/api/broadcast/top': resp(200, J('top_broadcast_none.json')), 'https://lichess.org/api/tv/channels': resp(200, {}) })).run(input('top'));
  assert.strictEqual(q.none, true); assert.strictEqual(q.t.none, 'No live game right now'); assert.strictEqual(q.problems, undefined, 'nothing live is not a failure');
});

test('top: boardsOf takes boards in play only, highest rated pair first', async () => {
  const api = load(router({}));
  const ids = Array.from(api.boardsOf(J('top_round.json').games)).map((x) => x.g.id);
  assert.deepStrictEqual(ids, ['g2LiveAB', 'g3LiveCD']);
});

test('follow: one call, the current-game of the player: a game in play with clocks, instance "Following <name>"', async () => {
  const calls = [], o = await load(router(FOLLOW(), calls)).run(input('following', undefined, 'KnightOwl'));
  assert.strictEqual(o.mode, 'following'); assert.strictEqual(o.instance, 'Following KnightOwl', 'the name as Lichess spells it'); assert.strictEqual(o.puzzle.id, 'fp1AbCdE');
  assert.strictEqual(o.puzzle.game.status, 'live'); assert.strictEqual(o.status_text, 'Live'); assert.strictEqual(o.puzzle.game.round, 'Playing now');
  assert.strictEqual(o.puzzle.game.b.name, 'KnightOwl'); assert.strictEqual(o.puzzle.game.event, 'KnightOwl · Blitz 5+3', 'the event line names the followed player');
  assert.strictEqual(calls.length, 1); assert.ok(calls[0].startsWith('https://lichess.org/api/user/KnightOwl/current-game?moves=true&clocks=true'));
  assert.strictEqual(o.puzzle.turn, 'w'); assert.ok(o.cards[1].clock !== '' && o.cards[0].clock !== '');
});

test('follow: the last game when not playing, said from the followed player\'s side', async () => {
  const o = await load(router(FOLLOW('follow_game_last.json'))).run(input('following', undefined, 'KnightOwl'));
  assert.strictEqual(o.puzzle.id, 'fl4StGmE'); assert.strictEqual(o.puzzle.game.status, 'done'); assert.strictEqual(o.status_text, 'Won'); assert.strictEqual(o.puzzle.game.round, 'Last game');
  assert.strictEqual(o.puzzle.game.res, '0-1'); assert.strictEqual(o.t.scan, 'Scan to watch');
  const row = J('follow_game_last.json'); row.winner = 'white';
  assert.strictEqual((await load(router({ 'https://lichess.org/api/user/KnightOwl/current-game': resp(200, row) })).run(input('following', undefined, 'KnightOwl'))).status_text, 'Lost');
  delete row.winner; row.status = 'draw';
  assert.strictEqual((await load(router({ 'https://lichess.org/api/user/KnightOwl/current-game': resp(200, row) })).run(input('following', undefined, 'KnightOwl'))).status_text, 'Draw');
});

test('follow: unknown user (404), bad name and empty field are calm screens (the empty field and a bad name make no call)', async () => {
  const calls = [];
  const e = await load(router(FOLLOW(), calls)).run(input('following', undefined, ''));
  assert.strictEqual(e.none, true); assert.strictEqual(e.t.none, 'Follow a player'); assert.strictEqual(calls.length, 0);
  const b = await load(router(FOLLOW(), calls)).run(input('following', undefined, 'a b/../c'));
  assert.strictEqual(b.t.none, 'Unknown player'); assert.strictEqual(calls.length, 0);
  const u = await load(router({ 'https://lichess.org/api/user/Nobody_Here/current-game': resp(404, { error: 'Not found' }) })).run(input('following', undefined, 'Nobody_Here'));
  assert.strictEqual(u.none, true); assert.strictEqual(u.t.none, 'Unknown player'); assert.strictEqual(u.instance, 'Following Nobody_Here'); assert.strictEqual(u.problems, undefined);
});

test('follow: a failed call is said on screen; the saved game of the same player stands in as offline, never another player\'s; else calm', async () => {
  const good = await load(router(FOLLOW())).run(input('following', undefined, 'KnightOwl'));
  const down = { 'https://lichess.org/api/user/': resp(503, {}) };
  const s = await load(router(down)).run(input('following', good.trmnl_state, 'KnightOwl'));
  assert.strictEqual(s.stale, true); assert.strictEqual(s.puzzle.id, 'fp1AbCdE'); assert.deepStrictEqual(Array.from(s.problems), ['Lichess game: HTTP 503']); assert.strictEqual(s.status_text, 'Offline');
  assert.deepStrictEqual(s.trmnl_state.fw, good.trmnl_state.fw, 'kept for the next refresh');
  const other = await load(router(down)).run(input('following', good.trmnl_state, 'SomeoneElse'));
  assert.strictEqual(other.none, true, 'a saved game of another player is never shown'); assert.strictEqual(other.t.none, 'No game to show'); assert.strictEqual(other.problems.length, 1);
});

test('follow: a variant game is not drawn (it does not replay to a standard board); said on screen', async () => {
  const v = { ...J('follow_game_playing.json'), variant: 'chess960' };
  const o = await load(router({ 'https://lichess.org/api/user/KnightOwl/current-game': resp(200, v) })).run(input('following', undefined, 'KnightOwl'));
  assert.strictEqual(o.none, true); assert.deepStrictEqual(Array.from(o.problems), ['Lichess game: not shown']);
});

test('live helpers: clock text, short event name, PGN movetext', () => {
  const api = load(router({}));
  assert.deepStrictEqual(['0', '4500', '119900', '540000', '1234500', null].map((c) => api.clockText(c === null ? null : +c)), ['0:00', '0:45', '19:59', '1:30:00', '3:25:45', '']);
  assert.strictEqual(api.shortEvent('FIDE World Senior Chess Championships 2026 | Open 50+', 24), 'FIDE World Senior Chess…');
  assert.strictEqual(api.shortEvent('German Bundesliga 2026/27 (Schachbundesliga)', 40), 'German Bundesliga (Schachbundesliga)');
  assert.deepStrictEqual(Array.from(api.pgnSans('[Event "x"]\n\n1. e4 { [%clk 1:00:00] } 1... e5 (1... c5) 2. Nf3 $1 { c } Nc6 1/2-1/2')), ['e4', 'e5', 'Nf3', 'Nc6']);
});

// Guard (2026-11-14, R4): the four view files hand the page only the variables listed in their `render "main"` line. The new modes' variables were
// missing from it once: the cards and the event card rendered empty. Every key the transform answers with, that the markup reads, must be listed.
test('every variable the markup reads from the answer is passed by all four view files', async () => {
  const markup = fs.readFileSync(path.join(__dirname, '../source/shared.liquid'), 'utf8').replace(/\{%-? comment -?%\}[\s\S]*?\{%-? endcomment -?%\}/g, '');
  const outs = [await load(router(TOP())).run(input('top')), await load(router(FOLLOW())).run(input('following', undefined, 'KnightOwl')), await load(router(FOLLOW())).run(input('top'))];
  const keys = new Set(outs.flatMap((o) => Object.keys(o)).filter((k) => k !== 'trmnl_state'));
  const read = [...keys].filter((k) => new RegExp('(?<![.\\w"-])' + k + '\\b(?![\\w"])').test(markup.replace(/"[^"]*"/g, '""')));
  assert.ok(read.includes('cards') && read.includes('event_name') && read.includes('status_text'), 'the scan sees the live variables: ' + read.join(','));
  for (const v of ['full', 'half_horizontal', 'half_vertical', 'quadrant']) {
    const line = fs.readFileSync(path.join(__dirname, '../plugin/src', v + '.liquid'), 'utf8'), passed = new Set([...line.matchAll(/(\w+): \w+/g)].map((m) => m[1]));
    const missing = read.filter((k) => !passed.has(k));
    assert.deepStrictEqual(missing, [], v + '.liquid does not pass: ' + missing.join(', '));
  }
});

test('top: a broadcast round call refused (403) while TV worked is no failure line; with no game on screen it is said', async () => {
  const r403 = { ...TOP(), 'https://lichess.org/api/broadcast/-/-/rN4xYz01': resp(403, {}), 'https://lichess.org/api/broadcast/-/-/clubR001': resp(403, {}) };
  const o = await load(router(r403)).run(input('top'));
  assert.strictEqual(o.none, false); assert.strictEqual(o.puzzle.id, 'tvBest01', 'TV stands in'); assert.strictEqual(o.problems, undefined, 'an optional step with a working fallback is not a failure line');
  const o2 = await load(router({ ...r403, 'https://lichess.org/api/tv/channels': resp(503, {}) })).run(input('top'));
  assert.ok(Array.from(o2.problems).includes('Lichess round: HTTP 403'), 'no game on screen: the failure is said');
});

test('top and follow: a 401 (expired or revoked token) shows the reconnect screen like the other modes (review item 3)', async () => {
  const t = await load(router({ 'https://lichess.org/api/broadcast/top': resp(401, {}), 'https://lichess.org/api/tv/channels': resp(401, {}) })).run(input('top'));
  assert.strictEqual(t.connect, true); assert.strictEqual(t.notice, t.t.tokbad); assert.strictEqual(t.instance, 'Connect account'); assert.ok(!t.puzzle);
  const f = await load(router({ 'https://lichess.org/api/user/KnightOwl/current-game': resp(401, {}) })).run(input('following', undefined, 'KnightOwl'));
  assert.strictEqual(f.connect, true); assert.strictEqual(f.notice, f.t.tokbad); assert.strictEqual(f.instance, 'Connect account'); assert.ok(!f.puzzle);
});

test('top and follow work without a Lichess login: data, no Authorization header, never the connect screen', async () => {
  for (const [mode, map] of [['top', TOP()], ['following', FOLLOW()]]) {
    const auth = [];
    const f = async (url, opts) => { auth.push(((opts && opts.headers) || {}).Authorization); return router(map)(url, opts); };
    const inp = input(mode, undefined, 'KnightOwl'); delete inp.trmnl.oauth;
    const o = await load(f).run(inp);
    assert.strictEqual(o.none, false, mode + ' shows a game'); assert.notStrictEqual(o.mode, 'connect');
    assert.ok(auth.length && auth.every((a) => a === undefined), mode + ' sends no Authorization header');
  }
});

test('names: Cyrillic and Greek are kept; a name or event in a script the font lacks falls back, never an empty or "," card', async () => {
  const api = load(router({}));
  assert.strictEqual(api.shortEvent('Чемпионат России 2026'), 'Чемпионат России');
  assert.strictEqual(api.shortEvent('全国象棋 2026'), 'Broadcast');
  const r = J('top_round.json'); r.games = r.games.map((g) => ({ ...g, players: [{ ...g.players[0], name: 'Непомнящий, Ян' }, { ...g.players[1], name: '丁立人' }] }));
  const o = await load(router({ ...TOP(), 'https://lichess.org/api/broadcast/-/-/rN4xYz01': resp(200, r) })).run(input('top'));
  assert.strictEqual(o.puzzle.game.w.name, 'Непомнящий, Ян'); assert.strictEqual(o.puzzle.game.b.name, 'Black');
});

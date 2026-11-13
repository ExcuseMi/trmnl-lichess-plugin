// Logic tests for the transform (node --test test/). The built bundle is what ships, so it is what is tested.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { bundle } = require('../tools/build.js');
const FX = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, '../plugin/tests/fixtures', n), 'utf8'));
const NOW = Date.UTC(2026, 10, 14, 10) / 1000;

function load(fetchImpl) {
  const ctx = { console, setTimeout, clearTimeout, AbortController, fetch: fetchImpl, JSON, Date, Promise, Math, Object, Array, String, Number, RegExp, Error, encodeURIComponent };
  vm.createContext(ctx);
  vm.runInContext(bundle() + '\n;this.api = { run, parseFen, lichessPosition, lichessModel, chesscomModel, accountFromActivity, shortThemes };', ctx);
  return ctx.api;
}
function resp(status, body) { return { status, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) }; }
function router(map, calls) {
  return async (url) => {
    (calls || []).push(url);
    for (const k of Object.keys(map)) if (url.startsWith(k)) { const v = map[k]; return typeof v === 'function' ? v(url) : v; }
    return resp(599, {});
  };
}
const input = (fields, state) => ({ trmnl: { system: { timestamp_utc: NOW }, state, plugin_settings: { custom_fields_values: fields } } });
const DAILY = FX('lichess_daily.json'), CC = FX('chesscom_daily.json');
const LIST = (n) => Array.from({ length: n }, (_, i) => i);

test('parseFen reads the start position and refuses bad input', () => {
  const api = load(async () => resp(599, {}));
  const p = api.parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  assert.strictEqual(p.board, 'rnbqkbnr' + 'pppppppp' + '.'.repeat(32) + 'PPPPPPPP' + 'RNBQKBNR');
  assert.strictEqual(p.turn, 'w');
  for (const bad of ['', 'x', '8/8/8/8/8/8/8 w', '9/8/8/8/8/8/8/8 w', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX w', '8/8/8/8/8/8/8/8 x']) assert.throws(() => api.parseFen(bad), bad);
});

test('PGN replay (chess.js) reaches the same position as the puzzle fen, last move included', () => {
  const api = load(async () => resp(599, {}));
  const a = api.lichessPosition(DAILY);
  const j = JSON.parse(JSON.stringify(DAILY)); delete j.puzzle.fen; delete j.puzzle.lastMove;
  const b = api.lichessPosition(j);
  assert.strictEqual(b.board, a.board); assert.strictEqual(b.turn, a.turn); assert.strictEqual(b.last, 'e7d8');
  j.game.pgn = 'e4 e5 Ke2 Qxx9'; j.puzzle.initialPly = 3;
  assert.throws(() => api.lichessPosition(j));   // an illegal move ends in an error, not a wrong board
});

test('daily models: Lichess and Chess.com', () => {
  const api = load(async () => resp(599, {}));
  const m = api.lichessModel(DAILY);
  assert.strictEqual(m.url, 'https://lichess.org/training/u3zfD'); assert.strictEqual(m.from, 12); assert.strictEqual(m.to, 3);
  assert.deepStrictEqual(Array.from(m.themes), ['Mate in 3', 'Exposed king']);
  const c = api.chesscomModel(CC);
  assert.strictEqual(c.turn, 'b'); assert.strictEqual(c.title, 'Shocking Reveal'); assert.strictEqual(c.url, 'https://www.chess.com/daily/2026-11-13');
  assert.throws(() => api.chesscomModel({ ...CC, url: 'https://evil.example/x' }));
});

test('run: Lichess daily, Chess.com daily, alternate by day', async () => {
  const f = router({ 'https://lichess.org/api/puzzle/daily': resp(200, DAILY), 'https://api.chess.com/pub/puzzle': resp(200, CC) });
  const api = load(f);
  assert.strictEqual((await api.run(input({ source: 'lichess' }))).puzzle.source, 'lichess');
  assert.strictEqual((await api.run(input({ source: 'chesscom' }))).puzzle.source, 'chesscom');
  const day = Math.floor(NOW / 86400) % 2 === 0 ? 'lichess' : 'chesscom';
  assert.strictEqual((await api.run(input({ source: 'alternate' }))).puzzle.source, day);
  const o = await api.run(input({ source: 'lichess', orientation: 'side' }));
  assert.strictEqual(o.white_bottom, true);
  assert.strictEqual((await api.run(input({ source: 'chesscom' }))).white_bottom, false);   // black to move: black at the bottom
});

test('run: service down keeps the last good puzzle (stale), or says there is none', async () => {
  const good = load(router({ 'https://lichess.org/api/puzzle/daily': resp(200, DAILY) }));
  const first = await good.run(input({}));
  const down = load(router({ 'https://lichess.org/api/puzzle/daily': resp(503, {}) }));
  const again = await down.run(input({}, first.trmnl_state));
  assert.strictEqual(again.stale, true); assert.strictEqual(again.puzzle.id, 'u3zfD');
  const none = await down.run(input({}, {}));
  assert.strictEqual(none.none, true); assert.ok(none.trmnl_state);
  const junk = await load(router({ 'https://lichess.org/api/puzzle/daily': resp(200, 'not json') })).run(input({}));
  assert.strictEqual(junk.none, true);
});

const ACCOUNT = { username: 'Demo', perfs: { puzzle: { rating: 1873 } } };
const NEXT = DAILY, NEXT2 = { ...DAILY, puzzle: { ...DAILY.puzzle, id: 'zzz99' } };
const act = (rows) => rows.map((r) => JSON.stringify(r)).join('\n');
function account(extra, calls) {
  return router({ 'https://lichess.org/api/account': resp(200, ACCOUNT), 'https://lichess.org/api/puzzle/activity': resp(200, act([])), 'https://lichess.org/api/user/Demo/rating-history': resp(200, [{ name: 'Puzzles', points: LIST(5).map((i) => [2026, 10, 1 + i, 1800 + i]) }]),
    'https://lichess.org/api/puzzle/next': resp(200, NEXT), 'https://lichess.org/api/puzzle/daily': resp(200, DAILY), ...extra }, calls);
}

test('token: next puzzle at the user level, progress, token never in output or calls other than the header', async () => {
  const seen = [];
  const f = async (url, opt) => { seen.push([url, (opt.headers || {}).Authorization]); return account({})(url, opt); };
  const api = load(f);
  const o = await api.run(input({ lichess_token: 'SECRET', difficulty: 'harder' }));
  assert.strictEqual(o.puzzle.id, 'u3zfD'); assert.strictEqual(o.account.rating, 1873); assert.strictEqual(o.account.history.length, 5);
  assert.ok(seen.some(([u]) => u.includes('puzzle/next?difficulty=harder')));
  assert.ok(seen.every(([u, a]) => !u.includes('SECRET') && a === 'Bearer SECRET'));
  assert.ok(!JSON.stringify(o).includes('SECRET'));
  assert.strictEqual(o.trmnl_state.cur.id, 'u3zfD'); assert.strictEqual(o.trmnl_state.cur.r0, 1873);
});

test('token from the OAuth connection works like the pasted token', async () => {
  const seen = [];
  const f = async (url, opt) => { seen.push((opt.headers || {}).Authorization); return account({})(url, opt); };
  const i = input({}); i.trmnl.oauth = { access_token: 'OAUTHTOK' };
  const o = await load(f).run(i);
  assert.ok(o.account); assert.ok(seen.includes('Bearer OAUTHTOK'));
});

test('the shown puzzle stays until solved, then Solved + change and the next puzzle', async () => {
  const st = { rating: 1861, cur: { id: 'u3zfD', t: NOW - 3600, r0: 1861 } };
  const first = await load(account({})).run(input({ lichess_token: 't' }, { rating: 1861 }));
  const withLast = { ...st, last: first.trmnl_state.last };
  const calls = [];
  const kept = await load(account({}, calls)).run(input({ lichess_token: 't' }, withLast));
  assert.strictEqual(kept.puzzle.id, 'u3zfD'); assert.ok(!calls.some((u) => u.includes('puzzle/next'))); assert.strictEqual(kept.banner, '');
  assert.strictEqual(kept.account.trend, 'up'); assert.strictEqual(kept.account.delta, 12);
  const solved = await load(account({ 'https://lichess.org/api/puzzle/activity': resp(200, act([{ date: NOW * 1000, win: true, puzzle: { id: 'u3zfD' } }])), 'https://lichess.org/api/puzzle/next': resp(200, NEXT2) }))
    .run(input({ lichess_token: 't' }, withLast));
  assert.strictEqual(solved.banner, 'Solved! +12'); assert.strictEqual(solved.puzzle.id, 'zzz99'); assert.strictEqual(solved.trmnl_state.cur.id, 'zzz99');
  const failedOnly = await load(account({ 'https://lichess.org/api/puzzle/activity': resp(200, act([{ date: NOW * 1000, win: false, puzzle: { id: 'u3zfD' } }])) })).run(input({ lichess_token: 't' }, withLast));
  assert.strictEqual(failedOnly.puzzle.id, 'u3zfD'); assert.strictEqual(failedOnly.banner, '');   // a failed try is not solved
  const old = await load(account({ 'https://lichess.org/api/puzzle/next': resp(200, NEXT2) })).run(input({ lichess_token: 't' }, { ...withLast, cur: { ...st.cur, t: NOW - 90000 } }));
  assert.strictEqual(old.puzzle.id, 'zzz99');   // 24 hours: the next one
});

test('token rejected (401) shows the message and falls back to the daily puzzle', async () => {
  const f = account({ 'https://lichess.org/api/account': resp(401, { error: 'no' }) });
  const o = await load(f).run(input({ lichess_token: 'bad' }));
  assert.strictEqual(o.notice, 'Lichess login invalid'); assert.strictEqual(o.puzzle.source, 'lichess'); assert.strictEqual(o.account, null);
  const o2 = await load(account({ 'https://lichess.org/api/puzzle/next': resp(401, {}) })).run(input({ lichess_token: 'bad' }));
  assert.strictEqual(o2.notice, 'Lichess login invalid');
});

test('token path with the account service down still shows a puzzle', async () => {
  const f = account({ 'https://lichess.org/api/account': resp(500, {}), 'https://lichess.org/api/puzzle/activity': resp(500, {}), 'https://lichess.org/api/user/Demo/rating-history': resp(500, {}) });
  const o = await load(f).run(input({ lichess_token: 't' }));
  assert.ok(o.puzzle && !o.none);
});

test('Chess.com username adds the tactics rating; a bad name or a failed call adds nothing', async () => {
  const f = router({ 'https://api.chess.com/pub/puzzle': resp(200, CC), 'https://api.chess.com/pub/player/demo/stats': resp(200, { tactics: { highest: { rating: 1456 } } }) });
  const o = await load(f).run(input({ source: 'chesscom', chesscom_user: 'Demo' }));
  assert.strictEqual(o.account.rating, 1456);
  const f2 = router({ 'https://api.chess.com/pub/puzzle': resp(200, CC), 'https://api.chess.com/pub/player/': resp(404, {}) });
  assert.strictEqual((await load(f2).run(input({ source: 'chesscom', chesscom_user: 'Demo' }))).account, null);
  assert.strictEqual((await load(f2).run(input({ source: 'chesscom', chesscom_user: '../x' }))).account, null);
});

test('activity: today, week, streak, seven day bars', () => {
  const api = load(async () => resp(599, {}));
  const t = NOW * 1000, d = 86400000;
  const a = api.accountFromActivity([{ date: t, win: true }, { date: t - 1000, win: true }, { date: t - 2000, win: false }, { date: t - d, win: true }, { date: t - 9 * d, win: true }], NOW);
  assert.strictEqual(a.today, 2); assert.strictEqual(a.week, 3); assert.strictEqual(a.streak, 2);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(a.days[6])), { s: 2, f: 1 }); assert.deepStrictEqual(JSON.parse(JSON.stringify(a.days[5])), { s: 1, f: 0 });
});

test('state stays under TRMNL limit', async () => {
  const o = await load(account({})).run(input({ lichess_token: 't' }));
  assert.ok(JSON.stringify(o.trmnl_state).length < 8000);
});

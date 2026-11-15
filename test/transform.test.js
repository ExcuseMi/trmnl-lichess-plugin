// Logic tests for the transform (node --test test/). The built bundle is what ships, so it is what is tested.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { bundle, minified, checkBudget, BUDGET } = require('../tools/build.js');
const FX = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, '../plugin/tests/fixtures', n), 'utf8'));
const NOW = Date.UTC(2026, 10, 14, 10) / 1000;

function load(fetchImpl, code) {
  const ctx = { console, setTimeout, clearTimeout, AbortController, fetch: fetchImpl, JSON, Date, Promise, Math, Object, Array, String, Number, RegExp, Error, encodeURIComponent };
  vm.createContext(ctx);
  vm.runInContext((code || bundle()) + '\n;this.api = { PROVIDERS, run, parseFen, lichessPosition, lichessModel, lichessMoves, modeInstance, MODES, shortThemes, timeLeft, gamesToMove, lastGameLine, pickWeakest };', ctx);
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
// A Lichess login is the OAuth connection only: `lichess_token` here is test shorthand for trmnl.oauth.access_token, never a field.
const input = (fields, state) => {
  const { lichess_token: tok, ...rest } = fields || {};
  return { trmnl: { system: { timestamp_utc: NOW }, state, plugin_settings: { custom_fields_values: rest }, ...(tok ? { oauth: { access_token: tok } } : {}) } };
};
const DAILY = FX('lichess_daily.json');
const LIST = (n) => Array.from({ length: n }, (_, i) => i);

test('daily model: Lichess', () => {
  const api = load(async () => resp(599, {}));
  const m = api.lichessModel(DAILY);
  assert.strictEqual(m.url, 'https://lichess.org/training/u3zfD'); assert.strictEqual(m.from, 12); assert.strictEqual(m.to, 3);
  assert.deepStrictEqual(Array.from(m.themes), ['Mate in 3', 'Exposed king']);
});

test('without a Lichess login: the connect screen, no puzzle and no call (OAuth is required, owner 2026-11-14)', async () => {
  const calls = [];
  const o = await load(router({}, calls)).run(input({ source: 'chesscom', chesscom_user: 'demo' }));
  assert.strictEqual(o.connect, true); assert.strictEqual(o.puzzle, undefined); assert.strictEqual(calls.length, 0);
  assert.strictEqual(o.t.connect_line, 'Connect your Lichess account on the plugin settings page.');
});

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

test('moves before the puzzle: pairs from the PGN up to initialPly, ending with the move shown on the board', () => {
  const api = load(async () => resp(599, {}));
  const m = api.lichessMoves(DAILY);
  assert.strictEqual(m.length, 30);   // the last 30 pairs only
  assert.deepStrictEqual(Array.from(m[m.length - 1]), [38, 'd6+', 'Kd8']);   // Kd8 is e7d8, the highlighted last move
  assert.deepStrictEqual(Array.from(m[0]), [9, 'Bc2', 'b5']);
  const odd = JSON.parse(JSON.stringify(DAILY)); odd.puzzle.initialPly = 4; delete odd.puzzle.fen;
  assert.deepStrictEqual(Array.from(api.lichessMoves(odd), (x) => Array.from(x)), [[1, 'd4', 'Nf6'], [2, 'Nf3', 'e6'], [3, 'Bg5', '']]);
  // never a list that does not match the board: a fen from another position, an illegal move, no PGN
  const other = JSON.parse(JSON.stringify(DAILY)); other.puzzle.initialPly = 73;
  assert.deepStrictEqual(Array.from(api.lichessMoves(other)), []);
  const bad = JSON.parse(JSON.stringify(DAILY)); bad.game.pgn = 'e4 e5 Ke2 Qxx9'; bad.puzzle.initialPly = 3; delete bad.puzzle.fen;
  assert.deepStrictEqual(Array.from(api.lichessMoves(bad)), []);
  assert.deepStrictEqual(Array.from(api.lichessMoves({ puzzle: { initialPly: 3 }, game: {} })), []);
  assert.deepStrictEqual(Array.from(api.lichessModel(DAILY).moves).length, 30);
});

test('the game a puzzle comes from: clock and kind, both players white first, cleaned; nothing from a bad game', () => {
  const api = load(async () => resp(599, {}));
  const g = api.lichessModel(DAILY).game;
  assert.strictEqual(g.kind, '3+0 Blitz');
  assert.deepStrictEqual(Array.from(g.players, (x) => Array.from(x)), [['w', 'w', 2064], ['b', 'b', 2049]]);
  const j = JSON.parse(JSON.stringify(DAILY)); j.game.players.reverse(); j.game.players[0].name = '<b>x</b>\u0007'; j.game.clock = 'evil';
  const h = api.lichessModel(j).game;
  assert.strictEqual(h.players[0][0], 'w'); assert.strictEqual(h.players[1][1], '<b>x</b>');   // control characters go; markup is escaped by the page assert.strictEqual(h.kind, 'Blitz');
  const k = JSON.parse(JSON.stringify(DAILY)); k.game = 'x';
  assert.strictEqual(api.lichessModel(k).game, null);
});

test('run: service down keeps the last good puzzle (stale), or says there is none', async () => {
  const first = await load(account({})).run(input({ lichess_token: 't' }));
  const down = load(account({ 'https://lichess.org/api/puzzle/next': resp(503, {}) }));
  const again = await down.run(input({ lichess_token: 't' }, { ...first.trmnl_state, cur: undefined }));   // no puzzle kept: a new one is due
  assert.strictEqual(again.stale, true); assert.strictEqual(again.puzzle.id, 'u3zfD');
  const none = await down.run(input({ lichess_token: 't' }, {}));
  assert.strictEqual(none.none, true); assert.ok(none.trmnl_state); assert.ok(!none.connect);
  const junk = await load(account({ 'https://lichess.org/api/puzzle/next': resp(200, 'not json') })).run(input({ lichess_token: 't' }));
  assert.strictEqual(junk.none, true);
});

const ACCOUNT = { username: 'Demo', perfs: { puzzle: { rating: 1873 } } };
const NEXT = DAILY, NEXT2 = { ...DAILY, puzzle: { ...DAILY.puzzle, id: 'zzz99' } };
const act = (rows) => rows.map((r) => JSON.stringify(r)).join('\n');
// GET /api/user/{name}/activity: one entry per day, newest first; today 2 solved 1 failed (1861 -> 1873), two days ago 1 solved.
const DAY = 86400000, D0 = Math.floor(NOW / 86400) * DAY;
const WEEK = [{ interval: { start: D0, end: D0 + DAY }, puzzles: { score: { win: 2, loss: 1, draw: 0, rp: { before: 1861, after: 1873 } } } },
  { interval: { start: D0 - DAY, end: D0 } },
  { interval: { start: D0 - 2 * DAY, end: D0 - DAY }, puzzles: { score: { win: 1, loss: 0, draw: 0, rp: { before: 1850, after: 1861 } } } }];
function account(extra, calls) {
  return router({ 'https://lichess.org/api/account': resp(200, ACCOUNT), 'https://lichess.org/api/puzzle/activity': resp(200, act([])), 'https://lichess.org/api/user/Demo/rating-history': resp(200, [{ name: 'Puzzles', points: LIST(5).map((i) => [2026, 10, 1 + i, 1800 + i]) }]),
    'https://lichess.org/api/puzzle/next': resp(200, NEXT), 'https://lichess.org/api/puzzle/daily': resp(200, DAILY),
    'https://lichess.org/api/token/test': resp(200, { t: { scopes: 'puzzle:read', userId: 'demo', expires: null } }),
    'https://lichess.org/api/user/Demo/activity': resp(200, WEEK), ...extra }, calls);
}

test('token: next puzzle at the user level, progress, token never in output or calls other than the header', async () => {
  const seen = [];
  const f = async (url, opt) => { seen.push([url, (opt.headers || {}).Authorization, opt.body]); return account({})(url, opt); };
  const api = load(f);
  const o = await api.run(input({ lichess_token: 'SECRET', difficulty: 'harder' }));
  assert.strictEqual(o.puzzle.id, 'u3zfD'); assert.strictEqual(o.account.rating, 1873); assert.strictEqual(o.account.history.length, 5);
  assert.ok(seen.some(([u]) => u.includes('puzzle/next?difficulty=harder')));
  // the token only in the Authorization header, or as the body of the scope check (POST /api/token/test), never in a URL;
  // the public per-day activity goes without it
  assert.ok(seen.every(([u, a, b]) => !u.includes('SECRET') && (u === 'https://lichess.org/api/token/test' ? b === 'SECRET' && !a : u.endsWith('/activity') && u.includes('/api/user/') ? !a : a === 'Bearer SECRET')));
  assert.ok(!JSON.stringify(o).includes('SECRET'));
  assert.strictEqual(o.trmnl_state.cur.id, 'u3zfD'); assert.strictEqual(o.trmnl_state.cur.r0, 1873);
});

test('a token in the settings is ignored: the login is the OAuth connection only', async () => {
  const seen = [];
  const f = async (url, opt) => { seen.push((opt.headers || {}).Authorization); return account({})(url, opt); };
  const i = { trmnl: { system: { timestamp_utc: NOW }, plugin_settings: { custom_fields_values: { lichess_token: 'PASTED' } } } };
  const o = await load(f).run(i);
  assert.ok(!o.account); assert.ok(!seen.some(Boolean));
});

test('token from the OAuth connection: progress and personal puzzle', async () => {
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
  // the next puzzle is asked for side by side with the solved check (TRMNL's 5 s leave no time for one after the other); the kept one shows
  assert.strictEqual(kept.puzzle.id, 'u3zfD'); assert.strictEqual(kept.trmnl_state.cur.id, 'u3zfD'); assert.strictEqual(kept.banner, '');
  assert.strictEqual(kept.account.trend, 'up'); assert.strictEqual(kept.account.delta, 12);
  const solved = await load(account({ 'https://lichess.org/api/puzzle/activity': resp(200, act([{ date: NOW * 1000, win: true, puzzle: { id: 'u3zfD' } }])), 'https://lichess.org/api/puzzle/next': resp(200, NEXT2) }))
    .run(input({ lichess_token: 't' }, withLast));
  assert.strictEqual(solved.banner, 'Solved! +12'); assert.strictEqual(solved.puzzle.id, 'zzz99'); assert.strictEqual(solved.trmnl_state.cur.id, 'zzz99');
  const failedOnly = await load(account({ 'https://lichess.org/api/puzzle/activity': resp(200, act([{ date: NOW * 1000, win: false, puzzle: { id: 'u3zfD' } }])) })).run(input({ lichess_token: 't' }, withLast));
  assert.strictEqual(failedOnly.puzzle.id, 'u3zfD'); assert.strictEqual(failedOnly.banner, '');   // a failed try is not solved
  const old = await load(account({ 'https://lichess.org/api/puzzle/next': resp(200, NEXT2) })).run(input({ lichess_token: 't' }, { ...withLast, cur: { ...st.cur, t: NOW - 90000 } }));
  assert.strictEqual(old.puzzle.id, 'zzz99');   // 24 hours: the next one
});

test('token rejected (401): the connect screen with "reconnect", no puzzle', async () => {
  const f = account({ 'https://lichess.org/api/account': resp(401, { error: 'no' }) });
  const o = await load(f).run(input({ lichess_token: 'bad' }));
  assert.strictEqual(o.connect, true); assert.match(o.notice, /reconnect/); assert.strictEqual(o.puzzle, undefined);
  const o2 = await load(account({ 'https://lichess.org/api/puzzle/next': resp(401, {}) })).run(input({ lichess_token: 'bad' }));
  assert.strictEqual(o2.connect, true);
});

test('token path with the account service down still shows a puzzle', async () => {
  const f = account({ 'https://lichess.org/api/account': resp(500, {}), 'https://lichess.org/api/puzzle/activity': resp(500, {}), 'https://lichess.org/api/user/Demo/rating-history': resp(500, {}) });
  const o = await load(f).run(input({ lichess_token: 't' }));
  assert.ok(o.puzzle && !o.none);
});

test('state stays under TRMNL limit', async () => {
  const o = await load(account({})).run(input({ lichess_token: 't' }));
  assert.ok(JSON.stringify(o.trmnl_state).length < 8000);
  assert.strictEqual(o.trmnl_state.last.moves.length, 30);   // the moves survive in the saved puzzle (offline shows them too)
});

// ---- providers, one by one, with fixture JSON through a mocked fetch
const ctxOf = (api, extra) => ({ settings: { difficulty: 'normal' }, token: '', state: {}, nowS: NOW, cache: {}, diag: {}, ...extra });

test('provider lichess: capabilities follow the login; daily without, personal with', async () => {
  const api = load(account({}));
  const p = api.PROVIDERS.lichess;
  assert.deepStrictEqual(JSON.parse(JSON.stringify(p.active(ctxOf(api)))), { personalPuzzles: false, solvedCheck: false, ratingHistory: false, streak: false });
  assert.strictEqual(p.active(ctxOf(api, { token: 't' })).solvedCheck, true);
  assert.strictEqual((await p.fetchPuzzle(ctxOf(api))).id, 'u3zfD');
  assert.strictEqual(await p.fetchProgress(ctxOf(api)), null);
});

test('provider lichess: progress, solved check, one activity call per run', async () => {
  const calls = [];
  const rows = [{ date: NOW * 1000, win: true, puzzle: { id: 'a1' } }, { date: NOW * 1000 - 1, win: false, puzzle: { id: 'b2' } }];
  const api = load(account({ 'https://lichess.org/api/puzzle/activity': resp(200, act(rows)) }, calls));
  const p = api.PROVIDERS.lichess, ctx = ctxOf(api, { token: 't' });
  const pr = await p.fetchProgress(ctx);
  assert.strictEqual(pr.rating, 1873); assert.strictEqual(pr.today, 2);   // today from the week (WEEK), not from the puzzle list assert.strictEqual(pr.history.length, 5); assert.strictEqual(pr.days.length, 7);
  assert.strictEqual(await p.isSolved('a1', ctx), true); assert.strictEqual(await p.isSolved('b2', ctx), false); assert.strictEqual(await p.isSolved('zz', ctx), false);
  assert.strictEqual(calls.filter((u) => u.includes('puzzle/activity')).length, 1);
  await assert.rejects(load(account({ 'https://lichess.org/api/account': resp(401, {}) })).PROVIDERS.lichess.fetchProgress(ctxOf(api, { token: 'bad' })), (e) => e.status === 401);
});

test('run hands the view the capability flags with a login; without one only the connect screen', async () => {
  const withTok = await load(account({})).run(input({ lichess_token: 't' }));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(withTok.caps)), { personal: true, solved: true, history: true, streak: true });
  const without = await load(account({})).run(input({}));
  assert.strictEqual(without.connect, true); assert.strictEqual(without.caps, undefined);
});

test('Lichess calls start side by side: activity, scopes, account and the next puzzle are all asked before any answers', async () => {
  const started = [], waiters = [];
  const base = account({});
  const f = (url, opt) => { started.push(url.split('?')[0]); return new Promise((res) => waiters.push(() => res(base(url, opt)))); };
  const p = load(f).run(input({ lichess_token: 't' }));
  await new Promise((r) => setTimeout(r, 20));
  for (const u of ['https://lichess.org/api/puzzle/activity', 'https://lichess.org/api/token/test', 'https://lichess.org/api/account', 'https://lichess.org/api/puzzle/next']) assert.ok(started.includes(u), u + ' started at once');
  const flush = setInterval(() => { while (waiters.length) waiters.shift()(); }, 5);
  const o = await p; clearInterval(flush);
  assert.strictEqual(o.puzzle.id, 'u3zfD');
});

test('week: from the public per-day activity (fast); a failed call reuses the saved week, never 0 solved, and says so on screen', async () => {
  const good = await load(account({})).run(input({ lichess_token: 't' }));
  assert.strictEqual(good.account.days[6].s, 2); assert.strictEqual(good.account.days[6].f, 1); assert.strictEqual(good.account.days[4].s, 1);
  assert.strictEqual(good.account.week, 3); assert.deepStrictEqual(Array.from(good.account.recent), [12, 11]);   // rating change per day, newest first
  assert.strictEqual(good.problems, undefined); assert.ok(good.trmnl_state.wk.d.length >= 2);
  // chips and counts cover the same 7 days: a day 9 days back (+87) is in neither (seen on the live screen 2026-11-14)
  const old = [...WEEK, { interval: { start: D0 - 9 * DAY, end: D0 - 8 * DAY }, puzzles: { score: { win: 5, loss: 0, draw: 0, rp: { before: 1700, after: 1787 } } } }];
  const o2 = await load(account({ 'https://lichess.org/api/user/Demo/activity': resp(200, old) })).run(input({ lichess_token: 't' }));
  assert.deepStrictEqual(Array.from(o2.account.recent), [12, 11]); assert.strictEqual(o2.account.week, 3);
  const down = await load(account({ 'https://lichess.org/api/user/Demo/activity': resp(429, '') })).run(input({ lichess_token: 't' }, good.trmnl_state));
  assert.strictEqual(down.account.days[6].s, 2, 'saved week, not 0'); assert.deepStrictEqual(Array.from(down.problems), ['Lichess activity: HTTP 429']);
  assert.deepStrictEqual(down.trmnl_state.wk, good.trmnl_state.wk, 'the saved week is kept, not overwritten by nothing');
  const thrown = await load(account({ 'https://lichess.org/api/user/Demo/activity': () => { throw Object.assign(new Error('aborted'), { name: 'AbortError' }); } })).run(input({ lichess_token: 't' }, good.trmnl_state));
  assert.strictEqual(thrown.account.days[6].s, 2); assert.deepStrictEqual(Array.from(thrown.problems), ['Lichess activity: timeout']);
  const empty = await load(account({ 'https://lichess.org/api/user/Demo/activity': resp(200, [{ interval: { start: D0, end: D0 + DAY } }]) })).run(input({ lichess_token: 't' }));
  assert.deepStrictEqual(Array.from(empty.problems), ['Lichess activity: 0 puzzles this week']);
  const slowPuzzles = await load(account({ 'https://lichess.org/api/puzzle/activity': () => { throw Object.assign(new Error('aborted'), { name: 'AbortError' }); } })).run(input({ lichess_token: 't' }));
  assert.strictEqual(slowPuzzles.problems, undefined, 'the optional puzzle activity never shows as a failure'); assert.strictEqual(slowPuzzles.account.week, 3);
  const acctDown = await load(account({ 'https://lichess.org/api/account': resp(500, {}) })).run(input({ lichess_token: 't' }));
  assert.ok(Array.from(acctDown.problems).includes('Lichess account: HTTP 500'));
});

test('a token without puzzle:read says so on screen: Reconnect Lichess', async () => {
  const o = await load(account({ 'https://lichess.org/api/token/test': resp(200, { t: { scopes: 'email:read', userId: 'demo' } }) })).run(input({ lichess_token: 't' }));
  assert.strictEqual(o.notice, 'Reconnect Lichess: missing puzzle permission');
  const ok = await load(account({})).run(input({ lichess_token: 't' }));
  assert.strictEqual(ok.notice, '');
  const unknown = await load(account({ 'https://lichess.org/api/token/test': resp(500, '') })).run(input({ lichess_token: 't' }));
  assert.strictEqual(unknown.notice, '', 'no scope answer: no claim');
});

test('title bar modes come from one table: Puzzles (with the theme), Connect account, and the reserved modes', async () => {
  const api = load(async () => resp(599, {}));
  assert.strictEqual(api.modeInstance('puzzles'), 'Puzzles'); assert.strictEqual(api.modeInstance('connect'), 'Connect account');
  assert.strictEqual(api.modeInstance('games'), 'Your games'); assert.strictEqual(api.modeInstance('top'), 'Top game');
  assert.strictEqual(api.modeInstance('following', 'DrNykterstein'), 'Following DrNykterstein');
  const o = await load(account({})).run(input({ lichess_token: 't' }));
  assert.strictEqual(o.instance, 'Puzzles'); assert.strictEqual(o.instance_long, 'Puzzles · Mate in 3');
  const c = await load(account({})).run(input({}));
  assert.strictEqual(c.instance, 'Connect account');
});

// ==== "Your games" mode (mode = games, source/games.js)
const GFX = (n) => FX(n);
const GAME_EXPORT = GFX('games_export.json');
const LAST = fs.readFileSync(path.join(__dirname, '../plugin/tests/fixtures/games_last.ndjson'), 'utf8');
function games(extra, calls, playing) {
  return router({ 'https://lichess.org/api/account/playing': resp(200, GFX(playing || 'games_playing_one.json')), 'https://lichess.org/api/account': resp(200, ACCOUNT),
    'https://lichess.org/game/export/': resp(200, GAME_EXPORT), 'https://lichess.org/api/games/user/Demo': resp(200, LAST), ...extra }, calls);
}
const gin = (extra) => input({ lichess_token: 'SECRET', mode: 'games', ...(extra || {}) });

test('games: your turn: the game, the user side, opponent, time left, the moves, the QR target; no puzzle calls', async () => {
  const calls = [], seen = [];
  const f = async (url, opt) => { seen.push([url, (opt.headers || {}).Authorization, opt.body]); return games({}, calls, 'games_playing_one.json')(url, opt); };
  const o = await load(f).run(gin());
  assert.strictEqual(o.mode, 'games'); assert.strictEqual(o.instance, 'Your games'); assert.strictEqual(o.none, false);
  assert.strictEqual(o.puzzle.id, 'aB3dE5fG'); assert.strictEqual(o.puzzle.url, 'https://lichess.org/aB3dE5fG'); assert.strictEqual(o.puzzle.turn, 'w'); assert.strictEqual(o.white_bottom, true);
  assert.strictEqual(o.puzzle.to, 4, 'last move f8e8 outlined on e8'); assert.strictEqual(o.puzzle.game.opp, 'Magnus_C'); assert.strictEqual(o.puzzle.game.opp_rating, 1812);
  assert.strictEqual(o.puzzle.game.left, '2d 3h'); assert.strictEqual(o.time_value_short, '2d'); assert.strictEqual(o.opp_line, 'Magnus_C (1812)'); assert.strictEqual(o.find, 'Play white');
  assert.strictEqual(o.rows.length, 8); assert.strictEqual(o.rows[7].n, 12); assert.ok(o.rows[7].hb, 'the last move (black) is the marked one');
  assert.strictEqual(o.more_line, ''); assert.strictEqual(o.problems, undefined); assert.strictEqual(o.t.scan, 'Scan to play');
  assert.ok(!calls.some((u) => /puzzle|rating-history|activity|token\/test/.test(u)), 'no puzzle calls in games mode: ' + calls.join(' '));
  seen.forEach(([u, a, b]) => { assert.ok(!u.includes('SECRET') && !String(b || '').includes('SECRET')); assert.strictEqual(a, 'Bearer SECRET'); });
  assert.ok(!JSON.stringify(o).includes('SECRET'));
});

test('games: several: least time left first, only correspondence, "N more games waiting"; played as black turns the board', async () => {
  const o = await load(games({}, [], 'games_playing_many.json')).run(gin());
  assert.strictEqual(o.puzzle.id, 'aB3dE5fG'); assert.strictEqual(o.puzzle.game.left, '8h 20m'); assert.strictEqual(o.white_bottom, false); assert.strictEqual(o.puzzle.turn, 'b');
  assert.strictEqual(o.more_line, '2 more games waiting'); assert.strictEqual(o.more_short, '+2 waiting');
  const api = load(async () => resp(599, {}));
  const live = { ...GFX('games_playing_many.json').nowPlaying[0], speed: 'blitz', secondsLeft: 5 };
  assert.deepStrictEqual(Array.from(api.gamesToMove([live, ...GFX('games_playing_many.json').nowPlaying]).map((g) => g.gameId)), ['aB3dE5fG', 'zZ9yY8xX', 'kK1jJ2iI'], 'blitz is not a game to move on; the rest sorted by time left');
  const noClock = { ...GFX('games_playing_one.json').nowPlaying[0], secondsLeft: undefined };
  assert.strictEqual(api.gamesToMove([noClock, GFX('games_playing_many.json').nowPlaying[0]])[1].secondsLeft === undefined, true, 'no clock last');
  const one = await load(games({}, [], 'games_playing_one.json')).run(gin()); assert.strictEqual(one.more_line, '');
});

test('games: opponent to move: the first such game like the normal view, "Their turn", N waiting for opponents; no ongoing game: the last finished game with its result; nothing at all: calm', async () => {
  const w = await load(games({}, [], 'games_playing_none.json')).run(gin());
  assert.strictEqual(w.none, false); assert.strictEqual(w.puzzle.game.phase, 'wait'); assert.strictEqual(w.heading, 'Their turn'); assert.strictEqual(w.find, 'Waiting for Bob_W');
  assert.strictEqual(w.more_line, '1 game waiting for opponents'); assert.strictEqual(w.more_short, '1 waiting'); assert.strictEqual(w.t.scan, 'Scan to play'); assert.strictEqual(w.puzzle.moves.length, 12);
  assert.strictEqual(w.time_label, 'Waiting for'); assert.strictEqual(w.time_value, 'Bob_W'); assert.strictEqual(w.time_value_short, 'Bob_W'); assert.strictEqual(w.puzzle.url, 'https://lichess.org/mM4nN5oO');
  const turn = await load(games({}, [], 'games_playing_many.json')).run(gin()); assert.strictEqual(turn.puzzle.game.phase, 'turn', 'a game to move on comes before one the opponent is to move in');
  const l = await load(games({}, [], 'games_playing_empty.json')).run(gin());
  assert.strictEqual(l.none, false); assert.strictEqual(l.puzzle.game.phase, 'last'); assert.strictEqual(l.heading, 'Last game'); assert.strictEqual(l.find, 'vs Rival_X (1720)'); assert.strictEqual(l.time_sub, 'in 12 moves'); assert.strictEqual(l.show_info, false, 'no vs/kind card repeating the header'); assert.strictEqual(l.puzzle.game.result_line, 'Won against Rival_X');
  assert.strictEqual(l.puzzle.url, 'https://lichess.org/'); assert.strictEqual(l.t.scan, 'Scan to play'); assert.strictEqual(l.time_value, 'Won'); assert.strictEqual(l.puzzle.moves.length, 12); assert.strictEqual(l.trmnl_state.gm, undefined, 'a finished game is never saved as the game to show offline');
  const none = await load(games({ 'https://lichess.org/api/games/user/Demo': resp(200, '') }, [], 'games_playing_empty.json')).run(gin());
  assert.strictEqual(none.none, true); assert.strictEqual(none.calm, true); assert.strictEqual(none.t.none, 'No games waiting for you'); assert.strictEqual(none.calm_line, 'Start a game on lichess.org.'); assert.strictEqual(none.instance, 'Your games');
  const noRep = await load(games({ 'https://lichess.org/api/games/user/Demo': resp(200, JSON.stringify({ status: 'resign', winner: 'black', moves: 'e4 e4', players: { white: { user: { name: 'Demo' } }, black: { user: { name: 'Bob' } } } })) }, [], 'games_playing_empty.json')).run(gin());
  assert.strictEqual(noRep.none, true, 'a game chess.js cannot replay shows no board');
  const api = load(async () => resp(599, {}));
  const g = (wn, status) => ({ status, winner: wn, players: { white: { user: { name: 'Demo' } }, black: { user: { name: 'Bob' } } } });
  assert.strictEqual(api.lastGameLine(g('black', 'mate'), 'demo'), 'Lost to Bob'); assert.strictEqual(api.lastGameLine(g(undefined, 'draw'), 'Demo'), 'Drew with Bob');
  assert.strictEqual(api.lastGameLine(g(undefined, 'started'), 'Demo'), '', 'an unfinished game says nothing');
  const down = await load(games({ 'https://lichess.org/api/games/user/Demo': resp(500, '') }, [], 'games_playing_empty.json')).run(gin());
  assert.ok(Array.from(down.problems).includes('Lichess last game: HTTP 500'), 'a failed optional call is said on screen'); assert.strictEqual(down.calm, true);
});

test('games: failures are said on screen: API down, timeout, bad answer; the last game stays (stale) when there is one; a 401 or 403 asks to reconnect', async () => {
  const down = await load(games({ 'https://lichess.org/api/account/playing': resp(503, {}) })).run(gin());
  assert.strictEqual(down.none, true); assert.strictEqual(down.calm, true); assert.deepStrictEqual(Array.from(down.problems), ['Lichess games: HTTP 503']); assert.strictEqual(down.calm_line, 'Could not reach Lichess. Showing again at the next refresh.');
  const slow = await load(games({ 'https://lichess.org/api/account/playing': () => { const e = new Error('x'); e.name = 'AbortError'; throw e; } })).run(gin());
  assert.deepStrictEqual(Array.from(slow.problems), ['Lichess games: timeout']);
  const bad = await load(games({ 'https://lichess.org/api/account/playing': resp(200, { nbMyTurn: 1 }) })).run(gin());
  assert.deepStrictEqual(Array.from(bad.problems), ['Lichess games: bad answer']);
  const ok = await load(games({})).run(gin());
  assert.ok(ok.trmnl_state.gm && ok.trmnl_state.gm.id === 'aB3dE5fG');
  const stale = await load(games({ 'https://lichess.org/api/account/playing': resp(503, {}) })).run(input({ lichess_token: 'T', mode: 'games' }, ok.trmnl_state));
  assert.strictEqual(stale.stale, true); assert.strictEqual(stale.puzzle.id, 'aB3dE5fG'); assert.deepStrictEqual(Array.from(stale.problems), ['Lichess games: HTTP 503']); assert.strictEqual(stale.t.offline, 'Offline, last game');
  const none = await load(games({}, [], 'games_playing_empty.json')).run(input({ lichess_token: 'T', mode: 'games' }, ok.trmnl_state));
  assert.notStrictEqual((none.trmnl_state.gm || {}).id, 'aB3dE5fG', 'a good answer without that game drops the saved game');
  const r401 = await load(games({ 'https://lichess.org/api/account/playing': resp(401, {}) })).run(gin());
  assert.strictEqual(r401.connect, true); assert.strictEqual(r401.notice, r401.t.tokbad); assert.strictEqual(r401.instance, 'Connect account');
  const r403 = await load(games({ 'https://lichess.org/api/account/playing': resp(403, {}) })).run(gin());
  assert.strictEqual(r403.connect, true); assert.strictEqual(r403.notice, 'Reconnect Lichess: missing game permission');
});

test('games: no moves list when the moves call fails or the game is a variant chess.js cannot replay; the board still shows', async () => {
  const bad = await load(games({ 'https://lichess.org/game/export/': resp(500, {}) })).run(gin());
  assert.strictEqual(bad.puzzle.moves.length, 0); assert.ok(Array.from(bad.problems).includes('Lichess moves: HTTP 500')); assert.strictEqual(bad.none, false);
  const wrong = await load(games({ 'https://lichess.org/game/export/': resp(200, { moves: 'e4 e5 Nf3' }) })).run(gin());
  assert.strictEqual(wrong.puzzle.moves.length, 0, 'moves that do not reach the board are never shown'); assert.strictEqual(wrong.problems, undefined);
});

test('games: the mode is the one setting; anything else is puzzles, which are unchanged', async () => {
  for (const m of [undefined, '', 'puzzles', 'bogus', 'GAMES']) { const o = await load(account({})).run(input({ lichess_token: 't', ...(m === undefined ? {} : { mode: m }) })); assert.strictEqual(o.mode, 'puzzles', String(m)); assert.strictEqual(o.puzzle.id, 'u3zfD'); }
  const calls = []; await load(games({}, calls)).run(input({ mode: 'games' })); assert.strictEqual(calls.length, 0, 'no login: the connect screen, no call');
  const api = load(async () => resp(599, {}));
  assert.deepStrictEqual(['0', '59', '60', '3599', '3600', '5400', '86400', '187000'].map((s) => api.timeLeft(+s)), ['<1m', '<1m', '1m', '59m', '1h', '1h 30m', '1d', '2d 3h']);
  assert.strictEqual(api.timeLeft(null), 'No limit');
  const big = await load(games({}, [], 'games_playing_many.json')).run(input({ lichess_token: 't', mode: 'games' }, { v: 1, rating: 1500, wk: { t: 1, d: LIST(10).map((i) => [i, 1, 1, 1, 1]) }, last: GFX('games_playing_many.json') }));
  assert.ok(JSON.stringify(big.trmnl_state).length < 7500, 'state stays under the TRMNL limit');
});

// ---- Puzzle training options: difficulty and focus (difficulty, puzzle_focus)
const DASH = FX('dashboard_themes.json'), DASH_SPARSE = FX('dashboard_sparse.json');
const DASH_URL = 'https://lichess.org/api/puzzle/dashboard/30';
const nextUrls = (calls) => calls.filter((u) => u.includes('/api/puzzle/next'));

test('training: the weakest theme is the lowest performance among themes with >= 10 attempts', () => {
  const api = load(async () => resp(599, {}));
  assert.deepStrictEqual({ ...api.pickWeakest(DASH) }, { k: 'fork', rate: 54 });   // endgame is lower but has only 6 attempts; 13 / 24 = 54 %
  assert.strictEqual(api.pickWeakest(DASH_SPARSE), null);
  for (const bad of [null, {}, { themes: null }, { themes: { x: {} } }, { themes: { 'bad key!': { results: { nb: 50, performance: 1, firstWins: 1 } } } }]) assert.strictEqual(api.pickWeakest(bad), null);
});

test('training: difficulty goes into the next-puzzle URL; bad values mean normal', async () => {
  for (const [f, want] of [[{ difficulty: 'hardest' }, 'hardest'], [{ difficulty: 'harder' }, 'harder'], [{}, 'normal'], [{ difficulty: 'bogus' }, 'normal']]) {
    const calls = []; await load(account({}, calls)).run(input({ lichess_token: 't', ...f }));
    assert.deepStrictEqual(nextUrls(calls), ['https://lichess.org/api/puzzle/next?difficulty=' + want], JSON.stringify(f));
  }
});

test('training: focus weakest asks the dashboard once, requests angle=<theme> and says what is trained', async () => {
  const calls = [];
  const o = await load(account({ [DASH_URL]: resp(200, DASH) }, calls)).run(input({ lichess_token: 't', puzzle_focus: 'weakest', difficulty: 'harder' }));
  assert.deepStrictEqual(nextUrls(calls), ['https://lichess.org/api/puzzle/next?difficulty=harder&angle=fork']);
  assert.strictEqual(o.training, 'Training: Fork · 54 % solved'); assert.strictEqual(o.diff_label, 'Harder');
  assert.ok(o.meta.endsWith('· Harder'));
  assert.deepStrictEqual({ ...o.trmnl_state.fc }, { t: NOW, k: 'fork', rate: 54 });
  const off = []; const o2 = await load(account({ [DASH_URL]: resp(200, DASH) }, off)).run(input({ lichess_token: 't' }));
  assert.ok(!off.some((u) => u.includes('dashboard')), 'focus off: no dashboard call'); assert.strictEqual(o2.training, undefined); assert.ok(!nextUrls(off)[0].includes('angle'));
});

test('training: the chosen theme is cached for 24 h (one dashboard call a day)', async () => {
  const first = await load(account({ [DASH_URL]: resp(200, DASH) })).run(input({ lichess_token: 't', puzzle_focus: 'weakest' }));
  const mk = (later) => input({ lichess_token: 't', puzzle_focus: 'weakest' }, first.trmnl_state, later);
  for (const [dt, calls] of [[3600, 0], [86399, 0], [86401, 1]]) {
    const c = []; const inp = mk(); inp.trmnl.system.timestamp_utc = NOW + dt;
    const o = await load(account({ [DASH_URL]: resp(200, DASH) }, c)).run(inp);
    assert.strictEqual(c.filter((u) => u.includes('dashboard')).length, calls, 'after ' + dt + ' s');
    assert.ok(nextUrls(c)[0].endsWith('&angle=fork')); assert.strictEqual(o.training, 'Training: Fork · 54 % solved');
  }
});

test('training: too little data or a failing dashboard falls back to any theme with one calm line, never a problem', async () => {
  for (const dash of [resp(200, DASH_SPARSE), resp(503, {}), resp(200, 'not json'), resp(200, [])]) {
    const c = []; const o = await load(account({ [DASH_URL]: dash }, c)).run(input({ lichess_token: 't', puzzle_focus: 'weakest' }));
    assert.deepStrictEqual(nextUrls(c), ['https://lichess.org/api/puzzle/next?difficulty=normal']);
    assert.strictEqual(o.training, 'Not enough data for a focus yet'); assert.strictEqual(o.none, false); assert.strictEqual(o.problems, undefined);
  }
  const o = await load(account({ [DASH_URL]: resp(503, {}) })).run(input({ lichess_token: 't', puzzle_focus: 'weakest' }));
  assert.strictEqual(o.trmnl_state.fc, undefined, 'a failed dashboard is retried at the next refresh');
  const s = await load(account({ [DASH_URL]: resp(200, DASH_SPARSE) })).run(input({ lichess_token: 't', puzzle_focus: 'weakest' }));
  assert.strictEqual(s.trmnl_state.fc.k, '', 'too little data is remembered for the day');
});

// Guard (R5): the markup reads `training`; a view file that does not pass it drops the line silently (it did, until the render check caught it).
test('training: the markup reads `training` and all four view files pass it', () => {
  assert.ok(/\btraining\b/.test(fs.readFileSync(path.join(__dirname, '../source/shared.liquid'), 'utf8')));
  for (const v of ['full', 'half_horizontal', 'half_vertical', 'quadrant']) assert.ok(/ training: training[,\s]/.test(fs.readFileSync(path.join(__dirname, '../plugin/src', v + '.liquid'), 'utf8')), v + '.liquid does not pass training');
});

// Size budget (R5): TRMNL refuses a transform over 102400 bytes. The shipped file is the minified bundle; it must be current,
// under 90 % of the limit, and behave exactly like the readable source.
test('transform.js: shipped file is the current minified build, within the size budget, and behaves like the source', async () => {
  const code = await minified();
  assert.strictEqual(fs.readFileSync(path.join(__dirname, '../plugin/src/transform.js'), 'utf8'), code, 'run node tools/build.js');
  assert.ok(Buffer.byteLength(code) <= BUDGET, 'over the budget: ' + Buffer.byteLength(code));
  assert.throws(() => checkBudget(Buffer.byteLength(code), 1000), /over the budget/);   // the guard itself: it fails when the size is over
  const run = (c) => load(account({ [DASH_URL]: resp(200, DASH) }), c).run(input({ lichess_token: 't', puzzle_focus: 'weakest', difficulty: 'harder' }));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(await run(code))), JSON.parse(JSON.stringify(await run())));
  const g = (c) => load(games({}), c).run(input({ lichess_token: 'T', mode: 'games' }));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(await g(code))), JSON.parse(JSON.stringify(await g())));
});

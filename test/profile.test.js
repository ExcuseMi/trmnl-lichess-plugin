// "Profile" mode (mode = profile, source/profile.js): hero, cards, week, recent games, change, chart, parallel calls, failures, saved fallback.
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
  vm.createContext(ctx); vm.runInContext(bundle() + '\n;this.api = { run, perfPoints, change30 };', ctx); return ctx.api;
}
const resp = (status, body) => ({ status, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
const input = (state) => ({ trmnl: { system: { timestamp_utc: NOW }, state, plugin_settings: { custom_fields_values: { mode: 'profile' } }, oauth: { access_token: 'SECRET-TOKEN' } } });
// route by prefix; `over` replaces a route; function values may delay
function router(over, calls, who) {
  const w = who || 'KnightOwl', m = { acct: 'profile_account_many.json', hist: 'profile_history_many.json', games: 'profile_games_many.ndjson' };
  const map = { 'https://lichess.org/api/account': resp(200, J(m.acct)), ['https://lichess.org/api/user/' + w + '/rating-history']: resp(200, J(m.hist)), ['https://lichess.org/api/games/user/' + w]: resp(200, T(m.games)), ...(over || {}) };
  return async (url) => { (calls || []).push(url); for (const k of Object.keys(map)) if (url.startsWith(k)) { const v = map[k]; return typeof v === 'function' ? v(url) : v; } return resp(599, {}); };
}
const names = (o) => Array.from(o.pf.rows).map((r) => r.k);

test('profile: ratings are the played perfs, most played first; provisional has ?, 30-day change from the history; puzzles count as a perf', async () => {
  const o = await load(router()).run(input());
  assert.strictEqual(o.mode, 'profile'); assert.strictEqual(o.instance, 'Profile'); assert.strictEqual(o.none, false);
  assert.deepStrictEqual(names(o), ['puzzle', 'blitz', 'rapid', 'bullet', 'classical', 'correspondence', 'chess960']);
  const hist = J('profile_history_many.json'), acct = J('profile_account_many.json'), api = load(router());
  const blitz = Array.from(o.pf.rows).find((r) => r.k === 'blitz');
  const pts = api.perfPoints(hist, 'blitz'), base = pts.filter((p) => p[0] <= NOW - 30 * 86400).pop()[1];
  assert.strictEqual(blitz.change, (acct.perfs.blitz.rating - base > 0 ? '+' : '') + (acct.perfs.blitz.rating - base));
  assert.strictEqual(blitz.games_text, '1,130');
  const p960 = Array.from(o.pf.rows).find((r) => r.k === 'chess960'); assert.strictEqual(p960.prov, true); assert.strictEqual(p960.change, '', 'no change shown for a provisional rating');
  assert.strictEqual(o.pf.name, 'KnightOwl'); assert.strictEqual(o.pf.title, 'CM'); assert.strictEqual(o.pf.since, 'Mar 2017');
});

// Owner 2026-11-14 (R8): hero + cards + this week + recent games replace the ratings table, the stats list and the 10 form chips.
test('profile: the hero is the most played rating perf (not puzzles): 30-day change, peak with its month, the last 90 days (<= 45 points)', async () => {
  const o = await load(router()).run(input()), hist = J('profile_history_many.json'), h = o.pf.hero;
  assert.strictEqual(h.k, 'blitz'); assert.strictEqual(o.pf.chart.k, 'blitz'); assert.strictEqual(h.change, '-15');
  const pts = hist.find((x) => x.name === 'Blitz').points, top = pts.reduce((m, p) => (p[3] >= m[3] ? p : m));
  assert.strictEqual(h.peak, top[3]); assert.strictEqual(h.peak_when, 'Sep 2026');
  const inside = pts.filter((p) => Date.UTC(p[0], p[1], p[2]) / 1000 >= NOW - 90 * 86400).map((p) => p[3]);
  assert.ok(o.pf.chart.pts.length >= 2 && o.pf.chart.pts.length <= 45);
  assert.strictEqual(o.pf.chart.pts[o.pf.chart.pts.length - 1], inside[inside.length - 1], 'newest point kept');
  assert.strictEqual(o.pf.extra, 'Storm best 41 · 14d 23h played');
  assert.ok(!('stats' in o.pf) && !('form' in o.pf), 'no lifetime stats, no form chips');
});

test('profile: cards are the other perfs, most played first (puzzles once, as a card), each with a short trend; one chart per card to draw', async () => {
  const o = await load(router()).run(input()), cards = Array.from(o.pf.cards);
  assert.deepStrictEqual(cards.map((c) => c.k), ['puzzle', 'rapid', 'bullet', 'classical', 'correspondence', 'chess960']);
  assert.ok(cards.every((c) => c.trend.length >= 2 && c.trend.length <= 16));
  assert.strictEqual(cards.find((c) => c.k === 'chess960').change, '', 'no change for a provisional rating');
  assert.deepStrictEqual(Array.from(o.sparks).map((x) => x.id), ['ym-spark', 'ym-tr0', 'ym-tr1', 'ym-tr2', 'ym-tr3', 'ym-tr4', 'ym-tr5']);
  assert.ok(!o.trmnl_state.pf.rows.some((r) => 'spark' in r), 'view-only ids stay out of the saved state');
});

test('profile: this week (games of the last 7 days, wins first in the bar, the hero week change, the streak) and recent games', async () => {
  const o = await load(router()).run(input()), w = o.pf.week;
  // fixture: 15 games in the last 7 days (8 won, 2 drawn, 5 lost); the newest three are wins
  assert.deepStrictEqual([w.n, w.won, w.drawn, w.lost], [15, 8, 2, 5]);
  assert.strictEqual(Array.from(w.bar).join(''), 'WWWWWWWWDDLLLLL');
  assert.strictEqual(w.streak, '3 wins in a row'); assert.strictEqual(w.change_name, 'Blitz'); assert.match(w.change, /^[+-]?\d+$/);
  const r = Array.from(o.pf.show);
  assert.strictEqual(r.length, 12); assert.deepStrictEqual([r[0].c, r[0].opp, r[0].tc], ['W', 'Amanteya71 (1962)', 'Blitz']);
  assert.strictEqual(r[3].tc, 'Rapid'); assert.strictEqual(r[4].c, 'D');
  assert.strictEqual(o.pf.recent.length, 24, 'all fetched games are kept for the week');
});

test('profile: a new player with one provisional perf: hero only, no change, no cards; 5 games, no streak (alternating results)', async () => {
  const f = router({ 'https://lichess.org/api/account': resp(200, J('profile_account_new.json')), 'https://lichess.org/api/user/NewbieNell/rating-history': resp(200, J('profile_history_new.json')), 'https://lichess.org/api/games/user/NewbieNell': resp(200, T('profile_games_new.ndjson')) });
  const o = await load(f).run(input());
  assert.deepStrictEqual(names(o), ['blitz']); assert.strictEqual(o.pf.hero.prov, true); assert.strictEqual(o.pf.hero.change, '');
  assert.strictEqual(o.pf.cards.length, 0); assert.strictEqual(o.pf.title, ''); assert.strictEqual(o.pf.extra, '1h 31m played');
  assert.strictEqual(o.pf.week.n, 5); assert.strictEqual(o.pf.week.change, '', 'no week change for a provisional rating'); assert.strictEqual(o.pf.week.streak, '');
});

test('profile: calls run side by side (all three at once with a saved name), only profile endpoints, token sent and never in the answer', async () => {
  const calls = [], seen = [];
  const f = async (url, opt) => { seen.push((opt.headers || {}).Authorization); return router({}, calls)(url, opt); };
  const first = await load(f).run(input());
  assert.ok(!calls.some((u) => /puzzle|token\/test|activity/.test(u)), calls.join(' '));
  assert.ok(seen.every((a) => a === 'Bearer SECRET-TOKEN'));
  assert.ok(!JSON.stringify(first).includes('SECRET-TOKEN'), 'token in the answer');
  calls.length = 0; let release; const gate = new Promise((r) => { release = r; });
  const slow = router({ 'https://lichess.org/api/account': async () => { await gate; return resp(200, J('profile_account_many.json')); } }, calls);
  const p = load(slow).run(input(first.trmnl_state));
  await new Promise((r) => setTimeout(r, 30));
  assert.strictEqual(calls.length, 3, 'history and games start before the account answers when the name is saved: ' + calls.join(' '));
  release(); await p;
  assert.ok(JSON.stringify(first.trmnl_state).length < 7500 && first.trmnl_state.pf.name === 'KnightOwl');
});

test('profile: failures are said on screen; saved profile stands in; 401 asks to reconnect', async () => {
  const ok = await load(router()).run(input());
  const st = ok.trmnl_state;
  const down = await load(router({ 'https://lichess.org/api/account': resp(503, {}) })).run(input());
  assert.strictEqual(down.none, true); assert.deepStrictEqual(Array.from(down.problems), ['Lichess account: HTTP 503']); assert.strictEqual(down.instance, 'Profile');
  const stale = await load(router({ 'https://lichess.org/api/account': resp(503, {}) })).run(input(st));
  assert.strictEqual(stale.none, false); assert.strictEqual(stale.stale, true); assert.strictEqual(stale.pf.name, 'KnightOwl'); assert.deepStrictEqual(Array.from(stale.problems), ['Lichess account: HTTP 503']);
  const noHist = await load(router({ 'https://lichess.org/api/user/KnightOwl/rating-history': resp(503, {}) })).run(input());
  assert.strictEqual(noHist.pf.chart, null); assert.strictEqual(noHist.pf.hero.peak, undefined); assert.deepStrictEqual(Array.from(noHist.problems), ['Lichess history: HTTP 503']); assert.strictEqual(noHist.pf.rows.length, 7);
  const savedHist = await load(router({ 'https://lichess.org/api/user/KnightOwl/rating-history': resp(503, {}) })).run(input(st));
  assert.strictEqual(savedHist.pf.chart.k, 'blitz', 'the saved chart stands in'); assert.strictEqual(savedHist.pf.cards[1].change, ok.pf.cards[1].change, 'saved change stands in');
  assert.strictEqual(savedHist.pf.hero.peak, ok.pf.hero.peak, 'saved peak stands in'); assert.strictEqual(savedHist.pf.cards[0].trend.length, ok.pf.cards[0].trend.length, 'saved trend stands in');
  const noGames = await load(router({ 'https://lichess.org/api/games/user/KnightOwl': resp(500, '') })).run(input(st));
  assert.strictEqual(noGames.pf.show.length, 12); assert.strictEqual(noGames.pf.week.n, 15, 'the saved games give the week'); assert.deepStrictEqual(Array.from(noGames.problems), ['Lichess games: HTTP 500']);
  const noGames0 = await load(router({ 'https://lichess.org/api/games/user/KnightOwl': resp(500, '') })).run(input());
  assert.strictEqual(noGames0.pf.show.length, 0); assert.strictEqual(noGames0.pf.week.n, 0);
  const bad = await load(router({ 'https://lichess.org/api/account': resp(401, {}) })).run(input(st));
  assert.strictEqual(bad.connect, true); assert.strictEqual(bad.puzzle, undefined);
  const garbage = await load(router({ 'https://lichess.org/api/account': resp(200, { username: 'bad name!' }) })).run(input());
  assert.strictEqual(garbage.none, true); assert.deepStrictEqual(Array.from(garbage.problems), ['Lichess account: bad answer']);
});

test('profile: the setting lists Profile and the build ships the mode; puzzles mode is unchanged', () => {
  const y = fs.readFileSync(path.join(__dirname, '../plugin/src/settings.yml'), 'utf8');
  assert.ok(/- Puzzles: puzzles\n  - Your games: games\n  - Profile: profile/.test(y), 'mode options: key and the other options unchanged');
});

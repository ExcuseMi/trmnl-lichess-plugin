// One run budget (source/puzzle.js runStart/runLeft/getRaw): TRMNL stops a transform at 5 s. For every mode a Lichess that never
// answers (deaf to the abort too) ends run() under 4 s with a view; a slow but answering chain still shows data.
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
  vm.createContext(ctx); vm.runInContext(bundle() + '\n;this.api = { run };', ctx); return ctx.api;
}
const resp = (status, body) => ({ status, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
const input = (mode) => ({ trmnl: { system: { timestamp_utc: NOW }, plugin_settings: { custom_fields_values: { mode, follow_username: 'KnightOwl' } }, oauth: { access_token: 'SECRET-TOKEN' } } });
const MODES = ['puzzles', 'games', 'profile', 'top', 'following'];
const ROUTES = () => ({
  'https://lichess.org/api/account/playing': J('games_playing_one.json'), 'https://lichess.org/api/account': J('profile_account_many.json'),
  'https://lichess.org/game/export/': J('games_export.json'), 'https://lichess.org/api/games/user/': T('profile_games_many.ndjson'),
  'https://lichess.org/api/user/KnightOwl/rating-history': J('profile_history_many.json'), 'https://lichess.org/api/user/KnightOwl/activity': [],
  'https://lichess.org/api/user/KnightOwl/current-game': J('follow_game_playing.json'), 'https://lichess.org/api/puzzle/next': J('lichess_daily.json'),
  'https://lichess.org/api/puzzle/activity': '', 'https://lichess.org/api/token/test': {},
  'https://lichess.org/api/broadcast/top': J('top_broadcast.json'), 'https://lichess.org/api/broadcast/-/-/rN4xYz01': J('top_round.json'),
  'https://lichess.org/api/study/rN4xYz01/g2LiveAB.pgn': T('top_pgn.pgn'), 'https://lichess.org/api/tv/channels': J('tv_channels.json') });
// every call answers after `ms`; ms = Infinity never answers; `deaf` ignores the abort signal, else the abort rejects
function slow(ms, deaf) {
  const map = ROUTES();
  return (url, opts) => new Promise((resolve, reject) => {
    const key = Object.keys(map).sort((a, b) => b.length - a.length).find((k) => url.startsWith(k));
    if (!deaf && opts && opts.signal) opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    if (ms !== Infinity) setTimeout(() => resolve(key ? resp(200, map[key]) : resp(599, {})), ms);
  });
}
async function timed(fetchImpl, mode) {
  const keepAlive = setInterval(() => {}, 50);   // AbortSignal timers are unref'd: a deaf fetch must not let Node exit
  const t = Date.now();
  try { const o = await load(fetchImpl).run(input(mode)); return { o, ms: Date.now() - t }; } finally { clearInterval(keepAlive); }
}

for (const mode of MODES) {
  test('budget ' + mode + ': a fetch that never answers ends run() under 4 s with a view and says timeout', async () => {
    const { o, ms } = await timed(slow(Infinity, false), mode);
    assert.ok(ms < 4000, mode + ' took ' + ms + ' ms'); assert.ok(o && typeof o === 'object' && o.t, 'a view comes back');
    assert.ok(o.none, 'nothing saved: the calm screen'); assert.ok(JSON.stringify(o).includes('timeout') || o.calm_line, 'the failure is said');
  });
  test('budget ' + mode + ': a fetch deaf to its abort signal still ends run() under 4 s', async () => {
    const { o, ms } = await timed(slow(Infinity, true), mode);
    assert.ok(ms < 4000, mode + ' took ' + ms + ' ms'); assert.ok(o && o.t);
  });
  test('budget ' + mode + ': a chain of 1.2 s calls still fits under 4 s and shows data', async () => {
    const { o, ms } = await timed(slow(1200, false), mode);
    assert.ok(ms < 4000, mode + ' took ' + ms + ' ms'); assert.strictEqual(o.none, false, mode + ' shows data');
  });
  test('budget ' + mode + ': calls that answer after 2.5 s each (a chain would take 5 s or more) end run() under 4 s', async () => {
    const { o, ms } = await timed(slow(2500, false), mode);
    assert.ok(ms < 4000, mode + ' took ' + ms + ' ms'); assert.ok(o && o.t);
  });
}

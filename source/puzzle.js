// Lichess (unofficial) TRMNL plugin: serverless transform (Node). The Lichess daily puzzle; with a Lichess (OAuth)
// login the next puzzle at the user's level, kept until solved, plus progress. Hands the page the board, texts and the QR target.
var UA = 'TRMNL Chess Puzzle plugin (contact: https://github.com/ExcuseMi)';
var ST_MAX = 7500;
var T_EN = { white: 'White to move', black: 'Black to move', side_w: 'White', side_b: 'Black', to_move: 'to move', days: 'S M T W T F S', this_week: 'This week', solved_n: 'solved', failed_n: 'failed', your_turn: 'Your turn', find_w: 'White to move', find_b: 'Black to move', puzzle_n: 'Puzzle', difficulty: 'Rating', from_game: 'From game', played: 'Played',  scan: 'Scan to solve', rating: 'Puzzle', none: 'No puzzle today', none2: 'Could not reach the puzzle service. Showing again at the next refresh.', offline: 'Offline, last puzzle', connect_title: 'Connect Lichess', connect_line: 'Connect your Lichess account on the plugin settings page.', tokbad: 'Lichess login expired: reconnect on the plugin settings page.', scope: 'Reconnect Lichess: missing puzzle permission', solved: 'Solved!', today: 'today', week: 'this week', streak: 'streak', rating_you: 'Your rating', vs: 'vs', connect: 'Connect Lichess to track your progress', training: 'Training', solved_pct: 'solved', no_focus: 'Not enough data for a focus yet' };

function field(input, k, d) { var f = (((input || {}).trmnl || {}).plugin_settings || {}).custom_fields_values || (input || {}); var v = f[k]; return v == null || v === '' ? d : v; }
function nowSec(input) { return +((((input || {}).trmnl || {}).system || {}).timestamp_utc) || Math.floor(Date.now() / 1000); }
// The user's offset from UTC in seconds (TRMNL's trmnl.user.utc_offset): the week's "today" is their day, not UTC's.
function utcOff(input) { var o = +((((input || {}).trmnl || {}).user || {}).utc_offset); return isFinite(o) && Math.abs(o) <= 14 * 3600 ? o : 0; }
function stObj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : null; }

// One budget per run (TRMNL stops a transform at 5 s, VM start included): run() sets the deadline, every call's timeout is
// min(its own cap, time left), a call that cannot start with RUN_MIN ms left is a timeout, and every call is raced against
// the deadline so one that ignores its abort cannot hold the run.
var RUN_MS = 3500, RUN_MIN = 300, RUN = { end: 0 };
function runStart() { RUN.end = Date.now() + RUN_MS; NET.busy = 0; NET.wait = []; }
// One request at a time (the Lichess API asks for it, and every TRMNL user shares the same servers): calls queue in the order they
// are made, so each run() starts its most needed call first. A call still queued at the deadline is a timeout.
var NET = { max: 1, busy: 0, wait: [] };
function netSlot() {
  if (NET.busy < NET.max) { NET.busy++; return Promise.resolve(); }
  return new Promise(function (res, rej) {
    var w = { done: false, go: function () { if (w.done) return false; w.done = true; clearTimeout(w.to); res(); return true; } };
    w.to = setTimeout(function () { w.done = true; rej(timeoutError()); }, Math.max(0, (RUN.end || Date.now() + 60000) - Date.now() - RUN_MIN));
    NET.wait.push(w);
  });
}
function netFree() { while (NET.wait.length) { if (NET.wait.shift().go()) return; } NET.busy = Math.max(0, NET.busy - 1); }
function runLeft(cap) { return Math.min(cap || 2500, RUN.end ? RUN.end - Date.now() : 1e9); }
function timeoutError() { return Object.assign(new Error('timeout'), { name: 'AbortError' }); }
async function getRaw(url, headers, ms, opts) {
  if (runLeft(ms) < RUN_MIN) throw timeoutError();
  await netSlot();
  try { return await getOne(url, headers, ms, opts); } finally { netFree(); }
}
async function getOne(url, headers, ms, opts) {
  ms = runLeft(ms);
  if (ms < RUN_MIN) throw timeoutError();
  var ctl = typeof AbortController === 'function' ? new AbortController() : null, to, dl;
  var guard = new Promise(function (_, rej) { to = setTimeout(function () { if (ctl) ctl.abort(); rej(timeoutError()); }, ms); dl = RUN.end ? setTimeout(function () { rej(timeoutError()); }, Math.max(0, RUN.end - Date.now())) : null; });
  guard.catch(function () {});
  try {
    return await Promise.race([guard, (async function () {
      var r = await fetch(url, Object.assign({ headers: Object.assign({ 'User-Agent': UA, 'Accept': 'application/json' }, headers || {}), signal: ctl ? ctl.signal : undefined }, opts || {}));
      var text = await r.text();
      return { status: r.status, text: text };
    })()]);
  } finally { clearTimeout(to); clearTimeout(dl); }
}
async function getJson(url, headers, ms) {
  var r = await getRaw(url, headers, ms);
  if (r.status !== 200) { var e = new Error('http ' + r.status); e.status = r.status; throw e; }
  return JSON.parse(r.text);
}

var THEME_SKIP = { long: 1, short: 1, veryLong: 1, oneMove: 1, crushing: 1, advantage: 1, equality: 1, opening: 1, middlegame: 1 };
function themeWords(t) {
  var m = /^mateIn(\d)$/.exec(t);
  if (m) return 'Mate in ' + m[1];
  var s = String(t).replace(/([A-Z])/g, ' $1').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function shortThemes(list) {
  var l = (Array.isArray(list) ? list : []).filter(function (t) { return !THEME_SKIP[t]; });
  l.sort(function (a, b) { return (/^mateIn/.test(b) ? 1 : 0) - (/^mateIn/.test(a) ? 1 : 0); });
  return l.slice(0, 2).map(themeWords);
}
// Latin, Greek and Cyrillic (the Framework font draws them); other scripts are dropped, and a caller falls back when nothing is left.
function clean(s) { return String(s || '').replace(/[^\x20-\x7e -ɏͰ-ϿЀ-ӿ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60); }

function lichessModel(j) {
  var q = lichessPosition(j), p = j.puzzle || {};
  if (!p.id) throw new Error('no puzzle id');
  var last = q.last || '';
  return { source: 'lichess', id: String(p.id), url: 'https://lichess.org/training/' + encodeURIComponent(p.id), board: q.board, turn: q.turn,
    from: sqIndex(last.slice(0, 2)), to: sqIndex(last.slice(2, 4)), rating: +p.rating || 0, themes: shortThemes(p.themes), title: '', moves: lichessMoves(j), plays: +p.plays || 0, game: lichessGame(j.game) };
}
// The game the puzzle comes from: "3+0 Blitz" and the two players [colour, name, rating], cleaned like every other text.
function lichessGame(g) {
  if (!g || typeof g !== 'object') return null;
  var players = (Array.isArray(g.players) ? g.players : []).filter(function (x) { return x && (x.color === 'white' || x.color === 'black'); }).slice(0, 2)
    .map(function (x) { return [x.color === 'white' ? 'w' : 'b', clean(x.name || x.id || '?').slice(0, 24), +x.rating || 0]; });
  players.sort(function (a, b) { return a[0] === 'w' ? -1 : b[0] === 'w' ? 1 : 0; });
  var perf = clean((g.perf && g.perf.name) || ''), clock = /^\d{1,3}\+\d{1,3}$/.test(g.clock || '') ? g.clock : '';
  return { kind: clean((clock ? clock + ' ' : '') + perf), players: players };
}

function ndjson(text) { return String(text).split('\n').filter(Boolean).map(function (l) { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean); }

// ==== Providers. One interface, the view reads only the normalised model and the capability flags.
//   id, capabilities (what the provider can do at all), active(ctx) (what it can do for this user now),
//   fetchPuzzle(ctx) -> puzzle { source, id, url, board, turn, from, to, rating, themes, title }
//   fetchProgress(ctx) -> progress { rating, label, delta, trend, history[], today, week, streak, days[7]{s,f}, name } or null
//   attempt(puzzleId, ctx) -> 'win' | 'loss' | '' (only where capabilities.solvedCheck)
// ctx: { settings, token, state, nowS, cache }; a provider may cache one fetch in ctx.cache.
var NO_CAPS = { personalPuzzles: false, solvedCheck: false, ratingHistory: false, streak: false };

function authHeader(ctx) { return ctx.token ? { Authorization: 'Bearer ' + ctx.token } : {}; }   // Top game and Follow also run without a login
var LT = 3500;   // each Lichess call; they run one at a time inside TRMNL's 5 s (NET)
// The last puzzles (newest first), only for the solved check and the streak: an optional extra (max 20, short timeout),
// never blocking and never shown as a failure. The week comes from lichessWeek.
async function lichessActivity(ctx) {
  ctx.diag = ctx.diag || {};
  if (!ctx.cache.activity) {
    ctx.cache.activity = getRaw('https://lichess.org/api/puzzle/activity?max=20', Object.assign({ Accept: 'application/x-ndjson' }, authHeader(ctx)), 2500)
      .then(function (r) { return r.status === 200 ? ndjson(r.text) : []; }, function () { return []; });
  }
  return ctx.cache.activity;
}
// The week, per day: GET /api/user/{name}/activity (public, one small JSON, fast). Each day's puzzles score gives solved,
// failed and the rating before and after. A failed call reuses the last good week from the saved state and says so on screen.
async function lichessWeek(ctx, uname) {
  ctx.diag = ctx.diag || {};
  var saved = function (why) {
    var s = stObj(ctx.state.wk);
    ctx.diag.activity = why; ctx.cache.weekSaved = true;
    return s && Array.isArray(s.d) ? s.d : [];
  };
  try {
    var j = await getJson('https://lichess.org/api/user/' + uname + '/activity', {}, LT);
    if (!Array.isArray(j)) return saved('bad answer');
    var rows = [];
    j.forEach(function (d) {
      var sc = d && d.puzzles && d.puzzles.score, st = d && d.interval ? +d.interval.start : 0;
      if (!st) return;
      rows.push([st, sc ? +sc.win || 0 : 0, sc ? +sc.loss || 0 : 0, sc && sc.rp ? +sc.rp.before || 0 : 0, sc && sc.rp ? +sc.rp.after || 0 : 0]);
    });
    if (!rows.some(function (r) { return r[1] + r[2] > 0; })) ctx.diag.activity = '0 puzzles this week';
    return rows.slice(0, 10);
  } catch (e) { return saved(callError(e)); }
}
// days[7] (oldest first, today last) from the per-day rows (Lichess days are UTC dates; today is the user's date, off = utc offset s); recent: the rating change of the last days with puzzles, newest first.
function weekFromDays(rows, nowS, off) {
  var days = [], i, d0 = Math.floor((nowS + (off || 0)) / 86400), recent = [];
  for (i = 0; i < 7; i++) days.push({ s: 0, f: 0 });
  rows.slice().sort(function (a, b) { return b[0] - a[0]; }).forEach(function (r) {
    var d = d0 - Math.floor(r[0] / 86400000);
    if (d < 0 || d > 6) return;   // chips and counts cover the same 7 days
    days[6 - d].s += r[1]; days[6 - d].f += r[2];
    if (r[1] + r[2] > 0 && r[3] && r[4] && recent.length < 6) recent.push(r[4] - r[3]);
  });
  var week = 0; days.forEach(function (x) { week += x.s; });
  return { days: days, today: days[6].s, week: week, recent: recent };
}
function callError(e) { return e && e.name === 'AbortError' ? 'timeout' : e && e.status ? 'HTTP ' + e.status : 'error ' + String((e && e.message) || e).slice(0, 40); }
// The scopes the connected token carries (POST /api/token/test); '' when unknown. The answer is keyed by the token: never kept.
async function lichessScopes(ctx) {
  ctx.diag = ctx.diag || {};
  if (!ctx.cache.scopes) {
    ctx.cache.scopes = getRaw('https://lichess.org/api/token/test', { 'Content-Type': 'text/plain' }, LT, { method: 'POST', body: ctx.token }).then(function (r) {
      if (r.status !== 200) { ctx.diag.scopes = 'http ' + r.status; return ''; }
      var j = JSON.parse(r.text), v = j && typeof j === 'object' ? j[Object.keys(j)[0]] : null;
      var s = v && typeof v.scopes === 'string' ? v.scopes : '';
      ctx.diag.scopes = s || (v ? 'none' : 'unknown token');
      return v ? s || 'none' : '';
    }).catch(function () { ctx.diag.scopes = 'error'; return ''; });
  }
  return ctx.cache.scopes;
}
async function lichessAccountInfo(ctx) {
  if (!ctx.cache.account) { ctx.diag = ctx.diag || {}; ctx.cache.account = getJson('https://lichess.org/api/account', authHeader(ctx), LT); ctx.cache.account.catch(function (e) { ctx.diag.account = callError(e); }); }
  return ctx.cache.account;   // a rejected promise is cached too: one 401 is one call
}
// Training options: difficulty; puzzle_focus=weakest (lowest performance, >= 10 attempts, 30 days; dashboard once a day, state `fc`).
var DIFFS = { easiest: 'Easiest', easier: 'Easier', normal: 'Normal', harder: 'Harder', hardest: 'Hardest' };
function pickDifficulty(input) {
  var v = String(field(input, 'difficulty', 'normal')).toLowerCase();
  return DIFFS[v] ? v : 'normal';
}
function pickWeakest(dash) {
  var th = dash && typeof dash === 'object' && dash.themes && typeof dash.themes === 'object' ? dash.themes : {}, best = null;
  Object.keys(th).forEach(function (k) {
    var r = th[k] && th[k].results;
    if (!/^[A-Za-z0-9]{2,40}$/.test(k) || !r || !(+r.nb >= 10) || !isFinite(+r.performance)) return;
    if (!best || +r.performance < best.perf || (+r.performance === best.perf && k < best.k)) best = { k: k, perf: +r.performance, rate: Math.round(100 * (+r.firstWins || 0) / +r.nb) };
  });
  return best ? { k: best.k, rate: Math.min(100, best.rate) } : null;
}
// {k, rate}; k '' = any theme (too little data or dashboard failed).
function resolveFocus(ctx) {
  if (!ctx.cache.focus) ctx.cache.focus = (async function () {
    var fc = stObj(ctx.state.fc);
    if (fc && ctx.nowS - (+fc.t || 0) < 86400 && ctx.nowS >= (+fc.t || 0) && typeof fc.k === 'string') return { k: fc.k, rate: +fc.rate || 0, t: fc.t };
    try { var w = pickWeakest(await getJson('https://lichess.org/api/puzzle/dashboard/30', authHeader(ctx), 2000)) || { k: '', rate: 0 }; return { k: w.k, rate: w.rate, t: ctx.nowS }; }
    catch (e) { ctx.diag.dashboard = callError(e); return { k: '', rate: 0, failed: true }; }
  })();
  return ctx.cache.focus;
}
function nextUrl(ctx, f) { return 'https://lichess.org/api/puzzle/next?difficulty=' + encodeURIComponent(ctx.settings.difficulty || 'normal') + (f && f.k ? '&angle=' + encodeURIComponent(f.k) : ''); }
function startNext(ctx) {
  ctx.cache.next = ctx.settings.focus ? resolveFocus(ctx).then(function (f) { return getJson(nextUrl(ctx, f), authHeader(ctx), LT); })
    : getJson(nextUrl(ctx, null), authHeader(ctx), LT);   // asked now, so it is first in the queue
  return ctx.cache.next;
}
var lichessProvider = {
  id: 'lichess',
  capabilities: { personalPuzzles: true, solvedCheck: true, ratingHistory: true, streak: true },
  active: function (ctx) { return ctx.token ? this.capabilities : NO_CAPS; },
  fetchPuzzle: async function (ctx) {
    if (!ctx.cache.next) startNext(ctx);
    return lichessModel(await ctx.cache.next);
  },
  fetchProgress: async function (ctx) {
    if (!ctx.token) return null;
    var acct = await lichessAccountInfo(ctx);   // throws with .status 401 on a bad token
    var uname = /^[A-Za-z0-9_-]{2,30}$/.test(acct.username || '') ? acct.username : '';
    var got = await Promise.allSettled([uname ? lichessWeek(ctx, uname) : Promise.resolve([]), uname ? getJson('https://lichess.org/api/user/' + uname + '/rating-history', authHeader(ctx), LT) : Promise.reject(new Error('no user')), lichessActivity(ctx)]);
    var rows = got[0].status === 'fulfilled' ? got[0].value : [], hist = [];
    ctx.cache.weekRows = rows;
    if (got[1].status === 'rejected' && uname) ctx.diag.history = callError(got[1].reason);
    if (got[1].status === 'fulfilled' && Array.isArray(got[1].value)) {
      var pz = got[1].value.filter(function (x) { return x && x.name === 'Puzzles'; })[0];
      if (pz && Array.isArray(pz.points)) hist = pz.points.slice(-30).map(function (q) { return +q[3] || 0; }).filter(Boolean);
    }
    var rating = acct.perfs && acct.perfs.puzzle ? +acct.perfs.puzzle.rating || 0 : 0;
    var act = got[2].status === 'fulfilled' ? got[2].value : [], streak = 0;
    for (var i = 0; i < act.length && act[i].win; i++) streak++;
    var wk = weekFromDays(rows, ctx.nowS, ctx.off);
    return Object.assign(wk, { rating: rating, label: 'rating_you', history: hist, name: uname, streak: act.length ? streak : 0 });
  },
  // 'win' or 'loss' when the user tried this puzzle (newest attempt), '' when not: a failed puzzle is done too, a new one follows.
  attempt: async function (id, ctx) { var a = (await lichessActivity(ctx)).filter(function (x) { return x && x.puzzle && x.puzzle.id === id; })[0]; return a ? (a.win ? 'win' : 'loss') : ''; }
};
var PROVIDERS = { lichess: lichessProvider };

function slim(m) { return { source: m.source, id: m.id, url: m.url, board: m.board, turn: m.turn, from: m.from, to: m.to, rating: m.rating, themes: m.themes, title: m.title, moves: m.moves || [], plays: m.plays || 0, game: m.game || null }; }
function fitState(st) { if (JSON.stringify(st).length > ST_MAX) { delete st.last; if (JSON.stringify(st).length > ST_MAX) delete st.wk; } return st; }

async function run(input) {
  runStart();
  var nowS = nowSec(input), st0 = stObj((((input || {}).trmnl || {}).state)) || {};
  var coords = true;   // fixed (owner 2026-11-14): side to move at the bottom, coordinates shown
  var oauth = stObj(((input || {}).trmnl || {}).oauth) || {}, token = String(oauth.access_token || '').trim();   // Lichess login: OAuth only
  var mode = String(field(input, 'mode', 'puzzles'));
  if (mode === 'top') return runTop(input, token, nowS, st0);   // "Top game" (source/live.js): public, works without a login
  if (mode === 'following') return runFollow(input, token, nowS, st0);   // "Follow a player" (source/live.js): public, works without a login
  if (!token) return viewModel({ t: T_EN, connect: true, none: true, trmnl_state: fitState(stObj(st0.wk) ? { v: 1, rating: +st0.rating || 0, wk: st0.wk } : { v: 1, rating: +st0.rating || 0 }) }, nowS);   // OAuth is required for the personal modes (owner 2026-11-14)
  if (mode === 'games') return runGames(input, token, nowS, st0);   // "Your games" (source/games.js)
  if (mode === 'profile') return runProfile(input, token, nowS, st0);   // "Profile" (source/profile.js)
  var prov = PROVIDERS.lichess;
  var ctx = { settings: { difficulty: pickDifficulty(input), focus: String(field(input, 'puzzle_focus', 'any')) === 'weakest' }, token: token, state: st0, nowS: nowS, off: utcOff(input), cache: {}, diag: {} };
  if (ctx.token) {   // every Lichess call is asked now (the queue runs them one at a time): a next puzzle in case it is needed, account, activity, scopes
    startNext(ctx);   // queued in this order, one at a time: the puzzle first
    ctx.cache.next.catch(function (e) { ctx.diag.next = callError(e); });
    lichessAccountInfo(ctx).catch(function () {}); lichessActivity(ctx); lichessScopes(ctx);   // the week follows the account (it needs the name)
  }
  var model = null, progress = null, banner = '', notice = '', stale = false, cur = null, caps = prov.active(ctx), rating = +st0.rating || 0;
  var prevCur = stObj(st0.cur), last0 = stObj(st0.last);
  try { progress = await prov.fetchProgress(ctx); } catch (e) { progress = null; if (e && e.status === 401) { notice = 'tokbad'; ctx.token = ''; caps = NO_CAPS; } }
  if (progress && progress.rating) {
    var base = prevCur && prevCur.r0 ? +prevCur.r0 : rating;   // the rating when the shown puzzle was picked: the change since then
    if (base) { progress.delta = progress.rating - base; progress.trend = progress.rating > base ? 'up' : progress.rating < base ? 'down' : 'flat'; }
    rating = progress.rating;
  }
  var keep = false;
  if (caps.solvedCheck && prevCur && prevCur.id) {
    var tried = '';
    try { tried = await prov.attempt(prevCur.id, ctx); } catch (e) { tried = ''; }
    var solved = tried === 'win';
    if (solved) banner = progress && progress.rating && prevCur.r0 ? T_EN.solved + ' ' + (progress.rating - prevCur.r0 >= 0 ? '+' : '') + (progress.rating - prevCur.r0) : T_EN.solved;
    keep = !tried && nowS - (+prevCur.t || 0) < 86400 && !!last0 && last0.id === prevCur.id;
  }
  if (keep) { model = last0; cur = prevCur; }
  else {
    try { model = await prov.fetchPuzzle(ctx); if (caps.personalPuzzles) cur = { id: model.id, t: nowS, r0: rating }; }
    catch (e) {
      if (e && e.status === 401) { notice = 'tokbad'; caps = NO_CAPS; progress = null; }
      model = null;
    }
  }
  if (notice === 'tokbad') return viewModel({ t: T_EN, connect: true, none: true, notice: T_EN.tokbad, trmnl_state: fitState({ v: 1, rating: rating || 0 }) }, nowS);   // a rejected login: reconnect
  if (!model && last0 && last0.board) { model = last0; stale = true; }
  var flip = !!(model && model.turn === 'b');   // side to move at the bottom
  if (ctx.token || ctx.cache.scopes) {
    var scopes = ctx.cache.scopes ? await ctx.cache.scopes : '';
    if (scopes && !/(^|[ ,])puzzle:read([ ,]|$)/.test(scopes) && !notice) notice = 'scope';
  }
  var out = { t: T_EN, none: !model, stale: stale, notice: notice ? T_EN[notice] : '', banner: banner, account: progress, caps: { personal: !!caps.personalPuzzles, solved: !!caps.solvedCheck, history: !!caps.ratingHistory, streak: !!caps.streak }, coords: coords, white_bottom: !flip, show_account: !!progress };
  var foc = ctx.settings.focus && ctx.cache.focus ? await ctx.cache.focus : null;
  if (foc) out.training = foc.k ? T_EN.training + ': ' + themeWords(foc.k) + ' · ' + foc.rate + ' % ' + T_EN.solved_pct : T_EN.no_focus;
  if (ctx.settings.difficulty !== 'normal') out.diff_label = DIFFS[ctx.settings.difficulty];
  if (model) { out.puzzle = model; out.to_move = model.turn === 'w' ? T_EN.white : T_EN.black; }
  var st = { v: 1, rating: rating || 0 };
  if (model && !stale) st.last = slim(model); else if (last0) st.last = last0;
  if (cur) st.cur = cur;
  if (foc && !foc.failed) st.fc = { t: foc.t, k: foc.k, rate: foc.rate };
  if (ctx.cache.weekRows && ctx.cache.weekRows.length && !ctx.cache.weekSaved) st.wk = { t: nowS, d: ctx.cache.weekRows };   // the last good week, for a failed call
  else if (stObj(st0.wk)) st.wk = st0.wk;
  // A Lichess call that failed is said on screen, always (owner 2026-11-14): "Lichess activity: timeout", "HTTP 429", "0 items".
  var problems = [];
  if (ctx.diag.activity) problems.push('Lichess activity: ' + ctx.diag.activity);
  ['account', 'history', 'next'].forEach(function (k) { if (ctx.diag[k]) problems.push('Lichess ' + k + ': ' + ctx.diag[k]); });
  if (problems.length) out.problems = problems;
  out.trmnl_state = fitState(st);
  out.utc_off = ctx.off;
  return viewModel(out, nowS);
}
if (typeof module !== 'undefined' && module.exports) module.exports = { PROVIDERS: PROVIDERS, run: run, viewModel: viewModel, MODES: MODES, parseFen: parseFen, lichessPosition: lichessPosition, lichessModel: lichessModel, lichessMoves: lichessMoves, weekFromDays: weekFromDays, shortThemes: shortThemes, pickWeakest: pickWeakest, pickDifficulty: pickDifficulty };

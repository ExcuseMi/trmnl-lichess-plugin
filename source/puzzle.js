// Chess Puzzle: TRMNL serverless transform (Node). Lichess daily or Chess.com daily puzzle (or alternating by day); with a Lichess
// login the next puzzle at the user's level, kept until solved, plus progress. Hands the page the board, texts and the QR target.
var UA = 'TRMNL Chess Puzzle plugin (contact: https://github.com/ExcuseMi)';
var ST_MAX = 7500;
var T_EN = { white: 'White to move', black: 'Black to move', scan: 'Scan to solve', rating: 'Puzzle', none: 'No puzzle today', none2: 'Could not reach the puzzle service. Showing again at the next refresh.', offline: 'Offline, last puzzle', tokbad: 'Lichess login invalid', solved: 'Solved!', today: 'today', week: 'this week', streak: 'streak', tactics: 'Tactics best', rating_you: 'Your rating', tactics_lbl: 'Tactics best', rush: 'Rush best', connect: 'Connect Lichess to track your progress' };

function field(input, k, d) { var f = (((input || {}).trmnl || {}).plugin_settings || {}).custom_fields_values || (input || {}); var v = f[k]; return v == null || v === '' ? d : v; }
function nowSec(input) { return +((((input || {}).trmnl || {}).system || {}).timestamp_utc) || Math.floor(Date.now() / 1000); }
function stObj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : null; }

async function getRaw(url, headers, ms) {
  var ctl = typeof AbortController === 'function' ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 2500);
  try {
    var r = await fetch(url, { headers: Object.assign({ 'User-Agent': UA, 'Accept': 'application/json' }, headers || {}), signal: ctl ? ctl.signal : undefined });
    var text = await r.text();
    return { status: r.status, text: text };
  } finally { clearTimeout(to); }
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
function clean(s) { return String(s || '').replace(/[^\x20-\x7e -ɏ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60); }

function lichessModel(j) {
  var q = lichessPosition(j), p = j.puzzle || {};
  if (!p.id) throw new Error('no puzzle id');
  var last = q.last || '';
  return { source: 'lichess', id: String(p.id), url: 'https://lichess.org/training/' + encodeURIComponent(p.id), board: q.board, turn: q.turn,
    from: sqIndex(last.slice(0, 2)), to: sqIndex(last.slice(2, 4)), rating: +p.rating || 0, themes: shortThemes(p.themes), title: '' };
}
function chesscomModel(j) {
  var q = parseFen(j.fen);
  if (!/^https:\/\/www\.chess\.com\//.test(j.url || '')) throw new Error('bad chess.com url');
  return { source: 'chesscom', id: String(j.publish_time || ''), url: String(j.url), board: q.board, turn: q.turn, from: -1, to: -1, rating: 0, themes: [], title: clean(j.title) };
}

function accountFromActivity(lines, nowS) {
  var days = [], i, streak = 0, streakOn = true, today = 0, week = 0, d0 = Math.floor(nowS / 86400);
  for (i = 0; i < 7; i++) days.push({ s: 0, f: 0 });
  lines.forEach(function (a) {
    var d = d0 - Math.floor((+a.date || 0) / 86400000);
    if (streakOn) { if (a.win) streak++; else streakOn = false; }
    if (d >= 0 && d < 7) { if (a.win) days[6 - d].s++; else days[6 - d].f++; if (a.win) { week++; if (d === 0) today++; } }
  });
  return { days: days, today: today, week: week, streak: streak };
}
function ndjson(text) { return String(text).split('\n').filter(Boolean).map(function (l) { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean); }

// ==== Providers. One interface, the view reads only the normalised model and the capability flags.
//   id, capabilities (what the provider can do at all), active(ctx) (what it can do for this user now),
//   fetchPuzzle(ctx) -> puzzle { source, id, url, board, turn, from, to, rating, themes, title }
//   fetchProgress(ctx) -> progress { rating, label, delta, trend, history[], today, week, streak, days[7]{s,f}, name } or null
//   isSolved(puzzleId, ctx) -> boolean (only where capabilities.solvedCheck)
// ctx: { settings, token, state, nowS, cache }; a provider may cache one fetch in ctx.cache.
var NO_CAPS = { personalPuzzles: false, solvedCheck: false, ratingHistory: false, streak: false };

function authHeader(ctx) { return { Authorization: 'Bearer ' + ctx.token }; }
async function lichessActivity(ctx) {
  if (!ctx.cache.activity) {
    ctx.cache.activity = getRaw('https://lichess.org/api/puzzle/activity?max=100', authHeader(ctx), 2200).then(function (r) { return r.status === 200 ? ndjson(r.text) : []; }, function () { return []; });
  }
  return ctx.cache.activity;
}
async function lichessAccountInfo(ctx) {
  if (!ctx.cache.account) ctx.cache.account = getJson('https://lichess.org/api/account', authHeader(ctx), 2200);
  return ctx.cache.account;   // a rejected promise is cached too: one 401 is one call
}
var lichessProvider = {
  id: 'lichess',
  capabilities: { personalPuzzles: true, solvedCheck: true, ratingHistory: true, streak: true },
  active: function (ctx) { return ctx.token ? this.capabilities : NO_CAPS; },
  fetchPuzzle: async function (ctx) {
    if (!ctx.token) return lichessModel(await getJson('https://lichess.org/api/puzzle/daily'));
    return lichessModel(await getJson('https://lichess.org/api/puzzle/next?difficulty=' + encodeURIComponent(ctx.settings.difficulty || 'normal'), authHeader(ctx), 2200));
  },
  fetchProgress: async function (ctx) {
    if (!ctx.token) return null;
    var acct = await lichessAccountInfo(ctx);   // throws with .status 401 on a bad token
    var uname = /^[A-Za-z0-9_-]{2,30}$/.test(acct.username || '') ? acct.username : '';
    var got = await Promise.allSettled([lichessActivity(ctx), uname ? getJson('https://lichess.org/api/user/' + uname + '/rating-history', authHeader(ctx), 2200) : Promise.reject(new Error('no user'))]);
    var act = got[0].status === 'fulfilled' ? got[0].value : [], hist = [];
    if (got[1].status === 'fulfilled' && Array.isArray(got[1].value)) {
      var pz = got[1].value.filter(function (x) { return x && x.name === 'Puzzles'; })[0];
      if (pz && Array.isArray(pz.points)) hist = pz.points.slice(-30).map(function (q) { return +q[3] || 0; }).filter(Boolean);
    }
    var rating = acct.perfs && acct.perfs.puzzle ? +acct.perfs.puzzle.rating || 0 : 0;
    return Object.assign(accountFromActivity(act, ctx.nowS), { rating: rating, label: 'rating_you', history: hist, name: uname });
  },
  isSolved: async function (id, ctx) { return (await lichessActivity(ctx)).some(function (a) { return a.win && a.puzzle && a.puzzle.id === id; }); }
};
var chesscomProvider = {
  id: 'chesscom',
  capabilities: NO_CAPS,   // public data only: no personal puzzles, no solved check, no history, no streak
  active: function () { return NO_CAPS; },
  fetchPuzzle: async function () { return chesscomModel(await getJson('https://api.chess.com/pub/puzzle')); },
  fetchProgress: async function (ctx) {
    var u = String(ctx.settings.chesscom_user || '').trim().toLowerCase();
    if (!/^[a-z0-9_-]{2,25}$/.test(u)) return null;
    var j = await getJson('https://api.chess.com/pub/player/' + u + '/stats');
    var hi = stObj(j.tactics) && stObj(j.tactics.highest) ? +j.tactics.highest.rating : 0, lo = stObj(j.tactics) && stObj(j.tactics.lowest) ? +j.tactics.lowest.rating : 0;
    var rush = stObj(j.puzzle_rush) && stObj(j.puzzle_rush.best) ? +j.puzzle_rush.best.score : 0;
    if (!hi && !rush) return null;
    return { rating: hi, low: lo, rush: rush, label: 'tactics', name: u };
  },
  isSolved: async function () { return false; }
};
var PROVIDERS = { lichess: lichessProvider, chesscom: chesscomProvider };

function slim(m) { return { source: m.source, id: m.id, url: m.url, board: m.board, turn: m.turn, from: m.from, to: m.to, rating: m.rating, themes: m.themes, title: m.title }; }
function fitState(st) { var s = JSON.stringify(st); if (s.length > ST_MAX) { delete st.last; } return st; }

async function run(input) {
  var nowS = nowSec(input), st0 = stObj((((input || {}).trmnl || {}).state)) || {};
  var src = String(field(input, 'source', 'lichess')), orient = String(field(input, 'orientation', 'side')), coords = String(field(input, 'coordinates', 'show')) !== 'hide';
  var oauth = stObj(((input || {}).trmnl || {}).oauth) || {}, token = String(oauth.access_token || field(input, 'lichess_token', '') || '').trim();
  var which = src === 'alternate' ? (Math.floor(nowS / 86400) % 2 === 0 ? 'lichess' : 'chesscom') : (src === 'chesscom' ? 'chesscom' : 'lichess');
  var prov = PROVIDERS[which];
  var ctx = { settings: { difficulty: String(field(input, 'difficulty', 'normal')), chesscom_user: String(field(input, 'chesscom_user', '')) }, token: which === 'lichess' ? token : '', state: st0, nowS: nowS, cache: {} };
  var model = null, progress = null, banner = '', notice = '', stale = false, cur = null, caps = prov.active(ctx), rating = +st0.rating || 0;
  var prevCur = stObj(st0.cur), last0 = stObj(st0.last);
  try { progress = await prov.fetchProgress(ctx); } catch (e) { progress = null; if (e && e.status === 401) { notice = 'tokbad'; ctx.token = ''; caps = NO_CAPS; } }
  if (progress && progress.rating && which === 'lichess') {
    var base = prevCur && prevCur.r0 ? +prevCur.r0 : rating;   // the rating when the shown puzzle was picked: the change since then
    if (base) { progress.delta = progress.rating - base; progress.trend = progress.rating > base ? 'up' : progress.rating < base ? 'down' : 'flat'; }
    rating = progress.rating;
  }
  var keep = false;
  if (caps.solvedCheck && prevCur && prevCur.id) {
    var solved = false;
    try { solved = await prov.isSolved(prevCur.id, ctx); } catch (e) { solved = false; }
    if (solved) banner = progress && progress.rating && prevCur.r0 ? T_EN.solved + ' ' + (progress.rating - prevCur.r0 >= 0 ? '+' : '') + (progress.rating - prevCur.r0) : T_EN.solved;
    keep = !solved && nowS - (+prevCur.t || 0) < 86400 && !!last0 && last0.id === prevCur.id;
  }
  if (keep) { model = last0; cur = prevCur; }
  else {
    try { model = await prov.fetchPuzzle(ctx); if (caps.personalPuzzles) cur = { id: model.id, t: nowS, r0: rating }; }
    catch (e) {
      if (e && e.status === 401) { notice = 'tokbad'; caps = NO_CAPS; progress = null; }
      model = null;
      if (ctx.token) { ctx.token = ''; try { model = await prov.fetchPuzzle(ctx); } catch (e2) { model = null; } }   // a personal puzzle that fails: the daily one
    }
  }
  if (!model && last0 && last0.board) { model = last0; stale = true; }
  var flip = orient === 'black' ? true : orient === 'white' ? false : !!(model && model.turn === 'b');
  var out = { t: T_EN, none: !model, stale: stale, notice: notice ? T_EN[notice] : '', banner: banner, account: progress, caps: { personal: !!caps.personalPuzzles, solved: !!caps.solvedCheck, history: !!caps.ratingHistory, streak: !!caps.streak }, coords: coords, white_bottom: !flip, show_account: !!progress };
  if (model) { out.puzzle = model; out.to_move = model.turn === 'w' ? T_EN.white : T_EN.black; }
  var st = { v: 1, rating: rating || 0 };
  if (model && !stale) st.last = slim(model); else if (last0) st.last = last0;
  if (cur) st.cur = cur;
  out.trmnl_state = fitState(st);
  return out;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { PROVIDERS: PROVIDERS, run: run, parseFen: parseFen, lichessPosition: lichessPosition, lichessModel: lichessModel, chesscomModel: chesscomModel, accountFromActivity: accountFromActivity, shortThemes: shortThemes };

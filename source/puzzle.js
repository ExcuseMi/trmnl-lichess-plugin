// Chess Puzzle: TRMNL serverless transform (Node). Lichess daily or Chess.com daily puzzle (or alternating by day); with a Lichess
// login the next puzzle at the user's level, kept until solved, plus progress. Hands the page the board, texts and the QR target.
var UA = 'TRMNL Chess Puzzle plugin (contact: https://github.com/ExcuseMi)';
var ST_MAX = 7500;
var T_EN = { white: 'White to move', black: 'Black to move', scan: 'Scan to solve', rating: 'Puzzle', none: 'No puzzle today', none2: 'Could not reach the puzzle service. Showing again at the next refresh.', offline: 'Offline, last puzzle', tokbad: 'Lichess login invalid', solved: 'Solved!', today: 'today', week: 'this week', streak: 'streak', tactics: 'Tactics best', rating_you: 'Your rating', connect: 'Connect Lichess to track your progress' };

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

// Lichess with a login: returns { model, account, banner, cur, notice }.
async function lichessAccount(token, difficulty, st, nowS) {
  var H = { Authorization: 'Bearer ' + token }, out = { notice: '' }, cur = stObj(st.cur) || null, act = [], acct = null;
  var first = await Promise.allSettled([getJson('https://lichess.org/api/account', H, 2200)]);
  if (first[0].status === 'rejected' && first[0].reason && first[0].reason.status === 401) { out.notice = 'tokbad'; return out; }
  if (first[0].status === 'fulfilled') acct = first[0].value;
  var uname = acct && /^[A-Za-z0-9_-]{2,30}$/.test(acct.username || '') ? acct.username : '';
  var got = await Promise.allSettled([getRaw('https://lichess.org/api/puzzle/activity?max=100', H, 2200), uname ? getJson('https://lichess.org/api/user/' + uname + '/rating-history', H, 2200) : Promise.reject(new Error('no user'))]);
  if (got[0].status === 'fulfilled' && got[0].value.status === 200) act = ndjson(got[0].value.text);
  var hist = [];
  if (got[1].status === 'fulfilled' && Array.isArray(got[1].value)) {
    var pz = got[1].value.filter(function (x) { return x && x.name === 'Puzzles'; })[0];
    if (pz && Array.isArray(pz.points)) hist = pz.points.slice(-30).map(function (q) { return +q[3] || 0; }).filter(Boolean);
  }
  var rating = acct && acct.perfs && acct.perfs.puzzle ? +acct.perfs.puzzle.rating || 0 : 0;
  var prevRating = +st.rating || 0, solved = false;
  if (cur && cur.id) solved = act.some(function (a) { return a.win && a.puzzle && a.puzzle.id === cur.id; });
  var keep = cur && cur.id && !solved && nowS - (+cur.t || 0) < 86400 && stObj(st.last) && st.last.id === cur.id;
  out.account = Object.assign(accountFromActivity(act, nowS), { rating: rating, history: hist, name: acct && acct.username ? String(acct.username).slice(0, 30) : '' });
  var base = cur && cur.r0 ? +cur.r0 : prevRating;   // the rating when the shown puzzle was picked: the change since then
  if (rating && base) { out.account.delta = rating - base; out.account.trend = rating > base ? 'up' : rating < base ? 'down' : 'flat'; }
  if (solved) { out.banner = rating && cur && cur.r0 ? rating - cur.r0 : null; out.solved = true; }
  if (keep) { out.model = st.last; out.cur = cur; return out; }
  try {
    out.model = lichessModel(await getJson('https://lichess.org/api/puzzle/next?difficulty=' + encodeURIComponent(difficulty || 'normal'), H, 2200));
    out.cur = { id: out.model.id, t: nowS, r0: rating };
  } catch (e) { out.model = null; if (e && e.status === 401) out.notice = 'tokbad'; }   // the progress stays; the caller falls back to the daily puzzle
  return out;
}

async function chesscomStats(user) {
  var u = String(user || '').trim().toLowerCase();
  if (!/^[a-z0-9_-]{2,25}$/.test(u)) return null;
  var j = await getJson('https://api.chess.com/pub/player/' + u + '/stats');
  var t = stObj(j.tactics) && stObj(j.tactics.highest) ? +j.tactics.highest.rating : 0;
  return t ? { rating: t, name: u } : null;
}

function slim(m) { return { source: m.source, id: m.id, url: m.url, board: m.board, turn: m.turn, from: m.from, to: m.to, rating: m.rating, themes: m.themes, title: m.title }; }
function fitState(st) { var s = JSON.stringify(st); if (s.length > ST_MAX) { delete st.last; } return st; }

async function run(input) {
  var nowS = nowSec(input), st0 = stObj((((input || {}).trmnl || {}).state)) || {};
  var src = String(field(input, 'source', 'lichess')), orient = String(field(input, 'orientation', 'side')), coords = String(field(input, 'coordinates', 'show')) !== 'hide';
  var oauth = stObj(((input || {}).trmnl || {}).oauth) || {}, token = String(oauth.access_token || field(input, 'lichess_token', '') || '').trim();
  var which = src === 'alternate' ? (Math.floor(nowS / 86400) % 2 === 0 ? 'lichess' : 'chesscom') : (src === 'chesscom' ? 'chesscom' : 'lichess');
  var model = null, account = null, banner = '', notice = '', stale = false, cur = null, rating = +st0.rating || 0;
  try {
    if (which === 'lichess' && token) {
      var a = await lichessAccount(token, String(field(input, 'difficulty', 'normal')), st0, nowS);
      notice = a.notice; model = a.model || null; account = a.account || null; cur = a.cur || null;
      if (a.solved) banner = a.banner == null ? T_EN.solved : T_EN.solved + ' ' + (a.banner >= 0 ? '+' : '') + a.banner;
      if (account && account.rating) rating = account.rating;
    }
  } catch (e) { model = null; if (account && !account.rating) account = null; }
  try {
    if (!model && which === 'lichess') model = lichessModel(await getJson('https://lichess.org/api/puzzle/daily'));
    if (!model && which === 'chesscom') {
      model = chesscomModel(await getJson('https://api.chess.com/pub/puzzle'));
      var cu = field(input, 'chesscom_user', '');
      if (cu) { try { var cs = await chesscomStats(cu); if (cs) account = { rating: cs.rating, name: cs.name, tactics: true }; } catch (e2) { account = null; } }
    }
  } catch (e) {
    var last = stObj(st0.last);
    if (last && last.board) { model = last; stale = true; }
  }
  var flip = orient === 'black' ? true : orient === 'white' ? false : !!(model && model.turn === 'b');
  var out = { t: T_EN, none: !model, stale: stale, notice: notice ? T_EN[notice] : '', banner: banner, account: account, coords: coords,
    white_bottom: !flip, show_account: !!account };
  if (model) { out.puzzle = model; out.to_move = model.turn === 'w' ? T_EN.white : T_EN.black; }
  var st = { v: 1, rating: rating || 0 };
  if (model && !stale) st.last = slim(model);
  else if (stObj(st0.last)) st.last = st0.last;
  if (cur) st.cur = cur; else if (stObj(st0.cur) && !notice) st.cur = st0.cur;
  out.trmnl_state = fitState(st);
  return out;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { run: run, parseFen: parseFen, lichessPosition: lichessPosition, lichessModel: lichessModel, chesscomModel: chesscomModel, accountFromActivity: accountFromActivity, shortThemes: shortThemes };

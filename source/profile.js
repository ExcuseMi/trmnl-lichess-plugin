// "Profile" mode (mode = profile): the user's Lichess overview at a glance, no board. Calls (all inside TRMNL's 5 s, side by side
// once the name is known): GET /api/account (token), GET /api/user/{name}/rating-history (public), GET /api/games/user/{name}?max=10&rated=true
// (ndjson). The last good profile is saved in the state ("pf") and stands in for a call that fails (said on screen).
var PF_EN = { none: 'No profile to show', none2: 'Could not reach Lichess. Showing again at the next refresh.', member: 'Member since', ratings: 'Ratings', rating_h: 'Rating', change_h: '30 days', games_h: 'Games',
  chart_h: 'last 90 days', recent: 'Recent games', no_recent: 'No rated games yet', s_games: 'Games', s_record: 'Won / lost / drawn', s_time: 'Time played', s_puzzles: 'Puzzles', s_storm: 'Storm best', offline_pf: 'Offline, last profile', low: 'Low', high: 'High', games_w: 'games' };
// perf key -> [name, short name for narrow views]; the keys of GET /api/account "perfs". Storm, racer and streak are not rating perfs.
var PF_PERFS = { bullet: ['Bullet', 'Bullet'], ultraBullet: ['UltraBullet', 'Ultra'], blitz: ['Blitz', 'Blitz'], rapid: ['Rapid', 'Rapid'], classical: ['Classical', 'Classical'], correspondence: ['Correspondence', 'Corr.'],
  chess960: ['Chess960', '960'], crazyhouse: ['Crazyhouse', 'Crazy'], antichess: ['Antichess', 'Anti'], atomic: ['Atomic', 'Atomic'], horde: ['Horde', 'Horde'], kingOfTheHill: ['King of the Hill', 'KotH'],
  racingKings: ['Racing Kings', 'Racing'], threeCheck: ['Three-check', '3-check'], puzzle: ['Puzzles', 'Puzzles'] };
var PF_ROWS_MAX = 8, PF_DAYS = 90, PF_POINTS_MAX = 45, PF_FORM_MAX = 10, USER_RE = /^[A-Za-z0-9_-]{2,30}$/;
var MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
function num(n) { return String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function perfKey(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
// The history rows of one perf as [timestamp s, rating], oldest first (Lichess months count from 0). Names match by letters: "King of the Hill" = kingOfTheHill, "Puzzles" = puzzle.
function perfPoints(hist, key) {
  var want = key === 'puzzle' ? 'puzzles' : perfKey(key), e = (Array.isArray(hist) ? hist : []).filter(function (x) { return x && perfKey(x.name) === want && Array.isArray(x.points); })[0];
  return e ? e.points.filter(function (p) { return Array.isArray(p) && +p[3] > 0; }).map(function (p) { return [Date.UTC(+p[0], +p[1], +p[2]) / 1000, +p[3]]; }) : [];
}
// The rating change over the last 30 days: the rating now minus the last one on or before day -30 (else the first one inside the window); null without history.
function change30(points, now, nowS) {
  if (!points.length || !now) return null;
  var cut = nowS - 30 * 86400, base = null, i;
  for (i = 0; i < points.length; i++) if (points[i][0] <= cut) base = points[i][1];
  if (base == null) { for (i = 0; i < points.length; i++) if (points[i][0] > cut) { base = points[i][1]; break; } }
  return base == null ? null : now - base;
}
// The rows of the ratings panel: the perfs the user plays (games > 0), most played first.
function perfRows(acct, hist, nowS, oldRows) {
  var P = acct && acct.perfs && typeof acct.perfs === 'object' ? acct.perfs : {}, old = {};
  (oldRows || []).forEach(function (r) { old[r.k] = r; });
  return Object.keys(PF_PERFS).filter(function (k) { return P[k] && +P[k].games > 0 && +P[k].rating > 0; }).map(function (k) {
    var p = P[k], c = hist ? change30(perfPoints(hist, k), +p.rating, nowS) : old[k] ? old[k].change : null;
    return { k: k, name: PF_PERFS[k][0], short: PF_PERFS[k][1], rating: Math.round(+p.rating), prov: !!p.prov, games: +p.games, games_text: num(p.games), change: c == null || p.prov ? '' : signed(c) };
  }).sort(function (a, b) { return b.games - a.games; }).slice(0, PF_ROWS_MAX);
}
// The main chart: the rating of the most played rating perf (puzzles only when it is the only one) over the last 90 days; null under 2 points.
function chartFor(rows, hist, nowS) {
  var order = rows.filter(function (r) { return r.k !== 'puzzle'; }).concat(rows.filter(function (r) { return r.k === 'puzzle'; }));
  for (var i = 0; i < order.length; i++) {
    var cut = nowS - PF_DAYS * 86400, pts = perfPoints(hist, order[i].k), inside = pts.filter(function (p) { return p[0] >= cut; });
    if (inside.length < 2) continue;
    var v = inside.map(function (p) { return p[1]; });
    while (v.length > PF_POINTS_MAX) v = v.filter(function (x, j) { return j % 2 === 0 || j === v.length - 1; });
    return { k: order[i].k, name: order[i].name, pts: v, lo: Math.min.apply(null, v), hi: Math.max.apply(null, v) };
  }
  return null;
}
function statsFor(acct, rows) {
  var c = acct.count || {}, s = [], pt = acct.playTime && +acct.playTime.total, pz = acct.perfs && acct.perfs.puzzle, st = acct.perfs && acct.perfs.storm;
  if (+c.all > 0) s.push([PF_EN.s_games, num(c.all)]);
  if (+c.all > 0) s.push([PF_EN.s_record, num(c.win) + ' / ' + num(c.loss) + ' / ' + num(c.draw)]);
  if (pt > 0) s.push([PF_EN.s_time, timeLeft(pt)]);
  if (pz && +pz.games > 0 && +pz.rating > 0) s.push([PF_EN.s_puzzles, String(Math.round(+pz.rating))]);
  if (st && +st.runs > 0 && +st.score > 0) s.push([PF_EN.s_storm, num(st.score)]);
  return s;
}
// Results of the last rated games, oldest first (so the newest sits at the right): W / L / D.
function formFor(rows, me) {
  return rows.map(function (g) { var i = lastGameInfo(g, me); return i ? { c: i.res === 'won' ? 'W' : i.res === 'lost' ? 'L' : 'D' } : null; }).filter(Boolean).slice(0, PF_FORM_MAX).reverse();
}
async function runProfile(input, token, nowS, st0) {
  var t0 = Date.now(), H = authHeader({ token: token }), T = Object.assign({}, T_EN, PF_EN), diag = {}, saved = stObj(st0.pf), noop = function () {};
  var keep = function (st) { ['rating', 'wk', 'last', 'cur'].forEach(function (k) { if (st0[k] != null) st[k] = st0[k]; }); return st; };   // the puzzle mode's state stays for the way back
  var left = function () { return Math.max(400, Math.min(3500, 4800 - (Date.now() - t0))); };   // inside TRMNL's 5 s
  var acctP = getJson('https://lichess.org/api/account', H, LT); acctP.catch(noop);
  var start = function (u, ms) {   // rating history and the last games, side by side
    var h = getJson('https://lichess.org/api/user/' + u + '/rating-history', H, ms), g = getRaw('https://lichess.org/api/games/user/' + u + '?max=' + PF_FORM_MAX + '&rated=true&ongoing=false&moves=false&tags=false&clocks=false&evals=false&opening=false', Object.assign({ Accept: 'application/x-ndjson' }, H), Math.min(ms, 2200))
      .then(function (r) { if (r.status !== 200) throw Object.assign(new Error('http'), { status: r.status }); return ndjson(r.text); });
    h.catch(noop); g.catch(noop);
    return { h: h, g: g, u: u };
  };
  var guess = saved && USER_RE.test(saved.name || '') ? saved.name : '', calls = guess ? start(guess, LT) : null, acct = null;
  try { acct = await acctP; } catch (e) {
    if (e && (e.status === 401 || e.status === 403)) return viewModel({ t: T, connect: true, none: true, notice: T.tokbad, trmnl_state: fitState(keep({ v: 1 })) }, nowS);
    diag.account = callError(e);
  }
  var pf = null, stale = false, problems = [];
  if (acct && !USER_RE.test(acct.username || '')) { diag.account = 'bad answer'; acct = null; }
  if (acct) {
    if (!calls || calls.u.toLowerCase() !== acct.username.toLowerCase()) calls = start(acct.username, left());   // no saved name (or a renamed account): after the account
    var hist = null, games = null;
    try { hist = await calls.h; if (!Array.isArray(hist)) { hist = null; diag.history = 'bad answer'; } } catch (e) { diag.history = callError(e); }
    try { games = await calls.g; } catch (e) { diag.games = callError(e); }
    var sv = saved && saved.name === acct.username ? saved : null;   // a saved part only stands in for the same user
    var rows = perfRows(acct, hist, nowS, sv && sv.rows), ch = hist ? chartFor(rows, hist, nowS) : sv && sv.chart && rows.some(function (r) { return r.k === sv.chart.k; }) ? sv.chart : null;
    var form = games ? formFor(games, acct.username) : sv && sv.form || [];
    var ca = acct.createdAt ? new Date(+acct.createdAt) : null;
    pf = { name: acct.username, title: clean(acct.title || '').slice(0, 4), since: ca && isFinite(ca) ? MONTHS[ca.getUTCMonth()] + ' ' + ca.getUTCFullYear() : '', rows: rows, chart: ch, stats: statsFor(acct, rows), form: form };
  } else if (saved && saved.rows && saved.name) { pf = saved; stale = true; }
  var out = { t: T, mode: 'profile', none: !pf, calm: !pf, stale: stale, notice: '', banner: '', account: null, show_account: false, caps: {}, coords: true, white_bottom: true, lines: [] };
  if (pf) out.pf = pf; else out.calm_line = T.none2;
  if (diag.account) problems.push('Lichess account: ' + diag.account);
  if (diag.history) problems.push('Lichess history: ' + diag.history);
  if (diag.games) problems.push('Lichess games: ' + diag.games);
  if (problems.length) out.problems = problems;
  var st = keep({ v: 1 });
  if (pf) st.pf = pf;
  out.trmnl_state = fitState(st);
  return viewModel(out, nowS);
}

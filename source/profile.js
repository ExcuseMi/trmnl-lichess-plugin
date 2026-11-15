// "Profile" mode (mode = profile): the user's Lichess overview at a glance, no board. Calls (all inside TRMNL's 5 s, side by side
// once the name is known): GET /api/account (token), GET /api/user/{name}/rating-history (public), GET /api/games/user/{name}?max=10&rated=true
// (ndjson). The last good profile is saved in the state ("pf") and stands in for a call that fails (said on screen).
var PF_EN = { none: 'No profile to show', none2: 'Could not reach Lichess. Showing again at the next refresh.', member: 'Member since', change_h: '30 days', games_w: 'games',
  recent: 'Recent games', no_recent: 'No rated games yet', s_storm: 'Storm best', played: 'played', offline_pf: 'Offline, last profile', peak: 'Peak', now: 'now',
  week: 'This week', won: 'won', lost: 'lost', drawn: 'drawn', week_none: 'No rated games this week', in_row: 'in a row', win1: 'win', wins: 'wins', loss1: 'loss', losses: 'losses', draw1: 'draw', draws: 'draws' };
// perf key -> [name, short name for narrow views]; the keys of GET /api/account "perfs". Storm, racer and streak are not rating perfs.
var PF_PERFS = { bullet: ['Bullet', 'Bullet'], ultraBullet: ['UltraBullet', 'Ultra'], blitz: ['Blitz', 'Blitz'], rapid: ['Rapid', 'Rapid'], classical: ['Classical', 'Classical'], correspondence: ['Correspondence', 'Corr.'],
  chess960: ['Chess960', 'Chess960'], crazyhouse: ['Crazyhouse', 'Crazy'], antichess: ['Antichess', 'Anti'], atomic: ['Atomic', 'Atomic'], horde: ['Horde', 'Horde'], kingOfTheHill: ['King of the Hill', 'KotH'],
  racingKings: ['Racing Kings', 'Racing'], threeCheck: ['Three-check', '3-check'], puzzle: ['Puzzles', 'Puzzles'] };
var PF_ROWS_MAX = 8, PF_DAYS = 90, PF_POINTS_MAX = 45, PF_TREND_MAX = 16, PF_RECENT_MAX = 30, PF_CARD_MAX = 9, USER_RE = /^[A-Za-z0-9_-]{2,30}$/;
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
// The change over the last `days` days: the rating now minus the last one on or before that day (else the first one inside the window); null without history.
function changeN(points, now, nowS, days) {
  if (!points.length || !now) return null;
  var cut = nowS - days * 86400, base = null, i;
  for (i = 0; i < points.length; i++) if (points[i][0] <= cut) base = points[i][1];
  if (base == null) { for (i = 0; i < points.length; i++) if (points[i][0] > cut) { base = points[i][1]; break; } }
  return base == null ? null : now - base;
}
// The last `days` days of one perf's history, at most `max` points (thinned evenly, the newest kept); [] under 2 points.
function recentPts(points, nowS, days, max) {
  var v = points.filter(function (p) { return p[0] >= nowS - days * 86400; }).map(function (p) { return p[1]; });
  while (v.length > max) v = v.filter(function (x, j) { return j % 2 === 0 || j === v.length - 1; });
  return v.length < 2 ? [] : v;
}
// The perfs the user plays (games > 0), most played first. Each: rating, provisional, 30-day change, peak and a 90-day trend from the history
// (a saved perf stands in for each when the history call failed).
function perfRows(acct, hist, nowS, oldRows) {
  var P = acct && acct.perfs && typeof acct.perfs === 'object' ? acct.perfs : {}, old = {};
  (oldRows || []).forEach(function (r) { if (r && r.k) old[r.k] = r; });
  return Object.keys(PF_PERFS).filter(function (k) { return P[k] && +P[k].games > 0 && +P[k].rating > 0; }).map(function (k) {
    var p = P[k], o = old[k] || {}, rating = Math.round(+p.rating), pts = hist ? perfPoints(hist, k) : null, c = pts ? change30(pts, rating, nowS) : o.c30 == null ? null : o.c30;
    var peak = null;
    if (pts) pts.forEach(function (q) { if (!peak || q[1] >= peak[1]) peak = q; });
    var r = { k: k, name: PF_PERFS[k][0], short: PF_PERFS[k][1], rating: rating, prov: !!p.prov, games: +p.games, games_text: num(p.games), c30: p.prov ? null : c,
      change: c == null || p.prov ? '' : signed(c), trend: pts ? recentPts(pts, nowS, PF_DAYS, PF_TREND_MAX) : o.trend || [] };
    if (pts) { var wk = changeN(pts, rating, nowS, 7); r.c7 = wk == null ? null : wk; } else r.c7 = o.c7 == null ? null : o.c7;
    if (pts && peak) { var d = new Date(peak[0] * 1000); r.peak = Math.max(peak[1], rating); r.peak_when = peak[1] >= rating ? MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear() : PF_EN.now; }
    else if (o.peak) { r.peak = o.peak; r.peak_when = o.peak_when; }
    return r;
  }).sort(function (a, b) { return b.games - a.games; }).slice(0, PF_ROWS_MAX);
}
// The hero: the most played rating perf (puzzles only when it is the only one); the other perfs become cards.
function heroOf(rows) { return rows.filter(function (r) { return r.k !== 'puzzle'; })[0] || rows[0] || null; }
// The hero's chart: its last 90 days, at most 45 points; null under 2 points.
function chartFor(hero, hist, nowS) {
  if (!hero) return null;
  var v = hist ? recentPts(perfPoints(hist, hero.k), nowS, PF_DAYS, PF_POINTS_MAX) : [];
  return v.length < 2 ? null : { k: hero.k, name: hero.name, pts: v, lo: Math.min.apply(null, v), hi: Math.max.apply(null, v) };
}
// Header extras on one line: Storm best and time played.
function extraLine(acct) {
  var pt = acct.playTime && +acct.playTime.total, st = acct.perfs && acct.perfs.storm, s = [];
  if (st && +st.runs > 0 && +st.score > 0) s.push(PF_EN.s_storm + ' ' + num(st.score));
  if (pt > 0) s.push(timeLeft(pt) + ' ' + PF_EN.played);
  return s.join(' · ');
}
var PF_SPEED = { ultraBullet: 'UltraBullet', bullet: 'Bullet', blitz: 'Blitz', rapid: 'Rapid', classical: 'Classical', correspondence: 'Corr.' };
// The recent rated games, newest first: result chip, opponent (rating), time control; and the week: games played in the last 7 days,
// won / lost / drawn (one bar segment per game, wins first), the current streak of the same result.
function recentFor(games, me) {
  return games.map(function (g) {
    var i = lastGameInfo(g, me); if (!i) return null;
    var name = i.opp.length > 16 ? i.opp.slice(0, 15) + '…' : i.opp;
    return { c: i.res === 'won' ? 'W' : i.res === 'lost' ? 'L' : 'D', opp: name + (i.opp_rating ? ' (' + i.opp_rating + ')' : ''), tc: PF_SPEED[g.speed] || PF_PERFS[g.perf] && PF_PERFS[g.perf][1] || '', t: Math.floor((+g.lastMoveAt || +g.createdAt || 0) / 1000) };
  }).filter(Boolean).slice(0, PF_RECENT_MAX);
}
function weekFor(recent, nowS, hero) {
  var wk = recent.filter(function (g) { return g.t >= nowS - 7 * 86400; }), n = { W: 0, L: 0, D: 0 };
  wk.forEach(function (g) { n[g.c]++; });
  var run = 0, c0 = recent.length ? recent[0].c : '';
  while (run < recent.length && recent[run].c === c0) run++;
  var word = { W: [PF_EN.win1, PF_EN.wins], L: [PF_EN.loss1, PF_EN.losses], D: [PF_EN.draw1, PF_EN.draws] }[c0];
  return { n: wk.length, more: wk.length >= PF_RECENT_MAX, won: n.W, lost: n.L, drawn: n.D,
    bar: [].concat(Array(n.W).fill('W'), Array(n.D).fill('D'), Array(n.L).fill('L')),
    change: hero && hero.c7 != null && !hero.prov ? signed(hero.c7) : '', change_name: hero ? hero.name : '',
    streak: run >= 2 && word ? run + ' ' + word[1] + ' ' + PF_EN.in_row : '' };
}
async function runProfile(input, token, nowS, st0) {
  var H = authHeader({ token: token }), T = Object.assign({}, T_EN, PF_EN), diag = {}, saved = stObj(st0.pf), noop = function () {};
  var keep = function (st) { ['rating', 'wk', 'last', 'cur'].forEach(function (k) { if (st0[k] != null) st[k] = st0[k]; }); return st; };   // the puzzle mode's state stays for the way back
  var acctP = getJson('https://lichess.org/api/account', H, LT); acctP.catch(noop);
  var start = function (u, ms) {   // rating history and the last games, side by side
    var h = getJson('https://lichess.org/api/user/' + u + '/rating-history', H, ms), g = getRaw('https://lichess.org/api/games/user/' + u + '?max=' + PF_RECENT_MAX + '&rated=true&ongoing=false&moves=false&tags=false&clocks=false&evals=false&opening=false', Object.assign({ Accept: 'application/x-ndjson' }, H), Math.min(ms, 2200))
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
    if (!calls || calls.u.toLowerCase() !== acct.username.toLowerCase()) calls = start(acct.username, runLeft(3500));   // no saved name (or a renamed account): after the account
    var hist = null, games = null;
    try { hist = await calls.h; if (!Array.isArray(hist)) { hist = null; diag.history = 'bad answer'; } } catch (e) { diag.history = callError(e); }
    try { games = await calls.g; } catch (e) { diag.games = callError(e); }
    var sv = saved && saved.name === acct.username ? saved : null;   // a saved part only stands in for the same user
    var rows = perfRows(acct, hist, nowS, sv && sv.rows), hero = heroOf(rows);
    var ch = hist ? chartFor(hero, hist, nowS) : sv && sv.chart && hero && sv.chart.k === hero.k ? sv.chart : null;
    var recent = games ? recentFor(games, acct.username) : sv && sv.recent || [];
    var ca = acct.createdAt ? new Date(+acct.createdAt) : null;
    pf = { name: acct.username, title: clean(acct.title || '').slice(0, 4), since: ca && isFinite(ca) ? MONTHS[ca.getUTCMonth()] + ' ' + ca.getUTCFullYear() : '', extra: extraLine(acct),
      rows: rows, chart: ch, recent: recent };
  } else if (saved && saved.rows && saved.name) { pf = saved; stale = true; }
  var out = { t: T, mode: 'profile', none: !pf, calm: !pf, stale: stale, notice: '', banner: '', account: null, show_account: false, caps: {}, coords: true, white_bottom: true, lines: [] };
  if (pf) {
    var hr = heroOf(pf.rows || []);
    out.pf = Object.assign({}, pf, { hero: hr, cards: (pf.rows || []).filter(function (r) { return r !== hr; }).slice(0, PF_CARD_MAX).map(function (r) { return Object.assign({}, r); }), week: weekFor(pf.recent || [], nowS, hr), show: (pf.recent || []).slice(0, 12) });
    out.sparks = [];   // the page script draws these: the hero chart and one trend per card
    if (pf.chart) out.sparks.push({ id: 'ym-spark', pts: pf.chart.pts, hero: true });
    out.pf.cards.forEach(function (c, i) { if (c.trend && c.trend.length > 1) { c.spark = 'ym-tr' + i; out.sparks.push({ id: c.spark, pts: c.trend }); } });
  } else out.calm_line = T.none2;
  if (diag.account) problems.push('Lichess account: ' + diag.account);
  if (diag.history) problems.push('Lichess history: ' + diag.history);
  if (diag.games) problems.push('Lichess games: ' + diag.games);
  if (problems.length) out.problems = problems;
  var st = keep({ v: 1 });
  if (pf) st.pf = pf;
  out.trmnl_state = fitState(st);
  return viewModel(out, nowS);
}

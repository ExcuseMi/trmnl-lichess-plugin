// "Top game" (mode = top) and "Follow a player" (mode = following) modes: one game on a board with both players, their clocks, the
// event, the recent moves and a QR to watch it. A refresh is 15-60 min, so the position stays meaningful: who plays, the clocks as
// they were, the last moves. Public endpoints only (the token is sent when there is one; both modes work without a login), all inside TRMNL's 5 s.
//   Top game: broadcast first (GET /api/broadcast/top, the rounds in play of the highest tiers, GET /api/broadcast/-/-/{round} for the
//   boards, GET /api/study/{round}/{game}.pgn for the moves), else Lichess TV (GET /api/tv/channels, GET /game/export/{id}).
//   Follow: GET /api/user/{name}/current-game (the ongoing game, else the last one played).
// The model is the Your games one (out.puzzle: board, turn, last move, QR target, moves) with out.puzzle.game = { w, b, event, round,
// kind, status: live|done, res }; w and b: { name, title, rating, clock (centiseconds or null) }.
var LV_EN = { scan_live: 'Scan to watch', scan_game: 'Scan to watch', live: 'Live', offline_g: 'Offline', board_w: 'Board', tv: 'TV', tv_long: 'Lichess TV',
  top_none: 'No live game right now', top_none2: 'No broadcast or TV game to show. Looking again at the next refresh.', fl_empty: 'Follow a player', fl_empty2: 'Enter a Lichess username in the plugin settings.',
  fl_unknown: 'Unknown player', fl_unknown2: 'Check the name in the plugin settings.', lv_fail: 'Could not reach Lichess. Showing again at the next refresh.', fl_nogame: 'No game to show',
  playing_now: 'Playing now', last_game: 'Last game', won: 'Won', lost: 'Lost', draw: 'Draw', rated: 'rated', finished: 'Finished', anon: 'Anonymous', computer: 'Computer', broadcast: 'Broadcast' };
var BC_TOP_MAX = 3;   // rounds in play looked at (highest tiers first), one at a time until one has a board in play
// Clock (centiseconds) as it is read on a board: "1:29:33", "19:20", "0:45"; '' without one.
function clockText(cs) {
  if (cs == null || !isFinite(cs) || cs < 0) return '';
  var s = Math.floor(cs / 100), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, p = function (n) { return (n < 10 ? '0' : '') + n; };
  return h ? h + ':' + p(m) + ':' + p(x) : m + ':' + p(x);
}
// A name for the narrow quadrant: the surname of "Surname, First", else the name cut to 12.
function shortName(s) { s = String(s || ''); var i = s.indexOf(','); return cut(i > 0 ? s.slice(0, i) : s, 12); }
function cut(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
// The event name for the title bar and the event card: before the first " | " (sections), no year, cut to n characters.
function shortEvent(name, n) {
  var s = clean(String(name || '').split(' | ')[0]).replace(/\s*\b20\d\d(\/\d\d)?\b\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (!/[A-Za-z\u00c0-\u024f\u0370-\u03ff\u0400-\u04ff]/.test(s)) s = LV_EN.broadcast;   // a name in a script the font lacks
  return cut(s, n || 24);
}
function resFromWinner(w) { return w === 'white' ? '1-0' : w === 'black' ? '0-1' : '½-½'; }
// SAN moves out of a PGN movetext: tags, {comments}, (variations), move numbers, NAGs and the result are dropped.
function pgnSans(text) {
  var body = String(text || '').replace(/^\s*\[[^\]]*\]\s*$/gm, '').replace(/\{[^}]*\}/g, ' ').replace(/\([^)]*\)/g, ' ').replace(/\$\d+/g, ' ');
  return body.split(/\s+/).filter(function (t) { return t && !/^\d+\.+$/.test(t) && !/^(1-0|0-1|1\/2-1\/2|½-½|\*)$/.test(t); }).map(function (t) { return t.replace(/^\d+\.+/, ''); }).filter(Boolean);
}
function playerOf(p, side) {   // a player of a broadcast game or a Lichess game; a name in a script the font lacks becomes White or Black
  p = p || {};
  var u = p.user || {}, name = clean(p.name || u.name || u.id || (p.aiLevel ? LV_EN.computer + ' ' + p.aiLevel : LV_EN.anon));
  if (!/[0-9A-Za-z\u00c0-\u024f\u0370-\u03ff\u0400-\u04ff]/.test(name)) name = side === 'b' ? T_EN.side_b : T_EN.side_w;
  return { name: name.slice(0, 30), title: clean(p.title || u.title || '').replace(/^BOT$/, '').slice(0, 4), rating: +p.rating || 0, clock: p.clock != null && isFinite(p.clock) ? +p.clock : null };
}
// One position from a SAN list (chess.js), as the models of Your games: board, turn, last move, the move pairs; null when it does not replay.
function liveBase(sans) {
  var rp = replayGame(sans);
  if (!rp) return null;
  return { board: rp.board, turn: sans.length % 2 ? 'b' : 'w', from: rp.from, to: rp.to, moves: rp.moves };
}
function liveModel(base, id, url, game) {
  return { source: 'live', id: String(id || ''), url: url, board: base.board, turn: base.turn, from: base.from, to: base.to, rating: 0, themes: [], title: '', moves: base.moves || [], plays: 0, game: game };
}
// A Lichess game as JSON (GET /game/export/{id} or a row of GET /api/games/user): standard chess only (variants do not replay).
function lichessLiveModel(j, extra) {
  if (!j || !GAME_ID.test(j.id || '') || (j.variant && j.variant !== 'standard') || !j.players) return null;
  var sans = typeof j.moves === 'string' ? j.moves.split(/\s+/).filter(Boolean) : [], base = liveBase(sans);
  if (!base) return null;
  var w = playerOf(j.players.white, 'w'), b = playerOf(j.players.black, 'b'), cl = Array.isArray(j.clocks) ? j.clocks : [], n = sans.length;
  var at = function (par) { var i = n - 1; if (i >= 0 && i % 2 !== par) i--; return i >= 0 && isFinite(cl[i]) ? +cl[i] : null; };
  w.clock = at(0); b.clock = at(1);
  var live = j.status === 'started' || j.status === 'created', c = j.clock && +j.clock.initial >= 0 ? j.clock : null;
  var speed = String(j.speed || j.perf || '');
  var kind = (speed ? speed.charAt(0).toUpperCase() + speed.slice(1) : '') + (c ? ' ' + (+c.initial >= 60 ? Math.round(+c.initial / 60) : +c.initial + 's') + '+' + (+c.increment || 0) : '');
  var game = Object.assign({ w: w, b: b, event: kind.trim(), round: '', kind: kind.trim(), rated: !!j.rated, status: live ? 'live' : 'done', res: live ? '' : j.winner ? resFromWinner(j.winner) : isDraw(j) ? '½-½' : '', winner: j.winner || '', n_moves: Math.ceil(n / 2) }, extra || {});
  return liveModel(base, j.id, 'https://lichess.org/' + j.id, game);
}
// A broadcast board (a row of games in GET /api/broadcast/-/-/{round}) from its fen, last move and players.
function broadcastModel(g, round, tour, index, sans) {
  if (!g || !GAME_ID.test(g.id || '') || typeof g.fen !== 'string' || !Array.isArray(g.players) || g.players.length < 2) return null;
  var q = parseFen(g.fen), last = String(g.lastMove || ''), pairs = sans && sans.length ? sanPairs(sans, q.board) : [];   // a list that does not replay to this board is dropped
  var w = playerOf(g.players[0], 'w'), b = playerOf(g.players[1], 'b'), live = g.status === '*', st = String(g.status || '*');
  var url = 'https://lichess.org/study/' + round.id + '/' + g.id;   // Lichess sends a broadcast study to its broadcast page; the short link keeps the QR small
  var game = { w: w, b: b, event: shortEvent(tour.name, 40), round: clean(round.name || '') + (index >= 0 ? ' · ' + LV_EN.board_w + ' ' + (index + 1) : ''), kind: '', status: live ? 'live' : 'done', res: live ? '' : st === '1-0' || st === '0-1' ? st : '½-½', n_moves: sans && sans.length ? Math.ceil(sans.length / 2) : 0 };
  return liveModel({ board: q.board, turn: q.turn, from: sqIndex(last.slice(0, 2)), to: sqIndex(last.slice(2, 4)), moves: pairs }, g.id, url, game);
}
function boardsOf(games) {   // the boards in play, highest rated pair first (a board without a last move has not started)
  return (Array.isArray(games) ? games : []).map(function (g, i) { return { g: g, i: i }; }).filter(function (x) {
    var g = x.g; return g && g.status === '*' && typeof g.fen === 'string' && g.lastMove && Array.isArray(g.players) && g.players.length > 1 && GAME_ID.test(g.id || '');
  }).sort(function (a, b) { var r = function (x) { return (+x.g.players[0].rating || 0) + (+x.g.players[1].rating || 0); }; return r(b) - r(a) || a.i - b.i; });
}

// The view model of both modes, from out.puzzle: the two player cards (black first, as on the board), the event card, the status chip.
function liveView(out, P) {
  var G = P.game || {}, T = out.t, live = G.status === 'live', rows = out.rows || [];
  out.cards = ['b', 'w'].map(function (side) {
    var p = G[side] || {}, mover = live && P.turn === side, sub = p.rating ? String(p.rating) : '';   // the side to move is marked by a chevron before the name (shared.liquid), not by text
    return { side: side, black: side === 'b', name: cut(p.name, 20), short: shortName(p.name), title: p.title || '', sub: sub, mover: mover, clock: clockText(p.clock) };
  });
  out.event_name = cut(G.event || '', 40); out.event_short = cut(G.event || '', 16);
  out.round_line = G.round || ''; out.status_text = out.stale ? T.offline_g : live ? T.live : (G.res_text || G.res || T.finished);   // a saved game is never called live
  out.show_info = true;
  return out;
}
// Shared end of both runs: the saved game, the failure lines, the state.
function liveOut(T, mode, model, o) {
  var out = { t: T, mode: mode, none: !model, calm: !model, stale: !!o.stale, notice: '', banner: '', account: null, show_account: false, caps: {}, coords: true, white_bottom: true, lines: [], instance_arg: o.arg || '' };
  if (model) {
    var live = model.game.status === 'live' && !o.stale;
    out.puzzle = model; out.to_move = model.turn === 'w' ? T.white : T.black;
    out.t = Object.assign({}, T, { scan: live ? T.scan_live : T.scan_game });
  } else { out.t = Object.assign({}, T, o.calm || {}); out.calm_line = (o.calm || {}).line; }
  if (o.problems && o.problems.length) out.problems = o.problems;
  return out;
}

async function runTop(input, token, nowS, st0) {
  var H = authHeader({ token: token }), T = Object.assign({}, T_EN, LV_EN), diag = {}, saved = stObj(st0.tg), noop = function () {};
  var keep = function (st) { ['rating', 'wk', 'last', 'cur'].forEach(function (k) { if (st0[k] != null) st[k] = st0[k]; }); return st; };   // the puzzle mode's state stays for the way back
  var topP = getJson('https://lichess.org/api/broadcast/top', H, LT);   // TV is the fallback, asked only when no broadcast board is in play
  topP.catch(noop);
  var model = null, arg = '', finished = null, stale = false, top = null;
  try { top = await topP; } catch (e) {
    if (e && e.status === 401) return viewModel({ t: T, connect: true, none: true, notice: T.tokbad, trmnl_state: fitState(keep({ v: 1 })) }, nowS);   // expired or revoked login: reconnect
    diag.broadcast = callError(e);
  }
  if (top && !Array.isArray(top.active)) { diag.broadcast = 'bad answer'; top = null; }
  if (top) {
    var cands = top.active.filter(function (a) { return a && a.round && a.round.ongoing && GAME_ID.test(a.round.id || '') && a.tour; })
      .map(function (a, i) { return { a: a, i: i }; }).sort(function (x, y) { return (+y.a.tour.tier || 0) - (+x.a.tour.tier || 0) || x.i - y.i; }).slice(0, BC_TOP_MAX).map(function (x) { return x.a; });
    var pick = null;
    for (var i = 0; i < cands.length && !pick; i++) {   // one round at a time, highest tier first, until one has a board in play
      var rj = null;
      try { rj = await getJson('https://lichess.org/api/broadcast/-/-/' + cands[i].round.id, H, runLeft(1500)); } catch (e) { diag.round = callError(e); if (runLeft() < RUN_MIN) break; continue; }
      var games = rj && rj.games, boards = boardsOf(games);
      if (boards.length) pick = { a: cands[i], j: rj, b: boards[0] };
      if (!finished && Array.isArray(games) && games.length) finished = { a: cands[i], j: rj };
    }
    if (pick) {
      var g = pick.b.g, round = Object.assign({}, pick.a.round, pick.j.round || {}), tour = Object.assign({}, pick.a.tour, pick.j.tour || {}), sans = null;
      try {
        var pr = await getRaw('https://lichess.org/api/study/' + round.id + '/' + g.id + '.pgn', Object.assign({}, H, { Accept: 'application/x-chess-pgn' }), runLeft(2200));
        if (pr.status !== 200) throw Object.assign(new Error('http'), { status: pr.status });
        sans = pgnSans(pr.text);
      } catch (e) { diag.moves = callError(e); }
      try { model = broadcastModel(g, round, tour, pick.b.i, sans); arg = shortEvent(tour.name, 22); } catch (e) { diag.broadcast = 'bad answer'; }
    }
  }
  if (!model) {   // no board in play in a broadcast: Lichess TV (classical when a strong game is on it, else the best game)
    try {
      var ch = await getJson('https://lichess.org/api/tv/channels', H, LT), c = ch && ch.classical && +ch.classical.rating >= 2000 ? ch.classical : ch && ch.best;
      if (c && GAME_ID.test(c.gameId || '')) {
        var j = await getJson('https://lichess.org/game/export/' + c.gameId + '?moves=true&clocks=true&tags=false&evals=false&opening=false', H, runLeft(2200));
        model = lichessLiveModel(j, { event: LV_EN.tv_long, round: '' });
        if (model) { model.game.round = model.game.kind; arg = LV_EN.tv; }
      }
    } catch (e) { diag.tv = callError(e); }
  }
  if (!model && finished) {   // nothing in play anywhere: the top board of the broadcast round that just ended
    var fb = finished.j.games.map(function (g, i) { return { g: g, i: i }; }).filter(function (x) { return x.g && typeof x.g.fen === 'string' && Array.isArray(x.g.players) && x.g.players.length > 1 && GAME_ID.test(x.g.id || ''); })
      .sort(function (a, b) { var r = function (x) { return (+x.g.players[0].rating || 0) + (+x.g.players[1].rating || 0); }; return r(b) - r(a) || a.i - b.i; })[0];
    try { if (fb) { model = broadcastModel(fb.g, Object.assign({}, finished.a.round, finished.j.round || {}), Object.assign({}, finished.a.tour, finished.j.tour || {}), fb.i, null); arg = shortEvent(finished.a.tour.name, 22); } } catch (e) { model = null; }
  }
  if (!model && (diag.broadcast || diag.round || diag.tv) && saved && saved.board) { model = saved; stale = true; arg = saved.game && saved.game.arg || ''; }
  var problems = [];
  if (diag.broadcast) problems.push('Lichess broadcast: ' + diag.broadcast);
  if (diag.round && (!model || stale)) problems.push('Lichess round: ' + diag.round);   // an optional step: said only when no game of this refresh is on screen (TV or another round worked)
  if (diag.moves) problems.push('Lichess moves: ' + diag.moves);
  if (diag.tv) problems.push('Lichess TV: ' + diag.tv);
  var out = liveOut(T, 'top', model, { stale: stale, arg: arg, problems: problems, calm: { none: T.top_none, line: diag.broadcast || diag.round || diag.tv ? T.lv_fail : T.top_none2 } });
  var st = keep({ v: 1 });
  if (model && !stale) { model.game.arg = arg; st.tg = slimLive(model); } else if (stale) st.tg = saved;
  out.trmnl_state = fitState(st);
  return viewModel(out, nowS);
}
function slimLive(m) { var s = slimGame(m); s.moves = (m.moves || []).slice(-12); s.source = 'live'; return s; }

async function runFollow(input, token, nowS, st0) {
  var H = authHeader({ token: token }), T = Object.assign({}, T_EN, LV_EN), diag = {};
  var keep = function (st) { ['rating', 'wk', 'last', 'cur'].forEach(function (k) { if (st0[k] != null) st[k] = st0[k]; }); return st; };
  var name = String(field(input, 'follow_username', '')).trim().replace(/^@/, '');
  var calm = function (title, line, arg) { var o = liveOut(T, 'following', null, { arg: arg || '', calm: { none: title, line: line } }); o.trmnl_state = fitState(keep({ v: 1 })); return viewModel(o, nowS); };
  if (!name) return calm(T.fl_empty, T.fl_empty2);
  if (!USER_RE.test(name)) return calm(T.fl_unknown, T.fl_unknown2, cut(name, 16));
  var u = name.toLowerCase(), saved = stObj(st0.fw) && st0.fw.u === u ? st0.fw.m : null;
  var model = null, stale = false, shown = name, row = null;
  // One call: the ongoing game of the player, else the last game played (public; 404 = no such account).
  try {
    row = await getJson('https://lichess.org/api/user/' + encodeURIComponent(name) + '/current-game?moves=true&clocks=true&tags=false&evals=false&opening=false', H, 3500);
    if (!row || !row.players) { row = null; diag.game = 'bad answer'; }
  } catch (e) {
    if (e && e.status === 401) return viewModel({ t: T, connect: true, none: true, notice: T.tokbad, trmnl_state: fitState(keep({ v: 1 })) }, nowS);   // expired or revoked login: reconnect
    if (e && e.status === 404) return calm(T.fl_unknown, T.fl_unknown2, cut(name, 16));   // Lichess knows no such account
    diag.game = callError(e);
  }
  if (row) {
    ['white', 'black'].forEach(function (c) { var pl = row.players[c] && row.players[c].user; if (pl && String(pl.name || '').toLowerCase() === u && USER_RE.test(pl.name)) shown = pl.name; });
    model = lichessLiveModel(row, { round: '' });
    if (!model) diag.game = 'not shown';   // a variant, or a game that does not replay
    else {
      var g = model.game, info = lastGameInfo(row, shown);
      g.round = g.status === 'live' ? T.playing_now : T.last_game; g.event = shown + ' · ' + g.kind;
      if (g.status !== 'live' && info) g.res_text = info.res === 'won' ? T.won : info.res === 'lost' ? T.lost : T.draw;   // from the followed player's side, the name is in the event line
    }
  }
  if (!model && saved && saved.board && diag.game) { model = saved; stale = true; }
  var problems = [];
  if (diag.game) problems.push('Lichess game: ' + diag.game);
  var out = liveOut(T, 'following', model, { stale: stale, arg: cut(shown, 16), problems: problems, calm: { none: T.fl_nogame, line: T.lv_fail } });
  var s = keep({ v: 1 });
  if (model && !stale) s.fw = { u: u, m: slimLive(model) }; else if (stale) s.fw = st0.fw;
  out.trmnl_state = fitState(s);
  return viewModel(out, nowS);
}

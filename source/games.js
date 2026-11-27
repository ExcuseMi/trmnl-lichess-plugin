// "Your games" mode: the user's correspondence games where it is their turn (GET /api/account/playing, no scope needed beyond a
// valid token). The most urgent game (least time left) is shown; the others are only counted. Same view model as a puzzle:
// out.puzzle is the position to draw (board, last move, QR target), out.game the opponent and the time left.
var G_EN = { play_w: 'Play white', play_b: 'Play black', scan: 'Scan to play', time_left: 'Time to move', more_one: 'more game waiting', more_n: 'more games waiting',
  none: 'No games waiting for you', in_moves: 'in', moves_w: 'moves', none_new: 'Start a game on lichess.org.', their_turn: 'Their turn', waiting_short: 'Waiting', finished_short: 'Finished', last_game: 'Last game', waiting_for: 'Waiting for', result: 'Result', scan_view: 'Scan to play', scan_new: 'Scan to play', won_w: 'Won', lost_w: 'Lost', drew_w: 'Draw', won_l: 'Won against', lost_l: 'Lost to', drew_l: 'Drew with', wait_one: 'game waiting for opponents', wait_n: 'games waiting for opponents', none2: 'Could not reach Lichess. Showing again at the next refresh.', offline: 'Offline, last game', scope_games: 'Reconnect Lichess: missing game permission',
  won: 'Last game: won against', lost: 'Last game: lost to', drew: 'Last game: drew with', no_limit: 'No limit' };
var GAME_ID = /^[A-Za-z0-9]{8}$/;
function timeLeft(sec) {   // "2d 4h", "5h 20m", "12m", "<1m"; null: a game without a clock
  if (sec == null || !isFinite(sec)) return G_EN.no_limit;
  sec = Math.max(0, Math.floor(sec));
  var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
  if (d) return d + 'd' + (h ? ' ' + h + 'h' : '');
  if (h) return h + 'h' + (m ? ' ' + m + 'm' : '');
  return m ? m + 'm' : '<1m';
}
// The games to move on: correspondence only, valid id and position, least time left first (no clock last).
function gamesToMove(list) {
  var mine = (Array.isArray(list) ? list : []).filter(function (g) { return g && g.isMyTurn && g.speed === 'correspondence' && GAME_ID.test(g.gameId || '') && typeof g.fen === 'string' && (g.color === 'white' || g.color === 'black'); });
  var key = function (g) { return g.secondsLeft == null || !isFinite(g.secondsLeft) ? Infinity : +g.secondsLeft; };
  return mine.sort(function (a, b) { return key(a) - key(b); });
}
function gameModel(g, nowS, sans, phase) {
  var turn = g.color === 'white' ? 'w' : 'b', fen = g.fen.indexOf(' ') < 0 ? g.fen + ' ' + turn : g.fen, q = parseFen(fen), last = String(g.lastMove || '');
  var opp = g.opponent || {}, name = clean(opp.username || opp.id || (opp.ai ? 'Computer' : 'Anonymous')).slice(0, 24);
  return { source: 'game', id: g.gameId, url: 'https://lichess.org/' + g.gameId, board: q.board, turn: turn, from: sqIndex(last.slice(0, 2)), to: sqIndex(last.slice(2, 4)),
    rating: 0, themes: [], title: '', moves: sans ? sanPairs(sans, q.board) : [], plays: 0,
    game: { opp: name, opp_rating: +opp.rating || 0, due: g.secondsLeft == null ? 0 : nowS + Math.floor(+g.secondsLeft), kind: g.rated ? 'Correspondence, rated' : 'Correspondence', phase: phase || 'turn' } };
}
// SAN list -> move pairs [number, white, black] (last MOVES_MAX), only when chess.js replays it to the board shown (variants do not: no list).
function sanPairs(sans, board) {
  var ch = new CHESSJS.Chess(), out = [];
  try { sans.forEach(function (s) { out.push(ch.move(s).san); }); } catch (e) { return []; }
  if (parseFen(ch.fen()).board !== board) return [];
  var pairs = [];
  for (var k = 0; k < out.length; k += 2) pairs.push([k / 2 + 1, out[k], out[k + 1] || '']);
  return pairs.slice(-MOVES_MAX);
}
// A finished game from its SAN list: board, last move and the move pairs; null when chess.js cannot replay it (variants).
function replayGame(sans) {
  var ch = new CHESSJS.Chess(), last = null, out = [];
  try { sans.forEach(function (s) { last = ch.move(s); out.push(last.san); }); } catch (e) { return null; }
  var pairs = [];
  for (var k = 0; k < out.length; k += 2) pairs.push([k / 2 + 1, out[k], out[k + 1] || '']);
  return { board: parseFen(ch.fen()).board, from: last ? sqIndex(last.from) : -1, to: last ? sqIndex(last.to) : -1, moves: pairs.slice(-MOVES_MAX) };
}
function slimGame(m) { return { source: m.source, id: m.id, url: m.url, board: m.board, turn: m.turn, from: m.from, to: m.to, rating: 0, themes: [], title: '', moves: m.moves || [], plays: 0, game: m.game }; }
// A finished game row of GET /api/games/user (ndjson): { res: won|lost|drew, color: white|black, opp, opp_rating } or null.
// Drawn: finished without a winner (draw, stalemate, a flag fall against insufficient material, ...), not aborted or unplayed.
var NOT_PLAYED = { created: 1, started: 1, aborted: 1, noStart: 1, unknownFinish: 1 };
function isDraw(g) { return !!g && !g.winner && typeof g.status === 'string' && !NOT_PLAYED[g.status]; }
function lastGameInfo(g, me) {
  if (!g || !g.players || !g.winner && !isDraw(g)) return null;
  var w = g.players.white || {}, b = g.players.black || {}, mine = ((w.user || {}).name || '').toLowerCase() === me.toLowerCase() ? 'white' : 'black', o = mine === 'white' ? b : w;
  return { res: g.winner ? (g.winner === mine ? 'won' : 'lost') : 'drew', color: mine, opp: clean(((o.user || {}).name) || (o.aiLevel ? 'Computer' : 'Anonymous')).slice(0, 24), opp_rating: +o.rating || 0 };
}
function lastGameLine(g, me) { var i = lastGameInfo(g, me); return i ? G_EN[i.res + '_l'] + ' ' + i.opp : ''; }

async function runGames(input, token, nowS, st0) {
  var ctx = { token: token }, H = authHeader(ctx), T = Object.assign({}, T_EN, G_EN), diag = {}, saved = stObj(st0.gm);
  var playing = getJson('https://lichess.org/api/account/playing?nb=50', H, LT);
  var data = null, mine = [], theirs = [], model = null, stale = false, line = '', phase = '', moreLine = '', moreShort = '';
  var keep = function (st) { ['rating', 'wk', 'last', 'cur'].forEach(function (k) { if (st0[k] != null) st[k] = st0[k]; }); return st; };   // the puzzle mode's state stays for the way back
  try { data = await playing; } catch (e) {
    if (e && e.status === 401) return viewModel({ t: T, connect: true, none: true, notice: T.tokbad, trmnl_state: fitState(keep({ v: 1 })) }, nowS);
    if (e && e.status === 403) return viewModel({ t: T, connect: true, none: true, notice: T.scope_games, trmnl_state: fitState(keep({ v: 1 })) }, nowS);
    diag.games = callError(e);
  }
  if (data) {
    var list = Array.isArray(data.nowPlaying) ? data.nowPlaying : null;
    if (!list) diag.games = 'bad answer';
    else {
      mine = gamesToMove(list);
      theirs = list.filter(function (g) { return g && g.speed === 'correspondence' && !g.isMyTurn && GAME_ID.test(g.gameId || '') && typeof g.fen === 'string' && (g.color === 'white' || g.color === 'black'); });
    }
  }
  var shown = mine[0] || theirs[0];   // my turn: the most urgent; else the first game the opponent is to move in (the API lists the most urgent first)
  if (shown) {
    phase = mine.length ? 'turn' : 'wait';
    var sans = null;
    try {
      var j = await getJson('https://lichess.org/game/export/' + shown.gameId + '?moves=true&tags=false&clocks=false&evals=false&opening=false', H, runLeft(2200));
      sans = typeof j.moves === 'string' ? j.moves.split(/\s+/).filter(Boolean) : null;
    } catch (e) { diag.moves = callError(e); }
    model = gameModel(shown, nowS, sans, phase);
    if (phase === 'turn' && mine.length > 1) { var m = mine.length - 1; moreLine = m + ' ' + (m === 1 ? T.more_one : T.more_n); moreShort = '+' + m + ' waiting'; }
    if (phase === 'wait') { var n = theirs.length; moreLine = n + ' ' + (n === 1 ? T.wait_one : T.wait_n); moreShort = n + ' waiting'; }
  } else if (diag.games && saved && saved.board) { model = saved; phase = (saved.game || {}).phase || 'turn'; stale = true; }
  else if (!diag.games) {   // no ongoing game at all: the last finished correspondence game, with its result
    try {
      var a = await getJson('https://lichess.org/api/account', H, LT), un = /^[A-Za-z0-9_-]{2,30}$/.test(a.username || '') ? a.username : '';
      if (un) {
        var r = await getRaw('https://lichess.org/api/games/user/' + un + '?max=1&perfType=correspondence&ongoing=false&moves=true&tags=false&clocks=false&evals=false&opening=false', Object.assign({ Accept: 'application/x-ndjson' }, H), runLeft(2200));
        if (r.status !== 200) throw Object.assign(new Error('http'), { status: r.status });
        var row = ndjson(r.text)[0], info = lastGameInfo(row, un);
        if (info) {
          line = G_EN[info.res + '_l'] + ' ' + info.opp;
          var rp = typeof row.moves === 'string' ? replayGame(row.moves.split(/\s+/).filter(Boolean)) : null;
          if (rp) {
            phase = 'last';
            model = { source: 'game', id: String(row.id || ''), url: 'https://lichess.org/', board: rp.board, turn: info.color === 'white' ? 'w' : 'b', from: rp.from, to: rp.to, rating: 0, themes: [], title: '', moves: rp.moves, plays: 0,
              game: { opp: info.opp, opp_rating: info.opp_rating, due: 0, kind: 'Correspondence', phase: 'last', res: G_EN[info.res + '_w'], result_line: line, n_moves: Math.ceil(row.moves.split(/\s+/).filter(Boolean).length / 2) } };
          }
        }
      }
    } catch (e) { diag.last = callError(e); }
  }
  var out = { t: T, mode: 'games', none: !model, calm: !model, stale: stale, notice: '', banner: '', account: null, show_account: false, caps: {}, coords: true, white_bottom: true, lines: line ? [line] : [] };
  if (model) {
    model.game = Object.assign({}, model.game);   // time left now, from the deadline
    model.game.left = model.game.due ? timeLeft(model.game.due - nowS) : timeLeft(null);
    out.puzzle = model; out.more_line = stale ? '' : moreLine; out.more_short = stale ? '' : moreShort;
    out.to_move = model.turn === 'w' ? T.white : T.black; out.white_bottom = model.turn === 'w';
    out.phase = phase; out.t = Object.assign({}, T, { scan: phase === 'last' ? T.scan_new : phase === 'wait' ? T.scan_view : T.scan });
  } else out.calm_line = diag.games ? T.none2 : T.none_new;
  var st = keep({ v: 1 });
  if (model && !stale && phase !== 'last') st.gm = slimGame(model); else if (stale) st.gm = saved;
  var problems = [];
  if (diag.games) problems.push('Lichess games: ' + diag.games);
  if (diag.moves) problems.push('Lichess moves: ' + diag.moves);
  if (diag.last) problems.push('Lichess last game: ' + diag.last);
  if (problems.length) out.problems = problems;
  out.trmnl_state = fitState(st);
  return viewModel(out, nowS);
}

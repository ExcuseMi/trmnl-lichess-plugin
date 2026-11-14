// View model: the transform's answer shaped for the Liquid markup (data only, no markup). The panel is plain Framework
// markup in shared.liquid; only the board is drawn by the page script.
// Title bar modes: one table, so later modes plug in. instance: what the right side of the title bar says.
var MODES = {
  puzzles: { instance: 'Puzzles' },
  connect: { instance: 'Connect account' },
  games: { instance: 'Your games' },     // the user's correspondence games (source/games.js)
  profile: { instance: 'Profile' },       // the user's Lichess overview (source/profile.js)
  top: { instance: 'Top game · %s' },     // the best game now (source/live.js), %s = the event's short name or TV
  following: { instance: 'Following %s' } // a followed player (source/live.js), %s = name
};
function modeInstance(mode, arg) { var m = MODES[mode] || MODES.puzzles; return m.instance.replace('%s', arg || '').replace(/ · $/, '').trim(); }
var DAY_NAMES = 'S M T W T F S'.split(' ');
function signed(n) { return (n > 0 ? '+' : '') + n; }
// SAN split for figurines: the piece letter (K Q R B N or '' for a pawn) and the rest, e.g. "Qxe5+" -> ['Q', 'xe5+'].
function sanParts(san) { var s = String(san || ''), m = /^([KQRBN])(.*)$/.exec(s); return m ? [m[1], m[2]] : ['', s]; }
function viewModel(out, nowS) {
  var P = out.puzzle, A = out.account;
  out.mode = out.connect ? 'connect' : out.mode || 'puzzles';   // 'games' is set by runGames
  out.instance = modeInstance(out.mode, out.instance_arg);
  out.instance_long = out.instance;
  if (P && P.themes && P.themes.length) out.instance_long = out.instance + ' · ' + P.themes[0];
  if (!P) return out;
  out.turn_w = P.turn === 'w';
  var games = out.mode === 'games';
  out.find = games ? (out.turn_w ? out.t.play_w : out.t.play_b) : out.turn_w ? out.t.find_w : out.t.find_b;
  var list = (P.moves || []).slice(out.mode === 'top' || out.mode === 'following' ? -12 : -8), lastB = list.length ? !!list[list.length - 1][2] : false;
  out.rows = list.map(function (m, i) {
    var w = sanParts(m[1] || '...'), b = sanParts(m[2]), last = i === list.length - 1, back = list.length - 1 - i;
    return { n: +m[0] || 0, wp: w[0], ws: w[1], bp: b[0], bs: b[1], hw: last && !lastB, hb: last && lastB, back: back };
  });
  if (out.mode === 'top' || out.mode === 'following') return liveView(out, P);   // source/live.js
  if (games) {
    var G = P.game || {}, ph = G.phase || 'turn', t = out.t, tl = G.left;
    out.opp_line = G.opp ? (G.opp.length > 16 ? G.opp.slice(0, 15) + '…' : G.opp) + (G.opp_rating ? ' (' + G.opp_rating + ')' : '') : '';
    out.opp_short = G.opp ? (G.opp.length > 10 ? G.opp.slice(0, 9) + '…' : G.opp) : '';   // the quadrant has no room for the rating
    out.meta = G.kind || '';
    out.heading = ph === 'wait' ? t.their_turn : ph === 'last' ? t.last_game : t.your_turn;
    out.heading_short = ph === 'wait' ? t.waiting_short : ph === 'last' ? t.finished_short : t.your_turn;
    if (ph === 'wait') out.find = t.waiting_for + ' ' + out.opp_short;
    if (ph === 'last') out.find = t.vs + ' ' + out.opp_line;
    out.time_label = ph === 'wait' ? t.waiting_for : ph === 'last' ? '' : t.time_left;
    out.time_value = ph === 'wait' ? out.opp_line.replace(/ \(\d+\)$/, '') : ph === 'last' ? G.res : tl;
    out.time_small = ph === 'wait';
    out.time_value_short = ph === 'turn' && tl ? (tl === t.no_limit ? '-' : String(tl).split(' ')[0]) : out.time_value;   // the quadrant: the largest unit only ("8h")
    out.time_sub = ph === 'wait' ? (G.opp_rating ? '(' + G.opp_rating + ')' : '') : ph === 'last' ? t.in_moves + ' ' + G.n_moves + ' ' + t.moves_w : out.opp_line;
    out.time_sub_short = ph === 'wait' ? '' : ph === 'last' ? G.n_moves + ' ' + t.moves_w : out.opp_short;
    out.time_sub_all = ph === 'last';
    out.show_info = ph !== 'last' || !!(out.problems && out.problems.length) || !!out.stale || !!out.notice;
    return out;
  }
  out.meta = [P.rating ? out.t.difficulty + ' ' + P.rating : '', P.themes && P.themes[0] ? P.themes[0] : '', out.diff_label || ''].filter(Boolean).join(' · ');
  if (A) {
    out.change = A.trend && A.trend !== 'flat' && A.delta ? signed(A.delta) : '';
    out.chips = (A.recent || []).slice(0, 3).reverse().map(function (d) { return { text: signed(d), up: d >= 0 }; });
    if (A.days) {
      var s = 0, f = 0, d0 = new Date(nowS * 1000).getUTCDay();
      A.days.forEach(function (x) { s += x.s; f += x.f; });
      out.week_line = s + ' ' + out.t.solved_n + ' · ' + f + ' ' + out.t.failed_n;   // short lines: a label does not wrap
      out.week_title = out.t.this_week;
      out.streak_line = out.caps && out.caps.streak && A.streak ? out.t.streak + ' ' + A.streak : '';
      out.days = A.days.map(function (x, i) { return { name: DAY_NAMES[(d0 - (6 - i) + 70) % 7], on: x.s > 0, today: i === 6 }; });
    }
  }
  return out;
}

// Page script: reads YM (the transform's answer), lays out board and side panel for the view and the screen, draws both.
(function () {
  var root = document.querySelector('[data-ym]');
  if (!root) return;
  var sc = document.querySelector('.screen'), has = function (c) { return !!(sc && sc.classList.contains(c)); };
  var dark = !!document.querySelector('.screen--dark-mode, .dark-mode') || has('screen--dark-mode'), INK = dark ? '#fff' : '#000', PAPER = dark ? '#000' : '#fff';
  var bits = has('screen--1bit') ? 1 : has('screen--2bit') ? 2 : 4, lg = has('screen--lg');
  var P = YM.puzzle, A = YM.account, T = YM.t, view = YM.view, C = YM.caps || {};
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function rect() { var r = root.getBoundingClientRect(), cs = window.getComputedStyle(root), pl = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) || 0, pt = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) || 0; return { w: Math.floor(r.width - pl), h: Math.floor(r.height - pt) }; }
  var R = rect(), W = R.w, H = R.h, gap = Math.round(Math.min(W, H) * 0.035);
  var row = W >= H * 1.15, small = view === 4 || (view === 2 && H < 300);
  var wide = view === 1 || view === 2;
  var q = YM.qrOk;   // QR drawn?
  // ---- sizes
  var Sw, S, Q = 0;
  if (row) {
    Sw = Math.max(Math.round(W * (view === 1 ? 0.3 : view === 2 ? 0.4 : 0.44)), W - H - gap);   // the board takes the full height when the panel keeps its minimum
    S = Math.min(H, W - Sw - gap);
    Sw = W - S - gap;
  } else {
    S = Math.min(W, Math.round(H * (view === 3 ? (P.moves && P.moves.length ? 0.6 : 0.68) : 0.7)));   // half vertical: room for the last moves
    Sw = W;
  }
  var ph = row ? H : H - S - 2 * gap;   // below the board: the layout keeps its own gap too
  // ---- panel pieces
  function dot(white, r) { return '<svg class="block shrink-0" width="' + r * 2 + '" height="' + r * 2 + '" viewBox="0 0 ' + r * 2 + ' ' + r * 2 + '"><circle cx="' + r + '" cy="' + r + '" r="' + (r - 1.2) + '" fill="' + (white ? '#fff' : '#000') + '" stroke="' + INK + '" stroke-width="2"/></svg>'; }
  function arrow(up, s) { return '<svg class="block shrink-0" width="' + s + '" height="' + s + '" viewBox="0 0 10 10"><path d="' + (up ? 'M5 1L9.2 8.5H0.8z' : 'M5 9L9.2 1.5H0.8z') + '" fill="' + INK + '"/></svg>'; }
  function spark(vals, w, h) {
    if (!vals || vals.length < 2) return '';
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), n = vals.length, pad = 5, pts = [], span = Math.max(1, hi - lo);
    vals.forEach(function (v, i) { pts.push([pad + (w - 2 * pad) * i / (n - 1), pad + (h - 2 * pad) * (1 - (v - lo) / span)]); });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    var last = pts[n - 1];
    var area = d + 'L' + last[0].toFixed(1) + ' ' + (h - 1) + 'L' + pts[0][0].toFixed(1) + ' ' + (h - 1) + 'z';
    return '<svg class="block" data-ym-part="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><path d="' + area + '" fill="' + (bits === 1 ? 'none' : (dark ? '#555' : '#cfcfcf')) + '"/><path d="M0 ' + (h - 0.5) + 'H' + w + '" stroke="' + INK + '" stroke-width="1.4"/><path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + Math.max(2.2, h / 18).toFixed(1) + '" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="' + Math.max(3.5, h / 12).toFixed(1) + '" fill="' + INK + '"/></svg>';
  }
  // Type roles (owner 2026-11-14: at most 4 sizes, Framework scale only, the same per role in every view): heading, rating, change, labels.
  var TY_HEAD = small ? 'value value--xsmall' : 'value value--small', TY_RATING = small || !lg ? 'value' : 'value value--large', TY_CHANGE = 'value value--small', TY_LABEL = 'label';
  var LABEL_PX = (function () {   // the label size, so the chart's text matches every other label
    var host = document.querySelector('[data-ym-side]') || document.body, e = document.createElement('span');
    e.className = 'label'; e.textContent = 'M'; host.appendChild(e); var px = parseFloat(window.getComputedStyle(e).fontSize) || 16; host.removeChild(e); return px;
  })();
  var DAYS = (T.days || 'S M T W T F S').split(' ');
  function dayName(i) { var d = new Date(); d.setDate(d.getDate() - (6 - i)); return DAYS[d.getDay()] || ''; }
  function lbl(s, extra) { return '<span class="' + TY_LABEL + '"' + (extra || '') + '>' + s + '</span>'; }
  // A cburnett piece as an inline glyph. solid: one colour (the text colour), for the move list as Lichess draws it.
  function glyph(k, em, solid) {
    var g = PIECE_SVG[k];
    if (solid) g = PIECE_SVG['b' + k.charAt(1)].replace(/#f{3}(f{3})?\b/gi, 'none').replace(/#0{3}(0{3})?\b/g, 'currentColor');
    return '<svg class="ym-fig" viewBox="0 0 45 45" width="' + em + 'em" height="' + em + 'em">' + g + '</svg>';
  }
  var CARD = 'outline rounded p--2 lg:p--3 flex flex--col flex--left gap--xsmall shrink-0';
  // (a) Your turn: the side-to-move king, "Your turn", "Find the best move for black."
  function turnCard() {
    var w = P.turn === 'w';
    return '<div class="' + CARD + '" data-ym-card="turn"><div class="flex flex--row flex--center-y gap--small">' + glyph(w ? 'wK' : 'bK', small ? 1.6 : 2.1) +
      '<div class="flex flex--col flex--left"><span class="' + TY_HEAD + ' ym-b ym-nw">' + esc(T.your_turn || 'Your turn') + '</span>' +
      (small ? '' : lbl(esc(w ? (T.find_w || 'Find the best move for white.') : (T.find_b || 'Find the best move for black.')), ' data-ym-find')) + '</div></div></div>';
  }
  // (b) The puzzle: number, rating, theme; the game it comes from with both players.
  function puzzleCard() {
    if (small) return '';
    var l1 = esc((T.puzzle_n || 'Puzzle') + ' #' + P.id);
    var l2 = [];
    if (P.rating) l2.push((T.difficulty || 'Rating') + ' ' + P.rating);
    if (P.themes && P.themes.length) l2.push(P.themes[0]);
    var g = P.game, gl = '';
    if (g && (g.kind || (g.players && g.players.length))) {
      gl = '<div class="flex flex--col flex--left" data-ym-game>' + (g.kind ? lbl(esc((T.from_game || 'From game') + ' ' + g.kind)) : '') +
        (g.players || []).map(function (p) { return '<div class="flex flex--row flex--center-y gap--xsmall">' + dot(p[0] === 'w', Math.round(LABEL_PX * 0.32)) + lbl(esc(p[1]) + (p[2] ? ' (' + p[2] + ')' : '')) + '</div>'; }).join('') + '</div>';
    }
    return '<div class="' + CARD + '" data-ym-card="puzzle">' + lbl(l1, ' data-ym-b') + (l2.length ? lbl(esc(l2.join('  ·  ')), ' data-ym-meta') : '') + gl + '</div>';
  }
  // The moves that led to the puzzle, the Lichess way: number gutter, two move columns, figurines, the last move as a dark block.
  function movesHtml(maxPairs) {
    var list = (P.moves || []).slice(-maxPairs);
    if (!maxPairs || !list.length) return '';
    var lastB = !!list[list.length - 1][2];
    // White's moves with white (outlined) pieces, Black's with black (solid); the last move as a dark block, its piece in the block's text colour.
    var mv = function (san, white, hl) { return esc(san).replace(/[KQRBN]/g, function (c) { return glyph((white ? 'w' : 'b') + c, 1.15, hl); }); };
    var cell = function (h, hl) { return '<td><span class="' + TY_LABEL + (hl ? ' ym-hl' : '') + '">' + h + '</span></td>'; };
    var rows = list.map(function (m, i) {
      var last = i === list.length - 1, hw = last && !lastB, hb = last && lastB;
      return '<tr><td class="bg--gray-75 ym-n">' + lbl(String(+m[0] || '')) + '</td>' + cell(mv(m[1] || '...', true, hw), hw) + cell(m[2] ? mv(m[2], false, hb) : '', hb) + '</tr>';
    }).join('');
    return '<table data-ym-part="moves" class="table table--small ym-mv"><tbody>' + rows + '</tbody></table>';
  }
  // (c) Rating: the number centred, the change, then progress (sparkline, this week line + 7 squares).
  function week(days, w) {
    var fs = LABEL_PX, sumS = 0, sumF = 0, out = '', i, st = w / 7, sq = Math.min(Math.round(st * 0.62), Math.round(fs * 1.8));
    days.forEach(function (d) { sumS += d.s; sumF += d.f; });
    var H2 = Math.ceil(sq + fs * 1.4);
    for (i = 0; i < 7; i++) {
      var x = i * st + (st - sq) / 2, d = days[i], td = i === 6;
      out += '<rect x="' + (x + 1).toFixed(1) + '" y="1" width="' + (sq - 2) + '" height="' + (sq - 2) + '" rx="3" fill="' + (d.s > 0 ? INK : PAPER) + '" stroke="' + INK + '" stroke-width="' + (td ? 3 : 1.5) + '"/>';
      out += '<text x="' + (x + sq / 2).toFixed(1) + '" y="' + (sq + fs * 1.05).toFixed(1) + '" class="' + TY_LABEL + '" text-anchor="middle" fill="' + INK + '" font-weight="' + (td ? 'bold' : 'normal') + '">' + dayName(i) + '</text>';
    }
    var line = (T.this_week || 'This week') + ': ' + sumS + ' ' + (T.solved_n || 'solved') + ', ' + sumF + ' ' + (T.failed_n || 'failed') + (C.streak && A.streak ? '  ·  ' + T.streak + ' ' + A.streak : '');
    return '<div class="flex flex--col flex--left gap--xsmall" data-ym-part="bars">' + lbl(esc(line), ' data-ym-wrap') + '<svg class="block" width="' + w + '" height="' + H2 + '" viewBox="0 0 ' + w + ' ' + H2 + '">' + out + '</svg></div>';
  }
  function ratingCard() {
    if (!A) return '';
    var chg = '';
    if (A.trend && A.trend !== 'flat') chg = '<span class="flex flex--row flex--center-y gap--xsmall">' + arrow(A.trend === 'up', Math.round(LABEL_PX)) + '<span class="' + TY_CHANGE + '">' + (A.delta > 0 ? '+' : '') + A.delta + '</span></span>';
    var body = '<div class="flex flex--col flex--center-x ym-stretch" data-ym-part="rating">' + lbl(esc(T.rating_you), ' data-ym-rlabel') +
      '<div class="flex flex--row flex--center-y gap--small"><span class="' + TY_RATING + '">' + A.rating + '</span>' + chg + '</div></div>';
    // The last puzzle results as chips, oldest left (Lichess shows the same row under its board): a solve dark, a miss outlined.
    var rec = (A.recent || []).slice(0, 6).reverse();
    if (rec.length && !small) body += '<div class="flex flex--row flex--center-x gap--xsmall" data-ym-part="recent">' + rec.map(function (w) { return '<span class="' + TY_LABEL + ' ym-chip' + (w ? ' ym-chip--win' : '') + '">' + (w ? '&#10003;' : '&#10007;') + '</span>'; }).join('') + '</div>';
    var probs = (YM.problems || []).map(function (s) { return lbl(esc(s), ' data-ym-problem'); }).join('');
    return '<div class="' + CARD + ' grow ym-rcard" data-ym-card="rating">' + body + probs + '<div data-ym-prog class="flex flex--col flex--left gap--xsmall ym-stretch"></div></div>';
  }
  function progHtml(w) {
    var prog = '';
    if (small || !A) return '';
    {
      if (C.history) prog += spark(A.history, w, Math.max(30, Math.round(LABEL_PX * 2.4)));
      if (C.solved && A.days) prog += week(A.days, w);
      else if (C.streak && A.streak) prog += lbl(esc(T.streak + ' ' + A.streak), ' data-ym-part="stats"');   // no week to carry the streak
    }
    return prog;
  }
  // ---- QR size: whole pixels per module, at least 4 (3 on the 2x X), never a QR a 1-bit panel can not read
  var qrW = 0, svgQr = document.querySelector('[data-ym-qr] svg'), haveQr = !!svgQr && !small;
  var pw = row ? Sw : S, phh = row ? S : ph;
  if (haveQr) {
    qrW = Math.round(Math.min(pw * (lg ? 0.44 : 0.45), phh * (row ? 0.36 : 0.45)));
    var vbq = (svgQr.getAttribute('viewBox') || '').split(/[ ,]+/), mods = Math.round((+vbq[2] || +svgQr.getAttribute('width') || 0) / 4);   // modules incl. quiet zone (the filter draws 4 units per module)
    var px = mods > 8 ? Math.floor(qrW / mods) : 99;
    if (px < (lg ? 3 : 4)) haveQr = false;
    else if (mods > 8) qrW = px * mods;
    if (qrW < 80) haveQr = false;
  }
  if (haveQr) {
    if (!svgQr.getAttribute('viewBox')) svgQr.setAttribute('viewBox', '0 0 ' + (svgQr.getAttribute('width') || qrW) + ' ' + (svgQr.getAttribute('height') || qrW));
    svgQr.setAttribute('width', qrW); svgQr.setAttribute('height', qrW); svgQr.classList.add('block');
  }
  // ---- side panel: exactly as tall as the board (as wide as it below the board), framed cards in a fixed order:
  // (a) your turn, (b) the puzzle, the moves (only the space left), then the rating card and the QR card side by side at the bottom edge.
  var extra = '';
  if (YM.banner) extra += '<div class="' + CARD + ' inverse">' + lbl(esc(YM.banner), ' data-ym-b') + '</div>';
  if (YM.notice || YM.stale) extra += lbl(esc(YM.notice || T.offline));
  if (!A && YM.problems) extra += YM.problems.map(function (s) { return lbl(esc(s), ' data-ym-problem'); }).join('');
  if (!A && !small && P.source === 'lichess' && !C.personal) extra += lbl(esc(T.connect), ' data-ym-part="hint"');
  var side = document.querySelector('[data-ym-side]'), bd = document.querySelector('[data-ym-board]');
  side.style.height = phh + 'px'; side.style.width = pw + 'px'; side.style.overflow = 'hidden';
  side.innerHTML = '<div class="flex flex--col flex--left gap--small lg:gap--medium" data-ym-panel>' +
    turnCard() + puzzleCard() + extra +
    '<div data-ym-fill>' + (small ? '' : movesHtml(view === 1 ? 99 : 3)) + '</div>' +
    '<div class="flex flex--row flex--wrap flex--bottom gap--small lg:gap--medium shrink-0" data-ym-bottom>' + ratingCard() +
    (haveQr ? '<div class="' + CARD + ' flex--center-x" data-ym-qrbox></div>' : '') + '</div></div>';
  var panel = side.querySelector('[data-ym-panel]'), qb = side.querySelector('[data-ym-qrbox]');
  if (qb) { qb.appendChild(svgQr); var cap = document.createElement('span'); cap.className = TY_LABEL; cap.textContent = T.scan; qb.appendChild(cap); }
  var pg = side.querySelector('[data-ym-prog]');
  if (pg) { pg.innerHTML = progHtml(Math.max(60, Math.floor(pg.getBoundingClientRect().width))); if (!pg.children.length) pg.parentNode.removeChild(pg); }
  // Too tall for the board: drop in this order, the QR last (the moves need no rule: they only get the space that is left).
  function over() { return panel.scrollHeight > panel.clientHeight + 4; }   // a label's line box may hang 1-3 px past the edge
  function drop(sel) { var n = side.querySelector(sel); if (n) n.parentNode.removeChild(n); }
  ['[data-ym-part="bars"]', '[data-ym-part="spark"]', '[data-ym-part="recent"]', '[data-ym-game]', '[data-ym-part="hint"]', '[data-ym-meta]', '[data-ym-card="puzzle"]', '[data-ym-rlabel]', '[data-ym-find]', '[data-ym-qrbox]'].forEach(function (sel) { if (over()) drop(sel); });
  // The moves fill what is left: the newest rows that fit, at least 2 (one pair alone is no list), oldest rows give way.
  var mt = side.querySelector('[data-ym-part="moves"]');
  if (mt) {
    var fillH = side.querySelector('[data-ym-fill]').clientHeight, trs = mt.querySelectorAll('tbody tr');
    var rowH = trs.length ? trs[trs.length - 1].getBoundingClientRect().height : 0, fit = rowH ? Math.floor((fillH - 2) / (rowH * 1.08)) : 0;   // 8 % for the web font, which can land after this measure
    if (fit < Math.min(2, trs.length)) mt.parentNode.removeChild(mt);
    else for (var k = 0; k < trs.length - fit; k++) trs[k].parentNode.removeChild(trs[k]);
  }
  // ---- board
  var lab = side.querySelector('.label'), font = (lab && window.getComputedStyle(lab).fontFamily) || 'sans-serif';
  bd.innerHTML = boardSvg({ size: S, board: P.board, flip: !YM.white_bottom, from: P.from, to: P.to, coords: YM.coords && S > 150, bits: bits, dark: dark, font: font.replace(/"/g, "'") });
  root.classList.add(row ? 'layout--row' : 'layout--col');
  root.setAttribute('data-ym-drawn', '1');
})();

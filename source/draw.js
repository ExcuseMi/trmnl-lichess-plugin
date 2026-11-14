// Drawing: the board as SVG text, cburnett pieces (source/pieces.js, 45 x 45 each). No DOM here, so it can be tested in Node.
// Rim board: a grey rim (level 85, 119 in dark mode, black on 1-bit) with white coordinates on it, light squares white,
// dark squares grey (170), the last move tinted (119) and framed. The board keeps its light look in dark mode.
// Colours come from the Framework (TRMNLPaint, owner 2026-11-14): every grey is a level 0..255 asked as the bg--{token} that
// paints it on this screen, so bit depth, palette (the X's gray-16, gray-4, bw) and dark mode shape it as CSS does. A token
// that dithers comes back as a pattern tile. Without the Framework (Node tests) the level is used as a plain grey.
var YM_DARK = false;
function ymToken(level) {   // dark mode inverts every token, so the token for the opposite level paints this one
  var l = YM_DARK ? 255 - level : level;
  if (l <= 0) return 'black';
  if (l >= 255) return 'white';
  return 'gray-' + Math.max(10, Math.min(75, Math.round((l + 17) / 3.4 / 5) * 5));
}
var YM_FILLS = {};
function ymFill(level) {   // { paint: an SVG fill value, def: a <pattern> to put in that SVG's <defs> or '' }
  var k = ymToken(level), g = typeof window !== 'undefined' ? window.TRMNLPaint : null;
  if (YM_FILLS[k]) return YM_FILLS[k];
  var f = g && g.bg ? g.bg(k) : null, r;
  if (f && f.url && f.size) {
    var id = 'ymf-' + k, z = (+f.size).toFixed(3);
    r = { paint: 'url(#' + id + ')', def: '<pattern id="' + id + '" width="' + z + '" height="' + z + '" patternUnits="userSpaceOnUse"><rect width="' + z + '" height="' + z + '" fill="' + (f.color || '#fff') + '"/><image href="' + f.url + '" width="' + z + '" height="' + z + '"/></pattern>' };
  } else if (f && f.color) r = { paint: f.color, def: '' };
  else { var v = Math.max(0, Math.min(255, Math.round(level))); r = { paint: 'rgb(' + v + ',' + v + ',' + v + ')', def: '' }; }
  return (YM_FILLS[k] = r);
}
function ymSolid(level) { var f = ymFill(level); return f.def ? (level >= 128 ? ymFill(255).paint : ymFill(0).paint) : f.paint; }   // strokes and text: never a tile
function ymInks(svg) { var W = ymSolid(255), K = ymSolid(0); return svg.replace(/#f{3}(f{3})?\b/gi, W).replace(/#0{3}(0{3})?\b/g, K); }   // the set's white and black as Framework inks
function pieceSvg(type, white, x, y, s) {
  var k = (white ? 'w' : 'b') + type.toUpperCase();
  return '<svg x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + s.toFixed(2) + '" height="' + s.toFixed(2) + '" viewBox="0 0 45 45">' + ymInks(PIECE_SVG[k]) + '</svg>';
}
// o: { size, board (64 chars), flip, from, to (indices or -1), coords, bits (1, 2 or 4), dark (dark mode), font }
function boardSvg(o) {
  var S = o.size, m = o.coords ? Math.round(S * 0.058) : Math.max(4, Math.round(S * 0.02)), q = Math.floor((S - 2 * m) / 8), B = q * 8, x0 = Math.round((S - B) / 2), i, out = [];
  YM_DARK = !!o.dark; YM_FILLS = {};
  var fRim = ymFill(o.dark ? 119 : 85), fSq = ymFill(170), fLm = ymFill(119), fW = ymFill(255), K = ymSolid(0), Wt = ymSolid(255), lw = Math.max(1, Math.round(S * 0.003));
  var rim = o.bits === 1 ? K : fRim.paint, sq = fSq.paint;
  out.push('<svg xmlns="http://www.w3.org/2000/svg" class="block" width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '" shape-rendering="crispEdges">');
  out.push('<defs>' + fRim.def + fSq.def + fLm.def + fW.def +
    '<filter id="ymhalo" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="' + (q * 0.035).toFixed(2) + '" result="d"/><feFlood flood-color="' + Wt + '"/><feComposite in2="d" operator="in" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>');
  out.push('<rect width="' + S + '" height="' + S + '" rx="' + Math.round(m * 0.5) + '" fill="' + rim + '" shape-rendering="geometricPrecision"/>');
  out.push('<rect x="' + x0 + '" y="' + x0 + '" width="' + B + '" height="' + B + '" fill="' + fW.paint + '"/>');
  function pos(idx) { var f = idx % 8, r = Math.floor(idx / 8); if (o.flip) { f = 7 - f; r = 7 - r; } return [x0 + f * q, x0 + r * q]; }
  for (i = 0; i < 64; i++) {
    var p = pos(i);
    if ((i % 8 + Math.floor(i / 8)) % 2 === 1) out.push('<rect x="' + p[0] + '" y="' + p[1] + '" width="' + q + '" height="' + q + '" fill="' + sq + '"/>');
  }
  // Last move: both squares in a strong tint with an inner frame, distinct from light and dark squares.
  var tint = fLm.paint, fw = Math.max(2, Math.round(q * 0.04));
  var lm = [o.from, o.to].filter(function (idx) { return idx != null && idx >= 0; });
  lm.forEach(function (idx) {
    var p = pos(idx);
    out.push('<rect x="' + p[0] + '" y="' + p[1] + '" width="' + q + '" height="' + q + '" fill="' + tint + '"/>');
    out.push('<rect x="' + (p[0] + fw / 2) + '" y="' + (p[1] + fw / 2) + '" width="' + (q - fw) + '" height="' + (q - fw) + '" fill="none" stroke="' + K + '" stroke-width="' + fw + '"/>');
  });
  out.push('<rect x="' + (x0 - lw) + '" y="' + (x0 - lw) + '" width="' + (B + 2 * lw) + '" height="' + (B + 2 * lw) + '" fill="none" stroke="' + Wt + '" stroke-width="' + lw + '"/>');
  // 1-bit thresholds thin lines away: keep every piece line at least ~1.5 screen pixels (the set draws 1.5 of 45 units).
  var sw = o.bits === 1 ? 1.15 * 45 / (q * 1.04) : 0;   // 1.15 screen px in piece units
  if (sw > 1.5) out.push('<style>.ymp *{stroke-width:' + sw.toFixed(2) + 'px !important}</style>');
  out.push('<g class="ymp" filter="url(#ymhalo)" shape-rendering="geometricPrecision">');
  for (i = 0; i < 64; i++) {
    var c = o.board[i];
    if (c === '.') continue;
    var pp = pos(i), s = q * 1.04;
    out.push(pieceSvg(c, c === c.toUpperCase(), pp[0] + (q - s) / 2, pp[1] + (q - s) / 2, s));
  }
  out.push('</g>');
  if (o.coords) {
    var fs = Math.round(m * 0.62), fam = o.font || 'sans-serif';
    for (i = 0; i < 8; i++) {
      var file = String.fromCharCode(97 + (o.flip ? 7 - i : i)), rank = o.flip ? i + 1 : 8 - i, a = ' font-size="' + fs + '" text-anchor="middle" fill="' + Wt + '" font-family="' + fam + '" font-weight="bold"';
      out.push('<text x="' + (x0 + (i + 0.5) * q).toFixed(1) + '" y="' + (x0 + B + m * 0.5 + fs * 0.36).toFixed(1) + '"' + a + '>' + file + '</text>');
      out.push('<text x="' + (x0 / 2).toFixed(1) + '" y="' + (x0 + (i + 0.5) * q + fs * 0.36).toFixed(1) + '"' + a + '>' + rank + '</text>');
    }
  }
  out.push('</svg>');
  return out.join('');
}

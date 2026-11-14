// Drawing: the board as SVG text, cburnett pieces (source/pieces.js, 45 x 45 each). No DOM here, so it can be tested in Node.
// Rim board: a grey rim (#555, #777 in dark mode, black on 1-bit where grey would dither) with white coordinates on it,
// light squares white, dark squares grey (2-bit and up) or fine diagonal lines (1-bit), last move tinted and framed with an arrow.
function pieceSvg(type, white, x, y, s) {
  var k = (white ? 'w' : 'b') + type.toUpperCase();
  return '<svg x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + s.toFixed(2) + '" height="' + s.toFixed(2) + '" viewBox="0 0 45 45">' + PIECE_SVG[k] + '</svg>';
}
// The move arrow from square a to square b (top-left corners, side q): a shaft and a head that stops short of b's centre.
function arrowSvg(a, b, q, bits) {
  var ax = a[0] + q / 2, ay = a[1] + q / 2, bx = b[0] + q / 2, by = b[1] + q / 2, dx = bx - ax, dy = by - ay, L = Math.sqrt(dx * dx + dy * dy);
  if (!L) return '';
  var ux = dx / L, uy = dy / L, nx = -uy, ny = ux, tip = L - q * 0.22, hl = Math.min(q * 0.42, tip * 0.6), sw = q * 0.09, hw = q * 0.24;
  var P = function (t, n) { return (ax + ux * t + nx * n).toFixed(1) + ' ' + (ay + uy * t + ny * n).toFixed(1); };
  var d = 'M' + P(q * 0.12, sw) + 'L' + P(tip - hl, sw) + 'L' + P(tip - hl, hw) + 'L' + P(tip, 0) + 'L' + P(tip - hl, -hw) + 'L' + P(tip - hl, -sw) + 'L' + P(q * 0.12, -sw) + 'Z';
  return '<path d="' + d + '" fill="' + (bits === 1 ? '#000' : '#333') + '" stroke="#fff" stroke-width="' + Math.max(1.5, q * 0.025).toFixed(1) + '" stroke-linejoin="round" shape-rendering="geometricPrecision"/>';
}
// o: { size, board (64 chars), flip, from, to (indices or -1), coords, bits (1, 2 or 4), dark (dark mode), font }
function boardSvg(o) {
  var S = o.size, m = o.coords ? Math.round(S * 0.058) : Math.max(4, Math.round(S * 0.02)), q = Math.floor((S - 2 * m) / 8), B = q * 8, x0 = Math.round((S - B) / 2), i, out = [];
  var rim = o.bits === 1 ? '#000' : o.dark ? '#777' : '#555', sq = o.bits === 1 ? 'url(#ymd)' : '#aaa', lw = Math.max(1, Math.round(S * 0.003));
  out.push('<svg xmlns="http://www.w3.org/2000/svg" class="block" width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '" shape-rendering="crispEdges">');
  out.push('<defs><pattern id="ymlm" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#fff"/><rect y="2" width="1" height="1" fill="#000"/><rect x="1" y="1" width="1" height="1" fill="#000"/><rect x="2" width="1" height="1" fill="#000"/></pattern><pattern id="ymd" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#fff"/><rect y="3" width="1" height="1" fill="#000"/><rect x="1" y="2" width="1" height="1" fill="#000"/><rect x="2" y="1" width="1" height="1" fill="#000"/><rect x="3" width="1" height="1" fill="#000"/></pattern>' +
    '<filter id="ymhalo" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="' + (q * 0.035).toFixed(2) + '" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>');
  out.push('<rect width="' + S + '" height="' + S + '" rx="' + Math.round(m * 0.5) + '" fill="' + rim + '" shape-rendering="geometricPrecision"/>');
  out.push('<rect x="' + x0 + '" y="' + x0 + '" width="' + B + '" height="' + B + '" fill="#fff"/>');
  function pos(idx) { var f = idx % 8, r = Math.floor(idx / 8); if (o.flip) { f = 7 - f; r = 7 - r; } return [x0 + f * q, x0 + r * q]; }
  for (i = 0; i < 64; i++) {
    var p = pos(i);
    if ((i % 8 + Math.floor(i / 8)) % 2 === 1) out.push('<rect x="' + p[0] + '" y="' + p[1] + '" width="' + q + '" height="' + q + '" fill="' + sq + '"/>');
  }
  // Last move: both squares in a strong tint with an inner frame (distinct from light and dark squares), and an arrow from the
  // origin to the destination under the pieces, so the move reads at a glance.
  var tint = o.bits === 1 ? 'url(#ymlm)' : '#777', fw = Math.max(2, Math.round(q * 0.04));
  var lm = [o.from, o.to].filter(function (idx) { return idx != null && idx >= 0; });
  lm.forEach(function (idx) {
    var p = pos(idx);
    out.push('<rect x="' + p[0] + '" y="' + p[1] + '" width="' + q + '" height="' + q + '" fill="' + tint + '"/>');
    out.push('<rect x="' + (p[0] + fw / 2) + '" y="' + (p[1] + fw / 2) + '" width="' + (q - fw) + '" height="' + (q - fw) + '" fill="none" stroke="#000" stroke-width="' + fw + '"/>');
  });
  if (lm.length === 2) out.push(arrowSvg(pos(o.from), pos(o.to), q, o.bits));
  out.push('<rect x="' + (x0 - lw) + '" y="' + (x0 - lw) + '" width="' + (B + 2 * lw) + '" height="' + (B + 2 * lw) + '" fill="none" stroke="#fff" stroke-width="' + lw + '"/>');
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
      var file = String.fromCharCode(97 + (o.flip ? 7 - i : i)), rank = o.flip ? i + 1 : 8 - i, a = ' font-size="' + fs + '" text-anchor="middle" fill="#fff" font-family="' + fam + '" font-weight="bold"';
      out.push('<text x="' + (x0 + (i + 0.5) * q).toFixed(1) + '" y="' + (x0 + B + m * 0.5 + fs * 0.36).toFixed(1) + '"' + a + '>' + file + '</text>');
      out.push('<text x="' + (x0 / 2).toFixed(1) + '" y="' + (x0 + (i + 0.5) * q + fs * 0.36).toFixed(1) + '"' + a + '>' + rank + '</text>');
    }
  }
  out.push('</svg>');
  return out.join('');
}

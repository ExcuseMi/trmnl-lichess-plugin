// Drawing: pieces (own set, 45 x 45 boxes) and the board as SVG text. No DOM here, so it can be tested in Node.
var PIECES = {
  P: { d: 'M22.5 18.5c-4.5 0-6.5 3.5-6.5 6.5 0 3 2.5 4.5 3 8h7c.5-3.5 3-5 3-8 0-3-2-6.5-6.5-6.5z', extra: '<circle cx="22.5" cy="13" r="5.3"/>', det: 'M17 22.5q5.5 2.5 11 0' },
  R: { d: 'M12 38.5v-4l3-3v-14l-3-2.5v-9h5v3h3.5v-3h4v3H28v-3h5v9l-3 2.5v14l3 3v4z', det: 'M15 31.5h15M15 17.5h15M12 14h21' },
  B: { d: 'M22.5 8.5c5 3.5 8 8 8 12.5 0 3-2 5-4 6.5l1.5 3c2.5 1 4 2.5 5 4v4h-21v-4c1-1.5 2.5-3 5-4l1.5-3c-2-1.5-4-3.5-4-6.5 0-4.5 3-9 8-12.5z', extra: '<circle cx="22.5" cy="6.2" r="2.8"/>', det: 'M19.5 18.5h6M22.5 15.5v6M17 33.5h11' },
  N: { d: 'M12.5 38.5c0-6.5 1-10.5 5.5-14-2.8.2-5.3 1-7.2-.3-1.5-1.2-.3-3.3 1.2-5.3l4.2-5.5c.4-2 .4-3.7.9-5.2l2.8 2.3c1.5-1 3.5-2 6-2 7.5 0 12.5 5.5 12.5 14.5 0 6-.5 10.5-.5 15.5z', det: 'M24.5 9.5c5 1.5 8.5 7 8.5 15M11.5 22.5l3.5-.8', extra: '<circle cx="19.5" cy="13.5" r="1.5" class="ink"/><circle cx="11.7" cy="21.2" r="1" class="ink"/>' },
  Q: { d: 'M9.5 15l5 17 2.5-14 4.5 14 1-16 1 16 4.5-14 2.5 14 5-17-3 23.5h-21z', extra: '<circle cx="9" cy="13.2" r="2.4"/><circle cx="15.5" cy="9.8" r="2.4"/><circle cx="22.5" cy="8.6" r="2.4"/><circle cx="29.5" cy="9.8" r="2.4"/><circle cx="36" cy="13.2" r="2.4"/>', det: 'M12.5 33.5h20' },
  K: { d: 'M22.5 14c-6 0-10 4-10 9 0 3.5 2 5.5 4 7.5l-3 8h18l-3-8c2-2 4-4 4-9 0-5-4-7.5-10-7.5z', extra: '<path d="M21 3.2h3v3.2h3.4v3H24v3.2h-3V9.4h-3.4v-3H21z"/>', det: 'M16 31h13M22.5 14.5v5' }
};
// One piece at (x, y) with side s. white: white fill, black outline. black: black fill, white details, white halo against the square.
function pieceSvg(type, white, x, y, s) {
  var P = PIECES[type.toUpperCase()], k = s / 45, ink = white ? '#000' : '#000', fill = white ? '#fff' : '#000', det = white ? '#000' : '#fff';
  var sw = 1.7;
  var body = '<path d="' + P.d + '"/>' + (P.extra || '').replace(/ class="ink"/g, ' fill="#000" stroke="none"');
  var halo = white ? '' : '<g fill="#fff" stroke="#fff" stroke-width="4.2" stroke-linejoin="round" opacity="1">' + body.replace(/<circle ([^>]*) fill="#000" stroke="none"\/>/g, '') + '</g>';
  var base = '<path d="M10.5 38.5h24v-3c0-1.2-1-2.2-2.2-2.2H12.7c-1.2 0-2.2 1-2.2 2.2z"/>';
  var halo2 = white ? '' : '<g fill="#fff" stroke="#fff" stroke-width="4.2" stroke-linejoin="round">' + base + '</g>';
  return '<g transform="translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') scale(' + k.toFixed(4) + ')">' + halo + halo2 +
    '<g fill="' + fill + '" stroke="' + ink + '" stroke-width="' + sw + '" stroke-linejoin="round" stroke-linecap="round">' + body + base + '</g>' +
    '<g fill="none" stroke="' + det + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' + (P.det ? '<path d="' + P.det + '"/>' : '') + '</g></g>';
}
// The board. o: { size, board (64 chars), flip, from, to (indices or -1), coords, bits (1, 2 or 4), font }
function boardSvg(o) {
  var S = o.size, pad = o.coords ? Math.max(11, S * 0.045) : 0, edge = Math.max(2, S * 0.008), B = S - 2 * pad, q = B / 8, i, out = [];
  var dark = o.bits === 1 ? 'url(#ymh)' : '#a8a8a8';
  out.push('<svg xmlns="http://www.w3.org/2000/svg" class="block" width="' + S + '" height="' + S + '" viewBox="0 0 ' + S + ' ' + S + '">');
  out.push('<defs><pattern id="ymh" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="#fff"/><rect width="1.6" height="4" fill="#000"/></pattern></defs>');
  out.push('<rect x="' + pad + '" y="' + pad + '" width="' + B + '" height="' + B + '" fill="#fff"/>');
  function pos(idx) { var f = idx % 8, r = Math.floor(idx / 8); if (o.flip) { f = 7 - f; r = 7 - r; } return [pad + f * q, pad + r * q]; }
  for (i = 0; i < 64; i++) {
    var p = pos(i), f = i % 8, r = Math.floor(i / 8);
    if ((f + r) % 2 === 1) out.push('<rect x="' + p[0].toFixed(2) + '" y="' + p[1].toFixed(2) + '" width="' + q.toFixed(2) + '" height="' + q.toFixed(2) + '" fill="' + dark + '"/>');
  }
  [o.from, o.to].forEach(function (idx) {
    if (idx == null || idx < 0) return;
    var p = pos(idx), w = Math.max(2.5, q * 0.07);
    out.push('<rect x="' + (p[0] + w / 2).toFixed(2) + '" y="' + (p[1] + w / 2).toFixed(2) + '" width="' + (q - w).toFixed(2) + '" height="' + (q - w).toFixed(2) + '" fill="none" stroke="#000" stroke-width="' + w.toFixed(2) + '"/>');
    out.push('<rect x="' + (p[0] + w * 1.6).toFixed(2) + '" y="' + (p[1] + w * 1.6).toFixed(2) + '" width="' + (q - w * 3.2).toFixed(2) + '" height="' + (q - w * 3.2).toFixed(2) + '" fill="none" stroke="#fff" stroke-width="' + (w * 0.8).toFixed(2) + '"/>');
  });
  out.push('<rect x="' + pad + '" y="' + pad + '" width="' + B + '" height="' + B + '" fill="none" stroke="#000" stroke-width="' + edge + '"/>');
  for (i = 0; i < 64; i++) {
    var c = o.board[i];
    if (c === '.') continue;
    var pp = pos(i);
    out.push(pieceSvg(c, c === c.toUpperCase(), pp[0] - q * 0.05, pp[1] - q * 0.02, q * 1.1));
  }
  if (o.coords) {
    var fs = Math.max(8, pad * 0.78);
    for (i = 0; i < 8; i++) {
      var file = String.fromCharCode(97 + (o.flip ? 7 - i : i)), rank = o.flip ? i + 1 : 8 - i;
      out.push('<text x="' + (pad + (i + 0.5) * q).toFixed(2) + '" y="' + (S - pad * 0.22).toFixed(2) + '" font-size="' + fs.toFixed(1) + '" text-anchor="middle" fill="#000" font-family="' + (o.font || 'sans-serif') + '" font-weight="bold">' + file + '</text>');
      out.push('<text x="' + (pad * 0.5).toFixed(2) + '" y="' + (pad + (i + 0.5) * q + fs * 0.35).toFixed(2) + '" font-size="' + fs.toFixed(1) + '" text-anchor="middle" fill="#000" font-family="' + (o.font || 'sans-serif') + '" font-weight="bold">' + rank + '</text>');
    }
  }
  out.push('</svg>');
  return out.join('');
}

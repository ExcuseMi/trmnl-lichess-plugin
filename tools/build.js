// Build: source/*.js -> plugin/src/transform.js (one file, as TRMNL serverless takes it) and
// source/shared.liquid + draw.js + page.js -> plugin/src/shared.liquid. Tests load the same concatenation.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PARTS = ['vendor/chess.min.js', 'chess.js', 'view.js', 'puzzle.js'];
const rd = (p) => fs.readFileSync(path.join(ROOT, 'source', p), 'utf8');
function bundle() { return PARTS.map((p) => '// ==== ' + p + '\n' + rd(p)).join('\n'); }
// Liquid captures of the cburnett pieces as data URIs (move list figurines, the king in "Your turn"), from source/pieces.js.
function pieceCaptures() {
  const ctx = {}; require('vm').runInNewContext(rd('pieces.js') + ';this.P = PIECE_SVG;', ctx);
  const cap = (name, svg) => '{%- capture ' + name + ' -%}data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">' + svg + '</svg>').toString('base64') + '{%- endcapture -%}';
  // ym_1<key>: for 1-bit move lists, the same glyph with every line at 3 units, so a 16 px figurine keeps solid black edges
  const bold = (svg) => '<g stroke-width="2.6">' + svg.replace(/stroke-width="[0-9.]+"/g, 'stroke-width="2.6"') + '</g>';
  return Object.keys(ctx.P).map((k) => cap('ym_' + k, ctx.P[k]) + '\n' + cap('ym_1' + k, bold(ctx.P[k]))).join('\n');
}
function icon() { return fs.readFileSync(path.join(ROOT, 'assets/icon-mono.svg'), 'utf8').trim(); }
function page() { return rd('shared.liquid').replace('{{ICON}}', icon).replace('{{PIECES}}', pieceCaptures).replace('{{DRAW}}', () => rd('pieces.js') + rd('draw.js')).replace('{{PAGE}}', () => rd('page.js')); }
module.exports = { bundle, page };
if (require.main === module) {
  const t = path.join(ROOT, 'plugin/src/transform.js'), s = path.join(ROOT, 'plugin/src/shared.liquid');
  fs.writeFileSync(t, bundle()); fs.writeFileSync(s, page());
  console.log(t + ': ' + fs.statSync(t).size + ' bytes\n' + s + ': ' + fs.statSync(s).size + ' bytes');
}

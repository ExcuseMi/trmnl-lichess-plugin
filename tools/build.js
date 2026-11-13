// Build: source/*.js -> plugin/src/transform.js (one file, as TRMNL serverless takes it) and
// source/shared.liquid + draw.js + page.js -> plugin/src/shared.liquid. Tests load the same concatenation.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PARTS = ['vendor/chess.min.js', 'chess.js', 'puzzle.js'];
const rd = (p) => fs.readFileSync(path.join(ROOT, 'source', p), 'utf8');
function bundle() { return PARTS.map((p) => '// ==== ' + p + '\n' + rd(p)).join('\n'); }
function page() { return rd('shared.liquid').replace('{{DRAW}}', () => rd('draw.js')).replace('{{PAGE}}', () => rd('page.js')); }
module.exports = { bundle, page };
if (require.main === module) {
  const t = path.join(ROOT, 'plugin/src/transform.js'), s = path.join(ROOT, 'plugin/src/shared.liquid');
  fs.writeFileSync(t, bundle()); fs.writeFileSync(s, page());
  console.log(t + ': ' + fs.statSync(t).size + ' bytes\n' + s + ': ' + fs.statSync(s).size + ' bytes');
}

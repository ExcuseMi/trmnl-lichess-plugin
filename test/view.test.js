// View guards that need no browser. The rendered view (parts per view and device, move order, the connect screen, the
// title bar mode) is checked by tools/view_checks.json through tools/render_sheet_spec.rb (trmnlp test, needs trmnl.com).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('pieces.js is generated from the cburnett SVGs in assets (run tools/pieces.js after changing them)', () => {
  assert.strictEqual(rd('source/pieces.js'), require('../tools/pieces.js').generate());
});

// Owner 2026-11-14: everything but the chessboard is Framework markup. No style= and no <style> anywhere in the markup or
// the page script; only draw.js (the board's SVG, inside data-ym-board) may carry its own styling.
test('no custom CSS outside the board: no style= or <style> in shared.liquid or page.js', () => {
  for (const f of ['source/shared.liquid', 'source/page.js']) {
    const t = rd(f).replace(/\{%-? comment -?%\}[\s\S]*?\{%-? endcomment -?%\}/g, '');
    assert.ok(!/\sstyle\s*=/i.test(t), f + ' has style=');
    assert.ok(!/<style\b/i.test(t), f + ' has a <style> block');
  }
});

test('the board takes its colours from the Framework resolver (no hard-coded greys) and keeps its light look in dark mode', () => {
  const asked = [];
  const ctx = { window: { TRMNLPaint: { bg: (k) => { asked.push(k); return { color: 'rgb(' + k + ')', url: null, size: null }; } } } };
  vm.createContext(ctx);
  vm.runInContext(rd('source/pieces.js') + rd('source/draw.js') + ';this.boardSvg = boardSvg;', ctx);
  const BOARD = 'rnbqkbnr' + 'pppppppp' + '.'.repeat(32) + 'PPPPPPPP' + 'RNBQKBNR';
  const svg = ctx.boardSvg({ size: 400, board: BOARD, flip: false, from: 52, to: 36, coords: true, bits: 4, dark: false, font: 'x' });
  assert.ok(!/#[0-9a-f]{3}([0-9a-f]{3})?\b/i.test(svg.replace(/<style>[\s\S]*?<\/style>/g, '')), 'no hex colour in the board');
  assert.ok(['white', 'gray-55', 'gray-40', 'black'].every((k) => asked.includes(k)), 'light, dark, last-move squares and ink asked: ' + asked.join(','));
  asked.length = 0;
  ctx.boardSvg({ size: 400, board: BOARD, flip: false, from: 52, to: 36, coords: true, bits: 4, dark: true, font: 'x' });
  assert.ok(asked.includes('black') && asked.includes('gray-30'), 'dark mode asks the inverse tokens so the board stays light: ' + asked.join(','));
});

// View tests: the page script gets a normalised model plus capability flags and must show or hide parts accordingly, never
// by provider. Runs the real draw.js and page.js in headless Chromium (offline: a stub flex CSS stands in for the Framework,
// so this checks WHICH parts exist, not how they look). Skipped when no Chromium is found (set CHROME to point at one).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const cands = [process.env.CHROME, ...['1248', '1243'].map((v) => path.join(os.homedir(), '.cache/ms-playwright/chromium-' + v + '/chrome-linux64/chrome'))].filter(Boolean);
const CHROME = cands.find((c) => fs.existsSync(c));
const draw = fs.readFileSync(path.join(ROOT, 'source/draw.js'), 'utf8'), page = fs.readFileSync(path.join(ROOT, 'source/page.js'), 'utf8');
const QR = '<svg class="qr-code" xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37"><rect width="37" height="37" fill="#fff"/><rect x="4" y="4" width="7" height="7"/></svg>';
const BOARD = 'rnbqkbnr' + 'pppppppp' + '.'.repeat(32) + 'PPPPPPPP' + 'RNBQKBNR';
const PUZ = { source: 'lichess', id: 'x', url: 'https://lichess.org/training/x', board: BOARD, turn: 'w', from: 52, to: 36, rating: 1500, themes: ['Fork'], title: '' };
const FULL = { rating: 1500, label: 'rating_you', delta: 12, trend: 'up', history: [1400, 1450, 1500], today: 2, week: 9, streak: 3, days: [0, 1, 2, 3, 4, 5, 6].map((i) => ({ s: i, f: 1 })), name: 'd' };
const T = { white: 'White to move', black: 'Black to move', scan: 'Scan to solve', rating: 'Puzzle', today: 'today', week: 'this week', streak: 'streak', tactics: 'Tactics best', rating_you: 'Your rating', rush: 'Rush best', connect: 'Connect Lichess to track your progress' };
const ALL = { personal: true, solved: true, history: true, streak: true }, NONE = { personal: false, solved: false, history: false, streak: false };

function parts(ym, W, H) {
  const model = { view: 1, puzzle: PUZ, account: null, caps: NONE, t: T, to_move: 'White to move', banner: '', notice: '', stale: false, coords: true, white_bottom: true, ...ym };
  const html = `<html><head><style>body{margin:0}.screen{width:${W}px;height:${H}px;display:flex;flex-direction:column}.layout{flex:1;display:flex;align-items:center;padding:10px;gap:10px;box-sizing:border-box}.layout--col{flex-direction:column}.flex{display:flex}.flex--col{flex-direction:column}.flex--row{flex-direction:row}.grow{flex:1}.block{display:block}</style></head><body><div class="screen screen--1bit"><div class="layout" data-ym><div class="flex" data-ym-board></div><div class="flex flex--col" data-ym-side></div></div><div hidden data-ym-qr>${QR}</div><script>var YM=${JSON.stringify(model)};${draw}\n${page}</script></div></body></html>`;
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ym-view-')), 'v.html');
  fs.writeFileSync(f, html);
  const raw = execFileSync(CHROME, ['--headless', '--disable-gpu', '--no-sandbox', `--window-size=${W},${H}`, '--virtual-time-budget=2000', '--dump-dom', 'file://' + f], { encoding: 'utf8', timeout: 60000 });
  fs.rmSync(path.dirname(f), { recursive: true });
  const dom = raw.replace(/<script[\s\S]*?<\/script>/g, '');   // the markup the script drew, not the script's own text
  assert.ok(dom.includes('data-ym-drawn'), 'page script ran to the end');
  const got = new Set((dom.match(/data-ym-part="(\w+)"/g) || []).map((m) => m.slice(14, -1)));
  return { got, qr: dom.includes('data-ym-qrbox'), dom };
}
const names = (r) => Array.from(r.got).sort().join(',');
const skip = CHROME ? false : 'no Chromium';

test('lichess with a login: rating, history, stats, bars, QR; no connect hint', { skip }, () => {
  const r = parts({ account: FULL, caps: ALL }, 800, 480);
  assert.strictEqual(names(r), 'bars,rating,spark,stats'); assert.ok(r.qr);
});
test('no provider account: hint and QR only, no progress parts', { skip }, () => {
  const r = parts({ account: null, caps: NONE }, 800, 480);
  assert.strictEqual(names(r), 'hint'); assert.ok(r.qr);
});
test('chess.com: rating and rush only (no history, no bars, no hint)', { skip }, () => {
  const r = parts({ puzzle: { ...PUZ, source: 'chesscom' }, account: { rating: 1456, low: 800, rush: 31, label: 'tactics', name: 'd' }, caps: NONE }, 800, 480);
  assert.strictEqual(names(r), 'rating,stats'); assert.ok(r.dom.includes('Tactics best')); assert.ok(r.dom.includes('Rush best 31'));
});
test('capability off hides exactly its part: history, solved, streak', { skip }, () => {
  assert.strictEqual(names(parts({ account: FULL, caps: { ...ALL, history: false } }, 800, 480)), 'bars,rating,stats');
  assert.strictEqual(names(parts({ account: FULL, caps: { ...ALL, solved: false } }, 800, 480)), 'rating,spark,stats');   // streak alone still shows a stats line
  const noStreak = parts({ account: FULL, caps: { ...ALL, streak: false } }, 800, 480);
  assert.ok(noStreak.dom.includes('2 today') && !noStreak.dom.includes('streak 3'));
  const only = parts({ account: FULL, caps: { ...NONE, solved: true } }, 800, 480);
  assert.ok(only.dom.includes('2 today') && !only.dom.includes('streak 3'));
  assert.strictEqual(names(parts({ account: FULL, caps: NONE }, 800, 480)), 'rating');
});
test('small views keep the rating and drop the charts', { skip }, () => {
  const r = parts({ view: 4, account: FULL, caps: ALL }, 400, 240);
  assert.strictEqual(names(r), 'rating');
});

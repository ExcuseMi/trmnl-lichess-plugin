// Owner 2026-11-14: settings without a group; Mode shows only the fields its mode uses (conditional_validation).
const test = require('node:test'); const assert = require('node:assert'); const fs = require('fs'); const path = require('path');
const FILE = process.env.SETTINGS_YML || path.join(__dirname, '../plugin/src/settings.yml');
test('settings: no group, Mode reveals difficulty/focus for Puzzles and the username for Follow', () => {
  const y = fs.readFileSync(FILE, 'utf8');
  assert.ok(!/^\s*group:/m.test(y), 'no field has a group');
  assert.ok(/conditional_validation:\n  - when: puzzles\n    visible:\n    - difficulty\n    - puzzle_focus\n  - when: following\n    visible:\n    - follow_username/.test(y), 'Mode conditions');
  for (const k of ['difficulty', 'puzzle_focus', 'follow_username'])
    assert.ok(new RegExp('keyname: ' + k + '\\n(  .*\\n)*?  optional: true').test(y), k + ' optional (hidden fields must not block saving)');
});
test('marketplace tagline: present and at most 35 characters (TRMNL requires it, owner 2026-11-14)', () => {
  const y = fs.readFileSync(FILE, 'utf8'), m = /^description: (.*)$/m.exec(y), t = m ? m[1].replace(/^'(.*)'$/, '$1').trim() : '';
  assert.ok(t.length > 0 && t.length <= 35, 'tagline "' + t + '" (' + t.length + ')');
});
test('repo URL, learn_more_url, About text (review 2026-11-15 items 1, 2, 4)', () => {
  const y = fs.readFileSync(FILE, 'utf8');
  assert.ok(/^  github_url: https:\/\/github\.com\/ExcuseMi\/trmnl-lichess-plugin$/m.test(y), 'github_url is the repo');
  assert.ok(!/your-move/i.test(y), 'no your-move link');
  assert.ok(/^  learn_more_url: https:\/\/github\.com\/ExcuseMi\/trmnl-lichess-plugin#readme$/m.test(y), 'learn_more_url in the author_bio field (trmnlp drops a top-level one)');
  assert.ok(!/without a login|daily puzzle/i.test(y), 'About must not claim a puzzle without a login');
  assert.strictEqual((y.match(/Connect Lichess with the OAuth button above/g) || []).length, 1, 'OAuth sentence once');
  assert.ok(/^description: .*(puzzles).*(games).*(live)/mi.test(y), 'tagline names the modes');
});
test('only the Cburnett piece set ships (unused sets and their licence files are gone, review item 9)', () => {
  const root = path.join(__dirname, '..');
  assert.deepStrictEqual(fs.readdirSync(path.join(root, 'assets/pieces')), ['cburnett']);
  const lic = fs.readdirSync(path.join(root, 'LICENSES')).filter((f) => /chessnut|celtic|kosal/i.test(f));
  assert.deepStrictEqual(lic, []);
});
test('the Lichess logo is not shipped: icons are the Cburnett knight (review item 10)', () => {
  const root = path.join(__dirname, '..');
  assert.ok(!fs.existsSync(path.join(root, 'assets/owner')), 'no assets/owner');
  for (const f of ['assets/icon.svg', 'assets/icon-mono.svg']) assert.ok(!fs.readFileSync(path.join(root, f), 'utf8').includes('M38.956.5'), f + ' holds the Lichess logo path');
});

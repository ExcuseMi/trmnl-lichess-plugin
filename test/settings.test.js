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

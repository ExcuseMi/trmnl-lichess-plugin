// A mode must not leak implicit globals (ctx, H, T, diag, saved once did: a second run in the same worker saw the first one's values).
const test = require('node:test');
const assert = require('node:assert');
const vm = require('vm');
const { bundle } = require('../tools/build.js');
const resp = (status, body) => ({ status, text: async () => JSON.stringify(body) });
test('no mode creates a global when it runs (var everywhere)', async () => {
  const fetchImpl = async () => resp(599, {});
  const ctx = { console, setTimeout, clearTimeout, AbortController, fetch: fetchImpl, JSON, Date, Promise, Math, Object, Array, String, Number, RegExp, Error, encodeURIComponent };
  vm.createContext(ctx); vm.runInContext(bundle() + '\n;this.api = { run };', ctx);
  const before = new Set(Object.getOwnPropertyNames(ctx));
  for (const mode of ['puzzles', 'games', 'profile', 'top', 'following']) {
    await ctx.api.run({ trmnl: { system: { timestamp_utc: 1792000000 }, state: {}, plugin_settings: { custom_fields_values: { mode, follow_username: 'KnightOwl' } }, oauth: { access_token: 'T' } } });
    const leaked = Object.getOwnPropertyNames(ctx).filter((k) => !before.has(k));
    assert.deepStrictEqual(leaked, [], mode + ' leaked globals: ' + leaked.join(', '));
  }
});

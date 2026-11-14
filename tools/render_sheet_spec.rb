# frozen_string_literal: true
# Renders PNGs for the review sheet. YM_CASES: JSON list of {name, view, device, dark, scenario}; YM_OUT: folder.
# Scenarios: account (Lichess login, rising rating), daily (no login: the connect screen), case (a board case), owner (a real puzzle and rating), banner (the shown puzzle was solved), offline.
require 'json'
require 'fileutils'
require 'time'
FX = File.join(__dir__, '..', 'plugin', 'tests', 'fixtures')
def fx(n) = File.read(File.join(FX, n))
NOW = Time.utc(2026, 11, 14, 10, 0, 0)
def activity(n_today, streak_wins)
  rows = []
  t = NOW.to_i * 1000
  # newest first: `streak_wins` wins in a row, then a loss, then older days
  (streak_wins).times { |i| rows << { date: t - i * 3_600_000, win: true, puzzle: { id: "p#{i}", rating: 1800 } } }
  rows << { date: t - streak_wins * 3_600_000, win: false, puzzle: { id: 'pf', rating: 1900 } }
  [1, 2, 2, 3, 4, 5].each_with_index { |d, i| 3.times { |k| rows << { date: t - d * 86_400_000 - k * 600_000, win: (i + k) % 4 != 0, puzzle: { id: "o#{i}#{k}", rating: 1700 } } } }
  rows.map(&:to_json).join("\n")
end
HIST = [{ name: 'Puzzles', points: (0...30).map { |i| [2026, 9, 15 + i % 15, 1790 + i * 3 + (i % 4) * 2 - (i % 7)] } }].freeze
# The Lichess login is the OAuth connection: trmnlp's test runs have no way to set one, so this writes the token store a
# connected preview would have into the run's fresh cache before the transform starts.
module YmOAuthSeed
  def seed(paths)
    super
    tok = Thread.current[:ym_oauth]
    return unless tok

    paths.oauth_tokens.dirname.mkpath
    paths.oauth_tokens.write(JSON.generate('access_token' => tok, 'token_type' => 'Bearer'))
  end
end
TRMNLP::Testing::Run.prepend(YmOAuthSeed)
ENV['TRMNL_OAUTH_CLIENT_ID'] ||= 'trmnlp-render'   # Lichess checks neither; any id and secret make the local provider configured
ENV['TRMNL_OAUTH_CLIENT_SECRET'] ||= 'trmnlp-render'
# GET /api/user/{name}/activity, newest day first: puzzles on 5 of the last 7 days with the rating before and after.
D0 = (NOW.to_i / 86_400) * 86_400_000
WEEK = [[2, 1, 1458, 1470], [0, 0, 0, 0], [3, 1, 1440, 1458], [1, 2, 1452, 1440], [4, 0, 1421, 1452], [0, 0, 0, 0], [2, 2, 1425, 1421]]
       .each_with_index.map do |(w, l, b, a), i|
         day = { interval: { start: D0 - i * 86_400_000, end: D0 - (i - 1) * 86_400_000 } }
         day[:puzzles] = { score: { win: w, loss: l, draw: 0, rp: { before: b, after: a } } } if w + l > 0
         day
       end.freeze
def lichess_mocks(rating: 1873, solved: nil, puzzle: 'lichess_daily.json')
  acts = activity(3, 4)
  acts = ({ date: NOW.to_i * 1000, win: true, puzzle: { id: solved, rating: 1800 } }.to_json + "\n" + acts) if solved
  { 'https://lichess.org/api/account' => { json: { username: 'Demo', perfs: { puzzle: { rating: rating, games: 400 } } } },
    'https://lichess.org/api/puzzle/activity*' => { body: acts },
    'https://lichess.org/api/user/Demo/rating-history' => { json: HIST },
    'https://lichess.org/api/puzzle/next*' => { json: JSON.parse(fx(puzzle)) },
    'https://lichess.org/api/token/test' => { json: { 'tok' => { scopes: 'puzzle:read', userId: 'demo' } } },
    'https://lichess.org/api/user/Demo/activity' => { json: WEEK } }
end
FONT_SIZES_JS = <<~JS.freeze
  (function () {
    var side = document.querySelector('[data-ym-side]'), seen = {};
    if (!side) return [];
    side.querySelectorAll('*').forEach(function (e) {
      var own = Array.prototype.some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      if (own && e.getClientRects().length) seen[Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10] = 1;
    });
    return Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
  })()
JS
RSpec.describe 'renders' do
  JSON.parse(ENV.fetch('YM_CASES')).each do |c|
    it c['name'] do
      sc = c['scenario'] || 'daily'
      mocks = { 'https://lichess.org/api/puzzle/daily' => { json: JSON.parse(fx(c['puzzle'] || 'lichess_daily.json')) }}   # puzzle: another fixture (board cases)
      fields = {}
      state = nil
      login = nil
      case sc
      when 'account' then mocks = lichess_mocks.merge(mocks); login = 'tok'; state = { 'rating' => 1861, 'cur' => { 'id' => 'u3zfD', 't' => NOW.to_i - 100, 'r0' => 1861 },
        'last' => nil }
      when 'banner'
        mocks = lichess_mocks(rating: 1873, solved: 'old1').merge(mocks); login = 'tok'
        state = { 'rating' => 1861, 'cur' => { 'id' => 'old1', 't' => NOW.to_i - 7200, 'r0' => 1861 }, 'last' => { 'id' => 'old1' } }
      when 'case'    # a board case (edge squares, a knight move, black to move): a login and the puzzle in c['puzzle']
        mocks = lichess_mocks(puzzle: c['puzzle'] || 'lichess_daily.json').merge(mocks); login = 'tok'
      when 'owner'   # the owner's real case of 2026-11-14: puzzle uBhLF (public), rating 1470
        mocks = lichess_mocks(rating: 1470, puzzle: 'lichess_uBhLF.json').merge(mocks); login = 'tok'
        state = { 'rating' => 1470, 'cur' => nil, 'last' => nil }
      when 'offline'
        mocks = { 'https://lichess.org/api/puzzle/daily' => { status: 503, json: {} } }
        state = { 'rating' => 0, 'last' => { 'source' => 'lichess', 'id' => 'u3zfD', 'url' => 'https://lichess.org/training/u3zfD', 'board' => '...k....' + '...b.p..' + '.p.P.p.p' + '....Q...' + '....B...' + '....qP.P' + 'P.p...PK' + '........', 'turn' => 'w', 'from' => 4, 'to' => 3, 'rating' => 1874, 'themes' => ['Mate in 3'], 'title' => '' } }
      end
      fields['orientation'] = c['orientation'] if c['orientation']
      dev = c['device'].is_a?(Hash) ? c['device'].transform_keys(&:to_sym) : (c['device'] || 'v2')
      opts = { view: c['view'], device: dev, mocks: mocks, custom_fields: fields, now: NOW.iso8601, wait_for: "document.querySelector('[data-ym-drawn],[data-ym-none]') !== null || document.querySelector('.layout') !== null" }
      opts[:dark_mode] = true if c['dark']
      opts[:palette] = c['palette'] if c['palette']   # e.g. the X's gray-4 or bw palette
      opts[:state] = state if state
      opts[:orientation] = c['portrait'] ? :portrait : :landscape
      Thread.current[:ym_oauth] = login
      s = trmnl.render(**opts)
      Thread.current[:ym_oauth] = nil
      FileUtils.mkdir_p(ENV.fetch('YM_OUT'))
      FileUtils.cp(s.png_path, File.join(ENV.fetch('YM_OUT'), "#{c['name']}.png"))
      # Type system (owner 2026-11-14): the side panel uses at most 4 text sizes. Counts the computed font size of every element
      # that draws text (its own text nodes, SVG text included); the board's coordinates are outside the panel.
      # View checks (tools/view_checks.json): each a JavaScript expression on the rendered page that must be true.
      (c['checks'] || {}).each { |what, js| expect(s.evaluate(js)).to be_truthy, "#{c['name']}: #{what}" }
      sizes = s.evaluate(FONT_SIZES_JS)
      expect(sizes.length).to be <= 4, "#{c['name']}: #{sizes.length} text sizes in the panel: #{sizes.inspect}"
    end
  end
end

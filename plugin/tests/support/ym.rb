# frozen_string_literal: true
# Shared by plugin/tests/*_spec.rb (trmnlp test) and tools/render_sheet_spec.rb (review sheets): fixtures, Lichess mocks,
# the OAuth seed and ym_render(trmnl, case). A case: {name, view, device, dark, palette, scenario, puzzle, checks}.
# Scenarios: top_live, top_tv, top_fail, top_offline (mode Top game), follow_playing, follow_last, follow_unknown, follow_empty, follow_fail (mode Following), games_one, games_many, games_none, games_fail, games_scope (mode Your games), account (Lichess login, rising rating), daily (no login: the connect screen), case (a board case), owner (a real puzzle and rating), banner (the shown puzzle was solved), offline.
require 'json'
require 'fileutils'
require 'time'
FX = File.join(__dir__, '..', 'fixtures')
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
# "Your games" mode (mode = games): the playing list, the top game's moves, the last finished game.
def games_mocks(playing: 'games_playing_one.json', status: 200, export: true, last: true)
  m = { 'https://lichess.org/api/account' => { json: { username: 'Demo', perfs: { puzzle: { rating: 1470 } } } },
        'https://lichess.org/api/account/playing*' => { status: status, json: status == 200 ? JSON.parse(fx(playing)) : {} } }
  m['https://lichess.org/game/export/*'] = { json: JSON.parse(fx('games_export.json')) } if export
  m['https://lichess.org/api/games/user/Demo*'] = { body: fx('games_last.ndjson') } if last
  m
end
# "Profile" mode: account, rating history and the last rated games (fixtures profile_*; the player is KnightOwl / NewbieNell).
def profile_mocks(account: 'profile_account_many.json', history: 'profile_history_many.json', games: 'profile_games_many.ndjson', status: 200, history_status: 200, games_status: 200)
  me = JSON.parse(fx(account))['username']
  { 'https://lichess.org/api/account' => { status: status, json: status == 200 ? JSON.parse(fx(account)) : {} },
    "https://lichess.org/api/user/#{me}/rating-history" => { status: history_status, json: history_status == 200 ? JSON.parse(fx(history)) : {} },
    "https://lichess.org/api/games/user/#{me}*" => { status: games_status, body: games_status == 200 ? fx(games) : '' } }
end
# "Top game" and "Follow a player" modes (fixtures top_*, tv_*, follow_*; the player is KnightOwl). broadcast: the /api/broadcast/top answer.
def top_mocks(broadcast: 'top_broadcast.json', status: 200, tv: true, pgn: true)
  m = { 'https://lichess.org/api/broadcast/top' => { status: status, json: status == 200 ? JSON.parse(fx(broadcast)) : {} },
        'https://lichess.org/api/broadcast/-/-/rN4xYz01' => { json: JSON.parse(fx('top_round.json')) },
        'https://lichess.org/api/broadcast/-/-/clubR001' => { json: { round: { id: 'clubR001' }, tour: {}, games: [] } },
        'https://lichess.org/api/tv/channels' => { status: tv ? 200 : 503, json: tv ? JSON.parse(fx('tv_channels.json')) : {} },
        'https://lichess.org/game/export/tvBest01*' => { json: JSON.parse(fx('tv_game.json')) } }
  m['https://lichess.org/api/study/rN4xYz01/g2LiveAB.pgn'] = { body: fx('top_pgn.pgn') } if pgn
  m
end
def follow_mocks(game: 'follow_game_playing.json', status: 200, user: 'KnightOwl')
  { "https://lichess.org/api/user/#{user}/current-game*" => { status: status, json: status == 200 ? JSON.parse(fx(game)) : {} } }
end
PANEL_OVERLAP_JS = <<~JS.freeze
  (function () {
    var out = [];
    // Every panel column ([data-ym-panel]: one in the puzzle views, two or three in Profile) is checked on its own.
    Array.prototype.forEach.call(document.querySelectorAll('[data-ym-panel]'), function (p) {
      if (!p.getClientRects().length) return;
      var kids = Array.prototype.filter.call(p.children, function (e) { return e.getClientRects().length && e.getBoundingClientRect().height > 0; });
      for (var i = 1; i < kids.length; i++) {
        var a = kids[i - 1].getBoundingClientRect(), b = kids[i].getBoundingClientRect();
        if (b.top < a.bottom - 1) out.push((kids[i - 1].getAttribute('data-ym-card') || kids[i - 1].className) + ' / ' + (kids[i].getAttribute('data-ym-card') || kids[i].className));
      }
      // one stack, one gap: every vertical gap between the column's blocks within 2 px of the others
      var gaps = [];
      for (var j = 1; j < kids.length; j++) gaps.push(kids[j].getBoundingClientRect().top - kids[j - 1].getBoundingClientRect().bottom);
      if (gaps.length > 1 && Math.max.apply(null, gaps) - Math.min.apply(null, gaps) > 2) out.push('unequal gaps ' + gaps.map(Math.round).join(','));
      // panels side by side share top and bottom
      var row = p.querySelector('[data-ym-bottom]');
      if (row) {
        var sib = Array.prototype.filter.call(row.children, function (e) { return e.getClientRects().length; }).map(function (e) { return e.getBoundingClientRect(); });
        for (var k = 1; k < sib.length; k++) if (Math.abs(sib[k].top - sib[0].top) > 2 || Math.abs(sib[k].bottom - sib[0].bottom) > 2) out.push('row panels not aligned');
      }
      // a card squeezed smaller than its content draws that content over its neighbours
      p.querySelectorAll('[data-ym-card]').forEach(function (e) { if (e.getClientRects().length && e.scrollHeight > e.clientHeight + 1) out.push(e.getAttribute('data-ym-card') + ' content taller than the card'); });
    });
    return out;
  })()
JS
FONT_SIZES_JS = <<~JS.freeze
  (function () {
    var seen = {};
    document.querySelectorAll('[data-ym-panel]').forEach(function (side) {
      side.querySelectorAll('*').forEach(function (e) {
        var own = Array.prototype.some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
        if (own && e.getClientRects().length) seen[Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10] = 1;
      });
    });
    return Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
  })()
JS
def ym_render(trmnl, c)
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
  when 'focus', 'focus_sparse', 'focus_fail'   # Puzzles with focus on my weakest theme and difficulty harder (dashboard: themes, too little data, failure)
    mocks = lichess_mocks(rating: 1470, puzzle: 'lichess_uBhLF.json'); login = 'tok'
    mocks['https://lichess.org/api/puzzle/dashboard/30'] = sc == 'focus' ? { json: JSON.parse(fx('dashboard_themes.json')) } : sc == 'focus_sparse' ? { json: JSON.parse(fx('dashboard_sparse.json')) } : { status: 503, json: {} }
    state = { 'rating' => 1470, 'cur' => nil, 'last' => nil }
    fields['puzzle_focus'] = 'weakest'; fields['difficulty'] = 'harder'
  when 'profile_many' then mocks = profile_mocks; login = 'tok'
  when 'profile_new' then mocks = profile_mocks(account: 'profile_account_new.json', history: 'profile_history_new.json', games: 'profile_games_new.ndjson'); login = 'tok'
  when 'profile_fail' then mocks = profile_mocks(status: 503); login = 'tok'
  when 'profile_partial' then mocks = profile_mocks(history_status: 503, games_status: 503); login = 'tok'
  when 'top_live' then mocks = top_mocks; login = 'tok'
  when 'top_tv' then mocks = top_mocks(broadcast: 'top_broadcast_none.json'); login = 'tok'
  when 'top_fail' then mocks = top_mocks(status: 503, tv: false); login = 'tok'
  when 'top_offline'
    mocks = top_mocks(status: 503, tv: false); login = 'tok'
    state = { 'tg' => { 'source' => 'live', 'id' => 'g2LiveAB', 'url' => 'https://lichess.org/study/rN4xYz01/g2LiveAB', 'board' => 'r2qrb2/1b1n1pk1/2pp1n1p/1p2pP2/3P4/2P2N1P/1P1Q1PP1/RBB1R1K1'.gsub('/', '').gsub(/\d/) { |d| '.' * d.to_i },
                'turn' => 'w', 'from' => 12, 'to' => 21, 'rating' => 0, 'themes' => [], 'title' => '', 'plays' => 0, 'moves' => [[20, 'Qd2', 'Qd8'], [21, 'Bb1', 'Nh5']],
                'game' => { 'w' => { 'name' => 'Alvarez, Pedro', 'title' => 'GM', 'rating' => 2712, 'clock' => 276000 }, 'b' => { 'name' => 'Brandt, Jonas', 'title' => 'IM', 'rating' => 2688, 'clock' => 171000 },
                            'event' => 'Example International', 'round' => 'Round 5 · Board 2', 'status' => 'live', 'res' => '', 'arg' => 'Example International' } } }
  when 'follow_playing' then mocks = follow_mocks; login = 'tok'
  when 'follow_last' then mocks = follow_mocks(game: 'follow_game_last.json'); login = 'tok'
  when 'follow_unknown' then mocks = follow_mocks(status: 404, user: 'Nobody_Here'); login = 'tok'
  when 'follow_empty' then mocks = {}; login = 'tok'
  when 'follow_fail' then mocks = follow_mocks(status: 503); login = 'tok'
  when 'games_one' then mocks = games_mocks; login = 'tok'
  when 'games_many' then mocks = games_mocks(playing: 'games_playing_many.json'); login = 'tok'
  when 'games_none' then mocks = games_mocks(playing: 'games_playing_none.json'); login = 'tok'
  when 'games_wait' then mocks = games_mocks(playing: 'games_playing_none.json'); login = 'tok'
  when 'games_last' then mocks = games_mocks(playing: 'games_playing_empty.json'); login = 'tok'
  when 'games_nothing' then mocks = games_mocks(playing: 'games_playing_empty.json', last: false).merge('https://lichess.org/api/games/user/Demo*' => { body: '' }); login = 'tok'
  when 'games_fail' then mocks = games_mocks(status: 503); login = 'tok'
  when 'games_scope' then mocks = games_mocks(status: 403); login = 'tok'
  when 'offline'
    mocks = lichess_mocks.merge('https://lichess.org/api/puzzle/next*' => { status: 503, json: {} }); login = 'tok'   # connected, the puzzle call fails: the saved puzzle stands in
    state = { 'rating' => 1861, 'last' => { 'source' => 'lichess', 'id' => 'u3zfD', 'url' => 'https://lichess.org/training/u3zfD', 'board' => '...k....' + '...b.p..' + '.p.P.p.p' + '....Q...' + '....B...' + '....qP.P' + 'P.p...PK' + '........', 'turn' => 'w', 'from' => 4, 'to' => 3, 'rating' => 1874, 'themes' => ['Mate in 3'], 'title' => '' } }
  end
  fields['orientation'] = c['orientation'] if c['orientation']
  fields['mode'] = 'games' if sc.start_with?('games')
  fields['mode'] = 'profile' if sc.start_with?('profile')
  fields['mode'] = 'top' if sc.start_with?('top')
  if sc.start_with?('follow')
    fields['mode'] = 'following'
    fields['follow_username'] = sc == 'follow_unknown' ? 'Nobody_Here' : sc == 'follow_empty' ? '' : 'KnightOwl'
  end
  dev = c['device'].is_a?(Hash) ? c['device'].transform_keys(&:to_sym) : (c['device'] || 'v2')
  opts = { view: c['view'], device: dev, mocks: mocks, custom_fields: fields, now: NOW.iso8601, wait_for: "document.querySelector('[data-ym-drawn],[data-ym-none]') !== null || document.querySelector('.layout') !== null" }
  opts[:dark_mode] = true if c['dark']
  opts[:palette] = c['palette'] if c['palette']   # e.g. the X's gray-4 or bw palette
  opts[:state] = state if state
  opts[:orientation] = c['portrait'] ? :portrait : :landscape
  Thread.current[:ym_oauth] = login
  s = trmnl.render(**opts)
  Thread.current[:ym_oauth] = nil
  s
end
# View checks: each a JavaScript expression on the rendered page that must be true; and the type system (owner 2026-11-14):
# the side panel uses at most 4 text sizes (every element that draws text, SVG text included).
def ym_checks(s, c)
  (c['checks'] || {}).each { |what, js| expect(s.evaluate(js)).to be_truthy, "#{c['name']}: #{what}" }
  # The side panel's blocks never overlap (a flex column that shrinks or stretches its cards drew the moves over the rating).
  overlaps = s.evaluate(PANEL_OVERLAP_JS)
  expect(overlaps).to be_empty, "#{c['name']}: panel blocks overlap: #{overlaps.inspect}"
  # a panel with nothing in it is a bug (an empty card once drew a bare grey bar between two panels)
  empty = s.evaluate("Array.prototype.filter.call(document.querySelectorAll('[data-ym-card]'),function(e){return e.getClientRects().length&&!e.textContent.trim()&&!e.querySelector('img,svg')}).map(function(e){return e.getAttribute('data-ym-card')})")
  expect(empty).to be_empty, "#{c['name']}: empty panel(s): #{empty.inspect}"
  # One pattern in every mode: a QR label reads "Scan to solve / play / watch"; a failure screen has one title (owner 2026-11-14, R6).
  bad = s.evaluate("Array.prototype.filter.call(document.querySelectorAll('[data-ym-qrbox]'),function(e){return e.getClientRects().length&&!/^\\s*Scan to (solve|play|watch)\\s*$/.test(e.textContent)}).map(function(e){return e.textContent.trim()})")
  expect(bad).to be_empty, "#{c['name']}: QR label not 'Scan to solve/play/watch': #{bad.inspect}"
  fail_title = s.evaluate("(function(){var p=document.querySelector('[data-ym-calm] [data-ym-problem]');return p?document.querySelector('[data-ym-calm] .title').textContent.trim():''})()")
  expect(fail_title).to satisfy { |t| t.empty? || t == 'Lichess did not answer' }, "#{c['name']}: failure screen title is #{fail_title.inspect}"
  # One title bar rule for every mode and state: the view's own title bar only in the full view (the platform draws none in the others).
  tb = s.evaluate("!!document.querySelector('.title_bar')")
  expect(tb).to eq(c['view'] == 'full'), "#{c['name']}: title bar #{tb ? 'drawn' : 'missing'} in view #{c['view']}"
  sizes = s.evaluate(FONT_SIZES_JS)
  expect(sizes.length).to be <= 4, "#{c['name']}: #{sizes.length} text sizes in the panel: #{sizes.inspect}"
end

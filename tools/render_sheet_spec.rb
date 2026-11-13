# frozen_string_literal: true
# Renders PNGs for the review sheet. YM_CASES: JSON list of {name, view, device, dark, scenario}; YM_OUT: folder.
# Scenarios: account (Lichess login, rising rating), daily (no login), chesscom, banner (the shown puzzle was solved), offline.
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
def lichess_mocks(rating: 1873, solved: nil)
  acts = activity(3, 4)
  acts = ({ date: NOW.to_i * 1000, win: true, puzzle: { id: solved, rating: 1800 } }.to_json + "\n" + acts) if solved
  { 'https://lichess.org/api/account' => { json: { username: 'Demo', perfs: { puzzle: { rating: rating, games: 400 } } } },
    'https://lichess.org/api/puzzle/activity*' => { body: acts },
    'https://lichess.org/api/user/Demo/rating-history' => { json: HIST },
    'https://lichess.org/api/puzzle/next*' => { json: JSON.parse(fx('lichess_daily.json')) } }
end
RSpec.describe 'renders' do
  JSON.parse(ENV.fetch('YM_CASES')).each do |c|
    it c['name'] do
      sc = c['scenario'] || 'daily'
      mocks = { 'https://lichess.org/api/puzzle/daily' => { json: JSON.parse(fx('lichess_daily.json')) },
                'https://api.chess.com/pub/puzzle' => { json: JSON.parse(fx('chesscom_daily.json')) },
                'https://api.chess.com/pub/player/*' => { json: { tactics: { highest: { rating: 1456 } } } } }
      fields = { 'source' => 'lichess' }
      state = nil
      case sc
      when 'account' then mocks = lichess_mocks.merge(mocks); fields['lichess_token'] = 'tok'; state = { 'rating' => 1861, 'cur' => { 'id' => 'u3zfD', 't' => NOW.to_i - 100, 'r0' => 1861 },
        'last' => nil }
      when 'chesscom' then fields = { 'source' => 'chesscom', 'chesscom_user' => 'demo' }
      when 'banner'
        mocks = lichess_mocks(rating: 1873, solved: 'old1').merge(mocks); fields['lichess_token'] = 'tok'
        state = { 'rating' => 1861, 'cur' => { 'id' => 'old1', 't' => NOW.to_i - 7200, 'r0' => 1861 }, 'last' => { 'id' => 'old1' } }
      when 'offline'
        mocks = { 'https://lichess.org/api/puzzle/daily' => { status: 503, json: {} } }
        state = { 'rating' => 0, 'last' => { 'source' => 'lichess', 'id' => 'u3zfD', 'url' => 'https://lichess.org/training/u3zfD', 'board' => '...k....' + '...b.p..' + '.p.P.p.p' + '....Q...' + '....B...' + '....qP.P' + 'P.p...PK' + '........', 'turn' => 'w', 'from' => 4, 'to' => 3, 'rating' => 1874, 'themes' => ['Mate in 3'], 'title' => '' } }
      end
      fields['orientation'] = c['orientation'] if c['orientation']
      dev = c['device'].is_a?(Hash) ? c['device'].transform_keys(&:to_sym) : (c['device'] || 'v2')
      opts = { view: c['view'], device: dev, mocks: mocks, custom_fields: fields, now: NOW.iso8601, wait_for: "document.querySelector('[data-ym-drawn],[data-ym-none]') !== null || document.querySelector('.layout') !== null" }
      opts[:dark_mode] = true if c['dark']
      opts[:state] = state if state
      opts[:orientation] = c['portrait'] ? :portrait : :landscape
      s = trmnl.render(**opts)
      FileUtils.mkdir_p(ENV.fetch('YM_OUT'))
      FileUtils.cp(s.png_path, File.join(ENV.fetch('YM_OUT'), "#{c['name']}.png"))
    end
  end
end

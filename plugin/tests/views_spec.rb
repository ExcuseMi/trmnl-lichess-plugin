# frozen_string_literal: true
# The rendered views (trmnlp test): parts per view and device, move order, last move, title bar mode, connect screen,
# board size, at most 4 text sizes (view_checks.json); no overflow and no page errors in every view on OG and X.
require_relative 'support/ym'
RSpec.describe 'Lichess views' do
  JSON.parse(File.read(File.join(__dir__, 'view_checks.json'))).each do |c|
    it(c['name']) { ym_checks(ym_render(trmnl, c), c) }
  end
  %w[full half_horizontal half_vertical quadrant].product(%w[og_png v2], [false, true]).each do |view, device, dark|
    next if dark && device == 'og_png'

    it "no overflow and no page errors: #{view} on #{device}#{' dark' if dark}" do
      c = { 'name' => "#{view}-#{device}", 'view' => view, 'device' => device, 'dark' => dark, 'scenario' => 'owner' }
      s = ym_render(trmnl, c)
      # Highcharts' own container measures its inline SVG with a few px of baseline room; the chart box (#ym-spark) is still checked.
      expect(s).to have_no_overflow(except: '.highcharts-container')
      expect(s).to have_no_problems
      ym_checks(s, c)
    end
  end
  # The live modes in every view on OG and X: no overflow, no page errors, at most 4 text sizes.
  %w[top_live follow_playing].product(%w[full half_horizontal half_vertical quadrant], %w[og_png v2]).each do |sc, view, device|
    it "no overflow and no page errors: #{sc} #{view} on #{device}" do
      c = { 'name' => "#{sc}-#{view}-#{device}", 'view' => view, 'device' => device, 'scenario' => sc }
      s = ym_render(trmnl, c)
      expect(s).to have_no_overflow
      expect(s).to have_no_problems
      ym_checks(s, c)
    end
  end
  # The OG in 2 bits (og_plus), landscape and portrait: text at least 20 px, the portrait board across the top, the Profile header without
# overlap, failure lines inside their panel (all in ym_checks), and the half views and states (L2, owner 2026-11-15).
  %w[owner games_one games_wait games_last profile_many profile_new profile_partial profile_fail top_live top_offline top_fail follow_playing games_fail games_nothing daily].product([false, true]).each do |sc, portrait|
    it "OG 2-bit #{portrait ? 'portrait' : 'landscape'}: #{sc}" do
      c = { 'name' => "#{sc}-og_plus#{'-portrait' if portrait}", 'view' => 'full', 'device' => 'og_plus', 'palette' => 'gray-4', 'portrait' => portrait, 'scenario' => sc }
      s = ym_render(trmnl, c)
      expect(s).to have_no_overflow(except: '.highcharts-container')
      expect(s).to have_no_problems
      ym_checks(s, c)
    end
  end
  %w[owner games_one top_live profile_many].product(%w[half_horizontal half_vertical quadrant]).each do |sc, view|
    it "OG 2-bit #{view}: #{sc}" do
      c = { 'name' => "#{sc}-og_plus-#{view}", 'view' => view, 'device' => 'og_plus', 'palette' => 'gray-4', 'scenario' => sc }
      s = ym_render(trmnl, c)
      expect(s).to have_no_overflow(except: '.highcharts-container')
      ym_checks(s, c)
    end
  end
end

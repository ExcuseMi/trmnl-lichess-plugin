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
end

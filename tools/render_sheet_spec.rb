# frozen_string_literal: true
# Renders PNGs for the review sheet. YM_CASES: JSON list of cases (plugin/tests/support/ym.rb); YM_OUT: folder.
require 'fileutils'
require_relative '../plugin/tests/support/ym'
RSpec.describe 'renders' do
  JSON.parse(ENV.fetch('YM_CASES')).each do |c|
    it c['name'] do
      s = ym_render(trmnl, c)
      FileUtils.mkdir_p(ENV.fetch('YM_OUT'))
      FileUtils.cp(s.png_path, File.join(ENV.fetch('YM_OUT'), "#{c['name']}.png"))
      ym_checks(s, c)
    end
  end
end

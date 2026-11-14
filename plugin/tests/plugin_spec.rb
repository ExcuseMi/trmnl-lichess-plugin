# frozen_string_literal: true
# Without a Lichess login every view is the connect screen; the shared example draws all four views on og_png, og_plus,
# v2 and v2 portrait with no overflow and no page errors, and runs the transform inside TRMNL's limits.
RSpec.describe 'Lichess' do
  let(:mocks) { {} }
  let(:custom_fields) { {} }

  it_behaves_like 'a publishable recipe'
end

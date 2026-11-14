#!/bin/bash
# Overview sheets of renders/design/r6: every mode state side by side (OG, X per state), one sheet per view size.
set -e
cd "$(dirname "$0")/.."
R=renders/design/r6
SC="account focus games_one games_wait games_last games_nothing profile_many profile_new top_live top_tv follow_playing follow_last follow_empty follow_unknown daily games_fail profile_fail top_fail follow_fail offline"
for pair in full:full half_horizontal:hh half_vertical:hv quadrant:q; do
  v=${pair%%:*}; s=${pair##*:}; files=(); 
  for sc in $SC; do for t in og x; do files+=(-label "$sc $t" "$R/${sc}__${v}__${t}.png"); done; done
  case $v in full) g=700x525;; half_horizontal) g=700x262;; half_vertical) g=350x525;; quadrant) g=350x262;; esac
  montage "${files[@]}" -tile 4x -geometry ${g}+6+6 -pointsize 14 -background '#bbbbbb' renders/design-r6-$s.png
  echo renders/design-r6-$s.png
done

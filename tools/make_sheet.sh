#!/bin/bash
# Review sheet from renders/raw (tools/render_sheet_spec.rb) and assets/icon*.svg -> renders/sheet.png (+ sheet-nologin.png, sheet-icon.png).
set -e
cd "$(dirname "$0")/.."
R=renders/raw
for sc in account daily; do
  files=()
  for v in full half_horizontal half_vertical quadrant; do for t in og x xdark; do files+=("$R/${sc}__${v}__${t}.png"); done; done
  out=renders/sheet-$sc.png
  montage "${files[@]}" -tile 3x4 -geometry 760x570+12+12 -background '#bbbbbb' -label '' "$out"
done
cp renders/sheet-account.png renders/sheet.png
montage renders/raw/chesscom__full__og.png renders/raw/chesscom__full__x.png renders/raw/banner__full__og.png renders/raw/banner__full__x.png renders/raw/offline__full__og.png renders/raw/offline__full__x.png -tile 2x3 -geometry 760x570+12+12 -background '#bbbbbb' renders/sheet-states.png
C=${CHROME:-$HOME/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome}
cat > /tmp/ym-icon.html <<H
<html><body style="margin:0;background:#fff;display:flex;gap:24px;align-items:flex-end;padding:12px">
<img src="file://$PWD/assets/icon.svg" width="512"><div><img src="file://$PWD/assets/icon.svg" width="64"><br><img src="file://$PWD/assets/icon.svg" width="32"><br><br><img src="file://$PWD/assets/icon-mono.svg" width="64"><br><img src="file://$PWD/assets/icon-mono.svg" width="32"></div></body></html>
H
$C --headless --disable-gpu --no-sandbox --window-size=700,560 --screenshot=renders/sheet-icon.png --hide-scrollbars file:///tmp/ym-icon.html >/dev/null 2>&1
echo renders/sheet.png

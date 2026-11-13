# QR check on real renders: each PNG from tools/render_sheet_spec.rb must decode (OpenCV, venv .venv) to exactly the shown puzzle's URL.
# Usage: .venv/bin/python test/qr_png.py renders/raw   (names: <scenario>__<view>__<device>.png)
import glob, sys, cv2
want = {'account': 'https://lichess.org/training/u3zfD', 'daily': 'https://lichess.org/training/u3zfD', 'banner': 'https://lichess.org/training/u3zfD',
        'offline': 'https://lichess.org/training/u3zfD', 'chesscom': 'https://www.chess.com/daily/2026-11-13'}
bad = n = 0
for f in sorted(glob.glob(sys.argv[1] + '/*.png')):
    sc, view, dev = f.rsplit('/', 1)[1][:-4].split('__')
    if view == 'quadrant' or (dev == 'og' and view.startswith('half')): continue   # no QR there by design: under 4 px per module a 1-bit panel can not read it
    img = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
    img = cv2.resize(img, None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST)   # a camera sees the panel at far more than 1 px per pixel; OpenCV's detector needs that on the 1-bit OG renders
    got = cv2.QRCodeDetector().detectAndDecode(img)[0]
    ok = got == want[sc]; n += 1; bad += not ok
    print('OK ' if ok else 'BAD', f.rsplit('/', 1)[1], repr(got) if not ok else '')
print(n - bad, 'of', n, 'decode'); sys.exit(1 if bad else 0)

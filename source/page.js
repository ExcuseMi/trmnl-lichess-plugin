// Page script: reads YM (the transform's answer), lays out board and side panel for the view and the screen, draws both.
(function () {
  var root = document.querySelector('[data-ym]');
  if (!root) return;
  var sc = document.querySelector('.screen'), has = function (c) { return !!(sc && sc.classList.contains(c)); };
  var bits = has('screen--1bit') ? 1 : has('screen--2bit') ? 2 : 4, lg = has('screen--lg');
  var P = YM.puzzle, A = YM.account, T = YM.t, view = YM.view, C = YM.caps || {};
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function rect() { var r = root.getBoundingClientRect(), cs = window.getComputedStyle(root), pl = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) || 0, pt = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) || 0; return { w: Math.floor(r.width - pl), h: Math.floor(r.height - pt) }; }
  var R = rect(), W = R.w, H = R.h, gap = Math.round(Math.min(W, H) * 0.035);
  var row = W >= H * 1.15, small = view === 4 || (view === 2 && H < 300);
  var wide = view === 1 || view === 2;
  var q = YM.qrOk;   // QR drawn?
  // ---- sizes
  var Sw, S, Q = 0;
  if (row) {
    Sw = Math.round(W * (view === 1 ? 0.4 : view === 2 ? 0.4 : 0.44));
    S = Math.min(H, W - Sw - gap);
    Sw = W - S - gap;
  } else {
    S = Math.min(W, Math.round(H * (view === 3 ? 0.68 : 0.7)));
    Sw = W;
  }
  var bw = row ? Sw : Sw, ph = row ? H : H - S - gap;
  // ---- panel pieces
  function dot(white, r) { return '<svg class="block shrink-0" width="' + r * 2 + '" height="' + r * 2 + '" viewBox="0 0 ' + r * 2 + ' ' + r * 2 + '"><circle cx="' + r + '" cy="' + r + '" r="' + (r - 1.2) + '" fill="' + (white ? '#fff' : '#000') + '" stroke="#000" stroke-width="2"/></svg>'; }
  function arrow(up, s) { return '<svg class="block shrink-0" width="' + s + '" height="' + s + '" viewBox="0 0 10 10"><path d="' + (up ? 'M5 1L9.2 8.5H0.8z' : 'M5 9L9.2 1.5H0.8z') + '" fill="#000"/></svg>'; }
  function spark(vals, w, h) {
    if (!vals || vals.length < 2) return '';
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), n = vals.length, pad = 5, pts = [], span = Math.max(1, hi - lo);
    vals.forEach(function (v, i) { pts.push([pad + (w - 2 * pad) * i / (n - 1), pad + (h - 2 * pad) * (1 - (v - lo) / span)]); });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    var last = pts[n - 1];
    var area = d + 'L' + last[0].toFixed(1) + ' ' + (h - 1) + 'L' + pts[0][0].toFixed(1) + ' ' + (h - 1) + 'z';
    return '<svg class="block" data-ym-part="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><path d="' + area + '" fill="' + (bits === 1 ? 'none' : '#cfcfcf') + '"/><path d="M0 ' + (h - 0.5) + 'H' + w + '" stroke="#000" stroke-width="1.4"/><path d="' + d + '" fill="none" stroke="#000" stroke-width="' + Math.max(2.2, h / 18).toFixed(1) + '" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="' + Math.max(3.5, h / 12).toFixed(1) + '" fill="#000"/></svg>';
  }
  function bars(days, w, h) {
    var mx = Math.max(3, Math.max.apply(null, days.map(function (d) { return d.s + d.f; }))), bwid = w / 7, out = '';
    days.forEach(function (d, i) {
      var x = i * bwid + bwid * 0.16, bwd = bwid * 0.68, hs = (h - 4) * d.s / mx, hf = (h - 4) * d.f / mx, today = i === 6;
      if (d.s + d.f === 0) out += '<rect x="' + x.toFixed(1) + '" y="' + (h - 3) + '" width="' + bwd.toFixed(1) + '" height="2" fill="#000"/>';
      out += '<rect x="' + x.toFixed(1) + '" y="' + (h - 2 - hs).toFixed(1) + '" width="' + bwd.toFixed(1) + '" height="' + hs.toFixed(1) + '" fill="#000"/>';
      if (d.f) out += '<rect x="' + (x + 1).toFixed(1) + '" y="' + (h - 2 - hs - hf + 1).toFixed(1) + '" width="' + (bwd - 2).toFixed(1) + '" height="' + Math.max(1, hf - 2).toFixed(1) + '" fill="#fff" stroke="#000" stroke-width="2"/>';
      if (today) out += '<rect x="' + (x - 1).toFixed(1) + '" y="' + (h - 1) + '" width="' + (bwd + 2).toFixed(1) + '" height="1.5" fill="#000"/>';
    });
    return '<svg class="block" data-ym-part="bars" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + out + '</svg>';
  }
  var tx = lg ? 'lg:' : '';
  function head() {
    var src = P.source === 'chesscom' ? 'CHESS.COM' : 'LICHESS', bits2 = [src];
    if (P.rating) bits2.push(T.rating + ' ' + P.rating);
    if (P.themes && P.themes.length) bits2.push(P.themes[0]);
    else if (P.title) bits2.push(P.title);
    var r = Math.round(Math.max(9, Math.min(W, H) * (lg ? 0.025 : 0.034)));
    return '<div class="flex flex--col gap--xsmall"><div class="flex flex--row flex--center-y gap--small">' + dot(P.turn === 'w', r) + '<span class="title title--small lg:title--medium">' + esc(YM.to_move) + '</span></div>' +
      (small ? '' : '<span class="label label--small lg:label--medium">' + esc(bits2.join('  |  ')) + '</span>') + '</div>';
  }
  function reward(innerW) {
    var big = '<span class="value value--xlarge lg:value--xxxlarge">' + A.rating + '</span>';
    var chg = '';
    if (A.trend && A.trend !== 'flat') chg = '<span class="flex flex--row flex--center-y gap--xsmall">' + arrow(A.trend === 'up', Math.round(Math.max(14, innerW * 0.07))) + '<span class="value value--small lg:value--medium">' + (A.delta > 0 ? '+' : '') + A.delta + '</span></span>';
    return '<div data-ym-part="rating" class="flex flex--col gap--xsmall"><span class="label label--small">' + esc(A.label === 'tactics' ? T.tactics : T.rating_you) + '</span><div class="flex flex--row flex--center-y gap--small">' + big + chg + '</div></div>';
  }
  function stats() {
    if (!A) return '';
    if (A.label === 'tactics') return A.rush ? '<span data-ym-part="stats" class="label label--small lg:label--medium">' + esc(T.rush + ' ' + A.rush) + '</span>' : '';
    if (!C.solved && !C.streak) return '';
    return '<span data-ym-part="stats" class="label label--small lg:label--medium">' + (C.solved ? A.today + ' ' + T.today + '  |  ' + A.week + ' ' + T.week : '') + (C.solved && C.streak ? '  |  ' : '') + (C.streak ? T.streak + ' ' + A.streak : '') + '</span>';
  }
  var parts = [], qrW = 0;
  var svgQr = document.querySelector('[data-ym-qr] svg');
  var haveQr = !!svgQr && !small;
  if (haveQr) {
    qrW = row ? Math.round(Math.min(Sw * 0.4, H * 0.36)) : Math.round(Math.min(ph * 0.8, W * 0.3));
    if (view === 2 && row) qrW = Math.round(Math.min(Sw * 0.45, H * 0.8));
    if (view === 3) qrW = Math.round(Math.min(ph * 0.75, W * 0.34));
    if (qrW < 80) haveQr = false;
  }
  var sideHtml = '';
  var innerW = row ? Sw : W - (haveQr ? qrW + gap : 0);
  var top = head();
  var mid = '';
  if (YM.banner) mid += '<div class="inverse rounded p--2"><span class="title title--small lg:title--medium">' + esc(YM.banner) + '</span></div>';
  if (A) mid += reward(innerW);
  else if (!small && P.source === 'lichess' && !C.personal) mid += '<span data-ym-part="hint" class="description description--small">' + esc(T.connect) + '</span>';
  var extras = '';
  var chartH = Math.max(34, Math.round(Math.min(H * 0.1, innerW * 0.16)));
  if (A && !small && (view === 1 || (view === 3 && H > 440))) {
    if (C.history) extras += spark(A.history, Math.round(innerW), chartH);
    extras += stats();
    if (C.solved && A.days) extras += bars(A.days, Math.round(innerW), chartH);
  } else if (A && view === 2 && !small) { extras += stats(); }
  var qrBox = '';
  if (haveQr) {
    if (!svgQr.getAttribute('viewBox')) svgQr.setAttribute('viewBox', '0 0 ' + (svgQr.getAttribute('width') || qrW) + ' ' + (svgQr.getAttribute('height') || qrW));
    svgQr.setAttribute('width', qrW); svgQr.setAttribute('height', qrW);
    svgQr.classList.add('block');
    qrBox = '<div class="flex flex--col flex--center-x gap--xsmall shrink-0" data-ym-qrbox></div>';
  }
  var notice = (YM.notice || YM.stale) ? '<span class="label label--small">' + esc(YM.notice || T.offline) + '</span>' : '';
  var left = '<div class="flex flex--col gap--small">' + top + mid + extras + notice + '</div>';
  var side = document.querySelector('[data-ym-side]'), bd = document.querySelector('[data-ym-board]');
  if (haveQr && row && view === 1) {
    side.innerHTML = '<div class="flex flex--col gap--medium">' + top + notice + '<div class="flex flex--row flex--bottom gap--medium"><div class="flex flex--col gap--small grow">' + mid + '</div>' + qrBox + '</div>' + extras + '</div>';
  } else if (haveQr) {
    side.innerHTML = '<div class="flex flex--' + (row ? 'row' : 'row') + ' flex--center-y gap--medium"><div class="flex flex--col gap--small">' + top + mid + extras + notice + '</div>' + qrBox + '</div>';
  } else {
    side.innerHTML = left;
  }
  var qb = side.querySelector('[data-ym-qrbox]');
  if (qb) { qb.appendChild(svgQr); var cap = document.createElement('span'); cap.className = 'label label--small'; cap.textContent = T.scan; qb.appendChild(cap); }
  // ---- board
  var font = window.getComputedStyle(document.body).fontFamily || 'sans-serif';
  bd.innerHTML = boardSvg({ size: S, board: P.board, flip: !YM.white_bottom, from: P.from, to: P.to, coords: YM.coords && S > 150, bits: bits, font: font.replace(/"/g, "'") });
  root.classList.add(row ? 'layout--row' : 'layout--col');
  root.setAttribute('data-ym-drawn', '1');
})();

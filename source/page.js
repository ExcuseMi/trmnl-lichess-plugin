// Page script: draws the chessboard into [data-ym-board] (the one part allowed its own SVG). Everything else on the screen is
// Framework markup in shared.liquid. Runs once the Framework runtime is there: TRMNLPaint gives the board's colours.
(function () {
  if (!window.TRMNLPaint && document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', main); return; }
  main();
  // Profile chart: a calm y range of at least 100 rating points around the data, three light gridlines with their numbers.
  function profileY(h) {
    var lo = Math.min.apply(null, h), hi = Math.max.apply(null, h), span = Math.max(100, Math.ceil((hi - lo) * 1.4 / 10) * 10), mid = (lo + hi) / 2, min = Math.floor((mid - span / 2) / 10) * 10, max = min + span;
    return { visible: true, min: min, max: max, tickPositions: [min, min + span / 2, max], title: { text: null }, gridLineWidth: window.TRMNLPaint.px(1, { el: YM.chart }), endOnTick: false, startOnTick: false };
  }
  // The rating history as a Framework chart (TRMNLCharts over Highcharts), only where its container shows (lg full view).
  function spark() {
    var id = YM.chart || 'ym-spark', el = document.getElementById(id), h = YM.history || [];
    if (!el || h.length < 2 || !window.Highcharts || !window.TRMNLCharts || !el.offsetParent) return;
    window.TRMNLCharts.watch(id, function () {
      return window.Highcharts.chart(id, window.TRMNLCharts.merge(window.TRMNLCharts.options({ el: id }), {
        chart: { type: 'line', height: el.clientHeight - 6, spacing: [10, 10, 10, 10] },   // room for the last point's marker inside the container
        xAxis: YM.profile ? { visible: true, labels: { enabled: false }, tickLength: 0, gridLineWidth: 0, lineWidth: window.TRMNLPaint.px(1, { el: id }) } : { visible: false },
        yAxis: YM.profile ? profileY(h) : { visible: false }, legend: { enabled: false }, tooltip: { enabled: false }, accessibility: { enabled: false }, credits: { enabled: false },
        plotOptions: { series: { animation: false, enableMouseTracking: false, lineWidth: window.TRMNLPaint.px(3, { el: id }), marker: { enabled: false } } },
        series: [{ data: h.map(function (v, i) { return i === h.length - 1 ? { y: v, marker: { enabled: true, radius: window.TRMNLPaint.px(4, { el: id }) } } : v; }), color: window.TRMNLCharts.series(0, 1, { el: id }) }]
      }));
    });
  }
  // The move list takes the height that is left: while the panel stack is taller than the board, its oldest row gets the
  // Framework's hidden class; with fewer than 2 rows left the list goes and the rating and QR row takes the height.
  function fitMoves() {
    var panel = document.querySelector('[data-ym-panel]'), card = document.querySelector('[data-ym-card="moves"]');
    if (!panel || !card) return;
    var root = document.querySelector('[data-ym]'), rows = card.querySelectorAll('tr'), i = 0, tb = card.querySelector('table'), cs = window.getComputedStyle(card),
      over = function () { return panel.scrollHeight > panel.clientHeight + 1 || root.scrollHeight > root.clientHeight + 1 || tb.getBoundingClientRect().bottom > card.getBoundingClientRect().bottom - (parseFloat(cs.paddingBottom) || 0) + 1; };
    while (over() && i < rows.length - 2) hide(rows[i++]);
    if (over()) hide(card);
  }
  // Still too tall (a half or quadrant view): the optional parts give way in this order, with the Framework's hidden class.
  // The Framework's hidden class, minus any size-prefixed display class (lg:flex, lg:visible) that would show it again.
  function hide(n) { n.setAttribute('class', (n.getAttribute('class') || '').replace(/(^|\s)(sm|md|lg):(flex|visible|block|grid|table-row|inline-block)(?=\s|$)/g, ' ') + ' hidden'); }
  // A text that needs more than one line (not a deliberate <br> list, not the move table).
  function wraps(n) {
    if (!n.getClientRects().length || n.hasAttribute('data-ym-wrap') || n.querySelector('br') || n.closest('[data-ym-part="moves"]')) return false;
    var cs = window.getComputedStyle(n), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
    return n.offsetHeight > lh * 1.6;
  }
  function quadrantFit() {
    var opt = '[data-ym-opp], [data-ym-part="more"], [data-ym-meta]', n;
    for (var w = 0; w < 60; w++) {
      n = Array.prototype.filter.call(document.querySelectorAll('[data-ym-panel] .label, [data-ym-panel] .value'), wraps);
      if (!n.length) return;
      var o = n.filter(function (x) { return x.closest(opt); })[0];
      if (o) hide(o.closest(opt));
      else {
        var v = Array.prototype.filter.call(document.querySelectorAll(opt), function (x) { return x.getClientRects().length; })[0];
        if (v) hide(v);   // optional lines go before the board gives up any height
        else if (S > H * 0.9) draw(S -= 1);
        else return;
      }
    }
  }
  function anyWrap() { return Array.prototype.some.call(document.querySelectorAll('[data-ym-panel] .label, [data-ym-panel] .value'), wraps); }
  function fitParts() {
    var panel = document.querySelector('[data-ym-panel]');
    if (!panel) return;
    var root = document.querySelector('[data-ym]'), over = function () {
      if (panel.scrollHeight > panel.clientHeight + 1 || root.scrollHeight > root.clientHeight + 1 || root.scrollWidth > root.clientWidth + 1) return true;
      return Array.prototype.some.call(panel.querySelectorAll('[data-ym-card]'), function (c) { return c.getClientRects().length && c.scrollHeight > c.clientHeight + 1; });
    };
    // An optional label that wraps (a long theme) goes before it makes the panel taller.
    Array.prototype.forEach.call(panel.querySelectorAll('[data-ym-meta]'), function (n) { if (wraps(n)) hide(n); });
    ['[data-ym-part="spark"]', '[data-ym-part="bars"]', '[data-ym-part="recent"]', '[data-ym-meta]', '[data-ym-game]'].forEach(function (sel) {
      var n = panel.querySelector(sel);
      if (n && over()) hide(n);
    });
  }
  // Profile (no board): what does not fit goes, in this order: the chart (its box under 64 px), the ratings header, the least played
  // ratings, the last stats. Whatever is left fills its column: the card that gave way to the chart (lg:grow-0) grows again.
  function profileMain() {
    var root = document.querySelector('[data-ym]');
    if (!root) return;
    var q = function (sel) { return Array.prototype.filter.call(document.querySelectorAll(sel), function (n) { return n.getClientRects().length; }); };
    var over = function () {
      if (root.scrollHeight > root.clientHeight + 1 || root.scrollWidth > root.clientWidth + 1) return true;
      return q('[data-ym-col]').some(function (c) { return c.scrollHeight > c.clientHeight + 1; }) || q('[data-ym-card]').some(function (c) { return c.scrollHeight > c.clientHeight + 1; }) || q('[data-ym-panel] .label, [data-ym-panel] .value').some(wraps);
    };
    var fit = function () {
      var el = document.querySelector('[data-ym-part="spark"]'), ch = document.querySelector('[data-ym-part="chart"]');
      var rc = document.querySelector('[data-ym-card="ratings"]');
      // Chart and ratings in one column (half vertical): the least played ratings (down to 4) give way before the chart does.
      if (ch && el && rc && ch.parentNode === rc.parentNode && ch.getClientRects().length) { var rr = q('[data-ym-row]'); while (el.clientHeight < 90 && rr.length > 4) hide(rr.pop()); }
      if (ch && ch.getClientRects().length && (!el || el.clientHeight < 64 || el.clientWidth < 120)) {
        hide(ch); if (ch.closest('[data-ym-part="chartcol"]')) hide(ch.closest('[data-ym-part="chartcol"]'));
        // the chart's column keeps only the form: it takes the height the chart gave up
        q('[data-ym-card="form"]').forEach(function (f) { if (f.parentNode === ch.parentNode) f.setAttribute('class', f.getAttribute('class').replace('shrink-0', 'grow')); });
        Array.prototype.forEach.call(document.querySelectorAll('[class*="lg:grow-0"]'), function (n) { n.setAttribute('class', n.getAttribute('class').replace(' lg:grow-0', '')); });
      }
      var hd = q('[data-ym-part="rhead"]')[0], rows, stats;
      if (over() && hd) hide(hd);
      rows = q('[data-ym-row]'); stats = q('[data-ym-stat]');
      // Ratings are the main thing: rows and stats lines give way by turns, the last stats lines and rows last.
      while (over() && rows.length > 3) hide(rows.pop());
      while (over() && stats.length > 3) hide(stats.pop());
      while (over() && rows.length > 1) hide(rows.pop());
      while (over() && stats.length > 2) hide(stats.pop());
    };
    var settle = function () { fit(); spark(); root.setAttribute('data-ym-drawn', '1'); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle, settle); else settle();
  }
  function main() {
    if (YM.profile) return profileMain();
    var root = document.querySelector('[data-ym]'), bd = document.querySelector('[data-ym-board]');
    if (!root || !bd || !YM.puzzle) return;
    var sc = document.querySelector('.screen'), has = function (c) { return !!(sc && sc.classList.contains(c)); };
    var dark = has('screen--dark-mode') || !!document.querySelector('.screen--dark-mode, .dark-mode');
    var bits = has('screen--1bit') ? 1 : has('screen--2bit') ? 2 : 4, lg = has('screen--lg'), view = YM.view;
    var r = root.getBoundingClientRect(), cs = window.getComputedStyle(root);
    var W = Math.floor(r.width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0));
    var H = Math.floor(r.height - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0));
    // The board's share; the panel (a Framework flex column, grow) takes the rest.
    // The board takes the full content height when the panel keeps its minimum width (as in c828281); the panel takes the rest.
    var gap = parseFloat(cs.columnGap || cs.gap) || 0, minPanel = Math.round(W * (view === 1 ? (lg ? 0.28 : 0.3) : view === 2 ? 0.45 : view === 4 ? 0.1 : 0.4));
    var S = view === 3 ? Math.min(W, Math.round(H * 0.62)) : Math.min(H, W - minPanel - gap);
    var lab = document.querySelector('[data-ym-panel] .label'), font = (lab && window.getComputedStyle(lab).fontFamily) || 'sans-serif';
    var P = YM.puzzle;
    var draw = function (s) { bd.innerHTML = boardSvg({ size: s, board: P.board, flip: !YM.white_bottom, from: P.from, to: P.to, coords: YM.coords && s > 150, bits: bits, dark: dark, font: font.replace(/"/g, "'") }); };
    draw(S);
    // Once the web fonts are in, if the panel's content needs more room than its share (the row overflows), the board
    // gives way by that much; then the page counts as drawn.
    var settle = function () {
      // Quadrant: the board takes the full height first; a text that would wrap in the narrow panel is dropped if it is optional
      // (sub line, "+N waiting", name), and only a required one gives the board a step back.
      if (view === 4) quadrantFit();
      for (var k = 0, s = S; k < 3; k++) {
        var over = view === 3 ? root.scrollHeight - root.clientHeight : root.scrollWidth - root.clientWidth;
        if (over <= 0) break;
        draw(s -= over); (window.Highcharts && window.Highcharts.charts || []).forEach(function (c) { if (c) c.reflow(); });
      }
      fitMoves();
      fitParts();
      spark();   // after the board settled: the chart takes the card's final width
      root.setAttribute('data-ym-drawn', '1');
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle, settle); else settle();
  }
})();

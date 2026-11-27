// Page script: draws the chessboard into [data-ym-board] (the one part allowed its own SVG). Everything else on the screen is
// Framework markup in shared.liquid. Runs once the Framework runtime is there: TRMNLPaint gives the board's colours.
(function () {
  // OG-sized text (owner 2026-11-15: unreadable across a room): on a screen that is not the large one (the X), every Framework label is a
  // 20 px value and the connect subtitle a 26 px one. The X keeps its labels as they are.
  function ogText() {
    if (document.querySelector('.screen--lg')) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-ym] .label, [data-ym] .description'), function (n) {
      var c = n.classList;
      if (c.contains('h--[10px]')) return;   // the week bar is not text
      if (c.contains('description')) { c.remove('description'); c.add('value', 'value--small'); } else { c.remove('label'); c.add('value', 'value--xsmall'); }
    });
  }
  if (!window.TRMNLPaint && document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', main); return; }
  main();
  // Profile charts: a calm y range of at least 100 rating points around the data. The hero gets three light gridlines (no numbers),
  // a card trend only its line.
  function profileY(h, id, grid) {
    var lo = Math.min.apply(null, h), hi = Math.max.apply(null, h), span = Math.max(100, Math.ceil((hi - lo) * 1.4 / 10) * 10), mid = (lo + hi) / 2, min = Math.floor((mid - span / 2) / 10) * 10, max = min + span;
    return { visible: grid, min: min, max: max, tickPositions: [min, min + span / 2, max], labels: { enabled: false }, title: { text: null }, gridLineWidth: grid ? window.TRMNLPaint.px(1, { el: id }) : 0, endOnTick: false, startOnTick: false };
  }
  // A rating line as a Framework chart (TRMNLCharts over Highcharts), only where its container shows. The puzzle view's chart (YM.chart,
  // YM.history) or a Profile chart (one of YM.sparks: the hero or a card trend).
  function spark(id, h, kind) {
    id = id || YM.chart || 'ym-spark'; h = h || YM.history || [];
    var el = document.getElementById(id), small = kind === 'trend';
    if (!el || h.length < 2 || !window.Highcharts || !window.TRMNLCharts || !el.offsetParent) return;
    window.TRMNLCharts.watch(id, function () {
      var px = function (n) { return window.TRMNLPaint.px(n, { el: id }); }, pad = small ? 4 : 10;
      return window.Highcharts.chart(id, window.TRMNLCharts.merge(window.TRMNLCharts.options({ el: id }), {
        chart: { type: 'line', height: el.clientHeight - (small ? 2 : 6), spacing: [pad, pad, pad, pad] },   // room for the last point's marker inside the container
        xAxis: kind ? { visible: !small, labels: { enabled: false }, tickLength: 0, gridLineWidth: 0, lineWidth: small ? 0 : px(1) } : { visible: false },
        yAxis: kind ? profileY(h, id, !small) : { visible: false }, legend: { enabled: false }, tooltip: { enabled: false }, accessibility: { enabled: false }, credits: { enabled: false },
        plotOptions: { series: { animation: false, enableMouseTracking: false, lineWidth: px(small ? 2 : 3), marker: { enabled: false } } },
        series: [{ data: h.map(function (v, i) { return i === h.length - 1 ? { y: v, marker: { enabled: true, radius: px(small ? 3 : 4) } } : v; }), color: window.TRMNLCharts.series(0, 1, { el: id }) }]
      }));
    });
  }
  // The move list takes the height that is left: while the panel stack is taller than the board, its oldest row gets the
  // Framework's hidden class; with fewer than 2 rows left the list goes and the rating and QR row takes the height.
  function fitMoves() {
    var panel = document.querySelector('[data-ym-panel]'), card = document.querySelector('[data-ym-card="moves"]');
    if (!panel || !card) return;
    var root = document.querySelector('[data-ym]'), rows = card.querySelectorAll('tr'), tb = card.querySelector('table'), cs = window.getComputedStyle(card),
      over = function () { return panel.scrollHeight > panel.clientHeight + 1 || root.scrollHeight > root.clientHeight + 1 || tb.getBoundingClientRect().bottom > card.getBoundingClientRect().bottom - (parseFloat(cs.paddingBottom) || 0) + 1; };
    // The oldest rows go first (down to 2); if that is not enough the puzzle info card goes (the title bar and the turn card say the rest),
    // the rows come back, and so on. Portrait has no room for the info card at all: it goes first.
    var trim = function () { var i = 0; while (over() && i < rows.length - 2) hide(rows[i++]); return !over(); };
    var opt = panel.querySelector('[data-ym-card="puzzle"]'), portrait = YM.view === 1 && !!document.querySelector('.screen--portrait');
    if (portrait && opt) hide(opt);
    if (trim()) return;
    if (opt && !portrait) {
      Array.prototype.forEach.call(rows, function (r) { r.setAttribute('class', (r.getAttribute('class') || '').replace(/(^|\s)hidden(?=\s|$)/g, ' ')); });
      hide(opt);
      if (trim()) return;
    }
    hide(card);
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
  function quadrantFit(shrink) {   // shrink(): the board one pixel smaller, false when it may not give more (main() owns the board size)
    var opt = '[data-ym-opp], [data-ym-part="more"], [data-ym-meta]', n;
    for (var w = 0; w < 60; w++) {
      n = Array.prototype.filter.call(document.querySelectorAll('[data-ym-panel] .label, [data-ym-panel] .value'), wraps);
      if (!n.length) return;
      var o = n.filter(function (x) { return x.closest(opt); })[0];
      if (o) hide(o.closest(opt));
      else {
        var v = Array.prototype.filter.call(document.querySelectorAll(opt), function (x) { return x.getClientRects().length; })[0];
        if (v) hide(v);   // optional lines go before the board gives up any height
        else if (!shrink()) return;
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
  // Profile (no board): what does not fit goes, in this order: the oldest recent games (down to 3), the least played cards (down to 3),
  // the oldest recent games (down to 2), the recent games, the hero's peak line, the least played cards. The hero chart and the card trends take the spare height; a chart
  // box too small to read (hero under 40 px, trend under 16 px) is hidden.
  function profileMain() {
    ogText();
    var root = document.querySelector('[data-ym]');
    if (!root) return;
    var q = function (sel) { return Array.prototype.filter.call(document.querySelectorAll(sel), function (n) { return n.getClientRects().length; }); };
    var over = function () {
      if (root.scrollHeight > root.clientHeight + 1 || root.scrollWidth > root.clientWidth + 1) return true;
      return q('[data-ym-col], [data-ym-panel]').some(function (c) { return c.scrollHeight > c.clientHeight + 1; }) || q('[data-ym-card]').some(function (c) { return c.scrollHeight > c.clientHeight + 1; }) || q('[data-ym-panel] .label, [data-ym-panel] .value').some(wraps);
    };
    var fit = function () {
      var games = q('[data-ym-game-row]'), cards = q('[data-ym-card="perf"]'), rc = q('[data-ym-card="recent"]')[0], pk = q('[data-ym-part="peak"]')[0], cg = q('[data-ym-part="cards"]')[0];
      var sp = q('[data-ym-part="spark"]')[0], low = function () { return over() || !!sp && sp.clientHeight < 40; };   // the hero chart is worth more than old games
      while (low() && games.length > 3) hide(games.pop());
      while (low() && cards.length > 3) hide(cards.pop());
      while (over() && games.length > 2) hide(games.pop());   // a short list before none (half horizontal without cards)
      if (over() && rc) hide(rc);
      if (over() && pk) hide(pk);
      while (over() && cards.length > 0) hide(cards.pop());
      if (cg && !cards.length) hide(cg);
      if (sp && sp.clientHeight < 40) hide(sp);
      q('[data-ym-part="trend"]').forEach(function (e) { if (e.clientHeight < 16) hide(e); });
      // No empty band: a column whose blocks no longer fill it lets its last card take the height, its content centred as one block (a list: packed from the top).
      q('[data-ym-col]').forEach(function (c) {
        var k = Array.prototype.filter.call(c.children, function (e) { return e.getClientRects().length; }), last = k[k.length - 1];
        if (!last || c.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom < 2) return;
        if (k.some(function (e) { return / grow( |$)/.test(' ' + e.getAttribute('class')) && e.querySelector('[data-ym-part="spark"]:not(.hidden)'); })) return;
        k.forEach(function (e) { if (e.hasAttribute('data-ym-card')) e.setAttribute('class', e.getAttribute('class').replace(/(^| )grow( |$)/, ' ')); });
        if (last.hasAttribute('data-ym-card')) last.setAttribute('class', last.getAttribute('class').replace('shrink-0', '') + (last.getAttribute('data-ym-card') === 'recent' ? ' grow' : ' grow flex--center-y'));   // a list stays packed from the top
      });
    };
    var settle = function () { fit(); (YM.sparks || []).forEach(function (s) { spark(s.id, s.pts, s.hero ? 'hero' : 'trend'); }); root.setAttribute('data-ym-drawn', '1'); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle, settle); else settle();
  }
  // Dark mode: the move list figurines and the turn king are images, which the Framework does not invert, so their black lines
  // vanished on the dark panel. They are redrawn with black and white swapped (light lines and a dark fill, as the text inverts).
  function darkFigures() {
    if (!document.querySelector('.screen--dark-mode') || typeof atob !== 'function') return;
    Array.prototype.forEach.call(document.querySelectorAll('img[data-ym-fig]'), function (n) {
      var s = n.getAttribute('src') || '', i = s.indexOf('base64,');
      if (i < 0) return;
      var svg = atob(s.slice(i + 7)).replace(/(<svg[^>]*>)/, '$1<g fill="#000">').replace(/<\/svg>\s*$/, '</g></svg>')
        .replace(/#f{3}(f{3})?\b/gi, '#ym1').replace(/#0{3}(0{3})?\b/g, '#fff').replace(/#ym1/g, '#000');
      n.setAttribute('src', s.slice(0, i + 7) + btoa(svg));
    });
  }
  function main() {
    darkFigures();
    if (!YM.profile) ogText();
    if (YM.profile) return profileMain();
    var root = document.querySelector('[data-ym]'), bd = document.querySelector('[data-ym-board]');
    if (!root || !bd || !YM.puzzle) return;
    var sc = document.querySelector('.screen'), has = function (c) { return !!(sc && sc.classList.contains(c)); };
    var dark = has('screen--dark-mode') || !!document.querySelector('.screen--dark-mode, .dark-mode');
    var bits = has('screen--1bit') ? 1 : has('screen--2bit') ? 2 : 4, lg = has('screen--lg'), view = YM.view, portrait = has('screen--portrait') && view === 1;
    if (portrait && lg) {   // the X in portrait (3:4): the board keeps 66 % of the height, the move list sits beside the rating and QR (owner 2026-11-27)
      var mv = document.querySelector('[data-ym-card="moves"]'), bot = document.querySelector('[data-ym-bottom]');
      if (mv && bot) { mv.setAttribute('class', mv.getAttribute('class').replace(/(^|\s)shrink-0(?=\s|$)/, ' ') + ' grow'); bot.insertBefore(mv, bot.firstChild); }
    }
    var r = root.getBoundingClientRect(), cs = window.getComputedStyle(root);
    var W = Math.floor(r.width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0));
    var H = Math.floor(r.height - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0));
    // The board's share; the panel (a Framework flex column, grow) takes the rest.
    // The board takes the full content height when the panel keeps its minimum width (as in c828281); the panel takes the rest.
    var gap = parseFloat(cs.columnGap || cs.gap) || 0, minPanel = Math.round(W * (view === 1 ? (lg ? 0.28 : 0.3) : view === 2 ? 0.45 : view === 4 ? 0.1 : 0.4));
    var S = view === 3 ? Math.min(W, Math.round(H * 0.62)) : portrait ? Math.min(W, Math.round(H * 0.66)) : Math.min(H, W - minPanel - gap);   // portrait: the board across the top
    var lab = document.querySelector('[data-ym-panel] .label, [data-ym-panel] .value'), font = (lab && window.getComputedStyle(lab).fontFamily) || 'sans-serif';
    var P = YM.puzzle;
    var draw = function (s) { bd.innerHTML = boardSvg({ size: s, board: P.board, flip: !YM.white_bottom, from: P.from, to: P.to, coords: YM.coords && s > 150, bits: bits, dark: dark, font: font.replace(/"/g, "'") }); };
    draw(S);
    // Once the web fonts are in, if the panel's content needs more room than its share (the row overflows), the board
    // gives way by that much; then the page counts as drawn.
    var settle = function () {
      // Quadrant: the board takes the full height first; a text that would wrap in the narrow panel is dropped if it is optional
      // (sub line, "+N waiting", name), and only a required one gives the board a step back.
      if (view === 4) quadrantFit(function () { if (S <= H * 0.9) return false; draw(S -= 1); return true; });
      if (portrait) { if (lg) fitParts(); fitMoves(); fitParts(); }   // the X: the rating card's chart and week give way before the move list beside them   // portrait: the optional parts go first, the board gives way by what is still too tall   // portrait: the optional parts go first, the board gives way by what is still too tall
      for (var k = 0, s = S; k < (portrait ? 8 : 3); k++) {
        var over = view === 3 || portrait ? root.scrollHeight - root.clientHeight : root.scrollWidth - root.clientWidth;
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

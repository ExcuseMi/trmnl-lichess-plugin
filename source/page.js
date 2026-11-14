// Page script: draws the chessboard into [data-ym-board] (the one part allowed its own SVG). Everything else on the screen is
// Framework markup in shared.liquid. Runs once the Framework runtime is there: TRMNLPaint gives the board's colours.
(function () {
  if (!window.TRMNLPaint && document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', main); return; }
  main();
  function main() {
    var root = document.querySelector('[data-ym]'), bd = document.querySelector('[data-ym-board]');
    if (!root || !bd || !YM.puzzle) return;
    var sc = document.querySelector('.screen'), has = function (c) { return !!(sc && sc.classList.contains(c)); };
    var dark = has('screen--dark-mode') || !!document.querySelector('.screen--dark-mode, .dark-mode');
    var bits = has('screen--1bit') ? 1 : has('screen--2bit') ? 2 : 4, lg = has('screen--lg'), view = YM.view;
    var r = root.getBoundingClientRect(), cs = window.getComputedStyle(root);
    var W = Math.floor(r.width - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0));
    var H = Math.floor(r.height - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0));
    // The board's share; the panel (a Framework flex column, grow) takes the rest.
    var S = view === 3 ? Math.min(W, Math.round(H * 0.62)) : Math.min(H, Math.round(W * (view === 1 ? (lg ? 0.6 : 0.55) : view === 2 ? 0.45 : 0.58)));
    var lab = document.querySelector('[data-ym-panel] .label'), font = (lab && window.getComputedStyle(lab).fontFamily) || 'sans-serif';
    var P = YM.puzzle;
    bd.innerHTML = boardSvg({ size: S, board: P.board, flip: !YM.white_bottom, from: P.from, to: P.to, coords: YM.coords && S > 150, bits: bits, dark: dark, font: font.replace(/"/g, "'") });
    root.setAttribute('data-ym-drawn', '1');
  }
})();

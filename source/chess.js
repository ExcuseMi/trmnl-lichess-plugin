// Board model from a FEN. Board = 64 chars, index 0 = a8 ... 63 = h1, white upper case, black lower case, '.' empty.
// Replaying a PGN is chess.js (vendored, source/vendor/chess.min.js); nothing here applies moves.
function parseFen(fen) {
  var parts = String(fen || '').trim().split(/\s+/);
  if (parts.length < 2) throw new Error('bad fen');
  var rows = parts[0].split('/');
  if (rows.length !== 8) throw new Error('bad fen rows');
  var b = '';
  rows.forEach(function (r) {
    var n = 0;
    for (var i = 0; i < r.length; i++) {
      var c = r[i];
      if (c >= '1' && c <= '8') { b += new Array(+c + 1).join('.'); n += +c; }
      else if ('pnbrqkPNBRQK'.indexOf(c) >= 0) { b += c; n++; }
      else throw new Error('bad fen piece');
    }
    if (n !== 8) throw new Error('bad fen row width');
  });
  if (parts[1] !== 'w' && parts[1] !== 'b') throw new Error('bad fen turn');
  return { board: b, turn: parts[1] };
}
function sqIndex(name) { return /^[a-h][1-8]$/.test(name || '') ? (8 - +name[1]) * 8 + (name.charCodeAt(0) - 97) : -1; }
// Position to solve from a Lichess puzzle answer: its fen when it has one, else the game's PGN replayed with chess.js.
function lichessPosition(j) {
  var p = j.puzzle || {}, g = j.game || {};
  if (p.fen) { var q = parseFen(p.fen); q.last = String(p.lastMove || ''); return q; }
  var ch = new CHESSJS.Chess(), moves = String(g.pgn || '').split(/\s+/).filter(Boolean), n = (p.initialPly == null ? moves.length : p.initialPly + 1), last = null;
  for (var i = 0; i < n && i < moves.length; i++) last = ch.move(moves[i]);
  var r = parseFen(ch.fen());
  r.last = last ? last.from + last.to : '';
  return r;
}
// The moves that led to a Lichess puzzle, as move pairs [number, white SAN, black SAN] (last MOVES_MAX pairs), SAN from chess.js.
// Empty when the PGN does not replay, or its position is not the puzzle's: never a list that does not match the board.
var MOVES_MAX = 30;
function lichessMoves(j) {
  var p = j.puzzle || {}, g = j.game || {}, toks = String(g.pgn || '').split(/\s+/).filter(Boolean);
  var n = p.initialPly == null ? toks.length : +p.initialPly + 1, sans = [], ch = new CHESSJS.Chess();
  if (!(n > 0) || n > toks.length) return [];
  try { for (var i = 0; i < n; i++) sans.push(ch.move(toks[i]).san); } catch (e) { return []; }
  if (p.fen && parseFen(ch.fen()).board !== parseFen(p.fen).board) return [];
  var pairs = [];
  for (var k = 0; k < sans.length; k += 2) pairs.push([k / 2 + 1, sans[k], sans[k + 1] || '']);
  return pairs.slice(-MOVES_MAX);
}

// ==== vendor/chess.min.js
// chess.js 1.4.0, Copyright (c) 2025, Jeff Hlywa, BSD-2-Clause (full text: LICENSES/chess.js-BSD-2.txt). Minified with terser; unchanged otherwise.
var CHESSJS = (function () { var exports = {};
"use strict";function rootNode(t){return null!==t?{comment:t,variations:[]}:{variations:[]}}function node(t,e,r,i,n){const s={move:t,variations:n};return e&&(s.suffix=e),r&&(s.nag=r),null!==i&&(s.comment=i),s}function lineToTree(...t){const[e,...r]=t;let i=e;for(const t of r)null!==t&&(i.variations=[t,...t.variations],t.variations=[],i=t);return e}function pgn(t,e){if(e.marker&&e.marker.comment){let t=e.root;for(;;){const r=t.variations[0];if(!r){t.comment=e.marker.comment;break}t=r}}return{headers:t,root:e.root,result:(e.marker&&e.marker.result)??void 0}}function peg$subclass(t,e){function r(){this.constructor=t}r.prototype=e.prototype,t.prototype=new r}function peg$SyntaxError(t,e,r,i){var n=Error.call(this,t);return Object.setPrototypeOf&&Object.setPrototypeOf(n,peg$SyntaxError.prototype),n.expected=e,n.found=r,n.location=i,n.name="SyntaxError",n}function peg$padEnd(t,e,r){return r=r||" ",t.length>e?t:(e-=t.length,t+(r+=r.repeat(e)).slice(0,e))}function peg$parse(t,e){var r,i,n,s,o={},a=(e=void 0!==e?e:{}).grammarSource,h={pgn:Wt},l=Wt,u="[",c='"',_="]",f=".",p="O-O-O",g="O-O",d="0-0-0",S="0-0",m="$",E="{",b="}",v=";",A="(",O=")",T="1-0",C="0-1",I="1/2-1/2",k="*",y=/^[a-zA-Z]/,x=/^[^"]/,N=/^[0-9]/,P=/^[.]/,w=/^[a-zA-Z1-8\-=]/,K=/^[+#]/,M=/^[!?]/,L=/^[^}]/,R=/^[^\r\n]/,B=/^[ \t\r\n]/,F=$t("tag pair"),q=Dt("[",!1),D=Dt('"',!1),U=Dt("]",!1),$=$t("tag name"),Q=Ut([["a","z"],["A","Z"]],!1,!1),G=$t("tag value"),H=Ut(['"'],!0,!1),W=$t("move number"),V=Ut([["0","9"]],!1,!1),j=Dt(".",!1),Y=Ut(["."],!1,!1),z=$t("standard algebraic notation"),Z=Dt("O-O-O",!1),J=Dt("O-O",!1),X=Dt("0-0-0",!1),tt=Dt("0-0",!1),et=Ut([["a","z"],["A","Z"],["1","8"],"-","="],!1,!1),rt=Ut(["+","#"],!1,!1),it=$t("suffix annotation"),nt=Ut(["!","?"],!1,!1),st=$t("NAG"),ot=Dt("$",!1),at=$t("brace comment"),ht=Dt("{",!1),lt=Ut(["}"],!0,!1),ut=Dt("}",!1),ct=$t("rest of line comment"),_t=Dt(";",!1),ft=Ut(["\r","\n"],!0,!1),pt=$t("variation"),gt=Dt("(",!1),dt=Dt(")",!1),St=$t("game termination marker"),mt=Dt("1-0",!1),Et=Dt("0-1",!1),bt=Dt("1/2-1/2",!1),vt=Dt("*",!1),At=$t("whitespace"),Ot=Ut([" ","\t","\r","\n"],!1,!1),Tt=function(t,e){return pgn(t,e)},Ct=function(t){return Object.fromEntries(t)},It=function(t,e){return[t,e]},kt=function(t,e){return{root:t,marker:e}},yt=function(t,e){return lineToTree(rootNode(t),...e.flat())},xt=function(t,e,r,i,n){return node(t,e,r,i,n)},Nt=function(t){return t},Pt=function(t){return t.replace(/[\r\n]+/g," ")},wt=function(t){return t.trim()},Kt=function(t){return t},Mt=function(t,e){return{result:t,comment:e}},Lt=0|e.peg$currPos,Rt=[{line:1,column:1}],Bt=Lt,Ft=e.peg$maxFailExpected||[],qt=0|e.peg$silentFails;if(e.startRule){if(!(e.startRule in h))throw new Error("Can't start parsing from rule \""+e.startRule+'".');l=h[e.startRule]}function Dt(t,e){return{type:"literal",text:t,ignoreCase:e}}function Ut(t,e,r){return{type:"class",parts:t,inverted:e,ignoreCase:r}}function $t(t){return{type:"other",description:t}}function Qt(e){var r,i=Rt[e];if(i)return i;if(e>=Rt.length)r=Rt.length-1;else for(r=e;!Rt[--r];);for(i={line:(i=Rt[r]).line,column:i.column};r<e;)10===t.charCodeAt(r)?(i.line++,i.column=1):i.column++,r++;return Rt[e]=i,i}function Gt(t,e,r){var i=Qt(t),n=Qt(e);return{source:a,start:{offset:t,line:i.line,column:i.column},end:{offset:e,line:n.line,column:n.column}}}function Ht(t){Lt<Bt||(Lt>Bt&&(Bt=Lt,Ft=[]),Ft.push(t))}function Wt(){var e,r;return e=function(){var t,e,r;t=Lt,e=[],r=Vt();for(;r!==o;)e.push(r),r=Vt();return r=Xt(),t=Ct(e),t}(),r=function(){var e,r,i;e=Lt,r=jt(),Xt(),i=function(){var e,r,i;qt++,e=Lt,t.substr(Lt,3)===T?(r=T,Lt+=3):(r=o,0===qt&&Ht(mt));r===o&&(t.substr(Lt,3)===C?(r=C,Lt+=3):(r=o,0===qt&&Ht(Et)),r===o&&(t.substr(Lt,7)===I?(r=I,Lt+=7):(r=o,0===qt&&Ht(bt)),r===o&&(42===t.charCodeAt(Lt)?(r=k,Lt++):(r=o,0===qt&&Ht(vt)))));r!==o?(Xt(),(i=Zt())===o&&(i=null),e=Mt(r,i)):(Lt=e,e=o);qt--,e===o&&(r=o,0===qt&&Ht(St));return e}(),i===o&&(i=null);return Xt(),e=kt(r,i),e}(),Tt(e,r)}function Vt(){var e,r,i,n,s,a,h;return qt++,e=Lt,Xt(),91===t.charCodeAt(Lt)?(r=u,Lt++):(r=o,0===qt&&Ht(q)),r!==o?(Xt(),i=function(){var e,r,i;qt++,e=Lt,r=[],i=t.charAt(Lt),y.test(i)?Lt++:(i=o,0===qt&&Ht(Q));if(i!==o)for(;i!==o;)r.push(i),i=t.charAt(Lt),y.test(i)?Lt++:(i=o,0===qt&&Ht(Q));else r=o;e=r!==o?t.substring(e,Lt):r;qt--,e===o&&(r=o,0===qt&&Ht($));return e}(),i!==o?(Xt(),34===t.charCodeAt(Lt)?(n=c,Lt++):(n=o,0===qt&&Ht(D)),n!==o?(s=function(){var e,r,i;qt++,e=Lt,r=[],i=t.charAt(Lt),x.test(i)?Lt++:(i=o,0===qt&&Ht(H));for(;i!==o;)r.push(i),i=t.charAt(Lt),x.test(i)?Lt++:(i=o,0===qt&&Ht(H));e=t.substring(e,Lt),qt--,r=o,0===qt&&Ht(G);return e}(),34===t.charCodeAt(Lt)?(a=c,Lt++):(a=o,0===qt&&Ht(D)),a!==o?(Xt(),93===t.charCodeAt(Lt)?(h=_,Lt++):(h=o,0===qt&&Ht(U)),h!==o?e=It(i,s):(Lt=e,e=o)):(Lt=e,e=o)):(Lt=e,e=o)):(Lt=e,e=o)):(Lt=e,e=o),qt--,e===o&&0===qt&&Ht(F),e}function jt(){var t,e,r;for((t=Zt())===o&&(t=null),e=[],r=Yt();r!==o;)e.push(r),r=Yt();return yt(t,e)}function Yt(){var e,r,i,n,s,a,h,l;if(e=Lt,Xt(),function(){var e,r,i,n,s,a;qt++,e=Lt,r=[],i=t.charAt(Lt),N.test(i)?Lt++:(i=o,0===qt&&Ht(V));for(;i!==o;)r.push(i),i=t.charAt(Lt),N.test(i)?Lt++:(i=o,0===qt&&Ht(V));46===t.charCodeAt(Lt)?(i=f,Lt++):(i=o,0===qt&&Ht(j));if(i!==o){for(n=Xt(),s=[],a=t.charAt(Lt),P.test(a)?Lt++:(a=o,0===qt&&Ht(Y));a!==o;)s.push(a),a=t.charAt(Lt),P.test(a)?Lt++:(a=o,0===qt&&Ht(Y));e=r=[r,i,n,s]}else Lt=e,e=o;qt--,e===o&&(r=o,0===qt&&Ht(W))}(),Xt(),r=function(){var e,r,i,n,s,a;qt++,e=Lt,r=Lt,t.substr(Lt,5)===p?(i=p,Lt+=5):(i=o,0===qt&&Ht(Z));if(i===o&&(t.substr(Lt,3)===g?(i=g,Lt+=3):(i=o,0===qt&&Ht(J)),i===o&&(t.substr(Lt,5)===d?(i=d,Lt+=5):(i=o,0===qt&&Ht(X)),i===o&&(t.substr(Lt,3)===S?(i=S,Lt+=3):(i=o,0===qt&&Ht(tt)),i===o))))if(i=Lt,n=t.charAt(Lt),y.test(n)?Lt++:(n=o,0===qt&&Ht(Q)),n!==o){if(s=[],a=t.charAt(Lt),w.test(a)?Lt++:(a=o,0===qt&&Ht(et)),a!==o)for(;a!==o;)s.push(a),a=t.charAt(Lt),w.test(a)?Lt++:(a=o,0===qt&&Ht(et));else s=o;s!==o?i=n=[n,s]:(Lt=i,i=o)}else Lt=i,i=o;i!==o?(n=t.charAt(Lt),K.test(n)?Lt++:(n=o,0===qt&&Ht(rt)),n===o&&(n=null),r=i=[i,n]):(Lt=r,r=o);e=r!==o?t.substring(e,Lt):r;qt--,e===o&&(r=o,0===qt&&Ht(z));return e}(),r!==o){for(i=function(){var e,r,i;qt++,e=Lt,r=[],i=t.charAt(Lt),M.test(i)?Lt++:(i=o,0===qt&&Ht(nt));for(;i!==o;)r.push(i),r.length>=2?i=o:(i=t.charAt(Lt),M.test(i)?Lt++:(i=o,0===qt&&Ht(nt)));r.length<1?(Lt=e,e=o):e=r;qt--,e===o&&(r=o,0===qt&&Ht(it));return e}(),i===o&&(i=null),n=[],s=zt();s!==o;)n.push(s),s=zt();for(s=Xt(),(a=Zt())===o&&(a=null),h=[],l=Jt();l!==o;)h.push(l),l=Jt();e=xt(r,i,n,a,h)}else Lt=e,e=o;return e}function zt(){var e,r,i,n,s;if(qt++,e=Lt,Xt(),36===t.charCodeAt(Lt)?(r=m,Lt++):(r=o,0===qt&&Ht(ot)),r!==o){if(i=Lt,n=[],s=t.charAt(Lt),N.test(s)?Lt++:(s=o,0===qt&&Ht(V)),s!==o)for(;s!==o;)n.push(s),s=t.charAt(Lt),N.test(s)?Lt++:(s=o,0===qt&&Ht(V));else n=o;(i=n!==o?t.substring(i,Lt):n)!==o?e=Nt(i):(Lt=e,e=o)}else Lt=e,e=o;return qt--,e===o&&0===qt&&Ht(st),e}function Zt(){var e;return(e=function(){var e,r,i,n,s;qt++,e=Lt,123===t.charCodeAt(Lt)?(r=E,Lt++):(r=o,0===qt&&Ht(ht));if(r!==o){for(i=Lt,n=[],s=t.charAt(Lt),L.test(s)?Lt++:(s=o,0===qt&&Ht(lt));s!==o;)n.push(s),s=t.charAt(Lt),L.test(s)?Lt++:(s=o,0===qt&&Ht(lt));i=t.substring(i,Lt),125===t.charCodeAt(Lt)?(n=b,Lt++):(n=o,0===qt&&Ht(ut)),n!==o?e=Pt(i):(Lt=e,e=o)}else Lt=e,e=o;qt--,e===o&&(r=o,0===qt&&Ht(at));return e}())===o&&(e=function(){var e,r,i,n,s;qt++,e=Lt,59===t.charCodeAt(Lt)?(r=v,Lt++):(r=o,0===qt&&Ht(_t));if(r!==o){for(i=Lt,n=[],s=t.charAt(Lt),R.test(s)?Lt++:(s=o,0===qt&&Ht(ft));s!==o;)n.push(s),s=t.charAt(Lt),R.test(s)?Lt++:(s=o,0===qt&&Ht(ft));i=t.substring(i,Lt),e=wt(i)}else Lt=e,e=o;qt--,e===o&&(r=o,0===qt&&Ht(ct));return e}()),e}function Jt(){var e,r,i,n;return qt++,e=Lt,Xt(),40===t.charCodeAt(Lt)?(r=A,Lt++):(r=o,0===qt&&Ht(gt)),r!==o&&(i=jt())!==o?(Xt(),41===t.charCodeAt(Lt)?(n=O,Lt++):(n=o,0===qt&&Ht(dt)),n!==o?e=Kt(i):(Lt=e,e=o)):(Lt=e,e=o),qt--,e===o&&0===qt&&Ht(pt),e}function Xt(){var e,r;for(qt++,e=[],r=t.charAt(Lt),B.test(r)?Lt++:(r=o,0===qt&&Ht(Ot));r!==o;)e.push(r),r=t.charAt(Lt),B.test(r)?Lt++:(r=o,0===qt&&Ht(Ot));return qt--,r=o,0===qt&&Ht(At),e}if(r=l(),e.peg$library)return{peg$result:r,peg$currPos:Lt,peg$FAILED:o,peg$maxFailExpected:Ft,peg$maxFailPos:Bt};if(r!==o&&Lt===t.length)return r;throw r!==o&&Lt<t.length&&Ht({type:"end"}),i=Ft,n=Bt<t.length?t.charAt(Bt):null,s=Bt<t.length?Gt(Bt,Bt+1):Gt(Bt,Bt),new peg$SyntaxError(peg$SyntaxError.buildMessage(i,n),i,n,s)}peg$subclass(peg$SyntaxError,Error),peg$SyntaxError.prototype.format=function(t){var e="Error: "+this.message;if(this.location){var r,i=null;for(r=0;r<t.length;r++)if(t[r].source===this.location.source){i=t[r].text.split(/\r\n|\n|\r/g);break}var n=this.location.start,s=this.location.source&&"function"==typeof this.location.source.offset?this.location.source.offset(n):n,o=this.location.source+":"+s.line+":"+s.column;if(i){var a=this.location.end,h=peg$padEnd("",s.line.toString().length," "),l=i[n.line-1],u=(n.line===a.line?a.column:l.length+1)-n.column||1;e+="\n --\x3e "+o+"\n"+h+" |\n"+s.line+" | "+l+"\n"+h+" | "+peg$padEnd("",n.column-1," ")+peg$padEnd("",u,"^")}else e+="\n at "+o}return e},peg$SyntaxError.buildMessage=function(t,e){var r={literal:function(t){return'"'+n(t.text)+'"'},class:function(t){var e=t.parts.map((function(t){return Array.isArray(t)?s(t[0])+"-"+s(t[1]):s(t)}));return"["+(t.inverted?"^":"")+e.join("")+"]"},any:function(){return"any character"},end:function(){return"end of input"},other:function(t){return t.description}};function i(t){return t.charCodeAt(0).toString(16).toUpperCase()}function n(t){return t.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\0/g,"\\0").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/[\x00-\x0F]/g,(function(t){return"\\x0"+i(t)})).replace(/[\x10-\x1F\x7F-\x9F]/g,(function(t){return"\\x"+i(t)}))}function s(t){return t.replace(/\\/g,"\\\\").replace(/\]/g,"\\]").replace(/\^/g,"\\^").replace(/-/g,"\\-").replace(/\0/g,"\\0").replace(/\t/g,"\\t").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/[\x00-\x0F]/g,(function(t){return"\\x0"+i(t)})).replace(/[\x10-\x1F\x7F-\x9F]/g,(function(t){return"\\x"+i(t)}))}function o(t){return r[t.type](t)}return"Expected "+function(t){var e,r,i=t.map(o);if(i.sort(),i.length>0){for(e=1,r=1;e<i.length;e++)i[e-1]!==i[e]&&(i[r]=i[e],r++);i.length=r}switch(i.length){case 1:return i[0];case 2:return i[0]+" or "+i[1];default:return i.slice(0,-1).join(", ")+", or "+i[i.length-1]}}(t)+" but "+function(t){return t?'"'+n(t)+'"':"end of input"}(e)+" found."};const MASK64=0xffffffffffffffffn;function rotl(t,e){return 0xffffffffffffffffn&(t<<e|t>>64n-e)}function wrappingMul(t,e){return t*e&MASK64}function xoroshiro128(t){return function(){let e=BigInt(t&MASK64),r=BigInt(t>>64n&MASK64);const i=wrappingMul(rotl(wrappingMul(e,5n),7n),9n);return r^=e,e=(rotl(e,24n)^r^r<<16n)&MASK64,r=rotl(r,37n),t=r<<64n|e,i}}const rand=xoroshiro128(0xa187eb39cdcaed8f31c4b365b102e01en),PIECE_KEYS=Array.from({length:2},(()=>Array.from({length:6},(()=>Array.from({length:128},(()=>rand())))))),EP_KEYS=Array.from({length:8},(()=>rand())),CASTLING_KEYS=Array.from({length:16},(()=>rand())),SIDE_KEY=rand(),WHITE="w",BLACK="b",PAWN="p",KNIGHT="n",BISHOP="b",ROOK="r",QUEEN="q",KING="k",DEFAULT_POSITION="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";class Move{color;from;to;piece;captured;promotion;flags;san;lan;before;after;constructor(t,e){const{color:r,piece:i,from:n,to:s,flags:o,captured:a,promotion:h}=e,l=algebraic(n),u=algebraic(s);this.color=r,this.piece=i,this.from=l,this.to=u,this.san=t._moveToSan(e,t._moves({legal:!0})),this.lan=l+u,this.before=t.fen(),t._makeMove(e),this.after=t.fen(),t._undoMove(),this.flags="";for(const t in BITS)BITS[t]&o&&(this.flags+=FLAGS[t]);a&&(this.captured=a),h&&(this.promotion=h,this.lan+=h)}isCapture(){return this.flags.indexOf(FLAGS.CAPTURE)>-1}isPromotion(){return this.flags.indexOf(FLAGS.PROMOTION)>-1}isEnPassant(){return this.flags.indexOf(FLAGS.EP_CAPTURE)>-1}isKingsideCastle(){return this.flags.indexOf(FLAGS.KSIDE_CASTLE)>-1}isQueensideCastle(){return this.flags.indexOf(FLAGS.QSIDE_CASTLE)>-1}isBigPawn(){return this.flags.indexOf(FLAGS.BIG_PAWN)>-1}}const EMPTY=-1,FLAGS={NORMAL:"n",CAPTURE:"c",BIG_PAWN:"b",EP_CAPTURE:"e",PROMOTION:"p",KSIDE_CASTLE:"k",QSIDE_CASTLE:"q",NULL_MOVE:"-"},SQUARES=["a8","b8","c8","d8","e8","f8","g8","h8","a7","b7","c7","d7","e7","f7","g7","h7","a6","b6","c6","d6","e6","f6","g6","h6","a5","b5","c5","d5","e5","f5","g5","h5","a4","b4","c4","d4","e4","f4","g4","h4","a3","b3","c3","d3","e3","f3","g3","h3","a2","b2","c2","d2","e2","f2","g2","h2","a1","b1","c1","d1","e1","f1","g1","h1"],BITS={NORMAL:1,CAPTURE:2,BIG_PAWN:4,EP_CAPTURE:8,PROMOTION:16,KSIDE_CASTLE:32,QSIDE_CASTLE:64,NULL_MOVE:128},SEVEN_TAG_ROSTER={Event:"?",Site:"?",Date:"????.??.??",Round:"?",White:"?",Black:"?",Result:"*"},SUPLEMENTAL_TAGS={WhiteTitle:null,BlackTitle:null,WhiteElo:null,BlackElo:null,WhiteUSCF:null,BlackUSCF:null,WhiteNA:null,BlackNA:null,WhiteType:null,BlackType:null,EventDate:null,EventSponsor:null,Section:null,Stage:null,Board:null,Opening:null,Variation:null,SubVariation:null,ECO:null,NIC:null,Time:null,UTCTime:null,UTCDate:null,TimeControl:null,SetUp:null,FEN:null,Termination:null,Annotator:null,Mode:null,PlyCount:null},HEADER_TEMPLATE={...SEVEN_TAG_ROSTER,...SUPLEMENTAL_TAGS},Ox88={a8:0,b8:1,c8:2,d8:3,e8:4,f8:5,g8:6,h8:7,a7:16,b7:17,c7:18,d7:19,e7:20,f7:21,g7:22,h7:23,a6:32,b6:33,c6:34,d6:35,e6:36,f6:37,g6:38,h6:39,a5:48,b5:49,c5:50,d5:51,e5:52,f5:53,g5:54,h5:55,a4:64,b4:65,c4:66,d4:67,e4:68,f4:69,g4:70,h4:71,a3:80,b3:81,c3:82,d3:83,e3:84,f3:85,g3:86,h3:87,a2:96,b2:97,c2:98,d2:99,e2:100,f2:101,g2:102,h2:103,a1:112,b1:113,c1:114,d1:115,e1:116,f1:117,g1:118,h1:119},PAWN_OFFSETS={b:[16,32,17,15],w:[-16,-32,-17,-15]},PIECE_OFFSETS={n:[-18,-33,-31,-14,18,33,31,14],b:[-17,-15,17,15],r:[-16,1,16,-1],q:[-17,-16,-15,1,17,16,15,-1],k:[-17,-16,-15,1,17,16,15,-1]},ATTACKS=[20,0,0,0,0,0,0,24,0,0,0,0,0,0,20,0,0,20,0,0,0,0,0,24,0,0,0,0,0,20,0,0,0,0,20,0,0,0,0,24,0,0,0,0,20,0,0,0,0,0,0,20,0,0,0,24,0,0,0,20,0,0,0,0,0,0,0,0,20,0,0,24,0,0,20,0,0,0,0,0,0,0,0,0,0,20,2,24,2,20,0,0,0,0,0,0,0,0,0,0,0,2,53,56,53,2,0,0,0,0,0,0,24,24,24,24,24,24,56,0,56,24,24,24,24,24,24,0,0,0,0,0,0,2,53,56,53,2,0,0,0,0,0,0,0,0,0,0,0,20,2,24,2,20,0,0,0,0,0,0,0,0,0,0,20,0,0,24,0,0,20,0,0,0,0,0,0,0,0,20,0,0,0,24,0,0,0,20,0,0,0,0,0,0,20,0,0,0,0,24,0,0,0,0,20,0,0,0,0,20,0,0,0,0,0,24,0,0,0,0,0,20,0,0,20,0,0,0,0,0,0,24,0,0,0,0,0,0,20],RAYS=[17,0,0,0,0,0,0,16,0,0,0,0,0,0,15,0,0,17,0,0,0,0,0,16,0,0,0,0,0,15,0,0,0,0,17,0,0,0,0,16,0,0,0,0,15,0,0,0,0,0,0,17,0,0,0,16,0,0,0,15,0,0,0,0,0,0,0,0,17,0,0,16,0,0,15,0,0,0,0,0,0,0,0,0,0,17,0,16,0,15,0,0,0,0,0,0,0,0,0,0,0,0,17,16,15,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,-15,-16,-17,0,0,0,0,0,0,0,0,0,0,0,0,-15,0,-16,0,-17,0,0,0,0,0,0,0,0,0,0,-15,0,0,-16,0,0,-17,0,0,0,0,0,0,0,0,-15,0,0,0,-16,0,0,0,-17,0,0,0,0,0,0,-15,0,0,0,0,-16,0,0,0,0,-17,0,0,0,0,-15,0,0,0,0,0,-16,0,0,0,0,0,-17,0,0,-15,0,0,0,0,0,0,-16,0,0,0,0,0,0,-17],PIECE_MASKS={p:1,n:2,b:4,r:8,q:16,k:32},SYMBOLS="pnbrqkPNBRQK",PROMOTIONS=["n","b","r","q"],RANK_1=7,RANK_2=6,RANK_7=1,RANK_8=0,SIDES={[KING]:BITS.KSIDE_CASTLE,[QUEEN]:BITS.QSIDE_CASTLE},ROOKS={w:[{square:Ox88.a1,flag:BITS.QSIDE_CASTLE},{square:Ox88.h1,flag:BITS.KSIDE_CASTLE}],b:[{square:Ox88.a8,flag:BITS.QSIDE_CASTLE},{square:Ox88.h8,flag:BITS.KSIDE_CASTLE}]},SECOND_RANK={b:1,w:6},SAN_NULLMOVE="--";function rank(t){return t>>4}function file(t){return 15&t}function isDigit(t){return-1!=="0123456789".indexOf(t)}function algebraic(t){const e=file(t),r=rank(t);return"abcdefgh".substring(e,e+1)+"87654321".substring(r,r+1)}function swapColor(t){return"w"===t?"b":"w"}function validateFen(t){const e=t.split(/\s+/);if(6!==e.length)return{ok:!1,error:"Invalid FEN: must contain six space-delimited fields"};const r=parseInt(e[5],10);if(isNaN(r)||r<=0)return{ok:!1,error:"Invalid FEN: move number must be a positive integer"};const i=parseInt(e[4],10);if(isNaN(i)||i<0)return{ok:!1,error:"Invalid FEN: half move counter number must be a non-negative integer"};if(!/^(-|[abcdefgh][36])$/.test(e[3]))return{ok:!1,error:"Invalid FEN: en-passant square is invalid"};if(/[^kKqQ-]/.test(e[2]))return{ok:!1,error:"Invalid FEN: castling availability is invalid"};if(!/^(w|b)$/.test(e[1]))return{ok:!1,error:"Invalid FEN: side-to-move is invalid"};const n=e[0].split("/");if(8!==n.length)return{ok:!1,error:"Invalid FEN: piece data does not contain 8 '/'-delimited rows"};for(let t=0;t<n.length;t++){let e=0,r=!1;for(let i=0;i<n[t].length;i++)if(isDigit(n[t][i])){if(r)return{ok:!1,error:"Invalid FEN: piece data is invalid (consecutive number)"};e+=parseInt(n[t][i],10),r=!0}else{if(!/^[prnbqkPRNBQK]$/.test(n[t][i]))return{ok:!1,error:"Invalid FEN: piece data is invalid (invalid piece)"};e+=1,r=!1}if(8!==e)return{ok:!1,error:"Invalid FEN: piece data is invalid (too many squares in rank)"}}if("3"==e[3][1]&&"w"==e[1]||"6"==e[3][1]&&"b"==e[1])return{ok:!1,error:"Invalid FEN: illegal en-passant square"};const s=[{color:"white",regex:/K/g},{color:"black",regex:/k/g}];for(const{color:t,regex:r}of s){if(!r.test(e[0]))return{ok:!1,error:`Invalid FEN: missing ${t} king`};if((e[0].match(r)||[]).length>1)return{ok:!1,error:`Invalid FEN: too many ${t} kings`}}return Array.from(n[0]+n[7]).some((t=>"P"===t.toUpperCase()))?{ok:!1,error:"Invalid FEN: some pawns are on the edge rows"}:{ok:!0}}function getDisambiguator(t,e){const r=t.from,i=t.to,n=t.piece;let s=0,o=0,a=0;for(let t=0,h=e.length;t<h;t++){const h=e[t].from,l=e[t].to;n===e[t].piece&&r!==h&&i===l&&(s++,rank(r)===rank(h)&&o++,file(r)===file(h)&&a++)}return s>0?o>0&&a>0?algebraic(r):a>0?algebraic(r).charAt(1):algebraic(r).charAt(0):""}function addMove(t,e,r,i,n,s=void 0,o=BITS.NORMAL){const a=rank(i);if("p"!==n||7!==a&&0!==a)t.push({color:e,from:r,to:i,piece:n,captured:s,flags:o});else for(let a=0;a<PROMOTIONS.length;a++){const h=PROMOTIONS[a];t.push({color:e,from:r,to:i,piece:n,captured:s,promotion:h,flags:o|BITS.PROMOTION})}}function inferPieceType(t){let e=t.charAt(0);if(e>="a"&&e<="h"){if(t.match(/[a-h]\d.*[a-h]\d/))return;return"p"}return e=e.toLowerCase(),"o"===e?"k":e}function strippedSan(t){return t.replace(/=/,"").replace(/[+#]?[?!]*$/,"")}class Chess{_board=new Array(128);_turn="w";_header={};_kings={w:-1,b:-1};_epSquare=-1;_halfMoves=0;_moveNumber=0;_history=[];_comments={};_castling={w:0,b:0};_hash=0n;_positionCount=new Map;constructor(t=DEFAULT_POSITION,{skipValidation:e=!1}={}){this.load(t,{skipValidation:e})}clear({preserveHeaders:t=!1}={}){this._board=new Array(128),this._kings={w:-1,b:-1},this._turn="w",this._castling={w:0,b:0},this._epSquare=-1,this._halfMoves=0,this._moveNumber=1,this._history=[],this._comments={},this._header=t?this._header:{...HEADER_TEMPLATE},this._hash=this._computeHash(),this._positionCount=new Map,this._header.SetUp=null,this._header.FEN=null}load(t,{skipValidation:e=!1,preserveHeaders:r=!1}={}){let i=t.split(/\s+/);if(i.length>=2&&i.length<6){const e=["-","-","0","1"];t=i.concat(e.slice(-(6-i.length))).join(" ")}if(i=t.split(/\s+/),!e){const{ok:e,error:r}=validateFen(t);if(!e)throw new Error(r)}const n=i[0];let s=0;this.clear({preserveHeaders:r});for(let t=0;t<n.length;t++){const e=n.charAt(t);if("/"===e)s+=8;else if(isDigit(e))s+=parseInt(e,10);else{const t=e<"a"?"w":"b";this._put({type:e.toLowerCase(),color:t},algebraic(s)),s++}}this._turn=i[1],i[2].indexOf("K")>-1&&(this._castling.w|=BITS.KSIDE_CASTLE),i[2].indexOf("Q")>-1&&(this._castling.w|=BITS.QSIDE_CASTLE),i[2].indexOf("k")>-1&&(this._castling.b|=BITS.KSIDE_CASTLE),i[2].indexOf("q")>-1&&(this._castling.b|=BITS.QSIDE_CASTLE),this._epSquare="-"===i[3]?-1:Ox88[i[3]],this._halfMoves=parseInt(i[4],10),this._moveNumber=parseInt(i[5],10),this._hash=this._computeHash(),this._updateSetup(t),this._incPositionCount()}fen({forceEnpassantSquare:t=!1}={}){let e=0,r="";for(let t=Ox88.a8;t<=Ox88.h1;t++){if(this._board[t]){e>0&&(r+=e,e=0);const{color:i,type:n}=this._board[t];r+="w"===i?n.toUpperCase():n.toLowerCase()}else e++;t+1&136&&(e>0&&(r+=e),t!==Ox88.h1&&(r+="/"),e=0,t+=8)}let i="";this._castling.w&BITS.KSIDE_CASTLE&&(i+="K"),this._castling.w&BITS.QSIDE_CASTLE&&(i+="Q"),this._castling.b&BITS.KSIDE_CASTLE&&(i+="k"),this._castling.b&BITS.QSIDE_CASTLE&&(i+="q"),i=i||"-";let n="-";if(-1!==this._epSquare)if(t)n=algebraic(this._epSquare);else{const t=this._epSquare+("w"===this._turn?16:-16),e=[t+1,t-1];for(const t of e){if(136&t)continue;const e=this._turn;if(this._board[t]?.color===e&&"p"===this._board[t]?.type){this._makeMove({color:e,from:t,to:this._epSquare,piece:"p",captured:"p",flags:BITS.EP_CAPTURE});const r=!this._isKingAttacked(e);if(this._undoMove(),r){n=algebraic(this._epSquare);break}}}}return[r,this._turn,i,n,this._halfMoves,this._moveNumber].join(" ")}_pieceKey(t){if(!this._board[t])return 0n;const{color:e,type:r}=this._board[t],i={p:0,n:1,b:2,r:3,q:4,k:5}[r];return PIECE_KEYS[{w:0,b:1}[e]][i][t]}_epKey(){return-1===this._epSquare?0n:EP_KEYS[7&this._epSquare]}_castlingKey(){const t=this._castling.w>>5|this._castling.b>>3;return CASTLING_KEYS[t]}_computeHash(){let t=0n;for(let e=Ox88.a8;e<=Ox88.h1;e++)136&e?e+=7:this._board[e]&&(t^=this._pieceKey(e));return t^=this._epKey(),t^=this._castlingKey(),"b"===this._turn&&(t^=SIDE_KEY),t}_updateSetup(t){this._history.length>0||(t!==DEFAULT_POSITION?(this._header.SetUp="1",this._header.FEN=t):(this._header.SetUp=null,this._header.FEN=null))}reset(){this.load(DEFAULT_POSITION)}get(t){return this._board[Ox88[t]]}findPiece(t){const e=[];for(let r=Ox88.a8;r<=Ox88.h1;r++)136&r?r+=7:this._board[r]&&this._board[r]?.color===t.color&&this._board[r].color===t.color&&this._board[r].type===t.type&&e.push(algebraic(r));return e}put({type:t,color:e},r){return!!this._put({type:t,color:e},r)&&(this._updateCastlingRights(),this._updateEnPassantSquare(),this._updateSetup(this.fen()),!0)}_set(t,e){this._hash^=this._pieceKey(t),this._board[t]=e,this._hash^=this._pieceKey(t)}_put({type:t,color:e},r){if(-1===SYMBOLS.indexOf(t.toLowerCase()))return!1;if(!(r in Ox88))return!1;const i=Ox88[r];if("k"==t&&-1!=this._kings[e]&&this._kings[e]!=i)return!1;const n=this._board[i];return n&&"k"===n.type&&(this._kings[n.color]=-1),this._set(i,{type:t,color:e}),"k"===t&&(this._kings[e]=i),!0}_clear(t){this._hash^=this._pieceKey(t),delete this._board[t]}remove(t){const e=this.get(t);return this._clear(Ox88[t]),e&&"k"===e.type&&(this._kings[e.color]=-1),this._updateCastlingRights(),this._updateEnPassantSquare(),this._updateSetup(this.fen()),e}_updateCastlingRights(){this._hash^=this._castlingKey();const t="k"===this._board[Ox88.e1]?.type&&"w"===this._board[Ox88.e1]?.color,e="k"===this._board[Ox88.e8]?.type&&"b"===this._board[Ox88.e8]?.color;t&&"r"===this._board[Ox88.a1]?.type&&"w"===this._board[Ox88.a1]?.color||(this._castling.w&=-65),t&&"r"===this._board[Ox88.h1]?.type&&"w"===this._board[Ox88.h1]?.color||(this._castling.w&=-33),e&&"r"===this._board[Ox88.a8]?.type&&"b"===this._board[Ox88.a8]?.color||(this._castling.b&=-65),e&&"r"===this._board[Ox88.h8]?.type&&"b"===this._board[Ox88.h8]?.color||(this._castling.b&=-33),this._hash^=this._castlingKey()}_updateEnPassantSquare(){if(-1===this._epSquare)return;const t=this._epSquare+("w"===this._turn?-16:16),e=this._epSquare+("w"===this._turn?16:-16),r=[e+1,e-1];if(null!==this._board[t]||null!==this._board[this._epSquare]||this._board[e]?.color!==swapColor(this._turn)||"p"!==this._board[e]?.type)return this._hash^=this._epKey(),void(this._epSquare=-1);r.some((t=>!(136&t)&&this._board[t]?.color===this._turn&&"p"===this._board[t]?.type))||(this._hash^=this._epKey(),this._epSquare=-1)}_attacked(t,e,r){const i=[];for(let n=Ox88.a8;n<=Ox88.h1;n++){if(136&n){n+=7;continue}if(void 0===this._board[n]||this._board[n].color!==t)continue;const s=this._board[n],o=n-e;if(0===o)continue;const a=o+119;if(ATTACKS[a]&PIECE_MASKS[s.type]){if("p"===s.type){if(o>0&&"w"===s.color||o<=0&&"b"===s.color){if(!r)return!0;i.push(algebraic(n))}continue}if("n"===s.type||"k"===s.type){if(r){i.push(algebraic(n));continue}return!0}const t=RAYS[a];let h=n+t,l=!1;for(;h!==e;){if(null!=this._board[h]){l=!0;break}h+=t}if(!l){if(r){i.push(algebraic(n));continue}return!0}}}return!!r&&i}attackers(t,e){return e?this._attacked(e,Ox88[t],!0):this._attacked(this._turn,Ox88[t],!0)}_isKingAttacked(t){const e=this._kings[t];return-1!==e&&this._attacked(swapColor(t),e)}hash(){return this._hash.toString(16)}isAttacked(t,e){return this._attacked(e,Ox88[t])}isCheck(){return this._isKingAttacked(this._turn)}inCheck(){return this.isCheck()}isCheckmate(){return this.isCheck()&&0===this._moves().length}isStalemate(){return!this.isCheck()&&0===this._moves().length}isInsufficientMaterial(){const t={b:0,n:0,r:0,q:0,k:0,p:0},e=[];let r=0,i=0;for(let n=Ox88.a8;n<=Ox88.h1;n++){if(i=(i+1)%2,136&n){n+=7;continue}const s=this._board[n];s&&(t[s.type]=s.type in t?t[s.type]+1:1,"b"===s.type&&e.push(i),r++)}if(2===r)return!0;if(3===r&&(1===t.b||1===t.n))return!0;if(r===t.b+2){let t=0;const r=e.length;for(let i=0;i<r;i++)t+=e[i];if(0===t||t===r)return!0}return!1}isThreefoldRepetition(){return this._getPositionCount(this._hash)>=3}isDrawByFiftyMoves(){return this._halfMoves>=100}isDraw(){return this.isDrawByFiftyMoves()||this.isStalemate()||this.isInsufficientMaterial()||this.isThreefoldRepetition()}isGameOver(){return this.isCheckmate()||this.isDraw()}moves({verbose:t=!1,square:e,piece:r}={}){const i=this._moves({square:e,piece:r});return t?i.map((t=>new Move(this,t))):i.map((t=>this._moveToSan(t,i)))}_moves({legal:t=!0,piece:e,square:r}={}){const i=r?r.toLowerCase():void 0,n=e?.toLowerCase(),s=[],o=this._turn,a=swapColor(o);let h=Ox88.a8,l=Ox88.h1,u=!1;if(i){if(!(i in Ox88))return[];h=l=Ox88[i],u=!0}for(let t=h;t<=l;t++){if(136&t){t+=7;continue}if(!this._board[t]||this._board[t].color===a)continue;const{type:e}=this._board[t];let r;if("p"===e){if(n&&n!==e)continue;r=t+PAWN_OFFSETS[o][0],this._board[r]||(addMove(s,o,t,r,"p"),r=t+PAWN_OFFSETS[o][1],SECOND_RANK[o]!==rank(t)||this._board[r]||addMove(s,o,t,r,"p",void 0,BITS.BIG_PAWN));for(let e=2;e<4;e++)r=t+PAWN_OFFSETS[o][e],136&r||(this._board[r]?.color===a?addMove(s,o,t,r,"p",this._board[r].type,BITS.CAPTURE):r===this._epSquare&&addMove(s,o,t,r,"p","p",BITS.EP_CAPTURE))}else{if(n&&n!==e)continue;for(let i=0,n=PIECE_OFFSETS[e].length;i<n;i++){const n=PIECE_OFFSETS[e][i];for(r=t;r+=n,!(136&r);){if(this._board[r]){if(this._board[r].color===o)break;addMove(s,o,t,r,e,this._board[r].type,BITS.CAPTURE);break}if(addMove(s,o,t,r,e),"n"===e||"k"===e)break}}}}if(!(void 0!==n&&"k"!==n||u&&l!==this._kings[o])){if(this._castling[o]&BITS.KSIDE_CASTLE){const t=this._kings[o],e=t+2;this._board[t+1]||this._board[e]||this._attacked(a,this._kings[o])||this._attacked(a,t+1)||this._attacked(a,e)||addMove(s,o,this._kings[o],e,"k",void 0,BITS.KSIDE_CASTLE)}if(this._castling[o]&BITS.QSIDE_CASTLE){const t=this._kings[o],e=t-2;this._board[t-1]||this._board[t-2]||this._board[t-3]||this._attacked(a,this._kings[o])||this._attacked(a,t-1)||this._attacked(a,e)||addMove(s,o,this._kings[o],e,"k",void 0,BITS.QSIDE_CASTLE)}}if(!t||-1===this._kings[o])return s;const c=[];for(let t=0,e=s.length;t<e;t++)this._makeMove(s[t]),this._isKingAttacked(o)||c.push(s[t]),this._undoMove();return c}move(t,{strict:e=!1}={}){let r=null;if("string"==typeof t)r=this._moveFromSan(t,e);else if(null===t)r=this._moveFromSan("--",e);else if("object"==typeof t){const e=this._moves();for(let i=0,n=e.length;i<n;i++)if(t.from===algebraic(e[i].from)&&t.to===algebraic(e[i].to)&&(!("promotion"in e[i])||t.promotion===e[i].promotion)){r=e[i];break}}if(!r)throw"string"==typeof t?new Error(`Invalid move: ${t}`):new Error(`Invalid move: ${JSON.stringify(t)}`);if(this.isCheck()&&r.flags&BITS.NULL_MOVE)throw new Error("Null move not allowed when in check");const i=new Move(this,r);return this._makeMove(r),this._incPositionCount(),i}_push(t){this._history.push({move:t,kings:{b:this._kings.b,w:this._kings.w},turn:this._turn,castling:{b:this._castling.b,w:this._castling.w},epSquare:this._epSquare,halfMoves:this._halfMoves,moveNumber:this._moveNumber})}_movePiece(t,e){this._hash^=this._pieceKey(t),this._board[e]=this._board[t],delete this._board[t],this._hash^=this._pieceKey(e)}_makeMove(t){const e=this._turn,r=swapColor(e);if(this._push(t),t.flags&BITS.NULL_MOVE)return"b"===e&&this._moveNumber++,this._halfMoves++,this._turn=r,void(this._epSquare=-1);if(this._hash^=this._epKey(),this._hash^=this._castlingKey(),t.captured&&(this._hash^=this._pieceKey(t.to)),this._movePiece(t.from,t.to),t.flags&BITS.EP_CAPTURE&&("b"===this._turn?this._clear(t.to-16):this._clear(t.to+16)),t.promotion&&(this._clear(t.to),this._set(t.to,{type:t.promotion,color:e})),"k"===this._board[t.to].type){if(this._kings[e]=t.to,t.flags&BITS.KSIDE_CASTLE){const e=t.to-1,r=t.to+1;this._movePiece(r,e)}else if(t.flags&BITS.QSIDE_CASTLE){const e=t.to+1,r=t.to-2;this._movePiece(r,e)}this._castling[e]=0}if(this._castling[e])for(let r=0,i=ROOKS[e].length;r<i;r++)if(t.from===ROOKS[e][r].square&&this._castling[e]&ROOKS[e][r].flag){this._castling[e]^=ROOKS[e][r].flag;break}if(this._castling[r])for(let e=0,i=ROOKS[r].length;e<i;e++)if(t.to===ROOKS[r][e].square&&this._castling[r]&ROOKS[r][e].flag){this._castling[r]^=ROOKS[r][e].flag;break}if(this._hash^=this._castlingKey(),t.flags&BITS.BIG_PAWN){let i;i="b"===e?t.to-16:t.to+16,(t.to-1&136||"p"!==this._board[t.to-1]?.type||this._board[t.to-1]?.color!==r)&&(t.to+1&136||"p"!==this._board[t.to+1]?.type||this._board[t.to+1]?.color!==r)?this._epSquare=-1:(this._epSquare=i,this._hash^=this._epKey())}else this._epSquare=-1;"p"===t.piece||t.flags&(BITS.CAPTURE|BITS.EP_CAPTURE)?this._halfMoves=0:this._halfMoves++,"b"===e&&this._moveNumber++,this._turn=r,this._hash^=SIDE_KEY}undo(){const t=this._hash,e=this._undoMove();if(e){const r=new Move(this,e);return this._decPositionCount(t),r}return null}_undoMove(){const t=this._history.pop();if(void 0===t)return null;this._hash^=this._epKey(),this._hash^=this._castlingKey();const e=t.move;this._kings=t.kings,this._turn=t.turn,this._castling=t.castling,this._epSquare=t.epSquare,this._halfMoves=t.halfMoves,this._moveNumber=t.moveNumber,this._hash^=this._epKey(),this._hash^=this._castlingKey(),this._hash^=SIDE_KEY;const r=this._turn,i=swapColor(r);if(e.flags&BITS.NULL_MOVE)return e;if(this._movePiece(e.to,e.from),e.piece&&(this._clear(e.from),this._set(e.from,{type:e.piece,color:r})),e.captured)if(e.flags&BITS.EP_CAPTURE){let t;t="b"===r?e.to-16:e.to+16,this._set(t,{type:"p",color:i})}else this._set(e.to,{type:e.captured,color:i});if(e.flags&(BITS.KSIDE_CASTLE|BITS.QSIDE_CASTLE)){let t,r;e.flags&BITS.KSIDE_CASTLE?(t=e.to+1,r=e.to-1):(t=e.to-2,r=e.to+1),this._movePiece(r,t)}return e}pgn({newline:t="\n",maxWidth:e=0}={}){const r=[];let i=!1;for(const e in this._header){this._header[e]&&r.push(`[${e} "${this._header[e]}"]`+t),i=!0}i&&this._history.length&&r.push(t);const n=t=>{const e=this._comments[this.fen()];if(void 0!==e){t=`${t}${t.length>0?" ":""}{${e}}`}return t},s=[];for(;this._history.length>0;)s.push(this._undoMove());const o=[];let a="";for(0===s.length&&o.push(n(""));s.length>0;){a=n(a);const t=s.pop();if(!t)break;if(this._history.length||"b"!==t.color)"w"===t.color&&(a.length&&o.push(a),a=this._moveNumber+".");else{const t=`${this._moveNumber}. ...`;a=a?`${a} ${t}`:t}a=a+" "+this._moveToSan(t,this._moves({legal:!0})),this._makeMove(t)}if(a.length&&o.push(n(a)),o.push(this._header.Result||"*"),0===e)return r.join("")+o.join(" ");const h=function(){return r.length>0&&" "===r[r.length-1]&&(r.pop(),!0)},l=function(i,n){for(const s of n.split(" "))if(s){if(i+s.length>e){for(;h();)i--;r.push(t),i=0}r.push(s),i+=s.length,r.push(" "),i++}return h()&&i--,i};let u=0;for(let i=0;i<o.length;i++)u+o[i].length>e&&o[i].includes("{")?u=l(u,o[i]):(u+o[i].length>e&&0!==i?(" "===r[r.length-1]&&r.pop(),r.push(t),u=0):0!==i&&(r.push(" "),u++),r.push(o[i]),u+=o[i].length);return r.join("")}header(...t){for(let e=0;e<t.length;e+=2)"string"==typeof t[e]&&"string"==typeof t[e+1]&&(this._header[t[e]]=t[e+1]);return this._header}setHeader(t,e){return this._header[t]=e??SEVEN_TAG_ROSTER[t]??null,this.getHeaders()}removeHeader(t){return t in this._header&&(this._header[t]=SEVEN_TAG_ROSTER[t]||null,!0)}getHeaders(){const t={};for(const[e,r]of Object.entries(this._header))null!==r&&(t[e]=r);return t}loadPgn(t,{strict:e=!1,newlineChar:r="\r?\n"}={}){"\r?\n"!==r&&(t=t.replace(new RegExp(r,"g"),"\n"));const i=peg$parse(t);this.reset();const n=i.headers;let s="";for(const t in n)"fen"===t.toLowerCase()&&(s=n[t]),this.header(t,n[t]);if(e){if("1"===n.SetUp){if(!("FEN"in n))throw new Error("Invalid PGN: FEN tag must be supplied with SetUp tag");this.load(n.FEN,{preserveHeaders:!0})}}else s&&this.load(s,{preserveHeaders:!0});let o=i.root;for(;o;){if(o.move){const t=this._moveFromSan(o.move,e);if(null==t)throw new Error(`Invalid move in PGN: ${o.move}`);this._makeMove(t),this._incPositionCount()}void 0!==o.comment&&(this._comments[this.fen()]=o.comment),o=o.variations[0]}const a=i.result;a&&Object.keys(this._header).length&&this._header.Result!==a&&this.setHeader("Result",a)}_moveToSan(t,e){let r="";if(t.flags&BITS.KSIDE_CASTLE)r="O-O";else if(t.flags&BITS.QSIDE_CASTLE)r="O-O-O";else{if(t.flags&BITS.NULL_MOVE)return"--";if("p"!==t.piece){const i=getDisambiguator(t,e);r+=t.piece.toUpperCase()+i}t.flags&(BITS.CAPTURE|BITS.EP_CAPTURE)&&("p"===t.piece&&(r+=algebraic(t.from)[0]),r+="x"),r+=algebraic(t.to),t.promotion&&(r+="="+t.promotion.toUpperCase())}return this._makeMove(t),this.isCheck()&&(this.isCheckmate()?r+="#":r+="+"),this._undoMove(),r}_moveFromSan(t,e=!1){let r=strippedSan(t);if(e||("0-0"===r?r="O-O":"0-0-0"===r&&(r="O-O-O")),"--"==r){return{color:this._turn,from:0,to:0,piece:"k",flags:BITS.NULL_MOVE}}let i,n,s,o,a,h=inferPieceType(r),l=this._moves({legal:!0,piece:h});for(let t=0,e=l.length;t<e;t++)if(r===strippedSan(this._moveToSan(l[t],l)))return l[t];if(e)return null;let u=!1;if(n=r.match(/([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/),n?(i=n[1],s=n[2],o=n[3],a=n[4],1==s.length&&(u=!0)):(n=r.match(/([pnbrqkPNBRQK])?([a-h]?[1-8]?)x?-?([a-h][1-8])([qrbnQRBN])?/),n&&(i=n[1],s=n[2],o=n[3],a=n[4],1==s.length&&(u=!0))),h=inferPieceType(r),l=this._moves({legal:!0,piece:i||h}),!o)return null;for(let t=0,e=l.length;t<e;t++)if(s){if(!(i&&i.toLowerCase()!=l[t].piece||Ox88[s]!=l[t].from||Ox88[o]!=l[t].to||a&&a.toLowerCase()!=l[t].promotion))return l[t];if(u){const e=algebraic(l[t].from);if(!(i&&i.toLowerCase()!=l[t].piece||Ox88[o]!=l[t].to||s!=e[0]&&s!=e[1]||a&&a.toLowerCase()!=l[t].promotion))return l[t]}}else if(r===strippedSan(this._moveToSan(l[t],l)).replace("x",""))return l[t];return null}ascii(){let t="   +------------------------+\n";for(let e=Ox88.a8;e<=Ox88.h1;e++){if(0===file(e)&&(t+=" "+"87654321"[rank(e)]+" |"),this._board[e]){const r=this._board[e].type;t+=" "+("w"===this._board[e].color?r.toUpperCase():r.toLowerCase())+" "}else t+=" . ";e+1&136&&(t+="|\n",e+=8)}return t+="   +------------------------+\n",t+="     a  b  c  d  e  f  g  h",t}perft(t){const e=this._moves({legal:!1});let r=0;const i=this._turn;for(let n=0,s=e.length;n<s;n++)this._makeMove(e[n]),this._isKingAttacked(i)||(t-1>0?r+=this.perft(t-1):r++),this._undoMove();return r}setTurn(t){return this._turn!=t&&(this.move("--"),!0)}turn(){return this._turn}board(){const t=[];let e=[];for(let r=Ox88.a8;r<=Ox88.h1;r++)null==this._board[r]?e.push(null):e.push({square:algebraic(r),type:this._board[r].type,color:this._board[r].color}),r+1&136&&(t.push(e),e=[],r+=8);return t}squareColor(t){if(t in Ox88){const e=Ox88[t];return(rank(e)+file(e))%2==0?"light":"dark"}return null}history({verbose:t=!1}={}){const e=[],r=[];for(;this._history.length>0;)e.push(this._undoMove());for(;;){const i=e.pop();if(!i)break;t?r.push(new Move(this,i)):r.push(this._moveToSan(i,this._moves())),this._makeMove(i)}return r}_getPositionCount(t){return this._positionCount.get(t)??0}_incPositionCount(){this._positionCount.set(this._hash,(this._positionCount.get(this._hash)??0)+1)}_decPositionCount(t){const e=this._positionCount.get(t)??0;1===e?this._positionCount.delete(t):this._positionCount.set(t,e-1)}_pruneComments(){const t=[],e={},r=t=>{t in this._comments&&(e[t]=this._comments[t])};for(;this._history.length>0;)t.push(this._undoMove());for(r(this.fen());;){const e=t.pop();if(!e)break;this._makeMove(e),r(this.fen())}this._comments=e}getComment(){return this._comments[this.fen()]}setComment(t){this._comments[this.fen()]=t.replace("{","[").replace("}","]")}deleteComment(){return this.removeComment()}removeComment(){const t=this._comments[this.fen()];return delete this._comments[this.fen()],t}getComments(){return this._pruneComments(),Object.keys(this._comments).map((t=>({fen:t,comment:this._comments[t]})))}deleteComments(){return this.removeComments()}removeComments(){return this._pruneComments(),Object.keys(this._comments).map((t=>{const e=this._comments[t];return delete this._comments[t],{fen:t,comment:e}}))}setCastlingRights(t,e){for(const r of["k","q"])void 0!==e[r]&&(e[r]?this._castling[t]|=SIDES[r]:this._castling[t]&=~SIDES[r]);this._updateCastlingRights();const r=this.getCastlingRights(t);return!(void 0!==e.k&&e.k!==r.k||void 0!==e.q&&e.q!==r.q)}getCastlingRights(t){return{[KING]:!!(this._castling[t]&SIDES.k),[QUEEN]:!!(this._castling[t]&SIDES.q)}}moveNumber(){return this._moveNumber}}exports.BISHOP="b",exports.BLACK="b",exports.Chess=Chess,exports.DEFAULT_POSITION=DEFAULT_POSITION,exports.KING="k",exports.KNIGHT="n",exports.Move=Move,exports.PAWN="p",exports.QUEEN="q",exports.ROOK="r",exports.SEVEN_TAG_ROSTER=SEVEN_TAG_ROSTER,exports.SQUARES=SQUARES,exports.WHITE="w",exports.validateFen=validateFen,exports.xoroshiro128=xoroshiro128;
return exports; })();

// ==== chess.js
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

// ==== view.js
// View model: the transform's answer shaped for the Liquid markup (data only, no markup). The panel is plain Framework
// markup in shared.liquid; only the board is drawn by the page script.
// Title bar modes: one table, so later modes plug in. instance: what the right side of the title bar says.
var MODES = {
  puzzles: { instance: 'Puzzles' },
  connect: { instance: 'Connect account' },
  games: { instance: 'Your games' },     // the user's correspondence games (source/games.js)
  profile: { instance: 'Profile' },       // the user's Lichess overview (source/profile.js)
  top: { instance: 'Top game' },         // reserved
  following: { instance: 'Following %s' } // reserved: a followed player, %s = name
};
function modeInstance(mode, arg) { var m = MODES[mode] || MODES.puzzles; return m.instance.replace('%s', arg || ''); }
var DAY_NAMES = 'S M T W T F S'.split(' ');
function signed(n) { return (n > 0 ? '+' : '') + n; }
// SAN split for figurines: the piece letter (K Q R B N or '' for a pawn) and the rest, e.g. "Qxe5+" -> ['Q', 'xe5+'].
function sanParts(san) { var s = String(san || ''), m = /^([KQRBN])(.*)$/.exec(s); return m ? [m[1], m[2]] : ['', s]; }
function viewModel(out, nowS) {
  var P = out.puzzle, A = out.account;
  out.mode = out.connect ? 'connect' : out.mode || 'puzzles';   // 'games' is set by runGames
  out.instance = modeInstance(out.mode);
  out.instance_long = out.instance;
  if (P && P.themes && P.themes.length) out.instance_long = out.instance + ' · ' + P.themes[0];
  if (!P) return out;
  out.turn_w = P.turn === 'w';
  var games = out.mode === 'games';
  out.find = games ? (out.turn_w ? out.t.play_w : out.t.play_b) : out.turn_w ? out.t.find_w : out.t.find_b;
  var list = (P.moves || []).slice(-8), lastB = list.length ? !!list[list.length - 1][2] : false;
  out.rows = list.map(function (m, i) {
    var w = sanParts(m[1] || '...'), b = sanParts(m[2]), last = i === list.length - 1, back = list.length - 1 - i;
    return { n: +m[0] || 0, wp: w[0], ws: w[1], bp: b[0], bs: b[1], hw: last && !lastB, hb: last && lastB, back: back };
  });
  if (games) {
    var G = P.game || {}, ph = G.phase || 'turn', t = out.t, tl = G.left;
    out.opp_line = G.opp ? (G.opp.length > 16 ? G.opp.slice(0, 15) + '…' : G.opp) + (G.opp_rating ? ' (' + G.opp_rating + ')' : '') : '';
    out.opp_short = G.opp ? (G.opp.length > 10 ? G.opp.slice(0, 9) + '…' : G.opp) : '';   // the quadrant has no room for the rating
    out.meta = G.kind || '';
    out.heading = ph === 'wait' ? t.their_turn : ph === 'last' ? t.last_game : t.your_turn;
    out.heading_short = ph === 'wait' ? t.waiting_short : ph === 'last' ? t.finished_short : t.your_turn;
    if (ph === 'wait') out.find = t.waiting_for + ' ' + out.opp_short;
    if (ph === 'last') out.find = t.vs + ' ' + out.opp_line;
    out.time_label = ph === 'wait' ? t.waiting_for : ph === 'last' ? '' : t.time_left;
    out.time_value = ph === 'wait' ? out.opp_line.replace(/ \(\d+\)$/, '') : ph === 'last' ? G.res : tl;
    out.time_small = ph === 'wait';
    out.time_value_short = ph === 'turn' && tl ? (tl === t.no_limit ? '-' : String(tl).split(' ')[0]) : out.time_value;   // the quadrant: the largest unit only ("8h")
    out.time_sub = ph === 'wait' ? (G.opp_rating ? '(' + G.opp_rating + ')' : '') : ph === 'last' ? t.in_moves + ' ' + G.n_moves + ' ' + t.moves_w : out.opp_line;
    out.time_sub_short = ph === 'wait' ? '' : ph === 'last' ? G.n_moves + ' ' + t.moves_w : out.opp_short;
    out.time_sub_all = ph === 'last';
    out.show_info = ph !== 'last' || !!(out.problems && out.problems.length) || !!out.stale || !!out.notice;
    return out;
  }
  out.meta = [P.rating ? out.t.difficulty + ' ' + P.rating : '', P.themes && P.themes[0] ? P.themes[0] : ''].filter(Boolean).join(' · ');
  if (A) {
    out.change = A.trend && A.trend !== 'flat' && A.delta ? signed(A.delta) : '';
    out.chips = (A.recent || []).slice(0, 3).reverse().map(function (d) { return { text: signed(d), up: d >= 0 }; });
    if (A.days) {
      var s = 0, f = 0, d0 = new Date(nowS * 1000).getUTCDay();
      A.days.forEach(function (x) { s += x.s; f += x.f; });
      out.week_line = s + ' ' + out.t.solved_n + ' · ' + f + ' ' + out.t.failed_n;   // short lines: a label does not wrap
      out.week_title = out.t.this_week;
      out.streak_line = out.caps && out.caps.streak && A.streak ? out.t.streak + ' ' + A.streak : '';
      out.days = A.days.map(function (x, i) { return { name: DAY_NAMES[(d0 - (6 - i) + 70) % 7], on: x.s > 0, today: i === 6 }; });
    }
  }
  return out;
}

// ==== puzzle.js
// Lichess (unofficial) TRMNL plugin: serverless transform (Node). The Lichess daily puzzle; with a Lichess (OAuth)
// login the next puzzle at the user's level, kept until solved, plus progress. Hands the page the board, texts and the QR target.
var UA = 'TRMNL Chess Puzzle plugin (contact: https://github.com/ExcuseMi)';
var ST_MAX = 7500;
var T_EN = { white: 'White to move', black: 'Black to move', side_w: 'White', side_b: 'Black', to_move: 'to move', days: 'S M T W T F S', this_week: 'This week', solved_n: 'solved', failed_n: 'failed', your_turn: 'Your turn', find_w: 'White to move', find_b: 'Black to move', puzzle_n: 'Puzzle', difficulty: 'Rating', from_game: 'From game', played: 'Played', times: 'times',  scan: 'Scan to solve', rating: 'Puzzle', none: 'No puzzle today', none2: 'Could not reach the puzzle service. Showing again at the next refresh.', offline: 'Offline, last puzzle', connect_title: 'Connect Lichess', connect_line: 'Connect your Lichess account on the plugin settings page.', tokbad: 'Lichess login expired: reconnect on the plugin settings page.', scope: 'Reconnect Lichess: missing puzzle permission', solved: 'Solved!', today: 'today', week: 'this week', streak: 'streak', rating_you: 'Your rating', vs: 'vs', connect: 'Connect Lichess to track your progress' };

function field(input, k, d) { var f = (((input || {}).trmnl || {}).plugin_settings || {}).custom_fields_values || (input || {}); var v = f[k]; return v == null || v === '' ? d : v; }
function nowSec(input) { return +((((input || {}).trmnl || {}).system || {}).timestamp_utc) || Math.floor(Date.now() / 1000); }
function stObj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : null; }

async function getRaw(url, headers, ms, opts) {
  var ctl = typeof AbortController === 'function' ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 2500);
  try {
    var r = await fetch(url, Object.assign({ headers: Object.assign({ 'User-Agent': UA, 'Accept': 'application/json' }, headers || {}), signal: ctl ? ctl.signal : undefined }, opts || {}));
    var text = await r.text();
    return { status: r.status, text: text };
  } finally { clearTimeout(to); }
}
async function getJson(url, headers, ms) {
  var r = await getRaw(url, headers, ms);
  if (r.status !== 200) { var e = new Error('http ' + r.status); e.status = r.status; throw e; }
  return JSON.parse(r.text);
}

var THEME_SKIP = { long: 1, short: 1, veryLong: 1, oneMove: 1, crushing: 1, advantage: 1, equality: 1, opening: 1, middlegame: 1 };
function themeWords(t) {
  var m = /^mateIn(\d)$/.exec(t);
  if (m) return 'Mate in ' + m[1];
  var s = String(t).replace(/([A-Z])/g, ' $1').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function shortThemes(list) {
  var l = (Array.isArray(list) ? list : []).filter(function (t) { return !THEME_SKIP[t]; });
  l.sort(function (a, b) { return (/^mateIn/.test(b) ? 1 : 0) - (/^mateIn/.test(a) ? 1 : 0); });
  return l.slice(0, 2).map(themeWords);
}
function clean(s) { return String(s || '').replace(/[^\x20-\x7e -ɏ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60); }

function lichessModel(j) {
  var q = lichessPosition(j), p = j.puzzle || {};
  if (!p.id) throw new Error('no puzzle id');
  var last = q.last || '';
  return { source: 'lichess', id: String(p.id), url: 'https://lichess.org/training/' + encodeURIComponent(p.id), board: q.board, turn: q.turn,
    from: sqIndex(last.slice(0, 2)), to: sqIndex(last.slice(2, 4)), rating: +p.rating || 0, themes: shortThemes(p.themes), title: '', moves: lichessMoves(j), plays: +p.plays || 0, game: lichessGame(j.game) };
}
// The game the puzzle comes from: "3+0 Blitz" and the two players [colour, name, rating], cleaned like every other text.
function lichessGame(g) {
  if (!g || typeof g !== 'object') return null;
  var players = (Array.isArray(g.players) ? g.players : []).filter(function (x) { return x && (x.color === 'white' || x.color === 'black'); }).slice(0, 2)
    .map(function (x) { return [x.color === 'white' ? 'w' : 'b', clean(x.name || x.id || '?').slice(0, 24), +x.rating || 0]; });
  players.sort(function (a, b) { return a[0] === 'w' ? -1 : b[0] === 'w' ? 1 : 0; });
  var perf = clean((g.perf && g.perf.name) || ''), clock = /^\d{1,3}\+\d{1,3}$/.test(g.clock || '') ? g.clock : '';
  return { kind: clean((clock ? clock + ' ' : '') + perf), players: players };
}

function accountFromActivity(lines, nowS) {
  var days = [], i, streak = 0, streakOn = true, today = 0, week = 0, d0 = Math.floor(nowS / 86400);
  for (i = 0; i < 7; i++) days.push({ s: 0, f: 0 });
  lines.forEach(function (a) {
    var d = d0 - Math.floor((+a.date || 0) / 86400000);
    if (streakOn) { if (a.win) streak++; else streakOn = false; }
    if (d >= 0 && d < 7) { if (a.win) days[6 - d].s++; else days[6 - d].f++; if (a.win) { week++; if (d === 0) today++; } }
  });
  return { days: days, today: today, week: week, streak: streak };
}
function ndjson(text) { return String(text).split('\n').filter(Boolean).map(function (l) { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean); }

// ==== Providers. One interface, the view reads only the normalised model and the capability flags.
//   id, capabilities (what the provider can do at all), active(ctx) (what it can do for this user now),
//   fetchPuzzle(ctx) -> puzzle { source, id, url, board, turn, from, to, rating, themes, title }
//   fetchProgress(ctx) -> progress { rating, label, delta, trend, history[], today, week, streak, days[7]{s,f}, name } or null
//   isSolved(puzzleId, ctx) -> boolean (only where capabilities.solvedCheck)
// ctx: { settings, token, state, nowS, cache }; a provider may cache one fetch in ctx.cache.
var NO_CAPS = { personalPuzzles: false, solvedCheck: false, ratingHistory: false, streak: false };

function authHeader(ctx) { return { Authorization: 'Bearer ' + ctx.token }; }
var LT = 3500;   // each Lichess call; they run side by side inside TRMNL's 5 s
// The last puzzles (newest first), only for the solved check and the streak: an optional extra (max 20, short timeout),
// never blocking and never shown as a failure. The week comes from lichessWeek.
async function lichessActivity(ctx) {
  ctx.diag = ctx.diag || {};
  if (!ctx.cache.activity) {
    ctx.cache.activity = getRaw('https://lichess.org/api/puzzle/activity?max=20', Object.assign({ Accept: 'application/x-ndjson' }, authHeader(ctx)), 2500)
      .then(function (r) { return r.status === 200 ? ndjson(r.text) : []; }, function () { return []; });
  }
  return ctx.cache.activity;
}
// The week, per day: GET /api/user/{name}/activity (public, one small JSON, fast). Each day's puzzles score gives solved,
// failed and the rating before and after. A failed call reuses the last good week from the saved state and says so on screen.
async function lichessWeek(ctx, uname) {
  ctx.diag = ctx.diag || {};
  var saved = function (why) {
    var s = stObj(ctx.state.wk);
    ctx.diag.activity = why; ctx.cache.weekSaved = true;
    return s && Array.isArray(s.d) ? s.d : [];
  };
  try {
    var j = await getJson('https://lichess.org/api/user/' + uname + '/activity', {}, LT);
    if (!Array.isArray(j)) return saved('bad answer');
    var rows = [];
    j.forEach(function (d) {
      var sc = d && d.puzzles && d.puzzles.score, st = d && d.interval ? +d.interval.start : 0;
      if (!st) return;
      rows.push([st, sc ? +sc.win || 0 : 0, sc ? +sc.loss || 0 : 0, sc && sc.rp ? +sc.rp.before || 0 : 0, sc && sc.rp ? +sc.rp.after || 0 : 0]);
    });
    if (!rows.some(function (r) { return r[1] + r[2] > 0; })) ctx.diag.activity = '0 puzzles this week';
    return rows.slice(0, 10);
  } catch (e) { return saved(callError(e)); }
}
// days[7] (oldest first, today last) from the per-day rows; recent: the rating change of the last days with puzzles, newest first.
function weekFromDays(rows, nowS) {
  var days = [], i, d0 = Math.floor(nowS / 86400), recent = [];
  for (i = 0; i < 7; i++) days.push({ s: 0, f: 0 });
  rows.slice().sort(function (a, b) { return b[0] - a[0]; }).forEach(function (r) {
    var d = d0 - Math.floor(r[0] / 86400000);
    if (d < 0 || d > 6) return;   // chips and counts cover the same 7 days
    days[6 - d].s += r[1]; days[6 - d].f += r[2];
    if (r[1] + r[2] > 0 && r[3] && r[4] && recent.length < 6) recent.push(r[4] - r[3]);
  });
  var week = 0; days.forEach(function (x) { week += x.s; });
  return { days: days, today: days[6].s, week: week, recent: recent };
}
function callError(e) { return e && e.name === 'AbortError' ? 'timeout' : e && e.status ? 'HTTP ' + e.status : 'error ' + String((e && e.message) || e).slice(0, 40); }
// The scopes the connected token carries (POST /api/token/test); '' when unknown. The answer is keyed by the token: never kept.
async function lichessScopes(ctx) {
  ctx.diag = ctx.diag || {};
  if (!ctx.cache.scopes) {
    ctx.cache.scopes = getRaw('https://lichess.org/api/token/test', { 'Content-Type': 'text/plain' }, LT, { method: 'POST', body: ctx.token }).then(function (r) {
      if (r.status !== 200) { ctx.diag.scopes = 'http ' + r.status; return ''; }
      var j = JSON.parse(r.text), v = j && typeof j === 'object' ? j[Object.keys(j)[0]] : null;
      var s = v && typeof v.scopes === 'string' ? v.scopes : '';
      ctx.diag.scopes = s || (v ? 'none' : 'unknown token');
      return v ? s || 'none' : '';
    }).catch(function () { ctx.diag.scopes = 'error'; return ''; });
  }
  return ctx.cache.scopes;
}
async function lichessAccountInfo(ctx) {
  if (!ctx.cache.account) { ctx.diag = ctx.diag || {}; ctx.cache.account = getJson('https://lichess.org/api/account', authHeader(ctx), LT); ctx.cache.account.catch(function (e) { ctx.diag.account = callError(e); }); }
  return ctx.cache.account;   // a rejected promise is cached too: one 401 is one call
}
var lichessProvider = {
  id: 'lichess',
  capabilities: { personalPuzzles: true, solvedCheck: true, ratingHistory: true, streak: true },
  active: function (ctx) { return ctx.token ? this.capabilities : NO_CAPS; },
  fetchPuzzle: async function (ctx) {
    if (!ctx.cache.next) ctx.cache.next = getJson('https://lichess.org/api/puzzle/next?difficulty=' + encodeURIComponent(ctx.settings.difficulty || 'normal'), authHeader(ctx), LT);
    return lichessModel(await ctx.cache.next);
  },
  fetchProgress: async function (ctx) {
    if (!ctx.token) return null;
    var acct = await lichessAccountInfo(ctx);   // throws with .status 401 on a bad token
    var uname = /^[A-Za-z0-9_-]{2,30}$/.test(acct.username || '') ? acct.username : '';
    var got = await Promise.allSettled([uname ? lichessWeek(ctx, uname) : Promise.resolve([]), uname ? getJson('https://lichess.org/api/user/' + uname + '/rating-history', authHeader(ctx), LT) : Promise.reject(new Error('no user')), lichessActivity(ctx)]);
    var rows = got[0].status === 'fulfilled' ? got[0].value : [], hist = [];
    ctx.cache.weekRows = rows;
    if (got[1].status === 'rejected' && uname) ctx.diag.history = callError(got[1].reason);
    if (got[1].status === 'fulfilled' && Array.isArray(got[1].value)) {
      var pz = got[1].value.filter(function (x) { return x && x.name === 'Puzzles'; })[0];
      if (pz && Array.isArray(pz.points)) hist = pz.points.slice(-30).map(function (q) { return +q[3] || 0; }).filter(Boolean);
    }
    var rating = acct.perfs && acct.perfs.puzzle ? +acct.perfs.puzzle.rating || 0 : 0;
    var act = got[2].status === 'fulfilled' ? got[2].value : [], streak = 0;
    for (var i = 0; i < act.length && act[i].win; i++) streak++;
    var wk = weekFromDays(rows, ctx.nowS);
    return Object.assign(wk, { rating: rating, label: 'rating_you', history: hist, name: uname, streak: act.length ? streak : 0 });
  },
  isSolved: async function (id, ctx) { return (await lichessActivity(ctx)).some(function (a) { return a.win && a.puzzle && a.puzzle.id === id; }); }
};
var PROVIDERS = { lichess: lichessProvider };

function slim(m) { return { source: m.source, id: m.id, url: m.url, board: m.board, turn: m.turn, from: m.from, to: m.to, rating: m.rating, themes: m.themes, title: m.title, moves: m.moves || [], plays: m.plays || 0, game: m.game || null }; }
function fitState(st) { if (JSON.stringify(st).length > ST_MAX) { delete st.last; if (JSON.stringify(st).length > ST_MAX) delete st.wk; } return st; }

async function run(input) {
  var nowS = nowSec(input), st0 = stObj((((input || {}).trmnl || {}).state)) || {};
  var orient = 'side', coords = true;   // fixed (owner 2026-11-14): side to move at the bottom, coordinates shown
  var oauth = stObj(((input || {}).trmnl || {}).oauth) || {}, token = String(oauth.access_token || '').trim();   // Lichess login: OAuth only
  var which = 'lichess';
  if (!token) return viewModel({ t: T_EN, connect: true, none: true, trmnl_state: fitState(stObj(st0.wk) ? { v: 1, rating: +st0.rating || 0, wk: st0.wk } : { v: 1, rating: +st0.rating || 0 }) }, nowS);   // OAuth is required (owner 2026-11-14)
  if (String(field(input, 'mode', 'puzzles')) === 'games') return runGames(input, token, nowS, st0);   // "Your games" (source/games.js)
  if (String(field(input, 'mode', 'puzzles')) === 'profile') return runProfile(input, token, nowS, st0);   // "Profile" (source/profile.js)
  var prov = PROVIDERS[which];
  var ctx = { settings: { difficulty: String(field(input, 'difficulty', 'normal')) }, token: which === 'lichess' ? token : '', state: st0, nowS: nowS, cache: {}, diag: {} };
  if (ctx.token) {   // every Lichess call starts now, side by side: activity, scopes, account and a next puzzle in case it is needed
    lichessActivity(ctx); lichessScopes(ctx); lichessAccountInfo(ctx).catch(function () {});   // the week follows the account (it needs the name)
    ctx.cache.next = getJson('https://lichess.org/api/puzzle/next?difficulty=' + encodeURIComponent(ctx.settings.difficulty || 'normal'), authHeader(ctx), LT);
    ctx.cache.next.catch(function (e) { ctx.diag.next = callError(e); });
  }
  var model = null, progress = null, banner = '', notice = '', stale = false, cur = null, caps = prov.active(ctx), rating = +st0.rating || 0;
  var prevCur = stObj(st0.cur), last0 = stObj(st0.last);
  try { progress = await prov.fetchProgress(ctx); } catch (e) { progress = null; if (e && e.status === 401) { notice = 'tokbad'; ctx.token = ''; caps = NO_CAPS; } }
  if (progress && progress.rating && which === 'lichess') {
    var base = prevCur && prevCur.r0 ? +prevCur.r0 : rating;   // the rating when the shown puzzle was picked: the change since then
    if (base) { progress.delta = progress.rating - base; progress.trend = progress.rating > base ? 'up' : progress.rating < base ? 'down' : 'flat'; }
    rating = progress.rating;
  }
  var keep = false;
  if (caps.solvedCheck && prevCur && prevCur.id) {
    var solved = false;
    try { solved = await prov.isSolved(prevCur.id, ctx); } catch (e) { solved = false; }
    if (solved) banner = progress && progress.rating && prevCur.r0 ? T_EN.solved + ' ' + (progress.rating - prevCur.r0 >= 0 ? '+' : '') + (progress.rating - prevCur.r0) : T_EN.solved;
    keep = !solved && nowS - (+prevCur.t || 0) < 86400 && !!last0 && last0.id === prevCur.id;
  }
  if (keep) { model = last0; cur = prevCur; }
  else {
    try { model = await prov.fetchPuzzle(ctx); if (caps.personalPuzzles) cur = { id: model.id, t: nowS, r0: rating }; }
    catch (e) {
      if (e && e.status === 401) { notice = 'tokbad'; caps = NO_CAPS; progress = null; }
      model = null;
    }
  }
  if (notice === 'tokbad') return viewModel({ t: T_EN, connect: true, none: true, notice: T_EN.tokbad, trmnl_state: fitState({ v: 1, rating: rating || 0 }) }, nowS);   // a rejected login: reconnect
  if (!model && last0 && last0.board) { model = last0; stale = true; }
  var flip = orient === 'black' ? true : orient === 'white' ? false : !!(model && model.turn === 'b');
  if (ctx.token || ctx.cache.scopes) {
    var scopes = ctx.cache.scopes ? await ctx.cache.scopes : '';
    if (scopes && !/(^|[ ,])puzzle:read([ ,]|$)/.test(scopes) && !notice) notice = 'scope';
  }
  var out = { t: T_EN, none: !model, stale: stale, notice: notice ? T_EN[notice] : '', banner: banner, account: progress, caps: { personal: !!caps.personalPuzzles, solved: !!caps.solvedCheck, history: !!caps.ratingHistory, streak: !!caps.streak }, coords: coords, white_bottom: !flip, show_account: !!progress };
  if (model) { out.puzzle = model; out.to_move = model.turn === 'w' ? T_EN.white : T_EN.black; }
  var st = { v: 1, rating: rating || 0 };
  if (model && !stale) st.last = slim(model); else if (last0) st.last = last0;
  if (cur) st.cur = cur;
  if (ctx.cache.weekRows && ctx.cache.weekRows.length && !ctx.cache.weekSaved) st.wk = { t: nowS, d: ctx.cache.weekRows };   // the last good week, for a failed call
  else if (stObj(st0.wk)) st.wk = st0.wk;
  // A Lichess call that failed is said on screen, always (owner 2026-11-14): "Lichess activity: timeout", "HTTP 429", "0 items".
  var problems = [];
  if (ctx.diag.activity) problems.push('Lichess activity: ' + ctx.diag.activity);
  ['account', 'history', 'next'].forEach(function (k) { if (ctx.diag[k]) problems.push('Lichess ' + k + ': ' + ctx.diag[k]); });
  if (problems.length) out.problems = problems;
  out.trmnl_state = fitState(st);
  return viewModel(out, nowS);
}
if (typeof module !== 'undefined' && module.exports) module.exports = { PROVIDERS: PROVIDERS, run: run, viewModel: viewModel, MODES: MODES, parseFen: parseFen, lichessPosition: lichessPosition, lichessModel: lichessModel, lichessMoves: lichessMoves, accountFromActivity: accountFromActivity, weekFromDays: weekFromDays, shortThemes: shortThemes };

// ==== games.js
// "Your games" mode: the user's correspondence games where it is their turn (GET /api/account/playing, no scope needed beyond a
// valid token). The most urgent game (least time left) is shown; the others are only counted. Same view model as a puzzle:
// out.puzzle is the position to draw (board, last move, QR target), out.game the opponent and the time left.
var G_EN = { play_w: 'Play white', play_b: 'Play black', scan: 'Scan to move', time_left: 'Time to move', time_short: 'Time left', more_one: 'more game waiting', more_n: 'more games waiting',
  none: 'No games waiting for you', in_moves: 'in', moves_w: 'moves', none_new: 'Start a game on lichess.org.', their_turn: 'Their turn', waiting_short: 'Waiting', finished_short: 'Finished', last_game: 'Last game', waiting_for: 'Waiting for', result: 'Result', scan_view: 'Scan to view', scan_new: 'Start a new game', won_w: 'Won', lost_w: 'Lost', drew_w: 'Draw', won_l: 'Won against', lost_l: 'Lost to', drew_l: 'Drew with', wait_one: 'game waiting for opponents', wait_n: 'games waiting for opponents', none2: 'Could not reach Lichess. Showing again at the next refresh.', offline: 'Offline, last game', scope_games: 'Reconnect Lichess: missing game permission',
  won: 'Last game: won against', lost: 'Last game: lost to', drew: 'Last game: drew with', opp_wait_one: '1 game waits for the opponent', opp_wait_n: ' games wait for the opponent', no_limit: 'No limit' };
var GAME_ID = /^[A-Za-z0-9]{8}$/;
function timeLeft(sec) {   // "2d 4h", "5h 20m", "12m", "<1m"; null: a game without a clock
  if (sec == null || !isFinite(sec)) return G_EN.no_limit;
  sec = Math.max(0, Math.floor(sec));
  var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
  if (d) return d + 'd' + (h ? ' ' + h + 'h' : '');
  if (h) return h + 'h' + (m ? ' ' + m + 'm' : '');
  return m ? m + 'm' : '<1m';
}
// The games to move on: correspondence only, valid id and position, least time left first (no clock last).
function gamesToMove(list) {
  var mine = (Array.isArray(list) ? list : []).filter(function (g) { return g && g.isMyTurn && g.speed === 'correspondence' && GAME_ID.test(g.gameId || '') && typeof g.fen === 'string' && (g.color === 'white' || g.color === 'black'); });
  var key = function (g) { return g.secondsLeft == null || !isFinite(g.secondsLeft) ? Infinity : +g.secondsLeft; };
  return mine.sort(function (a, b) { return key(a) - key(b); });
}
function gameModel(g, nowS, sans, phase) {
  var turn = g.color === 'white' ? 'w' : 'b', fen = g.fen.indexOf(' ') < 0 ? g.fen + ' ' + turn : g.fen, q = parseFen(fen), last = String(g.lastMove || '');
  var opp = g.opponent || {}, name = clean(opp.username || opp.id || (opp.ai ? 'Computer' : 'Anonymous')).slice(0, 24);
  return { source: 'game', id: g.gameId, url: 'https://lichess.org/' + g.gameId, board: q.board, turn: turn, from: sqIndex(last.slice(0, 2)), to: sqIndex(last.slice(2, 4)),
    rating: 0, themes: [], title: '', moves: sans ? sanPairs(sans, q.board) : [], plays: 0,
    game: { opp: name, opp_rating: +opp.rating || 0, due: g.secondsLeft == null ? 0 : nowS + Math.floor(+g.secondsLeft), kind: g.rated ? 'Correspondence, rated' : 'Correspondence', phase: phase || 'turn' } };
}
// SAN list -> move pairs [number, white, black] (last MOVES_MAX), only when chess.js replays it to the board shown (variants do not: no list).
function sanPairs(sans, board) {
  var ch = new CHESSJS.Chess(), out = [];
  try { sans.forEach(function (s) { out.push(ch.move(s).san); }); } catch (e) { return []; }
  if (parseFen(ch.fen()).board !== board) return [];
  var pairs = [];
  for (var k = 0; k < out.length; k += 2) pairs.push([k / 2 + 1, out[k], out[k + 1] || '']);
  return pairs.slice(-MOVES_MAX);
}
// A finished game from its SAN list: board, last move and the move pairs; null when chess.js cannot replay it (variants).
function replayGame(sans) {
  var ch = new CHESSJS.Chess(), last = null, out = [];
  try { sans.forEach(function (s) { last = ch.move(s); out.push(last.san); }); } catch (e) { return null; }
  var pairs = [];
  for (var k = 0; k < out.length; k += 2) pairs.push([k / 2 + 1, out[k], out[k + 1] || '']);
  return { board: parseFen(ch.fen()).board, from: last ? sqIndex(last.from) : -1, to: last ? sqIndex(last.to) : -1, moves: pairs.slice(-MOVES_MAX) };
}
function slimGame(m) { return { source: m.source, id: m.id, url: m.url, board: m.board, turn: m.turn, from: m.from, to: m.to, rating: 0, themes: [], title: '', moves: m.moves || [], plays: 0, game: m.game }; }
// A finished game row of GET /api/games/user (ndjson): { res: won|lost|drew, color: white|black, opp, opp_rating } or null.
function lastGameInfo(g, me) {
  if (!g || !g.players || !g.winner && g.status !== 'draw' && g.status !== 'stalemate') return null;
  var w = g.players.white || {}, b = g.players.black || {}, mine = ((w.user || {}).name || '').toLowerCase() === me.toLowerCase() ? 'white' : 'black', o = mine === 'white' ? b : w;
  return { res: g.winner ? (g.winner === mine ? 'won' : 'lost') : 'drew', color: mine, opp: clean(((o.user || {}).name) || (o.aiLevel ? 'Computer' : 'Anonymous')).slice(0, 24), opp_rating: +o.rating || 0 };
}
function lastGameLine(g, me) { var i = lastGameInfo(g, me); return i ? G_EN[i.res + '_l'] + ' ' + i.opp : ''; }

async function runGames(input, token, nowS, st0) {
  var t0 = Date.now(), ctx = { token: token }, H = authHeader(ctx), T = Object.assign({}, T_EN, G_EN), diag = {}, saved = stObj(st0.gm);
  var playing = getJson('https://lichess.org/api/account/playing?nb=50', H, LT);
  var acct = getJson('https://lichess.org/api/account', H, LT); acct.catch(function () {});
  var data = null, mine = [], theirs = [], model = null, stale = false, line = '', phase = '', moreLine = '', moreShort = '';
  var keep = function (st) { ['rating', 'wk', 'last', 'cur'].forEach(function (k) { if (st0[k] != null) st[k] = st0[k]; }); return st; };   // the puzzle mode's state stays for the way back
  try { data = await playing; } catch (e) {
    if (e && e.status === 401) return viewModel({ t: T, connect: true, none: true, notice: T.tokbad, trmnl_state: fitState(keep({ v: 1 })) }, nowS);
    if (e && e.status === 403) return viewModel({ t: T, connect: true, none: true, notice: T.scope_games, trmnl_state: fitState(keep({ v: 1 })) }, nowS);
    diag.games = callError(e);
  }
  if (data) {
    var list = Array.isArray(data.nowPlaying) ? data.nowPlaying : null;
    if (!list) diag.games = 'bad answer';
    else {
      mine = gamesToMove(list);
      theirs = list.filter(function (g) { return g && g.speed === 'correspondence' && !g.isMyTurn && GAME_ID.test(g.gameId || '') && typeof g.fen === 'string' && (g.color === 'white' || g.color === 'black'); });
    }
  }
  var left = function () { return Math.max(400, Math.min(2200, 4800 - (Date.now() - t0))); };   // inside TRMNL's 5 s
  var shown = mine[0] || theirs[0];   // my turn: the most urgent; else the first game the opponent is to move in (the API lists the most urgent first)
  if (shown) {
    phase = mine.length ? 'turn' : 'wait';
    var sans = null;
    try {
      var j = await getJson('https://lichess.org/game/export/' + shown.gameId + '?moves=true&tags=false&clocks=false&evals=false&opening=false', H, left());
      sans = typeof j.moves === 'string' ? j.moves.split(/\s+/).filter(Boolean) : null;
    } catch (e) { diag.moves = callError(e); }
    model = gameModel(shown, nowS, sans, phase);
    if (phase === 'turn' && mine.length > 1) { var m = mine.length - 1; moreLine = m + ' ' + (m === 1 ? T.more_one : T.more_n); moreShort = '+' + m + ' waiting'; }
    if (phase === 'wait') { var n = theirs.length; moreLine = n + ' ' + (n === 1 ? T.wait_one : T.wait_n); moreShort = n + ' waiting'; }
  } else if (diag.games && saved && saved.board) { model = saved; phase = (saved.game || {}).phase || 'turn'; stale = true; }
  else if (!diag.games) {   // no ongoing game at all: the last finished correspondence game, with its result
    try {
      var a = await acct, un = /^[A-Za-z0-9_-]{2,30}$/.test(a.username || '') ? a.username : '';
      if (un) {
        var r = await getRaw('https://lichess.org/api/games/user/' + un + '?max=1&perfType=correspondence&ongoing=false&moves=true&tags=false&clocks=false&evals=false&opening=false', Object.assign({ Accept: 'application/x-ndjson' }, H), left());
        if (r.status !== 200) throw Object.assign(new Error('http'), { status: r.status });
        var row = ndjson(r.text)[0], info = lastGameInfo(row, un);
        if (info) {
          line = G_EN[info.res + '_l'] + ' ' + info.opp;
          var rp = typeof row.moves === 'string' ? replayGame(row.moves.split(/\s+/).filter(Boolean)) : null;
          if (rp) {
            phase = 'last';
            model = { source: 'game', id: String(row.id || ''), url: 'https://lichess.org/', board: rp.board, turn: info.color === 'white' ? 'w' : 'b', from: rp.from, to: rp.to, rating: 0, themes: [], title: '', moves: rp.moves, plays: 0,
              game: { opp: info.opp, opp_rating: info.opp_rating, due: 0, kind: 'Correspondence', phase: 'last', res: G_EN[info.res + '_w'], result_line: line, n_moves: Math.ceil(row.moves.split(/\s+/).filter(Boolean).length / 2) } };
          }
        }
      }
    } catch (e) { diag.last = callError(e); }
  }
  var out = { t: T, mode: 'games', none: !model, calm: !model, stale: stale, notice: '', banner: '', account: null, show_account: false, caps: {}, coords: true, white_bottom: true, lines: line ? [line] : [] };
  if (model) {
    model.game = Object.assign({}, model.game);   // time left now, from the deadline
    model.game.left = model.game.due ? timeLeft(model.game.due - nowS) : timeLeft(null);
    out.puzzle = model; out.more_line = stale ? '' : moreLine; out.more_short = stale ? '' : moreShort;
    out.to_move = model.turn === 'w' ? T.white : T.black; out.white_bottom = model.turn === 'w';
    out.phase = phase; out.t = Object.assign({}, T, { scan: phase === 'last' ? T.scan_new : phase === 'wait' ? T.scan_view : T.scan });
  } else out.calm_line = diag.games ? T.none2 : T.none_new;
  var st = keep({ v: 1 });
  if (model && !stale && phase !== 'last') st.gm = slimGame(model); else if (stale) st.gm = saved;
  var problems = [];
  if (diag.games) problems.push('Lichess games: ' + diag.games);
  if (diag.moves) problems.push('Lichess moves: ' + diag.moves);
  if (diag.last) problems.push('Lichess last game: ' + diag.last);
  if (problems.length) out.problems = problems;
  out.trmnl_state = fitState(st);
  return viewModel(out, nowS);
}

// ==== profile.js
// "Profile" mode (mode = profile): the user's Lichess overview at a glance, no board. Calls (all inside TRMNL's 5 s, side by side
// once the name is known): GET /api/account (token), GET /api/user/{name}/rating-history (public), GET /api/games/user/{name}?max=10&rated=true
// (ndjson). The last good profile is saved in the state ("pf") and stands in for a call that fails (said on screen).
var PF_EN = { none: 'No profile to show', none2: 'Could not reach Lichess. Showing again at the next refresh.', member: 'Member since', ratings: 'Ratings', rating_h: 'Rating', change_h: '30 days', games_h: 'Games',
  chart_h: 'last 90 days', recent: 'Recent games', no_recent: 'No rated games yet', s_games: 'Games', s_record: 'Won / lost / drawn', s_time: 'Time played', s_puzzles: 'Puzzles', s_storm: 'Storm best', offline_pf: 'Offline, last profile', low: 'Low', high: 'High', games_w: 'games' };
// perf key -> [name, short name for narrow views]; the keys of GET /api/account "perfs". Storm, racer and streak are not rating perfs.
var PF_PERFS = { bullet: ['Bullet', 'Bullet'], ultraBullet: ['UltraBullet', 'Ultra'], blitz: ['Blitz', 'Blitz'], rapid: ['Rapid', 'Rapid'], classical: ['Classical', 'Classical'], correspondence: ['Correspondence', 'Corr.'],
  chess960: ['Chess960', '960'], crazyhouse: ['Crazyhouse', 'Crazy'], antichess: ['Antichess', 'Anti'], atomic: ['Atomic', 'Atomic'], horde: ['Horde', 'Horde'], kingOfTheHill: ['King of the Hill', 'KotH'],
  racingKings: ['Racing Kings', 'Racing'], threeCheck: ['Three-check', '3-check'], puzzle: ['Puzzles', 'Puzzles'] };
var PF_ROWS_MAX = 8, PF_DAYS = 90, PF_POINTS_MAX = 45, PF_FORM_MAX = 10, USER_RE = /^[A-Za-z0-9_-]{2,30}$/;
var MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
function num(n) { return String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function perfKey(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
// The history rows of one perf as [timestamp s, rating], oldest first (Lichess months count from 0). Names match by letters: "King of the Hill" = kingOfTheHill, "Puzzles" = puzzle.
function perfPoints(hist, key) {
  var want = key === 'puzzle' ? 'puzzles' : perfKey(key), e = (Array.isArray(hist) ? hist : []).filter(function (x) { return x && perfKey(x.name) === want && Array.isArray(x.points); })[0];
  return e ? e.points.filter(function (p) { return Array.isArray(p) && +p[3] > 0; }).map(function (p) { return [Date.UTC(+p[0], +p[1], +p[2]) / 1000, +p[3]]; }) : [];
}
// The rating change over the last 30 days: the rating now minus the last one on or before day -30 (else the first one inside the window); null without history.
function change30(points, now, nowS) {
  if (!points.length || !now) return null;
  var cut = nowS - 30 * 86400, base = null, i;
  for (i = 0; i < points.length; i++) if (points[i][0] <= cut) base = points[i][1];
  if (base == null) { for (i = 0; i < points.length; i++) if (points[i][0] > cut) { base = points[i][1]; break; } }
  return base == null ? null : now - base;
}
// The rows of the ratings panel: the perfs the user plays (games > 0), most played first.
function perfRows(acct, hist, nowS, oldRows) {
  var P = acct && acct.perfs && typeof acct.perfs === 'object' ? acct.perfs : {}, old = {};
  (oldRows || []).forEach(function (r) { old[r.k] = r; });
  return Object.keys(PF_PERFS).filter(function (k) { return P[k] && +P[k].games > 0 && +P[k].rating > 0; }).map(function (k) {
    var p = P[k], c = hist ? change30(perfPoints(hist, k), +p.rating, nowS) : old[k] ? old[k].change : null;
    return { k: k, name: PF_PERFS[k][0], short: PF_PERFS[k][1], rating: Math.round(+p.rating), prov: !!p.prov, games: +p.games, games_text: num(p.games), change: c == null || p.prov ? '' : signed(c) };
  }).sort(function (a, b) { return b.games - a.games; }).slice(0, PF_ROWS_MAX);
}
// The main chart: the rating of the most played rating perf (puzzles only when it is the only one) over the last 90 days; null under 2 points.
function chartFor(rows, hist, nowS) {
  var order = rows.filter(function (r) { return r.k !== 'puzzle'; }).concat(rows.filter(function (r) { return r.k === 'puzzle'; }));
  for (var i = 0; i < order.length; i++) {
    var cut = nowS - PF_DAYS * 86400, pts = perfPoints(hist, order[i].k), inside = pts.filter(function (p) { return p[0] >= cut; });
    if (inside.length < 2) continue;
    var v = inside.map(function (p) { return p[1]; });
    while (v.length > PF_POINTS_MAX) v = v.filter(function (x, j) { return j % 2 === 0 || j === v.length - 1; });
    return { k: order[i].k, name: order[i].name, pts: v, lo: Math.min.apply(null, v), hi: Math.max.apply(null, v) };
  }
  return null;
}
function statsFor(acct, rows) {
  var c = acct.count || {}, s = [], pt = acct.playTime && +acct.playTime.total, pz = acct.perfs && acct.perfs.puzzle, st = acct.perfs && acct.perfs.storm;
  if (+c.all > 0) s.push([PF_EN.s_games, num(c.all)]);
  if (+c.all > 0) s.push([PF_EN.s_record, num(c.win) + ' / ' + num(c.loss) + ' / ' + num(c.draw)]);
  if (pt > 0) s.push([PF_EN.s_time, timeLeft(pt)]);
  if (pz && +pz.games > 0 && +pz.rating > 0) s.push([PF_EN.s_puzzles, String(Math.round(+pz.rating))]);
  if (st && +st.runs > 0 && +st.score > 0) s.push([PF_EN.s_storm, num(st.score)]);
  return s;
}
// Results of the last rated games, oldest first (so the newest sits at the right): W / L / D.
function formFor(rows, me) {
  return rows.map(function (g) { var i = lastGameInfo(g, me); return i ? { c: i.res === 'won' ? 'W' : i.res === 'lost' ? 'L' : 'D' } : null; }).filter(Boolean).slice(0, PF_FORM_MAX).reverse();
}
async function runProfile(input, token, nowS, st0) {
  var t0 = Date.now(), H = authHeader({ token: token }), T = Object.assign({}, T_EN, PF_EN), diag = {}, saved = stObj(st0.pf), noop = function () {};
  var keep = function (st) { ['rating', 'wk', 'last', 'cur'].forEach(function (k) { if (st0[k] != null) st[k] = st0[k]; }); return st; };   // the puzzle mode's state stays for the way back
  var left = function () { return Math.max(400, Math.min(3500, 4800 - (Date.now() - t0))); };   // inside TRMNL's 5 s
  var acctP = getJson('https://lichess.org/api/account', H, LT); acctP.catch(noop);
  var start = function (u, ms) {   // rating history and the last games, side by side
    var h = getJson('https://lichess.org/api/user/' + u + '/rating-history', H, ms), g = getRaw('https://lichess.org/api/games/user/' + u + '?max=' + PF_FORM_MAX + '&rated=true&ongoing=false&moves=false&tags=false&clocks=false&evals=false&opening=false', Object.assign({ Accept: 'application/x-ndjson' }, H), Math.min(ms, 2200))
      .then(function (r) { if (r.status !== 200) throw Object.assign(new Error('http'), { status: r.status }); return ndjson(r.text); });
    h.catch(noop); g.catch(noop);
    return { h: h, g: g, u: u };
  };
  var guess = saved && USER_RE.test(saved.name || '') ? saved.name : '', calls = guess ? start(guess, LT) : null, acct = null;
  try { acct = await acctP; } catch (e) {
    if (e && (e.status === 401 || e.status === 403)) return viewModel({ t: T, connect: true, none: true, notice: T.tokbad, trmnl_state: fitState(keep({ v: 1 })) }, nowS);
    diag.account = callError(e);
  }
  var pf = null, stale = false, problems = [];
  if (acct && !USER_RE.test(acct.username || '')) { diag.account = 'bad answer'; acct = null; }
  if (acct) {
    if (!calls || calls.u.toLowerCase() !== acct.username.toLowerCase()) calls = start(acct.username, left());   // no saved name (or a renamed account): after the account
    var hist = null, games = null;
    try { hist = await calls.h; if (!Array.isArray(hist)) { hist = null; diag.history = 'bad answer'; } } catch (e) { diag.history = callError(e); }
    try { games = await calls.g; } catch (e) { diag.games = callError(e); }
    var sv = saved && saved.name === acct.username ? saved : null;   // a saved part only stands in for the same user
    var rows = perfRows(acct, hist, nowS, sv && sv.rows), ch = hist ? chartFor(rows, hist, nowS) : sv && sv.chart && rows.some(function (r) { return r.k === sv.chart.k; }) ? sv.chart : null;
    var form = games ? formFor(games, acct.username) : sv && sv.form || [];
    var ca = acct.createdAt ? new Date(+acct.createdAt) : null;
    pf = { name: acct.username, title: clean(acct.title || '').slice(0, 4), since: ca && isFinite(ca) ? MONTHS[ca.getUTCMonth()] + ' ' + ca.getUTCFullYear() : '', rows: rows, chart: ch, stats: statsFor(acct, rows), form: form };
  } else if (saved && saved.rows && saved.name) { pf = saved; stale = true; }
  var out = { t: T, mode: 'profile', none: !pf, calm: !pf, stale: stale, notice: '', banner: '', account: null, show_account: false, caps: {}, coords: true, white_bottom: true, lines: [] };
  if (pf) out.pf = pf; else out.calm_line = T.none2;
  if (diag.account) problems.push('Lichess account: ' + diag.account);
  if (diag.history) problems.push('Lichess history: ' + diag.history);
  if (diag.games) problems.push('Lichess games: ' + diag.games);
  if (problems.length) out.problems = problems;
  var st = keep({ v: 1 });
  if (pf) st.pf = pf;
  out.trmnl_state = fitState(st);
  return viewModel(out, nowS);
}

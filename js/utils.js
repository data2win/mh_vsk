// Small formatting helpers (extracted verbatim from the original dashboard).

function tagClass(pct){ return pct>=65?'good':pct>=35?'mid':'low'; }
function barColor(pct){ return pct>=65?'#237A46':pct>=35?'#B0700F':'#B23B2E'; }
function fmtN(n){ return n.toLocaleString('en-IN'); }

export { tagClass, barColor, fmtN };

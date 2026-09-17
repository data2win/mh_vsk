// Dashboard logic: filters, scoring, drilldown, target panel, CSV export,
// school search and school profile. Code is the original dashboard script,
// wrapped in initDashboard(RAW) so it runs after the data has been fetched.

import { bitOf, DISTRICT_INDICATORS, DISTRICT_CATS, STATE_INDICATORS, STATE_CATS } from './indicators.js';
import { tagClass, barColor, fmtN } from './utils.js';

export function initDashboard(RAW) {
const DISTRICTS = RAW.districts, BLOCKS = RAW.blocks, MGMTS = RAW.mgmts, TYPES = RAW.types;
const GENDERS = RAW.genders, LOCS = RAW.locs;
// row: [udise, name, distIdx, blockIdx, mgmtIdx, typeIdx, met, has5, met2, genderIdx, locIdx, locality]
const SCHOOLS = RAW.schools; // [udise, name, distIdx, blockIdx, mgmtIdx, typeIdx, met, has5, met2]

let FW = 'district'; // 'district' | 'state'
function activeIndicators(){ return FW==='district' ? DISTRICT_INDICATORS : STATE_INDICATORS; }
function activeCats(){ return FW==='district' ? DISTRICT_CATS : STATE_CATS; }
function activeTotalWt(){ return activeIndicators().reduce((s,i)=>s+i.wt,0); }
function fwLabel(){ return FW==='district' ? 'District PGI-D' : 'State PGI 2.0'; }

function isGA(mgmtIdx){ return mgmtIdx===0 || mgmtIdx===1; }
function typeName(typeIdx){ return TYPES[typeIdx]; }
function isEligible(row, ind){
  const mgmtIdx = row[4], has5 = row[7], t = typeName(row[5]), gender = GENDERS[row[9]];
  switch(ind.base){
    case 'total': return true;
    case 'total5': return has5===1;
    case 'ga_total': return isGA(mgmtIdx);
    case 'ga_total5': return isGA(mgmtIdx) && has5===1;
    case 'sec_hsec': return t==='Secondary' || t==='Higher Secondary';
    case 'sec_hsec_not_boys': return (t==='Secondary' || t==='Higher Secondary') && gender!=='Boys';
    case 'sec_only': return t==='Secondary';
    case 'hsec_only': return t==='Higher Secondary';
    case 'up_sec_hsec': return t==='Upper Primary' || t==='Secondary' || t==='Higher Secondary';
    case 'ga_uprpri': return isGA(mgmtIdx) && t!=='Primary Only';
    default: return true;
  }
}
function isMet(row, ind){ return bitOf(row, ind.src, ind.bitCode); }

// ---- App state ----
let state = { role:'state', district:'ALL', block:'ALL', mgmt:'ALL', type:'ALL', loc:'ALL' };
let selectedIndicator = null;
let currentTargetRows = [];
let targetSort = {key:'name', dir:1};

const districtBlockSet = {};
SCHOOLS.forEach(r=>{
  const d = DISTRICTS[r[2]], b = BLOCKS[r[3]];
  if(!districtBlockSet[d]) districtBlockSet[d]=new Set();
  districtBlockSet[d].add(b);
});
function populateDistrictSelect(){
  const sel = document.getElementById('fDistrict');
  const list = Object.keys(districtBlockSet).sort();
  sel.innerHTML = '<option value="ALL">All Districts</option>' + list.map(d=>`<option value="${d}">${d}</option>`).join('');
}
function populateBlockSelect(district){
  const sel = document.getElementById('fBlock');
  if(district==='ALL'){ sel.innerHTML='<option value="ALL">All Blocks</option>'; sel.disabled=true; return; }
  const blocks = Array.from(districtBlockSet[district]||[]).sort();
  sel.innerHTML = '<option value="ALL">All Blocks</option>' + blocks.map(b=>`<option value="${b}">${b}</option>`).join('');
  sel.disabled = false;
}

function matchesFilters(row, {district=state.district, block=state.block, mgmt=state.mgmt, type=state.type, loc=state.loc}={}){
  if(district!=='ALL' && DISTRICTS[row[2]]!==district) return false;
  if(block!=='ALL' && BLOCKS[row[3]]!==block) return false;
  if(mgmt!=='ALL' && MGMTS[row[4]]!==mgmt) return false;
  if(type!=='ALL' && TYPES[row[5]]!==type) return false;
  if(loc!=='ALL' && LOCS[row[10]]!==loc) return false;
  return true;
}

function computeAgg(rows, indicators){
  const agg = {total:rows.length, ga_total:0};
  indicators.forEach(ind=>{ agg['elig_'+ind.code]=0; agg['met_'+ind.code]=0; });
  rows.forEach(r=>{
    if(isGA(r[4])) agg.ga_total++;
    indicators.forEach(ind=>{
      if(isEligible(r, ind)){
        agg['elig_'+ind.code]++;
        if(isMet(r, ind)) agg['met_'+ind.code]++;
      }
    });
  });
  return agg;
}
function scoreFromAgg(agg, indicators){
  let totalScore=0;
  const perIndicator = indicators.map(ind=>{
    const base = agg['elig_'+ind.code], num = agg['met_'+ind.code];
    const pct = base>0 ? num/base*100 : 0;
    const score = ind.wt*pct/100;
    totalScore += score;
    const scoped = ['ga_total','ga_total5'].includes(ind.base) ? 'G+A' :
                   ['sec_hsec','sec_hsec_not_boys','sec_only','hsec_only','up_sec_hsec','ga_uprpri'].includes(ind.base) ? 'SCOPE' : null;
    return Object.assign({}, ind, {num, base, pct, score, scoped});
  });
  return {perIndicator, totalScore};
}

function getFilteredRows(){ return SCHOOLS.filter(r=>matchesFilters(r)); }

function renderBonusRow(rows){
  // Electricity and Solar Panel as informational chips (Solar is officially in State PGI 3.15;
  // Electricity is not a scored indicator in either framework, shown for governance visibility only)
  let elec=0, solar=0;
  rows.forEach(r=>{
    if(bitOf(r,2,'ELEC')) elec++;
    if(bitOf(r,2,'S3.15')) solar++;
  });
  const n = rows.length || 1;
  const el = document.getElementById('bonusRow');
  el.innerHTML = `
    <div class="bonus-chip"><span class="bval">${(100*elec/n).toFixed(1)}%</span><span class="blabel">Electricity Connected</span><span class="btag">INFORMATIONAL</span></div>
    <div class="bonus-chip"><span class="bval">${(100*solar/n).toFixed(1)}%</span><span class="blabel">Solar Panel Installed</span><span class="btag">STATE PGI 3.15</span></div>
  `;
}

function render(){
  const rows = getFilteredRows();
  const indicators = activeIndicators();
  const cats = activeCats();
  const totalWt = activeTotalWt();
  const agg = computeAgg(rows, indicators);
  const {perIndicator, totalScore} = scoreFromAgg(agg, indicators);
  const pctOverall = agg.total>0 ? totalScore/totalWt*100 : 0;

  let bc = 'Maharashtra';
  if(state.district!=='ALL') bc += ` › <b>${state.district}</b>`;
  if(state.block!=='ALL') bc += ` › <b>${state.block}</b>`;
  document.getElementById('breadcrumb').innerHTML = bc + (state.mgmt!=='ALL'?` · ${state.mgmt}`:'') + (state.type!=='ALL'?` · ${state.type}`:'') + (state.loc!=='ALL'?` · ${state.loc}`:'');
  document.getElementById('scopePill').textContent = fmtN(agg.total) + ' schools in scope';

  document.getElementById('kpiScoreLabel').textContent = 'Covered ' + fwLabel() + ' Score';
  document.getElementById('kpiScore').innerHTML = totalScore.toFixed(2) + ' <small>/ ' + totalWt + '</small>';
  document.getElementById('kpiPct').textContent = pctOverall.toFixed(1) + '%';
  document.getElementById('kpiSchools').textContent = fmtN(agg.total);
  document.getElementById('kpiGA').textContent = fmtN(agg.ga_total);

  renderBonusRow(rows);

  document.getElementById('catTitle').textContent = fwLabel() + ' — Category Breakdown';
  const catEl = document.getElementById('catCards'); catEl.innerHTML='';
  Object.keys(cats).forEach(k=>{
    const inds = perIndicator.filter(i=>i.cat===k);
    const wtSum = inds.reduce((s,i)=>s+i.wt,0), scoreSum = inds.reduce((s,i)=>s+i.score,0);
    const pct = wtSum>0? scoreSum/wtSum*100:0;
    const div = document.createElement('div'); div.className='cat-card'; div.style.borderLeftColor = barColor(pct);
    div.innerHTML = `<div class="catname">${cats[k].label}</div>
      <div class="catmeta">${scoreSum.toFixed(1)} / ${wtSum} covered (full category = ${cats[k].full} pts) — ${pct.toFixed(1)}%</div>
      <div class="cattrack"><div class="catfill" style="width:${Math.min(pct,100)}%; background:${barColor(pct)}"></div></div>`;
    catEl.appendChild(div);
  });

  document.getElementById('indTitle').textContent = fwLabel() + ' — Indicator Detail — Current Selection';
  const tbody = document.getElementById('indicatorBody');
  tbody.innerHTML = perIndicator.map(i=>`
    <tr class="ind-row ${selectedIndicator===i.code?'selected':''}">
      <td>${i.code}</td>
      <td>${i.name}${i.scoped?'<span class="scope-badge">'+i.scoped+'</span>':''}</td>
      <td class="num">${i.wt}</td>
      <td><span class="mini-bar-track"><span class="mini-bar-fill" style="width:${Math.min(i.pct,100)}%; background:${barColor(i.pct)}"></span></span></td>
      <td class="num"><span class="tag ${tagClass(i.pct)}">${i.pct.toFixed(1)}%</span></td>
      <td class="num">${i.score.toFixed(2)}</td>
      <td><button class="target-btn" data-code="${i.code}">Target Schools (${(i.base-i.num)})</button></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('.target-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>showTargetList(btn.dataset.code));
  });

  document.getElementById('footerNote').innerHTML =
    'Methodology: Score = Weight × (Schools meeting indicator ÷ eligible base). <span class="scope-badge">G+A</span> = Government+Aided base. <span class="scope-badge">SCOPE</span> = restricted to the school types/gender the indicator officially applies to (e.g. Girls\' Self-Defense Training applies to Upper Primary/Secondary/Higher Secondary only; Sanitary Pad Machine and Incinerator apply to Co-ed and Girls\' schools only, Boys-only schools marked N/A; Integrated Science Lab to Secondary+ only — ineligible schools are marked N/A, not "not met"). Electricity and Solar Panel are shown above as governance-visibility chips; Electricity is not an official PGI/PGI-D indicator, Solar Panel is State PGI 3.15. Village/Ward locality and gender composition are sourced from the LGD (Local Government Directory) Mapping module. Source: 6 UDISE+ Facility/Profile modules, AY 2026-27. Block remains the finest filterable geography (village/ward names are shown per school but not offered as a filter dropdown, since Maharashtra has 25,000+ villages).';

  renderDrilldown(rows);
  if(selectedIndicator) showTargetList(selectedIndicator, true);
}

function renderDrilldown(rows){
  const titleEl = document.getElementById('drillTitle'), subEl = document.getElementById('drillSub'), chartEl = document.getElementById('drillChart');
  const indicators = activeIndicators();
  let groups, onClick;

  if(state.block!=='ALL'){
    titleEl.textContent = `${state.block} — School Mix by Management (${fwLabel()})`;
    subEl.textContent = 'Score by management category within this block.';
    const byKey = {};
    rows.forEach(r=>{ const m=MGMTS[r[4]]; (byKey[m]=byKey[m]||[]).push(r); });
    groups = Object.keys(byKey).map(m=>{
      const agg=computeAgg(byKey[m], indicators); const {totalScore}=scoreFromAgg(agg, indicators);
      return {label:m, score:totalScore, n:agg.total};
    }).sort((a,b)=>b.score-a.score);
    onClick=null;
  } else if(state.district!=='ALL'){
    titleEl.textContent = `${state.district} — Block Ranking (${fwLabel()})`;
    subEl.textContent = 'Click a block to drill into its school mix.';
    const rowsInDist = SCHOOLS.filter(r=>matchesFilters(r,{district:state.district,block:'ALL',mgmt:state.mgmt,type:state.type}));
    const byKey = {};
    rowsInDist.forEach(r=>{ const b=BLOCKS[r[3]]; (byKey[b]=byKey[b]||[]).push(r); });
    groups = Object.keys(byKey).map(b=>{
      const agg=computeAgg(byKey[b], indicators); const {totalScore}=scoreFromAgg(agg, indicators);
      return {label:b, score:totalScore, n:agg.total};
    }).sort((a,b)=>b.score-a.score);
    onClick=(label)=>{ document.getElementById('fBlock').value=label; state.block=label; render(); };
  } else {
    titleEl.textContent = `District Ranking (${fwLabel()} Covered Score / ${activeTotalWt()})`;
    subEl.textContent = 'Click a district to drill into its blocks.';
    const rowsAll = SCHOOLS.filter(r=>matchesFilters(r,{district:'ALL',block:'ALL',mgmt:state.mgmt,type:state.type}));
    const byKey = {};
    rowsAll.forEach(r=>{ const d=DISTRICTS[r[2]]; (byKey[d]=byKey[d]||[]).push(r); });
    groups = Object.keys(byKey).map(d=>{
      const agg=computeAgg(byKey[d], indicators); const {totalScore}=scoreFromAgg(agg, indicators);
      return {label:d, score:totalScore, n:agg.total};
    }).sort((a,b)=>b.score-a.score);
    onClick=(label)=>{
      document.getElementById('fDistrict').value=label; populateBlockSelect(label);
      state.district=label; state.block='ALL'; render();
    };
  }

  const totalWt = activeTotalWt();
  const maxScore = Math.max.apply(null, groups.map(function(g){return g.score;}).concat([1]));
  chartEl.innerHTML = groups.map(g=>{
    const pctOfMax = g.score/maxScore*100, achievePct = g.score/totalWt*100;
    return `<div class="bar-row">
      <div class="name" ${onClick?`data-label="${g.label}" style="cursor:pointer"`:''}>${g.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pctOfMax}%; background:${barColor(achievePct)}"></div></div>
      <div class="pct">${g.score.toFixed(1)}</div>
    </div>`;
  }).join('');
  if(onClick) chartEl.querySelectorAll('.name[data-label]').forEach(el=>el.addEventListener('click',()=>onClick(el.getAttribute('data-label'))));
}

// ---- Target Schools ----
function showTargetList(code, silent){
  selectedIndicator = code;
  const ind = activeIndicators().find(i=>i.code===code);
  const rows = getFilteredRows().filter(r=>isEligible(r,ind) && !isMet(r,ind));
  currentTargetRows = rows.map(r=>({
    udise:r[0], name:r[1]||'(name not in Facility module)', dist:DISTRICTS[r[2]], block:BLOCKS[r[3]], mgmt:MGMTS[r[4]], type:TYPES[r[5]], locality:r[11]||'—'
  }));
  document.getElementById('targetTitle').textContent = `Target Schools — ${fwLabel()} ${ind.code} ${ind.name}`;
  document.getElementById('targetSub').textContent = `Schools in the current filter selection that are NOT meeting this indicator (and ARE eligible for it). Fix these to move the score fastest.`;
  document.getElementById('targetCount').textContent = fmtN(currentTargetRows.length) + ' schools';
  document.getElementById('targetPanel').classList.add('show');
  document.getElementById('targetSearch').value='';
  renderTargetTable();
  document.querySelectorAll('.ind-row').forEach(tr=>tr.classList.remove('selected'));
  if(!silent){ try{document.getElementById('targetPanel').scrollIntoView({behavior:'smooth', block:'start'});}catch(e){} }
  document.querySelectorAll('#indicatorBody tr').forEach(tr=>{
    if(tr.querySelector(`[data-code="${code}"]`)) tr.classList.add('selected');
  });
}
function renderTargetTable(){
  const q = document.getElementById('targetSearch').value.trim().toLowerCase();
  let rows = currentTargetRows;
  if(q){ rows = rows.filter(r => r.name.toLowerCase().includes(q) || r.udise.includes(q) || r.block.toLowerCase().includes(q)); }
  rows = rows.slice().sort((a,b)=>{
    const av=a[targetSort.key], bv=b[targetSort.key];
    return av<bv ? -targetSort.dir : av>bv ? targetSort.dir : 0;
  });
  const tbody = document.getElementById('targetBody');
  const MAXROWS = 500;
  const shown = rows.slice(0, MAXROWS);
  tbody.innerHTML = shown.map(r=>`
    <tr><td>${r.name}</td><td class="udise-code">${r.udise}</td><td>${r.dist}</td><td>${r.block}</td><td>${r.locality}</td><td>${r.mgmt}</td><td>${r.type}</td></tr>
  `).join('') + (rows.length>MAXROWS ? `<tr><td colspan="7" style="text-align:center; color:var(--ink-3); padding:14px;">Showing first ${MAXROWS} of ${fmtN(rows.length)} — narrow with filters or search, or export CSV for the full list.</td></tr>` : '');
}
document.getElementById('closeTarget').addEventListener('click', ()=>{
  selectedIndicator = null;
  document.getElementById('targetPanel').classList.remove('show');
  document.querySelectorAll('.ind-row').forEach(tr=>tr.classList.remove('selected'));
});
document.getElementById('targetSearch').addEventListener('input', renderTargetTable);
document.querySelectorAll('th.sortable').forEach(th=>{
  th.addEventListener('click', ()=>{
    const k = th.dataset.k;
    if(targetSort.key===k) targetSort.dir *= -1; else { targetSort.key=k; targetSort.dir=1; }
    renderTargetTable();
  });
});
document.getElementById('exportBtn').addEventListener('click', ()=>{
  const rows = currentTargetRows;
  const header = ['School Name','UDISE Code','District','Block','Village/Ward','Management','School Type'];
  const csvRows = [header.join(',')].concat(rows.map(r=>[r.name,r.udise,r.dist,r.block,r.locality,r.mgmt,r.type].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')));
  const blob = new Blob([csvRows.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `target_schools_${FW}_${selectedIndicator}.csv`; a.click();
  URL.revokeObjectURL(url);
});

// ---- School search / profile ----
const searchInput = document.getElementById('schoolSearch');
const searchResultsEl = document.getElementById('searchResults');
searchInput.addEventListener('input', ()=>{
  const q = searchInput.value.trim().toLowerCase();
  if(q.length<2){ searchResultsEl.classList.remove('show'); return; }
  const matches = [];
  for(let i=0;i<SCHOOLS.length && matches.length<25;i++){
    const r = SCHOOLS[i];
    const name = (r[1]||'').toLowerCase();
    if(name.includes(q) || r[0].includes(q)) matches.push(r);
  }
  searchResultsEl.innerHTML = matches.map(r=>`
    <div class="search-item" data-udise="${r[0]}">
      <div class="sname">${r[1]||'(unnamed)'}</div>
      <div class="smeta">${r[0]} · ${DISTRICTS[r[2]]} · ${BLOCKS[r[3]]} · ${MGMTS[r[4]]}</div>
    </div>`).join('') || '<div class="search-item">No matches</div>';
  searchResultsEl.classList.add('show');
  searchResultsEl.querySelectorAll('.search-item[data-udise]').forEach(el=>{
    el.addEventListener('click', ()=>{
      showSchoolProfile(el.dataset.udise);
      searchResultsEl.classList.remove('show');
      searchInput.value='';
    });
  });
});
document.addEventListener('click', (e)=>{ if(!e.target.closest('.search-wrap')) searchResultsEl.classList.remove('show'); });

function scoreForSchool(row, indicators){
  let score=0, wtElig=0;
  indicators.forEach(ind=>{
    if(isEligible(row, ind)){
      wtElig += ind.wt;
      if(isMet(row, ind)) score += ind.wt;
    }
  });
  return {score, wtElig, pct: wtElig>0 ? 100*score/wtElig : 0};
}

function showSchoolProfile(udise){
  const row = SCHOOLS.find(r=>r[0]===udise);
  if(!row) return;

  const dScore = scoreForSchool(row, DISTRICT_INDICATORS);
  const sScore = scoreForSchool(row, STATE_INDICATORS);

  document.getElementById('spName').textContent = row[1] || '(name not available)';
  document.getElementById('spMeta').innerHTML = `<span>UDISE: ${row[0]}</span><span>${DISTRICTS[row[2]]}</span><span>${BLOCKS[row[3]]}</span>${row[11]?`<span>${LOCS[row[10]]}: ${row[11]}</span>`:''}<span>${MGMTS[row[4]]}</span><span>${TYPES[row[5]]}</span><span>${GENDERS[row[9]]}</span>`;

  document.getElementById('spScores').innerHTML = `
    <div class="sp-score-box">
      <div class="sname">District PGI-D</div>
      <div class="sval">${dScore.score.toFixed(1)} <small>/ ${dScore.wtElig} eligible pts (${dScore.pct.toFixed(1)}%)</small></div>
    </div>
    <div class="sp-score-box">
      <div class="sname">State PGI 2.0</div>
      <div class="sval">${sScore.score.toFixed(1)} <small>/ ${sScore.wtElig} eligible pts (${sScore.pct.toFixed(1)}%)</small></div>
    </div>
  `;

  function gridHTML(indicators){
    return indicators.map(ind=>{
      const elig = isEligible(row, ind);
      const met = elig && isMet(row, ind);
      const cls = !elig ? 'na' : (met ? 'met' : 'unmet');
      const label = !elig ? 'N/A' : (met ? 'Met' : 'Not met');
      return `<div class="sp-item ${cls}"><span class="dot"></span><span>${ind.code} ${ind.name} — <b>${label}</b></span></div>`;
    }).join('');
  }
  document.getElementById('spGridDistrict').innerHTML = gridHTML(DISTRICT_INDICATORS);
  document.getElementById('spGridState').innerHTML = gridHTML(STATE_INDICATORS);

  const elec = bitOf(row,2,'ELEC') ? 'Yes' : 'No';
  const solar = bitOf(row,2,'S3.15') ? 'Yes' : 'No';
  document.getElementById('spBonus').innerHTML = `<span>Electricity Connected: <b>${elec}</b> <span class="scope-badge" style="margin-left:4px;">not officially scored</span></span><span>Solar Panel: <b>${solar}</b> <span class="scope-badge" style="margin-left:4px;">State PGI 3.15</span></span>`;

  document.getElementById('schoolProfile').classList.add('show');
  try{document.getElementById('schoolProfile').scrollIntoView({behavior:'smooth', block:'start'});}catch(e){}
}

// ---- Filter / Framework / Role events ----
document.getElementById('fDistrict').addEventListener('change', e=>{
  state.district=e.target.value; state.block='ALL'; populateBlockSelect(state.district); render();
});
document.getElementById('fBlock').addEventListener('change', e=>{ state.block=e.target.value; render(); });
document.getElementById('fMgmt').addEventListener('change', e=>{ state.mgmt=e.target.value; render(); });
document.getElementById('fType').addEventListener('change', e=>{ state.type=e.target.value; render(); });
document.getElementById('fLoc').addEventListener('change', e=>{ state.loc=e.target.value; render(); });
document.getElementById('resetBtn').addEventListener('click', ()=>{
  state = {role:state.role, district:'ALL', block:'ALL', mgmt:'ALL', type:'ALL', loc:'ALL'};
  document.getElementById('fDistrict').value='ALL'; populateBlockSelect('ALL');
  document.getElementById('fMgmt').value='ALL'; document.getElementById('fType').value='ALL';
  document.getElementById('fLoc').value='ALL';
  document.getElementById('schoolProfile').classList.remove('show');
  selectedIndicator=null; document.getElementById('targetPanel').classList.remove('show');
  render();
});

document.querySelectorAll('.fw-tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.fw-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    FW = btn.dataset.fw;
    selectedIndicator = null;
    document.getElementById('targetPanel').classList.remove('show');
    render();
  });
});

const roleNotes = {
  state:'Statewide view — compare districts, then drill into blocks and individual schools.',
  district:'Pick a district in the filter bar to see its block-wise ranking and target lists.',
  block:'Pick a district and block to see the school mix and target exact schools within it.',
};
document.querySelectorAll('.role-tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.role-tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); state.role=btn.dataset.role;
    document.getElementById('roleNote').textContent = roleNotes[state.role];
  });
});

// ---- Init ----
populateDistrictSelect();
populateBlockSelect('ALL');
render();
}

import './main-v27.js';

const state=window.settlers.state;
state.sitePriority=state.sitePriority||{};
const LEVELS=['low','normal','high'];
const SCORE={low:1,normal:2,high:3};

function priority(site){return state.sitePriority[site.id]||'normal'}
function cycle(site){const p=priority(site),n=LEVELS[(LEVELS.indexOf(p)+1)%LEVELS.length];state.sitePriority[site.id]=n;const e=document.querySelector('#buildMsg');if(e)e.textContent=`🏗️ ${site.type} priority changed to ${n.toUpperCase()}. Higher priority sites reserve available materials first.`}
function inTransit(site,kind){return state.goods.filter(g=>g.construction&&g.destinationId===site.id&&g.kind===kind).length}
function remaining(site,kind){return Math.max(0,(site.required[kind]||0)-(site.delivered[kind]||0)-inTransit(site,kind))}
function reservationSnapshot(){const store=state.buildings.find(b=>b.type==='store'),available={};for(const k of ['wood','planks','stone'])available[k]=store?.output?.[k]||0;const reservations=[];const ordered=[...state.constructionSites].sort((a,b)=>SCORE[priority(b)]-SCORE[priority(a)]||a.id-b.id);for(const site of ordered){for(const kind of Object.keys(site.required)){const need=remaining(site,kind),take=Math.min(need,available[kind]||0);if(take>0){reservations.push({siteId:site.id,kind,count:take});available[kind]-=take}}}return{reservations,available}}

const panel=document.querySelector('.panel');panel.insertAdjacentHTML('beforeend',`<hr><div><b>🎯 Resource Priority · v28</b><br><small>Construction sites reserve scarce Storage materials in High → Normal → Low order.</small><div id="v28priority"></div></div>`);
panel.addEventListener('pointerup',e=>{const b=e.target.closest('[data-priority]');if(!b)return;e.preventDefault();e.stopPropagation();const site=state.constructionSites.find(s=>s.id===Number(b.dataset.priority));if(site)cycle(site)});
function render(){const root=document.querySelector('#v28priority');if(root){const snap=reservationSnapshot();root.innerHTML=state.constructionSites.length?state.constructionSites.map(s=>{const rs=snap.reservations.filter(r=>r.siteId===s.id).map(r=>`${r.kind}:${r.count}`).join(' · ')||'none';return`<div style="margin-top:7px;padding-top:6px;border-top:1px solid #ffffff22"><b>${s.type}</b> · <button data-priority="${s.id}" style="padding:4px 8px">${priority(s).toUpperCase()}</button><br><small>Reserved now: ${rs}</small></div>`}).join(''):`<div style="margin-top:6px">No active sites.</div>`}requestAnimationFrame(render)}requestAnimationFrame(render);

// Reorder the live site array before the inherited v25/v26 dispatch pass runs.
// Its dispatcher walks constructionSites in array order, so this makes scarce
// stock physically leave Storage for higher-priority reservations first.
function enforce(){state.constructionSites.sort((a,b)=>SCORE[priority(b)]-SCORE[priority(a)]||a.id-b.id);requestAnimationFrame(enforce)}requestAnimationFrame(enforce);

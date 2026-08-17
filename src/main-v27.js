import './main-v26-tools.js';
import{nextId}from'./state.js';
import{adjacentFlag}from'./world.js';

const state=window.settlers.state;
const ICON={axe:'🪓',saw:'🪚',pick:'⛏️',scythe:'🌾'};
state.toolDepot={axe:0,saw:0,pick:0,scythe:0};
state.toolTransit=[];

function route(state,start,goal){const q=[start.id],prev=new Map(),seen=new Set(q);for(let h=0;h<q.length;h++){const id=q[h];if(id===goal.id){const out=[];let n=id;while(n!=null){out.push(n);n=prev.get(n)}return out.reverse()}for(const s of state.segments){if(s.a!==id&&s.b!==id)continue;const n=s.a===id?s.b:s.a;if(!seen.has(n)){seen.add(n);prev.set(n,id);q.push(n)}}}return[]}
function nearestToolSource(){const store=state.buildings.find(b=>b.type==='store');return store?adjacentFlag(state,store):null}
function dispatchTool(kind){const source=nearestToolSource();if(!source)return false;const good={id:nextId(state,'good'),kind:`tool_${kind}`,producerId:null,destinationId:null,currentFlag:source.id,route:[source.id],routeIndex:0,carrierId:null,rest:0,toolDelivery:true,toolKind:kind};state.goods.push(good);state.toolTransit.push(good.id);return true}

// v26 still forges tools. v27 removes them from immediately usable stock and makes
// every newly forged tool complete a physical storage-delivery phase first.
let previous={...state.tools};
function watchForge(){for(const kind of Object.keys(previous)){const now=state.tools[kind]||0;if(now>previous[kind]){const made=now-previous[kind];state.tools[kind]-=made;for(let i=0;i<made;i++){if(dispatchTool(kind)){const e=document.querySelector('#buildMsg');if(e)e.textContent=`📦 ${ICON[kind]} ${kind} forged. It is cargo now and must be stored before a bearer can use it.`}else state.toolDepot[kind]+=1}}previous[kind]=state.tools[kind]||0}requestAnimationFrame(watchForge)}requestAnimationFrame(watchForge);

// The current transport engine requires a destination building. Tool cargo is
// delivered through Storage's adjacent flag, then deposited into the usable tool stock.
function settleTools(){const store=state.buildings.find(b=>b.type==='store'),sf=store&&adjacentFlag(state,store);if(!sf)return requestAnimationFrame(settleTools);for(const id of [...state.toolTransit]){const g=state.goods.find(x=>x.id===id);if(!g){state.toolTransit=state.toolTransit.filter(x=>x!==id);continue}if(!g.destinationId){g.destinationId=store.id;g.route=route(state,state.buildings.find(b=>b.id===g.currentFlag),sf);if(!g.route.length)g.route=[sf.id];g.routeIndex=0}if(g.currentFlag===sf.id&&!g.carrierId){state.goods=state.goods.filter(x=>x.id!==g.id);state.toolTransit=state.toolTransit.filter(x=>x!==g.id);state.tools[g.toolKind]=(state.tools[g.toolKind]||0)+1;previous[g.toolKind]=state.tools[g.toolKind];state.toolDepot[g.toolKind]=(state.toolDepot[g.toolKind]||0)+1;const e=document.querySelector('#buildMsg');if(e)e.textContent=`🏠 ${ICON[g.toolKind]} ${g.toolKind} reached Storage and is now available for profession conversion.`}}requestAnimationFrame(settleTools)}requestAnimationFrame(settleTools);

const panel=document.querySelector('.panel');panel.insertAdjacentHTML('beforeend',`<hr><div><b>📦 Physical Tool Chain · v27</b><div id="v27tools"></div></div>`);
function render(){const e=document.querySelector('#v27tools');if(e)e.innerHTML=`Tools in transit: <b>${state.toolTransit.length}</b><br>`+Object.keys(state.toolDepot).map(k=>`${ICON[k]} ${k} stored deliveries: <b>${state.toolDepot[k]}</b>`).join(' · ');requestAnimationFrame(render)}requestAnimationFrame(render);

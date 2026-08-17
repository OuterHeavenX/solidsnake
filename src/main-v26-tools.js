import './main-v25.js';

const state=window.settlers.state;
const TOOL_COST={axe:{wood:2},saw:{wood:2,stone:1},pick:{wood:1,stone:2},scythe:{wood:2,stone:1}};
const TOOL_ICON={axe:'🪓',saw:'🪚',pick:'⛏️',scythe:'🌾'};
state.toolOrders={axe:0,saw:0,pick:0,scythe:0};
state.toolsmith={progress:0,completed:0};

function canPay(cost){return Object.entries(cost).every(([k,v])=>(state.inventory[k]||0)>=v)}
function pay(cost){for(const[k,v]of Object.entries(cost)){state.inventory[k]-=v;const store=state.buildings.find(b=>b.type==='store');if(store?.output)store.output[k]=Math.max(0,(store.output[k]||0)-v)}}
function orderTool(kind){if(!(kind in TOOL_COST))return;state.toolOrders[kind]++;const e=document.querySelector('#buildMsg');if(e)e.textContent=`🔨 ${kind} ordered. Toolsmith will consume real stored materials and forge it.`}
function tickTools(dt){state.toolsmith.progress+=dt;if(state.toolsmith.progress<2)return;state.toolsmith.progress=0;for(const kind of Object.keys(state.toolOrders)){if(state.toolOrders[kind]<=0)continue;const cost=TOOL_COST[kind];if(!canPay(cost))continue;pay(cost);state.toolOrders[kind]--;state.tools[kind]=(state.tools[kind]||0)+1;state.toolsmith.completed++;const e=document.querySelector('#buildMsg');if(e)e.textContent=`${TOOL_ICON[kind]} Toolsmith completed 1 ${kind}. It is now available for profession conversion.`;break}}

const panel=document.querySelector('.panel');panel.insertAdjacentHTML('beforeend',`<hr><div><b>🔨 Toolsmith · v26</b><br><small>Tools are no longer only a starter stock. Order replacements from stored Wood/Stone.</small><div id="toolOrders" style="display:flex;gap:6px;overflow-x:auto;padding:7px 0;touch-action:pan-x"><button data-tool="axe">🪓 Axe</button><button data-tool="saw">🪚 Saw</button><button data-tool="pick">⛏️ Pick</button><button data-tool="scythe">🌾 Scythe</button></div><div id="toolStatus"></div></div>`);
panel.addEventListener('pointerup',e=>{const b=e.target.closest('[data-tool]');if(!b)return;e.preventDefault();e.stopPropagation();orderTool(b.dataset.tool)});
function renderTools(){const e=document.querySelector('#toolStatus');if(e)e.innerHTML=`Completed: <b>${state.toolsmith.completed}</b><br>`+Object.keys(TOOL_COST).map(k=>`${TOOL_ICON[k]} ${k}: <b>${state.tools[k]||0}</b> · queued ${state.toolOrders[k]} · cost ${Object.entries(TOOL_COST[k]).map(([r,n])=>`${n} ${r}`).join(' + ')}`).join('<br>');requestAnimationFrame(renderTools)}requestAnimationFrame(renderTools);
let last=performance.now();function toolsLoop(now){const dt=Math.min(.1,(now-last)/1000);last=now;tickTools(dt);requestAnimationFrame(toolsLoop)}requestAnimationFrame(toolsLoop);

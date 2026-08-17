import { createState, nextId } from './state.js';
import { createRenderer } from './renderer-v26.js';
import { attachInput } from './input-v20.js';
import { createUI } from './ui-v26.js';
import { BUILDINGS } from './config.js';
import { rebuildSegments } from './roads.js';
import { hireWorker } from './workers.js';
import { ensureSegmentCarriers, updateCarriers } from './transport-v16.js';
import { updateWorkers } from './jobs-v16.js';
import { dispatchStoredOutputs } from './logistics-v16.js';
import { createConstructionSite } from './construction.js';
import { seedConstructionCargo, updateConstruction } from './construction-runtime-v9.js';

const TOOL = { wood: 'axe', mill: 'saw', quarry: 'pick', farm: 'scythe' };
const canvas = document.querySelector('#c');
const state = createState();
const view = { x: innerWidth / 2, y: 80, zoom: 0.68 };

state.tools = { axe: 2, saw: 1, pick: 2, scythe: 1 };
state.joblessProfessionals = [];
state.ownedTiles = new Set();
state.pioneers = [];
state.pioneerTarget = null;

function key(x, y) { return `${x},${y}`; }
function own(x, y) { if (x >= 0 && y >= 0 && x < 32 && y < 32) state.ownedTiles.add(key(x, y)); }
function isOwned(x, y) { return state.ownedTiles.has(key(x, y)); }

function add(type, x, y) {
  const b = { id: nextId(state, 'building'), type, x, y, input: {}, output: {} };
  state.buildings.push(b);
  return b;
}

function road(x, y, type = 'road') { return add(type, x, y); }

for (let y = 9; y <= 17; y++) {
  for (let x = 6; x <= 18; x++) own(x, y);
}

for (let x = 8; x <= 15; x++) road(x, 13);
for (const x of [8, 12, 15]) {
  const i = state.buildings.findIndex(b => b.x === x && b.y === 13 && b.type === 'road');
  if (i >= 0) state.buildings.splice(i, 1);
  road(x, 13, 'flag');
}

const store = add('store', 12, 12);
store.output = { wood: 160, planks: 60, stone: 110, food: 20 };
Object.assign(state.inventory, { wood: 160, planks: 60, stone: 110, food: 20 });

state.pioneers.push({ id: nextId(state, 'pioneer'), x: 12, y: 11, moveTimer: 0, workTimer: 0 });

for (let i = 0; i < 55; i++) state.trees.push({ id: i + 1, x: 2 + (i * 7) % 29, y: 3 + (i * 11) % 24, alive: true });
for (let i = 0; i < 34; i++) state.rocks.push({ id: 100 + i, x: 3 + (i * 9) % 28, y: 2 + (i * 5) % 22, alive: true });
for (let i = 0; i < 38; i++) state.crops.push({ id: 200 + i, x: 4 + (i * 5) % 27, y: 4 + (i * 7) % 20, alive: true });

let mode = null;

function msg(t) {
  const e = document.querySelector('#buildMsg');
  if (e) e.textContent = t;
}

function screenToTile(sx, sy) {
  const dx = (sx - view.x) / (32 * view.zoom);
  const dy = (sy - view.y) / (16 * view.zoom);
  return { x: Math.round((dx + dy) / 2), y: Math.round((dy - dx) / 2) };
}

function occupied(x, y) {
  return state.buildings.some(b => b.x === x && b.y === y) || state.constructionSites.some(s => s.x === x && s.y === y);
}

function adjacentRoad(x, y) {
  return [[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx, dy]) => state.buildings.find(b => b.x === x + dx && b.y === y + dy && (b.type === 'road' || b.type === 'flag')))
    .find(Boolean) || null;
}

function nearestFree(x, y, needsRoad = false) {
  let best = null;
  let d0 = 1e9;
  for (let yy = 0; yy < 32; yy++) {
    for (let xx = 0; xx < 32; xx++) {
      if (!isOwned(xx, yy) || occupied(xx, yy)) continue;
      if (needsRoad && !adjacentRoad(xx, yy)) continue;
      const d = (xx - x) ** 2 + (yy - y) ** 2;
      if (d < d0) { d0 = d; best = { x: xx, y: yy }; }
    }
  }
  return best;
}

function selectMode(type) {
  mode = mode === type ? null : type;
  document.querySelectorAll('[data-build],[data-pioneer]').forEach(b => {
    const selected = b.dataset.build === mode || (b.dataset.pioneer && mode === 'pioneer');
    b.classList.toggle('active', selected);
  });
  if (mode === 'pioneer') {
    msg('🚩 PIONEER active. Tap unclaimed land to order the Pioneer there.');
    return;
  }
  const cost = BUILDINGS[type]?.cost || {};
  msg(mode ? `✅ ${type.toUpperCase()} placement active. Cost: ${Object.entries(cost).map(([k, v]) => `${v} ${k}`).join(' + ') || 'free'}. Tap claimed land.` : 'Placement cancelled.');
}

function place(sx, sy) {
  if (!mode) return;
  const wanted = screenToTile(sx, sy);

  if (mode === 'pioneer') {
    if (wanted.x < 0 || wanted.y < 0 || wanted.x >= 32 || wanted.y >= 32) return msg('❌ Pioneer target is outside the map.');
    state.pioneerTarget = wanted;
    mode = null;
    document.querySelectorAll('[data-build],[data-pioneer]').forEach(b => b.classList.remove('active'));
    msg(`🚩 Pioneer ordered toward ${wanted.x},${wanted.y}. Watch the gold-bordered territory expand.`);
    return;
  }

  if (mode === 'road' || mode === 'flag') {
    const spot = nearestFree(wanted.x, wanted.y);
    if (!spot) return msg('❌ No free CLAIMED tile available. Send the Pioneer to expand territory first.');
    add(mode, spot.x, spot.y);
    rebuildSegments(state);
    ensureSegmentCarriers(state);
    msg(`✅ ${mode} placed on claimed land.`);
    return;
  }

  const spot = nearestFree(wanted.x, wanted.y, true);
  if (!spot) return msg('❌ Building needs a free CLAIMED roadside tile. Expand territory with the Pioneer if needed.');
  const service = adjacentRoad(spot.x, spot.y);
  if (service.type === 'road') service.type = 'flag';
  createConstructionSite(state, mode, spot.x, spot.y);
  rebuildSegments(state);
  ensureSegmentCarriers(state);
  msg(`🏗️ ${BUILDINGS[mode]?.name || mode} added to construction queue on claimed land.`);
  mode = null;
  document.querySelectorAll('[data-build],[data-pioneer]').forEach(b => b.classList.remove('active'));
}

rebuildSegments(state);
ensureSegmentCarriers(state);
createRenderer(canvas, state, view);
attachInput(canvas, view, { onTap: place });
const ui = createUI(state);

const panel = document.querySelector('.panel');
panel.insertAdjacentHTML('beforeend', `<hr><div id="buildTray" style="display:flex;gap:6px;overflow-x:auto;padding:6px 0;pointer-events:auto;touch-action:pan-x"><button data-pioneer="1">🚩 Pioneer</button><button data-build="road">🛤️ Road</button><button data-build="flag">🚩 Flag</button><button data-build="wood">🪓 Woodcutter</button><button data-build="mill">🪚 Sawmill</button><button data-build="quarry">⛏️ Quarry</button><button data-build="farm">🌾 Farm</button><button data-build="house">🏠 House</button></div><div id="buildMsg">v26 blueprint: Pioneer claims unprotected foreign ground. Construction is restricted to your claimed territory.</div>`);
panel.style.pointerEvents = 'auto';

panel.addEventListener('pointerup', e => {
  const staff = e.target.closest('[data-staff]');
  if (staff) {
    e.preventDefault();
    e.stopPropagation();
    const id = Number(staff.dataset.staff);
    const b = state.buildings.find(x => x.id === id);
    const w = state.workers.find(x => x.ownerId === id);
    if (w) {
      state.workers.splice(state.workers.indexOf(w), 1);
      state.joblessProfessionals.push({ job: b.type });
      msg(`👤 ${BUILDINGS[b.type]?.name || b.type} released. Profession retained.`);
    } else {
      const existing = state.joblessProfessionals.findIndex(p => p.job === b.type);
      if (existing >= 0) {
        state.joblessProfessionals.splice(existing, 1);
        hireWorker(state, b);
        msg(`👷 Existing ${BUILDINGS[b.type]?.name || b.type} specialist assigned.`);
      } else {
        const cap = 4 + state.buildings.filter(x => x.type === 'house').length * 2;
        const used = state.workers.length + state.joblessProfessionals.length + state.pioneers.length;
        const tool = TOOL[b.type];
        if (used >= cap) msg('❌ No available bearer population.');
        else if (!tool || !(state.tools[tool] > 0)) msg(`❌ Worker request waiting: no ${tool || 'required'} tool available.`);
        else {
          state.tools[tool]--;
          hireWorker(state, b);
          msg(`🧰 Bearer took 1 ${tool} and became a ${BUILDINGS[b.type]?.name || b.type}.`);
        }
      }
    }
    return;
  }

  const pioneer = e.target.closest('[data-pioneer]');
  if (pioneer) {
    e.preventDefault();
    e.stopPropagation();
    selectMode('pioneer');
    return;
  }

  const btn = e.target.closest('[data-build]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  selectMode(btn.dataset.build);
});

function outstanding(site, kind) {
  return Math.max(0, (site.required[kind] || 0) - (site.delivered[kind] || 0) - state.goods.filter(g => g.construction && g.destinationId === site.id && g.kind === kind).length);
}

function dispatchSite(site) {
  for (const kind of Object.keys(site.required)) {
    const need = outstanding(site, kind);
    const available = Math.min(need, store.output?.[kind] || 0);
    if (available <= 0) continue;
    const original = { ...site.required };
    site.required = { ...Object.fromEntries(Object.keys(original).map(k => [k, 0])), [kind]: available };
    const before = state.inventory[kind] || 0;
    const ok = seedConstructionCargo(state, site, store);
    site.required = original;
    if (ok) {
      const sent = before - (state.inventory[kind] || 0);
      store.output[kind] = Math.max(0, (store.output[kind] || 0) - sent);
    }
  }
}

function dispatchConstruction() {
  for (const site of state.constructionSites) dispatchSite(site);
}

function updatePioneers(dt) {
  const target = state.pioneerTarget;
  if (!target || !state.pioneers.length) return;
  const p = state.pioneers[0];
  p.moveTimer += dt;
  p.workTimer += dt;

  if (p.workTimer >= 1.2) {
    p.workTimer = 0;
    own(p.x, p.y);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) own(p.x + dx, p.y + dy);
  }

  if (p.x === target.x && p.y === target.y) {
    if (!isOwned(p.x, p.y)) own(p.x, p.y);
    state.pioneerTarget = null;
    msg(`✅ Pioneer reached ${p.x},${p.y}. Territory claimed.`);
    return;
  }

  if (p.moveTimer >= 0.32) {
    p.moveTimer = 0;
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) p.x += Math.sign(dx);
    else if (dy !== 0) p.y += Math.sign(dy);
    p.x = Math.max(0, Math.min(31, p.x));
    p.y = Math.max(0, Math.min(31, p.y));
  }
}

let last = performance.now();
let dispatch = 0;
let orderTimer = 0;

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  updateWorkers(state, dt);
  updateCarriers(state, dt);
  updateConstruction(state, dt);
  updatePioneers(dt);
  dispatch += dt;
  orderTimer += dt;
  if (dispatch > 0.5) {
    dispatch = 0;
    dispatchStoredOutputs(state);
  }
  if (orderTimer > 0.6) {
    orderTimer = 0;
    dispatchConstruction();
  }
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
window.settlers = { state, view, ui };

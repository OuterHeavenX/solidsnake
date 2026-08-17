import{JOBS}from'./config.js';
import{nextId}from'./state.js';
export function workerFor(state,ownerId){return state.workers.find(w=>w.ownerId===ownerId)||null}
export function hireWorker(state,building){if(!JOBS[building.type]||workerFor(state,building.id))return null;const worker={id:nextId(state,'worker'),ownerId:building.id,job:building.type,x:building.x+.08,y:building.y+.08,state:building.type==='mill'?'wait-input':'seek',targetId:null,timer:0,carry:null,speed:building.type==='farm'?1:1.12};state.workers.push(worker);return worker}
export function walkDirect(entity,tx,ty,dt){const dx=tx-entity.x,dy=ty-entity.y,d=Math.hypot(dx,dy);if(d<.06){entity.x=tx;entity.y=ty;return true}const m=Math.min(d,entity.speed*dt);entity.x+=dx/d*m;entity.y+=dy/d*m;return false}

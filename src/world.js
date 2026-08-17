import{WORLD}from'./config.js';
export const key=(x,y)=>`${x},${y}`;
export function inBounds(x,y){return x>=0&&y>=0&&x<WORLD.width&&y<WORLD.height}
export function buildingAt(state,x,y){return state.buildings.find(b=>b.x===x&&b.y===y)||state.constructionSites.find(b=>b.x===x&&b.y===y)||null}
export function roadish(state,x,y){const b=state.buildings.find(v=>v.x===x&&v.y===y);return !!b&&(b.type==='road'||b.type==='flag')}
export function neighbors(state,x,y){return[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:x+dx,y:y+dy})).filter(p=>inBounds(p.x,p.y)&&roadish(state,p.x,p.y))}
export function roadPath(state,a,b){if(!a||!b||!roadish(state,a.x,a.y)||!roadish(state,b.x,b.y))return[];const q=[{x:a.x,y:a.y}],seen=new Set([key(a.x,a.y)]),prev=new Map();for(let h=0;h<q.length;h++){const p=q[h];if(p.x===b.x&&p.y===b.y){const out=[];let k=key(p.x,p.y);while(k){const[x,y]=k.split(',').map(Number);out.push({x,y});k=prev.get(k)}return out.reverse()}for(const n of neighbors(state,p.x,p.y)){const k=key(n.x,n.y);if(!seen.has(k)){seen.add(k);prev.set(k,key(p.x,p.y));q.push(n)}}}return[]}
export function adjacentFlag(state,obj){return state.buildings.find(f=>f.type==='flag'&&Math.abs(f.x-obj.x)+Math.abs(f.y-obj.y)===1)||null}

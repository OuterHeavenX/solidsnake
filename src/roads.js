import{roadPath}from'./world.js';
import{segmentKey}from'./logistics.js';
export function connectedFlag(state,f){return state.buildings.some(b=>(b.type==='road'||b.type==='flag')&&Math.abs(b.x-f.x)+Math.abs(b.y-f.y)===1)}
function directSegmentRoute(state,a,b){const route=roadPath(state,a,b);if(!route.length)return null;for(let i=1;i<route.length-1;i++){const p=route[i],node=state.buildings.find(v=>v.x===p.x&&v.y===p.y);if(node?.type==='flag')return null}return route}
export function rebuildSegments(state){const flags=state.buildings.filter(b=>b.type==='flag'&&connectedFlag(state,b)),old=new Map(state.segments.map(s=>[s.key,s])),next=[];for(let i=0;i<flags.length;i++)for(let j=i+1;j<flags.length;j++){const route=directSegmentRoute(state,flags[i],flags[j]);if(!route)continue;const key=segmentKey(flags[i],flags[j]),existing=old.get(key);next.push(existing?{...existing,route}:{key,a:flags[i].id,b:flags[j].id,route,carrierId:null})}state.segments=next;return next}
export function segmentsForFlag(state,flagId){return state.segments.filter(s=>s.a===flagId||s.b===flagId)}

import{BUILDINGS}from'./config.js';
import{nextId}from'./state.js';
export function createConstructionSite(state,type,x,y){const spec=BUILDINGS[type];if(!spec||type==='road'||type==='flag')return null;const site={id:nextId(state,'building'),type,x,y,status:'awaiting-materials',required:{...spec.cost},delivered:{},progress:0,builderId:null};state.constructionSites.push(site);return site}
export function materialOutstanding(site,kind){return Math.max(0,(site.required[kind]||0)-(site.delivered[kind]||0))}
export function receiveConstructionMaterial(site,kind,amount=1){site.delivered[kind]=(site.delivered[kind]||0)+amount;if(isMaterialComplete(site))site.status='ready-for-builder'}
export function isMaterialComplete(site){return Object.entries(site.required).every(([kind,count])=>(site.delivered[kind]||0)>=count)}
export function assignBuilder(state,site,x,y){if(site.status!=='ready-for-builder'||site.builderId)return null;const builder={id:nextId(state,'builder'),siteId:site.id,x,y,state:'travel',speed:1.05};state.builders.push(builder);site.builderId=builder.id;site.status='builder-en-route';return builder}
export function advanceConstruction(site,seconds){if(site.status!=='building')return false;site.progress=Math.min(1,site.progress+seconds/6);if(site.progress>=1){site.status='complete';return true}return false}

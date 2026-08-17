import{createState,nextId}from'./state.js';import{createRenderer}from'./renderer.js';import{attachInput}from'./input.js';import{createUI}from'./ui-v17.js';import{rebuildSegments}from'./roads.js';import{hireWorker}from'./workers.js';import{ensureSegmentCarriers,updateCarriers}from'./transport-v16.js';import{updateWorkers}from'./jobs-v16.js';import{dispatchStoredOutputs}from'./logistics-v16.js';
const canvas=document.querySelector('#c'),state=createState(),view={x:innerWidth/2,y:80,zoom:.68};
function add(type,x,y,worker=true){const b={id:nextId(state,'building'),type,x,y,input:{},output:{}};state.buildings.push(b);if(worker)hireWorker(state,b);return b}
function road(x,y,type='road'){return add(type,x,y,false)}
for(let x=5;x<=19;x++)road(x,13);
for(const x of[5,9,12,15,19]){const i=state.buildings.findIndex(b=>b.x===x&&b.y===13&&b.type==='road');if(i>=0)state.buildings.splice(i,1);road(x,13,'flag')}
add('wood',5,12);add('mill',9,12);add('store',12,12,false);add('farm',15,12);add('quarry',19,12);add('house',11,12,false);
for(let i=0;i<55;i++)state.trees.push({id:i+1,x:2+(i*7)%29,y:3+(i*11)%24,alive:true});
for(let i=0;i<34;i++)state.rocks.push({id:100+i,x:3+(i*9)%28,y:2+(i*5)%22,alive:true});
for(let i=0;i<38;i++)state.crops.push({id:200+i,x:4+(i*5)%27,y:4+(i*7)%20,alive:true});
rebuildSegments(state);ensureSegmentCarriers(state);createRenderer(canvas,state,view);attachInput(canvas,view);createUI(state);let last=performance.now(),dispatch=0;
function tick(now){const dt=Math.min(.05,(now-last)/1000);last=now;updateWorkers(state,dt);updateCarriers(state,dt);dispatch+=dt;if(dispatch>.5){dispatch=0;dispatchStoredOutputs(state)}requestAnimationFrame(tick)}requestAnimationFrame(tick);window.settlers={state,view};

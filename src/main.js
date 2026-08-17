import{createState,nextId}from'./state.js';import{createRenderer}from'./renderer.js';import{attachInput}from'./input.js';import{createUI}from'./ui.js';import{rebuildSegments}from'./roads.js';import{hireWorker}from'./workers.js';import{ensureSegmentCarriers,updateCarriers}from'./transport.js';import{updateWorkers}from'./jobs.js';
const canvas=document.querySelector('#c'),state=createState(),view={x:innerWidth/2,y:80,zoom:.72};
function add(type,x,y){const b={id:nextId(state,'building'),type,x,y,input:{logs:0}};state.buildings.push(b);hireWorker(state,b);return b}
function road(x,y,type='road'){return add(type,x,y)}
/* Independent parity-test settlement. */
for(let x=7;x<=22;x++)road(x,13);for(let y=8;y<=19;y++)road(14,y);road(9,13,'flag');road(14,13,'flag');road(19,13,'flag');road(14,9,'flag');road(14,18,'flag');add('store',13,15);add('wood',9,12);add('mill',12,12);add('quarry',18,12);add('farm',15,17);add('house',12,15);
for(let i=0;i<28;i++)state.trees.push({id:i+1,x:4+(i*7)%25,y:4+(i*11)%24,alive:true});for(let i=0;i<18;i++)state.rocks.push({id:i+1,x:5+(i*9)%24,y:5+(i*5)%23,alive:true});for(let i=0;i<16;i++)state.crops.push({id:i+1,x:12+(i%5),y:17+Math.floor(i/5),alive:true,regrow:0});
rebuildSegments(state);ensureSegmentCarriers(state);createRenderer(canvas,state,view);attachInput(canvas,view);createUI(state);
let last=performance.now();function tick(now){const dt=Math.min(.05,(now-last)/1000);last=now;rebuildSegments(state);ensureSegmentCarriers(state);updateWorkers(state,dt);updateCarriers(state,dt);requestAnimationFrame(tick)}requestAnimationFrame(tick);
window.modularSettlers={state,view,rebuildSegments};

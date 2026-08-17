/* Construction milestone layered on the working flag-segment simulation. */
fetch('./app-v7.js?v=12').then(r=>r.text()).then(wrapper=>{
  /* app-v7 is itself a source transformer, so patch the underlying v6 source first. */
  return fetch('./app-v6.js?v=11').then(r=>r.text()).then(src=>{
    src=src.replace("let cam={x:innerWidth/2,y:-120,z:.82},drag=false,moved=false,last=null,sel='road',nid=1,ng=1,nc=1,nw=1,t0=performance.now(),selectedFlag=null,toastTimer=0;","let cam={x:innerWidth/2,y:-120,z:.82},drag=false,moved=false,last=null,sel='road',nid=1,ng=1,nc=1,nw=1,nb=1,t0=performance.now(),selectedFlag=null,selectedSite=null,toastTimer=0;");
    src=src.replace("let s={inv:{wood:100,logs:0,planks:24,stone:70,food:30},b:[],goods:[],carriers:[],workers:[],trees:[],rocks:[],crops:[],delivered:0};","let s={inv:{wood:100,logs:0,planks:24,stone:70,food:30},b:[],goods:[],carriers:[],workers:[],builders:[],trees:[],rocks:[],crops:[],delivered:0};");

    /* Buildings no longer pay instantly: non-infrastructure placements become sites. */
    const oldAdd="if(!free&&!afford(T[type].co)){toast('Not enough resources');return false}if(!free)Object.entries(T[type].co||{}).forEach(([k,v])=>s.inv[k]-=v);let o={id:nid++,type,x:a,y:b,input:{logs:0},cycles:0};s.b.push(o);if(type==='flag'){selectedFlag=o.id;ensureCarriers()}hireWorker(o);ui();return true}";
    const newAdd=`if(!free&&type!=='road'&&type!=='flag'){let cost=T[type].co||{};let o={id:nid++,type,x:a,y:b,input:{logs:0},cycles:0,site:true,need:{...cost},delivered:{},progress:0,builder:null};s.b.push(o);selectedSite=o.id;ui();toast('Construction site placed · connect a flag for deliveries');return true}if(!free&&!afford(T[type].co)){toast('Not enough resources');return false}if(!free)Object.entries(T[type].co||{}).forEach(([k,v])=>s.inv[k]-=v);let o={id:nid++,type,x:a,y:b,input:{logs:0},cycles:0};s.b.push(o);if(type==='flag'){selectedFlag=o.id;ensureCarriers()}hireWorker(o);ui();return true}`;
    src=src.replace(oldAdd,newAdd);

    /* Construction sites are valid logistics destinations for requested materials. */
    src=src.replace("function destinations(kind,srcFlag){let types=kind==='logs'?['mill','store']:['store'],out=[];","function destinations(kind,srcFlag){let out=[];for(let b of s.b.filter(v=>v.site&&((v.need[kind]||0)>(v.delivered[kind]||0)))){let f=flagFor(b);if(!f)continue;let r=path(srcFlag,f);if(r.length)out.push({b,f,r,dist:r.length,site:true})}if(out.length){out.sort((a,b)=>a.dist-b.dist);return out}let types=kind==='logs'?['mill','store']:['store'];out=[];");

    /* Site delivery consumes cargo into the site's material stockpile. */
    src=src.replace("if(d&&d.type==='mill'&&item.kind==='logs')d.input.logs++;else if(d)s.inv[item.kind]=(s.inv[item.kind]||0)+1;","if(d&&d.site){d.delivered[item.kind]=(d.delivered[item.kind]||0)+1}else if(d&&d.type==='mill'&&item.kind==='logs')d.input.logs++;else if(d)s.inv[item.kind]=(s.inv[item.kind]||0)+1;");

    /* Builders only begin after all materials have physically arrived. */
    src=src.replace("function updateWorkers(dt){",`function siteReady(o){return Object.entries(o.need||{}).every(([k,v])=>(o.delivered[k]||0)>=v)}
function ensureBuilder(o){if(!o.site||!siteReady(o)||o.builder)return;let home=s.b.find(b=>b.type==='store'&&!b.site)||s.b.find(b=>b.type==='house'&&!b.site);let b={id:nb++,site:o.id,x:home?home.x:o.x+2,y:home?home.y:o.y+2,state:'toSite',speed:1.05};s.builders.push(b);o.builder=b.id;toast('Builder dispatched to '+T[o.type].n)}
function updateBuilders(dt){for(let o of s.b.filter(b=>b.site))ensureBuilder(o);for(let b of [...s.builders]){let o=s.b.find(v=>v.id===b.site);if(!o){s.builders=s.builders.filter(v=>v.id!==b.id);continue}if(b.state==='toSite'){if(walkDirect(b,o.x,o.y,dt))b.state='build'}else if(b.state==='build'){o.progress=Math.min(1,o.progress+dt/6);if(o.progress>=1){o.site=false;o.builder=null;hireWorker(o);s.builders=s.builders.filter(v=>v.id!==b.id);selectedSite=null;toast(T[o.type].n+' construction complete')}}}}
function updateWorkers(dt){`);

    /* Sites don't hire production workers until complete. */
    src=src.replace("function hireWorker(o){if(!JOB[o.type]||workerFor(o))return;","function hireWorker(o){if(o.site||!JOB[o.type]||workerFor(o))return;");

    /* Draw construction stockpiles, scaffolding, progress and builder. */
    src=src.replace("function drawBuilding(b){let p=iso(b.x,b.y),z=cam.z,d=T[b.type];","function drawBuilding(b){let p=iso(b.x,b.y),z=cam.z,d=T[b.type];if(b.site){diamond(b.x,b.y,'#a18b64','#6b593d');g.fillStyle='#80633e';g.fillRect(p.x-18*z,p.y+8*z,36*z,8*z);g.strokeStyle='#d7bd7d';g.lineWidth=2*z;for(let i=-15;i<=15;i+=10){g.beginPath();g.moveTo(p.x+i*z,p.y+18*z);g.lineTo(p.x+i*z,p.y-8*z);g.stroke()}g.beginPath();g.moveTo(p.x-20*z,p.y+2*z);g.lineTo(p.x+20*z,p.y+2*z);g.stroke();g.fillStyle='#172018';g.fillRect(p.x-20*z,p.y+25*z,40*z,5*z);g.fillStyle='#e0bd55';g.fillRect(p.x-20*z,p.y+25*z,40*z*(b.progress||0),5*z);g.fillStyle='#fff0c0';g.font=\`${9*z}px system-ui\`;g.textAlign='center';let mats=Object.entries(b.need||{}).map(([k,v])=>(b.delivered[k]||0)+'/'+v+' '+k).join(' · ');g.fillText('BUILD '+Math.round((b.progress||0)*100)+'%',p.x,p.y-12*z);g.font=\`${7*z}px system-ui\`;g.fillText(mats,p.x,p.y+39*z);return}");
    src=src.replace("function render(){","function drawBuilder(b){let p=iso(b.x,b.y),z=cam.z;g.fillStyle='#f0d1a0';g.beginPath();g.arc(p.x,p.y+8*z,3.4*z,0,7);g.fill();g.fillStyle='#c58a35';g.fillRect(p.x-3*z,p.y+11*z,6*z,9*z);g.fillStyle='#fff';g.font=\`${7*z}px sans-serif\`;g.textAlign='center';g.fillText(b.state==='build'?'BUILD':'BUILDER',p.x,p.y-1*z)}\nfunction render(){");
    src=src.replace("for(let w of s.workers)drawWorker(w);for(let v of s.carriers)","for(let w of s.workers)drawWorker(w);for(let b of s.builders)drawBuilder(b);for(let v of s.carriers)");

    /* Sites request one unit at a time from global storage by spawning cargo at storage flag. */
    src=src.replace("function updateCarriers(dt){assignCarriers();","function requestSiteMaterials(){let store=s.b.find(b=>b.type==='store'&&!b.site),sf=store&&flagFor(store);if(!store||!sf)return;for(let site of s.b.filter(b=>b.site&&flagFor(b))){for(let [kind,need] of Object.entries(site.need||{})){let delivered=site.delivered[kind]||0,inflight=s.goods.filter(g=>g.dst===site.id&&g.kind===kind).length;if(delivered+inflight>=need||(s.inv[kind]||0)<=0)continue;s.inv[kind]--;let r=path(sf,flagFor(site));if(!r.length){s.inv[kind]++;continue}let hops=routeFlags(r,sf,flagFor(site));s.goods.push({id:ng++,kind,x:sf.x,y:sf.y,src:store.id,currentFlag:sf.id,dst:site.id,toFlag:flagFor(site).id,hops,carrier:null,blocked:false});break}}}\nfunction updateCarriers(dt){requestSiteMaterials();assignCarriers();");

    /* Inspector + status. */
    src=src.replace("Completed deliveries: ${s.delivered}${extra}","Construction sites: <b>${s.b.filter(b=>b.site).length}</b> · builders: ${s.builders.length}<br>Completed deliveries: ${s.delivered}${extra}");
    src=src.replace("updateWorkers(dt);updateCarriers(dt);render();","updateWorkers(dt);updateCarriers(dt);updateBuilders(dt);render();");

    /* Now apply the already-shipped v7 flag-segment transformations to this patched source. */
    let transformed=wrapper.replace("fetch('./app-v6.js?v=8').then(r=>r.text()).then(src=>{","Promise.resolve(src).then(src=>{");
    (0,eval)(`(function(src){${transformed}\n})(src);`);
  });
}).catch(err=>{const e=document.getElementById('err');if(e){e.style.display='block';e.textContent='Game error: '+err.message}});

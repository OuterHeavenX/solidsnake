/* Flag-segment logistics runtime. Loads the known-good staffed economy engine,
   then upgrades its carrier model before execution. */
fetch('./app-v6.js?v=8').then(r=>r.text()).then(src=>{
  src=src.replace(
    "let s={inv:{wood:100,logs:0,planks:24,stone:70,food:30},b:[],goods:[],carriers:[],workers:[],trees:[],rocks:[],crops:[],delivered:0};",
    "let s={inv:{wood:100,logs:0,planks:24,stone:70,food:30},b:[],goods:[],carriers:[],segments:[],workers:[],trees:[],rocks:[],crops:[],delivered:0};"
  );

  const oldEnsure="function ensureCarriers(){let fs=s.b.filter(b=>b.type==='flag'&&connectedFlag(b));let target=Math.min(5,Math.max(2,Math.ceil(fs.length/2)));while(s.carriers.length<target&&fs.length){let f=fs[s.carriers.length%fs.length];s.carriers.push({id:nc++,x:f.x,y:f.y,state:'idle',good:null,path:[],step:0,carry:null,speed:1.45})}}";
  const newEnsure=`function segmentKey(a,b){return a.id<b.id?a.id+'-'+b.id:b.id+'-'+a.id}
function segmentRoute(a,b){let r=path(a,b);if(!r.length)return null;for(let i=1;i<r.length-1;i++){let n=at(r[i].x,r[i].y);if(n&&n.type==='flag')return null}return r}
function rebuildSegments(){let fs=s.b.filter(b=>b.type==='flag'&&connectedFlag(b)),next=[];for(let i=0;i<fs.length;i++)for(let j=i+1;j<fs.length;j++){let r=segmentRoute(fs[i],fs[j]);if(!r)continue;let k=segmentKey(fs[i],fs[j]);let old=s.segments.find(v=>v.key===k);next.push(old||{key:k,a:fs[i].id,b:fs[j].id,route:r,carrier:null})}s.segments=next;for(let seg of s.segments){seg.route=segmentRoute(s.b.find(b=>b.id===seg.a),s.b.find(b=>b.id===seg.b))||seg.route;if(!seg.carrier){let a=s.b.find(b=>b.id===seg.a);let c={id:nc++,x:a.x,y:a.y,state:'idle',good:null,path:[],step:0,carry:null,speed:1.35,segment:seg.key,home:a.id};s.carriers.push(c);seg.carrier=c.id}}s.carriers=s.carriers.filter(c=>!c.segment||s.segments.some(v=>v.key===c.segment))}
function ensureCarriers(){rebuildSegments()}`;
  src=src.replace(oldEnsure,newEnsure);

  const oldAssign="function assignCarriers(){for(let item of s.goods)refreshGood(item);for(let c of s.carriers){if(c.state!=='idle')continue;let start={x:Math.round(c.x),y:Math.round(c.y)},pick=null,pickPath=[];for(let item of s.goods.filter(v=>!v.carrier&&!v.blocked)){let cf=s.b.find(b=>b.id===item.currentFlag),p=path(start,cf);if(p.length){pick=item;pickPath=p;break}}if(!pick)continue;pick.carrier=c.id;c.good=pick.id;c.path=pickPath;c.step=0;c.state='pickup'}}";
  const newAssign=`function assignCarriers(){for(let item of s.goods)refreshGood(item);for(let c of s.carriers){if(c.state!=='idle'||!c.segment)continue;let seg=s.segments.find(v=>v.key===c.segment);if(!seg)continue;let pick=s.goods.find(item=>!item.carrier&&!item.blocked&&item.hops.length&&((item.currentFlag===seg.a&&item.hops[0]===seg.b)||(item.currentFlag===seg.b&&item.hops[0]===seg.a)));if(!pick)continue;let cf=s.b.find(b=>b.id===pick.currentFlag),start={x:Math.round(c.x),y:Math.round(c.y)},p=path(start,cf);if(!p.length)continue;pick.carrier=c.id;c.good=pick.id;c.path=p;c.step=0;c.state='pickup'}}`;
  src=src.replace(oldAssign,newAssign);

  src=src.replace(
    "function flagQueueText(f){let goods=s.goods.filter(v=>v.currentFlag===f.id&&!v.carrier);if(!goods.length)return 'Flag queue: empty';let counts={};for(let q of goods)counts[q.kind]=(counts[q.kind]||0)+1;return 'Flag queue: '+Object.entries(counts).map(([k,v])=>v+' '+k).join(' · ')}",
    `function flagQueueText(f){let goods=s.goods.filter(v=>v.currentFlag===f.id&&!v.carrier),counts={};for(let q of goods)counts[q.kind]=(counts[q.kind]||0)+1;let cargo=goods.length?Object.entries(counts).map(([k,v])=>v+' '+k).join(' · '):'empty';let segs=s.segments.filter(v=>v.a===f.id||v.b===f.id);let routes=segs.map(seg=>{let other=s.b.find(b=>b.id===(seg.a===f.id?seg.b:seg.a)),carrier=s.carriers.find(c=>c.id===seg.carrier);return '→ Flag #'+(other?other.id:'?')+' · Carrier #'+(carrier?carrier.id:'?')+(carrier&&carrier.state!=='idle'?' BUSY':' idle')}).join('<br>');return 'Waiting: '+cargo+'<br>Connected segments: '+segs.length+(routes?'<br>'+routes:'')}`
  );

  src=src.replace(
    "if(type==='flag'){selectedFlag=o.id;ensureCarriers()}hireWorker(o);ui();return true}",
    "if(type==='flag'){selectedFlag=o.id;ensureCarriers();toast('Flag created · road segments recalculated')}hireWorker(o);ui();return true}"
  );
  src=src.replace(
    "old.type='flag';old.input={logs:0};selectedFlag=old.id;ensureCarriers();ui();toast('Road converted to flag');return true",
    "old.type='flag';old.input={logs:0};selectedFlag=old.id;ensureCarriers();ui();toast('Road split into carrier segments');return true"
  );

  src=src.replace(
    "let idle=s.carriers.filter(v=>v.state==='idle').length,blocked=s.goods.filter(v=>v.blocked).length",
    "let idle=s.carriers.filter(v=>v.state==='idle').length,blocked=s.goods.filter(v=>v.blocked).length"
  );
  src=src.replace(
    "Carriers: ${idle} idle · ${s.carriers.length-idle} busy<br>Goods waiting:",
    "Road segments: <b>${s.segments.length}</b> · dedicated carriers: ${s.carriers.length}<br>Carriers: ${idle} idle · ${s.carriers.length-idle} busy<br>Goods waiting:"
  );

  /* Cargo must visibly rest at a transfer flag before another segment carrier can claim it. */
  src=src.replace("s.delivered++}else refreshGood(item)}}}","s.delivered++}else{item.readyAt=performance.now()+900;refreshGood(item)}}}}")
         .replace("!item.carrier&&!item.blocked&&item.hops.length&&(","!item.carrier&&!item.blocked&&(!item.readyAt||performance.now()>=item.readyAt)&&item.hops.length&&(");

  /* Make selected flags show their operational footprint on the map. */
  src=src.replace(
    "if(selected){g.strokeStyle='#ffe58a';g.lineWidth=2*z;g.beginPath();g.arc(p.x,p.y+4*z,18*z,0,Math.PI*2);g.stroke()}return",
    "if(selected){g.strokeStyle='#ffe58a';g.lineWidth=2*z;g.beginPath();g.arc(p.x,p.y+4*z,18*z,0,Math.PI*2);g.stroke();for(let seg of s.segments.filter(v=>v.a===b.id||v.b===b.id)){let other=s.b.find(q=>q.id===(seg.a===b.id?seg.b:seg.a));if(other){let op=iso(other.x,other.y);g.strokeStyle='rgba(255,229,138,.75)';g.lineWidth=3*z;g.beginPath();g.moveTo(p.x,p.y+10*z);g.lineTo(op.x,op.y+10*z);g.stroke()}}}return"
  );

  (0,eval)(src+'\n//# sourceURL=app-v7-runtime.js');
}).catch(err=>{const e=document.getElementById('err');if(e){e.style.display='block';e.textContent='Game error: '+err.message}});

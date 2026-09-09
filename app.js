/* 它怎么动 · 3D 互动引擎（每个物件一个场景文件，本文件负责相机、点选、透视、拆开、讲解、配音、昼夜） */
(function(){
const SC=window.SCENES[window.SCENE_ID];if(!SC){alert('场景不存在：'+window.SCENE_ID);return;}
const LOOK=Object.assign({hemi:.9,sun:.8,fill:.35,rim:.25,exposure:1.15,srgb:false,autoRotate:.10},SC.look||{});
const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),now=()=>performance.now();
let muted=localStorage.getItem('muted')==='1';
document.title=SC.title+' · 它怎么动';$('#ttl').textContent=SC.title;$('#subtitle').textContent=SC.subtitle||'拖一拖转圈 · 点零件听听';
$('#sky-day').style.background=SC.sky||'linear-gradient(180deg,#F3F6FA 0%,#E1E7EE 40%,#C6D0DB 100%)';
if(!SC.night)$('#sky-night').style.display='none';
$('#gotxt').textContent=SC.go.on;

/* ================= 音效 ================= */
const sfx={ctx:null,cur:null,wantLoop:null,
  ac(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;if(!this.ctx)this.ctx=new AC();if(this.ctx.state==='suspended')this.ctx.resume();return this.ctx;},
  tone(f,d,type='sine',g=.12,t0=0){const c=this.ac();if(!c||muted)return;const o=c.createOscillator(),ga=c.createGain();o.type=type;o.frequency.value=f;
    const T=c.currentTime+t0;ga.gain.setValueAtTime(0,T);ga.gain.linearRampToValueAtTime(g,T+.01);ga.gain.exponentialRampToValueAtTime(.001,T+d);
    o.connect(ga).connect(c.destination);o.start(T);o.stop(T+d+.02);},
  click(){this.tone(900,.06,'square',.05)},pop(){this.tone(220,.1,'triangle',.09)},ding(){this.tone(1046,.5,'sine',.1);this.tone(1318,.6,'sine',.08,.12)},
  horn(){this.tone(440,.35,'square',.07);this.tone(554,.35,'square',.07)},
  noise(d=.6,f=500,g=.08){const c=this.ac();if(!c||muted)return;const buf=c.createBuffer(1,Math.floor(c.sampleRate*d),c.sampleRate),a=buf.getChannelData(0);for(let i=0;i<a.length;i++){const u=i/a.length;a[i]=(Math.random()*2-1)*Math.sin(Math.PI*u);}
    const src=c.createBufferSource();src.buffer=buf;const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=f;const ga=c.createGain();ga.gain.value=g;src.connect(fl).connect(ga).connect(c.destination);src.start();},
  pour(){this.noise(.9,700,.1)},scoop(){this.noise(.5,260,.09)},
  door(){this.tone(160,.14,'triangle',.12);this.tone(1200,.04,'square',.04,.1)},
  slide(){const c=this.ac();if(!c||muted)return;const buf=c.createBuffer(1,c.sampleRate*.5,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const src=c.createBufferSource();src.buffer=buf;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1400;f.Q.value=.8;const g=c.createGain();g.gain.value=.08;src.connect(f).connect(g).connect(c.destination);src.start();this.tone(880,.08,'sine',.05,.42);},
  loop(name){this.wantLoop=name;const c=this.ac();if(!c||muted)return;if(this.cur){if(this.cur.name===name)return;this.stopLoop();this.wantLoop=name;}const g=c.createGain(),nodes=[];// 换一种循环音时先停掉旧的（以前下雨的水声占着位置，发动机声就起不来）
    if(name==='engine'){const o=c.createOscillator(),lfo=c.createOscillator(),lg=c.createGain(),f=c.createBiquadFilter();o.type='sawtooth';o.frequency.value=52;lfo.type='sine';lfo.frequency.value=14;lg.gain.value=.03;lfo.connect(lg).connect(g.gain);f.type='lowpass';f.frequency.value=260;g.gain.value=.06;o.connect(f).connect(g);o.start();lfo.start();nodes.push(o,lfo);}
    else if(name==='hum'){const o=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter();o.type='triangle';o.frequency.value=110;o2.type='sine';o2.frequency.value=221;f.type='lowpass';f.frequency.value=600;g.gain.value=.05;o.connect(f);o2.connect(f);f.connect(g);o.start();o2.start();nodes.push(o,o2);}
    else if(name==='water'){const buf=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const src=c.createBufferSource();src.buffer=buf;src.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=.6;g.gain.value=.05;src.connect(f).connect(g);src.start();nodes.push(src);}
    g.connect(c.destination);this.cur={g,nodes,name};},
  stopLoop(){this.wantLoop=null;if(!this.cur)return;const {g,nodes}=this.cur,c=this.ctx;g.gain.setTargetAtTime(0,c.currentTime,.08);setTimeout(()=>{for(const n of nodes){try{n.stop()}catch(e){}}},400);this.cur=null;},
  pauseLoop(){const w=this.wantLoop;this.stopLoop();this.wantLoop=w;}
};

/* ================= 配音：预生成 mp3 优先，系统合成音兜底 ================= */
const VOICE_OPTS=[{id:'yunxia',label:'云夏'},{id:'xiaoyi',label:'小依'},{id:'sys',label:'系统'}];
let voiceMode=localStorage.getItem('voice')||'yunxia',LINES=window.VOICE_LINES||{};
// 配音表走 <script> 内嵌；直接双击 html 打开时 fetch 会被浏览器拦掉，那样每句话都会变成系统机器音
if(!window.VOICE_LINES)fetch('voice/lines.json',{cache:'no-store'}).then(r=>r.json()).then(j=>{LINES=j}).catch(()=>{});
const clipEl=new Audio();clipEl.preload='auto';let clipFin=null,sysFin=null;
function stopClip(){if(clipFin){const f=clipFin;clipFin=null;try{clipEl.pause();}catch(e){}f();}}
function playClip(url,text){stopClip();return new Promise(res=>{let done=false,timer;const fin=()=>{if(!done){done=true;clearTimeout(timer);if(clipFin===fin){clipFin=null;clipEl.pause();}res();}};clipFin=fin;
  clipEl.onended=fin;clipEl.onerror=()=>{if(!done){clipFin=null;saySys(text).then(fin);}};
  clipEl.src=url;clipEl.play().catch(()=>{if(!done){clipFin=null;saySys(text).then(fin);}});timer=setTimeout(fin,30000);});}
function saySys(text){if(!('speechSynthesis' in window))return Promise.resolve();
  return new Promise(res=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.95;u.pitch=1.0;
    const vs=speechSynthesis.getVoices().filter(v=>/zh[-_]CN/i.test(v.lang));const pref=vs.find(v=>/Tingting|Ting-Ting|Xiaoxiao|Yunxi|普通话/i.test(v.name))||vs[0];if(pref)u.voice=pref;
    if(sysFin)sysFin();let done=false,timer;const fin=()=>{if(!done){done=true;clearTimeout(timer);if(sysFin===fin)sysFin=null;res()}};sysFin=fin;u.onend=fin;u.onerror=fin;timer=setTimeout(fin,Math.max(15000,text.length*450));speechSynthesis.speak(u);});}
function say(text){if(muted)return Promise.resolve();const id=LINES[text];if(voiceMode!=='sys'&&id)return playClip(`voice/${voiceMode}/${id}.mp3`,text);return saySys(text);}
function hush(){stopClip();if('speechSynthesis' in window)speechSynthesis.cancel();if(sysFin)sysFin();}
/* 一句话没讲完就别接受下一次点击：小朋友爱连着点，点一下跳一句，什么都没听清。 */
let talking=0,hold=0,talkT0=0;
function busy(){return talking>0||hold>0;}
function paintTalk(){document.body.classList.toggle('talking',busy());}
function holdTalk(on){hold=Math.max(0,hold+(on?1:-1));if(on)talkT0=now();paintTalk();}
function speak(text){const pr=say(text);if(muted)return pr;talking++;talkT0=now();paintTalk();
  const fin=()=>{talking=Math.max(0,talking-1);paintTalk();};pr.then(fin,fin);return pr;}
if('speechSynthesis' in window)speechSynthesis.getVoices();

/* ================= 渲染器 / 灯光 ================= */
const canvas=$('#c');let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){$('#nogl').style.display='flex';return;}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
if(LOOK.srgb)renderer.outputEncoding=THREE.sRGBEncoding;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,1,.1,120);
const hemi=new THREE.HemisphereLight((SC.hemi||{}).sky||0xdfefff,(SC.hemi||{}).ground||0x9aa4b2,.9);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2e0,.8);sun.position.set(6,10,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:30});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;scene.add(sun);
const fill=new THREE.DirectionalLight(0xdfe9ff,.35);fill.position.set(-6,4,-6);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffffff,.25);rim.position.set(-3,6,6);scene.add(rim);
if(LOOK.srgb){renderer.shadowMap.type=THREE.VSMShadowMap;sun.position.set(-3,8,6);sun.shadow.mapSize.set(1024,1024);sun.shadow.radius=4;sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;}
if(SC.envMap){const envTex=L3.gradientEnv(...SC.envMap);if(LOOK.srgb)envTex.encoding=THREE.sRGBEncoding;scene.environment=envTex;}
if(SC.fog)scene.fog=new THREE.Fog(SC.fog.color,SC.fog.near,SC.fog.far);
const root=new THREE.Group();scene.add(root);
const ctx=L3.makeCtx(scene,root),{PARTS,placed,hitTargets,shellMeshes}=ctx;

/* ================= 状态 & 场景接入 ================= */
const S={drive:false,xray:false,explode:false,ex:0,xr:0,sel:null,nightT:0,night:0,gloom:0};let lastGloom=-1;
let EE=0;
const api={S,now,sfx,get ee(){return EE},get focusedPart(){return cam.focus},say,caption,toggleNight,camera,hop:p=>hop(p),select:id=>select(id),focusPart:id=>focusPart(id),setExplode:on=>setExplode(on)};
const ENV=SC.env?SC.env(ctx,api):{update(){},occluders:[]};const OCC=ENV.occluders||[];
const OBJ=SC.build(ctx,api);
const ORDER=SC.order||Object.keys(PARTS);
/* 选中描边：沿法线外扩、只画背面 */
const outlineMat=new THREE.ShaderMaterial({uniforms:{width:{value:.022},color:{value:new THREE.Color(0xffffff)}},
  vertexShader:'uniform float width;void main(){vec3 p=position+normal*width;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',
  fragmentShader:'uniform vec3 color;void main(){gl_FragColor=vec4(color,1.0);}',side:THREE.BackSide});
for(const id in PARTS){const p=PARTS[id];for(const m of p.meshes){if(m.userData.noHit||m.userData.glass)continue;const ol=new THREE.Mesh(m.geometry,outlineMat);ol.visible=false;ol.castShadow=false;ol.userData.noHit=true;m.add(ol);p.outlines.push(ol);}}
for(const id in PARTS)for(const m of PARTS[id].meshes){const u=m.userData,mt=m.material;
  if(u.opBase==null)u.opBase=mt.transparent?mt.opacity:1;
  if(u.trBase==null)u.trBase=!!mt.transparent;
  if(u.dwBase==null)u.dwBase=mt.depthWrite!==false;
  if(u.csBase==null)u.csBase=m.castShadow!==false;}
const GHOST=new THREE.Color(0x7A93B5);
if(LOOK.srgb)GHOST.convertSRGBToLinear();
const C_HEMI_D=hemi.color.clone(),C_HEMI_N=new THREE.Color(0x5d74b8),C_GND_D=hemi.groundColor.clone(),C_GND_N=new THREE.Color(0x1c2a3a),
      C_SUN_D=new THREE.Color(0xfff2e0),C_SUN_N=new THREE.Color(0x8fa8ff),C_FOG_D=SC.fog?new THREE.Color(SC.fog.color):null,C_FOG_N=new THREE.Color(SC.nightFog||0x2b4a7e);
if(LOOK.srgb)for(const c of [C_HEMI_D,C_HEMI_N,C_GND_D,C_GND_N,C_SUN_D,C_SUN_N,C_FOG_D,C_FOG_N])c&&c.convertSRGBToLinear();
function toggleNight(){if(!SC.night)return;S.nightT=S.nightT?0:1;document.body.classList.toggle('night',!!S.nightT);}

/* ================= 相机 ================= */
const FIT=Object.assign({w:6,h:4.6,ty:.8,tyEx:1.5,rEx:1.28},SC.fit||{});
const cam={theta:(SC.cameraStart||{}).theta||.95,phi:(SC.cameraStart||{}).phi||1.15,r:9.5,rBase:9.5,tTheta:0,tPhi:0,zoom:1,last:0,focus:null,target:new THREE.Vector3(0,FIT.ty,0)};
cam.tTheta=cam.theta;cam.tPhi=cam.phi;
const _tgt=new THREE.Vector3(),_box=new THREE.Box3(),_sph=new THREE.Sphere(),_occU=new THREE.Vector3(),_occW=new THREE.Vector3();
function fadeObj(o,k){o.visible=k>.02;o.traverse(m=>{if(!m.isMesh)return;const mat=m.material;if(mat.userData.baseOp==null)mat.userData.baseOp=mat.transparent?mat.opacity:1;mat.transparent=true;mat.opacity=mat.userData.baseOp*k;mat.depthWrite=k>.9&&mat.userData.baseOp>.99;m.castShadow=k>.5&&m.userData.cs!==false;});}
function partBounds(p){_box.makeEmpty();for(const m of p.meshes){if(m.userData.noHit)continue;m.updateWorldMatrix(true,false);_box.expandByObject(m);}return _box.getBoundingSphere(_sph);}
let W=1,H=1,freeRatio=1;
function resize(){
  if(!innerWidth||!innerHeight)return;// 页面还没排好版（宽高为 0）就先不算，否则相机距离会变成 NaN，之后一直黑屏
  const first=W===1&&H===1,changed=W!==innerWidth||H!==innerHeight,previousBase=cam.rBase;
  W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);const aspect=W/H;camera.aspect=aspect;camera.fov=48;
  const topH=$('.top').offsetHeight,botH=$('.bottom').offsetHeight,freeH=Math.max(H-topH-botH,H*.4),tv=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  freeRatio=freeH/H;
  const rH=(FIT.w/2)/(tv*aspect),rV=(FIT.h/2)/tv*(H/freeH);cam.rBase=clamp(Math.max(rH,rV),3,40);
  if(first)cam.r=cam.rBase;else if(changed)cam.r*=cam.rBase/previousBase;
  camera.setViewOffset(W,H,0,Math.round((botH-topH)/2),W,H);camera.updateProjectionMatrix();
}
addEventListener('resize',resize);resize();
if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe($('.bottom'));
function updateCamera(dt){
  const t=now();if(!cam.focus&&t-cam.last>3500)cam.tTheta+=dt*LOOK.autoRotate;
  const k=Math.min(1,dt*7);cam.theta+=(cam.tTheta-cam.theta)*k;cam.phi+=(cam.tPhi-cam.phi)*k;
  let rT,tgt;
  if(cam.focus&&PARTS[cam.focus]){const b=partBounds(PARTS[cam.focus]);tgt=_tgt.copy(b.center);
    const vf=THREE.MathUtils.degToRad(camera.fov/2),hf=Math.atan(Math.tan(vf)*camera.aspect);
    const distance=Math.max(b.radius/Math.sin(hf),b.radius/Math.sin(vf)/freeRatio)*1.08;
    rT=clamp(distance,cam.rBase*.22,cam.rBase*1.6)*cam.zoom;}
  else{const oy=OBJ.camY?OBJ.camY():0,ox=OBJ.camX?OBJ.camX():0;tgt=_tgt.set((FIT.cx||0)+ox,(S.explode?FIT.tyEx:FIT.ty)+oy,0);rT=cam.rBase*(S.explode?FIT.rEx:1)*cam.zoom;}// 主体自己会升高时（比如飞机爬升），镜头跟着抬
  if(!isFinite(cam.r))cam.r=rT;cam.r+=(rT-cam.r)*Math.min(1,dt*4);cam.target.lerp(tgt,Math.min(1,dt*4));
  const sp=Math.sin(cam.phi);
  camera.position.set(cam.target.x+cam.r*sp*Math.sin(cam.theta),cam.target.y+cam.r*Math.cos(cam.phi),cam.target.z+cam.r*sp*Math.cos(cam.theta));
  camera.lookAt(cam.target);
}

/* ================= 零件图标（用模型本身离屏渲染）+ 图标栏 + 巡游 ================= */
const ICONS={};
(function makeIcons(){
  const size=160,c=document.createElement('canvas');c.width=c.height=size;let r2;
  try{r2=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true,preserveDrawingBuffer:true});}catch(e){return;}
  r2.setClearColor(0x000000,0);r2.toneMapping=THREE.ACESFilmicToneMapping;r2.toneMappingExposure=1.15;
  r2.outputEncoding=renderer.outputEncoding;r2.toneMappingExposure=LOOK.exposure;
  const sc=new THREE.Scene();sc.environment=scene.environment;sc.add(new THREE.HemisphereLight(0xffffff,0x9aa4b2,.95));
  const dl=new THREE.DirectionalLight(0xfff2e0,.85);dl.position.set(3,5,4);sc.add(dl);
  const pc=new THREE.PerspectiveCamera(28,1,.01,100),box=new THREE.Box3(),sph=new THREE.Sphere(),dir=new THREE.Vector3(1,.8,1).normalize();
  for(const id of ORDER){const p=PARTS[id];if(!p)continue;const src=(OBJ.iconFor&&OBJ.iconFor(id))||p.groups[0];
    const cl=src.clone();sc.add(cl);cl.updateWorldMatrix(true,true);
    box.makeEmpty();cl.traverse(o=>{if(o.isMesh&&!o.userData.noHit&&o.material.opacity>.05&&o.visible)box.expandByObject(o);});
    if(box.isEmpty()){sc.remove(cl);continue;}
    box.getBoundingSphere(sph);const d=sph.radius/Math.sin(THREE.MathUtils.degToRad(pc.fov/2))*1.04;
    pc.position.copy(sph.center).addScaledVector(dir,d);pc.lookAt(sph.center);
    r2.render(sc,pc);ICONS[id]=c.toDataURL('image/png');sc.remove(cl);}
  r2.dispose();if(r2.forceContextLoss)r2.forceContextLoss();
})();
/* 图文海报：拆开的模型渲染成图 + 编号标注 + 工作过程 + 总结 + 家长详细说明 */
const PAL=['#2F8FD6','#3AAD74','#E08E00','#8E5AC8','#E04848','#1F9AA8','#C2185B','#6D4C41'];
function buildPoster(){
  const P=SC.poster||{};$('#pTitle').textContent=P.title||(SC.title+'里面到底长什么样');$('#pSub').textContent=P.sub||'每天都见，但你可能从没看过它的内部！';
  $('#pSum').textContent=P.summary||'';$('#pSum').style.display=P.summary?'':'none';
  const keys=(P.keys||ORDER.slice(0,6)).filter(id=>PARTS[id]);
  // 1) 临时摆成"透视剖面"：零件回到原位、外壳变半透明，渲染成一张透明背景的竖版图（下一帧引擎会自动恢复）
  for(const o of placed)o.position.copy(o.userData.home);
  for(const m of shellMeshes){const mat=m.material;if(!m.userData.glass&&!m.userData.keepEm)mat.color.copy(m.userData.baseCol).lerp(GHOST,1);mat.opacity=m.userData.baseOp*.24;mat.transparent=true;mat.depthWrite=false;m.castShadow=false;}
  root.updateWorldMatrix(true,true);
  const W=1100,H=1100,pc=new THREE.PerspectiveCamera(34,W/H,.1,200);
  const bb=new THREE.Box3();root.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.noHit&&o.material.opacity>.05)bb.expandByObject(o);});
  const sph=bb.getBoundingSphere(new THREE.Sphere()),pa=P.angle||{theta:.95,phi:1.2};
  const vf=THREE.MathUtils.degToRad(pc.fov/2),hf=Math.atan(Math.tan(vf)*pc.aspect),d=Math.max(sph.radius/Math.sin(vf),sph.radius/Math.sin(hf))*1.06;
  const sp=Math.sin(pa.phi);pc.position.set(sph.center.x+d*sp*Math.sin(pa.theta),sph.center.y+d*Math.cos(pa.phi),sph.center.z+d*sp*Math.cos(pa.theta));pc.lookAt(sph.center);pc.updateMatrixWorld();
  const hidden=[];scene.children.forEach(o=>{if(o!==root&&!o.isLight&&o.visible){o.visible=false;hidden.push(o);}});
  const rt=new THREE.WebGLRenderTarget(W,H,{format:THREE.RGBAFormat,encoding:renderer.outputEncoding});renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,0);renderer.render(scene,pc);hidden.forEach(o=>o.visible=true);
  const px=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(rt,0,0,W,H,px);renderer.setRenderTarget(null);rt.dispose();
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),img=g.createImageData(W,H);
  for(let y=0;y<H;y++){const src=(H-1-y)*W*4,dst=y*W*4;img.data.set(px.subarray(src,src+W*4),dst);}g.putImageData(img,0,0);
  $('#pImg').src=c.toDataURL('image/png');
  // 2) 编号标注：只标关键零件，左右各排一列，引线走折线不交叉
  const box=$('#pBox'),svg=$('#pLeads');box.querySelectorAll('.pc,.pn').forEach(e=>e.remove());svg.innerHTML='';
  const AN=P.anchors||{};const items=keys.map((id,i)=>{const p=PARTS[id];const pt=AN[id]?root.localToWorld(new THREE.Vector3(AN[id][0],AN[id][1],AN[id][2])):partBounds(p).center.clone();const v=pt.project(pc);return {id,p,n:i+1,u:(v.x+1)/2,vv:(1-v.y)/2};});
  const L=items.filter(i=>i.u<.5).sort((a,b)=>a.vv-b.vv),R=items.filter(i=>i.u>=.5).sort((a,b)=>a.vv-b.vv);
  const place_=(col,side)=>{const nn=col.length;if(!nn)return;const top=.14,bot=.86,step=nn>1?Math.min(.24,(bot-top)/(nn-1)):0,start=top+((bot-top)-step*(nn-1))/2;
    col.forEach((it,i)=>{const y=start+i*step,col_=PAL[(it.n-1)%PAL.length];
      const card=document.createElement('div');card.className='pc';card.style.top=(y*100)+'%';card.style[side<0?'left':'right']='2%';
      card.innerHTML=`<i style="background:${col_}">${it.n}</i><div><b>${it.p.name}</b><span>${it.p.text}</span></div>`;box.appendChild(card);
      const dot=document.createElement('div');dot.className='pn';dot.style.left=(it.u*100)+'%';dot.style.top=(it.vv*100)+'%';dot.style.background=col_;dot.textContent=it.n;box.appendChild(dot);
      const ex=side<0?34:66,mx=side<0?40:60;const ln=document.createElementNS('http://www.w3.org/2000/svg','polyline');
      ln.setAttribute('points',`${ex},${y*100} ${mx},${y*100} ${it.u*100},${it.vv*100}`);ln.setAttribute('fill','none');ln.setAttribute('stroke',col_);ln.setAttribute('stroke-width','2');ln.setAttribute('vector-effect','non-scaling-stroke');ln.setAttribute('stroke-linejoin','round');svg.appendChild(ln);});};
  place_(L,-1);place_(R,1);
  // 3) 工作过程
  const steps=$('#pSteps');steps.innerHTML='';(OBJ.chain||[]).forEach((st,i)=>{const p=PARTS[st.part];const dv=document.createElement('div');dv.className='ps';
    dv.innerHTML=`<i style="background:${PAL[i%PAL.length]}">${i+1}</i><img src="${p&&ICONS[st.part]||''}" alt=""><span>${st.t.replace(/[。！]$/,'')}</span>`;steps.appendChild(dv);});
  // 4) 家长详细说明：全部零件，关键零件沿用海报编号
  const more=$('#pMore');more.innerHTML='';for(const id of ORDER){const p=PARTS[id];if(!p||!p.more)continue;const k=keys.indexOf(id);const dv=document.createElement('div');dv.className='pm';
    dv.innerHTML=`<i style="background:${k>=0?PAL[k%PAL.length]:'#A5B0C4'}">${k>=0?k+1:'·'}</i><img src="${ICONS[id]||''}" alt=""><div><b>${p.name}</b><p>${p.more}</p></div><button class="sp">▶</button>`;
    dv.querySelector('.sp').onclick=()=>{hush();sfx.ac();say(p.name+'。'+(p.pickText?p.pickText():p.text));};more.appendChild(dv);}
}
function openSheet(){cancelTour();hush();unfocus();if(OBJ.clearFocus)OBJ.clearFocus();buildPoster();const po=$('#poster');po.classList.add('show');po.scrollTop=0;setTimeout(()=>po.scrollTop=0,60);}
function closeSheet(){$('#poster').classList.remove('show');}
$('#infoBtn').onclick=openSheet;$('#posterClose').onclick=closeSheet;
const trayEl=$('#tray'),trayIn=$('#trayIn'),tiles={};
for(const id of ORDER){const p=PARTS[id];if(!p)continue;const b=document.createElement('button');b.className='tile';
  b.innerHTML=`<img alt="" src="${ICONS[id]||''}"><span>${p.name}</span>`;b.onclick=()=>{if(busy())return;cancelTour();focusPart(id);};trayIn.appendChild(b);tiles[id]=b;}
function focusPart(id,force){cam.focus=id;cam.last=now();const pr=select(id,force);const t=tiles[id];if(t&&t.scrollIntoView)t.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});return pr;}
function unfocus(){cam.focus=null;}
let trayShown=false;
function updateTray(){const show=S.explode||S.xray;if(show!==trayShown){trayShown=show;trayEl.classList.toggle('show',show);resize();}
  for(const id in tiles)tiles[id].classList.toggle('sel',S.sel===id);}
let tourId=0,touring=false;function cancelTour(){tourId++;if(touring){touring=false;holdTalk(false);paintGo();}}
async function tour(){const id=++tourId;hush();touring=true;paintGo();unfocus();holdTalk(true);
  try{await sleep(500);
    for(const pid of ORDER){if(id!==tourId)return;if(!PARTS[pid])continue;await focusPart(pid,true);if(id!==tourId)return;await sleep(650);}
  }finally{if(id===tourId)holdTalk(false);}
  if(id!==tourId)return;touring=false;paintGo();unfocus();caption(null,'讲完啦！','想再听哪个，点下面的图标。');}

/* ================= 主循环 ================= */
let last=now(),focusDim=0;
function frame(){
  requestAnimationFrame(frame);
  const t=now();let dt=Math.max(0,Math.min((t-last)/1000,.05));last=t;// dt 必须非负：一旦为负，所有缓动的插值系数会翻号，数值直接发散
  if(busy()&&t-talkT0>45000){talking=0;hold=0;paintTalk();}
  S.ex+=((S.explode?1:0)-S.ex)*Math.min(1,dt*3.2);S.xr+=((S.xray?1:0)-S.xr)*Math.min(1,dt*5);EE=S.ex*S.ex*(3-2*S.ex);
  S.night+=(S.nightT-S.night)*Math.min(1,dt*1.3);const nn=S.night;
  const gl=S.gloom||0;if(Math.abs(gl-lastGloom)>.005){lastGloom=gl;const sr=$('#sky-rain');if(sr)sr.style.opacity=(gl*.8).toFixed(3);}
  hemi.intensity=LOOK.hemi*(1-2/3*nn)*(1-.35*gl);hemi.color.copy(C_HEMI_D).lerp(C_HEMI_N,nn);hemi.groundColor.copy(C_GND_D).lerp(C_GND_N,nn);
  sun.intensity=LOOK.sun*(1-.825*nn)*(1-.6*gl);sun.color.copy(C_SUN_D).lerp(C_SUN_N,nn);fill.intensity=LOOK.fill*(1-.8*nn);rim.intensity=LOOK.rim*(1-.8*nn);
  if(scene.fog&&C_FOG_D)scene.fog.color.copy(C_FOG_D).lerp(C_FOG_N,nn);renderer.toneMappingExposure=LOOK.exposure-.1*nn;
  for(const o of placed){const u=o.userData;const hk=(t-u.hopT0)/520;const hop=hk<1?Math.sin(Math.PI*hk)*.16:0;o.position.copy(u.home).addScaledVector(u.explode,EE);o.position.y+=hop;}
  OBJ.update&&OBJ.update(dt);ENV.update&&ENV.update(dt);
  const clean=S.explode||S.xray; // 看里面 / 拆开看：只留主体
  if(OBJ.hideOnExplode)for(const m of OBJ.hideOnExplode)m.visible=S.ex<.5&&S.xr<.5;
  for(const m of shellMeshes){const op=m.userData.baseOp*(1-(LOOK.srgb?.91:.76)*S.xr),mat=m.material;mat.opacity=op;const tr=op<.995;
    if(!m.userData.keepEm&&!m.userData.glass)mat.color.copy(m.userData.baseCol).lerp(GHOST,S.xr*(LOOK.srgb?.3:1));
    mat.transparent=tr||!!m.userData.glass;mat.depthWrite=!tr&&!m.userData.glass;if(!m.userData.glass)m.castShadow=S.xr<.5;}
  const pulse=LOOK.srgb?.055+.025*Math.sin(t/1000*4):.18+.14*Math.sin(t/1000*9);
  const fid=(S.explode||S.xray)&&cam.focus&&PARTS[cam.focus]?cam.focus:null;
  focusDim+=((fid?1:0)-focusDim)*Math.min(1,dt*4);
  const dimTo=1-.78*focusDim,dimming=focusDim>.002;
  for(const id in PARTS){const p=PARTS[id],isSel=S.sel===id;for(const ol of p.outlines)ol.visible=isSel;
    const back=dimming&&id!==fid;// 没被选中的零件：退到半透明，别挡着看
    for(const m of p.meshes){const u=m.userData,mat=m.material;
      if(dimming||u.opDimmed){
        const base=u.baseOp!=null?mat.opacity:u.opBase;// 外壳的透明度上一步刚算过，其它零件用建模时的原值
        const op=back?Math.min(base,dimTo):base,tr=op<.995;
        mat.opacity=op;mat.transparent=u.trBase||tr;mat.depthWrite=u.dwBase&&!tr;m.castShadow=u.csBase&&op>.5;
        u.opDimmed=dimming;
      }
      if(!mat.emissive||u.glass)continue;// 玻璃不发光，否则选中驾驶室/车身时窗户变成一块白板
      if(isSel&&!u.keepEm)mat.emissive.copy(mat.color);else mat.emissive.setHex(u.baseEm);mat.emissiveIntensity=u.dynInt+(isSel?pulse:0);}}
  if(OCC.length){const cp=camera.position,u=_occU.subVectors(cam.target,cp),L=u.length();u.normalize();
    for(const o of OCC){
      const hideNow=clean&&!o.userData.keepOnClean;
      if(o.userData.duck==='fade'){const outside=o.userData.n?(_occW.copy(cp).sub(o.userData.c).dot(o.userData.n)<0):false;const kT=(outside||hideNow)?0:1;
        if(Math.abs(o.userData.k-kT)>.001){o.userData.k+=(kT-o.userData.k)*Math.min(1,dt*5);fadeObj(o,o.userData.k);}continue;}
      const w=_occW.copy(o.position);w.y+=o.userData.cy||0;w.sub(cp);const tt=w.dot(u),dist=w.length();let block=hideNow||dist<(o.userData.r||1)*2.6;
      if(!block&&tt>0&&tt<L*.97){const d=w.addScaledVector(u,-tt).length();block=d<(o.userData.r||1)+.8;}
      const kT=block?0:1;if(Math.abs(o.userData.k-kT)>.001){o.userData.k+=(kT-o.userData.k)*Math.min(1,dt*6);o.scale.setScalar(o.userData.s0*Math.max(o.userData.k,.001));}}}
  updateCamera(dt);renderer.render(scene,camera);updateTray();
}

/* ================= 交互 ================= */
const ray=new THREE.Raycaster(),m2=new THREE.Vector2();
function visibleForPick(object){for(let o=object;o;o=o.parent)if(!o.visible)return false;return true;}
function pick(x,y){m2.set((x/W)*2-1,-(y/H)*2+1);ray.setFromCamera(m2,camera);
  for(const h of ray.intersectObjects(hitTargets,false)){const id=h.object.userData.part;if(!id||!visibleForPick(h.object))continue;if(S.xray&&h.object.userData.baseCol)continue;S.hit=h.object;return id;}return null;}
const ptrs=new Map();let down=null,moved=false,pinchD=0;
const pdist=()=>{const a=[...ptrs.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)};
canvas.addEventListener('pointerdown',e=>{cancelTour();canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){down={x:e.clientX,y:e.clientY,t:now()};moved=false;}else{moved=true;if(ptrs.size===2)pinchD=pdist();}cam.last=now();hideHint();});
canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===1){if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)moved=true;cam.tTheta-=dx*.006;cam.tPhi=clamp(cam.tPhi-dy*.005,.5,1.45);}
  else if(ptrs.size===2){const d=pdist();if(d>0&&pinchD>0)cam.zoom=clamp(cam.zoom*(pinchD/d),.6,1.8);pinchD=d;}cam.last=now();});
const up=e=>{if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(ptrs.size===0&&down&&!moved&&now()-down.t<600&&!busy()){const id=pick(e.clientX,e.clientY);if(id){if(S.explode||S.xray)focusPart(id);else select(id);}else unfocus();}
  if(ptrs.size===0)down=null;};
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
canvas.addEventListener('wheel',e=>{cam.zoom=clamp(cam.zoom*(1+e.deltaY*.0012),.6,1.8);cam.last=now();e.preventDefault();},{passive:false});
function hideHint(){$('#hint').classList.add('hide');}setTimeout(hideHint,7000);
function caption(icon,n,d){const ce=$('#ce');if(icon&&ICONS[icon]){ce.innerHTML=`<img src="${ICONS[icon]}" alt="">`;ce.style.display='';}else{ce.innerHTML='';ce.style.display='none';}$('#cn').textContent=n;$('#cd').textContent=d;}
function hop(p){const tg=p.hopTargets||p.groups.filter(g=>g.userData.home);for(const g of tg)g.userData.hopT0=now();}
function select(id,force){const p=PARTS[id];if(!p)return Promise.resolve();
  if(busy()&&!force&&!p.isStart)return Promise.resolve();
  hideHint();sfx.ac();cam.last=now();S.sel=id;hop(p);sfx.click();
  if(p.isStart){toggleDrive();return Promise.resolve();}
  const txt=p.pickText?p.pickText():p.text;caption(id,p.name,txt);const pr=speak(p.name+'。'+txt);const hit=S.hit;S.hit=null;p.action&&p.action(hit);return pr;}// 把点中的那块网格交给零件，零件可以只动被点的那一个（比如四扇车门）

/* ---- 「开起来」：一步一步讲 ---- */
let chainId=0;
async function toggleDrive(){
  const id=++chainId,go=$('#go');S.drive=!S.drive;sfx.ac();
  if(!S.drive){OBJ.onStop&&OBJ.onStop();sfx.stopLoop();hush();hold=0;talking=0;paintTalk();paintGo();S.sel=null;caption(null,SC.go.stopSaid,SC.go.stopHint);say(SC.go.stopSaid);return;}
  OBJ.onStart&&OBJ.onStart();paintGo();holdTalk(true);
  try{
    for(const s of OBJ.chain){if(id!==chainId)return;s.on&&s.on();if(s.inner&&!S.xray)continue;
      const p=PARTS[s.part];if(p){hop(p);S.sel=s.part;caption(s.part,p.name,s.t);}else caption(null,'',s.t);
      await speak(s.t);if(id!==chainId)return;await sleep(muted?1300:250);}
  }finally{if(id===chainId)holdTalk(false);}
  if(id!==chainId)return;S.sel=null;OBJ.onDone&&OBJ.onDone();caption(null,SC.go.done,S.xray?SC.go.doneHintXray:SC.go.doneHint);
}
function paintGo(){const go=$('#go'),ic=go.querySelector('svg');
  if($('#resetView'))$('#resetView').textContent=S.explode?'看全部':'看整车';
  if(S.explode){go.classList.toggle('on',touring);$('#gotxt').textContent=touring?'停下':'全部讲一遍';}
  else{go.classList.toggle('on',S.drive);$('#gotxt').textContent=S.drive?SC.go.off:SC.go.on;}}
function setMode(m){ // 'whole' | 'xray' | 'explode'，一次只在一个模式里
  cancelTour();if(S.drive&&m==='explode')toggleDrive();
  const wasX=S.xray,wasE=S.explode;S.xray=(m==='xray');S.explode=(m==='explode');unfocus();cam.last=now();hideHint();
  $('#xr').classList.toggle('on',S.xray);$('#xrtxt').textContent=S.xray?'合上':'看里面';
  $('#ex').classList.toggle('on',S.explode);$('#extxt').textContent=S.explode?'装回去':'拆开看';paintGo();$('#infoBtn').classList.toggle('show',S.explode);if(!S.explode)closeSheet();
  if(m==='xray'){sfx.click();caption(null,'看里面！','外壳变透明了。点零件或下面的图标，镜头会推过去；按左边的按钮看它里面怎么动。');say('看里面');}
  else if(m==='explode'){sfx.pop();caption(null,'拆开看！','零件都飞开啦。点图标一个个看，或者按「全部讲一遍」。');say('拆开看');}
  else{sfx.click();if(wasE){caption(null,'装回去啦','又变完整了。');say('装回去');}else if(wasX){caption(null,'合上啦','再点「看里面」，或者拖一拖转个圈。');say('合上');}}
}
function setExplode(on){setMode(on?'explode':'whole');}
$('#go').onclick=()=>{if(S.explode){if(touring){cancelTour();hush();}else tour();}else{cancelTour();toggleDrive();}};
$('#ex').onclick=()=>setMode(S.explode?'whole':'explode');
$('#xr').onclick=()=>setMode(S.xray?'whole':'xray');
if($('#resetView'))$('#resetView').onclick=()=>{cancelTour();hush();unfocus();cam.zoom=1;cam.tTheta=(SC.cameraStart||{}).theta||.95;cam.tPhi=(SC.cameraStart||{}).phi||1.15;cam.last=now();S.sel=null;if(SC.intro)caption(SC.intro.icon,SC.intro.name,SC.intro.text);};
const muteBtn=$('#mute');const paintMute=()=>{muteBtn.classList.toggle('off',muted);};paintMute();
muteBtn.onclick=()=>{muted=!muted;localStorage.setItem('muted',muted?'1':'0');paintMute();if(muted){sfx.pauseLoop();hush();}else if(S.drive&&sfx.wantLoop)sfx.loop(sfx.wantLoop);};
document.addEventListener('visibilitychange',()=>{if(document.hidden){sfx.pauseLoop();hush();}else if(S.drive&&sfx.wantLoop&&!muted)sfx.loop(sfx.wantLoop);});
const voiceBtn=$('#voice');function paintVoice(){voiceBtn.textContent=(VOICE_OPTS.find(v=>v.id===voiceMode)||VOICE_OPTS[0]).label;}paintVoice();
voiceBtn.onclick=()=>{const i=VOICE_OPTS.findIndex(v=>v.id===voiceMode);voiceMode=VOICE_OPTS[(i+1)%VOICE_OPTS.length].id;localStorage.setItem('voice',voiceMode);paintVoice();hush();
  if(muted){muted=false;localStorage.setItem('muted','0');paintMute();}
  if(voiceMode==='sys')saySys('你好，这是手机自带的声音。');else playClip(`voice/${voiceMode}/sample.mp3`,'你好。');};
if(SC.intro)caption(SC.intro.icon,SC.intro.name,SC.intro.text);
window.__dbg={S,cam,camera,PARTS,root,ICONS,OCC,focusPart,unfocus,toggleNight,setExplode,setMode,tour,cancelTour,hush,frame:()=>frame(),THREE};
frame();
})();

/* 工程车通用零件库
   ——履带、驾驶室、液压油缸、工程胎，这些东西十几台工程车都要用，
   放在这里参数化一次，场景文件里一行就能拿到，不用每台重写一遍底盘。
   每个函数都吃 ctx（lib3d 的 makeCtx 结果），返回 {group, ...动画方法}。 */
window.RIG=(function(){

/* 履带底盘：跑道形的履带带 + 链板 + 驱动轮 + 托轮。
   advance(dist) 传"走了多远"（米），链板和驱动轮会跟着转。 */
function crawler(ctx,o){
  o=o||{};
  const {THREE,mm,roundedBox,dark,steel}=ctx;
  const L=o.len!=null?o.len:3.6, R=o.r!=null?o.r:.5, HZ=o.halfZ!=null?o.halfZ:1.2,
        W=o.width!=null?o.width:.7, N=o.cleats!=null?o.cleats:26, NR=o.rollers!=null?o.rollers:4,
        FC=o.frame!=null?o.frame:0x3a4150, BC=o.belt!=null?o.belt:0x1c1f25;
  const g=new THREE.Group(),cleats=[],sprockets=[];
  const PERIM=2*L+2*Math.PI*R;
  /* 跑道形路径：上直线 → 前半圆 → 下直线 → 后半圆 */
  function path(u){
    const arc=Math.PI*R;let d=(((u%1)+1)%1)*PERIM;
    if(d<L)return{x:-L/2+d,y:R,ang:0};d-=L;
    if(d<arc){const a=Math.PI/2-d/R;return{x:L/2+Math.cos(a)*R,y:Math.sin(a)*R,ang:a-Math.PI/2};}d-=arc;
    if(d<L)return{x:L/2-d,y:-R,ang:Math.PI};d-=L;
    const a=-Math.PI/2-d/R;return{x:-L/2+Math.cos(a)*R,y:Math.sin(a)*R,ang:a-Math.PI/2};
  }
  for(const s of [1,-1]){
    const z=s*HZ;
    const frame=roundedBox(L+.4,R,W-.1,.06,dark(FC));frame.position.set(0,R,z);g.add(frame);
    const outer=new THREE.Shape();
    outer.absarc(L/2,0,R+.1,-Math.PI/2,Math.PI/2,false);outer.absarc(-L/2,0,R+.1,Math.PI/2,Math.PI*1.5,false);
    const inner=new THREE.Path();
    inner.absarc(L/2,0,R-.02,-Math.PI/2,Math.PI/2,false);inner.absarc(-L/2,0,R-.02,Math.PI/2,Math.PI*1.5,false);
    outer.holes.push(inner);
    const belt=mm(new THREE.ExtrudeGeometry(outer,{depth:W,bevelEnabled:false,curveSegments:24}),dark(BC));
    belt.position.set(0,R,z-W/2);g.add(belt);
    for(let i=0;i<N;i++){const c=mm(new THREE.BoxGeometry(.12,.09,W+.04),dark(0x30353f));
      c.userData.u=i/N;c.userData.z=z;g.add(c);cleats.push(c);}
    for(const x of [L/2,-L/2]){
      const w=mm(new THREE.CylinderGeometry(R-.06,R-.06,W-.2,20),steel(0x6b7280));
      w.rotation.x=Math.PI/2;w.position.set(x,R,z);g.add(w);sprockets.push(w);
      for(let k=0;k<6;k++){const sp=mm(new THREE.BoxGeometry(.08,R*1.5,.06),steel(0x8a929e));
        sp.rotation.z=k*Math.PI/6;sp.position.set(x,R,z+(W*.37)*s);g.add(sp);}
    }
    for(let i=0;i<NR;i++){const r=mm(new THREE.CylinderGeometry(R*.28,R*.28,W-.2,12),steel(0x8a929e));
      r.rotation.x=Math.PI/2;r.position.set(-L/2+.35+i*((L-.7)/Math.max(1,NR-1)),R*.32,z);g.add(r);}
  }
  let ph=0;
  function advance(dist){
    ph+=dist/PERIM;
    for(const c of cleats){const p=path(c.userData.u+ph);
      c.position.set(p.x,R+p.y+(p.y>0?.05:-.05),c.userData.z);c.rotation.z=p.ang;}
    for(const w of sprockets)w.rotation.z-=dist/(R-.06);
  }
  advance(0);
  return {group:g,advance,cleats,sprockets,R,L,halfZ:HZ};
}

/* 驾驶室：四根立柱 + 顶棚 + 玻璃 + 座椅。玻璃打了 glass 标记，
   「看里面」时不会发光、也不挡视线。 */
function cab(ctx,o){
  o=o||{};
  const {THREE,mm,roundedBox,dark,steel,glassMat,matte}=ctx;
  const W=o.w!=null?o.w:1.5, H=o.h!=null?o.h:1.7, D=o.d!=null?o.d:1.5,
        C=o.color!=null?o.color:0x3a4150, P=o.post!=null?o.post:.09;
  const g=new THREE.Group();
  const floor=roundedBox(W,.1,D,.02,dark(C));floor.position.y=.05;g.add(floor);
  const roof=roundedBox(W+.14,.12,D+.14,.03,dark(C));roof.position.y=H;g.add(roof);
  for(const sx of [1,-1])for(const sz of [1,-1]){
    const post=roundedBox(P,H,P,.02,dark(C));
    post.position.set(sx*(W/2-P/2),H/2,sz*(D/2-P/2));g.add(post);
  }
  const panes=[];
  const add=(w,h,x,y,z,ry)=>{const m=mm(new THREE.BoxGeometry(w,h,.03),glassMat());
    m.position.set(x,y,z);if(ry)m.rotation.y=ry;m.castShadow=false;m.userData.glass=true;g.add(m);panes.push(m);};
  add(W-P*2,H-.35,0,H/2+.05, D/2-.03);                 // 前
  add(W-P*2,H-.35,0,H/2+.05,-D/2+.03);                 // 后
  add(D-P*2,H-.35, W/2-.03,H/2+.05,0,Math.PI/2);       // 左
  add(D-P*2,H-.35,-W/2+.03,H/2+.05,0,Math.PI/2);       // 右
  const seat=roundedBox(.5,.12,.5,.04,matte(0x2b3038));seat.position.set(0,.52,-.15);g.add(seat);
  const back=roundedBox(.5,.6,.12,.04,matte(0x2b3038));back.position.set(0,.85,-.42);g.add(back);
  return {group:g,glass:panes};
}

/* 液压油缸：缸体固定在 a 点，活塞杆伸向 b 点。
   aim(a,b) 每帧调一次，油缸会自动指向并伸缩。 */
function ram(ctx,o){
  o=o||{};
  const {THREE,mm,steel,chrome}=ctx;
  const R=o.r!=null?o.r:.09, BODY=o.bodyLen!=null?o.bodyLen:1.0;
  const g=new THREE.Group();
  const barrel=mm(new THREE.CylinderGeometry(R,R,BODY,16),steel(0x6b7280));
  barrel.rotation.z=Math.PI/2;barrel.position.x=BODY/2;g.add(barrel);
  const rod=mm(new THREE.CylinderGeometry(R*.5,R*.5,1,14),chrome());
  rod.rotation.z=Math.PI/2;g.add(rod);
  const eye=mm(new THREE.TorusGeometry(R*.7,R*.28,8,14),steel(0x8a929e));
  eye.rotation.y=Math.PI/2;g.add(eye);
  const _d=new THREE.Vector3();
  function aim(a,b){
    g.position.copy(a);
    _d.copy(b).sub(a);
    const len=_d.length();
    g.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),_d.normalize());
    const stroke=Math.max(.05,len-BODY);
    rod.scale.y=stroke;rod.position.x=BODY+stroke/2;
  }
  return {group:g,aim,barrel,rod};
}

/* 工程胎：比轿车胎粗、花纹深。spin 子组用来转。 */
function wheel(ctx,o){
  o=o||{};
  const {THREE,mm,roundedBox,dark,steel}=ctx;
  const R=o.r!=null?o.r:.55, W=o.width!=null?o.width:.42, NT=o.tread!=null?o.tread:22;
  const g=new THREE.Group(),spin=new THREE.Group();g.add(spin);
  const tire=mm(new THREE.CylinderGeometry(R,R,W,28),dark(0x22262b));
  tire.rotation.x=Math.PI/2;spin.add(tire);
  for(let i=0;i<NT;i++){const a=i*Math.PI*2/NT;
    const t=mm(new THREE.BoxGeometry(.09,R*.16,W+.03),dark(0x14171b));
    t.position.set(Math.cos(a)*(R-.03),Math.sin(a)*(R-.03),0);t.rotation.z=a;spin.add(t);}
  for(const s of [1,-1]){
    const rim=mm(new THREE.CylinderGeometry(R*.52,R*.52,.06,20),steel(0x9aa2ad));
    rim.rotation.x=Math.PI/2;rim.position.z=s*(W/2-.02);spin.add(rim);
    const hub=mm(new THREE.CylinderGeometry(R*.16,R*.16,.08,14),steel(0x6b7280));
    hub.rotation.x=Math.PI/2;hub.position.z=s*(W/2+.01);spin.add(hub);
    for(let k=0;k<6;k++){const a=k*Math.PI/3;
      const b=mm(new THREE.CylinderGeometry(.03,.03,.05,8),steel(0x8a929e));
      b.rotation.x=Math.PI/2;b.position.set(Math.cos(a)*R*.33,Math.sin(a)*R*.33,s*(W/2+.01));spin.add(b);}
  }
  return {group:g,spin,R,width:W};
}

/* 卡车底盘：大梁 + 驾驶室 + 前脸 + 若干车轴。
   搅拌车、自卸车、泵车、消防车、垃圾车、洒水车、清障车都从这儿起步。
   axles 给每根轴的 x 位置，dual:true 的轴是双胎。 */
function truck(ctx,o){
  o=o||{};
  const {THREE,mm,roundedBox,dark,steel,matte,glassMat,plastic}=ctx;
  const COL=o.color!=null?o.color:0xE04A3A, CAB=o.cabX!=null?o.cabX:2.1,
        R=o.wheelR!=null?o.wheelR:.52, HZ=o.halfZ!=null?o.halfZ:.95,
        FL=o.frameFrom!=null?o.frameFrom:-3.4, FR=o.frameTo!=null?o.frameTo:3.0,
        axles=o.axles||[{x:2.05},{x:-1.85,dual:true},{x:-2.75,dual:true}];
  const g=new THREE.Group(),wheels=[];
  const body=()=>plastic(COL);
  /* 大梁 */
  for(const s of [1,-1]){
    const rail=roundedBox(FR-FL,.22,.16,.03,dark(0x3a4150));
    rail.position.set((FL+FR)/2,.62,s*.52);g.add(rail);
  }
  for(let i=0;i<5;i++){
    const cr=roundedBox(.14,.16,1.0,.03,dark(0x3a4150));
    cr.position.set(FL+.5+i*((FR-FL-1)/4),.62,0);g.add(cr);
  }
  /* 驾驶室 */
  const cabG=new THREE.Group();
  {
    const shell=roundedBox(1.7,1.5,2.0,.14,body());shell.position.set(0,1.5,0);cabG.add(shell);
    const wind=mm(new THREE.BoxGeometry(.06,.78,1.68),glassMat());
    wind.position.set(.83,1.86,0);wind.userData.glass=true;wind.castShadow=false;cabG.add(wind);
    for(const s of [1,-1]){
      const side=mm(new THREE.BoxGeometry(.9,.6,.05),glassMat());
      side.position.set(.1,1.86,s*.99);side.userData.glass=true;side.castShadow=false;cabG.add(side);
      const handle=roundedBox(.2,.06,.05,.02,steel(0x9aa2ad));handle.position.set(-.2,1.44,s*1.0);cabG.add(handle);
      const mir=roundedBox(.08,.3,.1,.03,dark(0x262b35));mir.position.set(.72,1.9,s*1.12);cabG.add(mir);
    }
    const grille=roundedBox(.14,.5,1.5,.04,dark(0x262b35));grille.position.set(.9,1.0,0);cabG.add(grille);
    for(const s of [1,-1]){
      const lamp=mm(new THREE.CylinderGeometry(.13,.13,.1,16),matte(0xFFF3D0));
      lamp.rotation.z=Math.PI/2;lamp.position.set(.9,1.05,s*.62);cabG.add(lamp);
    }
    const bump=roundedBox(.22,.28,2.1,.05,dark(0x3a4150));bump.position.set(.92,.5,0);cabG.add(bump);
    const step=roundedBox(.5,.06,.3,.02,dark(0x3a4150));step.position.set(-.2,.42,0);cabG.add(step);
    cabG.position.set(CAB,0,0);g.add(cabG);
  }
  /* 车轴 */
  for(const a of axles){
    for(const s of [1,-1]){
      const offs=a.dual?[HZ-.17,HZ+.17]:[HZ];
      for(const oz of offs){
        const w=wheel(ctx,{r:R,width:.34,tread:20});
        w.group.position.set(a.x,R,s*oz);g.add(w.group);wheels.push(w);
      }
    }
    const ax=mm(new THREE.CylinderGeometry(.1,.1,HZ*2,12),steel(0x6b7280));
    ax.rotation.x=Math.PI/2;ax.position.set(a.x,R,0);g.add(ax);
  }
  function advance(dist){for(const w of wheels)w.spin.rotation.z-=dist/w.R;}
  /* 自己挂到 root：place() 只记位置不挂节点，靠场景记得 defPart(tk.group) 太容易漏 */
  ctx.root.add(g);
  return {group:g,cab:cabG,wheels,advance,wheelR:R};
}

/* 伸缩臂：一节套一节，set(k) 里 k=0 全缩、k=1 全伸。 */
function boom(ctx,o){
  o=o||{};
  const {THREE,roundedBox,plastic,steel}=ctx;
  const N=o.sections!=null?o.sections:3, L=o.len!=null?o.len:3.4,
        W=o.w!=null?o.w:.46, H=o.h!=null?o.h:.52, TAPER=o.taper!=null?o.taper:.8,
        C=o.color!=null?o.color:0xF2B233;
  const g=new THREE.Group(),segs=[];
  for(let i=0;i<N;i++){
    const k=Math.pow(TAPER,i);
    const seg=roundedBox(L,H*k,W*k,.04,i?steel(0x9aa2ad):plastic(C));
    seg.position.set(L/2,0,0);
    const holder=new THREE.Group();holder.add(seg);g.add(holder);segs.push(holder);
  }
  function set(k){
    for(let i=0;i<N;i++)segs[i].position.x=i*L*.86*k;
  }
  set(0);
  return {group:g,set,segs,segLen:L,reach:k=>L+(N-1)*L*.86*k};
}

/* 支腿：往外伸 + 垫脚落地。set(k)，k=0 收起、k=1 撑开。 */
function outrigger(ctx,o){
  o=o||{};
  const {THREE,roundedBox,dark,steel,plastic}=ctx;
  const C=o.color!=null?o.color:0xF2B233, OUT=o.out!=null?o.out:.9, DROP=o.drop!=null?o.drop:.8;
  const g=new THREE.Group();
  const beam=roundedBox(.34,.24,1.1,.04,dark(0x3a4150));g.add(beam);
  const leg=new THREE.Group();
  const post=roundedBox(.2,.9,.2,.03,steel(0x9aa2ad));leg.add(post);
  const pad=roundedBox(.5,.1,.5,.03,plastic(C));leg.add(pad);
  g.add(leg);
  /* 收起时腿要缩到梁下面一点点，不能一直戳在地里；撑开时垫脚正好落到 DROP 深度 */
  function set(k){
    const h=.14+(DROP-.14)*k;
    beam.scale.z=1+k*.9;leg.position.z=OUT*k;
    post.scale.y=h/.9;post.position.y=-h/2;
    pad.position.y=-h-.05;
  }
  set(0);
  return {group:g,set};
}

/* 滚筒：搅拌车的斜筒、压路机的碾子都用它。spin 子组绕自身轴转。 */
function drum(ctx,o){
  o=o||{};
  const {THREE,mm,roundedBox,steel,plastic,dark}=ctx;
  const R=o.r!=null?o.r:.9, L=o.len!=null?o.len:2.2, C=o.color!=null?o.color:0xE8E4DC,
        RIB=o.ribs!=null?o.ribs:0;
  const g=new THREE.Group(),spin=new THREE.Group();g.add(spin);
  const body=mm(new THREE.CylinderGeometry(R,R,L,28),plastic(C));
  body.rotation.z=Math.PI/2;spin.add(body);
  for(const s of [1,-1]){
    const cap=mm(new THREE.CylinderGeometry(R*.99,R*.99,.06,28),steel(0x9aa2ad));
    cap.rotation.z=Math.PI/2;cap.position.x=s*L/2;spin.add(cap);
  }
  for(let i=0;i<RIB;i++){
    const a=i*Math.PI*2/RIB;
    const rib=roundedBox(L*.9,.07,.1,.02,dark(0x8a929e));
    rib.position.set(0,Math.cos(a)*(R+.02),Math.sin(a)*(R+.02));
    rib.rotation.x=-a;spin.add(rib);
  }
  return {group:g,spin,R,L};
}

/* 工地/街道环境：地面 + 锥桶 + 围挡 + 远树。
   返回 {occluders, add(obj)}，直接塞进场景的 env() 里用。
   kind: 'dirt' 工地土地 / 'road' 沥青路面。 */
function site(ctx,o){
  o=o||{};
  const {THREE,scene,mm,roundedBox,flat,matte,canvasTex,rngFactory}=ctx;
  const kind=o.kind||'dirt', seed=o.seed!=null?o.seed:2026;
  const base=kind==='road'?[104,112,124]:[186,150,100];
  const tex=canvasTex(512,512,(g,w,h)=>{
    const c=`${base[0]},${base[1]},${base[2]}`;
    const gr=g.createRadialGradient(w/2,h/2,w*.05,w/2,h/2,w/2);
    gr.addColorStop(0,`rgba(${base[0]+10},${base[1]+10},${base[2]+10},1)`);
    gr.addColorStop(.75,`rgba(${c},1)`);gr.addColorStop(1,`rgba(${c},0)`);
    g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(90,70,45,.12)';
    for(let i=0;i<380;i++){g.beginPath();g.arc(Math.random()*w,Math.random()*h,1+Math.random()*3,0,6.28);g.fill();}});
  const ground=new THREE.Mesh(new THREE.CircleGeometry(36,64),
    new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const rnd=rngFactory(seed),occ=[];
  const reg=g=>{g.updateWorldMatrix(true,true);
    const sp=new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere());
    g.userData.r=sp.radius;g.userData.cy=sp.center.y-g.position.y;g.userData.s0=g.scale.x;g.userData.k=1;occ.push(g);};
  for(const [x,z] of (o.cones||[[-5.4,3.0],[-7.6,1.8],[-7.4,-2.6],[5.8,3.2]])){
    const g=new THREE.Group();
    const c=mm(new THREE.ConeGeometry(.22,.7,12),matte(0xF25C2A));c.position.y=.35;g.add(c);
    const b=roundedBox(.5,.05,.5,.02,matte(0xF25C2A));b.position.y=.025;g.add(b);
    const st=mm(new THREE.CylinderGeometry(.16,.19,.08,12),matte(0xffffff));st.position.y=.42;g.add(st);
    g.position.set(x,0,z);scene.add(g);reg(g);}
  if(o.fence!==false)for(let i=0;i<6;i++){
    const g=new THREE.Group(),x=-6+i*2.5;
    for(const dx of [-1.1,1.1]){const p2=mm(new THREE.CylinderGeometry(.06,.06,1.3,8),flat(0x8B5A2B));p2.position.set(dx,.65,0);g.add(p2);}
    for(const y of [.55,1.05]){const r=roundedBox(2.4,.1,.06,.02,flat(0xE8D48A));r.position.set(0,y,0);g.add(r);}
    g.position.set(x,0,o.fenceZ!=null?o.fenceZ:8.5);scene.add(g);reg(g);}
  const GREENS=[0x5DBB63,0x4CA85A,0x7CC576],trunkM=flat(0x8B5A2B);
  for(let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2+rnd()*.4,R=15+rnd()*8,g=new THREE.Group();
    const t=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,1,7),trunkM);t.position.y=.5;g.add(t);
    for(const [dx,dy,dz,k] of [[0,1.5,0,1],[.4,1.8,.2,.7],[-.35,1.85,-.25,.6]]){
      const sph=new THREE.Mesh(new THREE.SphereGeometry(.8*k,9,7),flat(GREENS[i%3]));sph.position.set(dx,dy,dz);g.add(sph);}
    g.traverse(m=>{if(m.isMesh)m.castShadow=true;});
    g.scale.setScalar(1+rnd()*.6);g.position.set(Math.cos(a)*R,0,Math.sin(a)*R);scene.add(g);reg(g);}
  return {occluders:occ,ground};
}

/* 各场景公用的天空/雾/环境反射配置，省得每个文件抄一遍 */
const SKY={
  site:{sky:'linear-gradient(180deg,#7FBFFF 0%,#A9D4FF 28%,#D6ECFB 48%,#D6ECFB 100%)',
    envMap:['#9fd0ff','#e6f3ff','#c9a56a','#a07b46'],hemi:{sky:0xdfefff,ground:0xc9a56a},
    fog:{color:0xD6ECFB,near:24,far:52}},
  street:{sky:'linear-gradient(180deg,#7FBFFF 0%,#A9D4FF 28%,#D6ECFB 48%,#D6ECFB 100%)',
    envMap:['#9fd0ff','#e6f3ff','#b6bfc9','#8d97a2'],hemi:{sky:0xdfefff,ground:0x9aa4b2},
    fog:{color:0xD6ECFB,near:26,far:56}},
};

/* 动作序列机：每台车的「开起来」都是一串定时的状态过渡，逻辑完全一样。
   seq 是 [{d:毫秒, to:{键:目标值}}]，状态写在 st 上，键 k 对应 st[k] 和 st[k+'T']。 */
function seqRunner(st,keys){
  let seq=null,i=0,tt=0,reps=0,from=null,to=null;
  function snap(){const o={};for(const k of keys)o[k]=st[k+'T'];return o;}
  function next(){
    i++;
    if(i>=seq.length){if(reps>1){reps--;i=0;}else{seq=null;reps=0;return;}}
    from=snap();to=Object.assign({},from,seq[i].to);tt=0;
  }
  return {
    start(s,r){if(seq)return;seq=s;reps=r||1;i=-1;next();},
    stop(){seq=null;reps=0;},
    get running(){return !!seq;},
    tick(dt){
      if(!seq)return;
      tt+=dt*1000;
      const k=Math.min(1,tt/seq[i].d),e=k*k*(3-2*k);
      for(const key in to)st[key+'T']=from[key]+(to[key]-from[key])*e;
      if(k>=1)next();
    },
    /* 空闲时把所有目标值拉回 0；驱动中或有定时演示时不动 */
    idle(dt,rate){if(seq)return;for(const k of keys)st[k+'T']+=(0-st[k+'T'])*Math.min(1,dt*(rate||1.3));},
    /* 目标值 → 当前值的缓动 */
    ease(dt,rate){for(const k of keys)st[k]+=(st[k+'T']-st[k])*Math.min(1,dt*(rate||3));},
  };
}

/* 绿色启动按钮，每台车都有一个 */
function startBtn(ctx,x,y,z){
  const {THREE,mm,dark}=ctx;
  const g=new THREE.Group();
  const base=mm(new THREE.CylinderGeometry(.15,.15,.07,18),dark(0x262b35));g.add(base);
  const btn=mm(new THREE.CylinderGeometry(.11,.11,.09,18),
    new THREE.MeshStandardMaterial({color:0x35C46B,emissive:0x35C46B,emissiveIntensity:.35,roughness:.4}));
  btn.position.y=.06;btn.userData.keepEm=true;g.add(btn);
  g.position.set(x,y,z);
  return {group:g,pulse(on,t){btn.material.emissiveIntensity=.35+(on?.5:0)*(Math.sin(t/220)*.5+.5);}};
}

/* 标准柴油机：缸体 + 红缸盖 + 风扇。fan 会转。 */
function engine(ctx,o){
  o=o||{};
  const {THREE,mm,roundedBox,dark,steel,matte}=ctx;
  const S=o.scale!=null?o.scale:1;
  const g=new THREE.Group();
  const blk=roundedBox(1.0*S,.6*S,.8*S,.06,dark(0x2f3a4a));g.add(blk);
  const head=roundedBox(.9*S,.18*S,.7*S,.04,matte(0xC0392B));head.position.y=.38*S;g.add(head);
  for(let i=0;i<4;i++){
    const p=mm(new THREE.CylinderGeometry(.06*S,.06*S,.2*S,10),steel(0x9aa2ad));
    p.position.set((-.3+i*.2)*S,.55*S,0);g.add(p);}
  const fan=mm(new THREE.CylinderGeometry(.24*S,.24*S,.06*S,16),steel(0x6b7280));
  fan.position.set(.58*S,0,0);fan.rotation.z=Math.PI/2;g.add(fan);
  return {group:g,fan,spin(dt,k){fan.rotation.x+=dt*k*20;}};
}

return {crawler,cab,ram,wheel,truck,boom,outrigger,drum,site,SKY,seqRunner,startBtn,engine};
})();

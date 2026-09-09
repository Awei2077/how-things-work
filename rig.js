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

return {crawler,cab,ram,wheel};
})();

/* 场景：汽车（街景 + 昼夜） */
window.SCENES=window.SCENES||{};
(function(){
const WX=[1.44,-1.45],WY=.385,WZ=.80,TIRE_R=.385,SILL=.50,ARCH_R=.58,ARCH_CY=.40;// 轮拱开大一点，轮胎整个露在外面// 方盒子越野车：长 4.82、宽 1.93、高 1.97、轴距 2.89、离地高
const C={wheelW:0,shaftW:0,steer:0,steerDemoUntil:0,pistonPh:0,pistonSpd:0,lights:0,fuel:0,puffTimer:0,
  wheelUntil:0,engineUntil:0,shaftUntil:0,lightsUntil:0,fuelUntil:0,puffUntil:0,startOn:false,fuelOn:false,engineOn:false,shaftOn:false,wheelsOn:false,
  rainUntil:0,wipeFrom:0,wipeUntil:0,rain:0,wipe:0,wipePh:0,rainLoop:false,brakeUntil:0,brake:0,door:0,doorT:0};
let api=null;
const now=()=>api.now();

SCENES.car={
  id:'car',title:'汽车',subtitle:'越野车 · 拖一拖转圈，点零件听听',night:true,
  /* 线性色彩 + 软阴影：车漆和镀铬件才有真实的高光过渡，不然像塑料玩具 */
  look:{srgb:true,hemi:.55,sun:.95,fill:.28,rim:.4,exposure:1.0,autoRotate:.10},
  sky:'linear-gradient(180deg,#7FBFFF 0%,#A9D4FF 28%,#D6ECFB 48%,#D6ECFB 100%)',
  fog:{color:0xD6ECFB,near:20,far:44},nightFog:0x2b4a7e,
  envMap:['#cfe0f0','#eef4fa','#b6bfc9','#8d97a2'],hemi:{sky:0xdfefff,ground:0x9fcf8a},
  fit:{w:6.6,h:5.6,ty:1.05,tyEx:1.95,rEx:1.28},cameraStart:{theta:.95,phi:1.12},
  order:['engine','tank','battery','shaft','wheels','exhaust','door','steer','wiper','mirror','start','belt','seat','body','lights','tail'],
  go:{on:'开起来',off:'停下',stopSaid:'停车啦',stopHint:'再按一下，再开一次！',done:'嘟嘟～车子跑起来啦！',doneHintXray:'看，里面的零件都在忙！点「停下」再开一次。',doneHint:'点「看里面」，看看它为什么会动。'},
  intro:{icon:'body',name:'汽车',text:'点一点车上的零件，听听它叫什么。点车门可以开关门，点车灯试试天黑。'},
  poster:{title:'汽车里面到底长什么样',sub:'每天都坐，但你可能从没看过它的内部！',summary:'汽油 + 发动机 + 四个轮子一起转 = 哪儿都能去！',angle:{theta:.95,phi:1.15},keys:['engine','tank','battery','shaft','wheels','exhaust'],anchors:{wheels:[1.44,.385,.86],exhaust:[-1.9,.42,-.7],shaft:[0,.42,0],engine:[1.55,1.0,0]}},

  /* ---------- 街景：草地、马路、树、房子、路灯、云 ---------- */
  env(ctx,_api){
    api=_api;const {THREE,scene,V,flat,canvasTex,rngFactory}=ctx;
    const grassTex=canvasTex(512,512,(g,w,h)=>{const gr=g.createRadialGradient(w/2,h/2,w*.05,w/2,h/2,w/2);
      gr.addColorStop(0,'rgba(136,204,114,1)');gr.addColorStop(.75,'rgba(126,196,106,1)');gr.addColorStop(1,'rgba(126,196,106,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
    const ground=new THREE.Mesh(new THREE.CircleGeometry(34,72),new THREE.MeshStandardMaterial({map:grassTex,transparent:true,roughness:1,metalness:0}));
    ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
    const strip=(rgb,len,wid,y,z)=>{const tex=canvasTex(1024,32,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);
        gr.addColorStop(0,`rgba(${rgb},0)`);gr.addColorStop(.1,`rgba(${rgb},1)`);gr.addColorStop(.9,`rgba(${rgb},1)`);gr.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=gr;g.fillRect(0,0,w,h);});
      const m=new THREE.Mesh(new THREE.PlaneGeometry(len,wid),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:1}));m.rotation.x=-Math.PI/2;m.position.set(0,y,z);m.receiveShadow=true;scene.add(m);return m;};
    strip('104,112,124',60,3.4,.006,0);
    for(const z of [2.3,-2.3])strip('226,218,200',60,1.1,.02,z);
    for(const z of [1.5,-1.5])strip('244,246,249',56,.07,.012,z);
    for(const z of [1.76,-1.76]){const curb=new THREE.Mesh(new THREE.BoxGeometry(56,.08,.12),flat(0xd6d0c2));curb.position.set(0,.04,z);curb.receiveShadow=true;scene.add(curb);}
    const dashes=[];
    for(let i=0;i<22;i++){const d=new THREE.Mesh(new THREE.BoxGeometry(.9,.012,.13),new THREE.MeshStandardMaterial({color:0xF4F6F9,roughness:1,transparent:true}));d.position.set(-19.8+i*1.8,.014,0);d.receiveShadow=true;scene.add(d);dashes.push(d);}

    const env=new THREE.Group();scene.add(env);const scrollers=[],clouds=[],nightGlow=[];
    const rnd=rngFactory(20260904),GREENS=[0x5DBB63,0x4CA85A,0x7CC576,0x3F9A4E,0x8FD17A],trunkM=flat(0x8B5A2B),rndPick=a=>a[Math.floor(rnd()*a.length)];
    function tree(kind,sc){const g=new THREE.Group(),c=rndPick(GREENS);
      if(kind===0){const t=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,.9,7),trunkM);t.position.y=.45;g.add(t);
        const r=.65+rnd()*.25;const s1=new THREE.Mesh(new THREE.SphereGeometry(r,9,7),flat(c));s1.position.y=1.3;g.add(s1);
        const s2=new THREE.Mesh(new THREE.SphereGeometry(r*.7,8,6),flat(c));s2.position.set(.35,1.55,.2);g.add(s2);
        const s3=new THREE.Mesh(new THREE.SphereGeometry(r*.6,8,6),flat(c));s3.position.set(-.3,1.6,-.25);g.add(s3);}
      else{const t=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,.7,7),trunkM);t.position.y=.35;g.add(t);
        for(const [r,h,y] of [[.75,1.3,1.2],[.55,1.1,1.9],[.35,.9,2.5]]){const k=new THREE.Mesh(new THREE.ConeGeometry(r,h,8),flat(c));k.position.y=y;g.add(k);}}
      g.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.scale.setScalar(sc);g.rotation.y=rnd()*6.28;return g;}
    function bush(){const b=new THREE.Mesh(new THREE.SphereGeometry(.35+rnd()*.2,8,6),flat(rndPick(GREENS)));b.scale.y=.7;b.position.y=.22;b.castShadow=true;return b;}
    function house(){const g=new THREE.Group(),w=2.2+rnd(),d=1.8+rnd()*.6,h=1.4+rnd()*.5;
      const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),flat(rndPick([0xF6E7C8,0xF9D9C4,0xDDEBF7,0xFFF1CC])));body.position.y=h/2;g.add(body);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.78,.9,4),flat(0xC9564B));roof.position.y=h+.45;roof.rotation.y=Math.PI/4;g.add(roof);
      const door=new THREE.Mesh(new THREE.BoxGeometry(.4,.7,.05),trunkM);door.position.set(0,.35,d/2+.02);g.add(door);
      for(const x of [-w*.3,w*.3]){const wm=flat(0x9fd3ff,{roughness:.3,emissive:0xFFD27A,emissiveIntensity:0});const win=new THREE.Mesh(new THREE.BoxGeometry(.45,.4,.05),wm);win.position.set(x,h*.6,d/2+.02);g.add(win);nightGlow.push(n=>{wm.emissiveIntensity=1.5*n;});}
      g.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.rotation.y=rnd()<.5?0:Math.PI;return g;}
    function hill(){const r=5+rnd()*6,m=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),flat(rndPick([0x78BF6B,0x86C97A,0x6DB562])));m.scale.y=.35+rnd()*.15;m.position.y=-r*.05;return m;}
    function cloud(){const g=new THREE.Group(),m=flat(0xffffff,{transparent:true,opacity:.92}),n=3+Math.floor(rnd()*3);
      for(let i=0;i<n;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.6+rnd()*.7,8,6),m);s.position.set((i-n/2)*.9+rnd()*.3,rnd()*.3,rnd()*.4);s.scale.y=.6;g.add(s);}return g;}
    function reg(o){o.updateWorldMatrix(true,true);const sp=new THREE.Box3().setFromObject(o).getBoundingSphere(new THREE.Sphere());o.userData.r=sp.radius;o.userData.cy=sp.center.y-o.position.y;o.userData.s0=o.scale.x;o.userData.k=1;scrollers.push(o);}
    function scatter(make,count,zMin,zMax){for(let i=0;i<count;i++){const o=make(),sd=rnd()<.5?1:-1,x=-30+(i+rnd())*(60/count),z=sd*(zMin+rnd()*(zMax-zMin));o.position.set(x,o.position.y,z);env.add(o);reg(o);}}
    scatter(()=>tree(rnd()<.6?0:1,.9+rnd()*.5),34,3.6,11);scatter(bush,26,2.7,3.3);scatter(bush,10,4,9);scatter(house,5,9,14);
    const poolTex=canvasTex(128,128,(g,w,h)=>{const gr=g.createRadialGradient(w/2,h/2,2,w/2,h/2,w/2);gr.addColorStop(0,'rgba(255,225,160,1)');gr.addColorStop(.5,'rgba(255,225,160,.35)');gr.addColorStop(1,'rgba(255,225,160,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
    function streetLamp(side){const g=new THREE.Group(),pm=flat(0x4a5160,{metalness:.4,roughness:.6});
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,3.2,8),pm);pole.position.y=1.6;g.add(pole);
      const arm=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.9),pm);arm.position.set(0,3.15,-side*.4);g.add(arm);
      const head=new THREE.Mesh(new THREE.BoxGeometry(.24,.1,.36),pm);head.position.set(0,3.12,-side*.85);g.add(head);
      const bm=flat(0xfff4c8,{emissive:0xFFE9A8,emissiveIntensity:0});const bulb=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),bm);bulb.position.set(0,3.03,-side*.85);g.add(bulb);
      const plm=new THREE.MeshBasicMaterial({map:poolTex,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});const pool=new THREE.Mesh(new THREE.PlaneGeometry(5.5,5.5),plm);pool.rotation.x=-Math.PI/2;pool.position.set(0,.03,-side*1.3);g.add(pool);
      nightGlow.push(n=>{bm.emissiveIntensity=2.6*n;plm.opacity=.7*n;});g.traverse(o=>{if(o.isMesh&&o!==pool)o.castShadow=true;});return g;}
    for(let i=0;i<5;i++){const side=i%2?1:-1,l=streetLamp(side);l.position.set(-24+i*12,0,side*2.95);env.add(l);l.userData.r=1.2;l.userData.cy=2;l.userData.s0=1;l.userData.k=1;scrollers.push(l);}
    for(let i=0;i<10;i++){const a=(i/10)*Math.PI*2+rnd()*.3;if(Math.abs(Math.sin(a))<.35)continue;const R=24+rnd()*6,h=hill();h.position.set(Math.cos(a)*R,h.position.y,Math.sin(a)*R);env.add(h);}
    for(let i=0;i<6;i++){const c=cloud();c.position.set(-26+i*9+rnd()*4,7+rnd()*3,(rnd()<.5?1:-1)*(6+rnd()*14));env.add(c);clouds.push(c);}
    return {occluders:scrollers,update(dt){
      for(const d of dashes){d.position.x-=C.wheelW*TIRE_R*dt;if(d.position.x<-19.8)d.position.x+=39.6;d.material.opacity=THREE.MathUtils.clamp((19-Math.abs(d.position.x))/3,0,1);}
      if(C.wheelW>.01){const dx=C.wheelW*TIRE_R*dt;for(const o of scrollers){o.position.x-=dx;if(o.position.x<-30)o.position.x+=60;}}
      for(const c of clouds){c.position.x-=dt*.25;if(c.position.x<-28)c.position.x+=56;}
      const n=api.S.night;for(const f of nightGlow)f(n);
    }};
  },

  /* ---------- 汽车本体 ---------- */
  build(ctx,_api){
    api=_api;const {THREE,V,mm,roundedBox,capsule,tubeM,pathTube,loft,stationsX,steel,matte,flat,place,defPart,markShell,root}=ctx;
    /* 这一页用更实体的材质参数：清漆更亮、橡胶更哑、玻璃更深更透，
       配合 look.srgb 的线性色彩，看起来像模型店里的实体车，而不是塑料玩具。 */
    const paint=(c=0xbd1829)=>new THREE.MeshPhysicalMaterial({color:c,metalness:.2,roughness:.24,clearcoat:.7,clearcoatRoughness:.18,envMapIntensity:.9});
    const chrome=()=>new THREE.MeshStandardMaterial({color:0xd8dee5,metalness:.9,roughness:.3,envMapIntensity:.6});
    const dark=(c=0x222830)=>new THREE.MeshStandardMaterial({color:c,metalness:.05,roughness:.82});
    const glassMat=(c=0x75909c,op=.54)=>new THREE.MeshPhysicalMaterial({color:c,metalness:.12,roughness:.08,transparent:true,opacity:op,depthWrite:false,envMapIntensity:1.1});
    /* 车壳：方盒子一样的越野车 —— 全是平面和直角 */
    const shell=new THREE.Group(),tailLights=[];
    {
      const BELT=1.34,ROOF=1.97,GW=.93;                       // 窗台线 / 车顶 / 座舱半宽
      const CAB0=-1.95,CAB1=1.02,FLOOR=.62;
      // 下半身：一个笔直的大方盒（机盖也在这个高度），转角只留一点点圆
      const hullKeys=[
        {x:2.41,hw:.88,y0:.62,y1:1.30,rb:.05,rt:.05},{x:2.34,hw:.94,y0:.56,y1:1.32,rb:.04,rt:.04},{x:2.20,hw:.965,y0:SILL,y1:1.33,rb:.04,rt:.04},
        {x:1.60,hw:.965,y0:SILL,y1:1.34,rb:.04,rt:.04},{x:1.02,hw:.965,y0:SILL,y1:BELT,rb:.04,rt:.04},{x:-.60,hw:.965,y0:SILL,y1:BELT,rb:.04,rt:.04},
        {x:-1.90,hw:.965,y0:SILL,y1:BELT,rb:.04,rt:.04},{x:-2.24,hw:.965,y0:SILL,y1:BELT-.01,rb:.04,rt:.04},{x:-2.34,hw:.94,y0:.56,y1:BELT-.02,rb:.04,rt:.04},
        {x:-2.41,hw:.88,y0:.62,y1:1.30,rb:.05,rt:.05}];
      const arch=(x,st)=>{for(const xw of WX){const dx=x-xw;if(Math.abs(dx)<ARCH_R){const a=ARCH_CY+Math.sqrt(ARCH_R*ARCH_R-dx*dx);if(a>st.y0)st.y0=a;}}
        if(x>CAB0&&x<CAB1){st.y1=Math.max(FLOOR,st.y0+.05);st.rt=.03;}return st;};// 座舱段只留地板，能看见里面
      shell.add(loft(hullKeys,stationsX(2.41,-2.41,.06,WX.map(x=>[x,ARCH_R+.02,.02]).concat([[CAB0,.03,.01],[CAB1,.03,.01]])),paint(),{adjust:arch}));
      for(const sd of [1,-1]){
        for(const [x,y] of [[.98,1.26],[.98,.78],[-.42,1.26],[-.42,.78]]){const hg=roundedBox(.09,.09,.06,.02,dark(0x2b2f38));hg.position.set(x,y,sd*.965);shell.add(hg);}// 露在外面的门铰链
        const step=roundedBox(1.86,.09,.16,.03,dark(0x262b35));step.position.set(-.05,.52,sd*.95);shell.add(step);          // 侧踏板：只在前后轮之间，插进轮胎会闪
        for(const xw of WX){const liner=mm(new THREE.CylinderGeometry(ARCH_R-.05,ARCH_R-.05,.62,20,1,false,Math.PI/2,Math.PI),dark(0x14171d));
          liner.rotation.x=Math.PI/2;liner.position.set(xw,ARCH_CY,sd*.55);liner.castShadow=false;shell.add(liner);}// 往里收，别贴到车门内表面
      }
      const mat=roundedBox(CAB1-CAB0-.1,.03,1.8,.01,matte(0x3a3f4a));mat.position.set((CAB0+CAB1)/2,FLOOR+.015,0);mat.castShadow=false;shell.add(mat);
      /* 座舱：整块钣金冲出来，窗户是抠出来的洞，所以立柱天生是车身的一部分 */
      const sidePanel=()=>{const sh=new THREE.Shape();
        sh.moveTo(1.02,BELT);sh.lineTo(.70,ROOF);sh.lineTo(-2.0,ROOF);sh.lineTo(-2.0,BELT);sh.closePath();
        for(const pts of [[[.86,1.40],[.62,1.90],[-.42,1.90],[-.42,1.40]],           // 前门窗
                          [[-.50,1.40],[-.50,1.90],[-1.66,1.90],[-1.66,1.40]],       // 后门窗
                          [[-1.74,1.40],[-1.74,1.90],[-1.94,1.90],[-1.94,1.40]]]){   // 后角窗
          const h=new THREE.Path();h.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)h.lineTo(pts[i][0],pts[i][1]);h.closePath();sh.holes.push(h);}
        return mm(new THREE.ExtrudeGeometry(sh,{depth:.05,bevelEnabled:false,curveSegments:1}),paint());};
      for(const s of [1,-1]){const sp=sidePanel();sp.position.z=s>0?GW-.05:-GW;shell.add(sp);}
      const roof=roundedBox(2.72,.07,GW*2,.02,paint());roof.position.set(-.65,ROOF-.035,0);shell.add(roof);
      for(const s of [1,-1]){const rail=roundedBox(2.5,.05,.07,.02,dark(0x2b2f38));rail.position.set(-.7,ROOF+.04,s*.78);shell.add(rail);}// 车顶行李架
      // 玻璃：前挡（很立）、后挡（竖直）、六块侧窗
      const pane=(x0,y0,x1,y1,w,thick)=>{const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy);
        const m=mm(new THREE.BoxGeometry(thick,L,w),glassMat());m.position.set((x0+x1)/2,(y0+y1)/2,0);
        m.rotation.z=Math.atan2(dy,dx)-Math.PI/2;m.castShadow=false;m.userData.glass=true;return m;};
      shell.add(pane(1.0,BELT+.04,.72,ROOF-.05,GW*2-.16,.05));       // 前挡风
      shell.add(pane(-1.99,BELT+.04,-1.99,ROOF-.05,GW*2-.16,.05));   // 后挡风（竖直）
      for(const s of [1,-1])for(const [x0,x1] of [[-1.76,-1.92]]){// 后角窗固定在车身上，两块车门玻璃跟着门走
        const w=mm(new THREE.BoxGeometry(x0-x1,.48,.02),glassMat());
        w.position.set((x0+x1)/2,1.65,s*(GW-.055));w.castShadow=false;w.userData.glass=true;shell.add(w);}
      /* 车头：直上直下的格栅面 + 圆大灯 + 立在翼子板上的转向灯 */
      const grille=roundedBox(.06,.44,1.42,.03,dark(0x14171d));grille.position.set(2.45,1.04,0);shell.add(grille);
      for(const y of [.90,1.04,1.18]){const bar=mm(new THREE.BoxGeometry(.02,.02,1.38),dark(0x3c444c));bar.position.set(2.475,y,0);bar.castShadow=false;shell.add(bar);}
      for(const y of [.845,.97,1.095,1.225]){const bar=mm(new THREE.BoxGeometry(.017,.017,.97),dark(0x3c444c));bar.position.set(2.476,y,0);bar.castShadow=false;shell.add(bar);}
      const gpost=mm(new THREE.BoxGeometry(.02,.42,.06),chrome());gpost.position.set(2.475,1.04,0);gpost.castShadow=false;shell.add(gpost);
      // 前后保险杠 + 车牌
      for(const [x,y] of [[2.46,.68],[-2.46,.72]]){const b=roundedBox(.12,.24,1.86,.03,dark(0x262b35));b.position.set(x,y,0);shell.add(b);}
      const plate=mm(new THREE.BoxGeometry(.016,.13,.4),matte(0xf5f5f0));plate.position.set(2.52,.68,0);plate.castShadow=false;shell.add(plate);
      // 后门上的备胎（越野车的标志）
      const spare=new THREE.Group();
      {const t=mm(new THREE.TorusGeometry(.33,.10,14,32),dark(0x1c1f25));spare.add(t);                                   // 轮胎（在 xy 平面，正面朝 z）
       const face=mm(new THREE.CylinderGeometry(.24,.24,.12,26),dark(0x2b2f38));face.rotation.x=Math.PI/2;spare.add(face);// 轮芯，和轮胎同一个朝向
       const cover=mm(new THREE.CylinderGeometry(.30,.30,.06,26),paint());cover.rotation.x=Math.PI/2;cover.position.z=.09;spare.add(cover);
       spare.position.set(-2.50,1.15,.10);spare.rotation.y=-Math.PI/2;shell.add(spare);}                                   // 整只转 90°，正面朝车后
      markShell(shell);place(shell,V(0,0,0),V(0,2.7,0));
    }

    defPart('body',{name:'车身',more:'车身像一个方盒子，又高又方，坐得高看得远，后门上还挂着一个备胎。车身是硬壳，撞到东西时前后会先压扁一点，把力气吃掉。',outside:true,text:'方方正正的大盒子，坐得高、看得远，后面还背着一个备胎。'},[shell]);

    /* 车门：点一下就开，再点一下就关 */
    const doorPivots=[];
    for(const sd of [1,-1])for(const [hx,x1,wx0,wx1] of [[.98,-.36,.84,-.44],[-.42,-1.72,-.52,-1.68]]){
      const pv=new THREE.Group();
      /* 后轮正好在后门下面，直上直下的方门会把轮胎盖掉一截。门板下沿按轮胎半径 +4cm
         裁一道弧绕开它——轮子整个露出来，门形只浅浅缺一口，不至于被啃成 C 形。
         前门离前轮够远（.98 到 1.44 差 .46 > .43），算下来不会被裁到。 */
      const DY0=.62,DY1=1.34,RT=TIRE_R+.045;
      const yAt=wx=>{let y=DY0;for(const cx of WX){const d=RT*RT-(wx-cx)*(wx-cx);if(d>0)y=Math.max(y,WY+Math.sqrt(d));}return Math.min(y,DY1-.35);};
      const xa=x1-hx,N=36,sh=new THREE.Shape();
      sh.moveTo(xa,yAt(x1));
      for(let i=1;i<=N;i++){const lx=xa-xa*i/N;sh.lineTo(lx,yAt(lx+hx));}
      sh.lineTo(0,DY1);sh.lineTo(xa,DY1);sh.closePath();
      const panel=mm(new THREE.ExtrudeGeometry(sh,{depth:.026,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,steps:1,curveSegments:1}),paint());
      panel.position.z=-.013;pv.add(panel);
      const h=roundedBox(.16,.05,.05,.015,chrome());h.position.set(x1-hx+.22,1.16,sd*.02);pv.add(h);        // 门把手
      const gy=yAt(x1);
      const gap=mm(new THREE.BoxGeometry(.012,DY1-gy,.012),dark(0x4a3236));gap.position.set(x1-hx-.01,(DY1+gy)/2,sd*.012);gap.castShadow=false;pv.add(gap);
      const w=mm(new THREE.BoxGeometry(wx0-wx1,.48,.02),glassMat());                            // 车窗跟着门一起开
      w.position.set((wx0+wx1)/2-hx,1.65,-sd*.035);w.castShadow=false;w.userData.glass=true;pv.add(w);
      for(const [dx,dy,ww,hh] of [[0,-.26,wx0-wx1+.05,.05],[(wx0-wx1)/2,0,.05,.52],[-(wx0-wx1)/2,0,.05,.52]]){// 车窗四周的细门框
        const f=roundedBox(ww,hh,.035,.012,paint());f.position.set((wx0+wx1)/2-hx+dx,1.65+dy,-sd*.035);f.castShadow=false;pv.add(f);}
      markShell(pv);// 看里面时车门跟车身一起变半透明
      pv.userData.sd=sd;pv.userData.doorPivot=true;pv.userData.open=0;pv.userData.k=0;doorPivots.push(pv);place(pv,V(hx,0,sd*.945),V(0,.15,sd*1.8));
    }
    defPart('door',{name:'车门',outside:true,more:'车门靠前面的铰链转开，里面有防撞钢梁。上车前要看看后面有没有来车，再慢慢推开门。',
      text:'点一下，车门就打开啦！上车下车都要开门关门。',
      action(hit){// 点哪扇开哪扇；从图标栏点则四扇一起
        if(hit){let o=hit;while(o&&!o.userData.doorPivot)o=o.parent;
          if(o){o.userData.open=o.userData.open?0:1;api.sfx.door();return;}}
        const anyShut=doorPivots.some(p=>!p.userData.open);
        for(const p of doorPivots)p.userData.open=anyShut?1:0;api.sfx.door();}},doorPivots);

    /* 尾灯（刹车时亮红） */
    const tailG=new THREE.Group();
    for(const z of [.80,-.80]){const t=roundedBox(.05,.34,.20,.02,new THREE.MeshStandardMaterial({color:0xE04848,emissive:0xE04848,emissiveIntensity:.5,roughness:.3}));
      t.position.set(-2.47,1.10,z);t.userData.keepEm=true;tailG.add(t);tailLights.push(t);
      const amber=roundedBox(.055,.11,.20,.02,new THREE.MeshStandardMaterial({color:0xF2A03C,emissive:0xF2A03C,emissiveIntensity:.35,roughness:.3}));
      amber.position.set(-2.472,1.24,z);amber.userData.keepEm=true;tailG.add(amber);
      const rim=roundedBox(.04,.40,.25,.01,dark(0x262b35));rim.position.set(-2.45,1.10,z);tailG.add(rim);}
    place(tailG,V(0,0,0),V(-2.1,.7,0));
    defPart('tail',{name:'尾灯',more:'越野车的尾灯是两根竖着的方灯，装在车尾的两个角上，上面橙色的一格是转向灯。踩刹车时红灯变得更亮，提醒后面的车减速。',outside:true,text:'尾灯亮红，是告诉后面的车：我要停啦，你也慢一点。',action(){C.brakeUntil=now()+3000;}},[tailG]);

    /* 轮子 */
    const wheelsG=new THREE.Group(),wheelSpin=[],frontYaw=[],wheelYaws=[];
    /* 轮胎用 Lathe 车出断面：胎肩、胎侧、胎唇都有实际厚度；胎纹是一圈 InstancedMesh 小块。
       轮圈的辐条/螺栓/中心盖都收在胎唇（半径 .222）以内，不会和胎面重叠闪烁。 */
    const tireGeo=new THREE.LatheGeometry(
      [[.241,-.105],[.278,-.12],[.336,-.12],[.369,-.101],[.384,-.062],[.384,.062],[.369,.101],[.336,.12],[.278,.12],[.241,.105],[.241,-.105]]
        .map(([r,z])=>new THREE.Vector2(r,z)),64);
    tireGeo.rotateX(Math.PI/2);
    const treadGeo=new THREE.BoxGeometry(.042,.012,.068),_tm=new THREE.Object3D();
    for(const x of WX)for(const sw of [1,-1]){
      const z=sw*WZ,sd=sw;
      const yaw=new THREE.Group(),spin=new THREE.Group();yaw.scale.z=1.1;
      spin.add(mm(tireGeo,dark(0x262a2e)));                                                                          // 胎体
      const bore=mm(new THREE.CylinderGeometry(.237,.237,.17,40),dark(0x454c53));bore.rotation.x=Math.PI/2;spin.add(bore);
      const lip=mm(new THREE.TorusGeometry(.222,.014,10,48),chrome());lip.position.z=sd*.106;spin.add(lip);          // 轮圈外沿
      for(let k=0;k<5;k++){const a2=k*Math.PI*2/5;                                                                   // 五根辐条
        const sp=roundedBox(.054,.248,.028,.008,chrome());sp.rotation.z=a2-Math.PI/2;
        sp.position.set(Math.cos(a2)*.102,Math.sin(a2)*.102,sd*.105);spin.add(sp);
        const bolt=mm(new THREE.CylinderGeometry(.012,.012,.022,10),chrome());bolt.rotation.x=Math.PI/2;
        bolt.position.set(Math.cos(a2)*.052,Math.sin(a2)*.052,sd*.13);spin.add(bolt);}
      const cap=mm(new THREE.CylinderGeometry(.047,.047,.045,24),chrome());cap.rotation.x=Math.PI/2;cap.position.z=sd*.12;spin.add(cap);
      const rim=mm(new THREE.TorusGeometry(.298,.003,6,64),dark(0x34383c));rim.position.z=sd*.121;spin.add(rim);     // 胎侧那圈细线
      const treads=new THREE.InstancedMesh(treadGeo,dark(0x202429),80);treads.castShadow=true;treads.userData.noHit=true;
      for(let i=0;i<80;i++){const a2=(i%40)*Math.PI*2/40+(i<40?0:.055);
        _tm.position.set(Math.cos(a2)*.383,Math.sin(a2)*.383,i<40?-.043:.043);
        _tm.rotation.set(0,0,a2-Math.PI/2);_tm.updateMatrix();treads.setMatrixAt(i,_tm.matrix);}
      treads.instanceMatrix.needsUpdate=true;spin.add(treads);
      yaw.add(spin);wheelsG.add(yaw);wheelSpin.push(spin);wheelYaws.push(yaw);if(x>0)frontYaw.push(yaw);
      place(yaw,V(x,WY,z),V(0,0,sw*.9));
    }
    defPart('wheels',{name:'轮子',more:'轮子外面是橡胶轮胎，软软的抓得住地面；里面充着气，所以坐车不颠。四个轮子都会使劲，这叫四驱。',outside:true,hopTargets:wheelYaws,text:'四个轮子转呀转，车子就往前跑。',action(){C.wheelUntil=now()+3500;}},[wheelsG]);

    /* 传动轴 */
    const driveG=new THREE.Group(),axles=[];
    for(const x of WX){const a=mm(new THREE.CylinderGeometry(.05,.05,1.7,10),steel());a.rotation.x=Math.PI/2;const g=new THREE.Group();g.add(a);g.position.set(x,WY,0);driveG.add(g);axles.push(g);}
    // 四驱：发动机 → 变速箱 → 分动箱 → 前后各一根传动轴，四个轮子一起使劲
    const shaftG=new THREE.Group();shaftG.position.set(0,.44,0);
    {for(const [cx,len] of [[-.85,1.5],[.78,1.0]]){const a=mm(new THREE.CylinderGeometry(.05,.05,len,10),steel(0xb7bec8));a.rotation.z=Math.PI/2;a.position.x=cx;shaftG.add(a);
       const stripe=mm(new THREE.BoxGeometry(len-.2,.03,.05),matte(0xFF6B6B));stripe.position.set(cx,.055,0);shaftG.add(stripe);
       for(const e of [-1,1]){const j=mm(new THREE.SphereGeometry(.07,14,10),steel());j.position.x=cx+e*len/2;shaftG.add(j);}}}
    const gearbox=roundedBox(.6,.34,.36,.06,steel(0x525a68));gearbox.position.set(.75,.56,0);driveG.add(gearbox);
    const tcase=roundedBox(.34,.30,.30,.05,steel(0x6b7280));tcase.position.set(.32,.47,0);driveG.add(tcase);// 分动箱：把力气分给前后
    for(const x of WX){const diff=mm(new THREE.SphereGeometry(.14,16,12),steel(0x525a68));diff.position.set(x,WY,.06);driveG.add(diff);}
    driveG.add(shaftG);place(driveG,V(0,0,0),V(0,.50,0));
    defPart('shaft',{name:'传动轴',more:'越野车是四驱：发动机的力气先进变速箱，再进「分动箱」，分动箱把力气分成两份，前面一根传动轴、后面一根传动轴，四个轮子一起使劲，所以有一个轮子打滑也还能爬出来。',text:'力气分成两份，顺着前后两根轴，交给四个轮子一起使劲。',action(){C.shaftUntil=now()+3500;C.wheelUntil=now()+3500;}},[driveG]);

    /* 发动机 */
    const engine=new THREE.Group(),pistons=[],PIST_Y=.42,PIST_AMP=.04;let fan;
    {
      engine.add(roundedBox(.86,.52,.72,.06,steel(0x454c5a)));
      const head=roundedBox(.78,.14,.56,.04,paint(0xb8262e));head.position.y=.33;engine.add(head);
      for(let i=0;i<6;i++){const p=mm(new THREE.CylinderGeometry(.055,.055,.1,14),chrome());p.position.set(-.3+i*.12,PIST_Y,0);engine.add(p);pistons.push(p);}// 六个活塞站着，一个接一个
      const belt=mm(new THREE.TorusGeometry(.12,.014,8,28),dark());belt.rotation.y=Math.PI/2;belt.position.set(.45,0,0);engine.add(belt);
      const pulley=mm(new THREE.CylinderGeometry(.1,.1,.04,20),steel());pulley.rotation.z=Math.PI/2;pulley.position.set(.46,0,0);engine.add(pulley);
      const alt=mm(new THREE.CylinderGeometry(.07,.07,.12,16),steel(0x8a919c));alt.rotation.z=Math.PI/2;alt.position.set(.42,.16,.24);engine.add(alt);
      const rad=roundedBox(.05,.5,.95,.02,dark(0x22262e));rad.position.set(.66,.05,0);engine.add(rad);
      fan=new THREE.Group();fan.position.set(.57,.04,0);
      for(let k=0;k<4;k++){const b=mm(new THREE.BoxGeometry(.016,.15,.05),matte(0x3a4150));b.rotation.x=k*Math.PI/2;b.position.set(0,Math.cos(k*Math.PI/2)*.085,Math.sin(k*Math.PI/2)*.085);fan.add(b);}
      const hub=mm(new THREE.CylinderGeometry(.035,.035,.035,12),steel());hub.rotation.z=Math.PI/2;fan.add(hub);engine.add(fan);
      place(engine,V(1.55,.78,0),V(1.3,1.9,0));
    }
    defPart('engine',{name:'发动机',more:'越野车的发动机很大，六个活塞站成一排轮流干活，力气特别大，才拖得动这么重的车爬坡。旁边那块黑黑的是水箱，帮发动机降温。',text:'发动机是汽车的心脏，六个活塞上上下下，突突突地转。',
      action(){C.engineUntil=now()+3600;C.puffUntil=now()+3600;C.shaftUntil=now()+3600;}},[engine]);

    /* 电池 */
    const battery=new THREE.Group();
    {
      battery.add(roundedBox(.3,.22,.2,.03,dark(0x1b1e25)));
      for(const x of [-.08,.08]){const t=mm(new THREE.CylinderGeometry(.025,.025,.04,12),chrome());t.position.set(x,.13,0);battery.add(t);}
      const capR=mm(new THREE.CylinderGeometry(.03,.03,.016,12),matte(0xE04848));capR.position.set(.08,.158,0);battery.add(capR);
      const lbl=mm(new THREE.BoxGeometry(.17,.08,.004),matte(0x4CC38A));lbl.position.set(0,.01,.103);lbl.castShadow=false;battery.add(lbl);
      battery.add(tubeM(V(.08,.16,0),V(-.3,-.02,-.5),.016,matte(0xE04848)));
      place(battery,V(1.95,.95,.66),V(1.2,1.9,1.05));// 电池放在发动机旁边，不埋进缸体
    }
    defPart('battery',{name:'电池',more:'电池给车灯、喇叭、收音机供电，也负责把发动机叫醒。车开起来以后，发电机会给它充电。',text:'小电池管电：让车灯亮起来，让喇叭叭叭叫。',action(){C.lightsUntil=now()+3500;setTimeout(()=>api.sfx.horn(),350);}},[battery]);

    /* 油箱 + 油管 */
    const tank=new THREE.Group();
    {
      tank.add(capsule(.13,.5,matte(0xE88E1A)));
      const band=mm(new THREE.CylinderGeometry(.135,.135,.05,20),dark(0x2b2f38));band.rotation.z=Math.PI/2;tank.add(band);
      const cap=mm(new THREE.CylinderGeometry(.05,.05,.04,12),dark());cap.position.set(-.12,.13,.04);tank.add(cap);
      tank.add(tubeM(V(.25,0,0),V(2.32,.46,-.16),.022,matte(0xb86b00)));
      place(tank,V(-.95,.40,.26),V(-.90,.80,1.10));// 油箱在后排地板下面
    }
    defPart('tank',{name:'油箱',more:'越野车的油箱又大又厚，藏在后座下面，跑很远也不怕没油。油泵把汽油顺着车底的管子一路送到车头的发动机。',text:'油箱是汽车的肚子。汽油顺着长长的管子，送到前面的发动机。',action(){C.fuelUntil=now()+4000;}},[tank]);
    const FUEL_A=V(-.65,.42,.24),FUEL_B=V(1.35,.86,.1),fuelDots=[];
    for(let i=0;i<6;i++){const d=mm(new THREE.SphereGeometry(.04,10,8),new THREE.MeshStandardMaterial({color:0xFFB020,emissive:0xFFB020,emissiveIntensity:.7}));d.castShadow=false;d.scale.setScalar(0);root.add(d);fuelDots.push(d);}

    /* 排气管 + 烟 */
    const exhaust=new THREE.Group(),PUFF_AT=V(-2.0,.46,-.86);
    {
      exhaust.add(pathTube([V(1.5,.55,-.3),V(.8,.46,-.42),V(-.5,.42,-.5),V(-1.2,.52,-.62),V(-1.62,.52,-.72),V(-1.9,.44,-.82)],.038,steel(0x7c8590)));// 后桥这一段抬高，从桥上面绕过去
      const muf=capsule(.1,.6,steel(0x9aa2ad),16);muf.position.set(-.85,.44,-.54);exhaust.add(muf);
      const tip=mm(new THREE.CylinderGeometry(.055,.055,.18,14),chrome());tip.rotation.z=Math.PI/2;tip.position.set(-1.98,.44,-.84);exhaust.add(tip);
      place(exhaust,V(0,0,0),V(-.40,.65,-.90));
    }
    defPart('exhaust',{name:'排气管',more:'越野车的排气管从车底一路走到后轮前面，从侧面出来，这样过水坑时不容易灌水。中间有消音器把声音变小，还有净化器把废气变干净。',text:'发动机吃完饭会打嗝，从排气管噗噗噗冒出烟来。',action(){C.puffUntil=now()+3200;}},[exhaust]);
    const puffs=[];
    for(let i=0;i<12;i++){const p=mm(new THREE.SphereGeometry(.12,10,8),new THREE.MeshStandardMaterial({color:0xC9CFDB,transparent:true,opacity:0,depthWrite:false,roughness:1}));p.castShadow=false;p.visible=false;p.userData.life=0;root.add(p);puffs.push(p);}

    /* 车灯（含夜晚聚光灯） */
    const lightsG=new THREE.Group(),lamps=[],beams=[],spots=[];
    for(const z of [.68,-.68]){
      const l=mm(new THREE.CylinderGeometry(.17,.17,.06,22),new THREE.MeshPhysicalMaterial({color:0xFFF6D5,emissive:0xFFD740,emissiveIntensity:0,roughness:.1,metalness:.1,clearcoat:1}));
      l.rotation.z=Math.PI/2;l.position.set(2.46,1.04,z);l.userData.keepEm=true;lightsG.add(l);lamps.push(l);// 圆圆的大灯，嵌在平平的车头上
      const ring=mm(new THREE.TorusGeometry(.185,.025,10,24),dark(0x262b35));ring.rotation.y=Math.PI/2;ring.position.set(2.45,1.04,z);lightsG.add(ring);
      const blink=mm(new THREE.CylinderGeometry(.055,.055,.09,14),new THREE.MeshStandardMaterial({color:0xF2A03C,emissive:0xF2A03C,emissiveIntensity:.2,roughness:.3}));
      blink.position.set(2.16,1.38,z*1.25);blink.userData.keepEm=true;lightsG.add(blink);// 立在翼子板上的小转向灯
      const b=mm(new THREE.ConeGeometry(.5,2.2,20,1,true),new THREE.MeshStandardMaterial({color:0xFFE58A,transparent:true,opacity:0,depthWrite:false,emissive:0xFFE58A,emissiveIntensity:.6,side:THREE.DoubleSide}));
      b.rotation.z=Math.PI/2;b.position.set(3.7,1.0,z);b.castShadow=false;b.userData.noHit=true;b.userData.keepEm=true;lightsG.add(b);beams.push(b);
      const sp=new THREE.SpotLight(0xfff1c4,0,18,Math.PI/7,.55,1.1);sp.position.set(2.5,1.04,z);sp.target.position.set(9,-.4,z*1.6);lightsG.add(sp);lightsG.add(sp.target);spots.push(sp);
    }
    place(lightsG,V(0,0,0),V(2.1,.7,0));
    for(const z of [-.68,.68])for(const r of [.055,.092,.137]){
      const lensRing=mm(new THREE.TorusGeometry(r,.0025,6,36),chrome());
      lensRing.rotation.y=Math.PI/2;lensRing.position.set(2.500,1.04,z);lensRing.castShadow=false;lightsG.add(lensRing);
    }
    for(const l of lamps){l.material.color.setHex(0xd5e0e5);l.material.metalness=.6;l.material.roughness=.2;}
    defPart('lights',{name:'车灯',more:'越野车的大灯是两只圆圆的大眼睛，嵌在平平的车头上；翼子板上还立着两个小圆灯，是转向灯，司机在车里一眼就能看见它们闪。',outside:true,text:'天黑啦！车灯亮起来，才能看清前面的路。',text2:'天亮了，车灯可以关掉啦。',
      pickText(){return api.S.nightT?this.text2:this.text},action(){api.toggleNight();}},[lightsG]);

    /* 后视镜 */
    const mirrorsG=new THREE.Group(),mirrorParts=[];
    for(const s of [1,-1]){const g=new THREE.Group();const mir=roundedBox(.1,.08,.14,.03,paint());mir.position.set(0,.06,s*.15);g.add(mir);
      const face=mm(new THREE.BoxGeometry(.01,.06,.11),chrome());face.position.set(-.052,.06,s*.15);face.castShadow=false;g.add(face);
      g.add(tubeM(V(0,0,0),V(0,.03,s*.13),.018,dark()));mirrorsG.add(g);mirrorParts.push(g);place(g,V(.92,1.44,s*.93),V(.5,2.5,s*.9));}
    defPart('mirror',{name:'后视镜',more:'车上有三面镜子：左右各一面，车里还有一面。司机不用回头就能看到后面的车。',outside:true,hopTargets:mirrorParts,text:'爸爸看一眼小镜子，就知道后面有没有车。'},[mirrorsG]);

    /* 雨刮器（点一下：下雨，3 秒后开始刮） */
    const wiperG=new THREE.Group(),sweeps=[],WIPE_REST=1.0,WIPE_SWEEP=1.5;// 停放角（躺平）与摆动幅度
    {
      const d=V(-.33,.60,0).normalize(),n=V(d.y,-d.x,0),X=V().crossVectors(d,n);
      for(const z of [.40,-.40]){const pv=new THREE.Group();pv.position.copy(V(1.02,1.36,z)).addScaledVector(n,.03);pv.setRotationFromMatrix(new THREE.Matrix4().makeBasis(X,d,n));
        // 细细的臂 + 胶条；不刮的时候平躺在挡风玻璃底边（朝副驾一侧），不挡视线
        const sw=new THREE.Group();const arm=mm(new THREE.BoxGeometry(.016,.4,.012),dark(0x1f242e));arm.position.set(0,.2,.01);sw.add(arm);
        const blade=mm(new THREE.BoxGeometry(.026,.34,.01),dark(0x0f1218));blade.position.set(.018,.32,.014);sw.add(blade);
        const hub=mm(new THREE.CylinderGeometry(.02,.02,.024,10),dark());hub.rotation.x=Math.PI/2;sw.add(hub);sw.rotation.z=WIPE_REST;pv.add(sw);wiperG.add(pv);sweeps.push(sw);}
      place(wiperG,V(0,0,0),V(1.1,3.1,0));// 拆开：浮在抬起的挡风玻璃前上方
    }
    defPart('wiper',{name:'雨刮器',more:'雨刮器由一个小电机带动，左右摆动把雨水刮到旁边。刮之前喷一点玻璃水，刮得更干净。',outside:true,text:'下雨啦！雨刮器左右摆，把玻璃上的雨水刮掉，才能看清路。',
      action(){const t=now();if(t<C.rainUntil){C.rainUntil=t;C.wipeUntil=t+1500;}else{C.rainUntil=t+13000;C.wipeFrom=t+3000;C.wipeUntil=t+15000;}}},[wiperG]);
    // 雨：一束会往下落的短线
    const RAIN_N=520,rainX=new Float32Array(RAIN_N),rainY=new Float32Array(RAIN_N),rainZ=new Float32Array(RAIN_N),rainV=new Float32Array(RAIN_N),_rm=new THREE.Matrix4();
    for(let i=0;i<RAIN_N;i++){rainX[i]=(Math.random()-.5)*12;rainZ[i]=(Math.random()-.5)*10;rainY[i]=Math.random()*7;rainV[i]=8+Math.random()*3;}
    const rain=new THREE.InstancedMesh(new THREE.BoxGeometry(.018,.6,.018),new THREE.MeshBasicMaterial({color:0xF4FAFF,transparent:true,opacity:0,depthWrite:false}),RAIN_N);
    rain.visible=false;rain.frustumCulled=false;rain.castShadow=false;ctx.scene.add(rain);

    /* 方向盘 */
    const steer=new THREE.Group(),steerSpin=new THREE.Group();
    {
      steerSpin.add(mm(new THREE.TorusGeometry(.14,.025,12,32),dark()));
      for(let k=0;k<3;k++){const a=k*2*Math.PI/3+Math.PI/2;const sp=mm(new THREE.BoxGeometry(.03,.14,.02),dark());sp.position.set(Math.cos(a)*.07,Math.sin(a)*.07,0);sp.rotation.z=a-Math.PI/2;steerSpin.add(sp);}
      const hubC=mm(new THREE.CylinderGeometry(.04,.04,.035,14),dark(0x3a4150));hubC.rotation.x=Math.PI/2;steerSpin.add(hubC);
      // 拆开时直接落在中控台面上（中控自己的偏移是 .55/1.45，这里再往前上方挪一点，正好坐在台面中央）
      steer.add(steerSpin);const P=V(.52,1.34,-.45);place(steer,P,V(.92,1.47,.45));
      steer.lookAt(P.clone().add(V(-1,.5,0)));
    }
    defPart('steer',{name:'方向盘',more:'方向盘连着一根轴，轴带动前面两个轮子转向。轮子偏一点，车就慢慢拐过去。',outside:true,text:'转一转方向盘，前面的轮子跟着转，车就拐弯啦。',action(){C.steerDemoUntil=now()+3800;}},[steer]);

    /* 仪表台 + 中央扶手箱 + 启动按钮 */
    const dash=new THREE.Group();let startBtn;
    {
      const top=roundedBox(.3,.09,1.56,.045,dark(0x262b35));top.position.set(.47,.82,0);top.rotation.z=-.22;dash.add(top); // 向前倾斜的台面
      const glove=roundedBox(.02,.16,.5,.01,dark(0x3a4150));glove.position.set(.335,.6,.45);dash.add(glove);           // 手套箱
      const fascia=roundedBox(.1,.34,1.56,.04,dark(0x2e3440));fascia.position.set(.38,.66,0);dash.add(fascia);       // 竖直面板
      const hood=roundedBox(.22,.1,.42,.04,dark(0x1f242e));hood.position.set(.4,.9,-.45);dash.add(hood);              // 仪表罩（驾驶员前）
      const gauge=mm(new THREE.BoxGeometry(.01,.07,.32),new THREE.MeshStandardMaterial({color:0x1b2a44,emissive:0x8fd3ff,emissiveIntensity:.4,roughness:.3}));gauge.position.set(.335,.88,-.45);gauge.userData.keepEm=true;gauge.castShadow=false;dash.add(gauge);
      const screen=mm(new THREE.BoxGeometry(.012,.16,.26),new THREE.MeshStandardMaterial({color:0x1b3a5c,emissive:0x3aa0ff,emissiveIntensity:.35,roughness:.3}));screen.position.set(.328,.76,0);screen.userData.keepEm=true;screen.castShadow=false;dash.add(screen);
      for(const z of [.62,-.62,.22]){const vent=roundedBox(.02,.06,.14,.01,dark(0x141820));vent.position.set(.33,.8,z);dash.add(vent);}
      const box=roundedBox(.55,.28,.3,.05,dark(0x2e3440));box.position.set(.05,.46,0);dash.add(box);                 // 中央扶手箱
      const lever=mm(new THREE.CylinderGeometry(.015,.015,.14,8),chrome());lever.position.set(.1,.67,0);dash.add(lever);
      const knob=mm(new THREE.SphereGeometry(.035,12,8),dark(0x1f242e));knob.position.set(.1,.75,0);dash.add(knob);
      startBtn=mm(new THREE.CylinderGeometry(.04,.04,.025,16),new THREE.MeshStandardMaterial({color:0x4CC38A,emissive:0x4CC38A,emissiveIntensity:0,roughness:.4}));
      startBtn.position.set(.44,.885,-.18);startBtn.userData.keepEm=true;dash.add(startBtn);
      const ring=mm(new THREE.CylinderGeometry(.055,.055,.016,16),chrome());ring.position.set(.44,.878,-.18);dash.add(ring);
      dash.add(tubeM(V(.4,.8,-.45),V(.2,.96,-.45),.02,dark()));                                                       // 转向柱
      place(dash,V(.42,.32,0),V(.55,1.45,0));
    }
    defPart('start',{name:'启动按钮',more:'按下按钮，电池先给起动机送电，起动机把发动机转起来，车就醒了。',outside:true,isStart:true,text:'按一下，汽车就醒过来啦！'},[dash]);

    /* 座椅 + 安全座椅 */
    const TAN=0xc9a97c,seatsG=new THREE.Group(),driverMeshes=[];
    {
      for(const z of [.45,-.45]){
        const c=roundedBox(.44,.13,.42,.05,matte(TAN));c.position.set(-.28,.47,z);seatsG.add(c);
        const b=roundedBox(.12,.5,.42,.05,matte(TAN));b.position.set(-.55,.8,z);b.rotation.z=.15;seatsG.add(b);
        const h=roundedBox(.1,.12,.24,.04,matte(TAN));h.position.set(-.62,1.12,z);seatsG.add(h);
      }
      const bench=roundedBox(.36,.12,1.3,.05,matte(TAN));bench.position.set(-1.0,.46,0);seatsG.add(bench);
      const back=roundedBox(.12,.36,1.3,.05,matte(TAN));back.position.set(-1.16,.66,0);back.rotation.z=.12;seatsG.add(back);
      /* 司机：坐在驾驶座上，双手扶着方向盘（坐标是 seatsG 的局部值，整组再抬 .30）
         关键：坐垫顶面在局部 .535，人的胯部要落在这里，头顶要高过窗台线（世界 1.40），否则从外面只看得见一点头发 */
      {const dz=-.45,SKIN=matte(0xF6D2B0),SHIRT=matte(0x3F8FE0),PANTS=matte(0x2f3540);const D0=seatsG.children.length;
       const torso=roundedBox(.30,.62,.34,.10,SHIRT);torso.position.set(-.32,.85,dz);seatsG.add(torso);        // 胯 .54 → 肩 1.16
       const neck=mm(new THREE.CylinderGeometry(.055,.055,.10,10),SKIN);neck.position.set(-.30,1.20,dz);seatsG.add(neck);
       const head=mm(new THREE.SphereGeometry(.125,16,12),SKIN);head.position.set(-.29,1.32,dz);seatsG.add(head);// 世界 1.62，正好在车窗里
       const hair=mm(new THREE.SphereGeometry(.13,16,10,0,Math.PI*2,0,Math.PI/2),matte(0x2b2b2b));hair.position.set(-.29,1.335,dz);seatsG.add(hair);
       for(const s2 of [1,-1]){const eye=mm(new THREE.SphereGeometry(.014,8,6),dark(0x1f242e));eye.position.set(-.175,1.34,dz+s2*.05);eye.castShadow=false;seatsG.add(eye);}
       for(const s2 of [1,-1]){                                   // 两条胳膊伸到方向盘上（方向盘在局部 1.04）
         seatsG.add(tubeM(V(-.30,1.08,dz+s2*.18),V(.12,1.05,dz+s2*.12),.038,SHIRT));
         seatsG.add(tubeM(V(.12,1.05,dz+s2*.12),V(.42,1.03,dz+s2*.08),.034,SKIN));}
       for(const s2 of [1,-1]){                                   // 腿：坐着往前伸，脚踩在地板上（地板在局部 .32）
         seatsG.add(tubeM(V(-.26,.56,dz+s2*.10),V(.18,.50,dz+s2*.10),.06,PANTS));
         seatsG.add(tubeM(V(.18,.50,dz+s2*.10),V(.36,.34,dz+s2*.10),.052,PANTS));
         const shoe=roundedBox(.17,.07,.11,.02,dark(0x262b35));shoe.position.set(.42,.33,dz+s2*.10);seatsG.add(shoe);}
       for(let i=D0;i<seatsG.children.length;i++)seatsG.children[i].traverse(o=>{if(o.isMesh)driverMeshes.push(o);});}// 看里面/拆开看时把司机藏起来
      place(seatsG,V(0,.30,0),V(-.5,1.35,0));root.add(seatsG);
    }
    const cseat=new THREE.Group();
    {
      const c=roundedBox(.38,.12,.38,.05,matte(0xE04848));c.position.set(0,.06,0);cseat.add(c);
      const b=roundedBox(.1,.36,.38,.05,matte(0xE04848));b.position.set(-.14,.27,0);cseat.add(b);
      for(const z of [.17,-.17]){const w=roundedBox(.34,.2,.05,.025,matte(0xE04848));w.position.set(0,.18,z);cseat.add(w);}
      for(const z of [.06,-.06]){const belt=mm(new THREE.BoxGeometry(.035,.2,.035),dark());belt.position.set(-.04,.25,z);cseat.add(belt);}
      const buckle=roundedBox(.05,.05,.07,.01,chrome());buckle.position.set(-.02,.14,0);cseat.add(buckle);
      place(cseat,V(-.95,.84,.45),V(-.5,1.35,0));
    }
    const beltsG=new THREE.Group();
    for(const sd of [1,-1]){const z=sd*.45,bm=dark(0x2a2f3a);
      beltsG.add(tubeM(V(-.47,1.02,z+sd*.17),V(-.33,.58,z-sd*.2),.022,bm));       // 斜挎带
      beltsG.add(tubeM(V(-.3,.58,z+sd*.21),V(-.3,.58,z-sd*.2),.02,bm));            // 腰带
      const bk=roundedBox(.05,.06,.05,.01,chrome());bk.position.set(-.32,.6,z-sd*.21);beltsG.add(bk);
      const anchor=roundedBox(.04,.05,.04,.01,dark());anchor.position.set(-.5,1.04,z+sd*.19);beltsG.add(anchor);}
    place(beltsG,V(0,.30,0),V(-.5,1.35,0));
    defPart('belt',{name:'安全带',more:'急刹车时人会往前冲，安全带把人拉住。大人系三点式安全带，小朋友要坐安全座椅。',outside:true,text:'上车先系安全带，咔哒扣好，急刹车也不会摔出去。',action(){api.sfx.click();setTimeout(()=>api.sfx.click(),160);}},[beltsG]);
    defPart('seat',{name:'安全座椅',more:'小朋友太小，普通安全带勒不住。安全座椅按身高体重来选，用五点式带子把孩子稳稳包住。',outside:true,text:'宝宝坐在安全座椅上，扣好安全带，咔哒！',action(){api.sfx.click();setTimeout(()=>api.sfx.click(),160);}},[cseat]);

    /* ---- 每帧动画 ---- */
    function update(dt){
      for(const e of windowEdges)e.material.opacity=1-api.S.xr*.9;
      const S=api.S,t=now(),drv=S.drive,ee=api.ee,nn=S.night;
      const fuelT=((drv&&C.fuelOn)||t<C.fuelUntil)?1:0,pistT=((drv&&C.engineOn)||t<C.engineUntil)?1:0,wheelWT=((drv&&C.wheelsOn)||t<C.wheelUntil)?9:0,
            shaftWT=(((drv&&C.shaftOn)||t<C.shaftUntil)||wheelWT>0)?12:0,lightsT=(drv||t<C.lightsUntil||S.nightT)?1:0,puffOn=(drv&&C.engineOn)||t<C.puffUntil;
      const e=Math.min(1,dt*3.5);
      C.fuel+=(fuelT-C.fuel)*e;C.pistonSpd+=(pistT-C.pistonSpd)*e;C.wheelW+=(wheelWT-C.wheelW)*Math.min(1,dt*2.5);C.shaftW+=(shaftWT-C.shaftW)*e;C.lights+=(lightsT-C.lights)*Math.min(1,dt*6);
      engine.position.x+=.012*Math.sin(t*.06)*C.pistonSpd;engine.position.y+=.006*Math.sin(t*.083)*C.pistonSpd;
      shell.position.y+=.008*Math.sin(t*.05)*C.pistonSpd*(1-ee);
      for(const s of wheelSpin)s.rotation.z-=C.wheelW*dt;for(const a of axles)a.rotation.z-=C.wheelW*dt;shaftG.rotation.x+=C.shaftW*dt;
      const steerT=t<C.steerDemoUntil?.42*Math.sin(t/1000*2.4):0;C.steer+=(steerT-C.steer)*Math.min(1,dt*5);
      for(const y of frontYaw)y.rotation.y=C.steer;steerSpin.rotation.z=-2.6*C.steer;
      C.pistonPh+=dt*26*C.pistonSpd;pistons.forEach((p,i)=>{p.position.y=PIST_Y+PIST_AMP*Math.sin(C.pistonPh+i*1.05);});fan.rotation.x+=dt*22*C.pistonSpd;
      for(const l of lamps)l.userData.dynInt=(1.6+1.6*nn)*C.lights;for(const b of beams)b.material.opacity=(.32+.3*nn)*C.lights;
      for(const sp of spots)sp.intensity=C.lights*nn*2.6;C.brake+=(((t<C.brakeUntil)?1:0)-C.brake)*Math.min(1,dt*8);for(const tl of tailLights)tl.userData.dynInt=.5+1.0*nn+2.4*C.brake;
      startBtn.userData.dynInt=drv?1.3:0;
      // 雨 + 雨刮
      const raining=t<C.rainUntil,wiping=t>C.wipeFrom&&t<C.wipeUntil;
      C.rain+=((raining?1:0)-C.rain)*Math.min(1,dt*2);C.wipe+=((wiping?1:0)-C.wipe)*Math.min(1,dt*3);
      rain.visible=C.rain>.01;rain.material.opacity=.8*C.rain;S.gloom=C.rain;
      if(rain.visible){for(let i=0;i<RAIN_N;i++){let y=rainY[i]-rainV[i]*dt;if(y<0){y+=7;rainX[i]=(Math.random()-.5)*12;rainZ[i]=(Math.random()-.5)*10;}rainY[i]=y;_rm.makeTranslation(rainX[i],y,rainZ[i]);rain.setMatrixAt(i,_rm);}rain.instanceMatrix.needsUpdate=true;}
      const wantWater=raining&&!drv;if(wantWater&&!api.sfx.wantLoop)api.sfx.loop('water');else if(!wantWater&&api.sfx.wantLoop==='water')api.sfx.stopLoop();// 雨声只在没开车时放，开车让位给发动机
      for(const pv of doorPivots){const u=pv.userData,tg=drv?0:u.open;u.k+=(tg-u.k)*Math.min(1,dt*4);pv.rotation.y=u.sd*.95*u.k;}// 开车时门自动关上
      if(C.wipe>.01)C.wipePh+=dt*4.2*C.wipe;const wa=(.5-.5*Math.cos(C.wipePh))*Math.min(1,C.wipe*1.2);for(const sw of sweeps)sw.rotation.z=WIPE_REST-WIPE_SWEEP*wa;
      fuelDots.forEach((d,i)=>{const u=((t/1000*.45)+i/6)%1;d.position.lerpVectors(FUEL_A,FUEL_B,u);d.scale.setScalar(C.fuel*(1-ee)*(.6+.4*Math.sin(u*Math.PI)));});
      if(puffOn){C.puffTimer-=dt;if(C.puffTimer<=0){C.puffTimer=.2;const p=puffs.find(p=>!p.visible);if(p){p.visible=true;p.userData.life=0;p.position.copy(exhaust.position).add(PUFF_AT);p.scale.setScalar(.5);}}}
      for(const p of puffs){if(!p.visible)continue;p.userData.life+=dt;const L=p.userData.life;if(L>1.5){p.visible=false;continue;}
        p.position.x-=dt*(.9+C.wheelW*.05);p.position.y+=dt*.75;p.scale.setScalar(.5+L*1.4);p.material.opacity=.7*(1-L/1.5);}
    }
    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){C.startOn=true}},
      {t:'油箱。油箱是汽车的肚子。汽油顺着长长的管子，送到前面的发动机。',part:'tank',inner:true,on(){C.fuelOn=true}},
      {t:'发动机突突突转起来。',part:'engine',inner:true,on(){C.engineOn=true;api.sfx.loop('engine')}},
      {t:'力气分给前后两根传动轴，四个轮子一起转。',part:'shaft',inner:true,on(){C.shaftOn=true}},
      {t:'轮子转呀转，车子跑起来啦！',part:'wheels',on(){C.wheelsOn=true}},
    ];
    /* 车窗胶条：玻璃四周的细边，看里面的时候淡出，免得挡视线 */
    const windowEdges=[];
    for(const g of [shell,...doorPivots])g.traverse(m=>{
      if(!m.isMesh||!m.userData.glass)return;
      const edge=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0x18232b,transparent:true}));
      m.add(edge);windowEdges.push(edge);
    });
    ctx.linearize();
    return {update,chain,hideOnExplode:driverMeshes,iconFor(id){return id==='wheels'?wheelYaws[0]:null;},
      onStop(){C.startOn=C.fuelOn=C.engineOn=C.shaftOn=C.wheelsOn=false;},onStart(){}};
  }
};
})();

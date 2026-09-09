/* 场景：推土机（工地）
   坐标约定：+x 是车头（铲刀在前），y 向上，z 是左右。
   底盘、驾驶室、油缸都来自 rig.js，这里只写推土机独有的铲刀、推臂、松土器。 */
window.SCENES=window.SCENES||{};
(function(){
const YEL=0xF2B233;
const D={eng:0,engT:0,blade:0,bladeT:0,drive:0,driveT:0,ripper:0,ripperT:0,pileT:0,
  seq:null,seqI:0,seqT:0,reps:0,startOn:false,engineOn:false,
  engUntil:0,bladeUntil:0,driveUntil:0,ripUntil:0};
let api=null;
const now=()=>api.now();
window.__DZ=D;

/* 推一趟土：铲刀落地 → 往前推（土堆变大）→ 抬刀 → 倒回原位 */
const PUSH=[
  {d:2400,to:{drive:4.2}},
  {d:700 ,to:{blade:1}},
  {d:1500,to:{drive:0}},
  {d:600 ,to:{blade:0}},
];
function startSeq(seq,reps){if(D.seq)return;D.seq=seq;D.reps=reps||1;D.seqI=-1;nextSeg();}
function nextSeg(){
  D.seqI++;
  // 一趟推完：还有次数就从头再来，否则收工
  if(D.seqI>=D.seq.length){if(D.reps>1){D.reps--;D.seqI=0;}else{D.seq=null;D.reps=0;return;}}
  const sg=D.seq[D.seqI];
  D.from={blade:D.bladeT,drive:D.driveT};
  D.to=Object.assign({},D.from,sg.to);
  D.seqT=0;
}

SCENES.dozer={
  id:'dozer',title:'推土机',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  sky:'linear-gradient(180deg,#7FBFFF 0%,#A9D4FF 28%,#D6ECFB 48%,#D6ECFB 100%)',
  envMap:['#cfe0f0','#eef4fa','#b6bfc9','#8d97a2'],hemi:{sky:0xdfefff,ground:0xc9a56a},
  fog:{color:0xD6ECFB,near:24,far:52},
  look:{srgb:true,hemi:.55,sun:.95,fill:.28,rim:.4,exposure:1.0,autoRotate:.10},
  fit:{w:10,h:5.2,ty:1.5,tyEx:2.4,rEx:1.3,cx:1.2},cameraStart:{theta:.95,phi:1.2},
  order:['blade','arms','lift','tracks','cab','engine','hood','ripper','start'],
  go:{on:'开始推',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再推一次！',
    done:'推好啦！土堆到前面去了。',doneHintXray:'看，发动机在使劲。点「停下」再推一次。',
    doneHint:'点「看里面」，看看力气是从哪儿来的。'},
  intro:{icon:'blade',name:'推土机',text:'点一点推土机的零件，听听它叫什么。按「开始推」看它怎么推土。'},
  poster:{title:'推土机为什么推得动那么多土',sub:'工地上的大力士，靠的是履带和一块大铲刀',
    summary:'发动机 + 履带抓地 + 大铲刀 = 一次推走一大堆土！',angle:{theta:.95,phi:1.15},
    keys:['blade','arms','lift','tracks','engine','ripper']},

  /* ---------- 工地：土地、土堆、锥桶、围挡、远树 ---------- */
  env(ctx,_api){
    api=_api;
    const {THREE,scene,V,flat,matte,mm,roundedBox,canvasTex,rngFactory}=ctx;
    const dirtTex=canvasTex(512,512,(g,w,h)=>{
      const gr=g.createRadialGradient(w/2,h/2,w*.05,w/2,h/2,w/2);
      gr.addColorStop(0,'rgba(196,160,110,1)');gr.addColorStop(.75,'rgba(186,150,100,1)');gr.addColorStop(1,'rgba(186,150,100,0)');
      g.fillStyle=gr;g.fillRect(0,0,w,h);
      g.fillStyle='rgba(120,90,55,.12)';
      for(let i=0;i<400;i++){g.beginPath();g.arc(Math.random()*w,Math.random()*h,1+Math.random()*3,0,6.28);g.fill();}});
    const ground=new THREE.Mesh(new THREE.CircleGeometry(34,64),
      new THREE.MeshStandardMaterial({map:dirtTex,transparent:true,roughness:1}));
    ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
    // 铲刀前面那堆土，推的时候越堆越大
    const pile=mm(new THREE.SphereGeometry(1.0,16,12),flat(0xA8825A));
    pile.scale.set(1.6,.34,1.5);pile.castShadow=true;scene.add(pile);
    const rnd=rngFactory(4242),occ=[];
    const reg=o=>{o.updateWorldMatrix(true,true);
      const sp=new THREE.Box3().setFromObject(o).getBoundingSphere(new THREE.Sphere());
      o.userData.r=sp.radius;o.userData.cy=sp.center.y-o.position.y;o.userData.s0=o.scale.x;o.userData.k=1;occ.push(o);};
    for(const [x,z] of [[-4.6,2.6],[-6.8,1.4],[-6.6,-2.2]]){
      const g=new THREE.Group();
      const c=mm(new THREE.ConeGeometry(.22,.7,12),matte(0xF25C2A));c.position.y=.35;g.add(c);
      const b=roundedBox(.5,.05,.5,.02,matte(0xF25C2A));b.position.y=.025;g.add(b);
      const st=mm(new THREE.CylinderGeometry(.16,.19,.08,12),matte(0xffffff));st.position.y=.42;g.add(st);
      g.position.set(x,0,z);scene.add(g);reg(g);}
    for(let i=0;i<6;i++){
      const g=new THREE.Group(),x=-6+i*2.5;
      for(const dx of [-1.1,1.1]){const p=mm(new THREE.CylinderGeometry(.06,.06,1.3,8),flat(0x8B5A2B));p.position.set(dx,.65,0);g.add(p);}
      for(const y of [.55,1.05]){const r=roundedBox(2.4,.1,.06,.02,flat(0xE8D48A));r.position.set(0,y,0);g.add(r);}
      g.position.set(x,0,7.5);scene.add(g);reg(g);}
    const GREENS=[0x5DBB63,0x4CA85A,0x7CC576],trunkM=flat(0x8B5A2B);
    for(let i=0;i<10;i++){
      const a=(i/10)*Math.PI*2+rnd()*.4,R=14+rnd()*8,g=new THREE.Group();
      const t=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,1,7),trunkM);t.position.y=.5;g.add(t);
      for(const [dx,dy,dz,k] of [[0,1.5,0,1],[.4,1.8,.2,.7],[-.35,1.85,-.25,.6]]){
        const s=new THREE.Mesh(new THREE.SphereGeometry(.8*k,9,7),flat(GREENS[i%3]));s.position.set(dx,dy,dz);g.add(s);}
      g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
      g.scale.setScalar(1+rnd()*.6);g.position.set(Math.cos(a)*R,0,Math.sin(a)*R);scene.add(g);reg(g);}
    return {occluders:occ,update(){
      const k=D.pileT;
      pile.position.set(2.55+D.drive,0,0);
      pile.scale.set(1.6*(1+k*.45),.34*(1+k*1.1),1.5*(1+k*.3));
      pile.visible=k>.02;
    }};
  },

  /* ---------- 车体 ---------- */
  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,tubeM,steel,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const yel=()=>plastic(YEL);

    /* 履带底盘 */
    const crawler=RIG.crawler(ctx,{len:3.2,r:.48,halfZ:1.15,width:.78,cleats:24,rollers:5});
    place(crawler.group,V(0,.06,0),V(0,-.0,-3.2));
    defPart('tracks',{name:'履带',outside:true,
      text:'两条履带像两只大脚，抓得住地，推起土来不打滑。',
      more:'推土机推土的时候要用很大的力气往前顶。轮子会打滑，履带把重量摊在一大片地上，抓地力大得多，所以工地上的大力士都用履带。',
      action(){D.driveUntil=now()+3000;}},[crawler.group]);

    /* 机身 + 机罩 */
    const hood=new THREE.Group();
    {
      const deck=roundedBox(3.4,.36,2.1,.08,yel());deck.position.set(-.1,1.16,0);hood.add(deck);
      const bonnet=roundedBox(1.9,1.14,1.62,.1,yel());bonnet.position.set(1.02,1.80,0);hood.add(bonnet);
      const front=roundedBox(.3,.9,1.5,.06,dark(0x3a4150));front.position.set(2.02,1.72,0);hood.add(front);
      for(let i=0;i<5;i++){
        const v=roundedBox(.4,.03,.1,.01,dark(0x262b35));
        v.position.set(1.02,2.34,-.5+i*.25);hood.add(v);}
      const stack=mm(new THREE.CylinderGeometry(.08,.08,.8,12),dark(0x3a4150));
      stack.position.set(.35,2.25,.55);hood.add(stack);
      const cap=mm(new THREE.CylinderGeometry(.11,.11,.08,12),dark(0x262b35));
      cap.position.set(.35,2.68,.55);hood.add(cap);
      const tank=roundedBox(1.0,.5,.5,.1,dark(0x3a4150));tank.position.set(-1.35,1.6,-.75);hood.add(tank);
      markShell(hood);
      place(hood,V(0,0,0),V(0,2.4,0));
    }
    defPart('hood',{name:'机身',outside:true,
      text:'黄色的大身体，发动机、油箱都装在里面。',
      more:'推土机的身体是一整块厚钢板做的框架，前面顶着铲刀、后面拖着松土器，中间坐着司机。'},[hood]);

    /* 驾驶室 */
    const cabRig=RIG.cab(ctx,{w:1.45,h:1.5,d:1.4,color:0x3a4150});
    const cabG=cabRig.group;
    {
      const roofLight=mm(new THREE.BoxGeometry(.3,.08,.14),matte(0xF2E14A));
      roofLight.position.set(.6,1.56,0);cabG.add(roofLight);
      const wheelSt=mm(new THREE.TorusGeometry(.16,.03,8,20),dark(0x262b35));
      wheelSt.position.set(.42,.9,0);wheelSt.rotation.y=Math.PI/2;wheelSt.rotation.z=.5;cabG.add(wheelSt);
      for(const z of [-.35,.35]){
        const lever=mm(new THREE.CylinderGeometry(.035,.035,.5,8),dark(0x262b35));
        lever.position.set(.15,.75,z);lever.rotation.z=-.25;cabG.add(lever);}
      markShell(cabG);
      place(cabG,V(-1.05,1.34,0),V(-1.9,3.3,0));
    }
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机坐在里面，玻璃四面都是，看得清前面的土。',
      more:'驾驶室四面都是玻璃，司机要一直盯着铲刀。里面有两根操纵杆，一根管铲刀上下，一根管左右履带跑多快。'},[cabG]);

    /* 发动机（藏在机罩里，看里面才看得见） */
    const engine=new THREE.Group();
    {
      const block=roundedBox(1.1,.66,.9,.06,dark(0x2f3a4a));engine.add(block);
      const head=roundedBox(1.0,.2,.8,.04,matte(0xC0392B));head.position.y=.42;engine.add(head);
      for(let i=0;i<6;i++){
        const p=mm(new THREE.CylinderGeometry(.07,.07,.22,10),steel(0x9aa2ad));
        p.position.set(-.42+i*.17,.6,0);engine.add(p);}
      const belt=mm(new THREE.TorusGeometry(.2,.03,8,20),dark(0x1c1f25));
      belt.position.set(.62,0,0);belt.rotation.y=Math.PI/2;engine.add(belt);
      const fan=mm(new THREE.CylinderGeometry(.28,.28,.06,16),steel(0x6b7280));
      fan.position.set(.72,0,0);fan.rotation.z=Math.PI/2;engine.add(fan);
      place(engine,V(1.05,1.6,0),V(2.6,2.3,0));
    }
    defPart('engine',{name:'发动机',
      text:'发动机突突突地转，力气就是从这儿来的。',
      more:'推土机的发动机比汽车的大好几倍。它烧柴油，把力气送给履带和液压泵——履带负责往前顶，液压泵负责抬铲刀。',
      action(){D.engUntil=now()+3200;}},[engine]);

    /* 铲刀 */
    const bladeG=new THREE.Group();
    {
      /* 铲刀断面：一段圆弧，凹面朝前，下缘贴地、上缘往后仰 */
      const R=1.2,CX=-1.2,CY=.55,A=.47,TH=.09;
      const sh=new THREE.Shape();
      sh.absarc(CX,CY,R,-A,A,false);
      sh.absarc(CX,CY,R-TH,A,-A,true);
      sh.closePath();
      const W=3.4;
      const plate=mm(new THREE.ExtrudeGeometry(sh,{depth:W,bevelEnabled:false,curveSegments:20}),yel());
      plate.position.z=-W/2;bladeG.add(plate);
      const edge=roundedBox(.26,.12,W,.03,steel(0x6b7280));
      edge.position.set(-.06,.02,0);bladeG.add(edge);
      // 两侧的挡板，土才不会从边上漏掉
      for(const s of [1,-1]){
        const wing=roundedBox(.85,1.15,.09,.03,yel());
        wing.position.set(-.42,.58,s*(W/2-.04));bladeG.add(wing);}
      for(const s of [1,-1]){
        const rib=roundedBox(.5,.9,.1,.03,yel());
        rib.position.set(-.55,.6,s*.85);bladeG.add(rib);}
      bladeG.position.set(3.15,0,0);root.add(bladeG);
    }
    defPart('blade',{name:'铲刀',outside:true,
      text:'前面这块大铲刀，一推就是一大堆土！',
      more:'铲刀是弯的，土被推着往上翻、卷成一堆，不会散到两边。下面那条钢刃磨坏了可以单独换掉。',
      action(){D.bladeUntil=now()+3200;}},[bladeG]);

    /* 推臂：从履带架伸到铲刀背面 */
    const armsG=new THREE.Group();
    for(const s of [1,-1]){
      const arm=roundedBox(3.1,.22,.26,.05,dark(0x3a4150));
      arm.position.set(1.4,.62,s*1.62);armsG.add(arm);
      const pin=mm(new THREE.CylinderGeometry(.11,.11,.42,12),steel(0x6b7280));
      pin.rotation.x=Math.PI/2;pin.position.set(-.15,.62,s*1.62);armsG.add(pin);
    }
    root.add(armsG);
    defPart('arms',{name:'推臂',outside:true,
      text:'两根粗胳膊连着铲刀，力气全靠它们传过去。',
      more:'推臂后面用一个大销子连在履带架上，铲刀就是绕着这个销子上下摆的。推土时整台车的力气都从这两根胳膊压到铲刀上。'},[armsG]);

    /* 举升油缸 */
    const liftG=new THREE.Group();
    const rams=[];
    for(const s of [1,-1]){
      const r=RIG.ram(ctx,{r:.1,bodyLen:.95});
      liftG.add(r.group);rams.push({r,s});
    }
    root.add(liftG);
    defPart('lift',{name:'举升油缸',outside:true,
      text:'油缸一伸一缩，铲刀就抬起来、放下去。',
      more:'油缸里灌的是液压油。液压泵把油挤进去，杆子就被顶出来，铲刀抬起；油放掉，铲刀落下。一根手指的力气经过油就能变成几吨。',
      action(){D.bladeUntil=now()+3200;}},[liftG]);

    /* 松土器：屁股后面的爪子，先把硬地抓松再推 */
    const ripG=new THREE.Group();
    {
      const beam=roundedBox(1.5,.24,1.5,.06,dark(0x3a4150));beam.position.set(-.3,.1,0);ripG.add(beam);
      for(const s of [1,-1]){
        const shank=roundedBox(.22,1.05,.16,.04,yel());
        shank.position.set(-.7,-.35,s*.5);shank.rotation.z=-.18;ripG.add(shank);
        const tip=mm(new THREE.ConeGeometry(.13,.36,10),steel(0x6b7280));
        tip.position.set(-.86,-.98,s*.5);tip.rotation.z=Math.PI;ripG.add(tip);}
      ripG.position.set(-2.3,1.52,0);root.add(ripG);
    }
    defPart('ripper',{name:'松土器',outside:true,
      text:'屁股后面的大爪子，先把硬地抓松，再回头推。',
      more:'地太硬的时候铲刀推不动，就先放下松土器，像耙子一样把地划开，土松了再推就轻松了。',
      action(){D.ripUntil=now()+3000;}},[ripG]);

    /* 启动按钮 */
    const startG=new THREE.Group();
    {
      const base=mm(new THREE.CylinderGeometry(.15,.15,.07,18),dark(0x262b35));startG.add(base);
      const btn=mm(new THREE.CylinderGeometry(.11,.11,.09,18),
        new THREE.MeshStandardMaterial({color:0x35C46B,emissive:0x35C46B,emissiveIntensity:.35,roughness:.4}));
      btn.position.y=.06;btn.userData.keepEm=true;startG.add(btn);
      startG.position.set(-.62,2.02,-.55);root.add(startG);
    }
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，推土机就开始干活啦！',
      more:'司机上车先按这个按钮，发动机转起来，液压泵才有力气抬铲刀。'},[startG]);

    /* ---------- 每帧 ---------- */
    const _a=new THREE.Vector3(),_b=new THREE.Vector3(),
          _a0=new THREE.Vector3(),_b0=new THREE.Vector3(),_a1=new THREE.Vector3(),_b1=new THREE.Vector3();
    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;

      // 走动作序列
      if(D.seq){
        const sg=D.seq[D.seqI];D.seqT+=dt*1000;
        const k=Math.min(1,D.seqT/sg.d),e=k*k*(3-2*k);
        for(const key in D.to)D[key+'T']=D.from[key]+(D.to[key]-D.from[key])*e;
        if(k>=1)nextSeg();
      }

      const engOn=(drv&&D.engineOn)||t<D.engUntil;
      D.eng+=((engOn?1:0)-D.eng)*Math.min(1,dt*3);

      if(t<D.bladeUntil)D.bladeT=(Math.sin(t/450)*.5+.5);
      if(t<D.driveUntil)D.driveT=1.6*(Math.sin(t/700)*.5+.5);
      if(!drv&&!D.seq&&t>D.bladeUntil&&t>D.driveUntil){D.bladeT+=(0-D.bladeT)*Math.min(1,dt*1.5);D.driveT+=(0-D.driveT)*Math.min(1,dt*1.5);}
      D.blade+=(D.bladeT-D.blade)*Math.min(1,dt*4);
      const prevDrive=D.drive;
      D.drive+=(D.driveT-D.drive)*Math.min(1,dt*2.4);
      const moved=D.drive-prevDrive;

      // 铲刀落地时往前推，土堆才长大；抬起来或者倒车都不算
      if(moved>0&&D.blade<.35)D.pileT=Math.min(1,D.pileT+moved*.32);

      const ripOn=t<D.ripUntil;
      D.ripperT=ripOn?1:0;
      D.ripper+=(D.ripperT-D.ripper)*Math.min(1,dt*3);

      // 整车往前挪：直接推 root，所有零件跟着走，各自不用再算
      root.position.x=D.drive;
      crawler.advance(moved);

      // 铲刀：绕推臂后端的销子上下摆
      const lift=D.blade*.52;
      const bladeBaseX=3.15,bladeBaseY=lift*1.0;
      bladeG.position.set(bladeBaseX,bladeBaseY,0);
      bladeG.rotation.z=-lift*.32;
      armsG.position.set(0,0,0);
      armsG.rotation.z=lift*.20;
      // 拆开时零件飞出去
      const ex=(x,y,z,o)=>{o.position.x+=x*ee;o.position.y+=y*ee;o.position.z+=z*ee;};
      ex(2.9,1.5,0,bladeG);ex(1.2,-.0,2.4,armsG);
      ripG.position.set(-2.3,1.52-D.ripper*.42,0);
      ripG.rotation.z=D.ripper*.18;
      ex(-2.6,1.2,0,ripG);
      startG.position.set(-.62,2.02,-.55);
      ex(-.4,2.0,-1.6,startG);

      // 油缸：一头在机身上，一头顶着铲刀背面
      for(const {r,s} of rams){
        _a0.set(.20,1.92,s*.78);
        _b0.set(bladeBaseX-.62,bladeBaseY+1.02,s*.78);
        // 拆开后油缸整根停在这儿，长度不变
        _a1.set(.6,3.9,s*1.75);_b1.set(2.0,3.5,s*1.75);
        _a.lerpVectors(_a0,_a1,ee);_b.lerpVectors(_b0,_b1,ee);
        r.aim(_a,_b);
      }

      // 发动机抖动 + 风扇转
      const shake=D.eng*(1-ee)*.012;
      hood.position.y=hood.userData.home.y+hood.userData.explode.y*ee+Math.sin(t/55)*shake;
      engine.children.forEach(c=>{if(c.geometry&&c.geometry.type==='CylinderGeometry'&&c.rotation.z!==0)c.rotation.x+=dt*D.eng*22;});
      startG.children[1].material.emissiveIntensity=.35+(drv?.5:0)*(Math.sin(t/220)*.5+.5);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){D.startOn=true;}},
      {t:'发动机突突突转起来，力气有了。',part:'engine',inner:true,
        on(){D.engineOn=true;api.sfx.loop('engine');}},
      {t:'油缸放油，大铲刀落到地上。',part:'lift',on(){startSeq(PUSH,3);}},
      {t:'履带使劲抓着地，把土往前推。',part:'tracks'},
      {t:'土越推越多，堆成一大堆！',part:'blade'},
    ];

    ctx.linearize();
    return {update,chain,
      camX(){return D.drive*.8*(1-api.ee);},
      onStop(){D.seq=null;D.reps=0;D.startOn=D.engineOn=false;D.bladeT=0;D.driveT=0;D.pileT=0;},
      onStart(){D.pileT=0;},
      onDone(){D.engineOn=false;}};
  }
};
})();

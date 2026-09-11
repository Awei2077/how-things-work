/* 场景：压路机。+x 车头，前面一个大钢滚筒，后面两个胶轮。 */
window.SCENES=window.SCENES||{};
(function(){
const R={drive:0,driveT:0,spray:0,sprayT:0,vib:0,vibT:0,eng:0,paved:0,
  seq:null,seqI:0,seqT:0,reps:0,engineOn:false,
  engUntil:0,rollUntil:0,sprayUntil:0,vibUntil:0};
let api=null;const now=()=>api.now();
window.__RL=R;

const PAVE=[
  {d:600 ,to:{spray:1,vib:1}},
  {d:3000,to:{drive:5.0}},
  {d:400 ,to:{vib:0}},
  {d:1800,to:{drive:0}},
];
function startSeq(seq,reps){if(R.seq)return;R.seq=seq;R.reps=reps||1;R.seqI=-1;nextSeg();}
function nextSeg(){
  R.seqI++;
  if(R.seqI>=R.seq.length){if(R.reps>1){R.reps--;R.seqI=0;}else{R.seq=null;R.reps=0;return;}}
  const sg=R.seq[R.seqI];
  R.from={drive:R.driveT,spray:R.sprayT,vib:R.vibT};
  R.to=Object.assign({},R.from,sg.to);R.seqT=0;
}

SCENES.roller=Object.assign({
  id:'roller',title:'压路机',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:8.5,h:4.6,ty:1.3,tyEx:2.2,rEx:1.3,cx:0},cameraStart:{theta:.95,phi:1.2},
  order:['drum','vib','wheels','water','cab','engine','frame','start'],
  go:{on:'开始压',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再压一遍！',
    done:'压好啦！路面平平整整。',doneHintXray:'看，滚筒里的偏心块在使劲抖。点「停下」再压一次。',
    doneHint:'点「看里面」，看看它为什么会抖。'},
  intro:{icon:'drum',name:'压路机',text:'点一点压路机的零件，听听它叫什么。按「开始压」看它怎么把路压平。'},
  poster:{title:'压路机为什么一边走一边抖',sub:'光靠压不够重，抖起来才压得实',
    summary:'滚筒里藏着偏心块，转起来整个筒都在震，石子才会挤紧！',angle:{theta:.95,phi:1.15},
    keys:['drum','vib','water','engine','wheels']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,mm,roundedBox,flat,matte}=ctx;
    const s=RIG.site(ctx,{kind:'dirt',seed:8080,fenceZ:9,cones:[[-6.4,3.0],[-8.2,-2.4],[6.6,3.2]]});
    // 待压的松散路面 + 压好的平整路面
    const rough=new THREE.Mesh(new THREE.PlaneGeometry(26,3.4),matte(0x6E6B66));
    rough.rotation.x=-Math.PI/2;rough.position.set(0,.012,0);rough.receiveShadow=true;scene.add(rough);
    const smooth=new THREE.Mesh(new THREE.PlaneGeometry(1,3.4),matte(0x4A4844));
    smooth.rotation.x=-Math.PI/2;smooth.position.set(0,.02,0);smooth.receiveShadow=true;scene.add(smooth);
    const grit=[];
    for(let i=0;i<50;i++){
      const g=mm(new THREE.SphereGeometry(.055+Math.random()*.05,6,5),flat(0x8A857D));
      g.position.set(-12+Math.random()*24,.05,(Math.random()-.5)*3.0);
      g.castShadow=false;scene.add(g);grit.push(g);
    }
    return {occluders:s.occluders,update(){
      // 压过的路一直是平的，倒车也不会变回石子路
      if(R.front==null)R.front=-11;R.front=Math.max(R.front,R.drive+1.5);const front=R.front;
      smooth.scale.x=Math.max(.001,front+11);
      smooth.position.x=(front-11)/2-.5;
      for(const g of grit)g.visible=g.position.x>front;
    }};
  },

  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,tubeM,steel,chrome,dark,matte,plastic,glassMat,place,defPart,markShell,root}=ctx;
    const YEL=0xF2B233,yel=()=>plastic(YEL);

    /* 车架 */
    const frame=new THREE.Group();
    {
      const beam=roundedBox(3.2,.42,1.1,.08,yel());beam.position.set(-.2,.95,0);frame.add(beam);
      const neck=roundedBox(1.1,.3,.7,.06,dark(0x3a4150));neck.position.set(1.3,.95,0);frame.add(neck);
      const hitch=mm(new THREE.CylinderGeometry(.16,.16,.5,14),steel(0x6b7280));
      hitch.position.set(1.85,.95,0);frame.add(hitch);
      const deck=roundedBox(1.9,.12,1.5,.04,dark(0x3a4150));deck.position.set(-.6,1.2,0);frame.add(deck);
      for(const s of [1,-1]){
        const rail=tubeM(V(-1.5,1.26,s*.7),V(-1.5,1.75,s*.7),.04,steel());frame.add(rail);
        const rail2=tubeM(V(-1.5,1.75,s*.7),V(.2,1.75,s*.7),.04,steel());frame.add(rail2);
      }
      markShell(frame);place(frame,V(0,0,0),V(0,2.2,0));
    }
    defPart('frame',{name:'车架',outside:true,
      text:'黄色的身体，中间能弯，转弯特别灵活。',
      more:'压路机的车架中间有个大铰接点，前后能折成一个角度。这样转弯时前滚筒和后轮走的是同一条路，不会压坏刚压好的路面。'},[frame]);

    /* 前滚筒 */
    const drumG=new THREE.Group();
    const dr=RIG.drum(ctx,{r:.58,len:1.95,color:0xB8BEC6,axis:'z'});
    drumG.add(dr.group);
    {
      for(const sz of [1,-1]){
        const arm=roundedBox(.9,.24,.14,.04,yel());arm.position.set(.3,.34,sz*1.12);drumG.add(arm);
      }
      const yoke=roundedBox(.26,.7,2.4,.05,yel());yoke.position.set(.66,.32,0);drumG.add(yoke);
      const scr=roundedBox(.09,.26,1.85,.02,dark(0x3a4150));scr.position.set(-.66,.24,0);drumG.add(scr);
      drumG.position.set(1.55,.58,0);root.add(drumG);
    }
    defPart('drum',{name:'钢滚筒',outside:true,
      text:'前面这个大铁滚子，滚过去路就平了。',
      more:'滚筒是空心的大钢筒，里面还能灌水或者装沙子加重。它又重又光滑，滚过去把石子一颗颗压进土里。',
      action(){R.rollUntil=now()+3200;}},[drumG]);

    /* 偏心块（看里面） */
    const vibG=new THREE.Group();
    {
      const shaft=mm(new THREE.CylinderGeometry(.07,.07,1.7,12),steel(0x6b7280));
      shaft.rotation.x=Math.PI/2;vibG.add(shaft);
      for(const z of [-.55,0,.55]){
        const w=mm(new THREE.CylinderGeometry(.26,.26,.16,16,1,false,0,Math.PI),matte(0xC0392B));
        w.rotation.x=Math.PI/2;w.position.set(0,0,z);vibG.add(w);
      }
      dr.spin.add(vibG);
    }
    defPart('vib',{name:'偏心块',inner:true,
      text:'滚筒里藏着几块偏心的铁，转起来整个筒都在抖。',
      more:'铁块只长在轴的一边，转起来重心一直在甩，滚筒就跟着上下震。震动能让石子之间挤得更紧——光压不震，路面过几天就塌了。',
      action(){R.vibUntil=now()+3000;}},[vibG]);

    /* 后轮 */
    const wheelsG=new THREE.Group();const rw=[];
    for(const s of [1,-1]){
      const w=RIG.wheel(ctx,{r:.62,width:.55,tread:24});
      w.group.position.set(-1.75,.62,s*.78);wheelsG.add(w.group);rw.push(w);
    }
    root.add(wheelsG);
    defPart('wheels',{name:'后轮',outside:true,
      text:'后面是两个大胶轮，负责推着车往前走。',
      more:'后轮是橡胶的，花纹很浅。它们负责出力往前推，同时把滚筒没压到的地方再揉一遍。'},[wheelsG]);

    /* 驾驶室 */
    const cabRig=RIG.cab(ctx,{w:1.25,h:1.35,d:1.25,color:0x3a4150});
    const cabG=cabRig.group;
    {
      const wh=mm(new THREE.TorusGeometry(.15,.03,8,18),dark(0x262b35));
      wh.position.set(.3,.85,0);wh.rotation.y=Math.PI/2;wh.rotation.z=.5;cabG.add(wh);
      const beacon=mm(new THREE.CylinderGeometry(.07,.07,.14,12),
        new THREE.MeshStandardMaterial({color:0xF2A03C,emissive:0xF2A03C,emissiveIntensity:.6,roughness:.4}));
      beacon.position.set(0,1.44,0);beacon.userData.keepEm=true;cabG.add(beacon);
      markShell(cabG);place(cabG,V(-.75,1.26,0),V(-1.2,2.9,0));
    }
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机坐得高，看得见滚筒压到哪儿了。',
      more:'压路机开得很慢，司机要一直盯着前后有没有压漏的地方，来回压好几遍才算完。'},[cabG]);

    /* 水箱 + 喷水 */
    const waterG=new THREE.Group();
    {
      const t=roundedBox(.9,.5,1.3,.1,plastic(0x5B9BD5));waterG.add(t);
      const cap=mm(new THREE.CylinderGeometry(.09,.09,.08,12),steel(0x9aa2ad));
      cap.position.y=.29;waterG.add(cap);
      waterG.position.set(.1,1.55,0);root.add(waterG);
    }
    const spray=[];
    for(let i=0;i<12;i++){
      const d=mm(new THREE.SphereGeometry(.035,6,5),matte(0x9FD4F0));
      d.castShadow=false;d.userData.u=i/12;root.add(d);spray.push(d);
      d.userData.noHit=true;
    }
    defPart('water',{name:'洒水箱',
      text:'一边压一边喷水，沥青才不会粘在滚筒上。',
      more:'热沥青很粘，会一层层糊在滚筒上。喷一点水让筒面保持湿的，沥青就粘不住了。',
      action(){R.sprayUntil=now()+3200;}},[waterG]);

    /* 发动机 */
    const engine=new THREE.Group();
    {
      const blk=roundedBox(.9,.55,.7,.06,dark(0x2f3a4a));engine.add(blk);
      const head=roundedBox(.8,.16,.6,.04,matte(0xC0392B));head.position.y=.35;engine.add(head);
      const fan=mm(new THREE.CylinderGeometry(.2,.2,.06,16),steel(0x6b7280));
      fan.position.set(.5,0,0);fan.rotation.z=Math.PI/2;engine.add(fan);
      place(engine,V(-1.55,1.35,0),V(-2.6,2.2,0));
    }
    defPart('engine',{name:'发动机',
      text:'发动机既让车走，也让滚筒抖。',
      more:'发动机带动液压泵，一路油送到后轮的马达让车前进，另一路送到滚筒里的马达让偏心块高速转。',
      action(){R.engUntil=now()+3200;}},[engine]);

    const startG=new THREE.Group();
    {
      const base=mm(new THREE.CylinderGeometry(.13,.13,.06,18),dark(0x262b35));startG.add(base);
      const btn=mm(new THREE.CylinderGeometry(.1,.1,.08,18),
        new THREE.MeshStandardMaterial({color:0x35C46B,emissive:0x35C46B,emissiveIntensity:.35,roughness:.4}));
      btn.position.y=.05;btn.userData.keepEm=true;startG.add(btn);
      startG.position.set(-.3,1.9,.55);root.add(startG);
    }
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，压路机就开始压啦！',
      more:'压路机走得比人还慢，但一遍一遍压过去，路面就结实了。'},[startG]);

    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      if(R.seq){
        const sg=R.seq[R.seqI];R.seqT+=dt*1000;
        const k=Math.min(1,R.seqT/sg.d),e=k*k*(3-2*k);
        for(const key in R.to)R[key+'T']=R.from[key]+(R.to[key]-R.from[key])*e;
        if(k>=1)nextSeg();
      }
      if(t<R.sprayUntil)R.sprayT=1;
      if(t<R.vibUntil)R.vibT=1;
      if(t<R.rollUntil)R.driveT=1.2*(.5+.5*Math.sin(t/650));
      if(!drv&&!R.seq&&t>R.sprayUntil&&t>R.vibUntil&&t>R.rollUntil){
        R.sprayT=0;R.vibT=0;R.driveT+=(0-R.driveT)*Math.min(1,dt*1.4);
      }
      for(const k of ['drive','spray','vib'])R[k]+=(R[k+'T']-R[k])*Math.min(1,dt*3);
      const engOn=(drv&&R.engineOn)||t<R.engUntil;
      R.eng+=((engOn?1:0)-R.eng)*Math.min(1,dt*3);

      const moved=R.drive-(update._px||0);update._px=R.drive;
      root.position.x=R.drive;
      dr.spin.rotation.z-=moved/dr.R;
      for(const w of rw)w.spin.rotation.z-=moved/w.R;

      // 震动：整台车轻微上下抖
      const amp=R.vib*(1-ee)*.022;
      const j=Math.sin(t/28)*amp;
      drumG.position.set(1.55+2.4*ee,.58+j+.6*ee,0);
      frame.position.y=frame.userData.home.y+frame.userData.explode.y*ee+j*.55;
      vibG.rotation.z+=dt*R.vib*40;
      waterG.position.set(.1-.4*ee,1.55+1.4*ee,0);

      const spraying=R.spray>.3&&ee<.2;
      for(const d of spray){
        const u=((d.userData.u+t/420)%1);
        d.position.set(1.55-u*.35,1.15-u*.95,(d.userData.u-.5)*1.5);
        d.visible=spraying;d.scale.setScalar(spraying?(1-u)*1.1:0);
      }
      engine.children[2].rotation.x+=dt*R.eng*20;
      startG.children[1].material.emissiveIntensity=.35+(drv?.5:0)*(Math.sin(t/220)*.5+.5);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机转起来了。',part:'engine',inner:true,
        on(){R.engineOn=true;api.sfx.loop('engine');startSeq(PAVE,2);}},
      {t:'先喷一点水，沥青才不会粘在滚筒上。',part:'water'},
      {t:'滚筒里的偏心块高速转，整个筒都在抖。',part:'vib',inner:true},
      {t:'又压又震，石子被挤得紧紧的，路就平了。',part:'drum'},
    ];

    ctx.linearize();
    return {update,chain,camX(){return R.drive*.85*(1-api.ee);},
      onStop(){R.seq=null;R.reps=0;R.engineOn=false;R.driveT=R.sprayT=R.vibT=0;},
      onStart(){R.front=-11;},onDone(){R.engineOn=false;}};
  }
},RIG.SKY.site);
})();

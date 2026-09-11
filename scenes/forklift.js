/* 场景：叉车。前面一副门架，货叉插进托盘把货举起来。 */
window.SCENES=window.SCENES||{};
(function(){
const S={fork:0,forkT:0,drive:0,driveT:0,tilt:0,tiltT:0,load:0,loadT:0,eng:0,phase:0,
  engineOn:false,engUntil:0,forkUntil:0,driveUntil:0};
let api=null;const now=()=>api.now();window.__FL=S;
const KEYS=['fork','drive','tilt','load'];
/* 上半场：开到托盘前，叉起来送到货堆顶上放好，退出来 */
const UP=[
  {d:1200,to:{drive:.70}},
  {d:400 ,to:{load:1}},
  {d:600 ,to:{tilt:1,fork:.1}},
  {d:1800,to:{drive:4.55}},
  {d:1300,to:{fork:.5}},
  {d:400 ,to:{tilt:0}},
  {d:300 ,to:{load:0}},
  {d:900 ,to:{drive:3.2}},
  {d:800 ,to:{fork:0}},
];
/* 下半场：再把它从货堆上叉下来，送回原地 */
const DOWN=[
  {d:900 ,to:{fork:.5}},
  {d:900 ,to:{drive:4.55}},
  {d:300 ,to:{load:1}},
  {d:500 ,to:{fork:.62,tilt:1}},
  {d:1800,to:{drive:.70}},
  {d:1200,to:{fork:0}},
  {d:400 ,to:{tilt:0}},
  {d:300 ,to:{load:0}},
  {d:1000,to:{drive:0}},
];
let R=null;

SCENES.forklift=Object.assign({
  id:'forklift',title:'叉车',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:9,h:5.6,ty:1.4,tyEx:2.4,rEx:1.3,cx:1.8},cameraStart:{theta:.95,phi:1.18},
  order:['fork','mast','cyl','cw','wheels','seat','frame','engine','start'],
  go:{on:'开始叉',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再叉一次！',
    done:'叉好啦！货送上去，又稳稳放回来。',doneHintXray:'看，门架里的链条把货叉往上拉。点「停下」再叉一次。',
    doneHint:'点「看里面」，看看货叉是怎么升上去的。'},
  intro:{icon:'fork',name:'叉车',text:'点一点叉车的零件，听听它叫什么。按「开始叉」看它怎么把货举起来。'},
  poster:{title:'叉车为什么屁股那么重',sub:'前面举货，后面就得压住',
    summary:'货叉插进托盘 → 门架往上升 → 屁股的大铁块压着，才不会栽跟头！',angle:{theta:.95,phi:1.15},
    keys:['fork','mast','cw','cyl']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,roundedBox,matte,plastic}=ctx;
    const s=RIG.site(ctx,{kind:'road',seed:1717,fence:false,cones:[[-4.2,2.6],[-5.4,-2.2]]});
    // 货堆：正前方摞两个箱子，叉车把托盘送到它顶上（顶面 y=1.5），再叉下来
    const stack=new THREE.Group();
    for(let i=0;i<2;i++){
      const b=roundedBox(1.0,.7,1.0,.05,matte([0xB05A4A,0x4A6E8A][i]));
      b.position.set(0,.4+i*.75,0);stack.add(b);
    }
    stack.position.set(5.8,0,0);stack.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(stack);
    return {occluders:s.occluders,update(){}};
  },

  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,steel,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const ORG=0xE8892E;
    R=RIG.seqRunner(S,KEYS);

    const bodyG=new THREE.Group();
    {
      const b=roundedBox(1.9,.9,1.35,.1,plastic(ORG));b.position.set(-.9,.75,0);bodyG.add(b);
      const step=roundedBox(.5,.08,.4,.02,dark(0x3a4150));step.position.set(-.1,.5,.72);bodyG.add(step);
      const roof=roundedBox(1.3,.1,1.2,.03,steel(0x8a929e));roof.position.set(-1.0,2.5,0);bodyG.add(roof);
      for(const [dx,dz] of [[-.4,.55],[-.4,-.55],[-1.6,.55],[-1.6,-.55]]){
        const p=roundedBox(.08,1.6,.08,.02,steel(0x8a929e));p.position.set(dx,1.7,dz);bodyG.add(p);
      }
      markShell(bodyG);place(bodyG,V(0,0,0),V(0,2.2,0));
    }
    defPart('frame',{name:'车身',outside:true,
      text:'橙色的小身体，头顶还有个护顶架。',
      more:'叉车个头小，但很沉。发动机、油箱、液压泵全塞在这个小身体里，前面还要挂一副门架。'},[bodyG]);
    const seatG=new THREE.Group();
    {
      const s2=roundedBox(.5,.12,.5,.04,matte(0x2b3038));seatG.add(s2);
      const bk=roundedBox(.5,.55,.12,.04,matte(0x2b3038));bk.position.set(-.28,.32,0);seatG.add(bk);
      const wh=mm(new THREE.TorusGeometry(.16,.03,8,18),dark(0x262b35));
      wh.position.set(.42,.45,0);wh.rotation.y=Math.PI/2;wh.rotation.z=.6;seatG.add(wh);
      seatG.position.set(-1.0,1.28,0);root.add(seatG);
    }
    defPart('seat',{name:'座椅',outside:true,
      text:'司机坐在这儿，头顶有个护顶架。',
      more:'头顶那个铁框叫护顶架，万一货掉下来能挡一下。叉车开得慢，但货举高以后很容易翻，所以要系安全带。'},[seatG]);

    const cwG=new THREE.Group();
    {
      const c=roundedBox(.7,1.0,1.3,.1,dark(0x3a4150));cwG.add(c);
      place(cwG,V(-2.2,.85,0),V(-1.6,1.6,0));
    }
    defPart('cw',{name:'配重',outside:true,
      text:'屁股上一大块铁，前面举货才不会栽跟头。',
      more:'叉车其实是个跷跷板，支点在前轮。前面举得越重，后面就要越重。所以小小一台叉车能有两三吨。'},[cwG]);

    const wheelsG=new THREE.Group();const ws=[];
    for(const s of [1,-1]){
      const w=RIG.wheel(ctx,{r:.36,width:.28,tread:16});
      w.group.position.set(.3,.36,s*.62);wheelsG.add(w.group);ws.push(w);
      const w2=RIG.wheel(ctx,{r:.28,width:.22,tread:14});
      w2.group.position.set(-2.0,.28,s*.5);wheelsG.add(w2.group);ws.push(w2);
    }
    root.add(wheelsG);
    defPart('wheels',{name:'轮子',outside:true,
      text:'前轮大后轮小，后轮负责转向。',
      more:'叉车是后轮转向的，所以能原地打转，在窄窄的货架之间也掉得过头。这跟汽车正好相反。'},[wheelsG]);

    /* 门架 */
    const mastPivot=new THREE.Group();mastPivot.position.set(.55,.15,0);root.add(mastPivot);
    const mastG=new THREE.Group();mastPivot.add(mastG);
    const inner=new THREE.Group();
    {
      for(const sz of [1,-1]){
        const c=roundedBox(.12,2.2,.12,.03,plastic(ORG));c.position.set(0,1.1,sz*.55);mastG.add(c);
      }
      const cross=roundedBox(.12,.12,1.2,.03,plastic(ORG));cross.position.set(0,2.15,0);mastG.add(cross);
      for(const sz of [1,-1]){
        const c=roundedBox(.09,2.0,.09,.02,steel(0x9aa2ad));c.position.set(.1,1.0,sz*.4);inner.add(c);
      }
      const ch=mm(new THREE.CylinderGeometry(.11,.11,.9,12),steel(0x6b7280));
      ch.rotation.x=Math.PI/2;ch.position.set(.05,2.1,0);inner.add(ch);
      mastG.add(inner);
    }
    defPart('mast',{name:'门架',outside:true,
      text:'两根轨道，货叉顺着它往上爬。',
      more:'门架是两层套在一起的：外面一层固定，里面一层被油缸顶起来，链条又把货叉再往上拉一倍。所以门架只升一半，叉子能升到顶。',
      action(){S.forkUntil=now()+3200;}},[mastG]);

    const cylG=new THREE.Group();
    {
      const c=mm(new THREE.CylinderGeometry(.09,.09,1.6,14),steel(0x6b7280));
      c.position.set(-.12,.8,0);cylG.add(c);
      const rod=mm(new THREE.CylinderGeometry(.05,.05,1.2,12),steel(0xd8dee5));
      rod.position.set(-.12,1.9,0);cylG.add(rod);
      mastG.add(cylG);
    }
    defPart('cyl',{name:'举升油缸',outside:true,
      text:'油缸一伸，门架和货叉就升起来。',
      more:'脚下踩油门、手上推手柄，油泵就把油挤进这根油缸，杆子顶出来，几吨的货轻松举起。',
      action(){S.forkUntil=now()+3200;}},[cylG]);

    /* 货叉 */
    const forkG=new THREE.Group();
    {
      // 叉齿贴着地面（y≈0），正好插进托盘的板条之间
      const back=roundedBox(.1,.7,1.1,.03,steel(0x8a929e));back.position.set(.1,.24,0);forkG.add(back);
      for(const sz of [1,-1]){
        const arm=roundedBox(1.1,.08,.16,.02,steel(0x9aa2ad));
        arm.position.set(.68,-.11,sz*.2);forkG.add(arm);
        const up=roundedBox(.1,.5,.16,.02,steel(0x9aa2ad));
        up.position.set(.14,.14,sz*.2);forkG.add(up);
      }
      inner.add(forkG);
    }
    defPart('fork',{name:'货叉',outside:true,
      text:'两根钢叉插进托盘底下，一抬就走。',
      more:'两根叉子的间距能调，对准托盘下面那两个洞插进去。全世界的托盘尺寸都差不多，所以哪台叉车都能叉。',
      action(){S.forkUntil=now()+3200;}},[forkG]);

    /* 托盘和货：原点放在托盘后沿（叉子插进来的那一边），跟着叉子走时角度才对得上。
       托盘不属于叉车，放在场景里而不是 root 里——叉车开走，它才会留在原地。 */
    const palletG=new THREE.Group();
    {
      const p=roundedBox(1.1,.12,1.1,.03,matte(0xB8895A));p.position.x=.7;palletG.add(p);
      for(const sz of [-.4,0,.4]){
        const sl=roundedBox(1.1,.09,.16,.02,matte(0xA07B4A));sl.position.set(.7,-.1,sz);palletG.add(sl);
      }
      const box=roundedBox(.8,.58,.8,.05,matte(0xC9A227));box.position.set(.7,.35,0);palletG.add(box);
      palletG.traverse(o=>{if(o.isMesh)o.castShadow=true;});
      palletG.userData.noHit=true;ctx.scene.add(palletG);
    }
    const HOME=new THREE.Vector3(1.25,.15,0);
    const resetPallet=()=>{palletG.position.copy(HOME);palletG.rotation.z=0;};
    resetPallet();
    const _wp=new THREE.Vector3();

    const eng=RIG.engine(ctx,{scale:.7});
    place(eng.group,V(-1.5,.75,0),V(-2.6,1.7,0));
    defPart('engine',{name:'发动机',
      text:'小小的发动机，藏在座位底下。',
      more:'室内用的叉车很多是电动的，用大电瓶。室外的柴油叉车力气更大，能叉更重的货。',
      action(){S.engUntil=now()+3200;}},[eng.group]);

    const sb=RIG.startBtn(ctx,-.55,1.75,.5);root.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，叉车就开始干活啦！',
      more:'叉车开得慢，但一天能搬几百个托盘。'},[sb.group]);

    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.forkUntil){S.forkT=.5+.5*Math.sin(t/700);S.tiltT=.5;}
      if(!drv&&t>S.forkUntil)R.idle(dt,1.3);
      R.ease(dt,3);
      const engOn=(drv&&S.engineOn)||t<S.engUntil;
      S.eng+=((engOn?1:0)-S.eng)*Math.min(1,dt*3);

      const moved=S.drive-(update._p||0);update._p=S.drive;
      root.position.x=S.drive;
      for(const w of ws)w.spin.rotation.z-=moved/w.R;

      mastPivot.rotation.z=.13*S.tilt;
      mastPivot.position.set(.55+1.6*ee,.15+.7*ee,0);
      inner.position.y=1.5*S.fork;
      forkG.position.y=1.5*S.fork;
      forkG.getWorldPosition(_wp);
      // 挂上时托盘跟着叉子走；放下就留在当时的位置（货堆顶上或原地），不会自己跳回去
      if(S.loadT>.5){palletG.position.copy(_wp);palletG.rotation.z=.13*S.tilt;}
      palletG.visible=ee<.3;
      // 上半场送上货堆，跑完接着下半场叉回来
      if(S.phase===1&&!R.running){S.phase=2;R.start(DOWN,1);}
      else if(S.phase===2&&!R.running)S.phase=0;
      eng.spin(dt,S.eng);
      sb.pulse(drv,t);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机转起来，油泵有劲了。',part:'engine',inner:true,
        on(){S.engineOn=true;api.sfx.loop('engine');S.phase=1;R.start(UP,1);}},
      {t:'开过去，两根叉子插进托盘底下。',part:'fork'},
      {t:'门架微微后仰，货就不会滑下来。',part:'mast'},
      {t:'油缸一伸，货举起来，送到货堆顶上！',part:'cyl'},
      {t:'放好了，再把它叉下来，送回原地。',part:'fork'},
    ];

    ctx.linearize();
    return {update,chain,camX(){return S.drive*.85*(1-api.ee);},
      onStop(){R.stop();S.engineOn=false;S.phase=0;for(const k of KEYS)S[k+'T']=0;resetPallet();},
      onStart(){resetPallet();},onDone(){S.engineOn=false;}};
  }
},RIG.SKY.street);
})();

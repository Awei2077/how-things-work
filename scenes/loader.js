/* 场景：装载机（铲车）。+x 车头，前面一个大铲斗。 */
window.SCENES=window.SCENES||{};
(function(){
const S={lift:0,liftT:0,tilt:0,tiltT:0,drive:0,driveT:0,load:0,loadT:0,eng:0,
  engineOn:false,engUntil:0,armUntil:0,bkUntil:0};
let api=null;const now=()=>api.now();window.__LD=S;
const KEYS=['lift','tilt','drive','load'];
/* tilt：正 = 铲斗往回翻兜住土，负 = 往前倒出来 */
const SCOOP=[
  {d:1300,to:{drive:1.6,tilt:0,lift:0}},
  {d:600 ,to:{load:1,tilt:.8}},
  {d:1200,to:{lift:1}},
  {d:1100,to:{drive:-.3}},
  {d:900 ,to:{tilt:-.9}},
  {d:400 ,to:{load:0}},
  {d:900 ,to:{tilt:.15,lift:0,drive:0}},
];
let R=null;

SCENES.loader=Object.assign({
  id:'loader',title:'装载机',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:9.5,h:5.4,ty:1.5,tyEx:2.5,rEx:1.3,cx:.6},cameraStart:{theta:.95,phi:1.18},
  order:['bucket','arm','cyl','wheels','cab','engine','body','start'],
  go:{on:'开始铲',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再铲一斗！',
    done:'铲好啦！满满一斗全倒进去了。',doneHintXray:'看，油缸一伸一缩把大臂顶起来。点「停下」再铲一次。',
    doneHint:'点「看里面」，看看力气是从哪儿来的。'},
  intro:{icon:'bucket',name:'装载机',text:'点一点装载机的零件，听听它叫什么。按「开始铲」看它怎么把土装走。'},
  poster:{title:'装载机一斗能装多少',sub:'四个大轮子 + 一把大铲斗，工地上跑得最欢的一台',
    summary:'冲进土堆 → 铲斗一翻 → 举高 → 倒进卡车，一趟就是好几吨！',angle:{theta:.95,phi:1.15},
    keys:['bucket','arm','cyl','engine','wheels']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,mm,flat}=ctx;
    const s=RIG.site(ctx,{kind:'dirt',seed:333,fenceZ:9});
    const pile=mm(new THREE.SphereGeometry(1.3,16,12),flat(0xA8825A));
    pile.scale.set(1.05,.92,1.0);pile.position.set(4.6,-.15,0);pile.castShadow=true;scene.add(pile);
    return {occluders:s.occluders,update(){
      pile.scale.set(1.05*(1-S.load*.14),.92*(1-S.load*.2),1.0*(1-S.load*.14));
    }};
  },

  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,steel,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const YEL=0xF2B233,yel=()=>plastic(YEL);
    R=RIG.seqRunner(S,KEYS);

    /* 车身 */
    const body=new THREE.Group();
    {
      const rear=roundedBox(2.2,1.0,1.7,.12,yel());rear.position.set(-1.5,1.1,0);body.add(rear);
      const front=roundedBox(1.6,.8,1.7,.1,yel());front.position.set(.35,1.0,0);body.add(front);
      const joint=mm(new THREE.CylinderGeometry(.24,.24,1.0,14),steel(0x6b7280));
      joint.position.set(-.5,1.1,0);body.add(joint);
      const cw=roundedBox(.5,.8,1.6,.08,dark(0x3a4150));cw.position.set(-2.6,1.0,0);body.add(cw);
      const stack=mm(new THREE.CylinderGeometry(.08,.08,.6,12),dark(0x3a4150));
      stack.position.set(-1.0,2.0,-.55);body.add(stack);
      markShell(body);place(body,V(0,0,0),V(0,2.3,0));
    }
    defPart('body',{name:'车身',outside:true,
      text:'中间能折的黄色身体，转弯特别灵活。',
      more:'装载机的车身从中间折成两半，转弯时前半身带着铲斗一起转，在窄地方也掉得过头。'},[body]);

    const cabRig=RIG.cab(ctx,{w:1.35,h:1.45,d:1.35,color:0x3a4150});
    markShell(cabRig.group);place(cabRig.group,V(-1.5,1.6,0),V(-1.9,3.1,0));
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机坐得高，一眼看得见铲斗装满没有。',
      more:'装载机来回跑得快，驾驶室四面透明，司机要一直看着前面的土堆和后面的卡车。'},[cabRig.group]);

    /* 轮子 */
    const wheelsG=new THREE.Group();const ws=[];
    for(const x of [1.35,-1.9])for(const s of [1,-1]){
      const w=RIG.wheel(ctx,{r:.7,width:.5,tread:22});
      w.group.position.set(x,.7,s*.92);wheelsG.add(w.group);ws.push(w);
    }
    root.add(wheelsG);
    defPart('wheels',{name:'轮子',outside:true,
      text:'四个又大又粗的轮子，土路上跑得稳。',
      more:'四个轮子都会使劲，这叫四驱。轮胎花纹很深，抓得住松土，冲进土堆时才不打滑。'},[wheelsG]);

    /* 大臂 */
    const armPivot=new THREE.Group();armPivot.position.set(-.2,1.15,0);root.add(armPivot);
    const armG=new THREE.Group();armPivot.add(armG);
    for(const s of [1,-1]){
      const a=roundedBox(2.5,.24,.22,.05,yel());a.position.set(1.25,0,s*.72);armG.add(a);
    }
    {
      const cross=roundedBox(.24,.22,1.5,.05,yel());cross.position.set(1.3,0,0);armG.add(cross);
    }
    defPart('arm',{name:'大臂',outside:true,
      text:'两根粗胳膊把铲斗举得高高的。',
      more:'大臂后端连在车身上，前端挂着铲斗。举起来的时候，铲斗要一直保持水平，土才不会撒出来。',
      action(){S.armUntil=now()+3200;}},[armG]);

    /* 油缸 */
    const cylG=new THREE.Group();const rams=[];
    for(const s of [1,-1]){
      const r=RIG.ram(ctx,{r:.1,bodyLen:.9});cylG.add(r.group);rams.push({r,s});
    }
    root.add(cylG);
    defPart('cyl',{name:'液压油缸',outside:true,
      text:'油缸一伸，大臂就抬起来了。',
      more:'油泵把液压油挤进油缸，杆子被顶出来，几吨重的一斗土就轻轻松松举起来了。',
      action(){S.armUntil=now()+3200;}},[cylG]);

    /* 铲斗 */
    const bkPivot=new THREE.Group();armG.add(bkPivot);bkPivot.position.set(2.5,0,0);
    const bkG=new THREE.Group();bkPivot.add(bkG);
    {
      const back=roundedBox(.12,1.0,2.0,.04,yel());back.position.set(0,.35,0);bkG.add(back);
      const bottom=roundedBox(1.0,.1,2.0,.04,yel());bottom.position.set(.5,-.12,0);bkG.add(bottom);
      for(const s of [1,-1]){
        const side=roundedBox(1.0,1.0,.09,.03,yel());side.position.set(.45,.32,s*.98);bkG.add(side);
      }
      const edge=roundedBox(.22,.1,2.0,.03,steel(0x6b7280));edge.position.set(1.0,-.14,0);bkG.add(edge);
      for(let i=0;i<5;i++){
        const th=mm(new THREE.ConeGeometry(.09,.26,8),steel(0x8a929e));
        th.rotation.z=-Math.PI/2;th.position.set(1.16,-.14,-.8+i*.4);bkG.add(th);
      }
    }
    defPart('bucket',{name:'铲斗',outside:true,
      text:'一斗能装好几吨土！',
      more:'铲斗前面那排尖牙是用来插进土堆的。牙磨坏了可以一个个换掉，不用换整个斗。',
      action(){S.bkUntil=now()+3200;}},[bkG]);

    /* 斗里的土 */
    const dirt=mm(new THREE.SphereGeometry(.75,14,10),matte(0xA8825A));
    dirt.scale.set(.9,.42,1.0);bkG.add(dirt);dirt.position.set(.45,.15,0);dirt.userData.noHit=true;

    const eng=RIG.engine(ctx,{scale:1.0});
    place(eng.group,V(-1.9,1.15,0),V(-2.8,2.1,0));
    defPart('engine',{name:'发动机',
      text:'发动机既让轮子转，也让油缸有劲。',
      more:'装载机干活时又要跑又要举，发动机的力气分成两路：一路推轮子，一路推油泵。',
      action(){S.engUntil=now()+3200;}},[eng.group]);

    const sb=RIG.startBtn(ctx,-1.0,2.35,.75);root.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，装载机就开始铲啦！',
      more:'司机上车先热一下车，油温上来了油缸才顺。'},[sb.group]);

    const _a=new THREE.Vector3(),_b=new THREE.Vector3();
    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.armUntil)S.liftT=.5+.5*Math.sin(t/700);
      if(t<S.bkUntil)S.tiltT=.5+.5*Math.sin(t/600);
      if(!drv&&t>S.armUntil&&t>S.bkUntil)R.idle(dt,1.3);
      R.ease(dt,3.2);
      const engOn=(drv&&S.engineOn)||t<S.engUntil;
      S.eng+=((engOn?1:0)-S.eng)*Math.min(1,dt*3);

      const moved=S.drive-(update._p||0);update._p=S.drive;
      root.position.x=S.drive;
      for(const w of ws)w.spin.rotation.z-=moved/w.R;

      /* 铲斗角度要在大臂的坐标系里算：bkPivot 是 armPivot 的子节点，两个旋转会叠加。
         目标是让铲斗的绝对角度停在 -.02（刃口刚好贴地），所以要先把大臂的角度补回来。 */
      const armRot=-.38+1.00*S.lift;
      armPivot.rotation.z=armRot;
      bkPivot.rotation.z=(-.02-armRot)+1.30*S.tilt;
      dirt.visible=S.load>.05&&ee<.3;
      dirt.scale.set(.9*S.load,.42*S.load,1.0*S.load);

      for(const {r,s} of rams){
        _a.set(-.50+.9*ee,1.02+1.4*ee,s*.96);
        _b.set(1.05+.9*ee,1.15+1.35*S.lift+1.4*ee,s*.96);
        r.aim(_a,_b);
      }
      eng.spin(dt,S.eng);
      sb.pulse(drv,t);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机转起来，油泵有劲了。',part:'engine',inner:true,
        on(){S.engineOn=true;api.sfx.loop('engine');R.start(SCOOP,3);}},
      {t:'低头冲进土堆，铲斗插进去。',part:'bucket'},
      {t:'铲斗往回一翻，土就兜住了。',part:'bucket'},
      {t:'油缸把大臂顶起来，举得高高的。',part:'cyl',inner:true},
      {t:'倒进卡车里，再回头铲下一斗！',part:'arm'},
    ];

    ctx.linearize();
    return {update,chain,camX(){return S.drive*.85*(1-api.ee);},
      onStop(){R.stop();S.engineOn=false;for(const k of KEYS)S[k+'T']=0;},
      onStart(){},onDone(){S.engineOn=false;}};
  }
},RIG.SKY.site);
})();

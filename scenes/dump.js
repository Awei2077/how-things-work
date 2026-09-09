/* 场景：自卸卡车（翻斗车）。+x 车头，后面的车厢能液压顶起来卸货。 */
window.SCENES=window.SCENES||{};
(function(){
const S={tip:0,tipT:0,drive:0,driveT:0,load:1,loadT:1,gate:0,gateT:0,eng:0,
  engineOn:false,engUntil:0,tipUntil:0,driveUntil:0};
let api=null;const now=()=>api.now();window.__DP=S;
const KEYS=['tip','drive','load','gate'];
const RUN=[
  {d:2200,to:{drive:3.4}},
  {d:600 ,to:{gate:1}},
  {d:1800,to:{tip:1}},
  {d:900 ,to:{load:0}},
  {d:1200,to:{tip:0}},
  {d:400 ,to:{gate:0}},
  {d:1600,to:{drive:0,load:1}},
];
let R=null;

SCENES.dump=Object.assign({
  id:'dump',title:'自卸卡车',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:11,h:6.5,ty:1.7,tyEx:2.8,rEx:1.28,cx:-.3},cameraStart:{theta:.95,phi:1.18},
  order:['bed','ram','gate','wheels','cab','engine','frame','start'],
  go:{on:'开始卸',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再拉一车！',
    done:'卸完啦！一车石头全倒下来了。',doneHintXray:'看，大油缸把车厢整个顶起来。点「停下」再来一次。',
    doneHint:'点「看里面」，看看车厢是怎么被顶起来的。'},
  intro:{icon:'bed',name:'自卸卡车',text:'点一点卡车的零件，听听它叫什么。按「开始卸」看它怎么把石头倒下来。'},
  poster:{title:'一车石头怎么倒下来',sub:'不用人搬——车厢自己会翘起来',
    summary:'一根大油缸把车厢顶到 50 度，石头就自己滑下去了！',angle:{theta:.95,phi:1.15},
    keys:['bed','ram','gate','engine','wheels']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,mm,flat}=ctx;
    const s=RIG.site(ctx,{kind:'dirt',seed:6161,fenceZ:9});
    const heap=mm(new THREE.SphereGeometry(1,14,10),flat(0x8A857D));
    heap.scale.set(1.2,.3,1.1);heap.castShadow=true;scene.add(heap);
    return {occluders:s.occluders,update(){
      const dropped=1-S.load;
      heap.position.set(-4.6+S.drive,.02,0);
      heap.scale.set(1.2*(.2+dropped*.9),.3*(.15+dropped),1.1*(.2+dropped*.85));
      heap.visible=dropped>.03;
    }};
  },

  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,steel,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const BLUE=0x3E7BC6;
    R=RIG.seqRunner(S,KEYS);

    const tk=RIG.truck(ctx,{color:BLUE,cabX:2.4,wheelR:.56,halfZ:.98,
      frameFrom:-3.5,frameTo:3.2,axles:[{x:2.15},{x:-1.5,dual:true},{x:-2.65,dual:true}]});
    place(tk.group,V(0,0,0),V(0,0,0));
    defPart('frame',{name:'大梁',outside:true,
      text:'两根粗钢梁扛着整个车厢。',
      more:'自卸车的大梁比普通卡车厚得多，因为石头砸下来的时候冲击力很大。'},[tk.group]);
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机在这里按一个键，车厢就翘起来。',
      more:'卸货时司机不用下车，驾驶室里有个手柄控制油缸。车厢顶起来之前要先确认后面没人。'},[tk.cab]);
    const wheelsG=new THREE.Group();for(const w of tk.wheels)wheelsG.add(w.group);
    defPart('wheels',{name:'轮子',outside:true,hopTargets:tk.wheels.map(w=>w.group),
      text:'后面双排轮子，装满石头也压不坏。',
      more:'一车石头有二三十吨。轮子越多，每个轮胎分到的重量越小，才不会爆胎。'},[wheelsG]);

    /* 车厢（绕后端翻起） */
    const bedPivot=new THREE.Group();bedPivot.position.set(-3.1,.95,0);root.add(bedPivot);
    const bedG=new THREE.Group();bedPivot.add(bedG);
    {
      const floor=roundedBox(4.6,.16,2.1,.05,plastic(BLUE));floor.position.set(2.3,0,0);bedG.add(floor);
      for(const s of [1,-1]){
        const side=roundedBox(4.6,.95,.12,.04,plastic(BLUE));side.position.set(2.3,.5,s*1.0);bedG.add(side);
        for(let i=0;i<4;i++){
          const rib=roundedBox(.1,.95,.2,.03,plastic(BLUE));
          rib.position.set(.7+i*1.15,.5,s*1.08);bedG.add(rib);
        }
      }
      const head=roundedBox(.14,1.35,2.1,.05,plastic(BLUE));head.position.set(4.55,.6,0);bedG.add(head);
      const guard=roundedBox(.5,.5,2.1,.05,steel(0x9aa2ad));guard.position.set(4.6,1.45,0);bedG.add(guard);
    }
    defPart('bed',{name:'车厢',outside:true,
      text:'大铁箱子，能装满满一车石头。',
      more:'车厢底板是很厚的钢板，石头从高处倒进来砸得很响。侧板上那几道竖筋是为了让箱子更结实。',
      action(){S.tipUntil=now()+3200;}},[bedG]);

    /* 后挡板 */
    const gatePivot=new THREE.Group();gatePivot.position.set(.05,1.0,0);bedG.add(gatePivot);
    const gateG=new THREE.Group();gatePivot.add(gateG);
    {
      const g=roundedBox(.12,1.0,2.1,.04,plastic(BLUE));g.position.set(0,-.5,0);gateG.add(g);
      for(const s of [1,-1]){
        const hinge=mm(new THREE.CylinderGeometry(.07,.07,.2,10),steel(0x6b7280));
        hinge.rotation.x=Math.PI/2;hinge.position.set(0,0,s*.95);gateG.add(hinge);
      }
    }
    defPart('gate',{name:'后挡板',outside:true,
      text:'后面这块板一松开，石头就哗啦倒出来。',
      more:'挡板上面是活动的铰链，下面用锁扣挂着。车厢一翘，锁自动松开，挡板被石头推着荡开。',
      action(){S.tipUntil=now()+3200;}},[gateG]);

    /* 车厢里的石头 */
    const loadG=new THREE.Group();
    for(let i=0;i<14;i++){
      const r=mm(new THREE.SphereGeometry(.2+Math.random()*.12,7,6),matte(0x8A857D));
      r.position.set(.9+Math.random()*3.4,.35+Math.random()*.25,(Math.random()-.5)*1.6);
      loadG.add(r);
    }
    loadG.userData.noHit=true;bedG.add(loadG);

    /* 举升油缸 */
    const ramG=new THREE.Group();
    const ram=RIG.ram(ctx,{r:.16,bodyLen:1.0});ramG.add(ram.group);root.add(ramG);
    defPart('ram',{name:'举升油缸',outside:true,
      text:'一根粗油缸，把整个车厢顶起来。',
      more:'这根油缸能顶起几十吨。它是一节套一节的，收起来很短，伸出去很长，正好塞在驾驶室后面。',
      action(){S.tipUntil=now()+3200;}},[ramG]);

    const eng=RIG.engine(ctx,{scale:1.0});
    place(eng.group,V(2.4,.95,0),V(3.4,1.9,0));
    defPart('engine',{name:'发动机',
      text:'发动机带着油泵，油泵推动大油缸。',
      more:'卸货时司机会踩一脚油门，发动机转得快一点，油泵才有足够的力气把车厢顶起来。',
      action(){S.engUntil=now()+3200;}},[eng.group]);

    const sb=RIG.startBtn(ctx,2.4,2.45,1.0);root.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，卡车就出发啦！',
      more:'装好车、关好挡板，就可以上路了。'},[sb.group]);

    const _a=new THREE.Vector3(),_b=new THREE.Vector3();
    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.tipUntil){S.tipT=.5+.5*Math.sin(t/800);S.gateT=S.tipT>.3?1:0;}
      if(!drv&&t>S.tipUntil){R.idle(dt,1.3);S.loadT=1;}
      R.ease(dt,3);
      const engOn=(drv&&S.engineOn)||t<S.engUntil;
      S.eng+=((engOn?1:0)-S.eng)*Math.min(1,dt*3);

      const moved=S.drive-(update._p||0);update._p=S.drive;
      root.position.x=S.drive;tk.advance(moved);

      bedPivot.rotation.z=-.88*S.tip;
      bedPivot.position.set(-3.1,.95+1.9*ee,0);
      gatePivot.rotation.z=-1.15*S.gate;
      loadG.visible=S.load>.05&&ee<.3;
      loadG.scale.setScalar(Math.max(.01,S.load));

      _a.set(-1.4+.4*ee,.85+1.0*ee,0);
      const bx=-3.1+Math.cos(-.88*S.tip)*1.9, by=.95+1.9*ee+Math.sin(-.88*S.tip)*-1.9;
      _b.set(bx,Math.max(1.1,by)+ (ee?1.9*ee:0),0);
      ram.aim(_a,_b);
      eng.spin(dt,S.eng);
      sb.pulse(drv,t);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机转起来，装满石头出发。',part:'engine',inner:true,
        on(){S.engineOn=true;api.sfx.loop('engine');R.start(RUN,2);}},
      {t:'开到工地，停稳。',part:'wheels'},
      {t:'后挡板的锁一松，板子就荡开了。',part:'gate'},
      {t:'大油缸把车厢顶起来，石头哗啦滑下去！',part:'ram'},
    ];

    ctx.linearize();
    return {update,chain,
      onStop(){R.stop();S.engineOn=false;S.tipT=S.driveT=S.gateT=0;S.loadT=1;},
      onStart(){},onDone(){S.engineOn=false;}};
  }
},RIG.SKY.site);
})();

/* 场景：平地机。车肚子中间一把长刀片，斜着把路刮平。 */
window.SCENES=window.SCENES||{};
(function(){
const S={blade:0,bladeT:0,turn:0,turnT:0,drive:0,driveT:0,eng:0,paved:0,
  engineOn:false,engUntil:0,bladeUntil:0,driveUntil:0};
let api=null;const now=()=>api.now();window.__GR=S;
const KEYS=['blade','turn','drive'];
const PASS=[
  {d:900 ,to:{blade:1,turn:1}},
  {d:3200,to:{drive:5.5}},
  {d:600 ,to:{blade:0}},
  {d:1800,to:{drive:0}},
];
let R=null;

SCENES.grader=Object.assign({
  id:'grader',title:'平地机',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:12,h:5.4,ty:1.5,tyEx:2.6,rEx:1.3,cx:0},cameraStart:{theta:.95,phi:1.2},
  order:['blade','circle','frame','wheels','cab','engine','ripper','start'],
  go:{on:'开始刮',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再刮一遍！',
    done:'刮好啦！路面又平又直。',doneHintXray:'看，刀片是斜着装的，土会顺着往一边跑。点「停下」再刮一次。',
    doneHint:'点「看里面」，看看刀片是怎么转角度的。'},
  intro:{icon:'blade',name:'平地机',text:'点一点平地机的零件，听听它叫什么。按「开始刮」看它怎么把路面刮平。'},
  poster:{title:'平地机的刀为什么装在中间',sub:'前轮压出高低，后轮跟着走，中间那把刀最稳',
    summary:'刀片斜着刮 → 土被推到路边 → 路面又平又有一点点坡，好排水！',angle:{theta:.95,phi:1.15},
    keys:['blade','circle','frame','engine']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,mm,flat,matte}=ctx;
    const s=RIG.site(ctx,{kind:'dirt',seed:7070,fenceZ:10,cones:[[-8.4,3.2],[-9.6,-2.6]]});
    const rough=new THREE.Mesh(new THREE.PlaneGeometry(30,3.6),matte(0x7A7268));
    rough.rotation.x=-Math.PI/2;rough.position.set(0,.012,0);rough.receiveShadow=true;scene.add(rough);
    const smooth=new THREE.Mesh(new THREE.PlaneGeometry(1,3.6),matte(0x8A8276));
    smooth.rotation.x=-Math.PI/2;smooth.position.set(0,.02,0);smooth.receiveShadow=true;scene.add(smooth);
    const ridge=mm(new THREE.BoxGeometry(1,.16,.5),flat(0x9A8E7C));
    ridge.castShadow=true;scene.add(ridge);
    const bumps=[];
    for(let i=0;i<40;i++){
      const b=mm(new THREE.SphereGeometry(.09+Math.random()*.07,6,5),flat(0x8A7E70));
      b.position.set(-14+Math.random()*28,.06,(Math.random()-.5)*3.2);scene.add(b);bumps.push(b);
    }
    return {occluders:s.occluders,update(){
      const front=S.drive+.2;
      smooth.scale.x=Math.max(.001,front+13);
      smooth.position.x=(front-13)/2;
      ridge.scale.x=Math.max(.001,(front+13)*.98);
      ridge.position.set((front-13)/2,.08,1.55);
      ridge.visible=S.blade>.2;
      for(const b of bumps)b.visible=b.position.x>front;
    }};
  },

  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,steel,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const YEL=0xF2B233,yel=()=>plastic(YEL);
    R=RIG.seqRunner(S,KEYS);

    /* 车架：细长的鹅颈 + 后面的机身 */
    const frame=new THREE.Group();
    {
      const neck=roundedBox(3.6,.34,.5,.08,yel());neck.position.set(2.0,1.55,0);frame.add(neck);
      const rear=roundedBox(2.6,1.0,1.5,.1,yel());rear.position.set(-1.6,1.35,0);frame.add(rear);
      const hood=roundedBox(1.8,.6,1.3,.08,yel());hood.position.set(-1.9,2.05,0);frame.add(hood);
      const stack=mm(new THREE.CylinderGeometry(.07,.07,.6,12),dark(0x3a4150));
      stack.position.set(-1.2,2.55,.42);frame.add(stack);
      for(let i=0;i<4;i++){
        const v=roundedBox(.35,.03,.1,.01,dark(0x262b35));v.position.set(-1.9,2.32,-.4+i*.25);frame.add(v);
      }
      markShell(frame);place(frame,V(0,0,0),V(0,2.3,0));
    }
    defPart('frame',{name:'车架',outside:true,
      text:'又细又长的身子，中间才装得下那把大刀。',
      more:'平地机的车架特别长，前轮离刀片很远。这样前轮压过的小坑，传到刀片那里已经被平均掉了，刮出来的面才平。'},[frame]);

    const cabRig=RIG.cab(ctx,{w:1.3,h:1.45,d:1.35,color:0x3a4150});
    markShell(cabRig.group);place(cabRig.group,V(-.2,1.85,0),V(-.6,3.2,0));
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机坐得高，从两边往下看刀片。',
      more:'平地机的驾驶室前后都是大玻璃，司机要同时盯着刀片两头，一边高一点、一边低一点，路才有排水的坡度。'},[cabRig.group]);

    /* 轮子：前二后四 */
    const wheelsG=new THREE.Group();const ws=[];
    const addW=(x,z,r)=>{const w=RIG.wheel(ctx,{r,width:.4,tread:20});
      w.group.position.set(x,r,z);wheelsG.add(w.group);ws.push(w);};
    for(const s of [1,-1])addW(3.5,s*.85,.62);
    for(const s of [1,-1]){addW(-1.5,s*.9,.72);addW(-2.6,s*.9,.72);}
    root.add(wheelsG);
    defPart('wheels',{name:'轮子',outside:true,
      text:'前面两个、后面四个，前轮还能歪着走。',
      more:'刮土的时候刀片会把车往一边推。司机就把前轮往反方向歪一点，车才走得直——这叫前轮倾斜。'},[wheelsG]);

    /* 回转圈 */
    const circleG=new THREE.Group();
    {
      const ring=mm(new THREE.TorusGeometry(.85,.08,10,26),steel(0x6b7280));
      ring.rotation.x=Math.PI/2;circleG.add(ring);
      for(let i=0;i<18;i++){
        const a=i*Math.PI*2/18;
        const t=roundedBox(.09,.1,.09,.02,steel(0x8a929e));
        t.position.set(Math.cos(a)*.9,0,Math.sin(a)*.9);circleG.add(t);
      }
      circleG.position.set(1.35,1.48,0);root.add(circleG);
    }
    defPart('circle',{name:'回转圈',outside:true,
      text:'一个大齿圈，刀片挂在上面能转任意角度。',
      more:'刀片不是固定的。它挂在这个齿圈下面，能转一整圈，还能左右伸出去、上下抬。所以同一把刀能刮路面，也能刮路边的沟。',
      action(){S.bladeUntil=now()+3200;}},[circleG]);

    /* 刀片 */
    const bladePivot=new THREE.Group();bladePivot.position.set(1.35,1.48,0);root.add(bladePivot);
    const bladeG=new THREE.Group();bladePivot.add(bladeG);
    {
      /* 刀板是一段弧，圆心放在前方（+x）：凹面朝前，土才会顺着弧面卷起来 */
      const R2=1.0,CX=1.0,CY=.45,A=.42,TH=.08;
      const sh=new THREE.Shape();
      sh.absarc(CX,CY,R2,Math.PI-A,Math.PI+A,false);sh.absarc(CX,CY,R2-TH,Math.PI+A,Math.PI-A,true);sh.closePath();
      const W=3.0;
      const plate=mm(new THREE.ExtrudeGeometry(sh,{depth:W,bevelEnabled:false,curveSegments:16}),yel());
      plate.position.set(0,-1.42,-W/2);bladeG.add(plate);
      // 刀刃直接贴在刀板下沿，不能悬空
      const edge=roundedBox(.2,.1,W,.03,steel(0x6b7280));
      edge.position.set(.06,-1.40,0);bladeG.add(edge);
      for(const s of [1,-1]){
        const hang=roundedBox(.14,.75,.14,.03,steel(0x8a929e));hang.position.set(0,-.42,s*.7);bladeG.add(hang);
      }
    }
    defPart('blade',{name:'刀片',outside:true,
      text:'长长的大刀片，斜着一刮路就平了。',
      more:'刀片是弯的，土被刮起来会顺着弧面往一边卷走，堆在路边成一条小土埂。刮一遍不够，来回好几遍才够平。',
      action(){S.bladeUntil=now()+3200;}},[bladeG]);

    /* 松土耙 */
    const ripG=new THREE.Group();
    {
      const beam=roundedBox(.9,.2,1.4,.05,dark(0x3a4150));ripG.add(beam);
      for(let i=0;i<5;i++){
        const th=roundedBox(.14,.7,.12,.03,yel());th.position.set(-.2,-.45,-.55+i*.28);ripG.add(th);
        const tip=mm(new THREE.ConeGeometry(.09,.24,8),steel(0x6b7280));
        tip.rotation.z=Math.PI;tip.position.set(-.2,-.88,-.55+i*.28);ripG.add(tip);
      }
      ripG.position.set(-3.4,1.3,0);root.add(ripG);
    }
    defPart('ripper',{name:'松土耙',outside:true,
      text:'屁股后面一排小爪子，把硬土先划开。',
      more:'地面板结的时候刀片刮不动，就先放下这排爪子划几遍，把土松开，再用刀片刮平。'},[ripG]);

    const eng=RIG.engine(ctx,{scale:.95});
    place(eng.group,V(-1.9,2.0,0),V(-3.2,2.4,0));
    defPart('engine',{name:'发动机',
      text:'发动机在屁股上，前面才留得出位置装刀。',
      more:'平地机的发动机装在最后面，一来给中间的刀片让位置，二来压住后轮增加抓地力。',
      action(){S.engUntil=now()+3200;}},[eng.group]);

    const sb=RIG.startBtn(ctx,-.2,2.6,.72);root.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，平地机就开始刮啦！',
      more:'刮路要一遍一遍慢慢来，急不得。'},[sb.group]);

    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.bladeUntil){S.bladeT=.5+.5*Math.sin(t/700);S.turnT=S.bladeT;}
      if(!drv&&t>S.bladeUntil)R.idle(dt,1.3);
      R.ease(dt,3);
      const engOn=(drv&&S.engineOn)||t<S.engUntil;
      S.eng+=((engOn?1:0)-S.eng)*Math.min(1,dt*3);

      const moved=S.drive-(update._p||0);update._p=S.drive;
      root.position.x=S.drive;
      for(const w of ws)w.spin.rotation.z-=moved/w.R;

      bladePivot.position.set(1.35,1.48+2.0*ee,0);
      bladePivot.rotation.y=.55*S.turn;
      bladeG.position.y=-.15*S.blade;
      circleG.position.set(1.35+1.2*ee,1.48+2.0*ee,0);
      ripG.position.set(-3.4-1.4*ee,1.3+1.1*ee,0);
      eng.spin(dt,S.eng);
      sb.pulse(drv,t);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机在屁股上，转起来了。',part:'engine',inner:true,
        on(){S.engineOn=true;api.sfx.loop('engine');R.start(PASS,2);}},
      {t:'回转圈把刀片转成斜的。',part:'circle'},
      {t:'刀片落下去，插进土里。',part:'blade'},
      {t:'慢慢往前刮，土顺着刀面堆到路边。',part:'blade'},
    ];

    ctx.linearize();
    return {update,chain,camX(){return S.drive*.85*(1-api.ee);},
      onStop(){R.stop();S.engineOn=false;for(const k of KEYS)S[k+'T']=0;},
      onStart(){},onDone(){S.engineOn=false;}};
  }
},RIG.SKY.site);
})();

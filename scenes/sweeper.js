/* 场景：洒水车（清扫车）。底下两把转刷 + 前面喷水杆。 */
window.SCENES=window.SCENES||{};
(function(){
const S={brush:0,brushT:0,spray:0,sprayT:0,drive:0,driveT:0,eng:0,
  engineOn:false,engUntil:0,brushUntil:0,sprayUntil:0};
let api=null;const now=()=>api.now();window.__SW=S;
const KEYS=['brush','spray','drive'];
const RUN=[
  {d:700 ,to:{brush:1,spray:1}},
  {d:3400,to:{drive:6.0}},
  {d:500 ,to:{brush:0,spray:0}},
  {d:1800,to:{drive:0}},
];
let R=null;

SCENES.sweeper=Object.assign({
  id:'sweeper',title:'洒水车',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:10,h:5.4,ty:1.5,tyEx:2.6,rEx:1.3,cx:-.2},cameraStart:{theta:.95,phi:1.2},
  order:['brush','spray','tank','suction','wheels','cab','engine','body','start'],
  go:{on:'开始扫',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再扫一遍！',
    done:'扫好啦！路面干干净净。',doneHintXray:'看，水箱里的水一路送到喷嘴。点「停下」再扫一次。',
    doneHint:'点「看里面」，看看水和垃圾各走哪条路。'},
  intro:{icon:'brush',name:'洒水车',text:'点一点洒水车的零件，听听它叫什么。按「开始扫」看它怎么把马路扫干净。'},
  poster:{title:'洒水车怎么把马路扫干净',sub:'先喷水压住灰，再用大刷子扫进去',
    summary:'喷水 → 转刷把垃圾拨到中间 → 大吸口一口吸进箱子里！',angle:{theta:.95,phi:1.15},
    keys:['brush','spray','suction','tank']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,mm,flat,matte}=ctx;
    const s=RIG.site(ctx,{kind:'road',seed:5252,fence:false,cones:[[-7.4,3.2],[-8.6,-2.6]]});
    const dirty=new THREE.Mesh(new THREE.PlaneGeometry(30,4.0),matte(0x7B7B78));
    dirty.rotation.x=-Math.PI/2;dirty.position.set(0,.012,0);dirty.receiveShadow=true;scene.add(dirty);
    const clean=new THREE.Mesh(new THREE.PlaneGeometry(1,4.0),matte(0x5E6470));
    clean.rotation.x=-Math.PI/2;clean.position.set(0,.02,0);clean.receiveShadow=true;scene.add(clean);
    const litter=[];
    for(let i=0;i<40;i++){
      const c=[0xC9A227,0x8A857D,0xB05A4A,0x6E8A5A][i%4];
      const l=mm(new THREE.BoxGeometry(.12,.03,.1),flat(c));
      l.rotation.y=Math.random()*3;
      l.position.set(-14+Math.random()*28,.04,(Math.random()-.5)*3.6);scene.add(l);litter.push(l);
    }
    return {occluders:s.occluders,update(){
      // 扫过的地方一直是干净的，倒车也不会把垃圾变回来
      if(S.front==null)S.front=-14;S.front=Math.max(S.front,S.drive-1.2);const front=S.front;
      clean.scale.x=Math.max(.001,front+14);
      clean.position.x=(front-14)/2;
      for(const l of litter)l.visible=l.position.x>front;
    }};
  },

  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,steel,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const BLU=0x3E7BC6;
    R=RIG.seqRunner(S,KEYS);

    const tk=RIG.truck(ctx,{color:BLU,cabX:2.2,wheelR:.46,halfZ:.88,
      frameFrom:-3.2,frameTo:3.0,axles:[{x:1.95},{x:-1.7,dual:true}]});
    place(tk.group,V(0,0,0),V(0,0,0));
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机开得很慢，一边开一边看两边的刷子。',
      more:'洒水车通常在清早上路，那时候车少人少。司机要开得又慢又稳，才扫得干净。'},[tk.cab]);
    const wheelsG=new THREE.Group();for(const w of tk.wheels)wheelsG.add(w.group);
    defPart('wheels',{name:'轮子',outside:true,hopTargets:tk.wheels.map(w=>w.group),
      text:'轮子不大，开得慢慢的。',
      more:'扫地的时候车速只有走路那么快，太快了刷子来不及把垃圾拨进去。'},[wheelsG]);

    /* 垃圾箱 */
    const bodyG=new THREE.Group();
    {
      const box=roundedBox(3.0,1.5,1.9,.12,plastic(0xE8E4DC));box.position.set(-1.4,1.75,0);bodyG.add(box);
      const band=roundedBox(3.04,.18,1.94,.03,plastic(BLU));band.position.set(-1.4,1.3,0);bodyG.add(band);
      const lid=roundedBox(3.0,.1,1.8,.03,steel(0x9aa2ad));lid.position.set(-1.4,2.55,0);bodyG.add(lid);
      markShell(bodyG);place(bodyG,V(0,0,0),V(0,2.3,0));
    }
    defPart('body',{name:'垃圾箱',outside:true,
      text:'扫进来的垃圾都存在这个大箱子里。',
      more:'箱子后面能整个翻起来，到了垃圾站一倒就空了。箱底还有个小口，专门放脏水。'},[bodyG]);

    /* 水箱 */
    const tankG=new THREE.Group();
    {
      const t=mm(new THREE.CylinderGeometry(.42,.42,1.7,18),plastic(0x5B9BD5));
      t.rotation.x=Math.PI/2;tankG.add(t);
      for(const s of [1,-1]){const c=mm(new THREE.CylinderGeometry(.43,.43,.06,18),steel(0x9aa2ad));
        c.rotation.x=Math.PI/2;c.position.z=s*.86;tankG.add(c);}
      place(tankG,V(-3.0,1.0,0),V(-4.0,1.7,0));
    }
    defPart('tank',{name:'水箱',
      text:'车上带着一箱水，一路喷一路扫。',
      more:'不喷水直接扫的话，灰尘会被扬得到处都是。先把地面打湿，灰就乖乖趴着被扫走了。'},[tankG]);

    /* 转刷 */
    const brushG=new THREE.Group();const brushes=[];
    for(const s of [1,-1]){
      const b=new THREE.Group();
      const hub=mm(new THREE.CylinderGeometry(.14,.14,.12,14),dark(0x3a4150));b.add(hub);
      for(let i=0;i<14;i++){
        const a=i*Math.PI*2/14;
        const br=roundedBox(.06,.3,.06,.02,matte(0xE8B84A));
        br.position.set(Math.cos(a)*.34,-.14,Math.sin(a)*.34);
        br.rotation.z=Math.cos(a)*.35;br.rotation.x=-Math.sin(a)*.35;b.add(br);
      }
      b.position.set(1.1,.38,s*1.25);brushG.add(b);brushes.push({b,s});
      const arm=roundedBox(.7,.1,.1,.03,steel(0x8a929e));
      arm.position.set(1.0,.6,s*.95);brushG.add(arm);
    }
    root.add(brushG);
    defPart('brush',{name:'转刷',outside:true,
      text:'两把大圆刷子转呀转，把垃圾拨到车底中间。',
      more:'两把刷子转的方向是相反的，一左一右往中间拨。垃圾被拨到车肚子底下，正好被吸口吸走。',
      action(){S.brushUntil=now()+3200;}},[brushG]);

    /* 吸口 */
    const sucG=new THREE.Group();
    {
      const mouth=roundedBox(.5,.3,1.3,.05,dark(0x3a4150));sucG.add(mouth);
      const tube=mm(new THREE.CylinderGeometry(.18,.18,1.5,14),dark(0x4a5160));
      tube.position.set(-.6,.75,0);tube.rotation.z=-.55;sucG.add(tube);
      sucG.position.set(.1,.22,0);root.add(sucG);
    }
    defPart('suction',{name:'吸口',outside:true,
      text:'车肚子底下有个大嘴巴，把垃圾一口吸进去。',
      more:'吸口后面接着一台大风机，像超大号吸尘器。垃圾顺着粗管子被吸到上面的箱子里。'},[sucG]);

    /* 喷水 */
    const sprayG=new THREE.Group();
    {
      const bar=roundedBox(.12,.1,2.0,.03,steel(0x9aa2ad));bar.position.set(2.6,.45,0);sprayG.add(bar);
      for(let i=0;i<5;i++){
        const n=mm(new THREE.ConeGeometry(.05,.1,8),dark(0x6b7280));
        n.rotation.z=Math.PI;n.position.set(2.6,.36,-.8+i*.4);sprayG.add(n);
      }
      root.add(sprayG);
    }
    const drops=[];
    for(let i=0;i<16;i++){
      const d=mm(new THREE.SphereGeometry(.045,6,5),matte(0x9FD4F0));
      d.castShadow=false;d.userData.u=i/16;d.userData.noHit=true;root.add(d);drops.push(d);
    }
    defPart('spray',{name:'喷水杆',outside:true,
      text:'前面一排小喷嘴，把地面喷湿。',
      more:'喷嘴喷出来的是扇形的水雾，五个连起来正好盖住一个车道的宽度。',
      action(){S.sprayUntil=now()+3200;}},[sprayG]);

    const eng=RIG.engine(ctx,{scale:.85});
    place(eng.group,V(2.2,.85,0),V(3.2,1.7,0));
    defPart('engine',{name:'发动机',
      text:'发动机既让车走，也带着风机和刷子转。',
      more:'洒水车上有两套动力：一套推车前进，一套专门带风机、水泵和刷子。所以它开得慢，声音却很大。',
      action(){S.engUntil=now()+3200;}},[eng.group]);

    const sb=RIG.startBtn(ctx,2.2,2.35,.9);root.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，洒水车就开始扫啦！',
      more:'天还没亮它就出门了，等大家起床的时候马路已经干干净净。'},[sb.group]);

    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.brushUntil)S.brushT=1;
      if(t<S.sprayUntil)S.sprayT=1;
      if(!drv&&t>S.brushUntil&&t>S.sprayUntil)R.idle(dt,1.4);
      R.ease(dt,3);
      const engOn=(drv&&S.engineOn)||t<S.engUntil;
      S.eng+=((engOn?1:0)-S.eng)*Math.min(1,dt*3);

      const moved=S.drive-(update._p||0);update._p=S.drive;
      root.position.x=S.drive;tk.advance(moved);

      for(const {b,s} of brushes)b.rotation.y+=dt*S.brush*7*s;
      brushG.position.set(0,1.2*ee,1.4*ee);
      sucG.position.set(.1,.22+1.0*ee,-1.4*ee);
      sprayG.position.set(1.2*ee,.6*ee,0);

      const spraying=S.spray>.3&&ee<.2;
      for(const d of drops){
        const u=((d.userData.u+t/380)%1);
        d.position.set(2.6-u*.5,.34-u*.3,(d.userData.u-.5)*1.8);
        d.visible=spraying;d.scale.setScalar(spraying?(1-u*.6):0);
      }
      eng.spin(dt,S.eng);
      sb.pulse(drv,t);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机转起来，风机和刷子都有劲了。',part:'engine',inner:true,
        on(){S.engineOn=true;api.sfx.loop('water');R.start(RUN,2);}},
      {t:'前面先喷水，把灰压住。',part:'spray'},
      {t:'两把大刷子往中间拨，垃圾都归拢过来。',part:'brush'},
      {t:'车底的大嘴巴一口吸走，路就干净了！',part:'suction'},
    ];

    ctx.linearize();
    return {update,chain,camX(){return S.drive*.85*(1-api.ee);},
      onStop(){R.stop();S.engineOn=false;for(const k of KEYS)S[k+'T']=0;},
      onStart(){S.front=-14;},onDone(){S.engineOn=false;}};
  }
},RIG.SKY.street);
})();

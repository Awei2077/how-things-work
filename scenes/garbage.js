/* 场景：垃圾车。+x 车头，车尾有举桶的机械臂和压缩板。 */
window.SCENES=window.SCENES||{};
(function(){
const S={arm:0,armT:0,dump:0,dumpT:0,press:0,pressT:0,full:0,fullT:0,lid:0,lidT:0,eng:0,
  engineOn:false,engUntil:0,armUntil:0,pressUntil:0,lidUntil:0};
let api=null;const now=()=>api.now();window.__GB=S;
const KEYS=['arm','dump','press','full','lid'];
const ROUND=[
  {d:600 ,to:{lid:1}},
  {d:1300,to:{arm:1}},
  {d:900 ,to:{dump:1}},
  {d:700 ,to:{full:.5}},
  {d:800 ,to:{dump:0}},
  {d:1100,to:{arm:0}},
  {d:600 ,to:{lid:0}},
  {d:1500,to:{press:1,full:1}},
  {d:900 ,to:{press:0}},
];
let R=null;

SCENES.garbage=Object.assign({
  id:'garbage',title:'垃圾车',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:10.5,h:5.6,ty:1.6,tyEx:2.6,rEx:1.28,cx:-.6},cameraStart:{theta:-.95,phi:1.2},
  order:['arm','bin','lid','hopper','press','body','wheels','cab','engine','chassis','start'],
  go:{on:'开始收',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再收一桶！',
    done:'收好啦！垃圾被压得紧紧的。',doneHintXray:'看，压缩板把垃圾一次次推到里面。点「停下」再收一次。',
    doneHint:'点「看里面」，看看垃圾进去以后怎么被压小的。'},
  intro:{icon:'arm',name:'垃圾车',text:'点一点垃圾车的零件，听听它叫什么。按「开始收」看它怎么把垃圾桶举起来倒空。'},
  poster:{title:'垃圾车能装下多少垃圾',sub:'因为它会一边收一边压',
    summary:'举起桶 → 倒进料斗 → 压缩板推进去压实，能装下五倍的垃圾！',angle:{theta:-.95,phi:1.15},
    keys:['arm','lid','hopper','press','body']},

  env(ctx,_api){
    api=_api;
    const s=RIG.site(ctx,{kind:'road',seed:1212,fence:false,cones:[[6.4,3.2],[7.8,-2.6]]});
    return {occluders:s.occluders,update(){}};
  },

  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,steel,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const GRN=0x3F8E5C;
    R=RIG.seqRunner(S,KEYS);

    const tk=RIG.truck(ctx,{color:GRN,cabX:2.5,wheelR:.5,halfZ:.92,
      frameFrom:-3.4,frameTo:3.2,axles:[{x:2.2},{x:-1.7,dual:true}]});
    place(tk.group,V(0,0,0),V(0,0,0));
    defPart('chassis',{name:'底盘',outside:true,
      text:'底下的大梁和轮子，扛着整个车厢。',
      more:'垃圾车装满能有十几吨，大梁要够粗。底盘和普通卡车一样，上面换个箱子就是另一种车。'},[tk.group]);
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机开着车，一条街一条街地收。',
      more:'垃圾车走走停停，司机和后面的工人配合：车一停，工人就把桶推过来挂上机械臂。'},[tk.cab]);
    const wheelsG=new THREE.Group();for(const w of tk.wheels)wheelsG.add(w.group);
    defPart('wheels',{name:'轮子',outside:true,hopTargets:tk.wheels.map(w=>w.group),
      text:'轮子不大，但在小巷子里转得开。',
      more:'垃圾车要开进窄窄的小区路，所以轴距做得短，转弯半径小。'},[wheelsG]);

    /* 车厢 */
    const bodyG=new THREE.Group();
    {
      const box=roundedBox(3.5,2.0,2.1,.1,plastic(GRN));box.position.set(-.75,1.9,0);bodyG.add(box);
      for(let i=0;i<4;i++){
        const rib=roundedBox(.1,2.0,2.16,.03,plastic(0x357A4E));
        rib.position.set(-2.05+i*.9,1.9,0);bodyG.add(rib);
      }
      const top=roundedBox(3.5,.12,2.0,.04,steel(0x9aa2ad));top.position.set(-.75,2.95,0);bodyG.add(top);
      markShell(bodyG);place(bodyG,V(0,0,0),V(0,2.4,0));
    }
    defPart('body',{name:'车厢',outside:true,
      text:'密封的大箱子，垃圾水漏不出来。',
      more:'车厢是完全密封的，底下还有个小水箱接垃圾渗出来的水，不会一路滴到马路上。'},[bodyG]);

    /* 车尾的料斗：一个敞口的槽，比车厢矮一截，顶上盖着尾门 */
    const hopG=new THREE.Group();
    {
      const back=roundedBox(.14,1.2,2.1,.05,plastic(0x357A4E));back.position.set(-3.55,1.4,0);hopG.add(back);
      for(const s of [1,-1]){
        const side=roundedBox(1.1,1.2,.12,.04,plastic(0x357A4E));side.position.set(-3.05,1.4,s*1.0);hopG.add(side);
      }
      const floor=roundedBox(1.1,.12,2.1,.04,steel(0x8a929e));floor.position.set(-3.05,.82,0);hopG.add(floor);
      const lip=roundedBox(.2,.08,2.16,.03,steel(0x6b7280));lip.position.set(-3.55,2.02,0);hopG.add(lip);
      root.add(hopG);
    }
    defPart('hopper',{name:'料斗',outside:true,
      text:'垃圾先倒进车尾这个大斗里。',
      more:'料斗是敞口的，垃圾倒进来先堆在这儿，然后被压缩板一次次推进车厢深处。'},[hopG]);

    /* 尾门：盖在料斗上，举桶之前先掀开。铰链在靠车厢那一边，挂在 hopG 下面，拆开时跟着料斗走 */
    const lidPivot=new THREE.Group();lidPivot.position.set(-2.5,2.08,0);hopG.add(lidPivot);
    const lidG=new THREE.Group();lidPivot.add(lidG);
    {
      const plate=roundedBox(1.15,.1,2.16,.04,plastic(GRN));plate.position.set(-.575,0,0);lidG.add(plate);
      for(const s of [1,-1]){
        const hinge=mm(new THREE.CylinderGeometry(.06,.06,.25,10),steel(0x6b7280));
        hinge.rotation.x=Math.PI/2;hinge.position.set(0,0,s*1.0);lidG.add(hinge);
      }
      const handle=roundedBox(.12,.06,.6,.02,steel(0x9aa2ad));handle.position.set(-1.0,.08,0);lidG.add(handle);
    }
    defPart('lid',{name:'尾门',outside:true,
      text:'举桶之前尾门先掀开，垃圾才倒得进去。',
      more:'尾门平时关得紧紧的，臭味和垃圾水都跑不出来。收垃圾时先掀开，桶翻过来倒进料斗，倒完马上关上。',
      action(){S.lidUntil=now()+3200;}},[lidG]);

    /* 压缩板 */
    const pressG=new THREE.Group();
    {
      const plate=roundedBox(.18,1.1,1.9,.05,steel(0xB8BEC6));pressG.add(plate);
      for(const s of [1,-1]){
        const rail=roundedBox(.12,.12,.12,.03,steel(0x6b7280));rail.position.set(.2,.45,s*.85);pressG.add(rail);
      }
      pressG.position.set(-3.35,1.45,0);root.add(pressG);
    }
    defPart('press',{name:'压缩板',outside:true,
      text:'一块大铁板把垃圾往里推，压得扁扁的。',
      more:'压缩板每收一桶就来回推一次。垃圾被压到只剩原来的五分之一，所以一车能装下一整条街的量。',
      action(){S.pressUntil=now()+3200;}},[pressG]);

    /* 机械臂 + 垃圾桶 */
    const armPivot=new THREE.Group();armPivot.position.set(-3.55,1.05,0);root.add(armPivot);
    const armG=new THREE.Group();armPivot.add(armG);
    for(const s of [1,-1]){
      const a=roundedBox(1.2,.16,.16,.04,steel(0x8a929e));a.position.set(-.6,0,s*.62);armG.add(a);
    }
    {
      const bar=roundedBox(.16,.16,1.4,.04,steel(0x8a929e));bar.position.set(-1.2,0,0);armG.add(bar);
    }
    defPart('arm',{name:'机械臂',outside:true,
      text:'两只钢胳膊夹住桶，一下就举到头顶。',
      more:'桶边上有一道横梁，机械臂的钩子一挂就锁住。举到最高点再往前一翻，垃圾就全倒进去了。',
      action(){S.armUntil=now()+3200;}},[armG]);

    const binPivot=new THREE.Group();binPivot.position.set(-1.2,0,0);armG.add(binPivot);
    const binG=new THREE.Group();binPivot.add(binG);
    {
      const b=roundedBox(.7,.9,.8,.06,plastic(0x2F6B45));b.position.y=-.45;binG.add(b);
      const lid=roundedBox(.74,.09,.84,.03,plastic(0x245436));lid.position.y=.02;binG.add(lid);
      const rail=roundedBox(.1,.09,.86,.02,dark(0x1F4A30));rail.position.set(.36,-.12,0);binG.add(rail);
      for(const s of [1,-1]){
        const w=mm(new THREE.CylinderGeometry(.1,.1,.06,10),dark(0x245436));
        w.rotation.x=Math.PI/2;w.position.set(-.28,-.88,s*.3);binG.add(w);
      }
    }
    defPart('bin',{name:'垃圾桶',outside:true,
      text:'绿色的大桶，推过来挂上就行。',
      more:'桶口那道横梁是专门给机械臂挂的，全世界的垃圾桶都做成一样的尺寸，哪台车都能收。'},[binG]);

    /* 垃圾 */
    const trash=new THREE.Group();
    for(let i=0;i<10;i++){
      const c=[0xC9A227,0x8A857D,0xB05A4A,0x4A6E8A][i%4];
      const g=mm(new THREE.BoxGeometry(.18+Math.random()*.1,.16,.16),matte(c));
      g.rotation.set(Math.random(),Math.random(),Math.random());
      trash.add(g);
    }
    trash.userData.noHit=true;root.add(trash);

    const eng=RIG.engine(ctx,{scale:.9});
    // 发动机在驾驶室地板下面，看里面才看得见
    place(eng.group,V(2.5,.45,0),V(3.4,1.8,0));
    defPart('engine',{name:'发动机',
      text:'发动机带着油泵，机械臂和压缩板都靠它。',
      more:'收垃圾时车虽然停着，发动机还在转——因为举桶和压缩全靠液压油，油泵得一直有力气。',
      action(){S.engUntil=now()+3200;}},[eng.group]);

    // 启动按钮在驾驶室的仪表台上
    const sb=RIG.startBtn(ctx,tk.btnAt.x,tk.btnAt.y,tk.btnAt.z,.6);tk.cab.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，垃圾车就开始收啦！',
      more:'每天天没亮垃圾车就出门了，一条街一条街地收。'},[sb.group]);

    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.armUntil){S.armT=.5+.5*Math.sin(t/700);S.dumpT=S.armT>.7?1:0;S.lidT=1;}
      if(t<S.lidUntil)S.lidT=.5+.5*Math.sin(t/700);
      if(t<S.pressUntil)S.pressT=.5+.5*Math.sin(t/600);
      if(!drv&&t>S.armUntil&&t>S.pressUntil&&t>S.lidUntil){R.idle(dt,1.3);S.fullT=0;}
      R.ease(dt,3.2);
      const engOn=(drv&&S.engineOn)||t<S.engUntil;
      S.eng+=((engOn?1:0)-S.eng)*Math.min(1,dt*3);

      armPivot.rotation.z=-2.0*S.arm;
      armPivot.position.set(-3.55,1.05+1.6*ee,0);
      binPivot.rotation.z=-1.5*S.dump;
      pressG.position.set(-3.35+.85*S.press-1.4*ee,1.45+1.9*ee,0);
      // 尾门绕靠车厢那边的铰链掀起来：板子在铰链的 -x 侧，转负角度尾端才往上抬
      lidPivot.rotation.z=-1.75*S.lid;
      hopG.position.set(-1.1*ee,0,0);

      // 倒出来的垃圾：桶里 → 料斗里
      const pouring=S.dump>.4;
      trash.visible=ee<.25;
      trash.children.forEach((g,i)=>{
        const u=i/10;
        if(S.full>.45||pouring){
          g.position.set(-3.05+(u-.5)*.6+.95*S.press,.95+u*.35*(1-S.press*.5),(u-.5)*1.4);
          g.scale.setScalar(1-S.press*.45);
        }else{
          binPivot.getWorldPosition(_w);
          g.position.set(_w.x-.05+(u-.5)*.4,_w.y-.45+(u-.5)*.3,(u-.5)*.5);
          g.scale.setScalar(.9);
        }
      });
      eng.spin(dt,S.eng);
      sb.pulse(drv,t);
    }
    const _w=new THREE.Vector3();

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机转起来，油泵有劲了。',part:'engine',inner:true,
        on(){S.engineOn=true;api.sfx.loop('engine');R.start(ROUND,3);}},
      {t:'把垃圾桶挂到机械臂上。',part:'bin'},
      {t:'尾门掀开，露出料斗。',part:'lid'},
      {t:'钢胳膊一举，桶翻过来，垃圾倒进料斗。',part:'arm'},
      {t:'压缩板把垃圾往里一推，压得扁扁的。',part:'press'},
    ];

    ctx.linearize();
    return {update,chain,
      onStop(){R.stop();S.engineOn=false;for(const k of KEYS)S[k+'T']=0;},
      onStart(){},onDone(){S.engineOn=false;}};
  }
},RIG.SKY.street);
})();

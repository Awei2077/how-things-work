/* 场景：清障车（拖车）。后面一副托臂把坏掉的车抬起来拖走。 */
window.SCENES=window.SCENES||{};
(function(){
const S={boom:0,boomT:0,lift:0,liftT:0,drive:0,driveT:0,hooked:0,hookedT:0,eng:0,
  engineOn:false,engUntil:0,boomUntil:0,liftUntil:0};
let api=null;const now=()=>api.now();window.__TW=S;
const KEYS=['boom','lift','drive','hooked'];
const JOB=[
  {d:1200,to:{boom:1}},
  {d:500 ,to:{hooked:1}},
  {d:1400,to:{lift:1}},
  {d:600 ,to:{boom:.35}},
  {d:2200,to:{drive:3.2}},
  {d:1200,to:{drive:0}},
  {d:900 ,to:{lift:0,boom:0}},
  {d:300 ,to:{hooked:0}},
];
let R=null;

SCENES.towtruck=Object.assign({
  id:'towtruck',title:'清障车',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:13,h:5.6,ty:1.5,tyEx:2.6,rEx:1.3,cx:-1.2},cameraStart:{theta:.95,phi:1.2},
  order:['boom','cradle','winch','light','wheels','cab','deck','engine','body','start'],
  go:{on:'开始拖',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再拖一次！',
    done:'拖走啦！坏车被稳稳吊着送去修。',doneHintXray:'看，卷扬机在收钢丝绳。点「停下」再拖一次。',
    doneHint:'点「看里面」，看看托臂是怎么把车抬起来的。'},
  intro:{icon:'boom',name:'清障车',text:'点一点清障车的零件，听听它叫什么。按「开始拖」看它怎么把坏车拖走。'},
  poster:{title:'车坏在路上了怎么办',sub:'清障车来了，把它抬起来拖走',
    summary:'托臂伸出去 → 托住前轮 → 抬起来 → 拖着走，另外两个轮子自己滚！',angle:{theta:.95,phi:1.15},
    keys:['boom','cradle','winch','light']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,roundedBox,plastic,matte,glassMat,mm}=ctx;
    const s=RIG.site(ctx,{kind:'road',seed:8383,fence:false,cones:[[-1.5,2.4],[-2.8,2.6]]});
    // 抛锚的小车
    const car=new THREE.Group();
    const b=roundedBox(3.2,.8,1.6,.16,plastic(0x9AA0A8));b.position.y=.85;car.add(b);
    const top=roundedBox(1.7,.7,1.5,.14,plastic(0x9AA0A8));top.position.set(-.3,1.55,0);car.add(top);
    for(const sz of [1,-1]){
      const w=mm(new THREE.BoxGeometry(1.5,.5,.04),glassMat());
      w.position.set(-.3,1.6,sz*.74);w.userData.glass=true;w.castShadow=false;car.add(w);
    }
    const wheels=[];
    for(const x of [1.05,-1.05])for(const sz of [1,-1]){
      const w=mm(new THREE.CylinderGeometry(.34,.34,.24,16),matte(0x22262b));
      w.rotation.x=Math.PI/2;w.position.set(x,.34,sz*.78);car.add(w);wheels.push(w);
    }
    car.traverse(o=>{if(o.isMesh)o.castShadow=true;});
    scene.add(car);
    return {occluders:s.occluders,update(){
      const front=-5.6+S.drive;
      car.position.set(front,S.lift*.42,0);
      car.rotation.z=S.lift*.16;
    }};
  },

  build(ctx,_api){
    api=_api;
    const {THREE,V,mm,roundedBox,steel,chrome,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const ORG=0xE8892E;
    R=RIG.seqRunner(S,KEYS);

    const tk=RIG.truck(ctx,{color:ORG,cabX:2.3,wheelR:.5,halfZ:.92,
      frameFrom:-3.4,frameTo:3.1,axles:[{x:2.0},{x:-1.8,dual:true}]});
    place(tk.group,V(0,0,0),V(0,0,0));
    defPart('body',{name:'车身',outside:true,
      text:'橙色的车身，后面装着托臂。',
      more:'清障车其实就是一辆卡车，后半截换成了一套液压托举装置。'},[tk.group]);
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机开过来，下车操作后面的托臂。',
      more:'清障车常在高速上作业，司机下车前一定要先摆好警示牌，穿上反光衣。'},[tk.cab]);
    const wheelsG=new THREE.Group();for(const w of tk.wheels)wheelsG.add(w.group);
    defPart('wheels',{name:'轮子',outside:true,hopTargets:tk.wheels.map(w=>w.group),
      text:'后面双排轮子，拖着一整辆车也稳。',
      more:'拖着车走的时候，被拖车的重量有一大半压在清障车后桥上，所以后轮要双排。'},[wheelsG]);

    /* 车厢平台：托臂和卷扬机都装在它上面 */
    const deckG=new THREE.Group();
    {
      const deck=roundedBox(3.4,.75,2.0,.08,plastic(ORG));deck.position.set(-1.3,1.12,0);deckG.add(deck);
      const plate=roundedBox(3.4,.08,1.9,.03,steel(0x9aa2ad));deck.position.y=1.12;
      plate.position.set(-1.3,1.53,0);deckG.add(plate);
      for(const sz of [1,-1]){
        const rail=roundedBox(3.3,.09,.09,.03,steel(0x8a929e));
        rail.position.set(-1.3,1.72,sz*.9);deckG.add(rail);
      }
      const tool=roundedBox(.9,.5,.16,.04,steel(0xB8BEC6));tool.position.set(-.5,1.15,1.03);deckG.add(tool);
      markShell(deckG);place(deckG,V(0,0,0),V(0,2.2,0));
    }
    defPart('deck',{name:'平台',outside:true,
      text:'驾驶室后面的平台，托臂和卷扬机都装在上面。',
      more:'平台上还放着三角警示牌、地锚和几条拖车带，路边作业要用的东西都在这儿。'},[deckG]);

    /* 托臂 */
    const boomPivot=new THREE.Group();boomPivot.position.set(-2.5,1.62,0);root.add(boomPivot);
    const boomG=new THREE.Group();boomPivot.add(boomG);
    {
      const b1=roundedBox(1.8,.34,.5,.06,plastic(ORG));b1.position.set(-.9,0,0);boomG.add(b1);
      const b2=roundedBox(1.5,.24,.36,.05,steel(0x9aa2ad));b2.position.set(-2.2,0,0);boomG.add(b2);
      boomG.userData.ext=b2;
    }
    defPart('boom',{name:'托臂',outside:true,
      text:'从车尾伸出去的大胳膊，能伸能缩。',
      more:'托臂里面套着一节，用油缸顶出去。伸得越长够得越远，但能吊的重量就越小。',
      action(){S.boomUntil=now()+3200;}},[boomG]);

    /* 托叉 */
    const cradleG=new THREE.Group();
    {
      const bar=roundedBox(.2,.2,2.0,.04,steel(0x8a929e));cradleG.add(bar);
      for(const sz of [1,-1]){
        const arm=roundedBox(.9,.14,.16,.03,steel(0x9aa2ad));
        arm.position.set(-.45,0,sz*.85);cradleG.add(arm);
        const pad=roundedBox(.22,.3,.18,.04,dark(0x3a4150));
        pad.position.set(-.85,.1,sz*.85);cradleG.add(pad);
      }
      boomG.add(cradleG);cradleG.position.set(-2.9,-.15,0);
    }
    defPart('cradle',{name:'托叉',outside:true,
      text:'两根叉子伸到轮胎底下，把车整个托起来。',
      more:'托叉不碰车身，只托着两个轮胎，所以不会把车刮花。抬起前轮，后轮自己在地上滚着走。',
      action(){S.liftUntil=now()+3200;}},[cradleG]);

    /* 卷扬机 */
    const winchG=new THREE.Group();
    {
      const dr=mm(new THREE.CylinderGeometry(.22,.22,.55,16),steel(0x6b7280));
      dr.rotation.x=Math.PI/2;winchG.add(dr);
      for(const s of [1,-1]){const fl=mm(new THREE.CylinderGeometry(.29,.29,.05,16),steel(0x9aa2ad));
        fl.rotation.x=Math.PI/2;fl.position.z=s*.29;winchG.add(fl);}
      const hk=mm(new THREE.TorusGeometry(.1,.03,8,14,Math.PI*1.5),chrome());
      hk.position.set(-.5,-.2,0);winchG.add(hk);
      place(winchG,V(-1.5,1.85,0),V(-1.8,2.6,1.8));
    }
    defPart('winch',{name:'卷扬机',
      text:'钢丝绳把开不动的车拉上来。',
      more:'如果车陷在沟里，就先用卷扬机的钢丝绳把它拉到路面上，再用托叉抬起来。',
      action(){S.liftUntil=now()+3200;}},[winchG]);

    /* 警灯 */
    const lightG=new THREE.Group();
    {
      const bar=roundedBox(1.2,.13,.32,.05,dark(0x2F3A4A));lightG.add(bar);
      for(let i=0;i<4;i++){
        const l=mm(new THREE.BoxGeometry(.26,.11,.28),
          new THREE.MeshStandardMaterial({color:0xF2A03C,emissive:0xF2A03C,emissiveIntensity:.8,roughness:.4}));
        l.userData.keepEm=true;l.position.set(-.42+i*.28,0,0);lightG.add(l);
      }
      lightG.position.set(2.3,2.32,0);root.add(lightG);
    }
    defPart('light',{name:'警灯',outside:true,
      text:'黄色的灯一闪一闪，提醒后面的车绕开。',
      more:'清障车在路边作业时最危险的就是后面来车。黄灯闪起来，加上后面摆的三角牌，才安全。'},[lightG]);

    const eng=RIG.engine(ctx,{scale:.9});
    place(eng.group,V(2.3,.9,0),V(3.3,1.8,0));
    defPart('engine',{name:'发动机',
      text:'发动机带着油泵，托臂才举得起来。',
      more:'抬起一辆车要好几吨的力气，全靠液压。发动机一停，托臂就一动不动了。',
      action(){S.engUntil=now()+3200;}},[eng.group]);

    const sb=RIG.startBtn(ctx,2.3,2.6,.9);root.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，清障车就开始干活啦！',
      more:'车坏在路上别慌，站到护栏外面等清障车来。'},[sb.group]);

    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.boomUntil)S.boomT=.5+.5*Math.sin(t/700);
      if(t<S.liftUntil)S.liftT=.5+.5*Math.sin(t/650);
      if(!drv&&t>S.boomUntil&&t>S.liftUntil)R.idle(dt,1.3);
      R.ease(dt,3);
      const engOn=(drv&&S.engineOn)||t<S.engUntil;
      S.eng+=((engOn?1:0)-S.eng)*Math.min(1,dt*3);

      const moved=S.drive-(update._p||0);update._p=S.drive;
      root.position.x=S.drive;tk.advance(moved);

      boomPivot.rotation.z=.10*S.lift;
      boomPivot.position.set(-2.5-1.6*ee,1.62+1.4*ee,0);
      boomG.userData.ext.position.x=-2.2-.9*S.boom;
      cradleG.position.set(-2.9-.9*S.boom,-.15-.35*(1-S.lift),0);
      lightG.position.set(2.3,2.32+1.4*ee,0);
      const bl=Math.sin(t/140)>0;
      lightG.children.forEach((l,i)=>{if(i)l.material.emissiveIntensity=((i%2===0)===bl)?1.5:.2;});
      eng.spin(dt,S.eng);
      sb.pulse(drv,t);
    }

    const chain=[
      {t:'按一下，黄灯闪起来。',part:'start',on(){}},
      {t:'发动机转起来，油泵有劲了。',part:'engine',inner:true,
        on(){S.engineOn=true;api.sfx.loop('engine');R.start(JOB,2);}},
      {t:'托臂从车尾伸出去，够到坏车前面。',part:'boom'},
      {t:'两根托叉伸到轮胎底下托住。',part:'cradle'},
      {t:'抬起来，拖着走——后轮自己滚。',part:'cradle'},
    ];

    return {update,chain,
      onStop(){R.stop();S.engineOn=false;for(const k of KEYS)S[k+'T']=0;},
      onStart(){},onDone(){S.engineOn=false;}};
  }
},RIG.SKY.street);
})();

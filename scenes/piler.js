/* 场景：打桩机。履带底盘 + 竖着的高塔 + 会往下砸的锤子。 */
window.SCENES=window.SCENES||{};
(function(){
const S={hammer:0,hammerT:0,pile:0,pileT:0,eng:0,hits:0,
  engineOn:false,engUntil:0,hamUntil:0};
let api=null;const now=()=>api.now();window.__PL=S;
const KEYS=['hammer','pile'];
const DRIVE=[
  {d:700 ,to:{hammer:1}},
  {d:260 ,to:{hammer:0}},
  {d:120 ,to:{pile:.2}},
  {d:700 ,to:{hammer:1}},
  {d:260 ,to:{hammer:0}},
  {d:120 ,to:{pile:.45}},
  {d:700 ,to:{hammer:1}},
  {d:260 ,to:{hammer:0}},
  {d:120 ,to:{pile:.7}},
  {d:700 ,to:{hammer:1}},
  {d:260 ,to:{hammer:0}},
  {d:120 ,to:{pile:.92}},
];
let R=null;

SCENES.piler=Object.assign({
  id:'piler',title:'打桩机',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:11,h:12,ty:4.2,tyEx:5.0,rEx:1.25,cx:.4},cameraStart:{theta:.95,phi:1.1},
  order:['hammer','pile','mast','winch','tracks','cab','body','engine','start'],
  go:{on:'开始打',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再打一根！',
    done:'打好啦！桩牢牢扎进地里。',doneHintXray:'看，锤子被提起来又松开，靠自己的重量砸下去。点「停下」再打一根。',
    doneHint:'点「看里面」，看看锤子是怎么被提上去的。'},
  intro:{icon:'hammer',name:'打桩机',text:'点一点打桩机的零件，听听它叫什么。按「开始打」看它怎么把桩砸进地里。'},
  poster:{title:'盖楼之前为什么要先打桩',sub:'松土撑不住楼，得把柱子扎到硬土层',
    summary:'大锤子提起来再砸下去，一下一下把桩打到地下十几米深！',angle:{theta:.95,phi:1.1},
    keys:['hammer','pile','mast','winch']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,mm,roundedBox,matte,flat}=ctx;
    const s=RIG.site(ctx,{kind:'dirt',seed:2323,fenceZ:10});
    const done=new THREE.Group();
    for(let i=0;i<4;i++){
      const p=mm(new THREE.CylinderGeometry(.22,.22,.5,12),matte(0xB0AAA0));
      p.position.set(-3.5-i*1.4,.2,2.6);done.add(p);
    }
    scene.add(done);
    const dust=[];
    for(let i=0;i<10;i++){
      const d=mm(new THREE.SphereGeometry(.16,7,6),flat(0xC9BFA8));
      d.castShadow=false;d.userData.u=i/10;scene.add(d);dust.push(d);
    }
    return {occluders:s.occluders,update(){
      const t=api.now(),hitting=S.hammer<.25&&S.pile>.05;
      for(const d of dust){
        const u=((d.userData.u+t/500)%1);
        const a=u*Math.PI*2;
        d.position.set(1.2+Math.cos(a)*(.4+u*.8),.15+u*.5,Math.sin(a)*(.4+u*.8));
        d.scale.setScalar(hitting?(1-u)*.9:0);
        d.visible=hitting;
      }
    }};
  },

  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,steel,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const YEL=0xF2B233;
    R=RIG.seqRunner(S,KEYS);

    const crawler=RIG.crawler(ctx,{len:3.4,r:.46,halfZ:1.2,width:.8,cleats:24,rollers:5});
    place(crawler.group,V(-.6,.06,0),V(0,0,-3.0));
    defPart('tracks',{name:'履带',outside:true,
      text:'履带底盘，打完一根挪一挪再打下一根。',
      more:'打桩机很高很重，只能用履带。工地上的桩一排排打过去，每打完一根就慢慢挪一点。'},[crawler.group]);

    const bodyG=new THREE.Group();
    {
      const house=roundedBox(2.4,1.3,2.2,.1,plastic(YEL));house.position.set(-1.4,1.55,0);bodyG.add(house);
      const cw=roundedBox(.6,1.0,1.9,.08,dark(0x3a4150));cw.position.set(-2.7,1.5,0);bodyG.add(cw);
      markShell(bodyG);place(bodyG,V(0,0,0),V(-1.4,2.4,0));
    }
    defPart('body',{name:'机身',outside:true,
      text:'黄色的身体，后面压着配重。',
      more:'机身里装着发动机和卷扬机。屁股上那块铁是配重，前面的塔架和锤子那么重，没有它整台车会往前栽。'},[bodyG]);
    const cabRig=RIG.cab(ctx,{w:1.1,h:1.3,d:1.2,color:0x3a4150});
    markShell(cabRig.group);place(cabRig.group,V(-.55,1.0,1.1),V(-1.0,2.6,1.8));
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机坐在旁边，抬头盯着桩打歪没有。',
      more:'桩必须打得笔直。司机要一直看着桩和塔架是不是在一条线上，歪了就得马上停。'},[cabRig.group]);

    /* 塔架 */
    const mastG=new THREE.Group();
    {
      for(const sz of [1,-1]){
        const c=roundedBox(.16,9.0,.16,.03,plastic(YEL));c.position.set(0,4.5,sz*.38);mastG.add(c);
      }
      for(let i=0;i<12;i++){
        const r=roundedBox(.1,.1,.86,.02,plastic(YEL));r.position.set(0,.5+i*.75,0);mastG.add(r);
        const d=roundedBox(.07,.07,.95,.02,plastic(YEL));
        d.position.set(0,.87+i*.75,0);d.rotation.x=(i%2?1:-1)*.72;mastG.add(d);
      }
      const top=roundedBox(.45,.3,1.0,.05,steel(0x8a929e));top.position.set(0,9.1,0);mastG.add(top);
      mastG.position.set(1.2,.1,0);root.add(mastG);
    }
    defPart('mast',{name:'塔架',outside:true,
      text:'高高的钢架，锤子顺着它上下滑。',
      more:'塔架上有两条滑轨，锤子就卡在轨道里。这样锤子只能上下动，不会左右晃，每一下都砸在桩正中间。'},[mastG]);

    /* 卷扬机 */
    const winchG=new THREE.Group();
    {
      const dr=mm(new THREE.CylinderGeometry(.28,.28,.6,18),steel(0x6b7280));
      dr.rotation.x=Math.PI/2;winchG.add(dr);
      for(const s of [1,-1]){
        const fl=mm(new THREE.CylinderGeometry(.36,.36,.05,18),steel(0x9aa2ad));
        fl.rotation.x=Math.PI/2;fl.position.z=s*.31;winchG.add(fl);
      }
      place(winchG,V(-.9,2.4,0),V(-2.2,3.0,1.6));
    }
    defPart('winch',{name:'卷扬机',
      text:'钢丝绳把锤子一次次提上去。',
      more:'卷扬机把锤子提到最高，然后一松手——锤子靠自己的重量自由落下，砸在桩顶上。提得越高，砸得越狠。',
      action(){S.hamUntil=now()+3200;}},[winchG]);

    const rope=mm(new THREE.CylinderGeometry(.025,.025,1,8),dark(0x555b66));
    rope.userData.noHit=true;root.add(rope);

    /* 锤子 */
    const hamG=new THREE.Group();
    {
      const body=roundedBox(.6,1.4,.66,.06,dark(0x3a4150));hamG.add(body);
      const face=roundedBox(.66,.2,.72,.04,steel(0x6b7280));face.position.y=-.78;hamG.add(face);
      for(const sz of [1,-1]){
        const sh=roundedBox(.12,1.3,.1,.02,steel(0x8a929e));sh.position.set(0,0,sz*.4);hamG.add(sh);
      }
      root.add(hamG);
    }
    defPart('hammer',{name:'锤子',outside:true,
      text:'又大又重的铁锤，砸下去砰的一声！',
      more:'这个锤子有好几吨重。它不用力气砸，只是被提高再松开——高处落下来的重物冲击力大得惊人。',
      action(){S.hamUntil=now()+3200;}},[hamG]);

    /* 桩 */
    const pileG=new THREE.Group();
    {
      const p=mm(new THREE.CylinderGeometry(.24,.24,4.0,14),matte(0xB0AAA0));
      p.position.y=2.0;pileG.add(p);
      const cap=mm(new THREE.CylinderGeometry(.3,.3,.18,14),steel(0x8a929e));
      cap.position.y=4.05;pileG.add(cap);
      for(let i=0;i<5;i++){
        const b=mm(new THREE.TorusGeometry(.25,.02,6,14),dark(0x9aa2ad));
        b.rotation.x=Math.PI/2;b.position.y=.5+i*.8;pileG.add(b);
      }
      pileG.position.set(1.2,0,0);root.add(pileG);
    }
    defPart('pile',{name:'桩',outside:true,
      text:'长长的水泥柱子，一下一下被打进地里。',
      more:'桩要一直打到底下的硬土层才算数，有时候十几米深。楼的重量顺着桩传到硬土上，房子才不会沉下去。'},[pileG]);

    const eng=RIG.engine(ctx,{scale:1.0});
    place(eng.group,V(-1.6,1.6,-.5),V(-3.0,2.4,-1.6));
    defPart('engine',{name:'发动机',
      text:'发动机带着卷扬机，一次次把锤子提起来。',
      more:'打桩机干活时发动机声音特别大，因为提几吨重的锤子非常费劲，一分钟要提三四十次。',
      action(){S.engUntil=now()+3200;}},[eng.group]);

    // 启动按钮在驾驶室的仪表台上
    const sb=RIG.startBtn(ctx,cabRig.btnAt.x,cabRig.btnAt.y,cabRig.btnAt.z,.55);cabRig.group.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，打桩机就开始打啦！',
      more:'打桩声音很大，工地附近一般规定只能白天打。'},[sb.group]);

    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.hamUntil)S.hammerT=.5+.5*Math.sin(t/380);
      if(!drv&&t>S.hamUntil){R.idle(dt,1.2);}
      R.ease(dt,6);
      const engOn=(drv&&S.engineOn)||t<S.engUntil;
      S.eng+=((engOn?1:0)-S.eng)*Math.min(1,dt*3);

      const sink=S.pile*3.2;
      pileG.position.set(1.2,-sink,0);
      pileG.position.y+=2.2*ee;pileG.position.x+=2.2*ee;
      const capY=4.05-sink;
      const hy=capY+.95+S.hammer*3.4;
      hamG.position.set(1.2+1.2*ee,hy+2.8*ee,0);
      const top=9.2;
      rope.position.set(1.2,(top+hy+.7)/2,0);
      rope.scale.y=Math.max(.05,top-hy-.7);
      rope.visible=ee<.3;
      mastG.position.set(1.2+.8*ee,.1+1.0*ee,0);
      eng.spin(dt,S.eng);
      sb.pulse(drv,t);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机转起来，卷扬机开始收绳。',part:'engine',inner:true,
        on(){S.engineOn=true;api.sfx.loop('engine');R.start(DRIVE,1);}},
      {t:'先把桩立起来，对准塔架。',part:'pile'},
      {t:'卷扬机把锤子提到最高，然后一松手。',part:'winch',inner:true},
      {t:'砰！砰！桩一下一下扎进地里。',part:'hammer'},
    ];

    ctx.linearize();
    return {update,chain,
      onStop(){R.stop();S.engineOn=false;for(const k of KEYS)S[k+'T']=0;},
      onStart(){S.pileT=0;S.pile=0;},onDone(){S.engineOn=false;}};
  }
},RIG.SKY.site);
})();

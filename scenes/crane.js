/* 场景：吊车（汽车起重机）
   +x 是车头，臂朝 -x 方向伸出去（吊东西时车尾对着货）。 */
window.SCENES=window.SCENES||{};
(function(){
const C={leg:0,legT:0,pitch:0,pitchT:0,ext:0,extT:0,hook:0,hookT:0,slew:0,slewT:0,
  eng:0,lifted:0,liftedT:0,phase:0,hookW:null,box:null,seq:null,seqI:0,seqT:0,reps:0,engineOn:false,
  engUntil:0,legUntil:0,boomUntil:0,hookUntil:0};
let api=null;const now=()=>api.now();
window.__CR=C;

/* 上半场：支腿、抬臂、伸臂，钩子落到箱子上（hook=1 正好到地面），吊起来转过去放下 */
const LIFT_A=[
  {d:1400,to:{leg:1}},
  {d:1300,to:{pitch:1}},
  {d:1500,to:{ext:1}},
  {d:1200,to:{hook:1}},
  {d:500 ,to:{lifted:1}},
  {d:1400,to:{hook:.45}},
  {d:1600,to:{slew:1}},
  {d:1200,to:{hook:1}},
  {d:400 ,to:{lifted:0}},
  {d:1000,to:{hook:.45}},
];
/* 下半场：再把箱子吊回原地，收臂、收腿 */
const LIFT_B=[
  {d:1200,to:{hook:1}},
  {d:500 ,to:{lifted:1}},
  {d:1400,to:{hook:.45}},
  {d:1600,to:{slew:0}},
  {d:1200,to:{hook:1}},
  {d:400 ,to:{lifted:0}},
  {d:1000,to:{hook:0}},
  {d:1400,to:{ext:0}},
  {d:1300,to:{pitch:0}},
  {d:1400,to:{leg:0}},
];
const BOX_HOME=[-6.68,.55,0];
function startSeq(seq,reps){if(C.seq)return;C.seq=seq;C.reps=reps||1;C.seqI=-1;nextSeg();}
function nextSeg(){
  C.seqI++;
  if(C.seqI>=C.seq.length){if(C.reps>1){C.reps--;C.seqI=0;}else{C.seq=null;C.reps=0;return;}}
  const sg=C.seq[C.seqI];
  C.from={leg:C.legT,pitch:C.pitchT,ext:C.extT,hook:C.hookT,slew:C.slewT,lifted:C.liftedT};
  C.to=Object.assign({},C.from,sg.to);C.seqT=0;
}

SCENES.crane=Object.assign({
  id:'crane',title:'吊车',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:13,h:10.5,ty:2.6,tyEx:3.2,rEx:1.25,cx:-.6},cameraStart:{theta:1.0,phi:1.15},
  order:['boom','hook','winch','slew','legs','cab','engine','cw','body','start'],
  go:{on:'开始吊',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再吊一次！',
    done:'吊好啦！大箱子稳稳放到旁边。',doneHintXray:'看，卷扬机在收钢丝绳。点「停下」再吊一次。',
    doneHint:'点「看里面」，看看钢丝绳是怎么收的。'},
  intro:{icon:'boom',name:'吊车',text:'点一点吊车的零件，听听它叫什么。按「开始吊」看它怎么把箱子吊起来。'},
  poster:{title:'吊车为什么不会翻倒',sub:'伸出四条腿，把整台车稳稳撑在地上',
    summary:'支腿撑住 + 配重压住 + 钢丝绳拉住 = 举得高还稳当！',angle:{theta:1.0,phi:1.15},
    keys:['boom','hook','winch','legs','cw','slew']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,mm,roundedBox,flat,plastic}=ctx;
    const s=RIG.site(ctx,{kind:'dirt',seed:777,fenceZ:9});
    // 被吊的大箱子
    const box=new THREE.Group();
    const b=roundedBox(1.1,1.0,1.1,.05,plastic(0x3E7BC6));box.add(b);
    for(const y of [-.3,.3]){const band=roundedBox(1.14,.09,1.14,.02,flat(0xE8C35A));band.position.y=y;box.add(band);}
    const eye=mm(new THREE.TorusGeometry(.1,.03,8,14),flat(0x9aa2ad));eye.position.y=.56;box.add(eye);
    box.castShadow=true;box.traverse(o=>{if(o.isMesh)o.castShadow=true;});
    box.position.set(...BOX_HOME);scene.add(box);C.box=box;
    return {occluders:s.occluders,update(){
      // 挂上钩就跟着钩子走；松钩就留在原地，不会自己滑回去
      if(C.liftedT>.5&&C.hookW){box.position.set(C.hookW.x,C.hookW.y-.91,C.hookW.z);box.rotation.y=-.55*C.slew;}
    }};
  },

  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,tubeM,steel,chrome,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const YEL=0xF2B233,yel=()=>plastic(YEL);

    /* 底盘 */
    const tk=RIG.truck(ctx,{color:YEL,cabX:2.5,wheelR:.55,halfZ:1.0,
      frameFrom:-3.8,frameTo:3.3,axles:[{x:2.2},{x:1.15},{x:-2.0,dual:true},{x:-3.0,dual:true}]});
    place(tk.group,V(0,0,0),V(0,-.0,0));
    defPart('body',{name:'车身',outside:true,
      text:'吊车自己会开，开到工地再干活。',
      more:'吊车的底盘和大卡车一样，有好几对轮子分担重量。到了工地要先停稳、撑好腿，才敢把臂伸出去。'},[tk.group]);
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机坐在这里把车开过来。',
      more:'吊车有两个驾驶室：一个开车用，另一个在转台上专门操作吊臂。'},[tk.cab]);

    /* 支腿 ×4 */
    const legsG=new THREE.Group();const legs=[];
    for(const sx of [1,-1])for(const sz of [1,-1]){
      const og=RIG.outrigger(ctx,{color:YEL,out:1.0,drop:.62});
      og.group.position.set(sx*2.3,.66,sz*.9);
      og.group.rotation.y=sz>0?0:Math.PI;
      legsG.add(og.group);legs.push(og);
    }
    root.add(legsG);
    defPart('legs',{name:'支腿',outside:true,
      text:'四条腿伸出去撑住地面，吊车就不会翻。',
      more:'吊起重物的时候，力气全压在一侧。四条支腿把车的支撑面积撑得很大，重心怎么晃都还在四条腿围出来的方框里，所以不会翻。',
      action(){C.legUntil=now()+3200;}},[legsG]);

    /* 回转台 */
    const slewG=new THREE.Group();slewG.position.set(-.6,1.30,0);root.add(slewG);
    const turn=new THREE.Group();slewG.add(turn);
    const ringG=new THREE.Group();
    {
      const ring=mm(new THREE.CylinderGeometry(1.15,1.3,.42,30),steel(0x6b7280));
      ring.position.y=-.2;ringG.add(ring);
      for(let i=0;i<24;i++){const t=roundedBox(.1,.4,.13,.02,steel(0x8a929e));
        const a=i*Math.PI*2/24;t.position.set(Math.cos(a)*1.24,-.2,Math.sin(a)*1.24);t.rotation.y=-a;ringG.add(t);}
      const skirt=mm(new THREE.CylinderGeometry(1.3,1.3,.16,30),dark(0x3a4150));
      skirt.position.y=-.44;ringG.add(skirt);
      slewG.add(ringG);
    }
    defPart('slew',{name:'回转台',
      text:'整个上半身能转一圈，把货送到旁边去。',
      more:'转台下面是一圈大齿轮，马达带着它慢慢转。吊起来的东西不用挪车，转个身就能放到另一边。'},[ringG]);

    /* 上车：操作室 + 配重 + 卷扬机 */
    const house=new THREE.Group();turn.add(house);
    {
      const deck=roundedBox(3.8,.5,2.1,.1,yel());deck.position.set(-.2,.28,0);house.add(deck);
      const side=roundedBox(3.8,.34,.1,.03,dark(0x3a4150));
      for(const sz of [1,-1]){const sd=side.clone();sd.position.set(-.2,.6,sz*1.02);house.add(sd);}
      const nose=roundedBox(.7,.7,1.4,.1,yel());nose.position.set(-1.9,.6,0);house.add(nose);
      markShell(house);place(house,V(0,0,0),V(0,2.2,0));
    }
    const opCab=RIG.cab(ctx,{w:1.0,h:1.25,d:1.1,color:0x3a4150});
    opCab.group.position.set(-.55,.53,.72);turn.add(opCab.group);
    markShell(opCab.group);

    const cwG=new THREE.Group();
    {
      const blk=roundedBox(.85,1.1,2.0,.08,dark(0x3a4150));cwG.add(blk);
      const stripe=roundedBox(.06,.22,1.8,.02,yel());stripe.position.x=-.42;cwG.add(stripe);
      cwG.position.set(1.35,1.05,0);turn.add(cwG);
    }
    defPart('cw',{name:'配重',
      text:'屁股上压着一大块铁，前面吊得再重也翘不起来。',
      more:'吊车是个大跷跷板：臂在一头，配重在另一头。吊得越重，需要压住的配重就越多，所以大吊车要另外拉一车配重块过来装上。'},[cwG]);

    const winchG=new THREE.Group();
    {
      const dr=mm(new THREE.CylinderGeometry(.26,.26,.7,20),steel(0x6b7280));
      dr.rotation.x=Math.PI/2;winchG.add(dr);
      for(const s of [1,-1]){const fl=mm(new THREE.CylinderGeometry(.34,.34,.05,20),steel(0x9aa2ad));
        fl.rotation.x=Math.PI/2;fl.position.z=s*.36;winchG.add(fl);}
      const mot=roundedBox(.36,.3,.3,.04,dark(0x2f3a4a));mot.position.set(-.4,0,0);winchG.add(mot);
      winchG.position.set(.5,1.0,0);turn.add(winchG);
    }
    defPart('winch',{name:'卷扬机',
      text:'钢丝绳一圈一圈缠在这个大轮子上。',
      more:'卷扬机就是一个很有劲的绕线轮。它把钢丝绳往回收，钩子就升起来；放出去，钩子就落下来。',
      action(){C.hookUntil=now()+3200;}},[winchG]);

    /* 伸缩臂 */
    const boomPivot=new THREE.Group();boomPivot.position.set(-1.55,1.05,0);turn.add(boomPivot);
    const bm=RIG.boom(ctx,{sections:3,len:2.9,w:.56,h:.64,taper:.84,color:YEL});
    bm.group.rotation.y=Math.PI;
    boomPivot.add(bm.group);
    defPart('boom',{name:'伸缩臂',outside:true,
      text:'一节套一节伸出去，能伸得好长好长！',
      more:'吊臂像伸缩天线，一节套在另一节里。里面的油缸把它们一节节顶出去，最长能伸到十几米。',
      action(){C.boomUntil=now()+3600;}},[bm.group]);

    /* 吊钩 + 钢丝绳 */
    const hookG=new THREE.Group();
    const rope=mm(new THREE.CylinderGeometry(.025,.025,1,8),dark(0x555b66));
    root.add(rope);rope.userData.noHit=true;
    {
      const blk=roundedBox(.26,.3,.2,.04,steel(0x9aa2ad));hookG.add(blk);
      const sh=mm(new THREE.TorusGeometry(.16,.05,10,18,Math.PI*1.5),chrome());
      sh.position.y=-.3;sh.rotation.z=Math.PI*.25;hookG.add(sh);
      const pul=mm(new THREE.CylinderGeometry(.14,.14,.1,16),steel(0x6b7280));
      pul.rotation.x=Math.PI/2;pul.position.y=.14;hookG.add(pul);
      root.add(hookG);
    }
    defPart('hook',{name:'吊钩',outside:true,
      text:'钩子放下去挂住箱子，再一点点吊起来。',
      more:'吊钩上面有滑轮，钢丝绳绕好几圈。绕得越多越省力——绳子拉得长一点，但能吊得更重。',
      action(){C.hookUntil=now()+3200;}},[hookG]);

    /* 发动机 */
    const engine=new THREE.Group();
    {
      const blk=roundedBox(1.0,.6,.8,.06,dark(0x2f3a4a));engine.add(blk);
      const head=roundedBox(.9,.18,.7,.04,matte(0xC0392B));head.position.y=.38;engine.add(head);
      const fan=mm(new THREE.CylinderGeometry(.24,.24,.06,16),steel(0x6b7280));
      fan.position.set(.58,0,0);fan.rotation.z=Math.PI/2;engine.add(fan);
      place(engine,V(-1.9,1.0,0),V(-2.4,1.9,0));
    }
    defPart('engine',{name:'发动机',
      text:'发动机转起来，油泵才有力气推动臂和绳子。',
      more:'吊车上的每一个动作——伸臂、抬臂、收绳、转身——都靠液压油推动，而油泵的力气来自这台发动机。',
      action(){C.engUntil=now()+3200;}},[engine]);

    /* 启动按钮 */
    const startG=new THREE.Group();
    {
      const base=mm(new THREE.CylinderGeometry(.15,.15,.07,18),dark(0x262b35));startG.add(base);
      const btn=mm(new THREE.CylinderGeometry(.11,.11,.09,18),
        new THREE.MeshStandardMaterial({color:0x35C46B,emissive:0x35C46B,emissiveIntensity:.35,roughness:.4}));
      btn.position.y=.06;btn.userData.keepEm=true;startG.add(btn);
      startG.position.set(2.5,2.4,1.05);root.add(startG);
    }
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，吊车就开始干活啦！',
      more:'司机先把四条支腿撑好，再按这个按钮，吊臂才肯动。'},[startG]);

    const _h=new THREE.Vector3(),_t=new THREE.Vector3();
    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      if(C.seq){
        const sg=C.seq[C.seqI];C.seqT+=dt*1000;
        const k=Math.min(1,C.seqT/sg.d),e=k*k*(3-2*k);
        for(const key in C.to)C[key+'T']=C.from[key]+(C.to[key]-C.from[key])*e;
        if(k>=1)nextSeg();
      }
      if(t<C.legUntil)C.legT=.5+.5*Math.sin(t/500);
      if(t<C.boomUntil){C.pitchT=.5+.5*Math.sin(t/700);C.extT=.5+.5*Math.sin(t/900);}
      if(t<C.hookUntil)C.hookT=.5+.5*Math.sin(t/600);
      if(!drv&&!C.seq&&t>C.legUntil&&t>C.boomUntil&&t>C.hookUntil){
        C.legT+=(0-C.legT)*Math.min(1,dt*1.2);C.pitchT+=(0-C.pitchT)*Math.min(1,dt*1.2);
        C.extT+=(0-C.extT)*Math.min(1,dt*1.2);C.hookT+=(0-C.hookT)*Math.min(1,dt*1.2);
        C.slewT+=(0-C.slewT)*Math.min(1,dt*1.2);C.liftedT=0;
      }
      for(const k of ['leg','pitch','ext','hook','slew','lifted'])
        C[k]+=(C[k+'T']-C[k])*Math.min(1,dt*3.2);
      const engOn=(drv&&C.engineOn)||t<C.engUntil;
      C.eng+=((engOn?1:0)-C.eng)*Math.min(1,dt*3);

      for(const og of legs)og.set(C.leg*(1-ee));
      turn.rotation.y=-.55*C.slew;
      boomPivot.rotation.z=-(.16+.80*C.pitch);
      bm.set(C.ext);

      // 钩子挂在臂尖正下方，钢丝绳把两点连起来
      const reach=2.9+2*2.9*.86*C.ext;
      const ang=.16+.80*C.pitch, sa=-.55*C.slew;
      const tipL=new THREE.Vector3(-1.55-reach*Math.cos(ang),1.05+reach*Math.sin(ang),0);
      _t.set(tipL.x*Math.cos(sa),tipL.y,-tipL.x*Math.sin(sa));
      _t.x+=-.6;_t.y+=1.30;
      // 绳子要放得够长，hook=1 时钩子刚好落到地上箱子的吊环
      const drop=.5+6.85*C.hook;
      hookG.position.set(_t.x,Math.max(.5,_t.y-drop),_t.z);
      (C.hookW||(C.hookW=new THREE.Vector3())).copy(hookG.position);
      hookG.position.x+=1.2*ee;hookG.position.y+=1.6*ee;
      // 上半场放到旁边，接着下半场吊回来
      if(C.phase===1&&!C.seq){C.phase=2;startSeq(LIFT_B,1);}
      else if(C.phase===2&&!C.seq)C.phase=0;
      const mid=_h.copy(_t).add(hookG.position).multiplyScalar(.5);
      const len=Math.max(.05,_t.y-hookG.position.y);
      rope.position.copy(mid);rope.scale.y=len;rope.visible=ee<.3;

      const spin=dt*C.eng*(2+8*Math.abs(C.hookT-C.hook));
      winchG.children[0].rotation.z-=spin*6;
      engine.children[2].rotation.x+=dt*C.eng*20;
      startG.children[1].material.emissiveIntensity=.35+(drv?.5:0)*(Math.sin(t/220)*.5+.5);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机转起来，油泵有力气了。',part:'engine',inner:true,
        on(){C.engineOn=true;api.sfx.loop('engine');}},
      {t:'先把四条支腿撑到地上，车才站得稳。',part:'legs',on(){C.phase=1;startSeq(LIFT_A,1);}},
      {t:'大臂抬起来，一节一节伸出去。',part:'boom'},
      {t:'卷扬机放绳，钩子落下来挂住箱子。',part:'winch',inner:true},
      {t:'吊起来，转个身，稳稳放到旁边。',part:'hook'},
    ];

    ctx.linearize();
    return {update,chain,camY(){return (1.4*C.pitch+.6*C.ext)*(1-api.ee);},
      onStop(){C.seq=null;C.reps=0;C.phase=0;C.engineOn=false;
        C.legT=C.pitchT=C.extT=C.hookT=C.slewT=C.liftedT=0;if(C.box){C.box.position.set(...BOX_HOME);C.box.rotation.y=0;}},
      onStart(){if(C.box){C.box.position.set(...BOX_HOME);C.box.rotation.y=0;}},onDone(){C.engineOn=false;}};
  }
},RIG.SKY.site);
})();

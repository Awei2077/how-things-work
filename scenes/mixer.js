/* 场景：水泥搅拌车。+x 车头，搅拌筒斜着架在车尾。 */
window.SCENES=window.SCENES||{};
(function(){
const M={spin:0,spinT:0,drive:0,driveT:0,chute:0,chuteT:0,pour:0,pourT:0,eng:0,pileT:0,
  seq:null,seqI:0,seqT:0,reps:0,engineOn:false,
  engUntil:0,spinUntil:0,chuteUntil:0,pourUntil:0};
let api=null;const now=()=>api.now();
window.__MX=M;

const RUN=[
  {d:1600,to:{drive:3.0}},
  {d:900 ,to:{chute:1}},
  {d:2600,to:{pour:1}},
  {d:700 ,to:{pour:0}},
  {d:800 ,to:{chute:0}},
  {d:1400,to:{drive:0}},
];
function startSeq(seq,reps){if(M.seq)return;M.seq=seq;M.reps=reps||1;M.seqI=-1;nextSeg();}
function nextSeg(){
  M.seqI++;
  if(M.seqI>=M.seq.length){if(M.reps>1){M.reps--;M.seqI=0;}else{M.seq=null;M.reps=0;return;}}
  const sg=M.seq[M.seqI];
  M.from={drive:M.driveT,chute:M.chuteT,pour:M.pourT};
  M.to=Object.assign({},M.from,sg.to);M.seqT=0;
}

SCENES.mixer=Object.assign({
  id:'mixer',title:'搅拌车',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:11,h:6,ty:1.8,tyEx:2.8,rEx:1.28,cx:-.3},cameraStart:{theta:.95,phi:1.18},
  order:['drum','blade','hopper','chute','water','wheels','cab','engine','body','start'],
  go:{on:'开始送',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再送一车！',
    done:'送到啦！混凝土倒出来了。',doneHintXray:'看，筒里的螺旋叶片一直在转。点「停下」再送一次。',
    doneHint:'点「看里面」，看看筒里到底装了什么。'},
  intro:{icon:'drum',name:'搅拌车',text:'点一点搅拌车的零件，听听它叫什么。按「开始送」看它怎么把混凝土送到工地。'},
  poster:{title:'搅拌车的大筒子为什么一直在转',sub:'因为混凝土一停就会硬掉',
    summary:'筒里有螺旋叶片：正着转是搅拌，倒着转就把混凝土推出来！',angle:{theta:.95,phi:1.15},
    keys:['drum','blade','chute','hopper','engine','water']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,mm,flat}=ctx;
    const s=RIG.site(ctx,{kind:'dirt',seed:5150,fenceZ:9});
    const heap=mm(new THREE.SphereGeometry(1,14,10),flat(0x9aa0a8));
    heap.scale.set(1.1,.22,1.0);heap.castShadow=true;scene.add(heap);
    return {occluders:s.occluders,update(){
      heap.position.set(-4.3+M.drive,.02,0);
      const k=M.pileT;
      heap.scale.set(1.1*(.35+k*.75),.22*(.3+k*.9),1.0*(.35+k*.7));
      heap.visible=k>.02;
    }};
  },

  build(ctx,_api){
    api=_api;
    const {THREE,V,mm,roundedBox,tubeM,steel,chrome,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const RED=0xE0563A;

    const tk=RIG.truck(ctx,{color:RED,cabX:2.5,wheelR:.55,halfZ:.98,
      frameFrom:-3.6,frameTo:3.3,axles:[{x:2.2},{x:-1.5,dual:true},{x:-2.6,dual:true}]});
    place(tk.group,V(0,0,0),V(0,0,0));
    defPart('body',{name:'车身',outside:true,
      text:'大梁扛着整个筒，筒装满了有十几吨重。',
      more:'搅拌车的大梁要特别粗，因为筒里装满混凝土有十几吨，路上颠一下受力很大。'},[tk.group]);
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机开车过来，还要盯着筒转得对不对。',
      more:'驾驶室旁边有个手柄，管筒子转的方向：正转是搅拌，反转就把混凝土推出来。'},[tk.cab]);
    const wheelsG=new THREE.Group();
    for(const w of tk.wheels)wheelsG.add(w.group);
    defPart('wheels',{name:'轮子',outside:true,hopTargets:tk.wheels.map(w=>w.group),
      text:'后面是双排轮子，压得住这么重的车。',
      more:'越重的车轮子越多。后面每边两个轮子并排，把重量分开压在地上，轮胎才不会爆。'},[wheelsG]);

    /* 搅拌筒（斜着架在车尾） */
    const drumPivot=new THREE.Group();
    drumPivot.position.set(-1.1,1.55,0);drumPivot.rotation.z=.22;root.add(drumPivot);
    const dr=RIG.drum(ctx,{r:1.02,len:2.9,color:0xF0EBE2,ribs:0});
    drumPivot.add(dr.group);
    {
      const nose=mm(new THREE.ConeGeometry(1.02,.9,26),plastic(0xF0EBE2));
      nose.rotation.z=-Math.PI/2;nose.position.x=-1.85;dr.spin.add(nose);
      const tail=mm(new THREE.ConeGeometry(1.02,1.1,26),plastic(0xF0EBE2));
      tail.rotation.z=Math.PI/2;tail.position.x=1.99;dr.spin.add(tail);
      // 筒外面那两条螺旋筋，转起来一眼就看得出方向
      for(const s of [0,1]){
        for(let i=0;i<26;i++){
          const u=i/25,a=u*Math.PI*2.4+s*Math.PI;
          const seg=roundedBox(.26,.09,.11,.03,steel(0x9aa2ad));
          seg.position.set(-1.6+u*3.3,Math.cos(a)*1.05,Math.sin(a)*1.05);
          seg.rotation.x=-a;dr.spin.add(seg);
        }
      }
      for(const x of [-1.2,1.2]){
        const band=mm(new THREE.TorusGeometry(1.06,.06,10,30),steel(0x6b7280));
        band.rotation.y=Math.PI/2;band.position.x=x;dr.spin.add(band);
      }
      markShell(dr.group);
    }
    defPart('drum',{name:'搅拌筒',outside:true,
      text:'大筒子一路上都在慢慢转，混凝土才不会硬掉。',
      more:'混凝土是水泥、沙子、石头加水拌出来的。一停下来它就开始变硬，所以从搅拌站到工地，筒子必须一直转。',
      action(){M.spinUntil=now()+4000;}},[dr.group]);

    /* 筒内螺旋叶片（看里面才看得到） */
    const bladeG=new THREE.Group();
    {
      for(const s of [0,1]){
        for(let i=0;i<22;i++){
          const u=i/21,a=u*Math.PI*2.4+s*Math.PI;
          const v=roundedBox(.3,.62,.06,.02,matte(0x8a929e));
          v.position.set(-1.5+u*3.1,Math.cos(a)*.62,Math.sin(a)*.62);
          v.rotation.x=-a;bladeG.add(v);
        }
      }
      dr.spin.add(bladeG);
    }
    defPart('blade',{name:'螺旋叶片',inner:true,
      text:'筒里面是两条大螺旋，像麻花一样。',
      more:'叶片是螺旋形的。正着转，混凝土被往筒底推，一直翻搅；倒着转，同样一条螺旋就把它一路推到出口——一个零件干两件事。',
      action(){M.spinUntil=now()+4000;}},[bladeG]);

    /* 进料斗 */
    const hopG=new THREE.Group();
    {
      const h=mm(new THREE.CylinderGeometry(.62,.26,.7,16,1,true),steel(0x8a929e));
      h.position.set(0,.3,0);hopG.add(h);
      const lip=mm(new THREE.TorusGeometry(.62,.05,8,20),steel(0x6b7280));
      lip.position.y=.65;hopG.add(lip);
      hopG.position.set(-2.75,2.55,0);root.add(hopG);
    }
    defPart('hopper',{name:'进料斗',
      text:'混凝土从这个大漏斗倒进筒里。',
      more:'在搅拌站，水泥、沙子、石头和水从上面一起倒进这个斗，滑进筒里开始搅。'},[hopG]);

    /* 卸料槽 */
    const chuteG=new THREE.Group();
    {
      const ch=mm(new THREE.CylinderGeometry(.3,.34,1.6,14,1,true,0,Math.PI),steel(0x9aa2ad));
      ch.rotation.z=Math.PI/2;ch.rotation.x=Math.PI;ch.position.x=-.8;chuteG.add(ch);
      const ring=mm(new THREE.TorusGeometry(.32,.04,8,16),steel(0x6b7280));
      ring.rotation.y=Math.PI/2;chuteG.add(ring);
      chuteG.position.set(-3.5,1.9,0);root.add(chuteG);
    }
    defPart('chute',{name:'卸料槽',outside:true,
      text:'放下这条槽，混凝土顺着滑下去。',
      more:'槽子能左右摆、上下抬，司机站在旁边就能把混凝土送到要浇的地方。',
      action(){M.chuteUntil=now()+3200;}},[chuteG]);

    /* 混凝土流 */
    const flowG=new THREE.Group();const drops=[];
    for(let i=0;i<10;i++){
      const d=mm(new THREE.SphereGeometry(.13,8,6),matte(0x9aa0a8));
      d.castShadow=false;d.userData.u=i/10;flowG.add(d);drops.push(d);
    }
    root.add(flowG);flowG.userData.noHit=true;

    /* 水箱 */
    const waterG=new THREE.Group();
    {
      const t=mm(new THREE.CylinderGeometry(.3,.3,1.1,16),plastic(0x5B9BD5));
      t.rotation.x=Math.PI/2;waterG.add(t);
      for(const s of [1,-1]){const c=mm(new THREE.CylinderGeometry(.31,.31,.05,16),steel(0x9aa2ad));
        c.rotation.x=Math.PI/2;c.position.z=s*.56;waterG.add(c);}
      waterG.position.set(-3.2,1.15,0);root.add(waterG);
    }
    defPart('water',{name:'水箱',
      text:'车上带着一箱水，干完活要马上把筒冲干净。',
      more:'混凝土粘在筒里会硬得像石头，敲都敲不掉。所以卸完料必须立刻用这箱水把筒和槽冲一遍。'},[waterG]);

    /* 发动机 */
    const engine=new THREE.Group();
    {
      const blk=roundedBox(1.0,.6,.8,.06,dark(0x2f3a4a));engine.add(blk);
      const head=roundedBox(.9,.18,.7,.04,matte(0xC0392B));head.position.y=.38;engine.add(head);
      const fan=mm(new THREE.CylinderGeometry(.24,.24,.06,16),steel(0x6b7280));
      fan.position.set(.55,0,0);fan.rotation.z=Math.PI/2;engine.add(fan);
      place(engine,V(2.5,.95,0),V(3.2,1.9,0));
    }
    defPart('engine',{name:'发动机',
      text:'发动机既管开车，也管转筒子。',
      more:'搅拌筒不是电动的，它的力气也来自发动机——通过一套液压马达带着筒慢慢转。',
      action(){M.engUntil=now()+3200;}},[engine]);

    const startG=new THREE.Group();
    {
      const base=mm(new THREE.CylinderGeometry(.15,.15,.07,18),dark(0x262b35));startG.add(base);
      const btn=mm(new THREE.CylinderGeometry(.11,.11,.09,18),
        new THREE.MeshStandardMaterial({color:0x35C46B,emissive:0x35C46B,emissiveIntensity:.35,roughness:.4}));
      btn.position.y=.06;btn.userData.keepEm=true;startG.add(btn);
      startG.position.set(2.5,2.45,1.0);root.add(startG);
    }
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，搅拌车就出发啦！',
      more:'开车之前先让筒子转起来，一路转到工地。'},[startG]);

    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      if(M.seq){
        const sg=M.seq[M.seqI];M.seqT+=dt*1000;
        const k=Math.min(1,M.seqT/sg.d),e=k*k*(3-2*k);
        for(const key in M.to)M[key+'T']=M.from[key]+(M.to[key]-M.from[key])*e;
        if(k>=1)nextSeg();
      }
      if(t<M.chuteUntil)M.chuteT=.5+.5*Math.sin(t/600);
      if(t<M.pourUntil)M.pourT=1;
      if(!drv&&!M.seq&&t>M.chuteUntil&&t>M.pourUntil){
        M.chuteT+=(0-M.chuteT)*Math.min(1,dt*1.4);M.pourT=0;
        M.driveT+=(0-M.driveT)*Math.min(1,dt*1.4);
      }
      for(const k of ['drive','chute','pour'])M[k]+=(M[k+'T']-M[k])*Math.min(1,dt*3);
      const engOn=(drv&&M.engineOn)||t<M.engUntil;
      M.eng+=((engOn?1:0)-M.eng)*Math.min(1,dt*3);
      const spinOn=(drv||t<M.spinUntil||t<M.engUntil)?1:0;
      M.spin+=(spinOn-M.spin)*Math.min(1,dt*2);

      root.position.x=M.drive;
      tk.advance(M.drive-(update._px||0));update._px=M.drive;
      // 卸料时反转，一眼看得出方向变了
      dr.spin.rotation.x+=dt*M.spin*(M.pour>.4?-2.6:1.5)*(1-ee);
      drumPivot.position.y=1.55+2.2*ee;
      chuteG.rotation.z=-M.chute*.62;
      chuteG.rotation.y=M.chute*.22;
      chuteG.position.set(-3.5-.15*M.chute+(-1.6*ee),1.9-.35*M.chute+1.2*ee,0);
      hopG.position.set(-2.75-1.2*ee,2.55+1.6*ee,0);
      waterG.position.set(-3.2-.6*ee,1.15+.2*ee,1.7*ee);
      bladeG.visible=api.S.xr>.35||ee>.35;

      const pouring=M.pour>.15&&M.chute>.5;
      if(pouring)M.pileT=Math.min(1,M.pileT+dt*.42);
      for(const d of drops){
        const u=((d.userData.u+t/900)%1);
        const cx=-4.35,cy=1.42;
        d.position.set(cx+u*.5,cy-u*1.35,0);
        d.visible=pouring&&ee<.2;
        d.scale.setScalar(pouring?(.8+.4*Math.sin(u*6)):0);
      }
      engine.children[2].rotation.x+=dt*M.eng*20;
      startG.children[1].material.emissiveIntensity=.35+(drv?.5:0)*(Math.sin(t/220)*.5+.5);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机转起来，筒子跟着慢慢转。',part:'engine',inner:true,
        on(){M.engineOn=true;api.sfx.loop('engine');M.pileT=0;startSeq(RUN,2);}},
      {t:'一路上筒子都在转，混凝土才不会硬掉。',part:'drum'},
      {t:'筒里的螺旋叶片，正着转是搅拌。',part:'blade',inner:true},
      {t:'到工地啦，放下卸料槽。',part:'chute'},
      {t:'筒子倒着转，混凝土顺着槽滑下去！',part:'drum'},
    ];

    return {update,chain,
      onStop(){M.seq=null;M.reps=0;M.engineOn=false;M.driveT=M.chuteT=M.pourT=0;M.pileT=0;},
      onStart(){M.pileT=0;},onDone(){M.engineOn=false;}};
  }
},RIG.SKY.site);
})();

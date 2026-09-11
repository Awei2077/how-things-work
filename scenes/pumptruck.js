/* 场景：混凝土泵车。折叠臂一节节展开，混凝土顺着管子送到高处。 */
window.SCENES=window.SCENES||{};
(function(){
const S={leg:0,legT:0,a1:0,a1T:0,a2:0,a2T:0,a3:0,a3T:0,pump:0,pumpT:0,eng:0,
  engineOn:false,engUntil:0,legUntil:0,armUntil:0,pumpUntil:0};
let api=null;const now=()=>api.now();window.__PT=S;
const KEYS=['leg','a1','a2','a3','pump'];
const JOB=[
  {d:1400,to:{leg:1}},
  {d:1200,to:{a1:1}},
  {d:1100,to:{a2:1}},
  {d:1000,to:{a3:1}},
  {d:3000,to:{pump:1}},
  {d:600 ,to:{pump:0}},
  {d:1600,to:{a3:0,a2:0,a1:0}},
  {d:700 ,to:{leg:0}},
];
let R=null;

SCENES.pumptruck=Object.assign({
  id:'pumptruck',title:'泵车',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:15,h:11,ty:3.2,tyEx:3.6,rEx:1.25,cx:-1.0},cameraStart:{theta:.95,phi:1.1},
  order:['arm','pipe','pump','hopper','legs','cab','engine','body','start'],
  go:{on:'开始泵',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再泵一次！',
    done:'泵完啦！混凝土送到楼上了。',doneHintXray:'看，泵把混凝土一推一推地挤进管子。点「停下」再泵一次。',
    doneHint:'点「看里面」，看看混凝土是怎么被推上去的。'},
  intro:{icon:'arm',name:'泵车',text:'点一点泵车的零件，听听它叫什么。按「开始泵」看长臂怎么展开送混凝土。'},
  poster:{title:'混凝土怎么送到十几层楼高',sub:'不用一桶一桶提——用泵推上去',
    summary:'折叠臂展开 + 泵一推一推 = 混凝土顺着管子直接送到浇筑的地方！',angle:{theta:.95,phi:1.1},
    keys:['arm','pump','pipe','legs','hopper']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,roundedBox,matte}=ctx;
    const s=RIG.site(ctx,{kind:'dirt',seed:9090,fenceZ:11});
    const b=new THREE.Group();
    for(let f=0;f<3;f++){
      const sl=roundedBox(3.6,.25,3.4,.05,matte(0xC9C3B8));sl.position.y=1.4+f*1.6;b.add(sl);
      for(const [dx,dz] of [[1.5,1.5],[-1.5,1.5],[1.5,-1.5],[-1.5,-1.5]]){
        const c=roundedBox(.28,1.6,.28,.04,matte(0xB8B2A6));c.position.set(dx,2.2+f*1.6,dz);b.add(c);
      }
    }
    b.position.set(-8.0,0,0);b.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(b);
    return {occluders:s.occluders,update(){}};
  },

  build(ctx,_api){
    api=_api;
    ctx=RIG.upgrade(ctx);
    const {THREE,V,mm,roundedBox,steel,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const YEL=0xF2B233,GRY=0xB8BEC6;
    R=RIG.seqRunner(S,KEYS);

    const tk=RIG.truck(ctx,{color:YEL,cabX:2.8,wheelR:.52,halfZ:.95,
      frameFrom:-3.8,frameTo:3.6,axles:[{x:2.5},{x:1.4},{x:-2.0,dual:true},{x:-3.0,dual:true}]});
    place(tk.group,V(0,0,0),V(0,0,0));
    defPart('body',{name:'车身',outside:true,
      text:'长长的底盘，扛着折叠臂和泵。',
      more:'泵车看着像卡车，其实底盘是特制的：轴多、梁粗，还要留出四条支腿的位置。'},[tk.group]);
    defPart('cab',{name:'驾驶室',outside:true,
      text:'司机开车过来，然后下车用遥控器操作。',
      more:'泵车展开以后司机不在驾驶室里，而是挂着一个遥控盒站在旁边，一边看一边控制臂的位置。'},[tk.cab]);

    const legsG=new THREE.Group();const legs=[];
    for(const sx of [1,-1])for(const sz of [1,-1]){
      const og=RIG.outrigger(ctx,{color:YEL,out:1.1,drop:.62});
      og.group.position.set(sx*2.4,.66,sz*.9);
      og.group.rotation.y=sz>0?0:Math.PI;legsG.add(og.group);legs.push(og);
    }
    root.add(legsG);
    defPart('legs',{name:'支腿',outside:true,
      text:'四条腿撑得很开，臂伸出去才不会翻。',
      more:'泵车的臂能伸出去二三十米，力矩非常大。支腿撑开后整台车的支撑面积比车身还宽，才压得住。',
      action(){S.legUntil=now()+3000;}},[legsG]);

    /* 折叠臂：三节，一节挂一节 */
    const turn=new THREE.Group();turn.position.set(1.0,1.45,0);root.add(turn);
    const seg1=new THREE.Group();turn.add(seg1);
    const seg2=new THREE.Group();seg2.position.set(4.2,0,0);seg1.add(seg2);
    const seg3=new THREE.Group();seg3.position.set(3.4,0,0);seg2.add(seg3);
    /* 只收集引用，不能再 add 一次——three.js 的 add 会把节点从原父节点上摘走 */
    const armSegs=[];
    const mkSeg=(len,h,parent)=>{
      const g=new THREE.Group();
      const beam=roundedBox(len,h,h*.8,.05,plastic(YEL));beam.position.set(len/2,0,0);g.add(beam);
      const pin=mm(new THREE.CylinderGeometry(h*.42,h*.42,h*1.0,12),steel(0x6b7280));
      pin.rotation.x=Math.PI/2;g.add(pin);
      parent.add(g);armSegs.push(g);return g;};
    mkSeg(4.2,.5,seg1);mkSeg(3.4,.4,seg2);mkSeg(2.8,.32,seg3);
    defPart('arm',{name:'折叠臂',outside:true,
      text:'三节臂像手臂一样折起来，用的时候再一节节展开。',
      more:'不用的时候臂折成 Z 字形躺在车顶上，才开得上路。到了工地一节节展开，能伸到旁边的楼上去。',
      action(){S.armUntil=now()+3600;}},armSegs);

    /* 输送管 */
    const pipes=[];
    for(const [par,len,h] of [[seg1,4.2,.5],[seg2,3.4,.4],[seg3,2.8,.32]]){
      const p=mm(new THREE.CylinderGeometry(.09,.09,len,12),steel(0x8a929e));
      p.rotation.z=Math.PI/2;p.position.set(len/2,h*.62,0);par.add(p);pipes.push(p);
    }
    const hoseG=new THREE.Group();
    {
      const h=mm(new THREE.CylinderGeometry(.1,.1,1.1,10),dark(0x3a4150));
      h.position.y=-.55;hoseG.add(h);
      seg3.add(hoseG);hoseG.position.set(2.8,0,0);
    }
    defPart('pipe',{name:'输送管',outside:true,
      text:'管子贴着臂一路走到最前面。',
      more:'混凝土在管子里被一段段往前推。管子内壁很光滑，还要经常冲洗，不然混凝土干在里面就堵死了。'},pipes);

    /* 泵 + 料斗 */
    const pumpG=new THREE.Group();
    {
      for(const s of [1,-1]){
        const cyl=mm(new THREE.CylinderGeometry(.22,.22,1.2,16),steel(0x6b7280));
        cyl.rotation.z=Math.PI/2;cyl.position.set(0,0,s*.32);pumpG.add(cyl);
      }
      const sv=mm(new THREE.TorusGeometry(.26,.09,10,18,Math.PI),matte(0xC0392B));
      sv.position.set(.7,0,0);sv.rotation.y=Math.PI/2;pumpG.add(sv);
      place(pumpG,V(-2.6,1.1,0),V(-3.6,2.0,1.6));
    }
    defPart('pump',{name:'泵',
      text:'两个大活塞你推我拉，把混凝土一段段挤进管子。',
      more:'泵里有两根粗活塞。一根往前推的时候另一根往回吸，一个阀门来回切换，混凝土就被不停地往前送，一刻不停。',
      action(){S.pumpUntil=now()+3400;}},[pumpG]);

    const hopG=new THREE.Group();
    {
      const h=mm(new THREE.CylinderGeometry(.75,.3,.8,4),steel(0x9aa2ad));
      h.rotation.y=Math.PI/4;h.position.y=.4;hopG.add(h);
      const grid=roundedBox(1.2,.04,1.2,.02,dark(0x6b7280));grid.position.y=.82;hopG.add(grid);
      place(hopG,V(-3.5,1.25,0),V(-4.6,1.9,0));
    }
    defPart('hopper',{name:'料斗',outside:true,
      text:'搅拌车把混凝土倒进这个斗，泵再从这儿抽。',
      more:'料斗上面有一层格栅，太大的石块进不去，免得堵住泵。斗里还有一根螺旋，一直搅着不让它沉底。'},[hopG]);

    /* 出料 */
    const drops=[];
    for(let i=0;i<12;i++){
      const d=mm(new THREE.SphereGeometry(.11,7,6),matte(0x9aa0a8));
      d.castShadow=false;d.userData.u=i/12;d.userData.noHit=true;root.add(d);drops.push(d);
    }

    const eng=RIG.engine(ctx,{scale:1.0});
    // 发动机在驾驶室地板下面，看里面才看得见
    place(eng.group,V(2.8,.45,0),V(3.8,1.9,0));
    defPart('engine',{name:'发动机',
      text:'发动机带着油泵，油泵推动活塞和长臂。',
      more:'泵送的时候车是停着的，发动机的力气全部给了液压系统——推活塞、撑支腿、展开长臂，都靠它。',
      action(){S.engUntil=now()+3200;}},[eng.group]);

    // 启动按钮在驾驶室的仪表台上
    const sb=RIG.startBtn(ctx,tk.btnAt.x,tk.btnAt.y,tk.btnAt.z,.6);tk.cab.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，泵车就开始送混凝土啦！',
      more:'一台泵车能顶几十个人提桶，楼盖得快全靠它。'},[sb.group]);

    const _w=new THREE.Vector3();
    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.legUntil)S.legT=.5+.5*Math.sin(t/500);
      if(t<S.armUntil){S.a1T=.5+.5*Math.sin(t/800);S.a2T=.5+.5*Math.sin(t/900);S.a3T=.5+.5*Math.sin(t/700);}
      if(t<S.pumpUntil)S.pumpT=1;
      if(!drv&&t>S.legUntil&&t>S.armUntil&&t>S.pumpUntil)R.idle(dt,1.2);
      R.ease(dt,3);
      const engOn=(drv&&S.engineOn)||t<S.engUntil;
      S.eng+=((engOn?1:0)-S.eng)*Math.min(1,dt*3);

      for(const og of legs)og.set(S.leg*(1-ee));
      turn.rotation.y=-.5*S.a1;
      turn.position.set(1.0+1.4*ee,1.45+1.6*ee,0);
      // 收起：三节叠成 Z 字压在车顶（各段末端都在 y>2）；展开：一路伸向楼那边
      seg1.rotation.z=2.90-0.70*S.a1;
      seg2.rotation.z=-3.00+3.60*S.a2;
      seg3.rotation.z=3.10-2.50*S.a3;

      hoseG.getWorldPosition(_w);
      const pouring=S.pump>.2&&ee<.2;
      for(const d of drops){
        const u=((d.userData.u+t/650)%1);
        d.position.set(_w.x+.05,_w.y-.5-u*2.6,_w.z);
        d.visible=pouring;d.scale.setScalar(pouring?1:0);
      }
      const ph=Math.sin(t/220)*.16*S.pump;
      pumpG.children[0].position.x=ph;pumpG.children[1].position.x=-ph;
      eng.spin(dt,S.eng);
      sb.pulse(drv,t);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){}},
      {t:'发动机转起来，油泵有劲了。',part:'engine',inner:true,
        on(){S.engineOn=true;api.sfx.loop('engine');R.start(JOB,2);}},
      {t:'先把四条支腿撑到最开。',part:'legs'},
      {t:'折叠臂一节一节展开，伸到楼那边去。',part:'arm'},
      {t:'搅拌车把混凝土倒进料斗。',part:'hopper'},
      {t:'两根活塞你推我拉，混凝土顺着管子上去了！',part:'pump',inner:true},
    ];

    ctx.linearize();
    return {update,chain,
      onStop(){R.stop();S.engineOn=false;for(const k of KEYS)S[k+'T']=0;},
      onStart(){},onDone(){S.engineOn=false;}};
  }
},RIG.SKY.site);
})();

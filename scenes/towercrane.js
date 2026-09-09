/* 场景：塔吊。竖着的塔身 + 水平长臂，小车沿臂跑，钩子上下。 */
window.SCENES=window.SCENES||{};
(function(){
const S={slew:0,slewT:0,troll:0,trollT:0,hook:0,hookT:0,lifted:0,liftedT:0,
  seq:null,engineOn:false,slewUntil:0,trollUntil:0,hookUntil:0};
let api=null;const now=()=>api.now();window.__TC=S;
const KEYS=['slew','troll','hook','lifted'];
const JOB=[
  {d:1300,to:{troll:1,hook:1}},
  {d:500 ,to:{lifted:1}},
  {d:1300,to:{hook:.15}},
  {d:1800,to:{slew:1}},
  {d:1100,to:{troll:.35}},
  {d:1200,to:{hook:.9}},
  {d:400 ,to:{lifted:0}},
  {d:1200,to:{hook:.15,slew:0,troll:1}},
];
let R=null;

SCENES.towercrane=Object.assign({
  id:'towercrane',title:'塔吊',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  fit:{w:27,h:19,ty:6.4,tyEx:7.4,rEx:1.15,cx:1.5},cameraStart:{theta:.95,phi:1.05},
  order:['jib','trolley','hook','mast','cw','cab','base','start'],
  go:{on:'开始吊',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再吊一次！',
    done:'吊好啦！材料稳稳送到楼上。',doneHintXray:'看，小车沿着长臂来回跑。点「停下」再吊一次。',
    doneHint:'点「看里面」，看看塔身里面是什么样。'},
  intro:{icon:'jib',name:'塔吊',text:'点一点塔吊的零件，听听它叫什么。按「开始吊」看它怎么把材料送到楼上。'},
  poster:{title:'塔吊为什么立得那么高还不倒',sub:'一头吊货，另一头压着大石块',
    summary:'塔身扎在地基里 + 后面压着配重 = 举得高、伸得远还稳当！',angle:{theta:.95,phi:1.05},
    keys:['jib','cw','mast','trolley','hook']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,roundedBox,plastic,matte}=ctx;
    const s=RIG.site(ctx,{kind:'dirt',seed:404,fenceZ:11});
    const b=new THREE.Group();
    for(let f=0;f<4;f++){
      const sl=roundedBox(4.0,.25,4.0,.05,matte(0xC9C3B8));sl.position.y=1.2+f*1.5;b.add(sl);
      for(const [dx,dz] of [[1.8,1.8],[-1.8,1.8],[1.8,-1.8],[-1.8,-1.8]]){
        const c=roundedBox(.3,1.5,.3,.04,matte(0xB8B2A6));c.position.set(dx,1.95+f*1.5,dz);b.add(c);
      }
    }
    b.position.set(-7.5,0,1.5);b.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(b);
    return {occluders:s.occluders,update(){}};
  },

  build(ctx,_api){
    api=_api;
    const {THREE,V,mm,roundedBox,tubeM,steel,chrome,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const YEL=0xF2B233;
    R=RIG.seqRunner(S,KEYS);
    const truss=(len,w,mat,n)=>{
      const g=new THREE.Group();
      for(const sy of [1,-1])for(const sz of [1,-1]){
        const c=roundedBox(len,.09,.09,.02,mat);c.position.set(len/2,sy*w/2,sz*w/2);g.add(c);
      }
      for(let i=0;i<n;i++){
        const x=len*(i+.5)/n;
        for(const sz of [1,-1]){
          const d=roundedBox(.06,w*1.05,.06,.02,mat);
          d.position.set(x,0,sz*w/2);d.rotation.z=(i%2?1:-1)*.5;g.add(d);
        }
        for(const sy of [1,-1]){
          const d=roundedBox(.06,.06,w*1.05,.02,mat);
          d.position.set(x,sy*w/2,0);g.add(d);
        }
      }
      return g;
    };

    /* 地基 */
    const baseG=new THREE.Group();
    {
      const pad=roundedBox(3.2,.4,3.2,.06,matte(0xB0AAA0));pad.position.y=.2;baseG.add(pad);
      for(const [dx,dz] of [[1.1,1.1],[-1.1,1.1],[1.1,-1.1],[-1.1,-1.1]]){
        const blk=roundedBox(.7,.6,.7,.05,matte(0x9A948A));blk.position.set(dx,.7,dz);baseG.add(blk);
      }
      root.add(baseG);
    }
    defPart('base',{name:'地基',outside:true,
      text:'塔吊底下埋着一大块混凝土，牢牢压住。',
      more:'塔吊不是随便放在地上的。它的底座和一大块钢筋混凝土浇在一起，重得像好几十辆车，风再大也吹不倒。'},[baseG]);

    /* 塔身 */
    const mastG=truss(11.0,1.1,plastic(YEL),9);
    mastG.rotation.z=Math.PI/2;mastG.position.y=.4;root.add(mastG);
    {
      const lad=roundedBox(10.5,.06,.06,.02,steel(0x9aa2ad));
      lad.rotation.z=Math.PI/2;lad.position.set(.4,5.7,0);root.add(lad);
    }
    defPart('mast',{name:'塔身',outside:true,
      text:'一节一节的钢架，能越接越高。',
      more:'楼盖到哪层，塔吊就长到哪层。工人用一个特别的顶升架把塔身顶开一节，再塞进一段新的钢架，塔吊就自己长高了。'},[mastG]);

    /* 转台 */
    const turn=new THREE.Group();turn.position.set(0,11.4,0);root.add(turn);
    const capG=new THREE.Group();
    {
      const ring=mm(new THREE.CylinderGeometry(.8,.9,.4,20),steel(0x6b7280));capG.add(ring);
      const tower=truss(2.2,.8,plastic(YEL),2);tower.rotation.z=Math.PI/2;tower.position.y=.2;capG.add(tower);
      turn.add(capG);
    }

    /* 起重臂 + 平衡臂 */
    const jibG=truss(11.0,.85,plastic(YEL),10);jibG.position.set(.9,.2,0);turn.add(jibG);
    {
      const tip=mm(new THREE.ConeGeometry(.4,.7,4),plastic(YEL));
      tip.rotation.z=-Math.PI/2;tip.position.set(12.1,.2,0);turn.add(tip);
      for(const x of [4.0,8.0]){
        const stay=tubeM(V(x,.45,0),V(1.2,2.4,0),.045,steel(0x8a929e));turn.add(stay);
      }
    }
    defPart('jib',{name:'起重臂',outside:true,
      text:'长长的横臂，能伸出去好远。',
      more:'起重臂是三角形的钢架，又轻又结实。上面那两根斜拉的钢索把臂吊住，长臂才不会被压弯。',
      action(){S.trollUntil=now()+3200;}},[jibG]);

    const cwG=new THREE.Group();
    {
      const arm=truss(4.0,.8,plastic(YEL),3);arm.rotation.y=Math.PI;arm.position.set(-.9,.2,0);cwG.add(arm);
      for(let i=0;i<3;i++){
        const blk=roundedBox(.5,1.3,1.6,.06,matte(0x9A948A));blk.position.set(-4.0-i*.55,-.1,0);cwG.add(blk);
      }
      const stay=tubeM(V(-3.6,.4,0),V(-1.2,2.4,0),.045,steel(0x8a929e));cwG.add(stay);
      turn.add(cwG);
    }
    defPart('cw',{name:'配重',outside:true,
      text:'后面挂着几块大石头，前面吊东西才不会翘起来。',
      more:'塔吊是个巨大的跷跷板。前面吊多重，后面就要压多重。配重块是混凝土做的，一块就有好几吨。'},[cwG]);

    /* 司机室 */
    const cabRig=RIG.cab(ctx,{w:1.0,h:1.15,d:1.0,color:0x3a4150});
    cabRig.group.position.set(1.3,-.6,.9);turn.add(cabRig.group);markShell(cabRig.group);
    defPart('cab',{name:'司机室',outside:true,
      text:'司机坐在最高处，看着底下指挥。',
      more:'司机每天要爬十几分钟梯子上来，中午都不下去。他靠对讲机和地面的人配合，因为从上往下看，人只有一点点大。'},[cabRig.group]);

    /* 小车 + 吊钩 */
    const trolG=new THREE.Group();
    {
      const box=roundedBox(.7,.3,.7,.05,steel(0x9aa2ad));trolG.add(box);
      for(const s of [1,-1]){
        const w=mm(new THREE.CylinderGeometry(.12,.12,.08,12),steel(0x6b7280));
        w.rotation.x=Math.PI/2;w.position.set(s*.25,.2,0);trolG.add(w);
      }
      trolG.position.set(3,.55,0);turn.add(trolG);
    }
    defPart('trolley',{name:'小车',outside:true,
      text:'小车沿着长臂来回跑，钩子跟着走。',
      more:'塔吊不用整个转过去。要把东西送近一点，小车就往回跑；送远一点，小车就往外跑。这样又快又省电。',
      action(){S.trollUntil=now()+3200;}},[trolG]);

    const hookG=new THREE.Group();
    {
      const blk=roundedBox(.3,.3,.24,.04,steel(0x9aa2ad));hookG.add(blk);
      const sh=mm(new THREE.TorusGeometry(.18,.055,10,18,Math.PI*1.5),chrome());
      sh.position.y=-.34;sh.rotation.z=Math.PI*.25;hookG.add(sh);
      turn.add(hookG);
    }
    const rope=mm(new THREE.CylinderGeometry(.03,.03,1,8),dark(0x555b66));
    rope.userData.noHit=true;turn.add(rope);
    defPart('hook',{name:'吊钩',outside:true,
      text:'钩子挂住材料，一路吊到楼上。',
      more:'钢丝绳从卷扬机出发，绕过臂尖的滑轮，再绕过小车的滑轮，最后挂着钩子。绕的圈数越多，吊得越重。',
      action(){S.hookUntil=now()+3200;}},[hookG]);

    /* 被吊的材料 */
    const loadG=new THREE.Group();
    for(let i=0;i<4;i++){
      const b=roundedBox(1.5,.16,.5,.03,matte(0x9aa0a8));
      b.position.set(0,-.1-i*.18,(i-1.5)*.14);loadG.add(b);
    }
    loadG.userData.noHit=true;turn.add(loadG);

    const sb=RIG.startBtn(ctx,1.6,1.1,0);root.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，塔吊就开始吊啦！',
      more:'塔吊用的是电，工地上专门给它拉一根很粗的电缆。'},[sb.group]);

    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.slewUntil)S.slewT=.5+.5*Math.sin(t/900);
      if(t<S.trollUntil)S.trollT=.5+.5*Math.sin(t/800);
      if(t<S.hookUntil)S.hookT=.5+.5*Math.sin(t/700);
      if(!drv&&t>S.slewUntil&&t>S.trollUntil&&t>S.hookUntil)R.idle(dt,1.1);
      R.ease(dt,2.6);

      turn.rotation.y=-1.35*S.slew;
      turn.position.y=11.4+2.5*ee;
      const tx=2.2+8.2*S.troll;
      trolG.position.set(tx,.55,0);
      const hy=.35-6.0*S.hook;
      hookG.position.set(tx,hy,0);
      rope.position.set(tx,(.35+hy)/2,0);
      rope.scale.y=Math.max(.05,.35-hy);
      loadG.position.set(tx,hy-.55,0);
      loadG.visible=S.lifted>.4&&ee<.25;
      jibG.position.set(.9+3.0*ee,.2,0);
      cwG.position.set(-2.2*ee,0,0);
      capG.position.y=1.6*ee;
      sb.pulse(drv,t);
    }

    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){R.start(JOB,2);}},
      {t:'小车跑到外面，钩子放下来。',part:'trolley'},
      {t:'挂好材料，卷扬机收绳，吊起来。',part:'hook'},
      {t:'整个长臂转过去，对准要放的地方。',part:'jib'},
      {t:'后面的配重一直压着，所以不会翻。',part:'cw'},
      {t:'钩子放下去，材料稳稳落在楼上。',part:'hook'},
    ];

    return {update,chain,
      onStop(){R.stop();for(const k of KEYS)S[k+'T']=0;},
      onStart(){},onDone(){}};
  }
},RIG.SKY.site);
})();

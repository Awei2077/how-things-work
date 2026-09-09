/* 场景：挖掘机（工地） */
window.SCENES=window.SCENES||{};
(function(){
const YEL=0xF2B02B;
// 姿势：b1 大臂、b2 小臂（相对大臂）、b3 铲斗（相对小臂）。铲斗的绝对角 a3=b1+b2+b3：
//   a3≈+1 斗齿朝下（张开去挖）、a3≈-0.6 斗口朝上（装满端着）、a3≈+2.3 斗口朝下（倒土）
const A3=(b1,b2,a3)=>({b1,b2,b3:+(a3-b1-b2).toFixed(3)});
const REST={...A3(.05,-2.33,.14),slew:0};   // 收起：大臂放平、小臂折回来、铲斗放在履带前面的地上
const DISPLAY={...A3(.55,-1.4,.9),slew:0};  // 拆开看：臂举起来伸出去，零件分得开
const PIT={cx:5.6,cz:.15,rx:1.7,rz:2.1,D:.9};// 前面的土坑：椭圆碗，最深 0.9
function pitY(x,z){const r=Math.hypot((x-PIT.cx)/PIT.rx,(z-PIT.cz)/PIT.rz);return r>=1?0:-PIT.D*.5*(1+Math.cos(Math.PI*r));}
const X={cur:{...REST},from:null,to:null,seq:null,seqI:0,seqT:0,eng:0,pump:0,clump:0,clumpT:0,pileT:0,trackW:0,trackPh:0,drive:0,driveT:0,
  engUntil:0,pumpUntil:0,trackUntil:0,startOn:false,engineOn:false,pumpOn:false,dumpAt:-1e9,scoopAt:-1e9,drvK:0,reps:0};
let api=null;const now=()=>api.now();const PILE={obj:null};
// 土堆表面高度（椭球），给掉下来的土块落地用
function pileTop(x,z){const p=PILE.obj;if(!p)return 0;const dx=(x-p.position.x)/(1.1*p.scale.x),dz=(z-p.position.z)/(1.1*p.scale.z);const k=1-dx*dx-dz*dz;return k<=0?0:1.1*p.scale.y*Math.sqrt(k);}
// 挖土全过程（每个姿势都按正向运动学对着土坑核过：斗齿可以扎进坑面一点点，斗身始终在坑面以上，回程在土堆上方）
const DIG=[
  {dur:.9,to:A3(.5,-2.3,.5)},                      // 先把铲斗从地上抬起来
  {dur:1.0,to:A3(.55,-1.4,.9)},                    // 小臂往前甩
  {dur:.9,to:A3(.19,-.87,.95)},                    // 伸到坑对面，斗齿朝下
  {dur:.7,to:A3(.12,-1.01,1.0),on(){X.scoopAt=now();}}, // 扎进坑里
  {dur:.8,to:A3(.12,-1.27,.8)},                    // 沿着坑底往回拖
  {dur:.8,to:A3(.07,-1.34,.3),on(){X.clumpT=1;}},  // 斗卷起来，土进斗
  {dur:.7,to:A3(-.01,-1.37,-.45)},                 // 卷满
  {dur:1.0,to:A3(.55,-1.9,-.6)},                   // 举高
  {dur:1.3,to:{slew:1.12}},                        // 转身到土堆上方
  {dur:.9,to:A3(.45,-1.3,2.3),on(){X.clumpT=0;X.pileT=Math.min(1.5,X.pileT+.3);X.dumpAt=now();}}, // 斗口朝下倒土
  {dur:.7,to:A3(.5,-1.9,-.6)},                     // 收斗
  {dur:1.3,to:{slew:0}},                           // 转回来
  {dur:1.0,to:A3(.5,-2.3,.14)},                    // 小臂折回
  {dur:.9,to:{...REST}}];                          // 铲斗放回地上
const SWING=[{dur:1.2,to:{slew:.9}},{dur:1.2,to:{slew:0}}];
function startSeq(seq,reps){if(X.seq)return;if(seq===DIG&&Math.abs(X.drive)>.05)return;X.seq=seq;X.reps=reps||1;X.seqI=-1;nextSeg();}
function nextSeg(){X.seqI++;
  // 一趟挖完了：还有剩余次数就从头再来一遍，否则收工
  if(X.seqI>=X.seq.length){if(X.reps>1){X.reps--;X.seqI=0;}else{X.seq=null;X.reps=0;return;}}
  const sg=X.seq[X.seqI];X.from={...X.cur};X.to=Object.assign({...X.cur},sg.to);X.seqT=0;sg.on&&sg.on();}

SCENES.excavator={
  id:'excavator',title:'挖掘机',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  sky:'linear-gradient(180deg,#7FBFFF 0%,#A9D4FF 28%,#D6ECFB 48%,#D6ECFB 100%)',
  look:{srgb:true,hemi:.55,sun:.95,fill:.28,rim:.4,exposure:1.0,autoRotate:.10},
  envMap:['#cfe0f0','#eef4fa','#b6bfc9','#8d97a2'],hemi:{sky:0xdfefff,ground:0xc9a56a},fog:{color:0xD6ECFB,near:24,far:52},
  fit:{w:11.5,h:6,ty:1.7,tyEx:2.6,rEx:1.25,cx:2.3},cameraStart:{theta:.95,phi:1.2},
  order:['bucket','stick','boom','cyl','cab','engine','pump','tracks','cw','start','body'],
  go:{on:'开始挖',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再挖一次！',done:'挖好啦！满满一斗土倒在旁边。',doneHintXray:'看，发动机和液压泵都在使劲。点「停下」再挖一次。',doneHint:'点「看里面」，看看力气是从哪儿来的。'},
  intro:{icon:'bucket',name:'挖掘机',text:'点一点挖掘机的零件，听听它叫什么。按「开始挖」看它怎么挖土。'},
  poster:{title:'挖掘机里面到底长什么样',sub:'工地上最忙的大家伙，力气从哪儿来？',summary:'发动机 + 液压泵 + 油缸 = 铲斗挖土！',angle:{theta:.95,phi:1.15},keys:['bucket','stick','boom','cyl','pump','engine'],anchors:{cyl:[1.5,2.4,.62]}},

  env(ctx,_api){
    api=_api;const {THREE,scene,V,flat,matte,mm,roundedBox,canvasTex,rngFactory}=ctx;
    const dirtTex=canvasTex(512,512,(g,w,h)=>{const gr=g.createRadialGradient(w/2,h/2,w*.05,w/2,h/2,w/2);gr.addColorStop(0,'rgba(196,160,110,1)');gr.addColorStop(.75,'rgba(186,150,100,1)');gr.addColorStop(1,'rgba(186,150,100,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);
      g.fillStyle='rgba(120,90,55,.12)';for(let i=0;i<400;i++){g.beginPath();g.arc(Math.random()*w,Math.random()*h,1+Math.random()*3,0,6.28);g.fill();}});
    // 地面：中间挖掉一个椭圆洞，洞里放一只碗形的土坑（铲斗真的伸进坑里挖，不再穿地）
    const gs=new THREE.Shape();gs.absarc(0,0,34,0,Math.PI*2,false);
    const hole=new THREE.Path();hole.absellipse(PIT.cx,-PIT.cz,PIT.rx,PIT.rz,0,Math.PI*2,true);gs.holes.push(hole);
    const gg=new THREE.ShapeGeometry(gs,40);{const ps=gg.attributes.position,uv=gg.attributes.uv;for(let i=0;i<ps.count;i++)uv.setXY(i,ps.getX(i)/68+.5,ps.getY(i)/68+.5);}
    const ground=new THREE.Mesh(gg,new THREE.MeshStandardMaterial({map:dirtTex,transparent:true,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
    const bowlPts=[];for(let i=0;i<=14;i++){const r=i/14;bowlPts.push(new THREE.Vector2(r*PIT.rx,-PIT.D*.5*(1+Math.cos(Math.PI*r))));}
    const bowl=new THREE.Mesh(new THREE.LatheGeometry(bowlPts,48),flat(0x8a6a44,{side:THREE.DoubleSide}));bowl.position.set(PIT.cx,0,PIT.cz);bowl.scale.set(1,1,PIT.rz/PIT.rx);bowl.receiveShadow=true;scene.add(bowl);
    const pile=mm(new THREE.SphereGeometry(1.1,16,12),flat(0xA8825A));pile.scale.set(1.2,.5,1.1);pile.position.set(3.1,0,-6.1);pile.castShadow=true;scene.add(pile);
    PILE.obj=pile;
    const rnd=rngFactory(99),occ=[];
    const reg=o=>{o.updateWorldMatrix(true,true);const sp=new THREE.Box3().setFromObject(o).getBoundingSphere(new THREE.Sphere());o.userData.r=sp.radius;o.userData.cy=sp.center.y-o.position.y;o.userData.s0=o.scale.x;o.userData.k=1;occ.push(o);};
    for(const [x,z] of [[5.2,2.3],[7.6,1.6],[7.4,-1.9]]){const g=new THREE.Group();const c=mm(new THREE.ConeGeometry(.22,.7,12),matte(0xF25C2A));c.position.y=.35;g.add(c);const b=roundedBox(.5,.05,.5,.02,matte(0xF25C2A));b.position.y=.025;g.add(b);const st=mm(new THREE.CylinderGeometry(.16,.19,.08,12),matte(0xffffff));st.position.y=.42;g.add(st);g.position.set(x,0,z);scene.add(g);reg(g);}
    // 围挡
    for(let i=0;i<6;i++){const g=new THREE.Group();const x=-6+i*2.5;for(const dx of [-1.1,1.1]){const p=mm(new THREE.CylinderGeometry(.06,.06,1.3,8),flat(0x8B5A2B));p.position.set(dx,.65,0);g.add(p);}
      for(const y of [.55,1.05]){const r=roundedBox(2.4,.1,.06,.02,flat(0xE8D48A));r.position.set(0,y,0);g.add(r);}g.position.set(x,0,7.5);scene.add(g);reg(g);}
    // 远处的树
    const GREENS=[0x5DBB63,0x4CA85A,0x7CC576],trunkM=flat(0x8B5A2B);
    for(let i=0;i<10;i++){const a=(i/10)*Math.PI*2+rnd()*.4,R=13+rnd()*8;const g=new THREE.Group();const t=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,1,7),trunkM);t.position.y=.5;g.add(t);
      for(const [dx,dy,dz,k] of [[0,1.5,0,1],[.4,1.8,.2,.7],[-.35,1.85,-.25,.6]]){const s=new THREE.Mesh(new THREE.SphereGeometry(.8*k,9,7),flat(GREENS[i%3]));s.position.set(dx,dy,dz);g.add(s);}
      g.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.scale.setScalar(1+rnd()*.6);g.position.set(Math.cos(a)*R,0,Math.sin(a)*R);scene.add(g);reg(g);}
    return {occluders:occ,update(){pile.scale.set(1.2*(1+X.pileT*.35),.5*(1+X.pileT*.5),1.1*(1+X.pileT*.35));}};
  },

  build(ctx,_api){
    api=_api;ctx=RIG.upgrade(ctx);const {THREE,V,mm,roundedBox,capsule,tubeM,pathTube,chrome,steel,dark,matte,flat,plastic,glassMat,place,defPart,markShell,root,scene}=ctx;
    const yel=()=>plastic(YEL);
    /* ---- 履带底盘 ---- */
    const tracks=new THREE.Group(),cleats=[],sprockets=[],TL=3.6,TR=.5;
    function stadium(u){const straight=TL,arc=Math.PI*TR,P=2*straight+2*arc;let d=((u%1)+1)%1*P;
      if(d<straight)return{x:-TL/2+d,y:TR,ang:0};d-=straight;
      if(d<arc){const a=Math.PI/2-d/TR;return{x:TL/2+Math.cos(a)*TR,y:Math.sin(a)*TR,ang:a-Math.PI/2};}d-=arc;
      if(d<straight)return{x:TL/2-d,y:-TR,ang:Math.PI};d-=straight;const a=-Math.PI/2-d/TR;return{x:-TL/2+Math.cos(a)*TR,y:Math.sin(a)*TR,ang:a-Math.PI/2};}
    for(const s of [1,-1]){const z=s*1.2;
      const frame=roundedBox(TL+.4,.5,.6,.06,dark(0x3a4150));frame.position.set(0,TR,z);tracks.add(frame);
      const outer=new THREE.Shape();outer.absarc(TL/2,0,TR+.1,-Math.PI/2,Math.PI/2,false);outer.absarc(-TL/2,0,TR+.1,Math.PI/2,Math.PI*1.5,false);
      const inner=new THREE.Path();inner.absarc(TL/2,0,TR-.02,-Math.PI/2,Math.PI/2,false);inner.absarc(-TL/2,0,TR-.02,Math.PI/2,Math.PI*1.5,false);outer.holes.push(inner);
      const belt=mm(new THREE.ExtrudeGeometry(outer,{depth:.7,bevelEnabled:false,curveSegments:24}),dark(0x1c1f25));belt.position.set(0,TR,z-.35);tracks.add(belt);
      for(let i=0;i<26;i++){const c=mm(new THREE.BoxGeometry(.12,.09,.74),dark(0x30353f));c.userData.u=i/26;c.userData.z=z;tracks.add(c);cleats.push(c);}
      for(const x of [TL/2,-TL/2]){const w=mm(new THREE.CylinderGeometry(TR-.06,TR-.06,.5,20),steel(0x6b7280));w.rotation.x=Math.PI/2;w.position.set(x,TR,z);tracks.add(w);sprockets.push(w);
        for(let k=0;k<6;k++){const sp=mm(new THREE.BoxGeometry(.08,TR*1.5,.06),steel(0x8a929e));sp.rotation.z=k*Math.PI/6;sp.position.set(x,TR,z+.26*s);tracks.add(sp);}}
      for(let i=0;i<4;i++){const r=mm(new THREE.CylinderGeometry(.14,.14,.5,12),steel(0x8a929e));r.rotation.x=Math.PI/2;r.position.set(-1.2+i*.8,.16,z);tracks.add(r);}
    }
    const cross=roundedBox(2.4,.5,2.0,.06,dark(0x3a4150));cross.position.set(0,.55,0);tracks.add(cross);
    const ring=mm(new THREE.CylinderGeometry(1.15,1.15,.22,32),steel(0x6b7280));ring.position.set(0,.95,0);tracks.add(ring);
    place(tracks,V(0,.1,0),V(0,-.5,0));
    defPart('tracks',{name:'履带',outside:true,text:'两条履带像两只长长的大脚，软泥地上也不会陷下去。',more:'履带把重量摊在很大的一片地上，所以不会陷进泥里。左右两条履带一快一慢，就能转弯。',action(){X.trackUntil=now()+3200;}},[tracks]);

    /* ---- 上车：机身（外壳）、配重、驾驶室、发动机、液压泵 ---- */
    const upper=new THREE.Group();upper.position.set(0,1.16,0);root.add(upper);
    const house=new THREE.Group();
    {
      const plat=roundedBox(3.6,.25,2.7,.05,yel());plat.position.set(-.2,.12,0);house.add(plat);
      const body=roundedBox(2.5,1.25,2.5,.1,yel());body.position.set(-1.05,.87,0);house.add(body);
      const hood=roundedBox(1.7,.28,2.3,.06,yel());hood.position.set(-1.35,1.6,0);house.add(hood);
      for(let i=0;i<5;i++){const v=roundedBox(.5,.03,.12,.01,dark(0x262b35));v.position.set(-1.2,1.75,-.6+i*.3);house.add(v);}
      const stack=mm(new THREE.CylinderGeometry(.09,.09,.7,12),dark(0x3a4150));stack.position.set(-1.9,1.95,-.75);house.add(stack);
      const rail=tubeM(V(.6,.25,-1.3),V(.6,.95,-1.3),.03,steel());house.add(rail);house.add(tubeM(V(.6,.95,-1.3),V(-1.9,.95,-1.3),.03,steel()));house.add(tubeM(V(-1.9,.25,-1.3),V(-1.9,.95,-1.3),.03,steel()));
      const stripe=roundedBox(.05,.16,2.4,.02,dark(0x262b35));stripe.position.set(.2,.45,0);house.add(stripe);
      markShell(house);place(house,V(0,0,0),V(0,2.2,0));upper.add(house);
    }
    defPart('body',{name:'机身',outside:true,text:'黄色的大身体，能左转右转，里面藏着发动机。',more:'机身坐在一个大转盘上，能转一整圈。发动机、液压泵、油箱都装在机身里。',action(){startSeq(SWING);}},[house]);
    const cw=roundedBox(.75,1.2,2.5,.08,dark(0x3a4150));cw.position.set(0,0,0);
    const cwG=new THREE.Group();cwG.add(cw);const cwStripe=roundedBox(.05,.25,2.4,.02,yel());cwStripe.position.set(-.39,.2,0);cwG.add(cwStripe);
    upper.add(cwG);place(cwG,V(-2.45,.85,0),V(-1.3,0,0));
    defPart('cw',{name:'配重',text:'屁股上的大铁块，挖很重的东西时也不会翻倒。',more:'配重是尾巴上的一大块铁，和前面伸出去的大臂保持平衡，铲斗装满土也不会翻。'},[cwG]);
    const cab=new THREE.Group(),levers=[],forearms=[];
    {
      const floor=roundedBox(1.15,.1,1.05,.03,dark(0x3a4150));floor.position.set(0,.05,0);cab.add(floor);
      const roof=roundedBox(1.2,.1,1.1,.04,yel());roof.position.set(0,1.55,0);cab.add(roof);
      for(const [x,z] of [[-.55,.5],[-.55,-.5],[.55,.5],[.55,-.5]]){const p=roundedBox(.08,1.5,.08,.02,dark(0x262b35));p.position.set(x,.8,z);cab.add(p);}
      for(const [w,h,d,x,y,z] of [[1.1,1.3,.04,0,.85,.52],[1.1,1.3,.04,0,.85,-.52],[.04,1.3,1.0,.55,.85,0],[.04,1.3,1.0,-.55,.85,0]]){const gl=roundedBox(w,h,d,.01,glassMat(0xd9efff,.28));gl.position.set(x,y,z);gl.castShadow=false;gl.userData.glass=true;cab.add(gl);}// 标成玻璃：选中时不描边不发光，否则窗户变白板
      const seat=roundedBox(.4,.12,.45,.04,matte(0x2b2f38));seat.position.set(-.1,.45,0);cab.add(seat);const back=roundedBox(.1,.5,.45,.04,matte(0x2b2f38));back.position.set(-.32,.75,0);cab.add(back);
      // 两根操纵杆各自挂在一个可以前后摆的轴上，司机的手跟着杆走
      for(const z of [.15,-.15]){const lv=new THREE.Group();lv.position.set(.15,.4,z);lv.add(tubeM(V(0,0,0),V(.1,.35,0),.02,dark()));const kn=mm(new THREE.SphereGeometry(.04,10,8),dark());kn.position.set(.1,.36,0);lv.add(kn);
        const hand=mm(new THREE.SphereGeometry(.05,10,8),matte(0xF6D2B0));hand.position.set(.09,.4,0);lv.add(hand);cab.add(lv);levers.push(lv);}
      /* 司机：安全帽、反光背心、手握操纵杆、脚踩地板 */
      {const drv=new THREE.Group();const SKIN=matte(0xF6D2B0),VEST=matte(0xFF7A1A),PANTS=matte(0x3a63b8);
        const torso=roundedBox(.26,.42,.3,.08,VEST);torso.position.set(-.12,.72,0);drv.add(torso);
        for(const y of [.62,.72]){const st=roundedBox(.27,.03,.31,.01,matte(0xE6E9EF));st.position.set(-.12,y,0);drv.add(st);}
        const head=mm(new THREE.SphereGeometry(.12,16,12),SKIN);head.position.set(-.1,1.07,0);drv.add(head);
        for(const z of [.045,-.045]){const eye=mm(new THREE.SphereGeometry(.014,8,6),dark(0x1f242e));eye.position.set(.005,1.09,z);eye.castShadow=false;drv.add(eye);}
        const hat=mm(new THREE.SphereGeometry(.135,16,10,0,Math.PI*2,0,Math.PI/2),matte(0xFFC93C));hat.position.set(-.1,1.09,0);drv.add(hat);
        const brim=mm(new THREE.CylinderGeometry(.165,.165,.02,20),matte(0xFFC93C));brim.position.set(-.08,1.09,0);drv.add(brim);
        for(const z of [.17,-.17]){drv.add(tubeM(V(-.1,.9,z),V(.05,.78,z),.035,VEST));const fa=new THREE.Group();fa.position.set(.05,.78,z);fa.add(tubeM(V(0,0,0),V(.19,-.02,z>0?-.02:.02),.032,SKIN));drv.add(fa);forearms.push(fa);}
        for(const z of [.09,-.09]){drv.add(tubeM(V(-.05,.55,z),V(.22,.55,z),.05,PANTS));drv.add(tubeM(V(.22,.55,z),V(.24,.14,z),.045,PANTS));const boot=roundedBox(.17,.08,.1,.02,dark(0x262b35));boot.position.set(.3,.12,z);drv.add(boot);}
        cab.add(drv);}
      upper.add(cab);place(cab,V(.7,.25,.85),V(0,1.7,1.0));
    }
    defPart('cab',{name:'驾驶室',outside:true,text:'司机戴着安全帽坐在这里，推两根操纵杆，挖掘机就听话。',more:'司机用两根操纵杆控制大臂、小臂、铲斗和转身，脚下踏板控制履带。驾驶室有防翻滚的钢架。',action(){startSeq(SWING);}},[cab]);
    const engine=new THREE.Group(),fanG=new THREE.Group();
    {
      engine.add(roundedBox(.95,.62,.8,.06,steel(0x454c5a)));const head=roundedBox(.8,.12,.6,.04,steel(0x5c6470));head.position.y=.37;engine.add(head);
      for(let i=0;i<4;i++){const p=mm(new THREE.CylinderGeometry(.05,.05,.1,12),chrome());p.position.set(-.3+i*.2,.47,0);engine.add(p);}
      fanG.position.set(0,.05,-.55);for(let k=0;k<5;k++){const b=mm(new THREE.BoxGeometry(.06,.2,.02),matte(0x3a4150));b.rotation.z=k*Math.PI*2/5;b.position.set(Math.sin(k*Math.PI*2/5)*.11,Math.cos(k*Math.PI*2/5)*.11,0);fanG.add(b);}
      const hub=mm(new THREE.CylinderGeometry(.05,.05,.04,12),steel());hub.rotation.x=Math.PI/2;fanG.add(hub);engine.add(fanG);
      upper.add(engine);place(engine,V(-1.45,.7,-.2),V(-.3,1.4,-1.7));
    }
    defPart('engine',{name:'发动机',text:'发动机是挖掘机的心脏，突突突地转，给它力气。',more:'挖掘机烧柴油，发动机不直接推动大臂，而是带动液压泵。',action(){X.engUntil=now()+3500;X.pumpUntil=now()+3500;}},[engine]);
    const pump=new THREE.Group(),HOSE=[V(-.6,.55,.55),V(.2,.62,.5),V(.75,.55,.3),V(1.0,.45,.15)];
    {
      const pb=mm(new THREE.CylinderGeometry(.2,.2,.45,18),steel(0x6b7280));pb.rotation.z=Math.PI/2;pb.position.set(-.6,.55,.55);pump.add(pb);
      const pc=mm(new THREE.CylinderGeometry(.12,.12,.2,14),steel(0x9aa2ad));pc.rotation.z=Math.PI/2;pc.position.set(-.28,.55,.55);pump.add(pc);
      pump.add(pathTube(HOSE,.045,dark(0x1f242e)));pump.add(pathTube(HOSE.map(p=>p.clone().add(V(0,-.11,0))),.045,dark(0x1f242e)));
      upper.add(pump);place(pump,V(0,0,0),V(-.3,1.3,1.6));
    }
    defPart('pump',{name:'液压泵',text:'液压泵把油推得很有劲，力气顺着管子送到油缸。',more:'液压泵把油压得很高，油顺着油管送到各个油缸。挖掘机的力气就是从这里来的。',action(){X.pumpUntil=now()+3500;}},[pump]);
    const hoseCurve=new THREE.CatmullRomCurve3(HOSE),hoseDots=[];
    for(let i=0;i<6;i++){const d=mm(new THREE.SphereGeometry(.05,8,6),new THREE.MeshStandardMaterial({color:0xFFB020,emissive:0xFFB020,emissiveIntensity:.7}));d.castShadow=false;d.scale.setScalar(0);upper.add(d);hoseDots.push(d);}

    /* ---- 大臂 → 小臂 → 铲斗（层层相连） ---- */
    function segment(a,b,w,h,mat){const d=b.clone().sub(a),len=d.length();const m=roundedBox(len,h,w,.08,mat);m.position.copy(a).add(b).multiplyScalar(.5);m.rotation.z=Math.atan2(d.y,d.x);return m;}
    const boom=new THREE.Group();
    {boom.add(segment(V(0,0,0),V(2.4,1.3,0),.55,.6,yel()));boom.add(segment(V(2.4,1.3,0),V(4.3,.6,0),.5,.55,yel()));
     for(const [x,y,r] of [[0,0,.3],[2.4,1.3,.34],[4.3,.6,.24]]){const h=mm(new THREE.CylinderGeometry(r,r,.62,20),yel());h.rotation.x=Math.PI/2;h.position.set(x,y,0);boom.add(h);}
     for(const s of [1,-1]){const lug=roundedBox(.3,.25,.1,.03,yel());lug.position.set(1.45,.55,s*.36);boom.add(lug);}
     const lug2=roundedBox(.35,.55,.4,.04,yel());lug2.position.set(1.9,1.45,0);boom.add(lug2);
     upper.add(boom);place(boom,V(1.05,.8,.15),V(-.6,2.0,0));}
    defPart('boom',{name:'大臂',outside:true,text:'大臂抬起来，小臂和铲斗就一起举高。',more:'大臂是弯的，像人的上臂。两根粗油缸把它抬起来，能举起满满一斗土。',action(){startSeq(DIG);}},[boom]);
    const stick=new THREE.Group();
    {const s1=roundedBox(2.8,.5,.42,.07,yel());s1.position.set(1.1,0,0);stick.add(s1);
     const h=mm(new THREE.CylinderGeometry(.23,.23,.5,18),yel());h.rotation.x=Math.PI/2;stick.add(h);
     const lug=roundedBox(.36,.3,.3,.04,yel());lug.position.set(-.42,.25,0);stick.add(lug);const lug2=roundedBox(.3,.2,.3,.04,yel());lug2.position.set(.8,.3,0);stick.add(lug2);
     boom.add(stick);place(stick,V(4.3,.6,0),V(1.5,-.6,0));}
    defPart('stick',{name:'小臂',outside:true,text:'小臂把铲斗伸出去、收回来。',more:'小臂也叫斗杆，一根油缸拉着它前后摆。伸远一点能挖得远，收回来能挖得深。',action(){startSeq(DIG);}},[stick]);
    const bucket=new THREE.Group(),bk=new THREE.Group();bk.scale.x=-1;bucket.add(bk);let clump;
    {
      // 侧板：D 字形（顶边平、前口斜、底和背是弧线）
      const prof=new THREE.Shape();prof.moveTo(0,.05);prof.lineTo(.72,.05);prof.lineTo(.9,-.55);
      prof.quadraticCurveTo(.75,-.95,.3,-.9);prof.quadraticCurveTo(-.15,-.8,-.1,-.3);prof.quadraticCurveTo(-.08,-.05,0,.05);
      for(const z of [.42,-.47]){const sp=mm(new THREE.ExtrudeGeometry(prof,{depth:.05,bevelEnabled:false,curveSegments:16}),yel());sp.position.z=z;bk.add(sp);}
      // 弧形背板：沿着侧板的弧线走一圈的薄板
      const band=new THREE.Shape();band.moveTo(.9,-.55);band.quadraticCurveTo(.75,-.95,.3,-.9);band.quadraticCurveTo(-.15,-.8,-.1,-.3);band.quadraticCurveTo(-.08,-.05,0,.05);
      band.lineTo(.05,0);band.quadraticCurveTo(-.03,-.06,-.04,-.3);band.quadraticCurveTo(-.08,-.74,.3,-.84);band.quadraticCurveTo(.72,-.88,.85,-.5);band.lineTo(.9,-.55);
      const back=mm(new THREE.ExtrudeGeometry(band,{depth:.84,bevelEnabled:false,curveSegments:16}),steel(0x5c6470));back.position.z=-.42;bk.add(back);
      // 切削刃 + 斗齿
      const edge=roundedBox(.16,.05,.9,.01,steel(0x3a4150));edge.position.set(.9,-.57,0);edge.rotation.z=-.35;bk.add(edge);
      for(let i=0;i<4;i++){const t=mm(new THREE.ConeGeometry(.045,.22,6),steel(0x2b2f38));t.rotation.z=-Math.PI/2-.35;t.position.set(1.04,-.62,-.33+i*.22);bk.add(t);}
      const lug=roundedBox(.46,.26,.36,.05,yel());lug.position.set(.12,.06,0);bk.add(lug);
      clump=mm(new THREE.SphereGeometry(.4,12,9),flat(0xA8825A));clump.position.set(.42,-.45,0);clump.castShadow=false;clump.scale.setScalar(0);bk.add(clump);
      stick.add(bucket);place(bucket,V(2.4,0,0),V(1.3,-.5,0));
    }
    boom.rotation.z=REST.b1;stick.rotation.z=REST.b2;bucket.rotation.z=REST.b3;
    defPart('bucket',{name:'铲斗',outside:true,text:'铲斗像一只大手，一挖就是满满一斗土。',more:'铲斗前面有几颗尖尖的斗齿，硬土也能挖开。换成不同的斗，还能夹木头、碎石头。',action(){startSeq(DIG);}},[bucket]);

    /* ---- 液压油缸：真正跟着两端伸缩 ---- */
    const cylG=new THREE.Group(),cyls=[];
    function hyd(fromObj,fromLocal,toObj,toLocal,L){const g=new THREE.Group();const barrel=mm(new THREE.CylinderGeometry(.09,.09,L,14),dark(0x3a4150));barrel.position.y=L/2;g.add(barrel);
      const rod=mm(new THREE.CylinderGeometry(.05,.05,1,10),chrome());g.add(rod);const cap=mm(new THREE.SphereGeometry(.1,12,10),dark(0x3a4150));g.add(cap);
      cyls.push({g,rod,fromObj,fromLocal,toObj,toLocal,L});cylG.add(g);return g;}
    for(const s of [1,-1])hyd(upper,V(.95,.35,s*.62),boom,V(1.45,.55,s*.36),1.3);
    hyd(boom,V(1.9,1.7,0),stick,V(-.5,.28,0),2.1);
    hyd(stick,V(.8,.35,0),bucket,V(.02,.19,0),1.1);
    defPart('cyl',{name:'液压油缸',outside:true,hopTargets:[],text:'油缸里的油被推得很有劲，一伸一缩，大臂就动了。',more:'油缸里的油被泵压得很紧，推着活塞杆伸出去。一根手指粗的油管，能顶起几吨重的东西。',action(){startSeq(DIG);}},[cylG]);
    const _A=new THREE.Vector3(),_B=new THREE.Vector3(),_D=new THREE.Vector3(),_UP=new THREE.Vector3(0,1,0);
    function updCyls(){upper.updateWorldMatrix(true,true);for(const c of cyls){c.fromObj.localToWorld(_A.copy(c.fromLocal));c.toObj.localToWorld(_B.copy(c.toLocal));_D.subVectors(_B,_A);const len=_D.length();
      c.g.position.copy(_A);c.g.quaternion.setFromUnitVectors(_UP,_D.normalize());const rodL=Math.max(.1,len-c.L*.55);c.rod.scale.y=rodL;c.rod.position.y=c.L*.55+rodL/2;}}

    /* ---- 启动按钮（驾驶室旁的钥匙面板） ---- */
    const startG=new THREE.Group();let startBtn;
    {const plate=roundedBox(.18,.14,.28,.02,dark(0x262b35));plate.position.set(.45,.42,-.52);startG.add(plate);
     startBtn=mm(new THREE.CylinderGeometry(.045,.045,.02,16),new THREE.MeshStandardMaterial({color:0x4CC38A,emissive:0x4CC38A,emissiveIntensity:0,roughness:.4}));startBtn.rotation.x=Math.PI/2;startBtn.position.set(.45,.44,-.67);startBtn.userData.keepEm=true;startG.add(startBtn);
     upper.add(startG);place(startG,V(0,0,0),V(1.2,.6,-1.1));}
    defPart('start',{name:'启动按钮',outside:true,isStart:true,text:'按一下，挖掘机就醒过来啦！',more:'钥匙一拧，发动机启动，液压泵跟着转起来，油压上来以后大臂才能动。'},[startG]);

    /* ---- 掉落的土块 ---- */
    const clods={live:false,list:[]};
    for(let i=0;i<7;i++){const c=mm(new THREE.SphereGeometry(.09+Math.random()*.07,8,6),flat(0xA8825A));c.castShadow=false;c.visible=false;c.vel=new THREE.Vector3();c.t0=0;c.land=-1;scene.add(c);clods.list.push(c);}
    updCyls();
    /* ---- 每帧 ---- */
    let dotPh=0;
    function update(dt){
      const S=api.S,t=now(),drv=S.drive,ee=api.ee;
      // 动作序列
      if(X.seq){const sg=X.seq[X.seqI];X.seqT+=dt;const k=Math.min(1,X.seqT/sg.dur),e=k*k*(3-2*k);for(const key in X.to)X.cur[key]=X.from[key]+(X.to[key]-X.from[key])*e;if(k>=1)nextSeg();}
      // 拆开看时把臂举成展示姿势（按拆开进度混合）
      const P=X.cur,k=ee;boom.rotation.z=P.b1+(DISPLAY.b1-P.b1)*k;stick.rotation.z=P.b2+(DISPLAY.b2-P.b2)*k;bucket.rotation.z=P.b3+(DISPLAY.b3-P.b3)*k;upper.rotation.y=P.slew*(1-k);
      X.clump+=(X.clumpT-X.clump)*Math.min(1,dt*6);clump.scale.set(.75*X.clump,.5*X.clump,.85*X.clump);
      updCyls();
      // 司机推杆：动作序列进行时两根操纵杆前后摆，手跟着走
      X.drvK+=((X.seq?1:0)-X.drvK)*Math.min(1,dt*4);const la=.22*Math.sin(t/1000*3.2)*X.drvK;levers.forEach((lv,i)=>{lv.rotation.z=i?la:-la;});forearms.forEach((fa,i)=>{fa.rotation.z=(i?la:-la)*.9;});
      // 倒土：几块土从斗口掉到土堆上
      if(t-X.dumpAt<50&&!clods.live){clods.live=true;api.sfx.pour&&api.sfx.pour();bucket.updateWorldMatrix(true,false);
        for(let i=0;i<clods.list.length;i++){const c=clods.list[i];c.t0=t+i*70;c.vel.set(-.2+Math.random()*.4,-.3-Math.random()*.4,-.2+Math.random()*.4);c.land=-1;c.visible=false;}}
      if(clods.live){let any=false;for(const c of clods.list){if(t<c.t0){bucket.localToWorld(c.position.set(-.45+Math.random()*.2,-.15,-.3+Math.random()*.6));c.visible=false;any=true;continue;}
          if(c.land<0){c.visible=true;c.scale.setScalar(1);c.vel.y-=7*dt;c.position.addScaledVector(c.vel,dt);const top=pileTop(c.position.x,c.position.z);if(c.position.y<=top+.05){c.position.y=top+.05;c.land=t;}any=true;}
          else{const k2=(t-c.land)/700;if(k2<1){c.scale.setScalar(1-k2);any=true;}else c.visible=false;}}
        if(!any)clods.live=false;}
      if(t-X.scoopAt<50&&t-X.scoopAt>=0&&!X.scoopSaid){X.scoopSaid=true;api.sfx.scoop&&api.sfx.scoop();}if(t-X.scoopAt>100)X.scoopSaid=false;
      // 发动机 / 液压泵
      const engOn=(drv&&X.engineOn)||t<X.engUntil||!!X.seq,pumpOn=(drv&&X.pumpOn)||t<X.pumpUntil||!!X.seq;
      X.eng+=((engOn?1:0)-X.eng)*Math.min(1,dt*3);X.pump+=((pumpOn?1:0)-X.pump)*Math.min(1,dt*3);
      fanG.rotation.z+=dt*20*X.eng;house.position.y+=Math.sin(t*.06)*.006*X.eng;
      dotPh+=dt;hoseDots.forEach((d,i)=>{const u=(dotPh*.5+i/6)%1;hoseCurve.getPointAt(u,d.position);d.scale.setScalar(X.pump*(1-ee)*(.6+.4*Math.sin(u*Math.PI)));});
      // 履带：走两步再回来
      const driveOn=t<X.trackUntil;X.driveT=driveOn?-1.4:0;X.drive+=(X.driveT-X.drive)*Math.min(1,dt*1.5);const v=(X.driveT-X.drive)*1.5;
      root.position.x=X.drive;X.trackPh+=v*dt/ (2*3.6+2*Math.PI*.5);
      for(const c of cleats){const p=stadium(c.userData.u+X.trackPh);c.position.set(p.x,.1+.5+p.y+ (p.y>0?.05:-.05),c.userData.z);c.rotation.z=p.ang;}
      for(const w of sprockets)w.rotation.z-=v*dt/.44;
      startBtn.userData.dynInt=drv?1.3:0;
    }
    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){X.startOn=true}},
      {t:'发动机突突突转起来。',part:'engine',inner:true,on(){X.engineOn=true;api.sfx.loop('engine')}},
      {t:'液压泵把油推得很有劲，送到油缸。',part:'pump',inner:true,on(){X.pumpOn=true}},
      {t:'油缸一伸一缩，大臂小臂动起来。',part:'cyl',on(){startSeq(DIG,5);}},
      {t:'铲斗一挖，满满一斗土！',part:'bucket'},
      {t:'转个身，把土倒到旁边。',part:'body'},
    ];
    SCENES.excavator._dbg={X,startSeq,DIG,SWING,REST,DISPLAY,PIT,pitY,pileTop,boom,stick,bucket,upper,clods};
    ctx.linearize();
    return {update,chain,onStop(){X.startOn=X.engineOn=X.pumpOn=false;X.seq=null;X.reps=0;},onStart(){},onDone(){}};
  }
};
})();

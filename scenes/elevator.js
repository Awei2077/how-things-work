/* 场景：升降电梯（楼房剖面） */
window.SCENES=window.SCENES||{};
(function(){
const FLOOR_H=1.4,FLOORS=4,TOP_Y=FLOOR_H*FLOORS,CW_X=-.72,SHEAVE_R=.36;
const E={cabY:0,cabT:0,cabV:0,door:0,doorT:0,sheaveA:0,buffer:0,bufferT:0,btn:0,rideStep:0,rideUntil:0,slab:1,loopOn:false,loopAt:0};// slab:1 = 楼板一开始就是半透明的
let api=null;const now=()=>api.now();

SCENES.elevator={
  id:'elevator',title:'电梯',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  sky:'linear-gradient(180deg,#F8F5F0 0%,#EEE9E1 55%,#DED6CA 100%)',
  look:{srgb:true,hemi:.55,sun:.95,fill:.28,rim:.4,exposure:1.0,autoRotate:.10},
  envMap:['#f2f5f8','#ffffff','#ccd3da','#a8b0b8'],hemi:{sky:0xfff6ea,ground:0xb9ad9a},
  fit:{w:5.2,h:8.8,ty:3.1,tyEx:3.4,rEx:1.15},cameraStart:{theta:.35,phi:1.3},
  order:['cab','doors','machine','ropes','cw','rails','buffers','start','body'],
  go:{on:'坐电梯',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再坐一次！',done:'电梯就这样一趟一趟上上下下。',doneHintXray:'看，电机、钢绳、对重一起在忙。点「停下」再坐一次。',doneHint:'点「看里面」，看看是谁在拉电梯。'},
  intro:{icon:'cab',name:'电梯',text:'点一点电梯的零件，听听它叫什么。按「坐电梯」看轿厢怎么被拉上去。'},
  poster:{title:'电梯里面到底长什么样',sub:'天天坐，但你可能从没看过井道里面！',summary:'电机 + 钢绳 + 对重 = 轿厢上上下下！',angle:{theta:.35,phi:1.3},keys:['cab','machine','ropes','cw','rails','buffers']},

  env(ctx,_api){
    api=_api;const {THREE,scene,V,flat,matte,plastic,mm,roundedBox,glassMat,steel,canvasTex}=ctx;
    const occ=[];const reg=(o,extra)=>{o.updateWorldMatrix(true,true);const sp=new THREE.Box3().setFromObject(o).getBoundingSphere(new THREE.Sphere());o.userData.r=sp.radius;o.userData.cy=sp.center.y-o.position.y;o.userData.s0=o.scale.x;o.userData.k=1;Object.assign(o.userData,extra||{});occ.push(o);return o;};
    const marble=canvasTex(1024,1024,(g,w,h)=>{g.fillStyle='#EFEBE4';g.fillRect(0,0,w,h);g.strokeStyle='rgba(120,110,95,.14)';g.lineWidth=2;for(let i=1;i<16;i++){g.beginPath();g.moveTo(i*w/16,0);g.lineTo(i*w/16,h);g.stroke();g.beginPath();g.moveTo(0,i*h/16);g.lineTo(w,i*h/16);g.stroke();}});
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(18,18),new THREE.MeshStandardMaterial({map:marble,roughness:.5,metalness:.05}));floor.rotation.x=-Math.PI/2;floor.position.set(2.5,-.001,0);floor.receiveShadow=true;scene.add(floor);
    // 商场：整体放在电梯后面（-z 一侧），像中庭对面的一排楼层；每层从电梯厅接一条通道过去
    const mall=new THREE.Group();scene.add(mall);const plateM=()=>flat(0xE9E3D9),COLS=[0xFF8A80,0x64B5F6,0x81C784,0xFFD54F,0xBA68C8,0x4DB6AC];
    const ZR=-3.6,ZS=-5.7,XL=-4.6,XR=7.2;// 走廊前沿 / 商铺门脸 / 商场左右范围
    const railing=(len,cx,cz,alongX)=>{const rail=roundedBox(alongX?len:.04,.85,alongX?.04:len,.01,glassMat(0xcfe9ff,.35));rail.position.set(cx,0,cz);rail.castShadow=false;const cap=roundedBox(alongX?len+.05:.1,.05,alongX?.1:len+.05,.01,steel(0x8a929e));cap.position.set(cx,.45,cz);
      const g=new THREE.Group();g.add(rail,cap);const n=Math.max(2,Math.round(len/1.2));for(let k=0;k<=n;k++){const post=roundedBox(.05,.9,.05,.01,steel(0x8a929e));const t=k/n-.5;post.position.set(alongX?cx+t*len:cx,.02,alongX?cz:cz+t*len);g.add(post);}return g;};
    for(let f=0;f<FLOORS;f++){const y=f*FLOOR_H;
      if(f>0){
        const plate=roundedBox(XR-XL,.16,ZR-ZS,.03,plateM());plate.position.set((XL+XR)/2,y-.05,(ZR+ZS)/2);plate.receiveShadow=true;mall.add(plate);     // 走廊楼板
        const bridge=roundedBox(1.8,.16,2.0,.03,plateM());bridge.position.set(1.95,y-.05,-2.6);bridge.receiveShadow=true;mall.add(bridge);                   // 电梯厅 → 走廊
        for(const [len,cx] of [[1.05-XL,(XL+1.05)/2],[XR-2.85,(2.85+XR)/2]]){const r=railing(len,cx,ZR,true);r.position.y=y+.48;mall.add(r);}            // 走廊前沿栏板
        for(const x of [1.05,2.85]){const r=railing(2.0,x,-2.6,false);r.position.y=y+.48;mall.add(r);}                                                        // 通道两侧栏板
      }
      for(const [i,x] of [-3.0,0,3.0,6.0].entries()){const col=COLS[(f*4+i)%6];
        const back=roundedBox(2.9,1.22,.6,.03,flat(0xF7F4EE));back.position.set(x,y+.61,ZS-.3);mall.add(back);
        const glass=roundedBox(2.3,.78,.06,.02,glassMat(0xbfe3ff,.45));glass.position.set(x,y+.45,ZS+.03);glass.castShadow=false;mall.add(glass);
        const sign=roundedBox(2.6,.3,.14,.03,flat(col));sign.position.set(x,y+1.02,ZS+.05);mall.add(sign);
        const logo=mm(new THREE.CylinderGeometry(.1,.1,.03,20),flat(0xffffff));logo.rotation.x=Math.PI/2;logo.position.set(x,y+1.02,ZS+.13);mall.add(logo);
        const sill=roundedBox(2.6,.08,.16,.02,flat(col));sill.position.set(x,y+.06,ZS+.05);mall.add(sill);
        for(const sd of [1,-1]){const pier=roundedBox(.3,1.22,.2,.03,flat(0xE2D8CC));pier.position.set(x+sd*1.4,y+.61,ZS-.1);mall.add(pier);}}
    }
    mall.traverse(o=>{if(o.isMesh&&!(o.material.transparent))o.castShadow=true;});
    reg(mall,{hideOnExplode:true,duck:'fade',c:new THREE.Vector3(1,3,ZS-.4),n:V(0,0,1)});
    // 绿植 + 长椅：都放在后面，电梯前面留空
    const plant=(x,z)=>{const g=new THREE.Group();const pot=mm(new THREE.CylinderGeometry(.3,.24,.5,14),plastic(0xE0876A));pot.position.y=.25;g.add(pot);
      for(let i=0;i<7;i++){const a=i/7*6.28,l=mm(new THREE.SphereGeometry(.2,8,6),flat([0x5DBB63,0x4CA85A,0x7CC576][i%3]));l.scale.set(1,1.6,.6);l.position.set(Math.cos(a)*.18,.85+(i%2)*.12,Math.sin(a)*.18);l.rotation.y=-a;g.add(l);}
      g.position.set(x,0,z);scene.add(g);reg(g,{hideOnExplode:true});return g;};
    plant(-2.6,-3.0);plant(4.6,-3.0);
    const bench=new THREE.Group();{const seat=roundedBox(1.6,.08,.5,.03,flat(0xC49A6C));seat.position.y=.45;bench.add(seat);for(const x of [-.65,.65]){const leg=roundedBox(.08,.42,.45,.02,steel(0x6b7280));leg.position.set(x,.21,0);bench.add(leg);}
      bench.position.set(1.0,0,-3.0);scene.add(bench);reg(bench,{hideOnExplode:true});}
    return {occluders:occ,update(){}};
  },

  build(ctx,_api){
    api=_api;ctx=RIG.upgrade(ctx);const {THREE,V,mm,roundedBox,capsule,tubeM,pathTube,chrome,steel,dark,matte,flat,plastic,glassMat,place,defPart,markShell,root}=ctx;
    const H=TOP_Y+1.1;
    /* ---- 楼房（外壳）：后墙、两侧墙、楼板、机房 ---- */
    const shell=new THREE.Group();
    {
      const wallM=()=>flat(0xD9D3C8,{roughness:.95});
      const PIT=.7,gm=()=>glassMat(0xcfe9ff,.22),fm=()=>steel(0x8a929e);
      const back=roundedBox(.05,H+PIT,2.4,.02,gm());back.position.set(-1.08,(H-PIT)/2,0);back.castShadow=false;back.userData.glass=true;shell.add(back);
      for(const z of [1.2,-1.2]){const side=roundedBox(2.2,H+PIT,.05,.02,gm());side.position.set(0,(H-PIT)/2,z);side.castShadow=false;side.userData.glass=true;shell.add(side);}
      for(const [x,z] of [[-1.1,1.22],[-1.1,-1.22],[1.06,1.22],[1.06,-1.22]]){const post=roundedBox(.12,H+PIT,.12,.02,fm());post.position.set(x,(H-PIT)/2,z);shell.add(post);}
      for(let f=0;f<=FLOORS;f++){const y=f*FLOOR_H;const mb=roundedBox(.08,.08,2.44,.02,fm());mb.position.set(-1.1,y+.02,0);shell.add(mb);for(const z of [1.22,-1.22]){const ms=roundedBox(2.2,.08,.08,.02,fm());ms.position.set(-.02,y+.02,z);shell.add(ms);}}
      const pit=roundedBox(2.2,.12,2.4,.03,flat(0xB9B2A6));pit.position.set(0,-PIT-.06,0);shell.add(pit);
      const landing=[];const L=m=>{landing.push(m);return m;};
      for(let f=0;f<FLOORS;f++){const y=f*FLOOR_H;
        const slab=L(roundedBox(1.8,.16,3.2,.03,flat(0xEAE4D8)));slab.position.set(1.95,y-.05,0);slab.receiveShadow=true;shell.add(slab);
        const sill=L(roundedBox(.12,.06,2.2,.02,steel(0xb7bec8)));sill.position.set(1.06,y+.05,0);shell.add(sill);
        // 厅门框 + 楼层小灯
        for(const z of [.95,-.95]){const post=L(roundedBox(.14,1.1,.14,.03,flat(0xC9C2B6)));post.position.set(1.05,y+.55,z);shell.add(post);}
        const lintel=L(roundedBox(.14,.12,2.04,.03,flat(0xC9C2B6)));lintel.position.set(1.05,y+1.16,0);shell.add(lintel);
        const num=mm(new THREE.BoxGeometry(.02,.16,.24),new THREE.MeshStandardMaterial({color:0x1b2a44,emissive:0xff8a3d,emissiveIntensity:.6,roughness:.4}));num.position.set(1.12,y+1.3,0);num.userData.keepEm=true;shell.add(L(num));
      }
      const roof=roundedBox(2.4,.18,2.6,.03,flat(0xC9C2B6));roof.position.set(0,H+.09,0);shell.add(roof);
      const machineFloor=roundedBox(2.2,.12,2.4,.03,flat(0xB9B2A6));machineFloor.position.set(0,TOP_Y+.06,0);shell.add(machineFloor);
      // 机房层前沿护栏
      for(const z of [1.05,-1.05]){shell.add(tubeM(V(.95,TOP_Y+.12,z),V(.95,TOP_Y+.7,z),.02,steel()));}shell.add(tubeM(V(.95,TOP_Y+.7,1.05),V(.95,TOP_Y+.7,-1.05),.02,steel()));
      markShell(shell);place(shell,V(0,0,0),V(-.9,0,0));shell.userData.landing=landing;
    }
    defPart('body',{name:'楼房',more:'电梯井道是楼房里一条贯穿上下的竖井。观光电梯的井道用玻璃做，坐的时候能看到外面。',outside:true,text:'电梯住在楼房中间这条竖竖的井道里，一层一层往上爬。'},[shell]);

    /* ---- 导轨 ---- */
    const rails=new THREE.Group();
    {for(const z of [.9,-.9]){const r=roundedBox(.1,TOP_Y+.9,.08,.02,steel(0x9aa2ad));r.position.set(-.2,(TOP_Y+.9)/2,z);rails.add(r);
       for(let y=.4;y<TOP_Y+.8;y+=1.4){const br=roundedBox(.5,.06,.06,.01,steel(0x6b7280));br.position.set(-.5,y,z*1.06);rails.add(br);}}
     for(const z of [.35,-.35]){const r=roundedBox(.06,TOP_Y+.7,.06,.01,steel(0x9aa2ad));r.position.set(CW_X-.3,(TOP_Y+.7)/2,z);rails.add(r);}
     place(rails,V(0,0,0),V(0,0,0));}
    defPart('rails',{name:'导轨',more:'导轨是固定在井道墙上的钢轨，轿厢和对重都沿着它走，所以不会左右晃。',text:'两根长长的轨道，轿厢扶着它上下，不会晃。'},[rails]);

    /* ---- 轿厢 ---- */
    const cab=new THREE.Group(),doorsG=new THREE.Group(),doorL=new THREE.Group(),doorR=new THREE.Group();
    {const wall=plastic(0xE9EEF3);
     const floor=roundedBox(1.2,.08,1.3,.02,plastic(0x8fa4b8));floor.position.set(0,.04,0);cab.add(floor);
     const ceil=roundedBox(1.2,.08,1.3,.02,wall);ceil.position.set(0,1.22,0);cab.add(ceil);
     const cg=()=>glassMat(0xd9efff,.25);
     const backW=roundedBox(.04,1.14,1.3,.01,cg());backW.position.set(-.57,.65,0);backW.castShadow=false;backW.userData.glass=true;cab.add(backW);
     for(const z of [.62,-.62]){const sw=roundedBox(1.2,1.14,.04,.01,cg());sw.position.set(0,.65,z);sw.castShadow=false;sw.userData.glass=true;cab.add(sw);}
     for(const [x,z] of [[-.58,.63],[-.58,-.63],[.58,.63],[.58,-.63]]){const p=roundedBox(.06,1.14,.06,.01,steel(0x8a929e));p.position.set(x,.65,z);cab.add(p);}
     for(const z of [.63,-.63]){const b=roundedBox(1.2,.05,.06,.01,steel(0x8a929e));b.position.set(0,.55,z);cab.add(b);}
     const lamp=mm(new THREE.BoxGeometry(.6,.02,.6),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xFFF3D6,emissiveIntensity:1.2}));lamp.position.set(0,1.17,0);lamp.userData.keepEm=true;lamp.castShadow=false;cab.add(lamp);
     const rail=tubeM(V(-.5,.6,-.55),V(-.5,.6,.55),.02,chrome());cab.add(rail);
     const panel=mm(new THREE.BoxGeometry(.02,.5,.16),plastic(0x9aa2ad));panel.position.set(-.53,.75,-.45);cab.add(panel);
     for(let i=0;i<4;i++){const b=mm(new THREE.CylinderGeometry(.03,.03,.01,10),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x8fd3ff,emissiveIntensity:.5}));b.rotation.z=Math.PI/2;b.position.set(-.515,.6+i*.1,-.45);b.userData.keepEm=true;cab.add(b);}
     const cross=roundedBox(.7,.12,1.2,.02,steel(0x6b7280));cross.position.set(0,1.32,0);cab.add(cross);
     for(const z of [.25,-.25]){const hook=mm(new THREE.CylinderGeometry(.03,.03,.18,10),steel());hook.position.set(0,1.45,z);cab.add(hook);}
     // 门：两扇滑门装在轿厢前面
     for(const [g,s] of [[doorL,1],[doorR,-1]]){const d=roundedBox(.05,1.12,.58,.02,plastic(0xC9D2DC));d.position.set(0,.63,s*.3);g.add(d);const line=mm(new THREE.BoxGeometry(.055,1.0,.01),dark(0x8592a0));line.position.set(0,.63,s*.02);g.add(line);doorsG.add(g);}
     place(doorsG,V(.62,0,0),V(1.5,.2,0));// 拆开时门从轿厢前面飞出去
     place(cab,V(0,0,0),V(1.0,0,0));cab.add(doorsG);}
    defPart('cab',{name:'轿厢',more:'轿厢是一个封闭的金属房间，靠导靴扶着导轨上下。里面有按钮、灯、扶手和应急电话。',outside:true,text:'我们坐的小房子，扶着导轨上上下下。',action(){E.rideStep=1;E.rideUntil=now()+6000;}},[cab]);
    defPart('doors',{name:'门',more:'电梯有两层门：轿厢门和每层楼的厅门。只有轿厢到位时，两层门才一起打开。',outside:true,text:'到了楼层，门才打开。夹到手可不行！',action(){E.doorT=E.doorT?0:1;}},[doorsG]);

    /* ---- 曳引机（电机 + 大轮） ---- */
    const machine=new THREE.Group(),sheave=new THREE.Group();
    {const base=roundedBox(1.3,.14,.9,.03,steel(0x454c5a));base.position.set(-.36,TOP_Y+.19,0);machine.add(base);
     const mot=mm(new THREE.CylinderGeometry(.24,.24,.55,24),steel(0x525a68));mot.rotation.x=Math.PI/2;mot.position.set(-.36,TOP_Y+.55,.55);machine.add(mot);
     const box=roundedBox(.5,.4,.4,.04,steel(0x6b7280));box.position.set(-.36,TOP_Y+.48,-.25);machine.add(box);
     const wheel=mm(new THREE.CylinderGeometry(SHEAVE_R,SHEAVE_R,.12,40),steel(0xb7bec8));wheel.rotation.x=Math.PI/2;sheave.add(wheel);
     for(let k=0;k<6;k++){const sp=mm(new THREE.BoxGeometry(.06,SHEAVE_R*1.7,.04),steel(0x6b7280));sp.rotation.z=k*Math.PI/6;sheave.add(sp);}
     const hub=mm(new THREE.CylinderGeometry(.08,.08,.2,16),steel(0x454c5a));hub.rotation.x=Math.PI/2;sheave.add(hub);
     sheave.position.set(-.36,TOP_Y+.62,.15);machine.add(sheave);
     place(machine,V(0,0,0),V(0,.8,0));}
    defPart('machine',{name:'曳引机',more:'曳引机装在井道顶上，电机转动曳引轮，钢丝绳靠摩擦力被带动。它还有刹车，停电也能抱住。',text:'顶上的电机转动大轮子，钢绳就跟着走。',action(){E.rideStep=1;E.rideUntil=now()+6000;}},[machine]);

    /* ---- 钢丝绳 ---- */
    const ropes=new THREE.Group(),ropeCab=[],ropeCw=[];
    {const rm=steel(0x5c6470);for(const z of [.25,.15,.05]){const r=mm(new THREE.CylinderGeometry(.014,.014,1,8),rm);ropes.add(r);ropeCab.push(r);const r2=mm(new THREE.CylinderGeometry(.014,.014,1,8),rm);ropes.add(r2);ropeCw.push(r2);}
     place(ropes,V(0,0,0),V(0,0,0));}
    defPart('ropes',{name:'钢丝绳',more:'一般有好几根钢丝绳并排，每一根都能单独吊住轿厢，非常安全。',text:'好几根粗粗的钢绳，把轿厢吊得稳稳的。'},[ropes]);

    /* ---- 对重 ---- */
    const cw=new THREE.Group();
    {const frame=roundedBox(.36,1.5,.9,.03,steel(0x6b7280));frame.position.set(0,.75,0);cw.add(frame);
     for(let i=0;i<5;i++){const blk=roundedBox(.3,.24,.8,.02,dark(0x3a4150));blk.position.set(0,.2+i*.27,0);cw.add(blk);}
     for(const z of [.2,-.2]){const hook=mm(new THREE.CylinderGeometry(.03,.03,.16,10),steel());hook.position.set(0,1.58,z);cw.add(hook);}
     place(cw,V(CW_X,0,0),V(-.6,0,0));}
    defPart('cw',{name:'对重',more:'对重的重量差不多等于轿厢加一半乘客。它和轿厢一上一下，电机只用出很小的力。',text:'轿厢往上它就往下，像跷跷板，帮电机省力气。',action(){E.rideStep=1;E.rideUntil=now()+6000;}},[cw]);

    /* ---- 缓冲器 ---- */
    const buffers=new THREE.Group(),bufSprings=[];
    {const helix=(x,z)=>{const P=[];const n=30;for(let i=0;i<=n;i++){const t=i/n;P.push(V(x+Math.cos(t*Math.PI*10)*.1,.05+.5*t,z+Math.sin(t*Math.PI*10)*.1));}const s=pathTube(P,.02,steel(0xb7bec8),100);s.position.set(0,0,0);return s;};
     for(const [x,z] of [[.2,.4],[.2,-.4],[CW_X,0]]){const g=new THREE.Group();g.add(helix(0,0));const base=mm(new THREE.CylinderGeometry(.16,.16,.05,16),steel(0x454c5a));base.position.y=.03;g.add(base);const cap=mm(new THREE.CylinderGeometry(.14,.14,.04,16),steel(0x6b7280));cap.position.y=.56;g.add(cap);g.position.set(x,0,z);buffers.add(g);bufSprings.push(g);}
     place(buffers,V(0,-.65,0),V(0,-.02,.9));}
    defPart('buffers',{name:'缓冲器',more:'缓冲器装在最底下的底坑里，万一轿厢冲到底，弹簧把它接住。',text:'万一掉下来，这几个大弹簧会稳稳接住它。',action(){E.bufferT=1;setTimeout(()=>E.bufferT=0,900);}},[buffers]);

    /* ---- 呼叫按钮（一楼） ---- */
    const startG=new THREE.Group();let startBtn;
    {const plate=roundedBox(.04,.3,.18,.02,plastic(0xC9D2DC));plate.position.set(1.14,.95,1.12);startG.add(plate);
     startBtn=mm(new THREE.CylinderGeometry(.05,.05,.02,16),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xFFB020,emissiveIntensity:0,roughness:.4}));startBtn.rotation.z=Math.PI/2;startBtn.position.set(1.17,1.0,1.12);startBtn.userData.keepEm=true;startG.add(startBtn);
     const arrow=mm(new THREE.ConeGeometry(.03,.05,3),dark());arrow.position.set(1.17,.88,1.12);arrow.rotation.z=-Math.PI/2;startG.add(arrow);
     place(startG,V(0,0,0),V(.5,0,.4));}
    defPart('start',{name:'按钮',more:'按下按钮，电梯电脑记住你在几楼，安排轿厢过来，到了再开门。',outside:true,isStart:true,text:'按一下，电梯就来啦！'},[startG]);

    /* ---- 小朋友（在一楼等电梯，不可点） ---- */
    const kid=new THREE.Group();
    {const body=capsule(.13,.26,matte(0xFFB020),12);body.rotation.z=Math.PI/2;body.position.y=.42;kid.add(body);
     const head=mm(new THREE.SphereGeometry(.15,14,10),matte(0xF6D2B0));head.position.y=.78;kid.add(head);
     const hair=mm(new THREE.SphereGeometry(.15,14,8,0,Math.PI*2,0,Math.PI/2),matte(0x2b2b2b));hair.position.y=.8;kid.add(hair);
     for(const z of [.07,-.07]){const leg=mm(new THREE.CylinderGeometry(.045,.045,.26,8),matte(0x3a63b8));leg.position.set(0,.13,z);kid.add(leg);}
     for(const z of [.17,-.17]){const arm=mm(new THREE.CylinderGeometry(.035,.035,.26,8),matte(0xFFB020));arm.position.set(0,.45,z);arm.rotation.x=z>0?-.3:.3;kid.add(arm);}
     kid.position.set(1.9,.03,.5);kid.rotation.y=Math.PI/2+.3;root.add(kid);}
    const K={x:1.9,z:.5,floorY:.03,tx:1.9,tz:.5,inCab:false,toCab:false,exitPending:false,legs:kid.children.filter((c,i)=>i===3||i===4)};
    function kidReset(){K.inCab=false;K.toCab=false;K.exitPending=false;K.floorY=.03;K.x=1.9;K.z=.5;K.tx=1.9;K.tz=.5;}
    function kidEnter(){K.toCab=true;K.tx=.05;K.tz=.1;}
    function kidExit(){K.inCab=false;K.x=cab.position.x+.05;K.z=.1;K.floorY=cab.position.y+.05;K.tx=1.9;K.tz=.5;}

    /* ---- 每帧 ---- */
    function update(dt){
      const S=api.S,t=now(),drv=S.drive;
      // 自动短途：点轿厢/电机/对重 → 上一层再回来
      if(!drv&&E.rideStep){if(E.rideStep===1){E.cabT=FLOOR_H;if(Math.abs(E.cabY-E.cabT)<.02){E.rideStep=2;E.rideAt=t;}}
        else if(E.rideStep===2&&t-E.rideAt>900){E.cabT=0;if(Math.abs(E.cabY)<.02)E.rideStep=0;}}
      // 轿厢运动：限速平滑
      const dy=E.cabT-E.cabY,vmax=1.15;const want=Math.sign(dy)*Math.min(vmax,Math.abs(dy)*2.2);E.cabV+=(want-E.cabV)*Math.min(1,dt*3);
      const step=E.cabV*dt;if(Math.abs(step)>Math.abs(dy))E.cabY=E.cabT;else E.cabY+=step;
      E.sheaveA-=(E.cabV*dt)/SHEAVE_R;sheave.rotation.z=E.sheaveA;
      cab.position.y+=E.cabY;const cwY=TOP_Y-1.75-E.cabY;cw.position.y+=cwY;
      // 钢绳：从大轮到轿厢顶 / 到对重顶
      const topY=TOP_Y+.62+SHEAVE_R;
      ropeCab.forEach((r,i)=>{const y0=cab.position.y+1.5,len=Math.max(.05,topY-y0);r.scale.y=len;r.position.set(cab.position.x,y0+len/2,.15-.1+[.1,0,-.1][i]);});
      ropeCw.forEach((r,i)=>{const y0=cw.position.y+1.66,len=Math.max(.05,topY-y0);r.scale.y=len;r.position.set(cw.position.x,y0+len/2,.15-.1+[.1,0,-.1][i]);});
      // 门（状态变化时发滑门声）
      if(E.doorT!==E.lastDoorT){if(E.lastDoorT!==undefined)api.sfx.slide();E.lastDoorT=E.doorT;}
      E.door+=(E.doorT-E.door)*Math.min(1,dt*4);doorL.position.z=E.door*.5;doorR.position.z=-E.door*.5;
      // 缓冲器压缩
      E.buffer+=(E.bufferT-E.buffer)*Math.min(1,dt*6);for(const g of bufSprings)g.scale.y=1-E.buffer*.45;
      startBtn.userData.dynInt=(drv||E.rideStep)?1.4:0;
      // 小朋友
      if(K.inCab){kid.position.set(cab.position.x+.05,cab.position.y+.08,.1);kid.rotation.y=Math.PI/2;}
      else{const dx=K.tx-K.x,dz=K.tz-K.z,d=Math.hypot(dx,dz);let moving=false;
        if(d>.02){const st=Math.min(d,dt*1.1);K.x+=dx/d*st;K.z+=dz/d*st;kid.rotation.y=Math.atan2(dx,dz);moving=true;}
        else if(K.toCab){K.toCab=false;K.inCab=true;E.doorT=0;}
        kid.position.set(K.x,K.floorY+(moving?Math.abs(Math.sin(t*.012))*.04:0),K.z);
        for(const [i,l] of K.legs.entries())l.rotation.x=moving?Math.sin(t*.012+i*Math.PI)*.5:0;}
      if(E.exitPending&&Math.abs(E.cabY-E.cabT)<.02&&Math.abs(E.cabV)<.05){E.exitPending=false;api.sfx.stopLoop();api.sfx.ding();E.doorT=1;setTimeout(kidExit,700);}
      /* 循环：走出来站一会儿 → 再走进去 → 门关上 → 去另一层 → 再走出来，一直上上下下 */
      if(drv&&E.loopOn&&!E.exitPending){
        const TOP=FLOOR_H*2;
        const settled=!K.inCab&&!K.toCab&&Math.abs(K.x-K.tx)<.05&&Math.abs(K.z-K.tz)<.05;
        if(settled){
          if(!E.loopAt)E.loopAt=t+1800;
          else if(t>=E.loopAt){E.loopAt=0;E.doorT=1;kidEnter();}
        }else if(K.inCab&&E.doorT===0&&E.door<.08&&Math.abs(E.cabY-E.cabT)<.02){// 必须等门真的关上（doorT 已置 0）再走，否则刚到站就把人又带走了
          E.cabT=(E.cabT>TOP*.5)?0:TOP;api.sfx.loop('hum');E.exitPending=true;
        }
      }
      // 楼板平时是半透明的（省得挡着看轿厢上上下下），只有小朋友到了三楼、走出电梯以后才变成实的
      const arrived=!K.inCab&&!K.toCab&&K.floorY>.5;
      const seeThru=arrived?0:1;
      E.slab+=(seeThru-E.slab)*Math.min(1,dt*2.2);
      for(const m of shell.userData.landing)m.userData.baseOp=1-.78*E.slab;// 交给引擎去算透明度（看里面时会再叠一层）
    }
    const chain=[
      {t:'按一下按钮，电梯就来啦。',part:'start',on(){E.rideStep=0;E.cabT=0;kidReset();setTimeout(()=>{E.doorT=1;},500);}},
      {t:'门开了，小朋友走进去。',part:'doors',on(){kidEnter();}},
      {t:'顶上的电机转动大轮子。',part:'machine',on(){api.sfx.loop('hum');}},
      {t:'钢绳拉着轿厢往上，对重就往下。',part:'ropes',on(){E.cabT=FLOOR_H*2;}},
      {t:'到三楼啦！叮——门打开，小朋友走出来。',part:'cab',on(){E.exitPending=true;E.loopOn=true;E.loopAt=0;}},
    ];
    SCENES.elevator._dbg={E,K,kidEnter,kidExit,kidReset};
    ctx.linearize();
    return {update,chain,hideOnExplode:[...shell.userData.landing,kid],onStop(){E.doorT=0;E.rideStep=0;E.cabT=0;E.exitPending=false;E.loopOn=false;E.loopAt=0;kidReset();},onStart(){},onDone(){}};
  }
};
})();

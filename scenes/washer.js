/* 场景：滚筒洗衣机（家里的洗衣角） */
window.SCENES=window.SCENES||{};
(function(){
const M={drumW:0,drumDir:1,flipT:0,level:0,levelT:0,door:0,doorT:0,drawer:0,drawerT:0,inlet:0,inletT:0,drain:0,drainT:0,tubShake:0,
  drumUntil:0,spinUntil:0,inletUntil:0,drainUntil:0,motorUntil:0,shakeUntil:0,fillOn:false,soapOn:false,washOn:false,drainOn:false,spinOn:false};
let api=null;const now=()=>api.now();
const TUB_C={x:.05,y:1.3};

SCENES.washer={
  id:'washer',title:'洗衣机',subtitle:'拖一拖转圈 · 点零件听听',night:false,
  sky:'linear-gradient(180deg,#F7F1E8 0%,#EDE4D6 55%,#E2D7C6 100%)',
  look:{srgb:true,hemi:.55,sun:.95,fill:.28,rim:.4,exposure:1.0,autoRotate:.10},
  envMap:['#f2f5f8','#ffffff','#ccd3da','#a8b0b8'],hemi:{sky:0xfff6ea,ground:0xb9ad9a},
  fit:{w:4.8,h:4.6,ty:1.3,tyEx:1.9,rEx:1.25},cameraStart:{theta:.8,phi:1.22},
  order:['door','drum','tub','motor','inlet','drawer','pump','springs','start','body'],
  go:{on:'开始洗',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再洗一次！',done:'洗好啦！衣服干干净净。',doneHintXray:'看，里面的水和筒都忙完了。点「停下」再来一次。',doneHint:'点「看里面」，看看水和电机在哪儿。'},
  intro:{icon:'body',name:'洗衣机',text:'点一点洗衣机的零件，听听它叫什么。按「开始洗」看水怎么进、筒怎么转。'},
  poster:{title:'洗衣机里面到底长什么样',sub:'每天都用，但你可能从没看过它的内部！',summary:'水 + 洗衣液 + 翻滚摩擦 = 衣服干净！',angle:{theta:.9,phi:1.2},keys:['drum','tub','motor','pump','inlet','springs']},

  env(ctx,_api){
    api=_api;const {THREE,scene,V,flat,matte,plastic,mm,roundedBox,glassMat,canvasTex,rngFactory}=ctx;
    const occ=[];const reg=(o,extra)=>{o.updateWorldMatrix(true,true);const sp=new THREE.Box3().setFromObject(o).getBoundingSphere(new THREE.Sphere());o.userData.r=sp.radius;o.userData.cy=sp.center.y-o.position.y;o.userData.s0=o.scale.x;o.userData.k=1;Object.assign(o.userData,extra||{});occ.push(o);return o;};
    const RX=-1.7,RW=6.4,RD=8.2,WH=3.2,CX=RX+RW/2;
    const tile=canvasTex(1024,1024,(g,w,h)=>{g.fillStyle='#EEE8DE';g.fillRect(0,0,w,h);g.strokeStyle='rgba(120,105,85,.16)';g.lineWidth=2;for(let i=1;i<24;i++){g.beginPath();g.moveTo(i*w/24,0);g.lineTo(i*w/24,h);g.stroke();g.beginPath();g.moveTo(0,i*h/24);g.lineTo(w,i*h/24);g.stroke();}});
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(RW,RD),new THREE.MeshStandardMaterial({map:tile,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.set(CX,0,0);floor.receiveShadow=true;scene.add(floor);
    const rug=new THREE.Mesh(new THREE.CircleGeometry(2.2,48),flat(0xD9C7B0));rug.rotation.x=-Math.PI/2;rug.position.set(.6,.008,0);rug.receiveShadow=true;scene.add(rug);
    // 四面墙：镜头转到墙外时整面淡出
    const wall=(w,d,x,z,n)=>{const g=new THREE.Group();const m=roundedBox(w,WH,d,.02,flat(0xF3EFE8,{roughness:.95}));m.position.y=WH/2;m.receiveShadow=true;g.add(m);
      const band=roundedBox(w>d?w:.05,1.15,w>d?.05:d,.01,flat(0xD6E6EC));band.position.set(n.x*.07,.58,n.z*.07);g.add(band);
      const base=roundedBox(w>d?w:.07,.12,w>d?.07:d,.01,flat(0xE2D8CC));base.position.set(n.x*.08,.06,n.z*.08);g.add(base);
      g.position.set(x,0,z);scene.add(g);reg(g,{duck:'fade',c:new THREE.Vector3(x,WH/2,z),n});return g;};
    const backWall=wall(.12,RD,RX,0,V(1,0,0)),leftWall=wall(RW,.12,CX,-RD/2,V(0,0,1)),rightWall=wall(RW,.12,CX,RD/2,V(0,0,-1));wall(.12,RD,RX+RW,0,V(-1,0,0));
    // 后墙：窗 + 窗帘 + 搁板
    {const fr=roundedBox(.12,1.3,1.6,.03,plastic(0xffffff));fr.position.set(.05,2.05,1.7);backWall.add(fr);
     const gl=roundedBox(.05,1.1,1.4,.02,new THREE.MeshStandardMaterial({color:0xBFE3FF,emissive:0xBFE3FF,emissiveIntensity:.35,roughness:.2}));gl.position.set(.1,2.05,1.7);gl.castShadow=false;backWall.add(gl);
     const bar=mm(new THREE.BoxGeometry(.03,.9,.03),plastic(0xffffff));bar.position.set(.12,2.05,1.7);backWall.add(bar);const bar2=mm(new THREE.BoxGeometry(.03,.03,1.3),plastic(0xffffff));bar2.position.set(.12,2.05,1.7);backWall.add(bar2);
     for(const s of [1,-1]){const cur=roundedBox(.1,1.5,.42,.04,matte(0xF9D9C4));cur.position.set(.14,2.0,1.7+s*.95);backWall.add(cur);}
     const shelf=roundedBox(.5,.05,1.7,.02,flat(0xC49A6C));shelf.position.set(.3,2.95,-1.6);backWall.add(shelf);
     for(const [z,c] of [[-2.2,0x5BB8F5],[-1.9,0xFF6B6B]]){const b=roundedBox(.2,.4,.14,.04,plastic(c));b.position.set(.3,3.18,z);backWall.add(b);}
     let y=3.0;for(const c of [0xFFF1CC,0x9fd3ff]){const t=roundedBox(.42,.09,.5,.03,matte(c));t.position.set(.3,y+.045,-1.1);backWall.add(t);y+=.09;}
     const pic=roundedBox(.05,.6,.8,.02,flat(0xFFF6E5));pic.position.set(.08,2.2,-.9);backWall.add(pic);const pic2=roundedBox(.03,.46,.66,.01,flat(0x8FD17A));pic2.position.set(.1,2.2,-.9);backWall.add(pic2);}
    // 左墙：门
    {const door=roundedBox(1.0,2.15,.1,.03,flat(0xA67C52));door.position.set(2.2,1.08,.1);leftWall.add(door);const kn=mm(new THREE.SphereGeometry(.05,10,8),plastic(0xE8E8EC));kn.position.set(2.6,1.05,.18);leftWall.add(kn);
     const sw=roundedBox(.12,.18,.06,.02,plastic(0xffffff));sw.position.set(1.5,1.4,.1);leftWall.add(sw);}
    // 右墙：挂衣绳
    {const rope=mm(new THREE.CylinderGeometry(.012,.012,3.6,8),flat(0x8B5A2B));rope.rotation.z=Math.PI/2;rope.position.set(1.9,2.4,-.1);rightWall.add(rope);
     for(const [x,c,w] of [[.8,0xFF6B6B,.5],[1.6,0x5BB8F5,.4],[2.4,0xFFD740,.55],[3.1,0xffffff,.4]]){const cl=roundedBox(w,.7,.04,.03,matte(c));cl.position.set(x,2.02,-.12);rightWall.add(cl);}}
    // 杂物：拆开时收起
    const basket=new THREE.Group();{const b=mm(new THREE.CylinderGeometry(.42,.36,.9,18,1,true),flat(0xC8A46B,{side:THREE.DoubleSide}));b.position.y=.45;basket.add(b);
      const bot=mm(new THREE.CylinderGeometry(.36,.36,.04,18),flat(0xB08E57));bot.position.y=.02;basket.add(bot);
      for(const [c,x,z,y] of [[0x5BB8F5,.05,.1,.95],[0xFF6B6B,-.15,-.05,.9],[0xFFD740,.15,-.15,.88],[0xffffff,-.05,.18,.98]]){const cl=mm(new THREE.SphereGeometry(.17,10,8),matte(c));cl.scale.y=.6;cl.position.set(x,y,z);basket.add(cl);}
      basket.position.set(1.4,0,1.9);basket.userData.hideOnExplode=true;scene.add(basket);reg(basket);}
    const plant=new THREE.Group();{const pot=mm(new THREE.CylinderGeometry(.26,.2,.36,14),plastic(0xE0876A));pot.position.y=.18;plant.add(pot);
      const soil=mm(new THREE.CylinderGeometry(.24,.24,.04,14),flat(0x5a4632));soil.position.y=.36;plant.add(soil);
      for(let i=0;i<6;i++){const a=i/6*6.28,l=mm(new THREE.SphereGeometry(.16,8,6),flat([0x5DBB63,0x4CA85A,0x7CC576][i%3]));l.scale.set(1,1.5,.6);l.position.set(Math.cos(a)*.15,.62+(i%2)*.1,Math.sin(a)*.15);l.rotation.y=-a;plant.add(l);}
      plant.position.set(-1.1,0,-2.4);plant.userData.hideOnExplode=true;scene.add(plant);reg(plant);}
    const stool=new THREE.Group();{const top=roundedBox(.7,.08,.5,.03,flat(0xC49A6C));top.position.y=.5;stool.add(top);
      for(const [x,z] of [[-.28,-.18],[.28,-.18],[-.28,.18],[.28,.18]]){const leg=mm(new THREE.CylinderGeometry(.03,.03,.5,8),flat(0xA67C52));leg.position.set(x,.25,z);stool.add(leg);}
      let y=.58;for(const c of [0xFFF1CC,0x9fd3ff,0xFFB0B0]){const t=roundedBox(.5,.1,.36,.04,matte(c));t.position.set(0,y,0);stool.add(t);y+=.1;}
      stool.position.set(2.4,0,-1.9);stool.userData.hideOnExplode=true;scene.add(stool);reg(stool);}
    const bottle=new THREE.Group();{const b=roundedBox(.22,.42,.14,.05,plastic(0x5BB8F5));b.position.y=.21;bottle.add(b);const cap=mm(new THREE.CylinderGeometry(.05,.05,.08,12),plastic(0xFFD740));cap.position.y=.46;bottle.add(cap);
      const lbl=mm(new THREE.BoxGeometry(.16,.18,.005),matte(0xffffff));lbl.position.set(0,.2,.073);lbl.castShadow=false;bottle.add(lbl);bottle.position.set(-.3,2.58,-.45);bottle.userData.hideOnExplode=true;scene.add(bottle);reg(bottle);bottle.userData.r=.3;}
    return {occluders:occ,update(){}};
  },

  build(ctx,_api){
    api=_api;ctx=RIG.upgrade(ctx);const {THREE,V,mm,roundedBox,capsule,tubeM,pathTube,paint,chrome,steel,dark,matte,flat,plastic,glassMat,place,defPart,markShell,root,canvasTex}=ctx;
    /* ---- 外壳 ---- */
    const shell=new THREE.Group();
    {
      const pm=()=>plastic(0xF4F6F8);
      const back=roundedBox(.06,2.4,1.8,.03,pm());back.position.set(-.87,1.3,0);shell.add(back);
      for(const z of [.87,-.87]){const side=roundedBox(1.8,2.4,.06,.03,pm());side.position.set(0,1.3,z);shell.add(side);}
      const bottom=roundedBox(1.8,.06,1.8,.02,pm());bottom.position.set(0,.13,0);shell.add(bottom);
      const gasket=mm(new THREE.TorusGeometry(.6,.05,12,48),dark(0x2a2f3a));gasket.rotation.y=Math.PI/2;gasket.position.set(.8,1.3,0);shell.add(gasket);
      const boot=mm(new THREE.CylinderGeometry(.66,.66,.14,48,1,true),dark(0x3a4150,{side:THREE.DoubleSide}));boot.rotation.z=Math.PI/2;boot.position.set(.76,1.3,0);boot.castShadow=false;shell.add(boot);
      // 前面板：带圆洞
      const sh=new THREE.Shape();sh.moveTo(-.9,.1);sh.lineTo(.9,.1);sh.lineTo(.9,2.5);sh.lineTo(-.9,2.5);sh.lineTo(-.9,.1);
      const hole=new THREE.Path();hole.absarc(0,1.3,.64,0,Math.PI*2,true);sh.holes.push(hole);
      const front=mm(new THREE.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:false,curveSegments:40}),plastic(0xF4F6F8));front.rotation.y=Math.PI/2;front.position.set(.9,0,0);shell.add(front);
      const top=roundedBox(1.86,.08,1.86,.03,plastic(0xEDF0F3));top.position.set(0,2.54,0);shell.add(top);
      for(const [x,z] of [[-.7,.7],[.7,.7],[-.7,-.7],[.7,-.7]]){const f=mm(new THREE.CylinderGeometry(.06,.07,.1,10),dark());f.position.set(x,.05,z);shell.add(f);}
      const panel=roundedBox(.05,.34,1.62,.03,dark(0x2a2f3a));panel.position.set(.95,2.22,0);shell.add(panel);
      const knob=mm(new THREE.CylinderGeometry(.11,.11,.06,24),chrome());knob.rotation.z=Math.PI/2;knob.position.set(1.0,2.22,-.35);shell.add(knob);
      const kmark=mm(new THREE.BoxGeometry(.02,.08,.02),dark());kmark.position.set(1.03,2.28,-.35);shell.add(kmark);
      const screen=mm(new THREE.BoxGeometry(.01,.14,.36),new THREE.MeshStandardMaterial({color:0x1b3a5c,emissive:0x3aa0ff,emissiveIntensity:.35,roughness:.3}));screen.position.set(.992,2.22,.05);screen.userData.keepEm=true;shell.add(screen);
      markShell(shell);place(shell,V(0,0,0),V(0,2.0,0));
    }
    defPart('body',{name:'外壳',more:'外壳是金属和塑料做的，顶盖和面板可以拆下来修理。',outside:true,text:'硬硬的外壳，把里面的机器包起来，水也不会漏出来。'},[shell]);

    /* ---- 启动按钮 ---- */
    const startG=new THREE.Group();let startBtn;
    {startBtn=mm(new THREE.CylinderGeometry(.07,.07,.03,20),new THREE.MeshStandardMaterial({color:0x4CC38A,emissive:0x4CC38A,emissiveIntensity:0,roughness:.4}));startBtn.rotation.z=Math.PI/2;startBtn.position.set(.985,2.22,-.62);startBtn.userData.keepEm=true;startG.add(startBtn);
     const ring=mm(new THREE.CylinderGeometry(.09,.09,.015,20),chrome());ring.rotation.z=Math.PI/2;ring.position.set(.975,2.22,-.62);startG.add(ring);place(startG,V(0,0,0),V(.6,0,0));}
    defPart('start',{name:'启动按钮',more:'按下按钮，程序按顺序控制进水、转动、排水、脱水，一步一步完成洗衣。',outside:true,isStart:true,text:'按一下，洗衣机就开始洗啦！'},[startG]);

    /* ---- 门（左侧铰链） ---- */
    const door=new THREE.Group();
    {const ring=mm(new THREE.TorusGeometry(.6,.07,14,48),plastic(0xDDE2E8));ring.rotation.y=Math.PI/2;door.add(ring);
     const glass=mm(new THREE.SphereGeometry(.56,32,20,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color:0xB9DCFF,metalness:.2,roughness:.04,transparent:true,opacity:.4,depthWrite:false,envMapIntensity:1.4}));glass.rotation.z=-Math.PI/2;glass.scale.set(1,.35,1);glass.castShadow=false;glass.userData.glass=true;glass.position.x=.02;door.add(glass);
     const handle=roundedBox(.05,.36,.08,.02,plastic(0x9aa2ad));handle.position.set(.08,0,-.62);door.add(handle);
     door.position.set(.98,1.3,0);door.userData.hinge=true;door.children.forEach(c=>{c.position.z+=-.66;});door.position.z=.66;
     place(door,V(.98,1.3,.66),V(1.1,0,.2));}
    defPart('door',{name:'门',more:'门上有一圈橡胶密封圈，关紧了水才不会漏。洗的时候门会自动锁住，中途打不开。',outside:true,text:'圆圆的玻璃门，洗的时候要关紧，水才不会流出来。',action(){M.doorT=M.doorT?0:1;api.sfx.door();}},[door]);

    /* ---- 外筒（半透明） ---- */
    const tub=new THREE.Group();
    {const t=mm(new THREE.CylinderGeometry(.72,.72,1.3,40,1,true),new THREE.MeshPhysicalMaterial({color:0x8fa4b8,metalness:.1,roughness:.4,transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide}));t.rotation.z=Math.PI/2;t.castShadow=false;tub.add(t);
     const back=mm(new THREE.CylinderGeometry(.72,.72,.05,40),new THREE.MeshStandardMaterial({color:0x8fa4b8,transparent:true,opacity:.6,depthWrite:false}));back.rotation.z=Math.PI/2;back.position.x=-.65;back.castShadow=false;tub.add(back);
     const water=mm(new THREE.BoxGeometry(1.2,1,1.1),new THREE.MeshPhysicalMaterial({color:0x4FA8F0,transparent:true,opacity:.55,roughness:.1,depthWrite:false}));water.castShadow=false;water.userData.noHit=true;water.position.set(0,-.72,0);water.scale.y=.001;tub.add(water);tub.userData.water=water;
     place(tub,V(TUB_C.x,TUB_C.y,0),V(0,0,-.8));}
    defPart('tub',{name:'外筒',more:'外筒套在内筒外面，是真正装水的桶。它挂在弹簧上，转起来才不会震坏机器。',text:'外筒是装水的大桶，水位到这里。',action(){M.inletUntil=now()+3000;M.drainUntil=now()+3000+3500;}},[tub]);

    /* ---- 内筒（带孔、带提升筋、装着衣服） ---- */
    const drum=new THREE.Group(),drumSpin=new THREE.Group();
    {const holes=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#c9d0d8';g.fillRect(0,0,w,h);g.fillStyle='#5b6470';for(let y=0;y<8;y++)for(let x=0;x<8;x++){g.beginPath();g.arc((x+.5+(y%2)*.5)*w/8,(y+.5)*h/8,w/8*.18,0,6.28);g.fill();}});
     holes.wrapS=holes.wrapT=THREE.RepeatWrapping;holes.repeat.set(6,2);
     const wall=mm(new THREE.CylinderGeometry(.58,.58,1.1,40,1,true),new THREE.MeshStandardMaterial({map:holes,metalness:.6,roughness:.35,side:THREE.DoubleSide}));wall.rotation.z=Math.PI/2;drumSpin.add(wall);
     const back=mm(new THREE.CylinderGeometry(.58,.58,.04,40),steel(0xb9c0c8));back.rotation.z=Math.PI/2;back.position.x=-.55;drumSpin.add(back);
     const rim=mm(new THREE.TorusGeometry(.56,.035,10,40),steel(0xd5dbe2));rim.rotation.y=Math.PI/2;rim.position.x=.55;drumSpin.add(rim);
     for(let k=0;k<3;k++){const a=k*Math.PI*2/3;const lift=roundedBox(.9,.14,.16,.04,steel(0xd5dbe2));lift.position.set(0,Math.cos(a)*.5,Math.sin(a)*.5);lift.rotation.x=-a;drumSpin.add(lift);}
     const clothesG=new THREE.Group();
     for(const [c,a,x,r] of [[0x5BB8F5,2.75,-.1,.4],[0xFF6B6B,3.05,.15,.42],[0xFFD740,3.4,.2,.38],[0xffffff,3.7,-.3,.4],[0x7CC576,3.2,-.05,.28]]){const cl=mm(new THREE.SphereGeometry(.17,10,8),matte(c));cl.scale.set(1.1,.7,1);cl.position.set(x,Math.cos(a)*r,Math.sin(a)*r);cl.rotation.x=-a;clothesG.add(cl);}
     drum.add(clothesG);drum.userData.clothes=clothesG;
     const pulley=mm(new THREE.CylinderGeometry(.3,.3,.05,32),steel(0x6b7280));pulley.rotation.z=Math.PI/2;pulley.position.x=-.62;drumSpin.add(pulley);
     const axle=mm(new THREE.CylinderGeometry(.04,.04,.2,12),steel());axle.rotation.z=Math.PI/2;axle.position.x=-.66;drumSpin.add(axle);
     drum.add(drumSpin);place(drum,V(TUB_C.x+.02,TUB_C.y,0),V(1.0,0,0));}
    defPart('drum',{name:'内筒',more:'内筒是不锈钢的，上面有很多小孔让水进出。里面三根筋叫提升筋，把衣服带到高处再摔下来。',outside:true,text:'衣服在里面翻滚、摔打，脏东西就掉下来了。',action(){M.drumUntil=now()+3600;}},[drum]);

    /* ---- 电机 + 皮带 ---- */
    const motor=new THREE.Group(),motorSpin=new THREE.Group();
    {const body=mm(new THREE.CylinderGeometry(.17,.17,.44,20),steel(0x454c5a));body.rotation.z=Math.PI/2;motor.add(body);
     for(let i=0;i<6;i++){const fin=mm(new THREE.BoxGeometry(.4,.02,.06),steel(0x5c6470));fin.rotation.x=i*Math.PI/6;fin.position.set(0,0,0);motor.add(fin);}
     const mp=mm(new THREE.CylinderGeometry(.08,.08,.05,20),steel(0x6b7280));mp.rotation.z=Math.PI/2;mp.position.x=-.27;motorSpin.add(mp);
     const mark=mm(new THREE.BoxGeometry(.06,.02,.16),matte(0xFF6B6B));mark.position.x=-.3;motorSpin.add(mark);motor.add(motorSpin);
     // 皮带：电机小轮 → 内筒大轮（在电机坐标系里画一个闭合环）
     const belt=(()=>{const P=[];const bx=-.27,by=0,bz=0,BX=-.27,BY=TUB_C.y-.45,BZ=.42,r1=.09,r2=.31;// 大轮相对电机的位置：(0, +0.95, +0.42)... 直接用世界差值
       const cy=.95,cz=.42;const n=40;for(let i=0;i<n;i++){const t=i/n*Math.PI*2;if(t<Math.PI){P.push(V(bx,cy+Math.cos(t)*r2,cz+Math.sin(t)*r2*1));}else{P.push(V(bx,Math.cos(t)*r1,Math.sin(t)*r1));}}
       const curve=new THREE.CatmullRomCurve3(P,true);return mm(new THREE.TubeGeometry(curve,80,.014,8,true),dark(0x2a2a30));})();
     motor.add(belt);
     place(motor,V(TUB_C.x-.57,TUB_C.y-.95,-.42),V(-.5,-.1,-.5));}
    defPart('motor',{name:'电机',more:'电机通过皮带带动内筒，洗涤时慢慢转，甩干时每分钟转一千多圈。',text:'电机是洗衣机的心脏，带着内筒转起来。',action(){M.motorUntil=now()+3600;M.drumUntil=now()+3600;}},[motor]);

    /* ---- 进水管 + 进水阀 ---- */
    const inlet=new THREE.Group(),inletPath=[V(-1.1,2.3,.45),V(-.6,2.3,.45),V(.55,2.3,.45),V(.75,2.1,.45),V(.75,1.95,.3)];
    {const valve=roundedBox(.2,.16,.16,.03,steel(0x6b7280));valve.position.set(-.95,2.3,.45);inlet.add(valve);
     inlet.add(pathTube(inletPath,.035,plastic(0x9fd3ff)));
     const tap=mm(new THREE.CylinderGeometry(.05,.05,.3,12),chrome());tap.rotation.z=Math.PI/2;tap.position.set(-1.25,2.3,.45);inlet.add(tap);
     place(inlet,V(0,0,0),V(-.5,.7,.6));}
    defPart('inlet',{name:'进水管',more:'进水阀像一个电控的水龙头，程序说进水它才打开。水先经过洗衣液盒，把洗衣液一起冲进去。',text:'干净的水从这根管子流进来。',action(){M.inletUntil=now()+3500;}},[inlet]);
    const inletCurve=new THREE.CatmullRomCurve3(inletPath),inletDots=[];
    for(let i=0;i<7;i++){const d=mm(new THREE.SphereGeometry(.04,8,6),new THREE.MeshStandardMaterial({color:0x4FA8F0,emissive:0x4FA8F0,emissiveIntensity:.5}));d.castShadow=false;d.scale.setScalar(0);root.add(d);inletDots.push(d);}

    /* ---- 洗衣液盒（抽屉） ---- */
    const drawer=new THREE.Group();
    {const box=roundedBox(.5,.14,.5,.03,plastic(0xDDE2E8));box.position.set(-.22,0,0);drawer.add(box);
     const face=roundedBox(.05,.16,.52,.03,plastic(0xF4F6F8));face.position.set(.03,0,0);drawer.add(face);
     const grip=roundedBox(.03,.04,.3,.01,plastic(0x9aa2ad));grip.position.set(.07,.02,0);drawer.add(grip);
     const soap=mm(new THREE.BoxGeometry(.3,.06,.18),new THREE.MeshPhysicalMaterial({color:0x3aa0ff,transparent:true,opacity:.7,roughness:.2}));soap.position.set(-.22,.06,.1);soap.castShadow=false;drawer.add(soap);
     place(drawer,V(.93,2.22,.5),V(.9,0,0));}
    defPart('drawer',{name:'洗衣液盒',more:'抽屉分成几格，分别放洗衣液和柔顺剂。进水时水从上面冲下来，把它们带进筒里。',outside:true,text:'洗衣液放在这个小抽屉里，和水一起冲进筒里。',action(){M.drawerT=M.drawerT?0:1;}},[drawer]);

    /* ---- 排水泵 + 排水管 ---- */
    const pump=new THREE.Group(),drainPath=[V(.35,.45,.35),V(.55,.3,.5),V(.2,.28,.7),V(-.7,.3,.75),V(-.95,.6,.7),V(-.95,1.9,.7),V(-1.15,2.05,.7)];
    {const pb=mm(new THREE.CylinderGeometry(.13,.13,.14,20),steel(0x454c5a));pb.position.set(.55,.3,.5);pump.add(pb);
     const pm=mm(new THREE.CylinderGeometry(.09,.09,.2,16),steel(0x6b7280));pm.rotation.z=Math.PI/2;pm.position.set(.72,.3,.5);pump.add(pm);
     pump.add(tubeM(V(.15,.62,.25),V(.35,.45,.35),.045,steel(0x9aa2ad)));
     pump.add(pathTube(drainPath,.04,steel(0x9aa2ad)));
     place(pump,V(0,0,0),V(.4,-.1,.7));}
    defPart('pump',{name:'排水泵',more:'排水泵在机器底部，把脏水抽起来排到下水道。泵前面有个小过滤器，会卡住硬币和纽扣。',text:'洗完的脏水，被它抽出去排掉。',action(){M.drainUntil=now()+3500;}},[pump]);
    const drainCurve=new THREE.CatmullRomCurve3(drainPath),drainDots=[];
    for(let i=0;i<8;i++){const d=mm(new THREE.SphereGeometry(.04,8,6),new THREE.MeshStandardMaterial({color:0x7fb6e8,emissive:0x7fb6e8,emissiveIntensity:.4}));d.castShadow=false;d.scale.setScalar(0);root.add(d);drainDots.push(d);}

    /* ---- 减震弹簧 + 减震器 ---- */
    const springs=new THREE.Group();
    {const helix=(x,z,y0,y1)=>{const P=[];const n=26;for(let i=0;i<=n;i++){const t=i/n;P.push(V(x+Math.cos(t*Math.PI*8)*.06,y0+(y1-y0)*t,z+Math.sin(t*Math.PI*8)*.06));}return pathTube(P,.014,steel(0xb7bec8),90);};
     for(const z of [.55,-.55]){springs.add(helix(TUB_C.x-.1,z,TUB_C.y+.62,2.42));springs.add(tubeM(V(TUB_C.x-.1,TUB_C.y+.4,z),V(TUB_C.x-.1,TUB_C.y+.62,z),.02,steel()));}
     for(const z of [.5,-.5]){const a=V(TUB_C.x+.3,TUB_C.y-.55,z*.7),b=V(TUB_C.x+.55,.14,z*1.4);springs.add(tubeM(a,b,.045,steel(0x454c5a)));springs.add(tubeM(a.clone().lerp(b,.5),b,.03,steel(0x9aa2ad)));}
     place(springs,V(0,0,0),V(0,.5,0));}
    defPart('springs',{name:'减震弹簧',more:'上面两根弹簧吊着外筒，下面两根减震器撑着。甩干时衣服不平衡，全靠它们吸收晃动。',text:'筒转得很快会晃，弹簧拉着它，机器就不乱跳。',action(){M.shakeUntil=now()+2500;}},[springs]);

    /* ---- 每帧 ---- */
    let dotPh=0;
    function update(dt){
      const S=api.S,t=now(),drv=S.drive,ee=api.ee;
      const wash=(drv&&M.washOn&&!M.spinOn)||t<M.drumUntil,spin=(drv&&M.spinOn)||t<M.spinUntil,motorOn=wash||spin||t<M.motorUntil;
      const wT=spin?14:(wash?2.2:0);M.drumW+=(wT-M.drumW)*Math.min(1,dt*2);
      if(wash&&!spin){M.flipT-=dt;if(M.flipT<=0){M.flipT=2.2;M.drumDir*=-1;}}else M.drumDir=1;
      drumSpin.rotation.x+=M.drumW*M.drumDir*dt;motorSpin.rotation.x+=M.drumW*M.drumDir*dt*3.4;
      {const cg=drum.userData.clothes;if(M.drumW>7){cg.rotation.x+=M.drumW*M.drumDir*dt;}else{const rock=(M.drumW>.3?Math.sin(t/1000*2.6)*.55*Math.min(1,M.drumW/2):0);const target=Math.round(cg.rotation.x/(Math.PI*2))*Math.PI*2+rock;cg.rotation.x+=(target-cg.rotation.x)*Math.min(1,dt*3);}}
      const fill=(drv&&M.fillOn&&!M.drainOn)||t<M.inletUntil,drain=(drv&&M.drainOn)||t<M.drainUntil;
      M.inlet+=((fill?1:0)-M.inlet)*Math.min(1,dt*4);M.drain+=((drain?1:0)-M.drain)*Math.min(1,dt*4);
      if(fill)M.levelT=Math.min(1,M.levelT+dt*.25);if(drain)M.levelT=Math.max(0,M.levelT-dt*.35);if(!drv&&!fill&&!drain)M.levelT=Math.max(0,M.levelT-dt*.15);
      M.level+=(M.levelT-M.level)*Math.min(1,dt*3);
      const water=tub.userData.water;water.scale.y=Math.max(.001,M.level*.42);water.position.y=-.72+water.scale.y/2;water.visible=M.level>.01;
      M.door+=(M.doorT-M.door)*Math.min(1,dt*4);door.rotation.y=-M.door*1.4;
      M.drawer+=(M.drawerT-M.drawer)*Math.min(1,dt*4);drawer.position.x+=M.drawer*.42;
      const shake=(spin||t<M.shakeUntil)?1:0;M.tubShake+=(shake-M.tubShake)*Math.min(1,dt*4);
      const jit=M.tubShake*.012;tub.position.y+=Math.sin(t*.05)*jit;drum.position.y+=Math.sin(t*.05)*jit;tub.position.z+=Math.sin(t*.037)*jit;drum.position.z+=Math.sin(t*.037)*jit;
      dotPh+=dt;
      inletDots.forEach((d,i)=>{const u=(dotPh*.5+i/7)%1;inletCurve.getPointAt(u,d.position);d.scale.setScalar(M.inlet*(1-ee)*(.6+.4*Math.sin(u*Math.PI)));});
      drainDots.forEach((d,i)=>{const u=(dotPh*.4+i/8)%1;drainCurve.getPointAt(u,d.position);d.scale.setScalar(M.drain*(1-ee)*(.6+.4*Math.sin(u*Math.PI)));});
      startBtn.userData.dynInt=drv?1.3:0;
    }
    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){if(M.doorT){M.doorT=0;api.sfx.door();}}},
      {t:'干净的水从进水管流进来。',part:'inlet',inner:true,on(){M.fillOn=true;api.sfx.loop('water')}},
      {t:'洗衣液和水一起冲进筒里。',part:'drawer',on(){M.soapOn=true}},
      {t:'电机带着内筒转起来，衣服翻滚、摔打。',part:'motor',inner:true,on(){M.washOn=true;M.fillOn=false;api.sfx.stopLoop();api.sfx.loop('hum')}},
      {t:'排水泵把脏水抽出去。',part:'pump',inner:true,on(){M.drainOn=true;M.washOn=false}},
      {t:'内筒飞快地转，把水都甩出去！',part:'drum',on(){M.spinOn=true;M.washOn=true;M.drainOn=true;}},
    ];
    ctx.linearize();
    return {update,chain,onStop(){M.fillOn=M.soapOn=M.washOn=M.drainOn=M.spinOn=false;},onStart(){},onDone(){M.washOn=M.spinOn=M.drainOn=false;M.levelT=0;M.doorT=1;api.sfx.door();}};
  }
};
})();

/* 场景：波音 747 客机（机场跑道） */
window.SCENES=window.SCENES||{};
(function(){
const C=1.35;                       // 机身中心线高度
const SWEEP=.54,DIH=.115;           // 机翼后掠、上反
const P={thrust:0,thrustT:0,fan:0,flap:0,flapT:0,gear:0,gearT:0,speed:0,speedT:0,pitch:0,pitchT:0,alt:0,altT:0,
  door:0,doorT:0,rud:0,rudT:0,fuel:0,fuelUntil:0,roll:0,blink:0,
  thrustUntil:0,flapUntil:0,gearUntil:0,rudUntil:0,doorOpen:false,startOn:false,engineOn:false,flying:false};
let api=null;const now=()=>api.now();

SCENES.jet={
  id:'jet',title:'飞机',subtitle:'波音747 · 拖一拖转圈，点零件听听',night:true,
  sky:'linear-gradient(180deg,#6FB7FF 0%,#9ED0FF 30%,#CFE8FB 55%,#DCEEF8 100%)',
  nightFog:0x1d3358,
  envMap:['#9fd0ff','#e8f4ff','#cfe0d0','#8fa87f'],hemi:{sky:0xdfefff,ground:0x9fb08c},fog:{color:0xDCEEF8,near:30,far:70},
  fit:{w:14.5,h:6.2,ty:1.5,tyEx:2.3,rEx:1.34},cameraStart:{theta:.95,phi:1.18},
  order:['engine','wing','flap','fuel','gear','tail','rudder','cabin','cargo','cockpit','door','start','body'],
  go:{on:'起飞',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再飞一次！',done:'飞起来啦！',
      doneHintXray:'看，油从机翼流到发动机里。点「停下」再飞一次。',doneHint:'点「看里面」，看看肚子里装了什么。'},
  intro:{icon:'body',name:'飞机',text:'这是波音747，大家叫它「空中女王」。点一点它的零件，听听它叫什么。按「起飞」看它怎么飞上天。'},
  poster:{title:'飞机里面到底长什么样',sub:'几百个人坐在里面，它靠什么飞起来？',summary:'发动机往后吹 + 机翼兜住风 = 飞机飞起来！',
    angle:{theta:.95,phi:1.12},keys:['engine','wing','flap','fuel','gear','tail'],
    anchors:{wing:[.4,1.15,3.2],flap:[-1.6,1.1,2.4],fuel:[0,1.1,2.0],gear:[-.7,.4,2.0],engine:[1.0,.75,3.7],tail:[-5.4,3.0,0]}},

  /* ---------- 机场 ---------- */
  env(ctx,_api){
    api=_api;const {THREE,scene,V,flat,matte,mm,roundedBox,canvasTex,rngFactory}=ctx;
    const env=new THREE.Group();scene.add(env);
    const scroll=[],nightGlow=[],clouds=[],near=[],rnd=rngFactory(7);
    const groundMats=[];// 地面上的东西：飞到高空就整体淡出（跑道、草地、航站楼…）
    const G=o=>{o.traverse(m=>{if(m.isMesh&&groundMats.indexOf(m.material)<0)groundMats.push(m.material);});return o;};
    const FOG=ctx.scene.fog;const F0={near:FOG?FOG.near:30,far:FOG?FOG.far:70};
    // 草地
    const grass=G(new THREE.Mesh(new THREE.CircleGeometry(46,64),flat(0x8FBF6B)));grass.rotation.x=-Math.PI/2;grass.position.y=-.01;grass.receiveShadow=true;scene.add(grass);
    // 跑道：一条长长的水泥带，中间一排虚线
    const rw=G(new THREE.Mesh(new THREE.PlaneGeometry(92,5.6),flat(0x8D9199)));rw.rotation.x=-Math.PI/2;rw.position.set(0,0,0);rw.receiveShadow=true;scene.add(rw);
    for(const z of [2.5,-2.5]){const edge=G(new THREE.Mesh(new THREE.PlaneGeometry(92,.18),flat(0xF2F4F7)));edge.rotation.x=-Math.PI/2;edge.position.set(0,.012,z);scene.add(edge);}
    const dashes=[];
    for(let i=0;i<32;i++){const d=G(new THREE.Mesh(new THREE.PlaneGeometry(2.2,.2),flat(0xF2F4F7)));d.rotation.x=-Math.PI/2;d.position.set(-46+i*3,.014,0);scene.add(d);dashes.push(d);}
    // 跑道边灯：晚上会亮
    for(let i=0;i<24;i++){for(const z of [2.9,-2.9]){const lm=flat(0xE9EEF3,{emissive:0xFFF0C0,emissiveIntensity:0});
      const l=G(mm(new THREE.SphereGeometry(.08,8,6),lm));l.castShadow=false;l.position.set(-46+i*4,.08,z);scene.add(l);scroll.push({o:l,span:96});
      nightGlow.push(n=>{lm.emissiveIntensity=3.2*n;});}}
    // 航站楼 + 塔台：放在飞机后面（-z），前面不挡
    const ZT=-15;
    const term=new THREE.Group();
    {const b=roundedBox(26,3.4,5,.12,flat(0xE8EDF2));b.position.set(-2,1.7,ZT);term.add(b);
     const roof=roundedBox(26.6,.3,5.6,.06,flat(0xC9D3DC));roof.position.set(-2,3.5,ZT);term.add(roof);
     for(let i=0;i<16;i++){const wm=flat(0xBFE0FF,{roughness:.25,emissive:0xFFE9A8,emissiveIntensity:0});
       const w=mm(new THREE.BoxGeometry(1.1,1.5,.06),wm);w.castShadow=false;w.position.set(-13.5+i*1.6,1.9,ZT+2.53);term.add(w);nightGlow.push(n=>{wm.emissiveIntensity=1.8*n;});}
     const tow=mm(new THREE.CylinderGeometry(.6,.8,6.5,14),flat(0xE8EDF2));tow.position.set(11,3.25,ZT-1);term.add(tow);
     const cabm=flat(0xBFE0FF,{roughness:.2,emissive:0xFFE9A8,emissiveIntensity:0});
     const cab=mm(new THREE.CylinderGeometry(1.15,1.0,1.1,14),cabm);cab.position.set(11,7,ZT-1);term.add(cab);nightGlow.push(n=>{cabm.emissiveIntensity=1.6*n;});
     const cap=mm(new THREE.CylinderGeometry(1.3,1.3,.16,14),flat(0xC9D3DC));cap.position.set(11,7.65,ZT-1);term.add(cap);
     term.traverse(o=>{if(o.isMesh)o.castShadow=true;});G(term);env.add(term);}
    // 风向袋
    {const g=new THREE.Group();const pole=mm(new THREE.CylinderGeometry(.05,.06,2.6,8),flat(0xE8EDF2));pole.position.y=1.3;g.add(pole);
     const sock=mm(new THREE.CylinderGeometry(.12,.26,1.1,12,1,true),new THREE.MeshStandardMaterial({color:0xFF7A1A,side:THREE.DoubleSide,roughness:.8}));
     sock.rotation.z=Math.PI/2+.25;sock.position.set(.55,2.35,0);g.add(sock);g.position.set(9,0,7.5);env.add(g);}
    // 远处的树丛和小山
    for(let i=0;i<14;i++){const a=(i/14)*Math.PI*2+rnd()*.3,R=30+rnd()*10;if(Math.abs(Math.sin(a))<.3)continue;
      const h=mm(new THREE.SphereGeometry(4+rnd()*4,12,9),flat([0x78BF6B,0x86C97A,0x6BAF63][i%3]));h.scale.y=.4;h.position.set(Math.cos(a)*R,0,Math.sin(a)*R);h.castShadow=false;env.add(h);}
    // 云
    for(let i=0;i<7;i++){const g=new THREE.Group(),m=flat(0xffffff,{transparent:true,opacity:.92});
      for(let k=0;k<3+Math.floor(rnd()*3);k++){const b=mm(new THREE.SphereGeometry(.9+rnd()*.7,10,8),m);b.castShadow=false;b.position.set(k*1.1-1.2+rnd()*.5,rnd()*.35,rnd()*.7);g.add(b);}
      g.position.set(-30+i*9+rnd()*4,4.5+rnd()*4.5,(rnd()<.5?1:-1)*(9+rnd()*16));env.add(g);clouds.push(g);}
    // 脚下的云海：飞高了就铺开，把地面盖住——「飞到云朵上面去了」
    const deckM=flat(0xffffff,{transparent:true,opacity:0});
    const deck=new THREE.Group();deck.visible=false;
    for(let i=0;i<32;i++){const g=new THREE.Group();
      for(let k=0;k<4;k++){const b=mm(new THREE.SphereGeometry(1.5+rnd()*1.1,10,8),deckM);b.castShadow=false;b.receiveShadow=false;
        b.position.set(k*1.8-2.4+rnd()*1.0,rnd()*.4,rnd()*1.8);b.scale.y=.42;g.add(b);}
      g.position.set(-42+(i%8)*12+rnd()*4,1.3+rnd()*.5,-30+Math.floor(i/8)*17+rnd()*6);deck.add(g);}
    env.add(deck);
    // 贴着飞机飞过去的近处云
    for(let i=0;i<5;i++){const g=new THREE.Group(),m=flat(0xffffff,{transparent:true,opacity:0});
      for(let k=0;k<4;k++){const b=mm(new THREE.SphereGeometry(1.1+rnd()*.9,10,8),m);b.castShadow=false;b.position.set(k*1.5-2.2+rnd()*.6,rnd()*.5,rnd()*1.2);g.add(b);}
      g.position.set(-24+i*13,4.2+rnd()*3.4,(rnd()<.5?1:-1)*(7.5+rnd()*5));g.visible=false;env.add(g);near.push({g,m});}
    return {occluders:[],update(dt){
      const v=P.speed*26;
      if(v>.01){for(const d of dashes){d.position.x-=v*dt;if(d.position.x<-48)d.position.x+=96;}
        for(const s of scroll){s.o.position.x-=v*dt;if(s.o.position.x<-48)s.o.position.x+=s.span;}}
      for(const c of clouds){c.position.x-=dt*(.3+P.speed*6);if(c.position.x<-34)c.position.x+=68;}
      // 飞得越高：脚下铺开云海、近处的云擦身而过，地面躲到云下面
      const hi=Math.min(1,Math.max(0,(P.alt-1.6)/4.2))*(1-api.ee);
      deck.visible=hi>.02;deckM.opacity=Math.min(.95,hi*1.25);
      if(deck.visible){for(const g of deck.children){g.position.x-=dt*(1.2+P.speed*11);if(g.position.x<-46)g.position.x+=91;}}
      for(const c of near){c.g.visible=hi>.15;c.m.opacity=.8*hi;
        if(c.g.visible){c.g.position.x-=dt*(2+P.speed*14);if(c.g.position.x<-30)c.g.position.x+=62;}}
      if(FOG){FOG.near=F0.near-hi*6;FOG.far=F0.far-hi*12;}
      // 飞高以后：跑道、草地、航站楼整体淡出，只剩天和云
      const gv=1-Math.min(1,hi*1.15);
      for(const m of groundMats){m.opacity=gv;m.transparent=gv<.995;m.depthWrite=gv>.995;}
      grass.visible=rw.visible=term.visible=gv>.02;
      const n=api.S.night;for(const f of nightGlow)f(n);
    }};
  },

  /* ---------- 飞机 ---------- */
  build(ctx,_api){
    api=_api;const {THREE,V,mm,roundedBox,capsule,tubeM,pathTube,loft,stationsX,chrome,steel,dark,matte,flat,plastic,glassMat,paint,place,defPart,markShell,root}=ctx;
    const WHITE=()=>plastic(0xF4F6F9),BLUE=()=>plastic(0x2F6FD0),RED=()=>plastic(0xE23B45);

    /* 机身外壳 */
    const shell=new THREE.Group();const winMats=[];let surfHit=null;// surfHit：朝机身打一条射线，返回表面上的点和法线
    {
      const K=[{x:6.2,hw:.09,y0:C-.08,y1:C+.16},{x:5.9,hw:.26,y0:C-.26,y1:C+.36},{x:5.4,hw:.42,y0:C-.44,y1:C+.62},
        {x:4.6,hw:.53,y0:C-.53,y1:C+.86},{x:3.5,hw:.56,y0:C-.55,y1:C+.92},{x:2.5,hw:.56,y0:C-.55,y1:C+.86},
        {x:1.6,hw:.55,y0:C-.55,y1:C+.66},{x:1.0,hw:.55,y0:C-.55,y1:C+.56},{x:-3.2,hw:.55,y0:C-.55,y1:C+.55},
        {x:-4.8,hw:.48,y0:C-.42,y1:C+.56},{x:-5.7,hw:.30,y0:C-.10,y1:C+.52},{x:-6.2,hw:.11,y0:C+.10,y1:C+.42}]
        .map(k=>Object.assign({rb:.5,rt:.5},k));
      const body=loft(K,stationsX(6.2,-6.2,.1),WHITE(),{ringN:34});shell.add(body);
      // 蓝色腰带 + 尾部涂装
      const belt=loft(K.map(k=>({x:k.x,hw:k.hw+.006,y0:C-.30,y1:C-.14,rb:.05,rt:.05})),stationsX(5.6,-5.4,.15),BLUE(),{ringN:26});
      belt.castShadow=false;shell.add(belt);
      // 舷窗：朝机身打一条射线，贴到机身真正的表面上，并按表面法线摆正——比算半宽可靠
      body.updateMatrixWorld(true);
      const ray=new THREE.Raycaster(),_o=new THREE.Vector3(),_d=new THREE.Vector3(),_Z=new THREE.Vector3(0,0,1);
      surfHit=(ox,oy,oz,dx,dy,dz)=>{_o.set(ox,oy,oz);_d.set(dx,dy,dz).normalize();ray.set(_o,_d);
        const h=ray.intersectObject(body,false)[0];if(!h)return null;
        return {p:h.point.clone(),n:h.face.normal.clone().transformDirection(body.matrixWorld)};};
      const winRow=(y,x0,step,n,sz)=>{for(const s of [1,-1])for(let i=0;i<n;i++){const x=x0-i*step;
        const hit=surfHit(x,y,s*4,0,0,-s);if(!hit)continue;                                 // 打不到就不放窗（机头机尾太细）
        if(hit.n.z*s<.35)continue;                                                          // 只放在侧面，不放在快转到顶上的地方
        const wm=flat(0x2A3550,{emissive:0xFFE7B0,emissiveIntensity:0});winMats.push(wm);
        const w=mm(new THREE.BoxGeometry(sz,sz,.04),wm);w.castShadow=false;w.userData.keepEm=true;
        w.position.copy(hit.p).addScaledVector(hit.n,-.012);
        w.quaternion.setFromUnitVectors(_Z,hit.n);shell.add(w);// 用最小旋转对齐法线，窗户不会歪
        shell.add(w);}};
      winRow(C+.10,4.4,.31,30,.13);   // 主客舱
      winRow(C+.62,4.0,.34,7,.12);    // 上层客舱（747 的「小包」）
      // 翼根整流包：机翼插进机身的地方鼓起来一块，真机也有，不然机翼像直接插在管子上
      const FK=[{x:2.9,hw:.28,y0:C-.52,y1:C-.30},{x:1.8,hw:.70,y0:C-.70,y1:C-.18},{x:.2,hw:.80,y0:C-.76,y1:C-.10},
        {x:-1.5,hw:.72,y0:C-.72,y1:C-.18},{x:-2.8,hw:.26,y0:C-.52,y1:C-.32}].map(k=>Object.assign({rb:.35,rt:.35},k));
      shell.add(loft(FK,stationsX(2.9,-2.8,.1),WHITE(),{ringN:24}));
      markShell(shell);place(shell,V(0,0,0),V(0,3.4,0));
    }
    defPart('body',{name:'机身',outside:true,text:'长长的机身像一根大管子，里面坐着几百个人。',more:'747 的机身有七十米长，前面鼓起来的「小包」是上层客舱，这是它最好认的地方。机身是铝合金做的，又轻又结实。'},[shell]);

    /* 驾驶舱：风挡 + 两个飞行员 */
    const cockpit=new THREE.Group();const cpLampM=flat(0xFFF3D6,{emissive:0xFFF3D6,emissiveIntensity:0});
    {
      const dash=roundedBox(.3,.12,.7,.03,dark(0x262b35));dash.position.set(5.08,C+.34,0);cockpit.add(dash);
      const lamp=mm(new THREE.BoxGeometry(.26,.02,.6),cpLampM);lamp.castShadow=false;lamp.userData.keepEm=true;lamp.position.set(4.98,C+.66,0);cockpit.add(lamp);
      for(const s of [1,-1]){const p=new THREE.Group();
        const torso=roundedBox(.2,.26,.22,.06,matte(0x2A3550));torso.position.set(0,.13,0);p.add(torso);
        const head=mm(new THREE.SphereGeometry(.085,14,10),matte(0xF6D2B0));head.position.set(.01,.33,0);p.add(head);
        const hair=mm(new THREE.SphereGeometry(.088,14,8,0,Math.PI*2,0,Math.PI/2),matte(0x2b2b2b));hair.position.set(.01,.34,0);p.add(hair);
        for(const z of [.11,-.11])p.add(tubeM(V(0,.2,z),V(.16,.12,z),.028,matte(0x2A3550)));
        const seat=roundedBox(.16,.06,.22,.03,matte(0x3a4150));seat.position.set(-.02,-.02,0);p.add(seat);
        const back=roundedBox(.06,.3,.22,.03,matte(0x3a4150));back.position.set(-.12,.15,0);p.add(back);
        p.position.set(4.88,C+.26,s*.19);cockpit.add(p);}
      place(cockpit,V(0,0,0),V(3.0,1.8,0));
    }
    defPart('cockpit',{name:'驾驶舱',outside:true,text:'两个飞行员坐在最前面，看着窗外开飞机。',
      more:'驾驶舱在上层最前面，正副驾驶各坐一边。仪表板上有很多屏幕，告诉他们高度、速度和方向。',
      action(){P.cpUntil=now()+3000;}},[cockpit]);

    /* 客舱：地板 + 座椅 */
    const cabin=new THREE.Group();
    {
      const floor=roundedBox(9.4,.06,1.0,.02,matte(0xD8DEE6));floor.position.set(-.2,C-.18,0);cabin.add(floor);
      const upFloor=roundedBox(2.8,.06,.9,.02,matte(0xD8DEE6));upFloor.position.set(3.2,C+.44,0);cabin.add(upFloor);
      const seat=(x,y,z)=>{const s=roundedBox(.2,.06,.17,.02,matte(0x3F6FB5));s.position.set(x,y+.08,z);cabin.add(s);
        const b=roundedBox(.05,.18,.17,.02,matte(0x3F6FB5));b.position.set(x-.1,y+.18,z);cabin.add(b);};
      for(let i=0;i<11;i++){const x=3.6-i*.72;for(const z of [.30,.12,-.12,-.30])seat(x,C-.15,z);}
      for(let i=0;i<3;i++)for(const z of [.2,-.2])seat(3.9-i*.58,C+.47,z);// 只放三排：再往后机身收窄，椅背会顶穿上层的天花板
      place(cabin,V(0,0,0),V(-1.0,2.6,0));
    }
    defPart('cabin',{name:'客舱座椅',text:'几百个座位排成一排排，大家系好安全带坐着。',
      more:'747 一次能坐三四百人，上下两层都有座位。座椅下面就是行李舱，中间的地板把它们分开。'},[cabin]);

    /* 货舱行李 */
    const cargo=new THREE.Group();
    {
      const COL=[0xE23B45,0x2F6FD0,0xFFC93C,0x4CC38A,0xF07A2A];
      for(let i=0;i<10;i++){const b=roundedBox(.42,.3,.34,.04,matte(COL[i%5]));b.position.set(3.0-i*.72,C-.36,i%2?.22:-.22);cargo.add(b);}
      place(cargo,V(0,0,0),V(-1.8,-.7,0));
    }
    defPart('cargo',{name:'行李舱',text:'大家的行李箱都装在地板下面的肚子里。',
      more:'行李和货物装在客舱地板下面，用一个个集装箱推进去。747 的肚子能装下上百个大行李箱。'},[cargo]);

    /* 机翼（放样 + 后掠 + 上反） */
    function panel(keys,len,sweepK,dihK,mat,sgn){
      const m=loft(keys,stationsX(len,.02,.06),mat,{ringN:22});
      const pos=m.geometry.attributes.position;
      for(let i=0;i<pos.count;i++){const x=pos.getX(i);pos.setZ(i,pos.getZ(i)+sgn*sweepK*x);pos.setY(i,pos.getY(i)+dihK*x);}
      pos.needsUpdate=true;m.geometry.computeVertexNormals();m.geometry.computeBoundingSphere();
      m.rotation.y=sgn>0?-Math.PI/2:Math.PI/2;return m;
    }
    const WK=[{x:.02,hw:1.55,y0:-.17,y1:.17},{x:1.2,hw:1.32,y0:-.15,y1:.15},{x:2.6,hw:1.0,y0:-.11,y1:.11},
      {x:4.0,hw:.72,y0:-.08,y1:.08},{x:5.15,hw:.45,y0:-.05,y1:.05}].map(k=>Object.assign({rb:.5,rt:.5},k));
    const wing=new THREE.Group();
    const wingPanels=[];
    for(const s of [1,-1]){const w=panel(WK,5.15,SWEEP,DIH,WHITE(),s);wing.add(w);wingPanels.push(place(w,V(.75,C-.35,s*.45),V(.4,-.25,s*2.9)));}
    defPart('wing',{name:'机翼',outside:true,hopTargets:wingPanels,text:'机翼是飞机的翅膀，飞得快的时候，风把它往上托。',
      more:'机翼上面鼓、下面平，跑起来时上面的空气跑得快、压力小，下面压力大，就把飞机往上托。747 一边机翼有三十多米长。'},[wing]);

    /* 襟翼：后缘可以放下来的一块 */
    const flapG=new THREE.Group(),flaps=[];
    {
      for(const s of [1,-1])for(const [z,len,ch] of [[1.5,1.5,.75],[3.3,1.4,.5]]){
        const hinge=new THREE.Group();const wx=.75-SWEEP*(z-.45),wy=C-.35+DIH*(z-.45);
        hinge.position.set(wx-(z<2?1.15:.78),wy-.02,s*z);
        const f=roundedBox(ch,.07,len,.03,plastic(0xE8ECF1));f.position.set(-ch/2,0,0);hinge.add(f);
        flapG.add(hinge);flaps.push(hinge);place(hinge,hinge.position.clone(),V(-2.3,-.15,s*1.5));}
    }
    defPart('flap',{name:'襟翼',outside:true,text:'起飞降落时襟翼放下来，翅膀变大，飞得慢也能托住飞机。',
      more:'襟翼是机翼后面能放下来的一块。放下来以后机翼变大变弯，慢速时也能产生足够的托力，所以起飞和降落都要用它。',
      action(){P.flapUntil=now()+4000;}},[flapG]);

    /* 发动机：四台，风扇会转 */
    const engG=new THREE.Group(),fans=[];
    {
      for(const s of [1,-1])for(const z of [2.1,3.7]){
        const wx=.75-SWEEP*(z-.45),wy=C-.35+DIH*(z-.45);
        const n=new THREE.Group();n.position.set(wx+.95,wy-.52,s*z);
        const cowl=mm(new THREE.CylinderGeometry(.36,.30,1.0,24),plastic(0xEFF2F6));cowl.rotation.z=Math.PI/2;n.add(cowl);      // 短舱：前面粗、后面细
        const inlet=mm(new THREE.CylinderGeometry(.30,.30,.18,24),dark(0x2b2f38));inlet.rotation.z=Math.PI/2;inlet.position.x=.45;n.add(inlet);// 进气口里面是暗的
        const lip=mm(new THREE.TorusGeometry(.355,.05,12,26),plastic(0xE8ECF1));lip.rotation.y=Math.PI/2;lip.position.x=.52;n.add(lip);        // 进气口的唇边
        const fan=new THREE.Group();fan.position.x=.40;                                                                                        // 大风扇：一圈叶片 + 中心锥
        const spin=mm(new THREE.ConeGeometry(.08,.22,14),chrome());spin.rotation.z=-Math.PI/2;spin.position.x=.12;fan.add(spin);
        for(let k=0;k<14;k++){const b=mm(new THREE.BoxGeometry(.03,.25,.05),steel(0xb9c0c9));const a=k*Math.PI*2/14;
          b.position.set(0,Math.cos(a)*.155,Math.sin(a)*.155);b.rotation.x=a+.5;fan.add(b);}
        n.add(fan);fans.push(fan);
        const back=mm(new THREE.CylinderGeometry(.26,.20,.52,20),steel(0x8a929e));back.rotation.z=Math.PI/2;back.position.x=-.72;n.add(back);   // 尾喷口收窄
        const cone=mm(new THREE.ConeGeometry(.14,.34,16),dark(0x3a4150));cone.rotation.z=-Math.PI/2;cone.position.x=-1.06;n.add(cone);
        const py=roundedBox(.72,.44,.14,.05,plastic(0xEFF2F6));py.position.set(-.12,.38,0);py.rotation.z=-.18;n.add(py);                        // 吊挂：挂到机翼下面
        engG.add(n);place(n,n.position.clone(),V(1.7,-.1,s*1.7));}
    }
    defPart('engine',{name:'发动机',outside:true,text:'四台大发动机把空气使劲往后吹，飞机就往前冲。',
      more:'747 有四台喷气发动机。前面的大风扇把空气吸进去、压缩、点火，再从后面高速喷出去，反作用力把飞机往前推。一台发动机比一辆小汽车还大。',
      action(){P.thrustUntil=now()+3500;}},[engG]);

    /* 油箱：油在机翼里，流到发动机 */
    const fuelG=new THREE.Group(),fuelDots=[],fuelCurves=[];
    {
      for(const s of [1,-1]){
        const pts=[];for(const z of [.6,1.6,2.4,3.2]){const wx=.75-SWEEP*(z-.45),wy=C-.35+DIH*(z-.45);pts.push(V(wx-.2,wy,s*z));}
        const tank=pathTube(pts,.06,matte(0xFFC93C));tank.castShadow=false;fuelG.add(tank);
        const feed=[V(pts[1].x,pts[1].y,s*2.0),V(pts[1].x+.5,pts[1].y-.3,s*2.05),V(.75-SWEEP*1.65+.4,C-.35+DIH*1.65-.5,s*2.1)];
        fuelG.add(pathTube(feed,.04,dark(0x3a4150)));fuelCurves.push(new THREE.CatmullRomCurve3(feed));}
      for(let i=0;i<8;i++){const d=mm(new THREE.SphereGeometry(.055,8,6),new THREE.MeshStandardMaterial({color:0xFFB020,emissive:0xFFB020,emissiveIntensity:.8}));
        d.castShadow=false;d.scale.setScalar(0);d.userData.keepEm=true;fuelG.add(d);fuelDots.push(d);}
      place(fuelG,V(0,0,0),V(-.4,2.0,0));
    }
    defPart('fuel',{name:'油箱',text:'油装在机翼里，顺着管子送到发动机。',
      more:'飞机的油箱在机翼里面，装满能有两百吨煤油。油放在机翼里还能把机翼往下压，飞行时机翼不会被托得太弯。',
      action(){P.fuelUntil=now()+4000;}},[fuelG]);

    /* 起落架：会收起来 */
    const gearG=new THREE.Group(),legs=[];
    {
      const wheel=(x,z,r)=>{const w=mm(new THREE.CylinderGeometry(r,r,.16,18),dark(0x22262e));w.rotation.x=Math.PI/2;w.position.set(x,0,z);
        const hubm=mm(new THREE.CylinderGeometry(r*.45,r*.45,.18,12),steel(0x9aa2ad));hubm.rotation.x=Math.PI/2;hubm.position.set(x,0,z);return [w,hubm];};
      const leg=(px,pz,rows,r)=>{const g=new THREE.Group();g.position.set(px,C-.55,pz);
        const strut=mm(new THREE.CylinderGeometry(.07,.07,.55,12),chrome());strut.position.y=-.28;g.add(strut);
        const axle=roundedBox(.34,.08,.5,.03,steel(0x6b7280));axle.position.y=-.55;g.add(axle);
        for(let i=0;i<rows;i++)for(const z of (rows>1?[.19,-.19]:[.13,-.13])){
          const x=rows>1?(i?-.16:.16):0;for(const m of wheel(x,z,r)){m.position.y=-.55;g.add(m);}}
        gearG.add(g);legs.push(g);place(g,g.position.clone(),V(-.6,-.05,Math.sign(pz)*1.6||1.6));return g;};
      leg(4.5,0,1,.19);            // 前起落架
      for(const s of [1,-1]){leg(-.35,s*.36,2,.22);leg(-.95,s*1.7,2,.22);}// 机身那两组要够靠里，不然会从机身侧面穿出来
    }
    defPart('gear',{name:'起落架',outside:true,text:'轮子在地上跑，飞起来以后就收进肚子里。',
      more:'747 有十八个轮子：前面两个，下面十六个。飞起来以后起落架收进机身，这样飞得更省油、更快。',
      action(){P.gearUntil=now()+4000;}},[gearG]);

    /* 尾翼 */
    const tailG=new THREE.Group();
    {
      // 水平尾翼：后掠 + 一路收窄到很小的翼尖
      const HK=[{x:.02,hw:.92,y0:-.10,y1:.10},{x:.7,hw:.74,y0:-.085,y1:.085},{x:1.5,hw:.52,y0:-.06,y1:.06},
        {x:2.1,hw:.34,y0:-.04,y1:.04},{x:2.45,hw:.16,y0:-.022,y1:.022}].map(k=>Object.assign({rb:.5,rt:.5},k));
      for(const s of [1,-1]){const h=panel(HK,2.45,.66,.10,WHITE(),s);h.position.set(-5.15,C+.28,s*.28);tailG.add(h);}
      // 垂直尾翼：根部很宽、翼尖收得很小，前缘大角度后掠
      const VK=[{x:.02,hw:1.30,y0:-.12,y1:.12},{x:.8,hw:1.06,y0:-.10,y1:.10},{x:1.7,hw:.80,y0:-.075,y1:.075},
        {x:2.5,hw:.55,y0:-.05,y1:.05},{x:2.95,hw:.34,y0:-.032,y1:.032}].map(k=>Object.assign({rb:.5,rt:.5},k));
      const fin=new THREE.Group();fin.rotation.x=-Math.PI/2;
      const fm=panel(VK,2.95,.62,0,BLUE(),1);fin.add(fm);
      fin.position.set(-4.75,C+.45,0);tailG.add(fin);
      // 根部整流包：把垂尾和机身接顺，不再是「插了一块板」
      {const fk=[{x:.02,hw:.34,y0:C+.30,y1:C+.42},{x:.9,hw:.24,y0:C+.30,y1:C+.66},{x:1.7,hw:.16,y0:C+.34,y1:C+.86},
         {x:2.2,hw:.10,y0:C+.42,y1:C+1.0}].map(k=>Object.assign({rb:.2,rt:.2},k));
       const fil=loft(fk,stationsX(2.2,.02,.06),BLUE(),{ringN:18});fil.rotation.y=Math.PI;fil.position.set(-4.2,0,0);tailG.add(fil);}
      place(tailG,V(0,0,0),V(-3.0,1.4,0));
    }
    defPart('tail',{name:'尾翼',outside:true,text:'尾巴上的两片翅膀让飞机飞得稳，不会东倒西歪。',
      more:'竖着的叫垂直尾翼，管左右方向；横着的叫水平尾翼，管抬头低头。747 的尾巴有六层楼那么高。'},[tailG]);

    /* 方向舵：会左右摆 */
    const rudG=new THREE.Group(),rudHinge=new THREE.Group();
    {
      rudHinge.position.set(-6.05,C+.55,0);
      // 舵面跟着垂尾的后缘走：下宽上窄，还带一点后掠
      const RK=[{x:.02,hw:.30,y0:-.05,y1:.05},{x:1.2,hw:.24,y0:-.042,y1:.042},{x:2.2,hw:.16,y0:-.03,y1:.03},
        {x:2.9,hw:.09,y0:-.02,y1:.02}].map(k=>Object.assign({rb:.5,rt:.5},k));
      const r=panel(RK,2.9,.22,0,plastic(0xE23B45),1);r.rotation.x=-Math.PI/2;r.position.set(-.30,0,0);rudHinge.add(r);// .22 = 垂尾后缘的斜率，这样舵面紧贴着垂尾
      rudG.add(rudHinge);place(rudG,V(0,0,0),V(-4.2,2.2,0));
    }
    defPart('rudder',{name:'方向舵',outside:true,text:'方向舵往左一摆，飞机的头就往左转。',
      more:'方向舵在垂直尾翼后面。飞行员踩脚下的踏板，方向舵就左右摆动，飞机的机头跟着转。',
      action(){P.rudUntil=now()+4000;}},[rudG]);

    /* 舱门 + 舷梯 */
    const doorG=new THREE.Group(),doorHinge=new THREE.Group();
    {
      doorHinge.position.set(4.05,C+.05,.52);
      const d=roundedBox(.5,.75,.06,.04,plastic(0xE8ECF1));d.position.set(-.25,0,0);doorHinge.add(d);
      const hd=roundedBox(.42,.06,.05,.02,steel());hd.position.set(-.25,-.2,.05);doorHinge.add(hd);
      doorG.add(doorHinge);place(doorG,V(0,0,0),V(2.0,1.6,1.8));
    }
    defPart('door',{name:'舱门',outside:true,text:'大家从这扇门上飞机，关好门才能起飞。',
      more:'舱门关上以后会被机舱里的气压顶得更紧，飞行中打不开。门旁边黄色的滑梯，紧急时会自动充气变成一条大滑梯。',
      action(){P.doorOpen=!P.doorOpen;api.sfx.door();}},[doorG]);


    /* 启动按钮 */
    const startG=new THREE.Group();let startBtn;
    {
      const plate=roundedBox(.2,.02,.16,.02,dark(0x262b35));plate.position.set(4.98,C+.38,-.1);startG.add(plate);
      startBtn=mm(new THREE.CylinderGeometry(.045,.045,.02,16),new THREE.MeshStandardMaterial({color:0x4CC38A,emissive:0x4CC38A,emissiveIntensity:0,roughness:.4}));
      startBtn.position.set(4.98,C+.40,-.1);startBtn.userData.keepEm=true;startG.add(startBtn);
      place(startG,V(0,0,0),V(3.2,1.0,-1.4));
    }
    defPart('start',{name:'启动按钮',outside:true,isStart:true,text:'按一下，四台发动机就转起来啦！',
      more:'飞行员按下启动开关，先用气把发动机的风扇吹转，再喷油点火，发动机就自己转起来了。'},[startG]);

    /* ---------- 每帧 ---------- */
    let fanPh=0,dotPh=0;
    function update(dt){
      const S=api.S,t=now(),drv=S.drive,ee=api.ee,nn=S.night;
      const thrustT=(drv&&P.engineOn)||t<P.thrustUntil?1:0;
      P.thrust+=(thrustT-P.thrust)*Math.min(1,dt*1.6);
      P.flap+=(((drv&&P.flapT)||t<P.flapUntil?1:0)-P.flap)*Math.min(1,dt*1.4);
      P.gear+=(((drv&&P.gearT)||t<P.gearUntil?1:0)-P.gear)*Math.min(1,dt*.9);
      P.speed+=((drv?P.speedT:0)-P.speed)*Math.min(1,dt*.5);
      P.pitch+=((drv?P.pitchT:0)-P.pitch)*Math.min(1,dt*1.1);
      P.alt+=((drv?P.altT:0)-P.alt)*Math.min(1,dt*.55);
      P.door+=(((P.doorOpen?1:0))-P.door)*Math.min(1,dt*3);
      P.rud+=(((t<P.rudUntil)?1:0)-P.rud)*Math.min(1,dt*3);
      P.fuel+=(((drv&&P.engineOn)||t<P.fuelUntil?1:0)-P.fuel)*Math.min(1,dt*2.5);
      // 姿态：拆开时飞机回到水平地面
      const k=1-ee;root.position.y=P.alt*k;root.rotation.z=P.pitch*k;
      // 风扇 / 襟翼 / 起落架 / 方向舵 / 舱门
      fanPh+=dt*(1.5+P.thrust*26);for(const f of fans)f.rotation.x=fanPh;
      for(let i=0;i<flaps.length;i++)flaps[i].rotation.z=-P.flap*.55;
      for(const g of legs){g.rotation.z=P.gear*1.9;const k=1-.92*Math.max(0,(P.gear-.5)/.5);g.scale.setScalar(k);g.visible=k>.12;}// 收起来时缩进肚子里
      rudHinge.rotation.y=Math.sin(t/1000*1.6)*.5*P.rud;
      doorHinge.rotation.y=-P.door*1.9;
      // 油滴：从机翼流向发动机
      dotPh+=dt;fuelDots.forEach((d,i)=>{const c=fuelCurves[i%2],u=((dotPh*.5+i/8)%1);c.getPointAt(u,d.position);
        d.scale.setScalar(P.fuel*(1-ee)*(.6+.4*Math.sin(u*Math.PI)));});
      // 灯：晚上亮，航行灯一闪一闪
      const lightsOn=Math.max(nn,drv?.6:0),cpOn=Math.max(nn,(t<P.cpUntil||drv)?1:0);
      for(const w of winMats)w.emissiveIntensity=2.0*lightsOn;
      cpLampM.emissiveIntensity=1.6*cpOn;
      startBtn.userData.dynInt=drv||P.startOn?1.3:0;
    }
    const chain=[
      {t:'按一下启动按钮。',part:'start',on(){P.startOn=true;}},
      {t:'四台发动机呼呼地转起来。',part:'engine',on(){P.engineOn=true;api.sfx.loop('engine');}},
      {t:'襟翼放下来，翅膀变大一点。',part:'flap',on(){P.flapT=1;}},
      {t:'飞机在跑道上越跑越快！',part:'gear',on(){P.speedT=1;}},
      {t:'机头一抬，风把机翼托起来，飞起来啦！',part:'wing',on(){P.pitchT=.20;P.altT=2.2;}},
      {t:'起落架收进肚子里，飞得更快。',part:'gear',on(){P.gearT=1;P.altT=4.2;}},
      {t:'飞到云朵上面去啦！',part:'body',on(){P.pitchT=.10;P.altT=7.2;}},
    ];
    return {update,chain,camY(){return P.alt*.60*(1-api.ee);},
      onStart(){},
      onStop(){P.startOn=P.engineOn=false;P.flapT=P.gearT=P.speedT=0;P.pitchT=0;P.altT=0;},
      onDone(){}};
  }
};
})();

/* 场景：消防车（云梯车）。+x 车头，云梯从车顶转出来。 */
window.SCENES=window.SCENES||{};
(function(){
const S={leg:0,legT:0,pitch:0,pitchT:0,ext:0,extT:0,slew:0,slewT:0,water:0,waterT:0,eng:0,
  engineOn:false,engUntil:0,legUntil:0,ladUntil:0,waterUntil:0,siren:0};
let api=null;const now=()=>api.now();window.__FT=S;
const KEYS=['leg','pitch','ext','slew','water'];
const RESCUE=[
  {d:1300,to:{leg:1}},
  {d:900 ,to:{slew:1}},
  {d:1400,to:{pitch:1}},
  {d:1600,to:{ext:1}},
  {d:2600,to:{water:1}},
  {d:700 ,to:{water:0}},
  {d:1400,to:{ext:0,pitch:0}},
  {d:800 ,to:{slew:0,leg:0}},
];
let R=null;

SCENES.firetruck=Object.assign({
  id:'firetruck',title:'消防车',subtitle:'拖一拖转圈 · 点零件听听',night:true,
  fit:{w:12,h:8.5,ty:2.2,tyEx:3.0,rEx:1.25,cx:-.3},cameraStart:{theta:.95,phi:1.15},
  order:['ladder','monitor','tank','pump','legs','hose','light','cab','engine','box','body','start'],
  go:{on:'出动',off:'停下',stopSaid:'停下啦',stopHint:'再按一下，再出动一次！',
    done:'火灭啦！云梯收回来，可以回队里了。',doneHintXray:'看，水泵把水从水箱抽到高处。点「停下」再来一次。',
    doneHint:'点「看里面」，看看水是怎么被送上去的。'},
  intro:{icon:'ladder',name:'消防车',text:'点一点消防车的零件，听听它叫什么。按「出动」看云梯怎么升起来喷水。'},
  poster:{title:'消防车怎么把水送到那么高',sub:'靠一台很有劲的水泵，和一架能伸长的云梯',
    summary:'撑好腿 → 云梯升起来伸出去 → 水泵加压 → 水柱直接打到楼上！',angle:{theta:.95,phi:1.15},
    keys:['ladder','monitor','pump','tank','legs']},

  env(ctx,_api){
    api=_api;
    const {THREE,scene,mm,roundedBox,flat,matte,plastic}=ctx;
    const s=RIG.site(ctx,{kind:'road',seed:911,fence:false});
    // 着火的小楼
    const b=new THREE.Group();
    const wall=roundedBox(3.2,5.0,3.0,.1,plastic(0xE6DED2));wall.position.y=2.5;b.add(wall);
    for(let f=0;f<3;f++)for(const s2 of [-.8,.8]){
      const w=mm(new THREE.BoxGeometry(.06,.7,.7),matte(0x6E7B88));
      w.position.set(1.62,1.3+f*1.5,s2);b.add(w);
    }
    const roof=roundedBox(3.5,.3,3.3,.06,plastic(0xC65B4A));roof.position.y=5.15;b.add(roof);
    b.position.set(-7.0,0,0);b.traverse(o=>{if(o.isMesh)o.castShadow=true;});scene.add(b);
    const fires=[];
    for(let i=0;i<8;i++){
      const f=mm(new THREE.ConeGeometry(.22,.6,8),
        new THREE.MeshStandardMaterial({color:0xFF7A2F,emissive:0xFF5A1F,emissiveIntensity:1.2,roughness:.5}));
      f.userData.keepEm=true;f.castShadow=false;f.userData.u=i/8;scene.add(f);fires.push(f);
    }
    return {occluders:s.occluders,update(){
      const t=api.now(),alive=1-S.water;
      for(const f of fires){
        const u=f.userData.u;
        f.position.set(-5.4+Math.sin(u*9)*.4,3.6+Math.cos(u*7)*1.1,(u-.5)*2.2);
        f.scale.setScalar(alive*(.7+.3*Math.sin(t/160+u*8)));
        f.visible=alive>.05;
      }
    }};
  },

  build(ctx,_api){
    api=_api;
    const {THREE,V,mm,roundedBox,steel,chrome,dark,matte,plastic,place,defPart,markShell,root}=ctx;
    const RED=0xD8382C;
    R=RIG.seqRunner(S,KEYS);

    const tk=RIG.truck(ctx,{color:RED,cabX:2.6,wheelR:.52,halfZ:.95,
      frameFrom:-3.6,frameTo:3.4,axles:[{x:2.3},{x:-1.6,dual:true},{x:-2.7,dual:true}]});
    place(tk.group,V(0,0,0),V(0,0,0));
    defPart('body',{name:'车身',outside:true,
      text:'红色的大车身，两边全是放工具的柜子。',
      more:'消防车两侧一格一格的都是卷帘门，里面放着水带、斧头、破拆工具和空气呼吸器，每样东西都有固定位置，抓了就能跑。'},[tk.group]);
    defPart('cab',{name:'驾驶室',outside:true,
      text:'消防员坐在里面，路上就把装备穿好。',
      more:'消防车的驾驶室坐得下六个人，座椅背后就挂着空气呼吸器，路上直接背上，到了就能冲进去。'},[tk.cab]);

    /* 车厢：驾驶室后面一整段，两侧全是器材柜 */
    const boxG=new THREE.Group();
    {
      const shell=roundedBox(4.5,1.15,2.15,.1,plastic(RED));shell.position.set(-1.1,1.32,0);boxG.add(shell);
      const top=roundedBox(4.5,.1,2.0,.03,steel(0x9aa2ad));top.position.set(-1.1,1.94,0);boxG.add(top);
      const stripe=roundedBox(4.54,.16,2.19,.03,plastic(0xE8E4DC));stripe.position.set(-1.1,.95,0);boxG.add(stripe);
      markShell(boxG);place(boxG,V(0,0,0),V(0,2.3,0));
    }
    defPart('box',{name:'车厢',outside:true,
      text:'驾驶室后面这一大段，装着水箱、水泵和全部装备。',
      more:'消防车的车厢里塞得满满当当：水箱在中间，水泵在下面，两侧一格格的柜子放水带和工具。'},[boxG]);
    /* 器材柜 */
    const hoseG=new THREE.Group();
    for(const s of [1,-1])for(const x of [-.2,-1.9]){
      const door=roundedBox(1.4,.9,.06,.03,steel(0xB8BEC6));
      door.position.set(x,1.32,s*1.09);hoseG.add(door);
      for(let i=0;i<6;i++){
        const line=roundedBox(1.34,.02,.03,.01,dark(0x8a929e));
        line.position.set(x,.98+i*.14,s*1.13);hoseG.add(line);
      }
      const handle=roundedBox(.5,.05,.05,.02,steel(0x6b7280));
      handle.position.set(x,1.72,s*1.13);hoseG.add(handle);
    }
    root.add(hoseG);
    defPart('hose',{name:'器材柜',outside:true,
      text:'两边的卷帘门一拉，水带和工具全在里面。',
      more:'水带一盘一盘卷好放在柜子里，一个人一只手就能拎起来跑。用完要洗干净晾干再卷回去。'},[hoseG]);

    /* 支腿 */
    const legsG=new THREE.Group();const legs=[];
    for(const sx of [1,-1])for(const sz of [1,-1]){
      const og=RIG.outrigger(ctx,{color:RED,out:.9,drop:.58});
      og.group.position.set(sx*1.9,.62,sz*.9);
      og.group.rotation.y=sz>0?0:Math.PI;
      legsG.add(og.group);legs.push(og);
    }
    root.add(legsG);
    defPart('legs',{name:'支腿',outside:true,
      text:'四条腿撑住地面，云梯伸出去才不会翻。',
      more:'云梯伸到二十多米长，顶端还站着人，整台车会被拉得往一边倒。四条支腿把支撑面积撑大，车才稳。',
      action(){S.legUntil=now()+3000;}},[legsG]);

    /* 转台 + 云梯 */
    const turn=new THREE.Group();turn.position.set(-1.4,2.02,0);root.add(turn);
    const ladPivot=new THREE.Group();ladPivot.position.set(0,.35,0);turn.add(ladPivot);
    const ladG=new THREE.Group();ladPivot.add(ladG);
    const rungs=[];
    {
      for(let sec=0;sec<3;sec++){
        const k=Math.pow(.82,sec);
        const holder=new THREE.Group();
        for(const s of [1,-1]){
          const rail=roundedBox(3.0,.1*k,.09*k,.02,plastic(sec?0xE8E4DC:RED));
          rail.position.set(1.5,0,s*.28*k);holder.add(rail);
        }
        for(let i=0;i<7;i++){
          const rg=mm(new THREE.CylinderGeometry(.035*k,.035*k,.56*k,8),steel(0x9aa2ad));
          rg.rotation.x=Math.PI/2;rg.position.set(.25+i*.42,0,0);holder.add(rg);
        }
        ladG.add(holder);rungs.push(holder);
      }
      const basket=new THREE.Group();
      const fl=roundedBox(.55,.06,.6,.02,plastic(0xE8E4DC));basket.add(fl);
      for(const [dx,dz] of [[.26,0],[-.26,0],[0,.3],[0,-.3]]){
        const w=roundedBox(dx?.06:.55,.5,dz?.06:.6,.02,steel(0xB8BEC6));
        w.position.set(dx,.26,dz);basket.add(w);
      }
      basket.position.set(3.0,.2,0);ladG.add(basket);
      ladG.userData.basket=basket;
    }
    defPart('ladder',{name:'云梯',outside:true,
      text:'一节套一节伸出去，能够到好几层楼那么高。',
      more:'云梯是三节套在一起的，钢丝绳一拉就一节节伸出去。顶端有个小平台，消防员站在上面救人。',
      action(){S.ladUntil=now()+3600;}},[ladG]);

    /* 水炮 */
    const monG=new THREE.Group();
    {
      const base=mm(new THREE.CylinderGeometry(.11,.13,.16,14),steel(0x6b7280));monG.add(base);
      const barrel=mm(new THREE.CylinderGeometry(.07,.09,.5,14),chrome());
      barrel.rotation.z=-Math.PI/2;barrel.position.set(.25,.12,0);monG.add(barrel);
      ladG.userData.basket.add(monG);monG.position.set(.15,.42,0);
    }
    defPart('monitor',{name:'水炮',outside:true,
      text:'梯子顶上的水枪，水柱能打得很远。',
      more:'水炮是遥控的，消防员在下面就能左右上下转。水从车上一路顺着管子送到这里喷出去。',
      action(){S.waterUntil=now()+3200;}},[monG]);

    /* 水流 */
    const jet=[];
    for(let i=0;i<16;i++){
      const d=mm(new THREE.SphereGeometry(.11,7,6),matte(0x8FD0F5));
      d.castShadow=false;d.userData.u=i/16;d.userData.noHit=true;root.add(d);jet.push(d);
    }

    /* 水箱 */
    const tankG=new THREE.Group();
    {
      const t=roundedBox(2.4,.9,1.7,.1,plastic(0xB8BEC6));tankG.add(t);
      const gauge=mm(new THREE.CylinderGeometry(.12,.12,.06,14),matte(0x2F3A4A));
      gauge.rotation.x=Math.PI/2;gauge.position.set(-1.1,.2,.87);tankG.add(gauge);
      place(tankG,V(-2.3,1.30,0),V(-3.6,2.4,0));
    }
    defPart('tank',{name:'水箱',
      text:'车上自己带着好几吨水，到了就能喷。',
      more:'水箱里的水只够喷几分钟，所以消防车到场以后要马上接消火栓，一边喷一边补水。'},[tankG]);

    /* 水泵 */
    const pumpG=new THREE.Group();
    {
      const body=mm(new THREE.CylinderGeometry(.34,.34,.5,18),steel(0x6b7280));
      body.rotation.x=Math.PI/2;pumpG.add(body);
      const imp=mm(new THREE.TorusGeometry(.2,.06,8,18),chrome());pumpG.add(imp);
      for(const s of [1,-1]){
        const port=mm(new THREE.CylinderGeometry(.13,.13,.4,12),matte(0xD8382C));
        port.rotation.z=Math.PI/2;port.position.set(s*.4,0,0);pumpG.add(port);
      }
      place(pumpG,V(-.5,.92,0),V(-.8,1.7,2.0));
    }
    defPart('pump',{name:'水泵',
      text:'水泵把水加压，才能喷到楼上去。',
      more:'水泵像一个装了叶轮的大风扇，叶轮飞快地转，把水甩出去，压力一下子变得很大，水柱才能打到十几米高。',
      action(){S.waterUntil=now()+3200;}},[pumpG]);

    /* 警灯 */
    const lightG=new THREE.Group();
    {
      const bar=roundedBox(1.4,.14,.36,.05,dark(0x2F3A4A));lightG.add(bar);
      for(let i=0;i<4;i++){
        const l=mm(new THREE.BoxGeometry(.3,.12,.3),
          new THREE.MeshStandardMaterial({color:i%2?0x3E7BC6:0xE04A3A,
            emissive:i%2?0x3E7BC6:0xE04A3A,emissiveIntensity:.8,roughness:.4}));
        l.userData.keepEm=true;l.position.set(-.5+i*.34,0,0);lightG.add(l);
      }
      lightG.position.set(2.6,2.32,0);root.add(lightG);
    }
    defPart('light',{name:'警灯',outside:true,
      text:'红蓝灯一闪一闪，大家就知道要让路。',
      more:'消防车出警时警灯和警笛一起开。看到闪灯听到笛声，前面的车都要靠边让出一条生命通道。'},[lightG]);

    const eng=RIG.engine(ctx,{scale:1.0});
    place(eng.group,V(2.6,.95,0),V(3.6,1.9,0));
    defPart('engine',{name:'发动机',
      text:'发动机既让车跑，也带着水泵转。',
      more:'到了火场，司机会把发动机的力气切给水泵。所以喷水的时候车是停着的，但发动机一直在大声地转。',
      action(){S.engUntil=now()+3200;}},[eng.group]);

    const sb=RIG.startBtn(ctx,2.6,2.6,1.0);root.add(sb.group);
    defPart('start',{name:'启动按钮',isStart:true,
      text:'按一下，消防车就出动啦！',
      more:'警铃一响，消防员几十秒就能穿好衣服上车出发。'},[sb.group]);

    function update(dt){
      const t=now(),drv=api.S.drive,ee=api.ee;
      R.tick(dt);
      if(t<S.legUntil)S.legT=.5+.5*Math.sin(t/500);
      if(t<S.ladUntil){S.pitchT=.5+.5*Math.sin(t/700);S.extT=.5+.5*Math.sin(t/900);}
      if(t<S.waterUntil)S.waterT=1;
      if(!drv&&t>S.legUntil&&t>S.ladUntil&&t>S.waterUntil)R.idle(dt,1.3);
      R.ease(dt,3.2);
      const engOn=(drv&&S.engineOn)||t<S.engUntil;
      S.eng+=((engOn?1:0)-S.eng)*Math.min(1,dt*3);

      for(const og of legs)og.set(S.leg*(1-ee));
      turn.rotation.y=-1.0*S.slew;
      turn.position.set(-1.4,2.02+2.0*ee,0);
      ladPivot.rotation.z=1.05*S.pitch;
      for(let i=0;i<rungs.length;i++)rungs[i].position.x=i*2.55*S.ext;

      // 水柱：从水炮沿抛物线飞向着火的楼
      const bk=ladG.userData.basket;
      bk.getWorldPosition(_w);
      const spraying=S.water>.1&&ee<.2;
      for(const d of jet){
        const u=((d.userData.u+t/700)%1);
        d.position.set(_w.x-u*4.4,_w.y+.5+u*.9-u*u*2.6,_w.z);
        d.visible=spraying;d.scale.setScalar(spraying?1:0);
      }
      lightG.position.set(2.6,2.32+1.5*ee,0);
      const bl=Math.sin(t/120)>0;
      lightG.children.forEach((l,i)=>{if(i)l.material.emissiveIntensity=((i%2===0)===bl)?1.6:.2;});
      eng.spin(dt,S.eng);
      sb.pulse(drv,t);
    }
    const _w=new THREE.Vector3();

    const chain=[
      {t:'按一下，警灯闪起来，消防车出动！',part:'start',on(){}},
      {t:'发动机转起来，一路开到着火的楼下。',part:'engine',inner:true,
        on(){S.engineOn=true;api.sfx.loop('engine');R.start(RESCUE,2);}},
      {t:'先撑好四条支腿，车才站得稳。',part:'legs'},
      {t:'云梯转过去、抬起来、一节节伸出去。',part:'ladder'},
      {t:'水泵把水加压，顺着管子送到梯子顶上。',part:'pump',inner:true},
      {t:'水炮喷水，把火浇灭！',part:'monitor'},
    ];

    return {update,chain,
      onStop(){R.stop();S.engineOn=false;for(const k of KEYS)S[k+'T']=0;},
      onStart(){},onDone(){S.engineOn=false;}};
  }
},RIG.SKY.street);
})();

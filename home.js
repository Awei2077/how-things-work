/* 首页：会慢慢转的 3D 小卡片。
   卡片有二十多张，每张一个 WebGL 上下文会超过浏览器上限（约 16 个），
   所以这里只开一个离屏渲染器，轮流把每张卡画出来再拷到卡片自己的 2D 画布上。 */
(function(){
const stubApi={S:{drive:false,xray:false,explode:false,ex:0,xr:0,sel:null,nightT:0,night:0},
  now:()=>performance.now(),ee:0,
  sfx:{ac(){},click(){},pop(){},horn(){},ding(){},loop(){},stopLoop(){}},
  say(){return Promise.resolve()},caption(){},toggleNight(){},hop(){},select(){},focusPart(){},setExplode(){}};

const gl=document.createElement('canvas');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:gl,antialias:true,alpha:true,preserveDrawingBuffer:true});}
catch(e){return;}
const PR=Math.min(devicePixelRatio||1,2);
renderer.setPixelRatio(PR);renderer.setClearColor(0,0);
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const cards=[];
document.querySelectorAll('.card[data-scene]').forEach(card=>{
  const id=card.dataset.scene,SC=window.SCENES[id];if(!SC)return;
  const canvas=card.querySelector('canvas');
  const g2=canvas.getContext('2d');if(!g2)return;
  const LOOK=SC.look||{};
  const scene=new THREE.Scene();
  const envTex=L3.gradientEnv(...(SC.envMap||['#ffffff','#f7f1e7','#d8cfbf','#b6ab98']));
  if(LOOK.srgb)envTex.encoding=THREE.sRGBEncoding;
  scene.environment=envTex;
  const hemi=new THREE.HemisphereLight((SC.hemi||{}).sky||0xdfefff,(SC.hemi||{}).ground||0x9aa4b2,LOOK.hemi||.9);
  scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff2e0,LOOK.sun||.8);
  sun.position.set(4,7,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
  if(LOOK.srgb){hemi.color.convertSRGBToLinear();hemi.groundColor.convertSRGBToLinear();sun.color.convertSRGBToLinear();}
  const root=new THREE.Group();scene.add(root);
  const ctx=L3.makeCtx(scene,root);
  try{SC.build(ctx,stubApi);}catch(e){return;}
  root.updateWorldMatrix(true,true);
  const box=new THREE.Box3();
  root.traverse(o=>{if(o.isMesh&&!o.userData.noHit&&o.visible&&o.material.opacity>.05)box.expandByObject(o);});
  if(box.isEmpty())return;
  const sph=box.getBoundingSphere(new THREE.Sphere());
  const disc=new THREE.Mesh(new THREE.CircleGeometry(sph.radius*1.4,48),
    new THREE.MeshStandardMaterial({color:SC.night?0x7fc26a:0xE7DFD2,roughness:1}));
  if(LOOK.srgb)disc.material.color.convertSRGBToLinear();
  disc.rotation.x=-Math.PI/2;disc.position.y=box.min.y-.002;disc.receiveShadow=true;scene.add(disc);
  Object.assign(sun.shadow.camera,{left:-sph.radius*1.5,right:sph.radius*1.5,
    top:sph.radius*1.5,bottom:-sph.radius*1.5,near:.5,far:sph.radius*8});
  sun.shadow.camera.updateProjectionMatrix();
  const cam=new THREE.PerspectiveCamera(32,1,.05,100);
  const pivot=new THREE.Group();scene.add(pivot);scene.remove(root);pivot.add(root);
  root.position.set(-sph.center.x,0,-sph.center.z);pivot.add(disc);disc.position.x=0;disc.position.z=0;
  const d=sph.radius/Math.sin(THREE.MathUtils.degToRad(cam.fov/2))*1.12;
  cam.position.set(Math.sin(.9)*d*.85,sph.center.y+d*.42,Math.cos(.9)*d*.85);
  cam.lookAt(0,sph.center.y*.95,0);
  cards.push({scene,cam,pivot,canvas,g2,card,exposure:LOOK.exposure||1.15,
    srgb:!!LOOK.srgb,phase:Math.random()*6});
});

let last=performance.now(),cursor=0;
function frame(){
  requestAnimationFrame(frame);
  const t=performance.now(),dt=Math.min((t-last)/1000,.05);last=t;
  for(const c of cards)c.pivot.rotation.y+=dt*.35;
  // 每帧只画几张，二十多张卡片一次全画会掉帧
  const budget=Math.min(cards.length,4);
  for(let k=0;k<budget;k++){
    const c=cards[cursor];cursor=(cursor+1)%cards.length;
    const w=c.canvas.clientWidth,h=c.canvas.clientHeight;
    if(!w||!h)continue;
    const r=c.card.getBoundingClientRect();
    if(r.bottom<-200||r.top>innerHeight+200)continue;   // 屏幕外的不画
    const pw=Math.round(w*PR),ph=Math.round(h*PR);
    if(c.canvas.width!==pw||c.canvas.height!==ph){c.canvas.width=pw;c.canvas.height=ph;}
    renderer.setSize(w,h,false);
    renderer.outputEncoding=c.srgb?THREE.sRGBEncoding:THREE.LinearEncoding;
    renderer.toneMappingExposure=c.exposure;
    c.cam.aspect=w/h;c.cam.updateProjectionMatrix();
    renderer.render(c.scene,c.cam);
    c.g2.clearRect(0,0,pw,ph);
    c.g2.drawImage(gl,0,0,pw,ph);
  }
}
frame();
})();

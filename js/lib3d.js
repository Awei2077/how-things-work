/* 它怎么动 · 3D 公共工具：材质、造型、放样、零件注册（引擎和首页共用） */
(function(){
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const paint=(c=0xC4161C)=>new THREE.MeshPhysicalMaterial({color:c,metalness:.08,roughness:.4,clearcoat:.7,clearcoatRoughness:.18,envMapIntensity:.75});// 车漆：清漆亮一点，平面上的反光才像钣金不像充气
const chrome=()=>new THREE.MeshStandardMaterial({color:0xe3e7ee,metalness:.95,roughness:.2});
const steel=(c=0x7c8590)=>new THREE.MeshStandardMaterial({color:c,metalness:.65,roughness:.42});
const dark=(c=0x1f242e)=>new THREE.MeshStandardMaterial({color:c,metalness:.2,roughness:.6});
const matte=c=>new THREE.MeshStandardMaterial({color:c,metalness:.05,roughness:.7});
const flat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.9,metalness:0},o));
const plastic=(c)=>new THREE.MeshPhysicalMaterial({color:c,metalness:0,roughness:.35,clearcoat:.6,clearcoatRoughness:.25});
const glassMat=(c=0x8fc3ee,op=.42)=>new THREE.MeshPhysicalMaterial({color:c,metalness:.1,roughness:.06,transparent:true,opacity:op,depthWrite:false});
function mm(geo,mat){const m=new THREE.Mesh(geo,mat);m.castShadow=true;return m;}
function roundedBox(w,h,d,r=.06,mat){
  const bev=Math.min(r,d/2*.9),ww=w-2*bev,hh=h-2*bev,rr=Math.max(r-bev,.001);
  const s=new THREE.Shape(),x=-ww/2,y=-hh/2;
  s.moveTo(x+rr,y);s.lineTo(x+ww-rr,y);s.quadraticCurveTo(x+ww,y,x+ww,y+rr);s.lineTo(x+ww,y+hh-rr);s.quadraticCurveTo(x+ww,y+hh,x+ww-rr,y+hh);
  s.lineTo(x+rr,y+hh);s.quadraticCurveTo(x,y+hh,x,y+hh-rr);s.lineTo(x,y+rr);s.quadraticCurveTo(x,y,x+rr,y);
  const g=new THREE.ExtrudeGeometry(s,{depth:d-2*bev,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:3,curveSegments:6});
  g.translate(0,0,-(d-2*bev)/2);return mm(g,mat);
}
function capsule(r,len,mat,seg=20){const g=new THREE.Group();const c=mm(new THREE.CylinderGeometry(r,r,len,seg),mat);c.rotation.z=Math.PI/2;g.add(c);
  for(const s of [1,-1]){const e=mm(new THREE.SphereGeometry(r,seg,12),mat);e.position.x=s*len/2;g.add(e);}return g;}
function tubeM(a,b,r,mat,seg=10){const d=V().subVectors(b,a),len=d.length();const m=mm(new THREE.CylinderGeometry(r,r,len,seg),mat);
  m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return m;}
function pathTube(pts,r,mat,seg=48){const curve=new THREE.CatmullRomCurve3(pts);return mm(new THREE.TubeGeometry(curve,seg,r,10,false),mat);}
function sampler(pairs){ // 单调三次插值（Fritsch-Carlson）
  const P=[...pairs].sort((a,b)=>a[0]-b[0]),xs=P.map(p=>p[0]),ys=P.map(p=>p[1]),n=xs.length,d=[],m=[];
  for(let i=0;i<n-1;i++)d.push((ys[i+1]-ys[i])/(xs[i+1]-xs[i]));
  m[0]=d[0];m[n-1]=d[n-2];
  for(let i=1;i<n-1;i++){if(d[i-1]*d[i]<=0)m[i]=0;else{const h0=xs[i]-xs[i-1],h1=xs[i+1]-xs[i],w1=2*h1+h0,w2=h1+2*h0;m[i]=(w1+w2)/(w1/d[i-1]+w2/d[i]);}}
  return x=>{if(x<=xs[0])return ys[0];if(x>=xs[n-1])return ys[n-1];let i=0;while(x>xs[i+1])i++;
    const h=xs[i+1]-xs[i],t=(x-xs[i])/h,t2=t*t,t3=t2*t;
    return (2*t3-3*t2+1)*ys[i]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*ys[i+1]+(t3-t2)*h*m[i+1];};
}
function ringPts(st,N){
  const h=Math.max(st.y1-st.y0,.004),hw=Math.max(st.hw,.02);
  const rb=Math.min(st.rb,h*.45,hw*.9),rt=Math.min(st.rt,h*.45,hw*.9),y0=st.y0,y1=st.y1;
  const s=new THREE.Shape();
  s.moveTo(0,y0);s.lineTo(hw-rb,y0);s.quadraticCurveTo(hw,y0,hw,y0+rb);s.lineTo(hw,y1-rt);s.quadraticCurveTo(hw,y1,hw-rt,y1);
  s.lineTo(-hw+rt,y1);s.quadraticCurveTo(-hw,y1,-hw,y1-rt);s.lineTo(-hw,y0+rb);s.quadraticCurveTo(-hw,y0,-hw+rb,y0);s.lineTo(0,y0);
  return s.getSpacedPoints(N).slice(0,N);
}
/* 放样：沿 x 轴用一串圆角截面拉出光滑壳体。keys:[{x,hw,y0,y1,rb,rt}]，xs：截面位置（从大到小） */
function loft(keys,xs,mat,opts={}){
  const N=opts.ringN||32,adjust=opts.adjust||((x,st)=>st);
  const F={};for(const k of ['hw','y0','y1','rb','rt'])F[k]=sampler(keys.map(s=>[s.x,s[k]]));
  const rings=xs.map(x=>ringPts(adjust(x,{x,hw:F.hw(x),y0:F.y0(x),y1:F.y1(x),rb:F.rb(x),rt:F.rt(x)}),N));
  const M=xs.length,pos=[];
  for(let i=0;i<M;i++)for(const p of rings[i])pos.push(xs[i],p.y,p.x);
  const avgY=r=>r.reduce((a,p)=>a+p.y,0)/r.length;
  const c0=M*N,c1=M*N+1;pos.push(xs[0],avgY(rings[0]),0,xs[M-1],avgY(rings[M-1]),0);
  const side=[],capA=[],capB=[];
  for(let i=0;i<M-1;i++)for(let j=0;j<N;j++){const a=i*N+j,b=i*N+(j+1)%N,c=(i+1)*N+j,d=(i+1)*N+(j+1)%N;side.push([a,b,c],[b,d,c]);}
  for(let j=0;j<N;j++){capA.push([c0,j,(j+1)%N]);capB.push([c1,(M-1)*N+(j+1)%N,(M-1)*N+j]);}
  const P=i=>V(pos[i*3],pos[i*3+1],pos[i*3+2]);
  const faceN=t=>{const a=P(t[0]),b=P(t[1]),c=P(t[2]);return b.sub(a).cross(c.sub(a));};
  const fix=(tris,test,want)=>{if(faceN(test).dot(want)<0)for(const t of tris){const x=t[1];t[1]=t[2];t[2]=x;}};
  {const im=Math.floor(M/2),t=side[im*N*2+Math.floor(N/4)*2];const cen=V(xs[im],avgY(rings[im]),0);fix(side,t,P(t[0]).sub(cen));}
  fix(capA,capA[0],V(Math.sign(xs[0]-xs[M-1]),0,0));fix(capB,capB[0],V(Math.sign(xs[M-1]-xs[0]),0,0));
  const idx=[];for(const t of side.concat(capA,capB))idx.push(...t);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  return mm(crease(g,opts.crease==null?40:opts.crease),mat);
}
/* 折角法线：夹角小于阈值的面才互相平滑，超过就断开。
   不这样做的话，机盖、车顶这种平面会被平滑到边缘，看着像充了气的面包。 */
function crease(geo,deg){
  const g=geo.index?geo.toNonIndexed():geo;g.computeVertexNormals();// 非索引：每个三角形先拿到自己的面法线
  const pos=g.attributes.position,nrm=g.attributes.normal,n=pos.count,cos=Math.cos(deg*Math.PI/180);
  const bucket=new Map();
  for(let i=0;i<n;i++){const k=(Math.round(pos.getX(i)*1e3))+','+(Math.round(pos.getY(i)*1e3))+','+(Math.round(pos.getZ(i)*1e3));
    let a=bucket.get(k);if(!a){a=[];bucket.set(k,a);}a.push(i);}
  const out=new Float32Array(n*3);
  for(const arr of bucket.values())for(const i of arr){
    const ix=nrm.getX(i),iy=nrm.getY(i),iz=nrm.getZ(i);let ax=0,ay=0,az=0;
    for(const j of arr){const jx=nrm.getX(j),jy=nrm.getY(j),jz=nrm.getZ(j);
      if(ix*jx+iy*jy+iz*jz>=cos){ax+=jx;ay+=jy;az+=jz;}}
    const L=Math.hypot(ax,ay,az)||1;out[i*3]=ax/L;out[i*3+1]=ay/L;out[i*3+2]=az/L;}
  g.setAttribute('normal',new THREE.BufferAttribute(out,3));return g;
}
function stationsX(from,to,step,fine){const set=new Set();for(let x=from;x>=to-1e-6;x-=step)set.add(+x.toFixed(4));set.add(+to.toFixed(4));
  for(const [c,r,s] of fine||[])for(let x=c-r;x<=c+r+1e-6;x+=s)if(x<=from&&x>=to)set.add(+x.toFixed(4));return [...set].sort((a,b)=>b-a);}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;}
function rngFactory(seed){let s=seed;return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};}
/* 环境反射用的渐变天空盒（top/side/bottom 三个颜色段） */
function gradientEnv(top,horizonTop,horizonBottom,bottom){
  const size=64,mk=fn=>{const c=document.createElement('canvas');c.width=c.height=size;fn(c.getContext('2d'));return c;};
  const side=()=>mk(g=>{const gr=g.createLinearGradient(0,0,0,size);gr.addColorStop(0,top);gr.addColorStop(.5,horizonTop);gr.addColorStop(.52,horizonBottom);gr.addColorStop(1,bottom);g.fillStyle=gr;g.fillRect(0,0,size,size);});
  const t=mk(g=>{g.fillStyle=top;g.fillRect(0,0,size,size);}),b=mk(g=>{g.fillStyle=bottom;g.fillRect(0,0,size,size);});
  const tex=new THREE.CubeTexture([side(),side(),t,b,side(),side()]);tex.needsUpdate=true;return tex;
}
/* 把整个场景的颜色从 sRGB 换算到线性空间。开了 renderer.outputEncoding 以后必须走这一步，
   否则颜色偏亮偏灰；换算完还要把 baseCol/baseEm 这些缓存重新取一遍。 */
function linearizeScene(scene){
  const seenMat=new Set(),seenMap=new Set();
  scene.traverse(o=>{
    if(!o.isMesh)return;
    for(const m of (Array.isArray(o.material)?o.material:[o.material])){
      if(!m||seenMat.has(m))continue;seenMat.add(m);
      if(m.color)m.color.convertSRGBToLinear();
      if(m.emissive)m.emissive.convertSRGBToLinear();
      if(m.map&&!seenMap.has(m.map)){seenMap.add(m.map);m.map.encoding=THREE.sRGBEncoding;m.map.needsUpdate=true;}
    }
    if(o.userData.baseCol)o.userData.baseCol.copy(o.material.color);
    if(o.material.emissive)o.userData.baseEm=o.material.emissive.getHex();
  });
}
/* 零件注册：place 记录本位/拆开偏移；defPart 登记可点零件；markShell 标记透视时要变透明的外壳 */
function makeCtx(scene,root){
  const PARTS={},placed=[],hitTargets=[],shellMeshes=[];
  function place(obj,home,explode){obj.position.copy(home);obj.userData.home=home.clone();obj.userData.explode=explode.clone();obj.userData.hopT0=-1e9;placed.push(obj);return obj;}
  function defPart(id,def,groups){
    const p=PARTS[id]=Object.assign({id,meshes:[],groups,outlines:[]},def);
    for(const g of groups){if(!g.parent)root.add(g);g.traverse(o=>{if(!o.isMesh)return;o.userData.part=id;p.meshes.push(o);
      const m=o.material;o.userData.baseEm=m.emissive?m.emissive.getHex():0;o.userData.baseInt=m.emissiveIntensity||0;o.userData.dynInt=m.emissiveIntensity||0;
      if(!o.userData.noHit&&!o.userData.glass)hitTargets.push(o);});}
    return p;
  }
  function markShell(group){group.traverse(o=>{if(o.isMesh){shellMeshes.push(o);if(o.userData.baseOp==null)o.userData.baseOp=o.material.transparent?o.material.opacity:1;o.userData.baseCol=o.material.color.clone();}});}
  return {THREE,scene,root,V,paint,chrome,steel,dark,matte,flat,plastic,glassMat,mm,roundedBox,capsule,tubeM,pathTube,loft,crease,stationsX,canvasTex,rngFactory,gradientEnv,
    linearize:()=>linearizeScene(scene),
    place,defPart,markShell,PARTS,placed,hitTargets,shellMeshes};
}
window.L3={V,paint,chrome,steel,dark,matte,flat,plastic,glassMat,mm,roundedBox,capsule,tubeM,pathTube,loft,crease,stationsX,canvasTex,rngFactory,gradientEnv,linearizeScene,makeCtx};
})();

/* 汽车「影棚」样板页：车身、材质、轮胎都已经在 scenes/car.js 里了，
   这一层只换掉展示环境——把户外街景换成影棚地板 + 环境反射，另外加一个单零件聚焦。
   正式页 car.html 不加载这个文件。 */
(function () {
  'use strict';
  const SC = window.SCENES.car;
  const { THREE, L3 } = window;
  const linear = hex => new THREE.Color(hex).convertSRGBToLinear();

  document.body.classList.add('model-view');
  SC.look = { srgb: true, hemi: .4, sun: .95, fill: .24, rim: .45, exposure: .96, autoRotate: 0 };
  SC.sky = 'linear-gradient(180deg,#e8eff5 0%,#f3f6f8 65%,#e9eff2 100%)';
  SC.fog = null;
  SC.envMap = null;
  SC.hemi = { sky: 0xf1f5f8, ground: 0xb6bdc4 };
  SC.fit = { w: 6.25, h: 3.9, ty: 1.02, tyEx: 2.0, rEx: 1.68 };
  SC.cameraStart = { theta: 1.00, phi: 1.28 };
  SC.subtitle = '转一转，看看真正的机器';

  // 六张本地画布拼成的影棚环境，两个渲染器都能用，不依赖外部 HDR 文件。
  function studioEnvironment() {
    const size = 512;
    const faces = Array.from({ length: 6 }, (_, side) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const g = canvas.getContext('2d');
      const gradient = g.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, '#c5cfd8');
      gradient.addColorStop(.48, '#8797a6');
      gradient.addColorStop(.55, '#a8b3be');
      gradient.addColorStop(1, '#566570');
      g.fillStyle = gradient;
      g.fillRect(0, 0, size, size);
      if (side === 2) {
        g.fillStyle = '#8d99a5';
        g.fillRect(0, 0, size, size);
        g.filter = 'blur(14px)';
        g.fillStyle = '#ffffff';
        g.fillRect(size * .12, size * .16, size * .68, size * .22);
        g.fillRect(size * .52, size * .60, size * .24, size * .28);
        g.filter = 'none';
      } else if (side === 3) {
        g.fillStyle = '#929da6';
        g.fillRect(0, 0, size, size);
      } else {
        g.filter = 'blur(9px)';
        g.fillStyle = side === 0 || side === 4 ? '#ffffff' : '#dce6ee';
        g.fillRect(size * .12, size * .12, size * .72, size * .28);
        g.fillStyle = '#edf3f7';
        g.fillRect(size * .76, size * .38, size * .13, size * .34);
        g.filter = 'none';
      }
      return canvas;
    });
    const texture = new THREE.CubeTexture(faces);
    texture.encoding = THREE.sRGBEncoding;
    texture.needsUpdate = true;
    return texture;
  }

  SC.env = function (ctx, api) {
    const { scene } = ctx;
    scene.environment = studioEnvironment();
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xe4edf3, metalness: 0, roughness: .94 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.015;
    floor.receiveShadow = true;
    scene.add(floor);
    const fogDay = linear(0xe8eff5), fogNight = linear(0x152a5c);
    const fog = new THREE.Fog(fogDay.clone(), 18, 55);
    scene.fog = fog;

    const contactMap = L3.canvasTex(256, 256, (g, w, h) => {
      const gradient = g.createRadialGradient(w / 2, h / 2, w * .13, w / 2, h / 2, w * .49);
      gradient.addColorStop(0, 'rgba(23,38,53,.2)');
      gradient.addColorStop(.58, 'rgba(23,38,53,.12)');
      gradient.addColorStop(1, 'rgba(23,38,53,0)');
      g.fillStyle = gradient;
      g.fillRect(0, 0, w, h);
    });
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.4), new THREE.MeshBasicMaterial({ map: contactMap, transparent: true, depthWrite: false }));
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = -.008;
    scene.add(contact);
    const day = linear(0xe4edf3), night = linear(0x77859b);
    return {
      occluders: [],
      update() {
        floorMaterial.color.copy(day).lerp(night, api.S.night);
        fog.color.copy(fogDay).lerp(fogNight, api.S.night);
        contact.material.opacity = 1 - api.S.ex * .75;
      }
    };
  };

  // 单零件聚焦：点一个零件，其余整车先藏起来，只留这一个看个清楚。
  const originalBuild = SC.build;
  SC.build = function (ctx, api) {
    const object = originalBuild.call(SC, ctx, api);
    const focusRoots = new Map();
    for (const [id, part] of Object.entries(ctx.PARTS)) {
      const roots = new Set();
      for (const group of part.groups) {
        let ancestor = group;
        while (ancestor.parent && ancestor.parent !== ctx.root) ancestor = ancestor.parent;
        if (ancestor.parent === ctx.root) roots.add(ancestor);
      }
      focusRoots.set(id, roots);
    }
    const hiddenForFocus = new Map();
    const update = object.update;
    object.clearFocus = function () {
      for (const [child, visible] of hiddenForFocus) child.visible = visible;
      hiddenForFocus.clear();
    };
    object.update = function (dt) {
      object.clearFocus();
      update(dt);
      const focused = focusRoots.get(api.focusedPart);
      if (focused) for (const child of ctx.root.children) {
        if (!focused.has(child)) {
          hiddenForFocus.set(child, child.visible);
          child.visible = false;
        }
      }
    };
    return object;
  };
})();

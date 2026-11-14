import * as THREE from '../../vendor/three/three.module.js';

/** Create a small procedural scene; never owns application or progress state. */
export function createScene(host, options, onFailure) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');canvas.className='scene-canvas';
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-4,4,3,-3,.1,100);camera.position.set(5,6,8);camera.lookAt(0,.2,0);
  scene.add(new THREE.HemisphereLight(0xfff4dd,0x8d9b82,2));
  const light=new THREE.DirectionalLight(0xfff1d7,2.4);light.position.set(-3,7,5);scene.add(light);
  const mat=(color,roughness=.65)=>new THREE.MeshStandardMaterial({color,roughness});
  const cream=mat(0xf7f2e8), green=mat(0x6d826a), coffee=mat(0x63402d), water=mat(0x9ebbb4), milk=mat(0xece7da), wood=mat(0xc79f79), dark=mat(0x4a3529);
  function mesh(geometry,material,x,y,z){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);scene.add(m);return m;}
  const tableRadius=options.kind==='world'?3.9:2.2;
  mesh(new THREE.CylinderGeometry(tableRadius,tableRadius,.18,48),wood,0,-.28,0);
  function makeCup(x,z,scale=1){
    const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);scene.add(group);
    const saucer=new THREE.Mesh(new THREE.CylinderGeometry(.88,.82,.09,40),cream);saucer.position.y=-.1;group.add(saucer);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.63,.42,.9,40),cream);body.position.y=.42;group.add(body);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.615,.045,12,40),cream);rim.rotation.x=Math.PI/2;rim.position.y=.88;group.add(rim);
    const liquid=new THREE.Mesh(new THREE.CylinderGeometry(.565,.565,.025,40),coffee.clone());liquid.position.y=.89;group.add(liquid);
    const handle=new THREE.Mesh(new THREE.TorusGeometry(.31,.075,12,30,Math.PI*2),cream);handle.position.set(.62,.46,0);group.add(handle);
    return {group,liquid};
  }
  let mainCup;
  if(options.kind==='world'){
    mainCup=makeCup(-.1,.35,1.18);makeCup(1.9,-.65,.74);makeCup(-2,-.8,.72);
    const glass=mesh(new THREE.CylinderGeometry(.36,.29,1.2,32),water,1.75,.47,1.25);glass.material.transparent=true;glass.material.opacity=.8;
    mesh(new THREE.CylinderGeometry(.34,.36,.85,32),milk,-1.8,.32,1.25);
    for(let i=0;i<7;i++){const bean=mesh(new THREE.SphereGeometry(.16,16,12),dark,-2.8+i*.27,-.05,.65+(i%2)*.2);bean.scale.set(.7,.4,1);bean.rotation.y=i*.55;}
    const dripper=mesh(new THREE.CylinderGeometry(.55,.15,.75,32),green,1.9,.85,-.65);dripper.position.y=1.05;
  } else {mainCup=makeCup(0,0,1.6);}
  mainCup.liquid.visible=!options.empty;
  let targetWater=Number(options.water)||0,currentWater=targetWater,raf=0,disposed=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  function resize(){if(disposed)return;const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);renderer.setSize(width,height,false);const aspect=width/height;const view=Math.max(options.kind==='world'?3.4:2.6,(tableRadius+0.4)/aspect);camera.left=-view*aspect;camera.right=view*aspect;camera.top=view;camera.bottom=-view;camera.updateProjectionMatrix();draw();}
  function draw(){if(!disposed){try{renderer.render(scene,camera);}catch{onFailure();}}}
  function tick(){if(disposed)return;currentWater+=(targetWater-currentWater)*.18;if(Math.abs(targetWater-currentWater)<.5)currentWater=targetWater;const mix=Math.min(currentWater/250,1);mainCup.liquid.material.color.set(0x63402d).lerp(new THREE.Color(0xb48b68),mix*.65);draw();if(!disposed&&currentWater!==targetWater)raf=requestAnimationFrame(tick);else raf=0;}
  const observer=new ResizeObserver(resize);observer.observe(host);
  const lost=event=>{event.preventDefault();onFailure();};canvas.addEventListener('webglcontextlost',lost);
  return {canvas,render:resize,update(state){if(state.empty!==undefined)mainCup.liquid.visible=!state.empty;targetWater=Number(state.water)||0;if(reduced.matches){currentWater=targetWater;}if(!raf)tick();},dispose(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('webglcontextlost',lost);scene.traverse(object=>{object.geometry?.dispose();if(object.material){for(const material of (Array.isArray(object.material)?object.material:[object.material]))material.dispose();}});renderer.dispose();}};
}

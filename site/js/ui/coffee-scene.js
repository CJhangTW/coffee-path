import * as THREE from '../../vendor/three/three.module.js';
import {extractionFrame,pourFrame,pourTransition,milkFrame} from '../domain/process-frames.js';

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
    const bodyMaterial=cream.clone();bodyMaterial.side=THREE.DoubleSide;
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.63,.42,.9,40,1,true),bodyMaterial);body.position.y=.42;group.add(body);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.615,.045,12,40),cream);rim.rotation.x=Math.PI/2;rim.position.y=.88;group.add(rim);
    const liquid=new THREE.Mesh(new THREE.CylinderGeometry(.565,.565,.025,40),coffee.clone());liquid.position.y=.89;group.add(liquid);
    const handle=new THREE.Mesh(new THREE.TorusGeometry(.31,.075,12,30,Math.PI*2),cream);handle.position.set(.62,.46,0);group.add(handle);
    return {group,liquid};
  }
  let mainCup,marker=null;const highlights={};
  if(options.kind==='world'){
    mainCup=makeCup(-.1,.35,1.18);makeCup(1.9,-.65,.74);const latte=makeCup(-2,-.8,.72);
    latte.liquid.material.color.set(0xd2a27e);
    const foam=new THREE.Mesh(new THREE.TorusGeometry(.26,.055,10,32),milk);foam.rotation.x=Math.PI/2;foam.position.y=.91;latte.group.add(foam);
    const waterMaterial=water.clone(),milkMaterial=milk.clone(),beanMaterial=dark.clone();
    highlights.water=waterMaterial;highlights.milk=milkMaterial;highlights.beans=beanMaterial;
    const glass=mesh(new THREE.CylinderGeometry(.36,.29,1.2,32),waterMaterial,1.75,.47,1.25);glass.material.transparent=true;glass.material.opacity=.8;
    mesh(new THREE.CylinderGeometry(.34,.36,.85,32),milkMaterial,-1.8,.32,1.25);
    const pitcherHandle=mesh(new THREE.TorusGeometry(.22,.06,10,24),milkMaterial,-1.43,.42,1.25);pitcherHandle.scale.set(.7,1,1);
    const pitcherRim=mesh(new THREE.TorusGeometry(.33,.04,10,32),milkMaterial,-1.8,.76,1.25);pitcherRim.rotation.x=Math.PI/2;
    for(let i=0;i<7;i++){const bean=mesh(new THREE.SphereGeometry(.16,16,12),beanMaterial,-2.8+i*.27,-.05,.65+(i%2)*.2);bean.scale.set(.7,.4,1);bean.rotation.y=i*.55;}
    const dripper=mesh(new THREE.CylinderGeometry(.55,.15,.75,32),green,1.9,.85,-.65);dripper.position.y=1.05;
    marker=mesh(new THREE.TorusGeometry(.5,.045,10,40),mat(0xffe3a3),0,-.16,0);marker.rotation.x=Math.PI/2;marker.visible=false;
  } else {mainCup=makeCup(0,0,1.6);}
  let waterFlow=null,coffeeFlow=null,pourFlow=null,pitcher=null,spoon=null,foamMark=null;
  if(options.kind==='extract'){
    const metal=mat(0x918d80),puck=mat(0x69442f),blue=mat(0x99c5c1);
    mesh(new THREE.CylinderGeometry(.78,.72,.18,32),metal,0,2.56,0);
    mesh(new THREE.CylinderGeometry(.64,.64,.18,32),puck,0,2.67,0);
    const holder=mesh(new THREE.CylinderGeometry(.08,.1,.85,16),metal,1.12,2.55,0);holder.rotation.z=-Math.PI/2;
    const grip=mesh(new THREE.CylinderGeometry(.13,.15,.65,16),dark,1.8,2.55,0);grip.rotation.z=-Math.PI/2;
    mesh(new THREE.CylinderGeometry(.35,.35,.22,24),blue,0,3.62,0);
    waterFlow=mesh(new THREE.CylinderGeometry(.075,.075,.77,16),blue,0,3.13,0);waterFlow.visible=false;
    coffeeFlow=mesh(new THREE.CylinderGeometry(.065,.065,1.15,16),coffee,0,1.9,0);coffeeFlow.visible=false;
  } else if(options.kind==='cup'){
    const blue=mat(0xa5c9c1),pitcherMaterial=mat(0xd6e7df);
    pitcher=mesh(new THREE.CylinderGeometry(.32,.27,.55,24),pitcherMaterial,1.2,2.0,0);pitcher.visible=false;
    pourFlow=mesh(new THREE.CylinderGeometry(.055,.055,1.05,12),blue,.68,1.63,0);pourFlow.rotation.z=-.68;pourFlow.visible=false;
    spoon=new THREE.Group();spoon.position.set(.75,1.9,0);scene.add(spoon);spoon.visible=false;
    const bowl=new THREE.Mesh(new THREE.SphereGeometry(.2,20,12),cream);bowl.scale.set(1,.22,.7);spoon.add(bowl);
    const handle=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.65,12),cream);handle.rotation.z=-Math.PI/2;handle.position.x=.45;spoon.add(handle);
    const scoop=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),milk);scoop.scale.set(1,.55,1);scoop.position.y=.07;spoon.add(scoop);
    foamMark=new THREE.Mesh(new THREE.SphereGeometry(.22,20,12),milk.clone());foamMark.scale.set(1,.12,.75);foamMark.position.set(-.16,0,-.16);foamMark.visible=false;mainCup.group.add(foamMark);
  }
  mainCup.liquid.visible=!options.empty;
  let targetWater=Number(options.water)||0,currentWater=targetWater,raf=0,disposed=false,reduceByUser=options.reducedMotion===true,animation=null;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  function resize(){if(disposed)return;const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);renderer.setSize(width,height,false);const aspect=width/height;const view=Math.max(options.kind==='world'?3.4:options.kind==='extract'?3.3:2.6,(tableRadius+0.4)/aspect);camera.left=-view*aspect;camera.right=view*aspect;camera.top=view;camera.bottom=-view;camera.updateProjectionMatrix();draw();}
  function draw(){if(!disposed){try{renderer.render(scene,camera);}catch{onFailure();}}}
  function renderLiquid(level,waterAmount){const fraction=Math.max(.05,Math.min(1,level));mainCup.liquid.position.y=.15+fraction*.68;const radius=(.42+fraction*.18)/.565;mainCup.liquid.scale.set(radius,1,radius);mainCup.liquid.material.color.set(0x63402d).lerp(new THREE.Color(0xb48b68),Math.min(waterAmount/250,1)*.45);}
  function applyFrame(progress){
    if(!animation)return;
    if(animation.type==='extract'){
      const state=extractionFrame(progress);waterFlow.visible=state.waterFlow;coffeeFlow.visible=state.coffeeFlow;mainCup.liquid.visible=state.filled>0;renderLiquid(state.filled*(animation.extended?0.95:0.55),0);
    }else if(animation.type==='milk'){
      const state=milkFrame(animation.kind,animation.amount,progress);pitcher.visible=state.pouring;pourFlow.visible=state.pouring;spoon.visible=state.spoon;
      spoon.position.set(.75*(1-state.spoonOffset),1.9-.38*state.spoonOffset,0);
      renderLiquid(.32+Math.min(state.amount/100,1)*.35,0);
      if(animation.kind==='milk')mainCup.liquid.material.color.lerp(new THREE.Color(0xe6d1b1),Math.min(state.amount/100,1)*.7);
      foamMark.visible=state.foam;foamMark.position.y=mainCup.liquid.position.y+.03;
    }else{
      const state=pourFrame(animation.from,animation.to,progress);currentWater=state.water;pourFlow.visible=state.pouring;pitcher.visible=state.pouring;renderLiquid(.32+Math.min(currentWater/250,1)*.65,currentWater);
    }
    if(progress>=1)animation=null;
  }
  if(options.kind==='cup')renderLiquid(.32,0);
  function tick(time){if(disposed)return;raf=0;if(animation){if(animation.started===null)animation.started=time??performance.now();const elapsed=(time??performance.now())-animation.started;applyFrame(Math.min(elapsed/animation.duration,1));}draw();if(!disposed&&animation)raf=requestAnimationFrame(tick);}
  const observer=new ResizeObserver(resize);observer.observe(host);
  const lost=event=>{event.preventDefault();onFailure();};canvas.addEventListener('webglcontextlost',lost);
  const onSystemMotion=event=>{if(event.matches&&animation){if(raf)cancelAnimationFrame(raf);raf=0;applyFrame(1);draw();}};
  reduced.addEventListener('change',onSystemMotion);
  return {canvas,render:resize,update(state){
    if(state.empty!==undefined&&state.process!=='extract')mainCup.liquid.visible=!state.empty;
    if(state.reducedMotion!==undefined)reduceByUser=state.reducedMotion===true;
    if(state.ingredient!==undefined){for(const [id,material] of Object.entries(highlights)){material.emissive.set(id===state.ingredient?0x51432e:0x000000);material.emissiveIntensity=.75;}const positions={beans:[-2,.72],water:[1.75,1.25],milk:[-1.8,1.25]};if(marker){const position=positions[state.ingredient];marker.visible=Boolean(position);if(position)marker.position.set(position[0],-.16,position[1]);}draw();}
    if(state.process==='extract'&&options.kind==='extract'){
      if(raf)cancelAnimationFrame(raf);raf=0;animation={type:'extract',extended:state.extended===true,started:null,duration:state.extended?3600:2400};
      if(reduceByUser||reduced.matches||state.instant){applyFrame(1);draw();}else {applyFrame(0);draw();raf=requestAnimationFrame(tick);}
    }else if(state.process==='milk'&&options.kind==='cup'){
      if(raf)cancelAnimationFrame(raf);raf=0;pitcher.material.color.set(0xf0e9da);pourFlow.material.color.set(0xfff8ed);foamMark.visible=false;
      animation={type:'milk',kind:state.milkKind,amount:state.milkG,started:null,duration:1300};
      if(reduceByUser||reduced.matches||state.instant){applyFrame(1);draw();}else {applyFrame(0);draw();raf=requestAnimationFrame(tick);}
    }else if(state.water!==undefined&&options.kind==='cup'){
      const next=Number(state.water)||0,transition=pourTransition(currentWater,targetWater,next);targetWater=next;if(raf)cancelAnimationFrame(raf);raf=0;
      pitcher.material.color.set(0xd6e7df);pourFlow.material.color.set(0xa5c9c1);spoon.visible=false;foamMark.visible=false;
      animation={type:'pour',from:transition.from,to:transition.to,started:null,duration:1300};
      if(!transition.animate||reduceByUser||reduced.matches||state.instant){applyFrame(1);draw();}else {applyFrame(0);draw();raf=requestAnimationFrame(tick);}
    }else if(state.reducedMotion&&(animation)){if(raf)cancelAnimationFrame(raf);raf=0;applyFrame(1);draw();}
    else draw();
  },dispose(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);observer.disconnect();reduced.removeEventListener('change',onSystemMotion);canvas.removeEventListener('webglcontextlost',lost);scene.traverse(object=>{object.geometry?.dispose();if(object.material){for(const material of (Array.isArray(object.material)?object.material:[object.material]))material.dispose();}});renderer.dispose();}};
}

import {createSceneController} from './scene-controller.js';

/** Attach enhancement after DOM is usable; return a route cleanup function. */
export function mountScenes(root,settings={}) {
  const cleanups=[];
  for(const host of root.querySelectorAll('[data-scene]')) {
    const fallback=host.querySelector('.scene-fallback');
    let active=false,closed=false;
    const toggle=document.createElement('button');toggle.type='button';toggle.className='scene-toggle';toggle.textContent='啟用 3D';
    host.after(toggle);
    const status=document.createElement('span');status.className='scene-status';status.setAttribute('role','status');toggle.after(status);
    const controller=createSceneController(host,fallback,settings.loader||(()=>import('./coffee-scene.js')),{kind:host.dataset.scene,empty:host.dataset.empty==='true',onMode:is3d=>{active=is3d;toggle.textContent=is3d?'切換為 2D':'啟用 3D';}});
    const update=event=>controller.update(event.detail);host.addEventListener('coffee-scene-update',update);
    async function enable(){status.textContent='';toggle.disabled=true;const success=await controller.enable();if(closed)return;toggle.disabled=false;if(!success)status.textContent='3D 暫時無法使用，已顯示 2D。';}
    toggle.addEventListener('click',()=>{if(active){controller.disable();settings.onPreference?.('2d');status.textContent='';}else {settings.onPreference?.('3d');enable();}});
    const frame=settings.visualMode==='2d'?0:(settings.schedule||requestAnimationFrame)(()=>enable());
    cleanups.push(()=>{closed=true;cancelAnimationFrame(frame);host.removeEventListener('coffee-scene-update',update);controller.dispose();});
  }
  return ()=>cleanups.forEach(cleanup=>cleanup());
}

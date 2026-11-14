import {createSceneController} from './scene-controller.js';

/** Attach scene enhancements; the returned cleanup also updates global settings. */
export function mountScenes(root,settings={}) {
  const entries=[];let mode=settings.visualMode||'auto',reduced=settings.reducedMotion===true,closed=false;
  for(const host of root.querySelectorAll('[data-scene]')) {
    const fallback=host.querySelector('.scene-fallback');
    const status=document.createElement('span');status.className='scene-status';status.setAttribute('role','status');host.after(status);
    const controller=createSceneController(host,fallback,settings.loader||(()=>import('./coffee-scene.js')),{kind:host.dataset.scene,empty:host.dataset.empty==='true',reducedMotion:reduced,onMode:is3d=>{if(!is3d&&!closed&&mode!=='2d')status.textContent='3D 暫時無法使用，已顯示 2D。';}});
    const update=event=>controller.update(event.detail);host.addEventListener('coffee-scene-update',update);
    const enable=async()=>{const request=++entry.request;status.textContent='';const ok=await controller.enable();if(!closed&&request===entry.request&&mode!=='2d'&&!ok)status.textContent='3D 暫時無法使用，已顯示 2D。';};
    const entry={controller,host,update,enable,status,frame:0,request:0};entries.push(entry);
    if(mode!=='2d')entry.frame=(settings.schedule||requestAnimationFrame)(enable);
  }
  const cleanup=()=>{if(closed)return;closed=true;for(const e of entries){if(e.frame)cancelAnimationFrame(e.frame);e.host.removeEventListener('coffee-scene-update',e.update);e.controller.dispose();}};
  cleanup.setMode=value=>{mode=value;for(const e of entries){if(e.frame)cancelAnimationFrame(e.frame);e.frame=0;if(value==='2d'){e.request++;e.controller.disable();e.status.textContent='';}else e.enable();}};
  cleanup.setReduced=value=>{reduced=value;for(const e of entries)e.controller.update({reducedMotion:value});};
  return cleanup;
}

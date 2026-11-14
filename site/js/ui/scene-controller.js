/** Manage asynchronous renderer loading without allowing stale scenes to mount. */
export function createSceneController(host, fallback, loader, options={}) {
  let generation=0, scene=null, disposed=false, latest=null;
  function disable(){generation++;if(scene){scene.dispose();scene.canvas.remove();scene=null;}for(const diagram of fallback.querySelectorAll('.is-extracting')){diagram.classList.remove('is-extracting');diagram.classList.add('is-complete');}for(const diagram of fallback.querySelectorAll('.is-pouring'))diagram.classList.remove('is-pouring');fallback.hidden=false;options.onMode?.(false);}
  return {
    async enable(){
      if(disposed)return false;
      const request=++generation;
      try {
        const module=await loader();
        if(disposed||request!==generation)return false;
        const next=module.createScene(host,options,()=>disable());
        if(disposed||request!==generation){next.dispose();return false;}
        if(scene){scene.dispose();scene.canvas.remove();}
        scene=next;host.append(scene.canvas);fallback.hidden=true;scene.render();if(scene!==next)return false;if(latest)scene.update({...latest,instant:true});options.onMode?.(true);return true;
      } catch {if(request===generation)disable();return false;}
    },
    update(state){latest={...latest,...state};try{scene?.update(state);}catch{disable();}},
    disable,
    dispose(){if(disposed)return;disable();disposed=true;}
  };
}

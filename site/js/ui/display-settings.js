import {el} from './dom.js';

/** Global preferences are independent: 3D can remain enabled without motion. */
export function createDisplaySettings(preferences,onChange) {
  let state={...preferences,visualMode:preferences.visualMode==='2d'?'2d':'3d',reducedMotion:preferences.reducedMotion===true};
  const select=el('select',{id:'global-visual-mode','aria-label':'全站畫面'},el('option',{value:'3d'},'3D 立體'),el('option',{value:'2d'},'2D 平面'));
  select.value=state.visualMode;
  const reduce=el('input',{id:'global-reduced-motion',type:'checkbox',checked:state.reducedMotion,'aria-label':'減少動態效果'});
  select.addEventListener('change',()=>{state={...state,visualMode:select.value};onChange(state);});
  reduce.addEventListener('change',()=>{state={...state,reducedMotion:reduce.checked};onChange(state);});
  return el('details',{class:'display-settings'},el('summary',{},'顯示設定'),el('div',{class:'settings-panel'},el('label',{for:'global-visual-mode'},'全站畫面'),select,el('label',{class:'motion-option',for:'global-reduced-motion'},reduce,' 減少動態效果'),el('p',{class:'muted'},'設定適用全站；系統若要求減少動態，也會自動尊重。')));
}

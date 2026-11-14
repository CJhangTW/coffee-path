import {el,extractionDiagram,pouringDiagram} from '../ui/dom.js';

/** Show both processes with the same controls and scene events used in lessons. */
export function createComparison(lesson,onObserve) {
  const cards=lesson.observations.map(item=>{
    const isExtraction=item.type==='extract';
    const fallback=el('div',{class:'scene-fallback'},isExtraction?extractionDiagram():pouringDiagram());
    const frame=el('div',{class:'scene-frame comparison-frame','data-scene':isExtraction?'extract':'cup','data-empty':isExtraction},fallback);
    const button=el('button',{type:'button',class:'secondary','data-observe-action':item.id},item.button);
    const status=el('p',{class:'comparison-status','aria-live':'polite'},'尚未觀察');
    button.addEventListener('click',()=>{
      if(isExtraction){fallback.replaceChildren(extractionDiagram(true,item.extended===true));frame.dispatchEvent(new CustomEvent('coffee-scene-update',{detail:{process:'extract',empty:false,extended:item.extended===true}}));}
      else {fallback.replaceChildren(pouringDiagram(item.waterG,true,0));frame.dispatchEvent(new CustomEvent('coffee-scene-update',{detail:{water:0}}));frame.dispatchEvent(new CustomEvent('coffee-scene-update',{detail:{water:item.waterG}}));}
      onObserve(item.id);status.textContent='已觀察，可再次播放。';
    });
    return el('article',{class:'comparison-card'},el('h2',{},item.title),el('p',{},item.description),frame,button,status);
  });
  return el('div',{class:'comparison-grid'},...cards);
}

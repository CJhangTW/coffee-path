import {el,cappuccinoDiagram} from '../ui/dom.js';

const STEP_DURATION_MS=1300;

/** Build a two-step cappuccino teaching example, independent of lesson rewards. */
export function createCappuccinoDemo(onComplete=()=>{},amounts={}) {
  const milkG=Number.isFinite(amounts.milkG)&&amounts.milkG>0?amounts.milkG:80;
  const foamG=Number.isFinite(amounts.foamG)&&amounts.foamG>0?amounts.foamG:20;
  const fallback=el('div',{class:'scene-fallback'},cappuccinoDiagram('espresso',milkG,foamG));
  const frame=el('div',{class:'scene-frame','data-scene':'cup'},fallback);
  const text=el('p',{'aria-live':'polite'},'目前是 Espresso。以下為理解液態牛奶與奶泡角色而拆解的示例，並非唯一製程；常見作法也會一起倒入奶泡牛奶。');
  const milkButton=el('button',{type:'button',class:'secondary','data-cappuccino-step':'milk'},'1. 加入液態牛奶');
  const foamButton=el('button',{type:'button',class:'secondary','data-cappuccino-step':'foam',disabled:true},'2. 用匙放上奶泡');
  const controls=el('div',{class:'cappuccino-controls'},milkButton,foamButton);
  let milkReady=false,completed=false,currentStep='espresso',timer=null,runId=0,disposed=false;
  const reducedMotion=()=>document.body.classList.contains('reduce-motion')||window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setText(step){
    if(step==='milk')text.textContent=`示例步驟 1：將約 ${milkG} g 液態奶加入 Espresso。為理解構成而拆解，不代表唯一製程。`;
    else if(step==='foam')text.textContent=`示例步驟 2：在已含液態奶的咖啡上，以匙放上約 ${foamG} g 奶泡。此拆解不代表唯一製程；常見作法也會一起倒入奶泡牛奶。`;
    else if(completed)text.textContent='示例完成：Espresso、液態奶與奶泡。此為理解構成的拆解示意，並非唯一製程。';
    else text.textContent='目前是 Espresso。以下為理解液態牛奶與奶泡角色而拆解的示例，並非唯一製程；常見作法也會一起倒入奶泡牛奶。';
  }

  function show(step,running=false,instant=false){
    currentStep=step;
    fallback.replaceChildren(cappuccinoDiagram(step,milkG,foamG,running));
    frame.dispatchEvent(new CustomEvent('coffee-scene-update',{detail:{process:'cappuccino',step,milkG,foamG,instant}}));
    setText(step);
  }

  function cancelPending(){runId++;if(timer!==null){clearTimeout(timer);timer=null;}}

  function begin(step){
    if(disposed||step==='foam'&&!milkReady)return;
    cancelPending();
    if(step==='milk'){milkReady=false;completed=false;foamButton.disabled=true;milkButton.textContent='1. 重新觀看加牛奶';}
    else {completed=false;foamButton.disabled=true;}
    const instant=reducedMotion();
    show(step,true,instant);
    const thisRun=runId;
    const finish=()=>{
      if(disposed||thisRun!==runId)return;
      timer=null;
      if(step==='milk'){
        milkReady=true;foamButton.disabled=false;
        text.textContent=`牛奶已加入示例 Espresso。接著可用匙放上奶泡；此順序是拆解示意，並非唯一製程。`;
      }else{
        completed=true;milkReady=true;milkButton.textContent='1. 重新觀看加牛奶';foamButton.disabled=false;
        setText('foam');
        onComplete({milkG,foamG});
      }
    };
    if(instant)finish();else timer=setTimeout(finish,STEP_DURATION_MS);
  }

  milkButton.addEventListener('click',()=>begin('milk'));
  foamButton.addEventListener('click',()=>begin('foam'));
  function reset(){
    if(disposed)return;
    cancelPending();milkReady=false;completed=false;foamButton.disabled=true;milkButton.textContent='1. 加入液態牛奶';
    show('espresso',false,true);
  }
  function dispose(){if(disposed)return;cancelPending();disposed=true;}

  return {controls,frame,fallback,text,get completed(){return completed;},reset,dispose};
}

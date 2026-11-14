import {el,pouringDiagram,link} from '../ui/dom.js';
import {validateWater} from '../domain/recipe.js';
import {waterProcessMeaning} from '../domain/process-frames.js';

export function lab(){
  let previousWater=0;
  const visualText=el('p',{'aria-live':'polite'},'Espresso 約 36 g，尚未加水。');
  const fallback=el('div',{class:'scene-fallback'},pouringDiagram());
  const frame=el('div',{class:'scene-frame','data-scene':'cup'},fallback);
  const sequence=el('p',{class:'process-sequence'},waterProcessMeaning(0,0).sequence);
  const visual=el('div',{class:'visual-panel panel'},frame,sequence,visualText,el('small',{class:'muted'},'圖像為操作順序示意，並非物理模擬。'));
  const number=el('input',{id:'lab-water',type:'number',min:'0',max:'250',step:'1',value:'0','aria-describedby':'lab-help'});
  const range=el('input',{type:'range',min:'0',max:'250',value:'0','aria-label':'調整萃取後水量'});
  const result=el('p',{class:'feedback'},'尚未加水：示例 Espresso。');
  function update(source){
    const value=source.valueAsNumber;
    if(!validateWater(value)){result.textContent='請輸入 0–250 g 的有效水量。';return;}
    const from=previousWater,meaning=waterProcessMeaning(value,from),pouring=meaning.change==='add';previousWater=value;
    number.value=range.value=String(value);fallback.replaceChildren(pouringDiagram(value,pouring,from));
    frame.dispatchEvent(new CustomEvent('coffee-scene-update',{detail:{water:value}}));
    sequence.textContent=meaning.sequence;
    visualText.textContent=`Espresso 約 36 g，萃取後加水 ${value} g。${meaning.change==='adjust'?'已重新設定配方，並非將水倒出。':''}`;
    result.textContent=value?'萃取後加水是 Americano 的常見做法；實際比例依店家與喜好不同。':'尚未加水：示例 Espresso。';
  }
  number.addEventListener('input',()=>update(number));range.addEventListener('input',()=>update(range));
  const reset=el('button',{class:'plain',type:'button',onClick:()=>{number.value='0';update(number);}},'重設');
  return el('div',{},el('div',{class:'page-top'},el('span',{class:'step'},'FREE LAB · 基本示範'),el('h1',{},'讓好奇心，自由調配。'),el('p',{},'調整 Espresso 萃取後加入的水量，觀察構成如何改變。')),
    el('div',{class:'workspace'},visual,el('section',{class:'panel'},el('p',{class:'step'},'ESPRESSO + WATER'),el('h2',{},'你的咖啡配方'),el('p',{},'示例基底：18 g 咖啡粉，萃出約 36 g Espresso。'),el('div',{class:'control'},el('label',{for:'lab-water'},'萃取後加水（g）'),number,range,el('p',{id:'lab-help',class:'muted'},'可調整 0–250 g。')),el('div',{'aria-live':'polite'},result),reset,el('div',{class:'actions'},link('前往探索旅程','#/journey/intro-01')))));
}

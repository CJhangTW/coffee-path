import {el,link,cup,extractionDiagram,pouringDiagram} from '../ui/dom.js';
import {evaluateChallenge} from '../domain/lesson-engine.js';
import {validateWater} from '../domain/recipe.js';
import {waterProcessMeaning} from '../domain/process-frames.js';
import {createComparison} from './comparison.js';
const initialOrder=['intro-01','water-01','water-02'];
export function journey(lesson, progress, onComplete, sources=[], lessons=[]) {
  const order=lessons.length?lessons.map(item=>item.id):initialOrder;
  const index=order.indexOf(lesson.id), interaction={completed:false,addedWaterG:0,observedActionIds:[]}; let answer='',passed=false,lastValidWater=0;
  const feedback=el('div',{'aria-live':'polite'}), visualText=el('p',{'aria-live':'polite'},lesson.id==='intro-01'?'咖啡豆 × 水 × 牛奶':lesson.id==='water-01'?'尚未開始萃取。':'Espresso 約 36 g，尚未加水。');
  const fallback=el('div',{class:'scene-fallback'},lesson.id==='intro-01'?cup():lesson.id==='water-01'?extractionDiagram():pouringDiagram());
  const frame=el('div',{class:'scene-frame','data-scene':lesson.id==='intro-01'?'world':lesson.id==='water-01'?'extract':'cup','data-empty':lesson.id==='water-01'},fallback);
  const sequence=lesson.id==='water-01'?el('p',{class:'process-sequence'},'萃取流程拆解示意：水 → 咖啡粉床 → Espresso 入杯'):lesson.id==='water-02'?el('p',{class:'process-sequence'},waterProcessMeaning(0,0).sequence):null;
  const visual=el('div',{class:'visual-panel panel'},frame,sequence,visualText,el('small',{class:'muted'},'畫面為流程與構成示意，非實際物理模擬。'));
  const controls=el('div',{class:'control'});
  if(lesson.challenge.type==='observe-and-choice') {
    visual.replaceChildren(createComparison(lesson,id=>{if(!interaction.observedActionIds.includes(id))interaction.observedActionIds.push(id);}),el('small',{class:'muted'},'配方、杯量與流程皆為教學示意，並非物理模擬。'));
    controls.append(el('p',{},'先分別按下兩個「觀察」按鈕，再回答問題。'));
  } else if(lesson.id==='intro-01') {
    const selected=new Set();const ingredients=el('div',{class:'ingredient-list'});
    const labels={beans:'咖啡豆',water:'水',milk:'牛奶'};
    for(const [id,name] of Object.entries(labels)) {
      const checkbox=el('input',{type:'checkbox',onChange:e=>{
        e.target.checked?selected.add(id):selected.delete(id);
        interaction.completed=selected.size===3;
        const current=Array.from(selected).at(-1)??null;
        frame.dispatchEvent(new CustomEvent('coffee-scene-update',{detail:{ingredient:current}}));
        visualText.textContent=current?`已選擇 ${selected.size} / 3 種原料，目前標示：${labels[current]}。${interaction.completed?'三種原料已選齊。':''}`:'請選擇咖啡豆、水與牛奶。';
      }});
      ingredients.append(el('label',{},checkbox,` ${name}`));
    } controls.append(ingredients);
  } else if(lesson.id==='water-01') {const action=el('button',{type:'button',class:'secondary',onClick:()=>{interaction.completed=true;fallback.replaceChildren(extractionDiagram(true));frame.dispatchEvent(new CustomEvent('coffee-scene-update',{detail:{process:'extract',empty:false}}));visualText.textContent='水通過咖啡粉床後，萃取液流入杯中。示例：18 g 咖啡粉 → 約 36 g Espresso。';action.textContent='重新觀看示意';}},lesson.action); controls.append(action);
  } else {const number=el('input',{type:'number',id:'water-number',min:'0',max:'250',step:'1',value:'0','aria-describedby':'water-help'});const range=el('input',{type:'range',id:'water-range',min:'0',max:'250',step:'1',value:'0','aria-label':'調整萃取後加入的水量'});const update=source=>{const n=source.valueAsNumber;if(!validateWater(n)){interaction.addedWaterG=NaN;visualText.textContent='請輸入 0–250 g 的水量。';return;}const from=lastValidWater,meaning=waterProcessMeaning(n,from),pouring=meaning.change==='add';lastValidWater=n;interaction.addedWaterG=n;number.value=String(n);range.value=String(n);fallback.replaceChildren(pouringDiagram(n,pouring,from));frame.dispatchEvent(new CustomEvent('coffee-scene-update',{detail:{water:n}}));sequence.textContent=meaning.sequence;visualText.textContent=`Espresso 約 36 g，萃取後加水 ${n} g。${meaning.change==='adjust'?'已重新設定配方，並非將水倒出。':''}`;};number.addEventListener('input',()=>update(number));range.addEventListener('input',()=>update(range));controls.append(el('label',{for:'water-number'},'萃取後加水（g）'),number,range,el('p',{id:'water-help',class:'muted'},'示例範圍 0–250 g；請至少加入 80 g。')); }
  const choices=el('div',{class:'choices'});for(const option of lesson.options){const radio=el('input',{type:'radio',name:'answer',value:option.id,onChange:()=>{answer=option.id;}});choices.append(el('label',{class:'choice'},radio,option.text));}
  const submit=el('button',{type:'button',class:'primary',onClick:()=>{if(passed)return;const result=evaluateChallenge(lesson,interaction,answer);feedback.replaceChildren();if(!result.passed){feedback.append(el('p',{class:'feedback'},result.reasonCode==='interaction-required'?'先完成上面的操作，再回答問題。':answer?lesson.wrong:'請先選擇一個答案。'));return;} passed=true;const first=onComplete(lesson);submit.disabled=true;feedback.append(el('div',{class:'feedback success'},el('strong',{},'答對了！'),el('p',{},lesson.summary),el('p',{},first?'首次完成，獲得 10 豆點；完成的章節另有獎勵。':'這關已完成過，重玩不重複獲得豆點。'),index<order.length-1?link('前往下一關 →',`#/journey/${order[index+1]}`,'primary'):link('前往自由 Lab →','#/lab','primary')));}},'確認答案');
  const top=el('div',{class:'page-top'},el('span',{class:'step'},lesson.eyebrow),el('h1',{},lesson.title),el('p',{},lesson.prompt));
  const references=(lesson.sourceIds||[]).map(id=>sources.find(source=>source.id===id)).filter(Boolean);
  const sourceDetails=el('details',{class:'references'},el('summary',{},'查看本關參考資料'),el('ul',{},...references.map(source=>el('li',{},el('a',{href:source.url,target:'_blank',rel:'noopener noreferrer'},source.title)))));
  const pane=el('section',{class:'panel'},el('p',{class:'step'},`關卡 ${index+1} / ${order.length} ${progress.completedLessonIds.includes(lesson.id)?' · 已完成':''}`),el('h2',{},'先動手試試'),controls,el('h2',{},lesson.question),choices,submit,feedback,sourceDetails,el('div',{class:'actions'},index<order.length-1?link('跳過此關',`#/journey/${order[index+1]}`,'plain'):link('回到首頁','#/','plain')));
  return el('div',{},top,el('div',{class:'workspace'},visual,pane));
}

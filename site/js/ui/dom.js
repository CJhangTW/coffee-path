import {cappuccinoFrame} from '../domain/process-frames.js';

export function el(tag, attrs={}, ...children) {const node=document.createElement(tag); for(const [key,value] of Object.entries(attrs)){if(key==='class') node.className=value; else if(key==='text') node.textContent=value; else if(key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(),value); else if(key==='checked') node.checked=value; else node.setAttribute(key,String(value));} for(const child of children.flat()){if(child!=null) node.append(child instanceof Node?child:document.createTextNode(String(child)));} return node;}
export const link=(text,href,style='secondary')=>el('a',{href,class:`button ${style}`},text);
export function cup(water=0,empty=false){const ratio=Math.min(Math.max(water/250,0),1),height=empty?0:30+ratio*65;const color=`rgb(${Math.round(113+54*ratio)},${Math.round(70+44*ratio)},${Math.round(47+36*ratio)})`;const fill=el('div',{class:'cup-liquid',style:`--cup-level:${height}%;height:${height}%;background:${color}`});return el('div',{class:'cup cup-diagram','aria-hidden':'true'},fill);}
/** A static process diagram remains understandable when animation is reduced. */
export function extractionDiagram(running=false,extended=false){const diagram=el('div',{class:`extraction-diagram${running?' is-extracting':''}${extended?' is-extended':''}`,'aria-hidden':'true'},el('div',{class:'diagram-water'},'水'),el('div',{class:'diagram-water-flow'}),el('div',{class:'diagram-puck'},'咖啡粉床'),el('div',{class:'diagram-coffee-flow'}),el('div',{class:'diagram-cup'},el('div',{class:'diagram-liquid'})));if(running)setTimeout(()=>{diagram.classList.remove('is-extracting');diagram.classList.add('is-complete');},extended?3600:2400);return diagram;}
/** The pour indicator is decorative; the accompanying text gives exact weights. */
export function pouringDiagram(water=0,pouring=false,previous=0){const from=30+Math.min(Math.max(previous/250,0),1)*65;const diagram=el('div',{class:`pour-diagram${pouring?' is-pouring':''}`,'aria-hidden':'true',style:`--previous-cup-level:${from}%`},el('div',{class:'diagram-pitcher'},'水'),el('div',{class:'diagram-pour-flow'}),cup(water));if(pouring)setTimeout(()=>diagram.classList.remove('is-pouring'),1300);return diagram;}
/** The source distinguishes a spoonful of foam from a pour of liquid milk. */
export function milkDiagram(amount=0,kind='milk',running=false){
  const ratio=Math.min(amount/100,1),height=30+ratio*35;
  const color=kind==='foam'?'#71462f':`rgb(${Math.round(113+70*ratio)},${Math.round(70+68*ratio)},${Math.round(47+62*ratio)})`;
  const liquid=el('div',{class:'cup-liquid',style:`--cup-level:${height}%;height:${height}%;background:${color}`});
  const foam=kind==='foam'&&amount>0?el('div',{class:'milk-foam',style:`bottom:${height-3}%`}):null;
  const mug=el('div',{class:'cup cup-diagram','aria-hidden':'true'},liquid,foam);
  const diagram=el('div',{class:`pour-diagram milk-diagram${running?' is-pouring':''}${kind==='foam'?' is-foam':''}`,'aria-hidden':'true',style:'--previous-cup-level:30%'},el('div',{class:'diagram-pitcher'},kind==='foam'?'奶泡匙':'牛奶'),el('div',{class:'diagram-pour-flow'}),mug);
  if(running)setTimeout(()=>diagram.classList.remove('is-pouring'),1300);return diagram;
}

/** Render accumulated Espresso, liquid milk, and foam for a two-step example. */
export function cappuccinoDiagram(step='espresso',milkG=80,foamG=20,running=false){
  const state=cappuccinoFrame(step,1,milkG,foamG);
  const milkHeight=Math.round(state.milkLevel*100),milkRise=Math.round((state.milkLevel-.32)*100),foamHeight=Math.max(5,Math.round((state.cupLevel-state.milkLevel)*100));
  const layer=el('div',{class:'cup-liquid cappuccino-milk-layer',style:`height:${milkRise}%;bottom:32%;--previous-cup-level:0%;--cup-level:${milkRise}%`});
  const foam=el('div',{class:'milk-foam cappuccino-foam-layer',style:`height:${foamHeight}%;bottom:${milkHeight}%`});
  const espresso=el('div',{class:'cup-liquid',style:'height:32%;background:#71462f'});
  const cupNode=el('div',{class:'cup cup-diagram cappuccino-cup'},espresso,layer,foam);
  const action=step==='milk'?'加入牛奶':step==='foam'?'放上奶泡':'';
  const utensil=!running?null:step==='foam'?el('div',{class:'cappuccino-spoon','aria-hidden':'true'},'奶泡匙'):el('div',{class:'diagram-pitcher cappuccino-pitcher','aria-hidden':'true'},'牛奶');
  const stream=el('div',{class:'diagram-pour-flow cappuccino-flow','aria-hidden':'true'});
  const diagram=el('div',{class:`cappuccino-diagram${running&&step==='milk'?' is-cappuccino-milk':''}${running&&step==='foam'?' is-cappuccino-foam':''}${step==='foam'?' has-foam':''}`,'aria-hidden':'true','data-step':step},
    el('span',{class:'cappuccino-action'},action),utensil,stream,cupNode);
  return diagram;
}

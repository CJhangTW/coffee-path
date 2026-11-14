import {el,link,cup} from '../ui/dom.js';

export function home() {
  const world=el('div',{class:'hero-art'},
    el('div',{class:'scene-frame world-scene','data-scene':'world'},
      el('div',{class:'scene-fallback'},cup(),el('div',{class:'cup-label'},'咖啡豆 · 水 · 牛奶'))));
  const pathways=el('section',{class:'world-map','aria-labelledby':'world-map-title'},
    el('div',{class:'world-map-heading'},el('span',{class:'kicker'},'THE COFFEE WORLD'),
      el('h2',{id:'world-map-title'},'一張桌子，看見咖啡的關係。'),
      el('p',{},'原料經過不同萃取與調配，形成不同飲品；每一條路徑都可以慢慢探索。')),
    el('div',{class:'world-map-grid'},
      el('article',{class:'map-card'},el('span',{class:'map-number'},'01'),el('h3',{},'原料'),el('p',{},'咖啡豆、水與牛奶，是這趟旅程的起點。')),
      el('article',{class:'map-card'},el('span',{class:'map-number'},'02'),el('h3',{},'萃取與調配'),el('p',{},'觀察萃取方式、加水加奶、溫度與順序的變化。')),
      el('article',{class:'map-card'},el('span',{class:'map-number'},'03'),el('h3',{},'飲品與名稱'),el('p',{},'從 Espresso 到 Americano、牛奶咖啡，理解彼此的關係。'))),
    el('p',{class:'world-map-note'},el('strong',{},'目前可探索：'),'前三關、Espresso 加水 Lab 與六張知識卡。 ',el('strong',{},'規劃中：'),'手沖、冷萃及更多咖啡路徑。'));
  return el('div',{},
    el('section',{class:'hero'},
      el('div',{},el('span',{class:'kicker'},'YOUR COFFEE JOURNEY'),
        el('h1',{},'從三種原料，',el('br'),el('em',{},'看懂咖啡的世界。')),
        el('p',{class:'lead'},'從咖啡豆、水與牛奶出發，探索萃取、飲品與彼此之間的關係。'),
        el('p',{class:'muted'},'目前開放前三關、Espresso 加水實驗與六張咖啡卡；更多沖煮路徑將逐步展開。'),
        el('div',{class:'actions'},link('開始咖啡探索 →','#/journey/intro-01','primary'),link('我已熟悉咖啡／直接探索','#/lab'))),world),
    pathways,
    el('section',{class:'intro-strip','aria-label':'探索方式'},...[["01 / 一步一步","用短短的關卡，動手認識咖啡。"],["02 / 自由探索","改變水量，觀察杯中的變化。"],["03 / 收集發現","留下你的學習足跡，慢慢累積。"]].map(([title,desc])=>el('article',{},el('strong',{},title),el('p',{},desc)))));
}

import {el,link} from '../ui/dom.js';

/** Show reading material to everyone while keeping collected status separate. */
export function collection(progress,drinks,sources) {
  const count=drinks.filter(d=>progress.collectedDrinkIds.includes(d.id)).length;
  const cards=drinks.map(drink=>{
    const collected=progress.collectedDrinkIds.includes(drink.id);
    const references=drink.sources.map(id=>sources.find(source=>source.id===id)).filter(Boolean);
    return el('article',{class:'card'},
      el('span',{class:'tag'},`${collected?'已收藏':'尚未收藏'} · 教材待審核`),
      el('h2',{},drink.name.zhHant),el('p',{class:'step'},drink.name.en),
      el('p',{},drink.intro),el('p',{class:'muted'},drink.explain||''),
      el('p',{class:'muted'},drink.deep||''),
      el('div',{class:'references'},el('span',{},'參考資料： '),...references.map((source,index)=>el('span',{},index?'、':'',el('a',{href:source.url,target:'_blank',rel:'noopener noreferrer'},source.title)))));
  });
  return el('div',{},el('div',{class:'page-top'},el('span',{class:'step'},'YOUR COLLECTION'),el('h1',{},'每一杯，都是一個發現。'),el('p',{},`目前收藏 ${count} / ${drinks.length} 張咖啡卡。所有卡片皆可閱讀；完成關卡可收藏對應飲品。`),link('前往探索旅程','#/journey/intro-01','secondary')),el('div',{class:'collection-grid'},...cards));
}

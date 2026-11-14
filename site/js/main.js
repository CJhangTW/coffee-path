import {SITE_CONFIG} from './config/site-config.js';
import {createStorage} from './core/storage.js';
import {loadContent} from './core/content-loader.js';
import {completeLesson,totalPoints} from './domain/progression.js';
import {home} from './features/home.js';
import {journey} from './features/journey.js';
import {lab} from './features/lab.js';
import {collection} from './features/collection.js';
import {el,link} from './ui/dom.js';
import {mountScenes} from './ui/mount-scenes.js';
import {createDisplaySettings} from './ui/display-settings.js';
const main=document.querySelector('#main'), points=document.querySelector('#points'), notice=document.querySelector('#notice');
const brand=document.querySelector('.brand');brand.lastChild.textContent=` ${SITE_CONFIG.brandName}`;brand.setAttribute('aria-label',`${SITE_CONFIG.brandName} 首頁`);document.querySelector('footer span').textContent=SITE_CONFIG.brandName;
let cleanupScenes=()=>{};
let backend;try{backend=window.localStorage;}catch{backend={getItem(){throw Error('unavailable')},setItem(){throw Error('unavailable')}};}
const storage=createStorage(backend);const loaded=storage.load();let progress=loaded.progress;let data;
document.body.classList.toggle('reduce-motion',progress.preferences.reducedMotion===true);
const displaySettings=createDisplaySettings(progress.preferences,preferences=>{
  const previous=progress.preferences;progress={...progress,preferences};
  document.body.classList.toggle('reduce-motion',preferences.reducedMotion===true);
  if((previous.visualMode==='2d'?'2d':'3d')!==preferences.visualMode)cleanupScenes.setMode?.(preferences.visualMode);
  if(previous.reducedMotion!==preferences.reducedMotion)cleanupScenes.setReduced?.(preferences.reducedMotion);
  if(!storage.save(progress))warn();
});
points.before(displaySettings);
function updatePoints(){points.textContent=`${totalPoints(progress)} 豆點`;}
function warn(){notice.hidden=false;notice.textContent=loaded.invalid?'已保存的進度格式無法辨識，為保護原始資料，本次探索不會覆寫它。':'瀏覽器無法儲存進度；目前仍可繼續探索，但關閉頁面後進度可能遺失。';}
if(!loaded.available) warn();updatePoints();
function complete(lesson){const result=completeLesson(progress,lesson,data.content.chapters);progress=result.progress;if(!storage.save(progress))warn();updatePoints();return result.first;}
function render(){const route=location.hash||'#/';let view;if(route==='#/'||route==='#')view=home(data.content.lessons.length,data.drinks.length);else if(route==='#/lab')view=lab();else if(route==='#/collection')view=collection(progress,data.drinks,data.sources);else if(route.startsWith('#/journey/')){const id=route.slice('#/journey/'.length);const lesson=data.content.lessons.find(x=>x.id===id);view=lesson?journey(lesson,progress,complete,data.sources,data.content.lessons):null;} if(!view)view=el('div',{class:'page-top'},el('h1',{},'找不到這個頁面'),el('p',{},'這個探索路徑目前尚未開放。'),link('回首頁','#/','primary'));cleanupScenes();main.replaceChildren(view);cleanupScenes=mountScenes(main,{visualMode:progress.preferences.visualMode,reducedMotion:progress.preferences.reducedMotion});document.title=`${SITE_CONFIG.brandName}｜互動式咖啡學習`;}
async function start(){try{data=await loadContent();render();}catch(error){main.replaceChildren(el('div',{class:'page-top'},el('h1',{},'教材暫時無法載入'),el('p',{},'請確認網站檔案完整，再試一次。'),el('button',{type:'button',class:'primary',onClick:start},'重新載入')));}}
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();main.focus();});
window.addEventListener('hashchange',()=>{if(data){render();main.focus();}});start();

const out = document.querySelector('#results');
const tests = [];
const test = (name, fn) => tests.push({name, fn});
const assert = (value, message) => { if (!value) throw new Error(message); };

test('必須操作並答對才通關', async () => {
  const { evaluateChallenge } = await import('../site/js/domain/lesson-engine.js');
  const lesson = {challenge:{type:'parameter-and-choice', parameter:'addedWaterG', minimum:80, correctOptionIds:['after']}};
  assert(!evaluateChallenge(lesson, {addedWaterG:0}, 'after').passed, '未操作不得通關');
  assert(!evaluateChallenge(lesson, {addedWaterG:100}, 'wrong').passed, '錯答不得通關');
  assert(evaluateChallenge(lesson, {addedWaterG:100}, 'after').passed, '操作並答對應通關');
});
test('重玩不重複獲獎且水章節不提前完成', async () => {
  const {completeLesson, totalPoints} = await import('../site/js/domain/progression.js');
  let p = {completedLessonIds:[], awardedAchievementIds:[], collectedDrinkIds:[]};
  const chapters = {intro:['intro-01'],water:['water-01','water-02','water-03']};
  for (const [id, chapter, card] of [['intro-01','intro',null],['water-01','water','espresso'],['water-02','water','americano'],['water-02','water','americano']]) p=completeLesson(p,{id,chapterId:chapter,rewardDrinkIds:card?[card]:[]},chapters).progress;
  assert(totalPoints(p)===50, '三關應為 50 BP');
  assert(p.collectedDrinkIds.length===2, '收藏應去重');
  assert(!p.awardedAchievementIds.includes('chapter-water'), '水章節尚未完成');
});
test('非法水量不得通關', async () => {
  const {validateWater} = await import('../site/js/domain/recipe.js');
  assert(!validateWater(NaN) && !validateWater(-1) && !validateWater(1e9), '應拒絕非法值');
  assert(validateWater(120), '120 g 應有效');
});
test('儲存失敗不阻止進度及舊資料不覆蓋新資料', async () => {
  const {createStorage} = await import('../site/js/core/storage.js');
  const blocked = createStorage({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});
  assert(!blocked.save({schemaVersion:1}), '應回報儲存失敗');
  assert(blocked.load().progress.schemaVersion===1, '仍可取得空進度');
  const data = new Map([['coffeepath.progress.v1',JSON.stringify({schemaVersion:1,completedLessonIds:['water-01']})],['coffeelearn.progress.v1',JSON.stringify({schemaVersion:1,completedLessonIds:['intro-01']})]]);
  const store=createStorage({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});
  assert(store.load().progress.completedLessonIds[0]==='water-01', '不得覆蓋新資料');
});
test('過大水量不可通過關卡', async () => {
  const {evaluateChallenge}=await import('../site/js/domain/lesson-engine.js');
  const lesson={challenge:{type:'parameter-and-choice',parameter:'addedWaterG',minimum:80,correctOptionIds:['after']}};
  assert(!evaluateChallenge(lesson,{addedWaterG:1000000},'after').passed,'非法水量不得通關');
});
test('無效舊資料不得遷移', async () => {
  const {createStorage}=await import('../site/js/core/storage.js');
  const data=new Map([['coffeelearn.progress.v1',JSON.stringify({schemaVersion:1,completedLessonIds:['intro-01'],collectedDrinkIds:[42]})]]);
  const store=createStorage({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});
  assert(store.load().progress.completedLessonIds.length===0,'不應讀取無效收藏資料');
  assert(!data.has('coffeepath.progress.v1'),'不應遷移無效資料');
});
test('實際教材資料通過引用檢查', async () => {
  const {validateContent}=await import('../site/js/domain/content-validator.js');
  const [lessons,drinks,sources]=await Promise.all(['../site/data/lessons.json','../site/data/drinks.json','../site/data/sources.json'].map(async p=>(await fetch(p)).json()));
  assert(validateContent(lessons,drinks,sources),'教材必須通過');
  lessons.lessons[0].rewardDrinkIds=['unknown'];assert(!validateContent(lessons,drinks,sources),'未知飲品不得通過');
});
test('錯誤種類與未解析來源必須被拒絕', async () => {
  const {validateContent}=await import('../site/js/domain/content-validator.js');
  const [lessons,drinks,sources]=await Promise.all(['../site/data/lessons.json','../site/data/drinks.json','../site/data/sources.json'].map(async p=>(await fetch(p)).json()));
  drinks.items[0].kind='unknown';assert(!validateContent(lessons,drinks,sources),'未知分類不得通過');
  drinks.items[0].kind='drink';drinks.items[0].sources=['missing'];assert(!validateContent(lessons,drinks,sources),'未知來源不得通過');
});
test('損壞的新進度不被覆蓋', async () => {
  const {createStorage}=await import('../site/js/core/storage.js');const data=new Map([['coffeepath.progress.v1','{broken']]);
  const store=createStorage({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});assert(store.load().invalid,'必須回報損壞');assert(!store.save({schemaVersion:1}),'不得寫入');assert(data.get('coffeepath.progress.v1')==='{broken','原始資料必須保留');
});
test('靜態頁籤與品牌設定一致', async () => {
  const {SITE_CONFIG}=await import('../site/js/config/site-config.js');const html=await (await fetch('../site/index.html')).text();const doc=new DOMParser().parseFromString(html,'text/html');
  assert(doc.title.includes(SITE_CONFIG.brandName),'靜態標題應含品牌');assert(doc.querySelector('meta[name="description"]').content.includes(SITE_CONFIG.brandName),'靜態摘要應含品牌');
});
test('有效舊進度在新 key 缺席時遷移', async () => {
  const {createStorage}=await import('../site/js/core/storage.js');const old=JSON.stringify({schemaVersion:1,completedLessonIds:['intro-01'],awardedAchievementIds:['chapter-intro'],collectedDrinkIds:[]});const data=new Map([['coffeelearn.progress.v1',old]]);
  const store=createStorage({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});assert(store.load().progress.completedLessonIds[0]==='intro-01','應讀取舊進度');assert(JSON.parse(data.get('coffeepath.progress.v1')).completedLessonIds[0]==='intro-01','應寫入新 key');
});
test('核心教材有六張以上可追溯的咖啡卡', async () => {
  const drinks=await (await fetch('../site/data/drinks.json')).json();
  const sources=await (await fetch('../site/data/sources.json')).json();
  assert(drinks.items.length>=6,'至少六張核心卡');
  assert(drinks.items.every(d=>d.sources.length && d.sources.every(id=>sources.items.some(s=>s.id===id && s.url.startsWith('https://')))),'每張卡需有可追溯來源');
});
test('課程來源引用必須存在', async () => {
  const {validateContent}=await import('../site/js/domain/content-validator.js');
  const [lessons,drinks,sources]=await Promise.all(['../site/data/lessons.json','../site/data/drinks.json','../site/data/sources.json'].map(async p=>(await fetch(p)).json()));
  lessons.lessons[0].sourceIds=['not-a-source'];
  assert(!validateContent(lessons,drinks,sources),'不存在的課程來源不得通過');
});
test('未收藏卡片可閱讀但不冒稱已收藏', async () => {
  const {collection}=await import('../site/js/features/collection.js');
  const drinks=[{id:'espresso',name:{zhHant:'義式濃縮',en:'Espresso'},intro:'咖啡',sources:['ref']}];
  const view=collection({collectedDrinkIds:[]},drinks,[{id:'ref',title:'參考來源',url:'https://example.com'}]);
  assert(view.textContent.includes('義式濃縮'),'未收藏也可閱讀');assert(view.textContent.includes('尚未收藏'),'不能冒稱已收藏');assert(view.querySelector('a[href="https://example.com"]'),'來源必須可見');
});
test('3D 載入失敗時保留 2D 畫面', async () => {
  const {createSceneController}=await import('../site/js/ui/scene-controller.js');
  const host=document.createElement('div'); const fallback=document.createElement('span'); host.append(fallback);
  const controller=createSceneController(host,fallback,async()=>{throw Error('blocked')});
  await controller.enable();assert(!fallback.hidden,'失敗時 2D 必須可見');assert(!host.querySelector('canvas'),'失敗不能留下 canvas');controller.dispose();
});
test('離開頁面後遲到的 3D 載入不得掛載', async () => {
  const {createSceneController}=await import('../site/js/ui/scene-controller.js');
  let resolve; const pending=new Promise(r=>resolve=r);let disposed=0;const host=document.createElement('div');const fallback=document.createElement('span');host.append(fallback);
  const controller=createSceneController(host,fallback,()=>pending);const enabled=controller.enable();controller.dispose();resolve({createScene:()=>({canvas:document.createElement('canvas'),dispose(){disposed++}})});await enabled;
  assert(!host.querySelector('canvas'),'不可掛到已離開的畫面');assert(!fallback.hidden,'2D 保持可見');assert(disposed<=1,'不可重複釋放');
});
test('3D 載入期間操作會在載入後呈現，切回 2D 會清理', async () => {
  const {createSceneController}=await import('../site/js/ui/scene-controller.js');let resolve;const pending=new Promise(r=>resolve=r);let state,disposals=0;const host=document.createElement('div');const fallback=document.createElement('span');host.append(fallback);
  const controller=createSceneController(host,fallback,()=>pending);const enabled=controller.enable();controller.update({water:120});controller.update({reducedMotion:true});resolve({createScene:()=>({canvas:document.createElement('canvas'),render(){},update(value){state=value;},dispose(){disposals++;}})});await enabled;
  assert(state.water===120&&state.reducedMotion===true,'載入期間的水量與動態偏好不可互相覆蓋');assert(fallback.hidden,'3D 成功時隱藏 2D');controller.disable();assert(!fallback.hidden&&!host.querySelector('canvas'),'切回 2D 必須移除 3D');controller.dispose();assert(disposals===1,'僅釋放一次');
});
test('已啟用 3D 的更新失敗會安全降回 2D', async () => {
  const {createSceneController}=await import('../site/js/ui/scene-controller.js');let disposed=0;const host=document.createElement('div');const fallback=document.createElement('span');host.append(fallback);
  const controller=createSceneController(host,fallback,async()=>({createScene:()=>({canvas:document.createElement('canvas'),render(){},update(){throw Error('GPU error')},dispose(){disposed++;}})}));
  await controller.enable();controller.update({water:100});assert(!fallback.hidden&&!host.querySelector('canvas'),'出錯後必須恢復 2D');assert(disposed===1,'出錯後釋放場景');
});
test('選擇 2D 後換頁仍保留 2D', async () => {
  const {mountScenes}=await import('../site/js/ui/mount-scenes.js');let preference='auto';
  const createRoot=()=>{const root=document.createElement('div');root.innerHTML='<div data-scene="cup"><div class="scene-fallback"></div></div>';document.body.append(root);return root;};
  const loader=async()=>({createScene:()=>({canvas:document.createElement('canvas'),render(){},update(){},dispose(){}})});
  const schedule=fn=>{fn();return 0;};
  const root=createRoot();let stop=mountScenes(root,{visualMode:preference,loader,schedule});
  await new Promise(resolve=>setTimeout(resolve,0));preference='2d';stop.setMode(preference);assert(!root.querySelector('canvas'),'全域變更應立即生效');stop();root.remove();
  const next=createRoot();stop=mountScenes(next,{visualMode:preference,loader,schedule});await new Promise(resolve=>setTimeout(resolve,0));
  assert(!next.querySelector('canvas'),'換頁後不應自動啟用 3D');stop();next.remove();
});
test('全域顯示設定保留 3D 並可獨立關閉動態', async () => {
  const {createDisplaySettings}=await import('../site/js/ui/display-settings.js');let changed;
  const settings=createDisplaySettings({visualMode:'3d',reducedMotion:false},value=>{changed=value;});
  const toggle=settings.querySelector('input[type="checkbox"]');toggle.checked=true;toggle.dispatchEvent(new Event('change'));
  assert(changed.reducedMotion===true&&changed.visualMode==='3d','不應為關閉動態而切換 2D');
  const select=settings.querySelector('select');select.value='2d';select.dispatchEvent(new Event('change'));
  assert(changed.visualMode==='2d'&&changed.reducedMotion===true,'設定應分別保留');
});
test('首頁選擇原料以可讀文字及場景事件回應', async () => {
  const {home}=await import('../site/js/features/home.js');const view=home();const scene=view.querySelector('[data-scene="world"]');let selected;
  scene.addEventListener('coffee-scene-update',event=>{selected=event.detail.ingredient;});
  const button=[...view.querySelectorAll('button')].find(node=>node.textContent.includes('水'));assert(button,'水的按鈕應存在');button.click();
  assert(selected==='water','選擇水應通知場景');assert(view.textContent.includes('水讓咖啡粉中的物質被萃取出來'),'應有可讀說明');
});
test('3D 執行中失敗時顯示全域設定的降級提示', async () => {
  const {mountScenes}=await import('../site/js/ui/mount-scenes.js');let fail;
  const root=document.createElement('div');root.innerHTML='<div data-scene="cup"><div class="scene-fallback"></div></div>';document.body.append(root);
  const stop=mountScenes(root,{schedule:fn=>{fn();return 0;},loader:async()=>({createScene:(host,options,onFailure)=>{fail=onFailure;return {canvas:document.createElement('canvas'),render(){},update(){},dispose(){}};}})});
  await new Promise(resolve=>setTimeout(resolve,0));fail();assert(root.textContent.includes('3D 暫時無法使用'),'應告知已降級');assert(!root.querySelector('canvas'),'應保留 2D');stop();root.remove();
});
test('序章選擇與取消原料同步場景且不繞過通關', async () => {
  const {journey}=await import('../site/js/features/journey.js');const content=await (await fetch('../site/data/lessons.json')).json();
  let completed=0;const view=journey(content.lessons[0],{completedLessonIds:[]},()=>{completed++;return true;});document.body.append(view);
  const frame=view.querySelector('[data-scene="world"]');let selected='unseen';frame.addEventListener('coffee-scene-update',event=>{selected=event.detail.ingredient;});
  const boxes=view.querySelectorAll('.ingredient-list input');boxes[0].click();assert(selected==='beans',`選豆應指出咖啡豆（目前 ${selected}）`);boxes[1].click();assert(selected==='water','選水應指出水');boxes[1].click();assert(selected==='beans','取消水後回到已選的豆');boxes[0].click();assert(selected===null,'全部取消應清除標記');
  boxes[0].click();boxes[1].click();view.querySelector('input[value="v60"]').click();view.querySelector('button.primary').click();assert(completed===0,'少選原料不得通關');boxes[2].click();view.querySelector('button.primary').click();assert(completed===1,'選擇三種原料且答對才完成');view.remove();
});
test('萃取示意依序顯示水經粉床與咖啡流入杯中', async () => {
  const {extractionFrame}=await import('../site/js/domain/process-frames.js');
  const start=extractionFrame(0),wet=extractionFrame(.25),flow=extractionFrame(.6),done=extractionFrame(1);
  assert(!start.waterFlow&&!start.coffeeFlow&&start.filled===0,'起始不能已有萃取液');
  assert(wet.waterFlow&&!wet.coffeeFlow&&wet.filled===0,'水先通過粉床');
  assert(flow.waterFlow&&flow.coffeeFlow&&flow.filled>0&&flow.filled<1,'萃取液再流入杯中');
  assert(!done.waterFlow&&!done.coffeeFlow&&done.filled===1,'完成後停止出液');
});
test('加水示意僅在增加水量時傾倒並增加杯量', async () => {
  const {pourFrame}=await import('../site/js/domain/process-frames.js');
  const start=pourFrame(0,120,0),mid=pourFrame(0,120,.5),end=pourFrame(0,120,1),decrease=pourFrame(120,20,.5);
  assert(start.water===0&&mid.water===60&&end.water===120,'杯中水量應隨時間增加');
  assert(mid.pouring&&!end.pouring,'倒水只在過程中顯示');
  assert(!decrease.pouring&&decrease.water===20,'減少水量不能倒流或倒水');
});
test('倒水尚未完成時降低目標不再繼續倒水', async () => {
  const {pourTransition}=await import('../site/js/domain/process-frames.js');
  const decrease=pourTransition(40,120,80),increase=pourTransition(40,120,150);
  assert(!decrease.animate&&decrease.from===80&&decrease.to===80,'降低目標應立即更新而非繼續倒水');
  assert(increase.animate&&increase.from===40&&increase.to===150,'提高目標應從目前畫面持續加水');
});
test('流程中切換到 2D 時呈現最終狀態而不重播', async () => {
  const {createSceneController}=await import('../site/js/ui/scene-controller.js');
  const host=document.createElement('div');const fallback=document.createElement('div');fallback.innerHTML='<div class="extraction-diagram is-extracting"></div><div class="pour-diagram is-pouring"></div>';host.append(fallback);
  const controller=createSceneController(host,fallback,async()=>({createScene:()=>({canvas:document.createElement('canvas'),render(){},update(){},dispose(){}})}));
  await controller.enable();controller.disable();assert(!fallback.hidden,'應回到 2D');assert(fallback.querySelector('.is-complete'),'萃取應顯示完成狀態');assert(!fallback.querySelector('.is-extracting,.is-pouring'),'切換時不應重播');controller.dispose();
});
test('加水前不稱美式，減量明示配方調整', async () => {
  const {waterProcessMeaning}=await import('../site/js/domain/process-frames.js');
  assert(waterProcessMeaning(0,0).result==='espresso','未加水保持濃縮');
  assert(waterProcessMeaning(120,0).change==='add'&&waterProcessMeaning(120,0).result==='diluted','加水才顯示稀釋示意');
  assert(waterProcessMeaning(80,120).change==='adjust','減少數值不是倒出液體');
  assert(waterProcessMeaning(0,80).result==='espresso','歸零回到濃縮');
});
test('關卡與 Lab 只在有加水後顯示美式風格示意', async () => {
  const {journey}=await import('../site/js/features/journey.js');const {lab}=await import('../site/js/features/lab.js');
  const lessons=(await (await fetch('../site/data/lessons.json')).json()).lessons;
  for(const [view,selector] of [[journey(lessons[2],{completedLessonIds:[]},()=>true),'#water-number'],[lab(),'#lab-water']]){
    document.body.append(view);const sequence=view.querySelector('.process-sequence'),input=view.querySelector(selector);
    assert(!sequence.textContent.includes('Americano'),'初始尚未加水不得顯示美式結果');
    input.value='120';input.dispatchEvent(new Event('input'));assert(sequence.textContent.includes('Americano'),'加水後應顯示製作方式示意');
    input.value='-1';input.dispatchEvent(new Event('input'));assert(view.textContent.includes('請輸入 0–250 g')&&sequence.textContent.includes('Americano'),'非法輸入保留上一個有效狀態並顯示原因');
    input.value='80';input.dispatchEvent(new Event('input'));assert(view.textContent.includes('重新設定配方'),'減量應說明是配方調整');
    input.value='0';input.dispatchEvent(new Event('input'));assert(!sequence.textContent.includes('Americano'),'歸零後回到濃縮');view.remove();
  }
});
test('萃取關卡與 Lab 傳遞正確流程及 2D 備援', async () => {
  const {journey}=await import('../site/js/features/journey.js');const {lab}=await import('../site/js/features/lab.js');
  const lessons=(await (await fetch('../site/data/lessons.json')).json()).lessons;
  const view=journey(lessons[1],{completedLessonIds:[]},()=>true);document.body.append(view);let event;
  view.querySelector('[data-scene]').addEventListener('coffee-scene-update',e=>{event=e.detail;});
  assert(view.textContent.includes('咖啡粉床'),'萃取流程必須有粉床');view.querySelector('button.secondary').click();
  assert(event.process==='extract'&&view.querySelector('.is-extracting'),'啟動應傳遞萃取過程至場景及 2D');view.remove();
  const area=lab();document.body.append(area);const input=area.querySelector('#lab-water');input.value='120';input.dispatchEvent(new Event('input'));
  assert(area.querySelector('.is-pouring'),'增加水量應呈現倒水');input.value='20';input.dispatchEvent(new Event('input'));assert(!area.querySelector('.is-pouring'),'減少水量不應倒流');area.remove();
});
test('首頁展示原料、製程與飲品的關係及尚未開放的路徑', async () => {
  const {home}=await import('../site/js/features/home.js');const page=home();
  assert(page.textContent.includes('咖啡豆')&&page.textContent.includes('水')&&page.textContent.includes('牛奶'),'應指出三種原料');
  assert(page.textContent.includes('萃取')&&page.textContent.includes('飲品'),'應解釋原料與飲品的關係');
  assert(page.textContent.includes('手沖')&&page.textContent.includes('冷萃')&&page.textContent.includes('規劃中'),'應標明未開放路徑');
  assert(page.querySelector('a[href="#/journey/intro-01"]')&&page.querySelector('a[href="#/lab"]'),'兩個入口仍可使用');
});

let failures=0; const lines=[];
for (const {name,fn} of tests) { try {await fn(); lines.push(`PASS ${name}`);} catch(e) {failures++; lines.push(`FAIL ${name}: ${e.message}`);} }
out.textContent=lines.join('\n')+`\n${tests.length-failures}/${tests.length} passed`;
document.title=failures?'FAIL':'PASS';

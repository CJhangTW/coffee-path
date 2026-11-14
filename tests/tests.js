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
  const controller=createSceneController(host,fallback,()=>pending);const enabled=controller.enable();controller.update({water:120});resolve({createScene:()=>({canvas:document.createElement('canvas'),render(){},update(value){state=value;},dispose(){disposals++;}})});await enabled;
  assert(state.water===120,'載入期間變更不可遺失');assert(fallback.hidden,'3D 成功時隱藏 2D');controller.disable();assert(!fallback.hidden&&!host.querySelector('canvas'),'切回 2D 必須移除 3D');controller.dispose();assert(disposals===1,'僅釋放一次');
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
  const root=createRoot();let stop=mountScenes(root,{visualMode:preference,onPreference:v=>{preference=v;},loader,schedule});
  await new Promise(resolve=>setTimeout(resolve,0));root.querySelector('button').click();assert(preference==='2d','切換應保存偏好');stop();root.remove();
  const next=createRoot();stop=mountScenes(next,{visualMode:preference,onPreference:v=>{preference=v;},loader,schedule});await new Promise(resolve=>setTimeout(resolve,0));
  assert(!next.querySelector('canvas'),'換頁後不應自動啟用 3D');stop();next.remove();
});
test('首頁展示原料、製程與飲品的關係及尚未開放的路徑', async () => {
  const {home}=await import('../site/js/features/home.js');const page=home();
  assert(page.textContent.includes('咖啡豆')&&page.textContent.includes('水')&&page.textContent.includes('牛奶'),'應指出三種原料');
  assert(page.textContent.includes('萃取')&&page.textContent.includes('飲品'),'應解釋原料與飲品的關係');
  assert(page.textContent.includes('手沖')&&page.textContent.includes('冷萃')&&page.textContent.includes('規劃中'),'應標明未開放路徑');
  assert(page.querySelector('a[href="#/journey/intro-01"]')&&page.querySelector('a[href="#/lab"]'),'兩個入口仍可使用');
});
test('細微動態只在可見且允許動畫時執行', async () => {
  const {createAmbientMotion}=await import('../site/js/ui/ambient-motion.js');
  const callbacks=new Map();let id=0,angle=0;const requestFrame=cb=>{callbacks.set(++id,cb);return id;};const cancelFrame=key=>callbacks.delete(key);
  const motion=createAmbientMotion({render:value=>{angle=value;},requestFrame,cancelFrame});
  const step=time=>{const [key,fn]=callbacks.entries().next().value;callbacks.delete(key);fn(time);};
  motion.setVisible(true);assert(callbacks.size===1,'場景可見應啟動');step(0);step(100);assert(angle>0&&angle<0.1,'角度應小幅度變化');
  motion.setPageVisible(false);assert(callbacks.size===0,'背景分頁應停止');motion.setPageVisible(true);assert(callbacks.size===1,'返回分頁應恢復');
  motion.setReduced(true);assert(callbacks.size===0&&angle===0,'減少動態時停止並回到原位');motion.setReduced(false);motion.setVisible(false);assert(callbacks.size===0,'離開視窗時應停止');
  motion.setVisible(true);motion.dispose();assert(callbacks.size===0,'移除場景應取消排程');
});

let failures=0; const lines=[];
for (const {name,fn} of tests) { try {await fn(); lines.push(`PASS ${name}`);} catch(e) {failures++; lines.push(`FAIL ${name}: ${e.message}`);} }
out.textContent=lines.join('\n')+`\n${tests.length-failures}/${tests.length} passed`;
document.title=failures?'FAIL':'PASS';

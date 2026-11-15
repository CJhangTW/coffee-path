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
  boxes[0].click();boxes[1].click();view.querySelector('input[value="ingredients"]').click();view.querySelector('button.primary').click();assert(completed===0,'少選原料不得通關');boxes[2].click();view.querySelector('button.primary').click();assert(completed===1,'選擇三種原料且答對才完成');view.remove();
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
test('對照關卡必須觀察兩種做法並答對', async () => {
  const {evaluateChallenge}=await import('../site/js/domain/lesson-engine.js');
  const lesson={challenge:{type:'observe-and-choice',requiredActionIds:['lungo','americano'],correctOptionIds:['through']}};
  assert(!evaluateChallenge(lesson,{observedActionIds:['lungo']},'through').passed,'只觀察一種不得通關');
  assert(!evaluateChallenge(lesson,{observedActionIds:['lungo','americano']},'wrong').passed,'錯答不得通關');
  assert(evaluateChallenge(lesson,{observedActionIds:['lungo','americano']},'through').passed,'完成兩種觀察且答對才通關');
});
test('完成完整水章只發放一次章節獎勵與長萃卡', async () => {
  const {completeLesson,totalPoints}=await import('../site/js/domain/progression.js');
  const chapters={intro:['intro-01'],water:['water-01','water-02','water-03']};
  const initial={completedLessonIds:['intro-01','water-01','water-02'],awardedAchievementIds:['chapter-intro'],collectedDrinkIds:['espresso','americano']};
  const lesson={id:'water-03',chapterId:'water',rewardDrinkIds:['lungo']};const once=completeLesson(initial,lesson,chapters).progress;const twice=completeLesson(once,lesson,chapters).progress;
  assert(totalPoints(once)===80&&totalPoints(twice)===80,'完成水章總點數應為 80，重玩不加點');assert(twice.collectedDrinkIds.filter(id=>id==='lungo').length===1,'長萃卡僅收藏一次');
});
test('水章對照操作與資料導覽支援完整通關', async () => {
  const {journey}=await import('../site/js/features/journey.js');const data=await (await fetch('../site/data/lessons.json')).json();
  const lesson=data.lessons.find(item=>item.id==='water-03');assert(lesson,'必須提供水章第三關');let awarded=0;
  const view=journey(lesson,{completedLessonIds:[]},()=>{awarded++;return true;},[],data.lessons);document.body.append(view);
  const actions=view.querySelectorAll('[data-observe-action]');assert(actions.length===2,'需提供兩種操作');
  actions[0].click();view.querySelector('input[value="through"]').click();view.querySelector('button.primary').click();assert(awarded===0,'只看一種不能完成');
  actions[1].click();view.querySelector('button.primary').click();assert(awarded===1,'兩種操作與正確答案完成關卡');view.remove();
});
test('對照關卡需有可解析且不重複的觀察動作', async () => {
  const {validateContent}=await import('../site/js/domain/content-validator.js');
  const [lessons,drinks,sources]=await Promise.all(['../site/data/lessons.json','../site/data/drinks.json','../site/data/sources.json'].map(async p=>(await fetch(p)).json()));
  const comparison=lessons.lessons.find(item=>item.id==='water-03');comparison.challenge.requiredActionIds.push('unknown');
  assert(!validateContent(lessons,drinks,sources),'未知動作不可通過資料檢查');
  comparison.challenge.requiredActionIds=['lungo','lungo'];assert(!validateContent(lessons,drinks,sources),'必要動作不得重複');
});
test('水章第二關的下一步由資料順序接至第三關', async () => {
  const {journey}=await import('../site/js/features/journey.js');const data=await (await fetch('../site/data/lessons.json')).json();
  const view=journey(data.lessons.find(item=>item.id==='water-02'),{completedLessonIds:[]},()=>true,[],data.lessons);
  assert(view.querySelector('a[href="#/journey/milk-06"]'),'跳過或下一步應先前往 Latte 入門');
});
test('water-02 只檢查已教過的濃縮與萃取後加水，Lungo 留待 water-03', async () => {
  const data=await (await fetch('../site/data/lessons.json')).json();
  const lesson=data.lessons.find(item=>item.id==='water-02');
  assert(lesson.question.includes('Espresso')&&lesson.question.includes('Americano'),'water-02 應在已學的濃縮與萃取後加水間比較');
  assert(!JSON.stringify([lesson.question,lesson.options,lesson.wrong,lesson.summary]).includes('Lungo'),'water-02 不應要求辨識尚未教過的 Lungo');
  assert(JSON.stringify(data.lessons.find(item=>item.id==='water-03').options).includes('Lungo'),'Lungo 對照應留在專門的 water-03');
});
test('資料檢查拒絕不存在的正確答案', async () => {
  const {validateContent}=await import('../site/js/domain/content-validator.js');const [lessons,drinks,sources]=await Promise.all(['../site/data/lessons.json','../site/data/drinks.json','../site/data/sources.json'].map(async p=>(await fetch(p)).json()));
  lessons.lessons.find(item=>item.id==='water-03').challenge.correctOptionIds=['missing'];assert(!validateContent(lessons,drinks,sources),'不可使用沒有對應選項的答案');
});
test('牛奶示意分清奶泡與液態牛奶', async () => {
  const {milkFrame}=await import('../site/js/domain/process-frames.js');
  const foam=milkFrame('foam',8,.5),milk=milkFrame('milk',36,.5),done=milkFrame('milk',36,1);
  assert(foam.spoon&&!foam.pouring,'奶泡示意應由湯匙放入，不是液態倒入');
  assert(foam.spoonOffset===1&&milkFrame('foam',8,0).spoonOffset===0&&milkFrame('foam',8,1).spoonOffset===0,'奶泡匙應移向杯面再返回');
  assert(milk.pouring&&!milk.spoon&&milk.amount===18,'牛奶示意應顯示液態倒入');
  assert(!done.pouring&&done.amount===36,'完成後停止倒奶');
});
test('牛奶章必須操作才能通關且不提前給章節獎勵', async () => {
  const {evaluateChallenge}=await import('../site/js/domain/lesson-engine.js');const {completeLesson,totalPoints}=await import('../site/js/domain/progression.js');
  const lesson={id:'milk-01',chapterId:'milk',rewardDrinkIds:['espresso-macchiato'],challenge:{type:'action-and-choice',correctOptionIds:['small']}};
  assert(!evaluateChallenge(lesson,{completed:false},'small').passed,'尚未操作不得通關');assert(evaluateChallenge(lesson,{completed:true},'small').passed,'操作並答對應通關');
  const chapters={milk:['milk-01','milk-02','milk-03','milk-04','milk-05']};const start={completedLessonIds:[],awardedAchievementIds:[],collectedDrinkIds:[]};
  const once=completeLesson(start,lesson,chapters).progress,twice=completeLesson(once,lesson,chapters).progress;
  assert(totalPoints(twice)===10&&!twice.awardedAchievementIds.includes('chapter-milk'),'未完成整章或重玩不能額外給點');
});
test('牛奶課程觸發與文字一致的示範', async () => {
  const {journey}=await import('../site/js/features/journey.js');const data=await (await fetch('../site/data/lessons.json')).json();
  for(const [id,kind,amount] of [['milk-01','foam',8],['milk-02','milk',36]]){
    const lesson=data.lessons.find(item=>item.id===id);assert(lesson,`${id} 應存在`);let completed=0,event;
    const view=journey(lesson,{completedLessonIds:[]},()=>{completed++;return true;},[],data.lessons);document.body.append(view);
    assert(view.textContent.includes('尚未加入牛奶或奶泡'),'牛奶課程初始狀態應說明尚未加奶');
    view.querySelector('[data-scene]').addEventListener('coffee-scene-update',e=>{event=e.detail;});
    view.querySelector('input[value="'+lesson.challenge.correctOptionIds[0]+'"]').click();view.querySelector('button.primary').click();assert(completed===0,'未操作不可通關');
    view.querySelector('[data-demonstration]').click();assert(event.process==='milk'&&event.milkKind===kind&&event.milkG===amount,'動作必須與教材一致');
    view.querySelector('button.primary').click();assert(completed===1,'完成操作並答對應通關');view.remove();
  }
});
test('牛奶示範資料不得使用未知動作或非法重量', async () => {
  const {validateContent}=await import('../site/js/domain/content-validator.js');const [lessons,drinks,sources]=await Promise.all(['../site/data/lessons.json','../site/data/drinks.json','../site/data/sources.json'].map(async p=>(await fetch(p)).json()));
  const lesson=lessons.lessons.find(item=>item.id==='milk-01');lesson.demonstration.type='unknown';assert(!validateContent(lessons,drinks,sources),'未知示範類型應拒絕');
  lesson.demonstration.type='foam';lesson.demonstration.amountG=-1;assert(!validateContent(lessons,drinks,sources),'負數應拒絕');
});
test('Latte 入門位於水章第二關後且保留牛奶示範與獎勵規則', async () => {
  const data=await (await fetch('../site/data/lessons.json')).json();
  const ids=data.lessons.map(lesson=>lesson.id);
  const lesson=data.lessons.find(item=>item.id==='milk-06');
  assert(ids.indexOf('water-02')<ids.indexOf('milk-06')&&ids.indexOf('milk-06')<ids.indexOf('water-03'),'Latte 入門應接在 water-02 後、water-03 前');
  assert(data.chapters.milk.includes('milk-06'),'牛奶章應包含 milk-06');
  assert(lesson&&lesson.chapterId==='milk'&&lesson.demonstration.type==='milk'&&lesson.demonstration.amountG===180,'新關卡應用既有液態牛奶示範加入 180 g');
  assert(lesson.rewardDrinkIds.includes('latte')&&lesson.sourceIds.includes('pdg-milk'),'新關卡應收藏 Latte 並引用既有牛奶來源');
  assert(lesson.summary.includes('36 g')&&lesson.summary.includes('180 g')&&/示例|非全球|非唯一/.test(lesson.summary),'教材應呈現 36 g Espresso + 180 g 牛奶且明示只是示例');
  const existingIds=['milk-01','milk-02'];
  const chapterIds=['milk-01','milk-02','milk-03','milk-04','milk-05'];
  assert(existingIds.every(id=>ids.includes(id))&&chapterIds.every(id=>data.chapters.milk.includes(id)),'既有關卡 ID 及預留的牛奶章 ID 都應保留原意');
});
test('既有牛奶進度保留，新增 Latte 關卡完成前不提早領章節獎', async () => {
  const {completeLesson,totalPoints}=await import('../site/js/domain/progression.js');
  const data=await (await fetch('../site/data/lessons.json')).json();
  const oldIds=['milk-01','milk-02'];
  const previous={completedLessonIds:oldIds,awardedAchievementIds:[],collectedDrinkIds:['espresso-macchiato','cortado']};
  const before=completeLesson(previous,{id:'milk-01',chapterId:'milk',rewardDrinkIds:['espresso-macchiato']},data.chapters).progress;
  assert(oldIds.every(id=>before.completedLessonIds.includes(id)),'讀取與重玩舊關卡不得移除舊完成紀錄');
  assert(!before.awardedAchievementIds.includes('chapter-milk')&&totalPoints(before)===20,'保留舊有兩關完成時，不應誤領完整牛奶章獎勵');
  const lesson=data.lessons.find(item=>item.id==='milk-06');
  const once=completeLesson(before,lesson,data.chapters).progress;
  const twice=completeLesson(once,lesson,data.chapters).progress;
  assert(!once.awardedAchievementIds.includes('chapter-milk')&&totalPoints(once)===30,'milk-06 不能讓尚未完成 milk-03 至 milk-05 的牛奶章提早結算');
  assert(totalPoints(twice)===30&&twice.collectedDrinkIds.filter(id=>id==='latte').length===1,'重玩不得重複領豆點或 Latte 卡');
  let complete=once;
  for(const id of ['milk-03','milk-04','milk-05']) complete=completeLesson(complete,{id,chapterId:'milk',rewardDrinkIds:[]},data.chapters).progress;
  assert(complete.awardedAchievementIds.includes('chapter-milk')&&totalPoints(complete)===80,'完成其餘牛奶關卡後才取得 20 BP 章節獎勵');
});
test('一般萃取動畫結束後 2D 杯中仍有咖啡液', async () => {
  const {extractionDiagram}=await import('../site/js/ui/dom.js');
  const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='../site/css/style.css';
  const loaded=new Promise((resolve,reject)=>{stylesheet.addEventListener('load',resolve,{once:true});stylesheet.addEventListener('error',()=>reject(new Error('無法載入網站樣式表')),{once:true});});
  document.head.append(stylesheet);
  await loaded;
  const diagram=extractionDiagram(true);document.body.append(diagram);
  await new Promise(resolve=>setTimeout(resolve,2450));
  const liquid=diagram.querySelector('.diagram-liquid');
  assert(!diagram.classList.contains('is-extracting')&&diagram.classList.contains('is-complete'),'一般萃取動畫應在 2400 ms 後完成');
  assert(parseFloat(getComputedStyle(liquid).height)>0,'動畫完成後杯中液面 computed height 應大於 0');
  diagram.remove();stylesheet.remove();
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

test('拿鐵後接卡布奇諾，必須完成兩步才通關', async () => {
  const {journey}=await import('../site/js/features/journey.js');
  const data=await (await fetch('../site/data/lessons.json')).json();
  const ids=data.lessons.map(l=>l.id),lesson=data.lessons.find(l=>l.id==='milk-04');
  assert(ids.indexOf('milk-04')===ids.indexOf('milk-06')+1,'卡布奇諾應接在拿鐵後');
  let count=0;const wasReduced=document.body.classList.contains('reduce-motion');document.body.classList.add('reduce-motion');
  const view=journey(lesson,{completedLessonIds:[]},()=>{count++;return true;},[],data.lessons);document.body.append(view);
  view.querySelector('input[value="foam"]').click();view.querySelector('button.primary').click();assert(count===0,'未操作不可通關');
  view.querySelector('[data-cappuccino-step="milk"]').click();view.querySelector('button.primary').click();assert(count===0,'只加牛奶不可通關');
  view.querySelector('[data-cappuccino-step="foam"]').click();view.querySelector('button.primary').click();assert(count===1,'完成兩步且答對後通關');
  view.remove();if(!wasReduced)document.body.classList.remove('reduce-motion');
});

let failures=0; const lines=[];
for (const {name,fn} of tests) { try {await fn(); lines.push(`PASS ${name}`);} catch(e) {failures++; lines.push(`FAIL ${name}: ${e.message}`);} }
out.textContent=lines.join('\n')+`\n${tests.length-failures}/${tests.length} passed`;
document.title=failures?'FAIL':'PASS';

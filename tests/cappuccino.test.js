const output = document.querySelector('#results');
const tests = [];
const test = (name, fn) => tests.push({name, fn});
const assert = (value, message) => { if (!value) throw new Error(message); };
const wait = duration => new Promise(resolve => setTimeout(resolve, duration));

test('兩步卡布奇諾示意先完成加奶再允許放奶泡', async () => {
  const {createCappuccinoDemo} = await import('../site/js/features/cappuccino.js');
  let completed = 0;
  const demo = createCappuccinoDemo(() => completed++, {milkG:80, foamG:20});
  document.body.append(demo.controls, demo.frame);
  const sceneEvents=[];
  demo.frame.addEventListener('coffee-scene-update',event=>sceneEvents.push(event.detail));
  const milk = demo.controls.querySelector('[data-cappuccino-step="milk"]');
  const foam = demo.controls.querySelector('[data-cappuccino-step="foam"]');
  assert(!demo.completed && foam.disabled, '起始是 Espresso，第二步尚不可操作');
  assert(demo.fallback.querySelector('.cappuccino-cup > .cup-liquid:not(.cappuccino-milk-layer)'), '2D 初始杯中須有 Espresso');
  assert(demo.text.textContent.includes('示例') && demo.text.textContent.includes('非唯一'), '文字須說明這是拆解示例而非唯一製程');

  milk.click();
  assert(!demo.completed && foam.disabled, '只加牛奶不能完成示意');
  assert(demo.fallback.querySelector('.cappuccino-milk-layer'), '第一步須顯示液態牛奶及 Espresso');
  assert(sceneEvents.at(-1).process==='cappuccino'&&sceneEvents.at(-1).step==='milk', '第一步須同步通知 3D 場景');
  await wait(1350);
  assert(!foam.disabled, '牛奶示意完成後才可進行第二步');

  foam.click();
  assert(!demo.completed && completed === 0, '奶泡示意動畫完成前不可通關');
  assert(sceneEvents.at(-1).step==='foam', '第二步須同步通知 3D 場景');
  await wait(1350);
  assert(demo.completed && completed === 1, '放上奶泡後才呼叫完成 callback');
  assert(demo.fallback.querySelector('.cappuccino-foam-layer'), '第二步須在已有牛奶的杯面顯示奶泡');

  milk.click();
  assert(!demo.completed && foam.disabled && completed === 1, '重播加奶須重設第二步');
  await wait(1350);
  foam.click();
  await wait(1350);
  assert(demo.completed && completed === 2, '重播完整兩步可再次完成');
  demo.reset();
  assert(!demo.completed&&foam.disabled&&demo.fallback.querySelector('[data-step="espresso"]')&&sceneEvents.at(-1).step==='espresso', '重設須回到 Espresso 並同步重設場景');
  demo.controls.remove(); demo.frame.remove(); demo.dispose();
});

test('減少動態偏好立即呈現完整狀態並允許第二步', async () => {
  const {createCappuccinoDemo} = await import('../site/js/features/cappuccino.js');
  const wasReduced=document.body.classList.contains('reduce-motion');
  document.body.classList.add('reduce-motion');
  let completed=0;
  const demo=createCappuccinoDemo(()=>completed++);
  demo.controls.querySelector('[data-cappuccino-step="milk"]').click();
  const foam=demo.controls.querySelector('[data-cappuccino-step="foam"]');
  assert(!foam.disabled&&!demo.completed,'減少動態時第一步直接到完成狀態但仍需第二步');
  foam.click();
  assert(demo.completed&&completed===1&&demo.fallback.querySelector('.has-foam .cappuccino-foam-layer'),'減少動態仍須完成奶泡步驟');
  demo.dispose();demo.reset();demo.controls.remove();demo.frame.remove();
  if(!wasReduced)document.body.classList.remove('reduce-motion');
});

test('2D 與 3D 顯示切換保留卡布奇諾兩步結果', async () => {
  const {createCappuccinoDemo}=await import('../site/js/features/cappuccino.js');
  const {mountScenes}=await import('../site/js/ui/mount-scenes.js');
  const wasReduced=document.body.classList.contains('reduce-motion');
  document.body.classList.add('reduce-motion');
  const demo=createCappuccinoDemo(()=>{});
  const root=document.createElement('div');root.append(demo.controls,demo.frame);document.body.append(root);
  const updates=[];
  const stop=mountScenes(root,{visualMode:'2d',loader:async()=>({createScene:(host,options)=>({canvas:document.createElement('canvas'),render(){},update(state){updates.push(state);},dispose(){}})})});
  demo.controls.querySelector('[data-cappuccino-step="milk"]').click();
  demo.controls.querySelector('[data-cappuccino-step="foam"]').click();
  stop.setMode('3d');
  await wait(0);
  assert(updates.at(-1).process==='cappuccino'&&updates.at(-1).step==='foam'&&updates.at(-1).instant===true, '啟用 3D 應直接還原已完成兩步的最終狀態');
  stop.setMode('2d');
  assert(!demo.fallback.hidden&&demo.fallback.querySelector('.has-foam'), '回到 2D 應保留含奶泡的結果');
  stop();demo.dispose();root.remove();
  if(!wasReduced)document.body.classList.remove('reduce-motion');
});

test('卡布奇諾流程 frame 保留已加牛奶並按步驟出現奶泡', async () => {
  const {cappuccinoFrame} = await import('../site/js/domain/process-frames.js');
  const start = cappuccinoFrame('espresso', 1, 80, 20);
  const milkMid = cappuccinoFrame('milk', .5, 80, 20);
  const milkDone = cappuccinoFrame('milk', 1, 80, 20);
  const foamMid = cappuccinoFrame('foam', .5, 80, 20);
  const done = cappuccinoFrame('foam', 1, 80, 20);
  assert(start.milkG === 0 && start.foamG === 0, '起始只顯示 Espresso');
  assert(milkMid.milkG === 40 && milkMid.foamG === 0 && milkMid.milkPouring, '第一步增加液態奶且不先出現奶泡');
  assert(milkDone.milkG === 80 && milkDone.foamG === 0, '第一步完成保留液態奶');
  assert(foamMid.milkG === 80 && foamMid.foamG === 10 && foamMid.spoon, '第二步保留牛奶並用匙放奶泡');
  assert(done.milkG === 80 && done.foamG === 20 && !done.spoon, '完成後保留牛奶與奶泡');
});

let failures = 0;
const lines = [];
for (const {name, fn} of tests) {
  try { await fn(); lines.push(`PASS ${name}`); }
  catch (error) { failures++; lines.push(`FAIL ${name}: ${error.message}`); }
}
output.textContent = lines.join('\n') + `\n${tests.length - failures}/${tests.length} passed`;
document.title = failures ? 'FAIL' : 'PASS';

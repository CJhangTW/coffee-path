/** Return conceptual stages rather than a physical flow or concentration model. */
export function extractionFrame(progress) {
  const p=Math.max(0,Math.min(1,progress));
  return {waterFlow:p>0&&p<1,coffeeFlow:p>=.4&&p<1,filled:Math.max(0,Math.min(1,(p-.4)/.6))};
}

/** A lower requested amount is a reset, not liquid flowing out of the cup. */
export function pourFrame(from,to,progress) {
  const p=Math.max(0,Math.min(1,progress));
  if(to<=from)return {water:to,pouring:false};
  return {water:from+(to-from)*p,pouring:p>0&&p<1};
}

/** Compare the user's goals, not the animation's current interpolated frame. */
export function pourTransition(current,previousTarget,nextTarget) {
  return nextTarget>previousTarget?{from:current,to:nextTarget,animate:true}:{from:nextTarget,to:nextTarget,animate:false};
}

/** Describe an accepted recipe adjustment without inventing a precise drink boundary. */
export function waterProcessMeaning(current,previous) {
  return {
    result:current===0?'espresso':'diluted',
    change:current>previous?'add':current<previous?'adjust':'unchanged',
    sequence:current===0?'已萃取的 Espresso（尚未加水）':'Espresso → 萃取後加水（Americano 製作方式示意）'
  };
}

/** A spoon marks foam; liquid milk is poured. Values are illustrative only. */
export function milkFrame(kind,amount,progress) {
  const p=Math.max(0,Math.min(1,progress));
  return {amount:amount*p,spoon:kind==='foam'&&p>0&&p<1,spoonOffset:kind==='foam'?1-Math.abs(2*p-1):0,pouring:kind==='milk'&&p>0&&p<1,foam:kind==='foam'&&p>=.6};
}

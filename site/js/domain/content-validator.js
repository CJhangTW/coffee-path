export function validateContent(content, drinks, sources) {
  if(!Array.isArray(content?.lessons)||!content.chapters||!Array.isArray(drinks?.items)||!Array.isArray(sources?.items)) return false;
  const ids=new Set(); const drinkIds=new Set(drinks.items.map(d=>d.id));const sourceIds=new Set(sources.items.map(s=>s.id));
  if (drinkIds.size!==drinks.items.length||sourceIds.size!==sources.items.length||sources.items.some(s=>!s.id||!s.title||!/^https:\/\//.test(s.url))) return false;
  const kinds=['drink','alias','preparation','technique','equipment','experimental'];
  for(const d of drinks.items) if(!d.id||!kinds.includes(d.kind)||!d.family||!d.name?.zhHant||!d.name?.en||!['strict','derived','adapted','excluded'].includes(d.ingredientPolicy)||!['reviewed','provisional','experimental'].includes(d.confidence)||!/^\d{4}-\d{2}-\d{2}$/.test(d.updatedAt)||!Array.isArray(d.sources)||d.sources.some(id=>!sourceIds.has(id))||(!d.sources.length&&d.confidence!=='provisional')||!Array.isArray(d.relatedDrinkIds)||d.relatedDrinkIds.some(id=>!drinkIds.has(id))) return false;
  for(const l of content.lessons) {
    if(!l.id||ids.has(l.id)||!content.chapters[l.chapterId]?.includes(l.id)||!l.challenge?.correctOptionIds?.length||!Array.isArray(l.rewardDrinkIds)||l.rewardDrinkIds.some(id=>!drinkIds.has(id))||!Array.isArray(l.sourceIds)||l.sourceIds.some(id=>!sourceIds.has(id))) return false;
    if(!Array.isArray(l.options)||l.options.length<2||l.options.some(option=>!option.id||!option.text)||new Set(l.options.map(option=>option.id)).size!==l.options.length||l.challenge.correctOptionIds.some(id=>!l.options.some(option=>option.id===id)))return false;
    if(l.challenge.type==='observe-and-choice'){
      if(!Array.isArray(l.observations)||!Array.isArray(l.challenge.requiredActionIds)||!l.challenge.requiredActionIds.length)return false;
      const actionIds=new Set(l.observations.map(item=>item.id));
      if(actionIds.size!==l.observations.length||new Set(l.challenge.requiredActionIds).size!==l.challenge.requiredActionIds.length||l.observations.some(item=>!item.id||!item.title||!item.button||!item.description||!['extract','pour'].includes(item.type)||(item.type==='pour'&&(!Number.isFinite(item.waterG)||item.waterG<0||item.waterG>250)))||l.challenge.requiredActionIds.some(id=>!actionIds.has(id)))return false;
    }
    ids.add(l.id);
  }
  return true;
}

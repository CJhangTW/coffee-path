export function validateContent(content, drinks, sources) {
  if(!Array.isArray(content?.lessons)||!content.chapters||!Array.isArray(drinks?.items)||!Array.isArray(sources?.items)) return false;
  const ids=new Set(); const drinkIds=new Set(drinks.items.map(d=>d.id));const sourceIds=new Set(sources.items.map(s=>s.id));
  if (drinkIds.size!==drinks.items.length||sourceIds.size!==sources.items.length||sources.items.some(s=>!s.id||!s.title||!/^https:\/\//.test(s.url))) return false;
  const kinds=['drink','alias','preparation','technique','equipment','experimental'];
  for(const d of drinks.items) if(!d.id||!kinds.includes(d.kind)||!d.family||!d.name?.zhHant||!d.name?.en||!['strict','derived','adapted','excluded'].includes(d.ingredientPolicy)||!['reviewed','provisional','experimental'].includes(d.confidence)||!/^\d{4}-\d{2}-\d{2}$/.test(d.updatedAt)||!Array.isArray(d.sources)||d.sources.some(id=>!sourceIds.has(id))||(!d.sources.length&&d.confidence!=='provisional')||!Array.isArray(d.relatedDrinkIds)||d.relatedDrinkIds.some(id=>!drinkIds.has(id))) return false;
  for(const l of content.lessons) {if(!l.id||ids.has(l.id)||!content.chapters[l.chapterId]?.includes(l.id)||!l.challenge?.correctOptionIds?.length||!Array.isArray(l.rewardDrinkIds)||l.rewardDrinkIds.some(id=>!drinkIds.has(id))||!Array.isArray(l.sourceIds)||l.sourceIds.some(id=>!sourceIds.has(id))) return false; ids.add(l.id);}
  return true;
}

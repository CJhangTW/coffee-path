import {SITE_CONFIG} from '../config/site-config.js';
export function emptyProgress() {return {schemaVersion:1,completedLessonIds:[],awardedAchievementIds:[],collectedDrinkIds:[],preferences:{expertBypass:false,unlockAllKnowledge:false,visualMode:'auto',reducedMotion:false},lastRoute:'#/'};}
function parse(raw) {
  if (!raw) return null;
  try {const p=JSON.parse(raw); if(!p || p.schemaVersion!==1 || !Array.isArray(p.completedLessonIds) || !p.completedLessonIds.every(x=>typeof x==='string') || ['awardedAchievementIds','collectedDrinkIds'].some(k=>p[k]!==undefined&&(!Array.isArray(p[k])||!p[k].every(x=>typeof x==='string'))) || (p.preferences!==undefined&&(!p.preferences||typeof p.preferences!=='object'||Array.isArray(p.preferences))) || (p.lastRoute!==undefined&&typeof p.lastRoute!=='string')) return null;
    const base=emptyProgress(); return {...base,...p,awardedAchievementIds:Array.isArray(p.awardedAchievementIds)?p.awardedAchievementIds:[],collectedDrinkIds:Array.isArray(p.collectedDrinkIds)?p.collectedDrinkIds:[],preferences:{...base.preferences,...p.preferences}};
  } catch {return null;}
}
export function createStorage(storage) {
  let writable=true;
  return {
    load() {try {const current=storage.getItem(SITE_CONFIG.storageKey); if(current!==null) {const valid=parse(current);if(!valid){writable=false;return {progress:emptyProgress(),available:false,invalid:true};}return {progress:valid,available:true};}
      const old=parse(storage.getItem('coffeelearn.progress.v1')); if(old) {try {storage.setItem(SITE_CONFIG.storageKey,JSON.stringify(old)); return {progress:old,available:true};} catch {return {progress:old,available:false};}} return {progress:emptyProgress(),available:true};
    } catch {return {progress:emptyProgress(),available:false};}},
    save(progress) {if(!writable)return false;try {storage.setItem(SITE_CONFIG.storageKey,JSON.stringify(progress)); return true;} catch {return false;}}
  };
}

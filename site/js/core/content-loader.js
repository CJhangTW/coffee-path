import {validateContent} from '../domain/content-validator.js';
export async function loadContent() {
  const [l,d,s]=await Promise.all(['./data/lessons.json','./data/drinks.json','./data/sources.json'].map(async url=>{const r=await fetch(url); if(!r.ok) throw Error('教材載入失敗'); return r.json();}));
  if(!validateContent(l,d,s)) throw Error('教材資料驗證失敗'); return {content:l,drinks:d.items,sources:s.items};
}

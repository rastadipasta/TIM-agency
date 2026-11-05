import {SERVICES} from './services.mjs';
export const serviceKeys=new Set(SERVICES.map(s=>s.slug));
export function parseServices(value){return [...new Set(String(value||'').split(',').filter(s=>serviceKeys.has(s)||s==='guidance'))];}
export function normalizeSelection(values,changed){const unique=[...new Set(values)].filter(s=>serviceKeys.has(s)||s==='guidance');return changed==='guidance'&&unique.includes('guidance')?['guidance']:unique.filter(s=>s!=='guidance'||unique.length===1);}
export function serviceDetailText(fields){return fields.filter(f=>String(f.value||'').trim()).map(f=>`${f.label}: ${String(f.value).trim()}`).join('\n');}
export function contactPayload(data,fields){const keys=['name','email','service','message','company','phone','website','deadline','budget','fax'];return {...Object.fromEntries(keys.map(k=>[k,String(data[k]||'').trim()])),serviceDetails:serviceDetailText(fields)};}

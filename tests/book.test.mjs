import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const dataSource=readFileSync(new URL('../book-data.js',import.meta.url),'utf8');
const source=readFileSync(new URL('../book.js',import.meta.url),'utf8');
function setup({paused=false,mobile=false,reduced=false,brokenImage=false}={}) {
 const listeners={},routes=[],tracks=[],els=new Map();
 const element=()=>({disabled:false,textContent:'',focus(){this.focused=true;},animate(){const a={cancelled:false,finished:Promise.resolve(),cancel(){this.cancelled=true;}};tracks.push(a);return a;}});
 const image={hidden:false,addEventListener(type,fn){this.onError=fn;},closest:()=>({classList:{add(c){image.fallback=c;}}})};
 const stage={innerHTML:'',querySelector:()=>title,querySelectorAll:q=>q==='img'?(brokenImage?[image]:[]):[element(),element()]},title=element();
 const root={dataset:{},classList:{toggle(){}},querySelector:q=>{if(q==='.book-spread')return stage;if(!els.has(q))els.set(q,element());return els.get(q);},addEventListener:(k,f)=>listeners[k]=f,closest:()=>({classList:{contains:()=>true}}),getBoundingClientRect:()=>({top:200})};
 const env={window:{TIMDSGN_ROUTE:{navigate:r=>routes.push(r),follow(){}}},document:{hidden:false,body:{classList:{contains:c=>c==='motion-static'&&paused,toggle(){}}},querySelector:q=>q==='#services-book'?root:q==='#workspace'?{addEventListener(){}}:null,addEventListener(){}},matchMedia:q=>({matches:q.includes('1024')?!mobile:reduced,addEventListener(){}}),MutationObserver:class{observe(){}},IntersectionObserver:class{observe(){}},scrollY:0,console};
 env.window.addEventListener=()=>{};env.window.scrollTo=()=>{};vm.createContext(env);vm.runInContext(dataSource,env);vm.runInContext(source,env);
 function click(selector){const target={closest:q=>q===selector?target:q==='[data-chapter]'&&root.dataset.chapter?root:null,dataset:{}};listeners.click({target,preventDefault(){}});}
 return {env,root,stage,title,tracks,routes,click,listeners,image};
}
test('nine unique services preserve order and bounded copy',()=>{
 const {env}=setup(),data=env.window.TIMDSGN_BOOK;
 assert.equal(data.length,9);assert.equal(new Set(data.map(s=>s.slug)).size,9);
 assert.deepEqual(Array.from(data,s=>s.name),['Branding','Brand Strategy','Naming','Web design','Animation','Motion graphics','Packaging','Graphic design','Advertising']);
 for(const s of data){assert.equal(s.deliverables.length,3);assert.ok((s.intro+' '+s.copy+' '+s.deliverables.join(' ')).split(/\s+/).length<=100);}
});
test('navigation controls route independently of current chapter metadata',()=>{
 const s=setup();s.env.window.TIMDSGN_BOOK_VIEW.showSlug('branding',{animate:false});
 s.click('[data-book-next]');assert.equal(s.routes.at(-1),'services/brand-strategy');
 s.click('[data-book-prev]');assert.equal(s.routes.at(-1),'services');
 s.click('[data-book-contents]');assert.equal(s.routes.at(-1),'services');
 assert.equal(s.root.dataset.bookChapter,'1');assert.equal(s.root.dataset.chapter,undefined);
});
test('rapid chapter changes cancel stale animation and focus latest heading',()=>{
 const s=setup();s.env.window.TIMDSGN_BOOK_VIEW.showSlug('branding');const first=[...s.tracks];
 s.env.window.TIMDSGN_BOOK_VIEW.showSlug('advertising');assert.ok(first.every(a=>a.cancelled));
 assert.equal(s.root.dataset.bookChapter,'9');assert.ok(s.title.focused);
 assert.ok(s.stage.innerHTML.includes('One clear idea.'));assert.ok(!s.stage.innerHTML.includes('A mark.'));
 assert.equal(s.root.querySelector('[data-book-next]').disabled,true);
});
test('paused motion creates no page turn; unknown chapter returns contents',()=>{
 const s=setup({paused:true,mobile:true});s.env.window.TIMDSGN_BOOK_VIEW.showSlug('animation');assert.equal(s.tracks.length,0);
 s.env.window.TIMDSGN_BOOK_VIEW.showSlug('missing');assert.equal(s.root.dataset.bookChapter,'0');assert.ok(s.stage.innerHTML.includes('Contents'));
});
test('reduced motion and hidden tabs create no chapter animation',()=>{
 const s=setup({reduced:true});s.env.window.TIMDSGN_BOOK_VIEW.showSlug('animation');assert.equal(s.tracks.length,0);
 const hidden=setup();hidden.env.document.hidden=true;hidden.env.window.TIMDSGN_BOOK_VIEW.showSlug('naming');assert.equal(hidden.tracks.length,0);
});
test('failed web project image preserves a labelled fallback',()=>{
 const s=setup({brokenImage:true});s.env.window.TIMDSGN_BOOK_VIEW.showSlug('web-design');s.image.onError();
 assert.equal(s.image.hidden,true);assert.equal(s.image.fallback,'image-failed');assert.ok(s.stage.innerHTML.includes('Calma Beauty ↗'));
});

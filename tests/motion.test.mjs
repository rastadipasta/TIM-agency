import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../motion.js', import.meta.url), 'utf8');

// Exercise the controller against clock, visibility and preference changes.
// No browser storage of form answers and no external network are involved.
function fixture({reduced=false, desktop=true, savedPause=false, missingImage=false}={}) {
  const animations=[], timers=new Map(), media=new Map(), mutations=[];
  let timerId=0, intersection;
  class Element {
    constructor() {
      this.listeners=new Map(); this.children=new Map(); this.dataset={}; this.attributes={};
      this.classes=new Set(); this.focused=false; this.hovered=false;
      this.classList={contains:c=>this.classes.has(c),add:c=>this.classes.add(c),toggle:(c,b)=>b?this.classes.add(c):this.classes.delete(c)};
    }
    addEventListener(type,cb) {this.listeners.set(type,[...(this.listeners.get(type)||[]),cb]);}
    emit(type) {(this.listeners.get(type)||[]).forEach(cb=>cb({}));}
    querySelector(selector) {if(!this.children.has(selector))this.children.set(selector,new Element());return this.children.get(selector);}
    querySelectorAll() {return [];}
    insertAdjacentHTML() {}
    setAttribute(key,value) {this.attributes[key]=value;}
    matches(selector) {return selector===':focus-within'?this.focused:this.hovered;}
    animate(frames,options) {
      const animation={frames,options,target:this,playState:'running',currentTime:0,
        finished:new Promise(()=>{}), pause(){this.playState='paused';},play(){this.playState='running';},cancel(){this.playState='idle';this.cancelled=true;}};
      animations.push(animation); return animation;
    }
  }
  const root=new Element(), button=new Element(), body=new Element(), doc=new Element(), win=new Element();
  const ids=['intro','studio','work','services','process','contact'];
  const tiles=ids.map((id,i)=>{
    const e=new Element();e.id=id;e.dataset.section=id;
    e.typeRuns=Array.from({length:i===4?1:2},()=>new Element());
    e.detailRuns=Array.from({length:2},()=>new Element());
    e.querySelectorAll=selector=>selector==='.panel-summary .type-run'?e.typeRuns:selector==='.detail-heading .type-run'?e.detailRuns:[];
    return e;
  });
  ids.forEach((id,i)=>root.children.set(`.panel-${id}`,tiles[i]));
  root.children.set('.panel.is-active',tiles[0]);
  const image=new Element(); image.complete=true;image.naturalWidth=missingImage?0:1600; image.parentElement=new Element();
  root.querySelectorAll=selector=>selector==='.panel'?tiles:selector==='.motion-card img'?[image]:[];
  doc.body=body;doc.hidden=false;doc.dialogOpen=false;
  const dialogs=[new Element(),new Element()];
  doc.querySelector=selector=>selector==='#workspace'?root:selector==='#motion-toggle'?button:selector==='dialog[open]'&&doc.dialogOpen?dialogs[0]:null;
  doc.querySelectorAll=()=>dialogs;
  const storage=new Map([['timdsgn.motionPaused',String(savedPause)]]);
  const context={document:doc,window:win,Element,
    sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
    matchMedia:query=>{
      if(!media.has(query)) {const e=new Element();e.matches=query.includes('reduced')?reduced:query.includes('1024')?desktop:true;media.set(query,e);}
      return media.get(query);
    },
    IntersectionObserver:class {constructor(cb){intersection=cb;} observe(){}},
    MutationObserver:class {constructor(cb){mutations.push(cb);} observe(){}},
    setTimeout:cb=>{timers.set(++timerId,cb);return timerId;},clearTimeout:id=>timers.delete(id),queueMicrotask:cb=>cb()
  };
  vm.runInNewContext(source,context);
  const tick=()=>{const callbacks=[...timers.values()];timers.clear();callbacks.forEach(cb=>cb());};
  const see=(entries=tiles.map(target=>({target,isIntersecting:true})))=>intersection(entries);
  const loops=()=>animations.filter(a=>a.options.iterations===Infinity&&!a.cancelled);
  return {animations,root,button,body,doc,win,tiles,image,storage,media,loops,tick,see,
    dialog(open){doc.dialogOpen=open;mutations.forEach(cb=>cb());},
    change(query,matches){const e=media.get(query);e.matches=matches;e.emit('change');}
  };
}

test('visible panels animate; manual pause freezes all and persists only a preference',()=>{
  const f=fixture();f.see();assert.equal(f.loops().length,9);
  assert.ok(f.loops().every(a=>a.playState==='running'));
  f.button.emit('click');assert.ok(f.loops().every(a=>a.playState==='paused'));
  assert.equal(f.storage.get('timdsgn.motionPaused'),'true');
  assert.equal(f.button.querySelector('.motion-toggle-label').textContent,'Play motion');
  f.button.emit('click');assert.ok(f.loops().every(a=>a.playState==='paused'));
  f.tick();assert.ok(f.loops().every(a=>a.playState==='running'));
});
test('focus holds one tile; release waits; sections and dialogs hold all tiles',()=>{
  const f=fixture();f.see();const tile=f.tiles[2];tile.focused=true;tile.emit('focusin');
  assert.equal(tile.dataset.motion,'paused');assert.equal(f.tiles[0].dataset.motion,'running');
  tile.focused=false;tile.emit('focusout');assert.equal(tile.dataset.motion,'paused');f.tick();assert.equal(tile.dataset.motion,'running');
  f.root.classList.add('has-active');f.root.emit('mosaicstatechange');assert.ok(f.loops().every(a=>a.playState==='paused'));
  f.root.classes.delete('has-active');f.root.emit('mosaicstatechange');f.tick();assert.ok(f.loops().every(a=>a.playState==='running'));
  f.dialog(true);assert.ok(f.loops().every(a=>a.playState==='paused'));f.dialog(false);f.tick();assert.ok(f.loops().every(a=>a.playState==='running'));
});
test('offscreen and hidden document pause; returning resumes after idle delay',()=>{
  const f=fixture();f.see();f.see([{target:f.tiles[0],isIntersecting:false}]);assert.equal(f.tiles[0].dataset.motion,'paused');
  f.doc.hidden=true;f.doc.emit('visibilitychange');assert.ok(f.loops().every(a=>a.playState==='paused'));
  f.doc.hidden=false;f.doc.emit('visibilitychange');f.tick();assert.equal(f.tiles[1].dataset.motion,'running');assert.equal(f.tiles[0].dataset.motion,'paused');
});
test('reduced motion creates no loops and responds to preference changes',()=>{
  const f=fixture({reduced:true});f.see();assert.equal(f.animations.length,0);assert.equal(f.button.disabled,true);
  f.change('(prefers-reduced-motion: reduce)',false);assert.equal(f.loops().length,9);
  const old=f.loops();f.change('(prefers-reduced-motion: reduce)',true);assert.ok(old.every(a=>a.cancelled));assert.equal(f.loops().length,0);
});
test('breakpoint rebuild cancels obsolete tracks and mobile cards only crossfade',()=>{
  const f=fixture();f.see();const old=f.loops();f.change('(min-width:1024px)',false);f.tick();assert.ok(old.every(a=>a.cancelled));
  const deck=f.loops().filter(a=>a.frames[0].zIndex);assert.equal(deck.length,2);
  assert.ok(deck.every(a=>a.frames.every(frame=>frame.transform==='none')));
  for(let i=0;i<8;i++)f.change('(min-width:1024px)',i%2===0);
  assert.equal(f.loops().length,9);
});
test('saved pause skips entrance; missing images retain a project label',()=>{
  const f=fixture({savedPause:true,missingImage:true});f.see();assert.ok(f.loops().every(a=>a.playState==='paused'));
  assert.equal(f.animations.filter(a=>a.options.iterations!==Infinity).length,0);
  assert.equal(f.image.parentElement.classList.contains('image-unavailable'),true);
});
test('first interaction cancels entrance and overview return does not replay it',()=>{
  const f=fixture();const entry=f.animations.filter(a=>a.options.iterations!==Infinity);assert.equal(entry.length,6);
  f.tiles[0].emit('focusin');assert.ok(entry.every(a=>a.cancelled));f.root.emit('mosaicstatechange');
  assert.equal(f.animations.filter(a=>a.options.iterations!==Infinity).length,6);
});

test('overview and expanded titles remain static during idle, focus and section changes',()=>{
 const f=fixture();f.see();f.tiles[0].focused=true;f.tiles[0].emit('focusin');f.root.classList.add('has-active');f.root.emit('mosaicstatechange');
 assert.equal(f.animations.filter(a=>a.frames.some(frame=>frame.fontVariationSettings)).length,0);
 assert.equal(f.animations.filter(a=>[520,680].includes(a.options.duration)).length,0);
 assert.ok(f.loops().every(a=>!f.tiles.flatMap(t=>t.typeRuns).includes(a.target)));
});

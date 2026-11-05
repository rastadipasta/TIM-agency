'use strict';

// A single controller owns loop lifetimes; panel layout stays in app.js.
(() => {
  const root = document.querySelector('#workspace');
  const button = document.querySelector('#motion-toggle');
  if (!root || !button || !Element.prototype.animate) return;
  const tiles = [...root.querySelectorAll('.panel')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width:1024px)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const visible = new Set();
  const held = new Set();
  const loops = new Map();
  const typeLoops = new Set();
  const hoverGestures = new Map();
  const titleReveals = new Map();
  const resumes = new Map();
  let paused = false;
  try { paused = sessionStorage.getItem('timdsgn.motionPaused') === 'true'; } catch {}
  let entrances = [];
  let expanded = root.classList.contains('has-active');
  let activeTitle = null;

  const studioLabel = root.querySelector('.panel-studio .panel-label');
  studioLabel.insertAdjacentHTML('beforeend', '<i class="studio-indicator" aria-hidden="true"></i>');
  const serviceCaption = root.querySelector('.panel-services .panel-caption');
  serviceCaption.classList.add('service-ticker');
  serviceCaption.innerHTML = '<span class="service-ticker-track"><span class="service-ticker-copy">Web / Graphic / Digital</span><span class="service-ticker-copy" aria-hidden="true">Web / Graphic / Digital</span></span>';
  root.querySelector('.panel-process .panel-summary').insertAdjacentHTML('beforeend', '<div class="process-trace" aria-hidden="true"><span></span><span></span><span></span></div>');
  root.querySelector('.panel-contact .panel-summary > .arrow').innerHTML = '<span class="contact-motion-arrow">↗</span>';

  root.querySelectorAll('.motion-card img').forEach(img => {
    const fallback = () => img.parentElement.classList.add('image-unavailable');
    img.addEventListener('error', fallback);
    if (img.complete && !img.naturalWidth) fallback();
  });

  function add(panel, selector, frames, duration, options = {}) {
    const target = panel.querySelector(selector);
    if (!target) return;
    return track(panel, target, frames, duration, options);
  }
  function track(panel, target, frames, duration, options = {}) {
    const animation = target.animate(frames, {duration, iterations:Infinity, ...options});
    animation.pause(); animation.currentTime = 0;
    loops.get(panel).push(animation);
    return animation;
  }
  function cancelTransient(collection, panel) {
    for (const [tile, list] of collection) {
      if (panel && panel !== tile) continue;
      list.forEach(a => a.cancel()); collection.delete(tile);
    }
  }

  function build() {
    loops.forEach(list => list.forEach(a => a.cancel()));
    loops.clear(); typeLoops.clear(); cancelTransient(hoverGestures); cancelTransient(titleReveals);
    tiles.forEach(panel => loops.set(panel, []));
    if (reduce.matches) { sync(); return; }
    const tile = id => root.querySelector(`.panel-${id}`);
    add(tile('intro'), '.intro-picture', [
      {transform:'scale(1.02) translate(0,0)',offset:0}, {transform:'scale(1.1) translate(-.6%,.4%)',offset:.5}, {transform:'scale(1.02) translate(0,0)',offset:1}
    ], 8000, {easing:'ease-in-out'});
    const front = desktop.matches ? 'translate(0,0) scale(1) rotate(-.5deg)' : 'none';
    const back = desktop.matches ? 'translate(16px,8px) scale(.82) rotate(3deg)' : 'none';
    for (const [name, reverse] of [['calma', false], ['anna', true]]) {
      const a = {transform:reverse ? back : front, opacity:desktop.matches ? 1 : reverse ? 0 : 1, zIndex:reverse ? 1 : 2};
      const b = {transform:reverse ? front : back, opacity:desktop.matches ? 1 : reverse ? 1 : 0, zIndex:reverse ? 2 : 1};
      add(tile('work'), `.motion-card-${name}`, [
        {...a,offset:0}, {...a,offset:.39}, {...b,offset:.5}, {...b,offset:.89}, {...a,offset:1}
      ], 6400, {easing:'linear'});
    }
    add(tile('studio'), '.studio-indicator', [{opacity:1,transform:'scale(1)'},{opacity:.35,transform:'scale(1.6)'},{opacity:1,transform:'scale(1)'}], 3000, {easing:'ease-in-out'});
    add(tile('services'), '.service-ticker-track', [{transform:'translateX(0)'},{transform:'translateX(-50%)'}], 10000, {easing:'linear'});
    for (let i=1; i<=3; i++) {
      add(tile('process'), `.process-trace span:nth-child(${i})`, [
        {opacity:.18,transform:'scaleX(.15)'}, {opacity:.8,transform:'scaleX(1)',offset:.35},
        {opacity:.8,transform:'scaleX(1)',offset:.68}, {opacity:.18,transform:'scaleX(.15)'}
      ], 3600, {delay:(i-1)*350,easing:'ease-in-out'});
    }
    add(tile('contact'), '.contact-motion-arrow', [
      {transform:'translate(0,0)',offset:0},{transform:'translate(0,0)',offset:.55},
      {transform:'translate(6px,-6px)',offset:.75},{transform:'translate(0,0)',offset:1}
    ], 3200, {easing:'ease-in-out'});

    sync();
  }

  function blocked() {
    return paused || reduce.matches || document.hidden || root.classList.contains('has-active') || Boolean(document.querySelector('dialog[open]'));
  }
  function sync() {
    document.body.classList.toggle('motion-static', paused || reduce.matches);
    document.body.classList.toggle('motion-reduced', reduce.matches);
    loops.forEach((list,panel) => {
      const stopped = blocked() || !visible.has(panel) || held.has(panel) || resumes.has(panel);
      list.forEach(a => {
        if (held.has(panel) && typeLoops.has(a)) a.currentTime=0;
        if (stopped) a.pause(); else if (a.playState !== 'running') a.play();
      });
      panel.dataset.motion = stopped ? 'paused' : 'running';
    });
    if (blocked()) cancelTransient(hoverGestures);
    if (paused || reduce.matches || document.hidden || document.querySelector('dialog[open]')) cancelTransient(titleReveals);
    button.disabled = reduce.matches;
    button.setAttribute('aria-pressed', String(paused || reduce.matches));
    button.querySelector('.motion-toggle-label').textContent = reduce.matches ? 'Motion reduced' : paused ? 'Play motion' : 'Pause motion';
    button.querySelector('.motion-toggle-icon').textContent = paused || reduce.matches ? '▷' : 'Ⅱ';
  }
  function finishEntrance() { entrances.forEach(a => a.cancel()); entrances = []; }
  function hold(panel) {
    clearTimeout(resumes.get(panel)); resumes.delete(panel);
    held.add(panel); finishEntrance(); sync();
  }
  function release(panel) {
    if (panel.matches(':focus-within') || (fine.matches && panel.matches(':hover'))) return;
    held.delete(panel); cancelTransient(hoverGestures,panel); resumeLater(panel);
  }
  function resumeLater(panel) {
    clearTimeout(resumes.get(panel));
    resumes.set(panel, setTimeout(() => {resumes.delete(panel); sync();}, 600));
    sync();
  }
  function resumeAll() { tiles.forEach(resumeLater); }

  tiles.forEach(panel => {
    panel.addEventListener('pointerenter', () => {if (fine.matches) hold(panel);});
    panel.addEventListener('pointerleave', () => release(panel));
    panel.addEventListener('focusin', () => hold(panel));
    panel.addEventListener('focusout', () => queueMicrotask(() => release(panel)));
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);}); sync();
  }, {threshold:0});
  tiles.forEach(panel => observer.observe(panel));
  root.addEventListener('mosaicstatechange', () => {
    finishEntrance();
    const nextExpanded = root.classList.contains('has-active');
    if (expanded && !nextExpanded) resumeAll(); else sync();
    const active = nextExpanded ? root.querySelector('.panel.is-active') : null;
    if (active !== activeTitle) {
      cancelTransient(titleReveals); activeTitle=active;
    }
    expanded = nextExpanded;
  });
  const dialogs = new MutationObserver(() => { finishEntrance(); if (document.querySelector('dialog[open]')) sync(); else resumeAll(); });
  document.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog,{attributes:true,attributeFilter:['open']}));
  document.addEventListener('visibilitychange', () => {if (document.hidden) sync(); else resumeAll();});
  button.addEventListener('click', () => {
    paused=!paused;
    try { sessionStorage.setItem('timdsgn.motionPaused', String(paused)); } catch {}
    finishEntrance(); if (paused) sync(); else resumeAll();
  });
  reduce.addEventListener('change', () => {finishEntrance();build();});
  desktop.addEventListener('change', () => {
    finishEntrance(); held.clear();
    tiles.forEach(panel => {if (panel.matches(':focus-within') || (fine.matches && panel.matches(':hover'))) held.add(panel);});
    build(); resumeAll();
  });
  window.addEventListener('resize', finishEntrance, {passive:true});
  build();
  if (!paused && !reduce.matches && !root.classList.contains('has-active')) {
    entrances = tiles.map((panel,i) => panel.animate([
      {opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}
    ], {duration:600,delay:i*70,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
    Promise.all(entrances.map(a => a.finished.catch(() => {}))).then(() => {entrances=[];});
  }
})();

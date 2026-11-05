'use strict';

const sections = [
  { id: 'intro', name: 'Intro', label: 'Intro', short: 'MAKE YOUR MARK.', title: 'MAKE YOUR<br>MARK.' },
  { id: 'studio', name: 'Studio', label: 'Studio', short: 'LESS NOISE.', title: 'Less noise.<br>More meaning.' },
  { id: 'work', name: 'Selected work', label: 'Selected work', short: 'BUILT TO STAND OUT.', title: 'BUILT TO<br>STAND OUT.' },
  { id: 'services', name: 'Services', label: 'Services', short: 'EVERY TOUCHPOINT.', title: 'EVERY<br>TOUCHPOINT.' },
  { id: 'process', name: 'Process', label: 'Process', short: 'GOOD WORK.', title: 'GOOD WORK.' },
  { id: 'contact', name: 'Contact', label: 'Contact', short: 'LET’S TALK.', title: 'LET’S MAKE<br>IT MATTER.' },
];
const projects = [
  { name: 'Calma Beauty', image: 'calma.png', category: 'Web design / Beauty & wellness', alt: 'Calma Beauty website: warm ivory typography beside a woman receiving a beauty treatment.' },
  { name: 'Anna Édition', image: 'anna.png', category: 'Web design / Interiors', alt: 'Anna Édition website: burgundy editorial design with interior photography.' },
];
const workspace = document.querySelector('#workspace');
const mobileNav = document.querySelector('.mobile-sections');
const menuDialog = document.querySelector('#menu-dialog');
const projectDialog = document.querySelector('#project-dialog');
const menuToggle = document.querySelector('#menu-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktopQuery = matchMedia('(min-width: 1024px)');
const hoverQuery = matchMedia('(hover: hover) and (pointer: fine)');
const state = { active: null, hover: null, overviewScroll: 0, lastTrigger: null, project: 0 };
const savedScroll = new Map();
let mode = desktopQuery.matches;
let animationFrame = 0;
let focusFrame = 0;
let closingTimer = 0;
const number = index => String(index + 1).padStart(2, '0');
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const kineticLines = title => title.split('<br>').map(line => `<span class="type-line"><span class="type-run">${line}</span></span>`).join(' ');

function summary(section) {
  const common = `<div class="panel-label eyebrow">${number(sections.indexOf(section))} / ${section.label}</div>${arrow}`;
  if (section.id === 'intro') return `${common}<div class="intro-picture"></div><div class="intro-heading display">${kineticLines(section.title)}</div><span class="panel-caption eyebrow">Good ideas deserve great design.</span>`;
  if (section.id === 'work') return `${common}<h2 class="tile-heading display">${kineticLines(section.title)}</h2><div class="project-stack motion-deck"><div class="motion-card motion-card-calma"><img src="assets/calma.png" alt="" width="1600" height="770"><span>Calma Beauty</span></div><div class="motion-card motion-card-anna"><img src="assets/anna.png" alt="" width="1600" height="768"><span>Anna Édition</span></div></div><span class="panel-caption eyebrow">Calma Beauty / Anna Édition</span>`;
  if (section.id === 'studio') return `${common}<h2 class="tile-heading display">${kineticLines(section.title)}</h2><p class="studio-description"><span class="studio-description-full">We connect creativity and code to make brands feel unmistakably themselves.</span><span class="studio-description-short eyebrow">Creativity + code.</span></p>`;
  if (section.id === 'services') return `${common}<h2 class="tile-heading display">${kineticLines(section.title)}</h2><span class="panel-caption eyebrow">Web / Graphic / Digital</span>`;
  if (section.id === 'contact') return `${common}<h2 class="tile-heading display">${kineticLines(section.title)}</h2><span class="panel-caption eyebrow">Your next chapter starts here.</span>`;
  return `${common}<h2 class="tile-heading display">${kineticLines(section.title)}</h2>`;
}

function detail(section) {
  const headings = { intro: 'Make your mark.', studio: 'Less noise.<br>More meaning.', work: 'BUILT TO STAND OUT.', services: 'ONE STUDIO.<br>EVERY TOUCHPOINT.', process: 'GOOD WORK<br>IS A PROCESS.', contact: 'LET’S MAKE<br>IT MATTER.' };
  const top = `<div class="detail-top"><span class="eyebrow">${number(sections.indexOf(section))} / ${section.label}</span><button class="close-section text-button" data-close-section aria-label="Close ${section.name} and return to overview"><span class="close-label">Close</span><span class="close-icon" aria-hidden="true"></span></button></div>`;
  if (section.id === 'intro') return `${top}<div class="intro-detail"><span class="eyebrow">Independent digital studio</span><h2 class="detail-heading display" tabindex="-1">${kineticLines('MAKE YOUR<br>MARK.')}</h2><div class="intro-detail-bottom"><p>Creativity. Code.<br>A mark that matters.</p><button class="cta" data-open="contact">Start a project ${arrow}</button><span class="eyebrow">Zagreb, Croatia / Working everywhere</span></div></div>`;
  let body = '';
  if (section.id === 'studio') body = `<div class="studio-copy"><p class="lead">We connect creativity and code<br class="desktop-br"> to make brands feel unmistakably<br class="desktop-br"> themselves.</p><p>From the first idea to the final interaction, we create identities, websites and digital products with purpose, clarity and care.</p></div><span class="detail-footnote eyebrow">Independent by design.</span>`;
  if (section.id === 'work') body = `<p class="work-intro">Selected websites with a distinct point of view.</p><div class="projects-grid">${projects.map((p, i) => `<button class="project-card" data-project="${i}" aria-label="View ${p.name} project"><span class="project-art project-art-${i}"><img src="assets/${p.image}" alt="${p.alt}" width="1600" height="${i ? 768 : 770}"></span><span class="project-name display">${p.name}${arrow}</span><span class="eyebrow">${p.category}</span></button>`).join('')}</div><span class="detail-footnote eyebrow">Selected work / 2026</span>`;
  if (section.id === 'services') return `${top}<div class="services-book" id="services-book" aria-label="Services book"><div class="book-spread"></div><nav class="book-controls" aria-label="Book navigation"><button class="eyebrow" data-book-prev aria-label="Previous chapter">← Previous</button><button class="eyebrow" data-book-contents>Contents</button><span class="book-position eyebrow">01 / 10</span><button class="eyebrow" data-book-next aria-label="Next chapter">Next →</button></nav><p class="book-live sr-only" role="status" aria-live="polite"></p></div>`;
  if (section.id === 'process') {
    const steps = [ ['Find the focus', 'We listen, ask questions and define what matters.'], ['Shape the idea', 'We explore a clear creative direction and refine it together.'], ['Make it real', 'We build, test and launch with attention to every detail.'] ];
    body = `<div class="process-grid">${steps.map((s, i) => `<article class="process-step"><span class="eyebrow">${number(i)}</span><h3 class="display">${s[0]}</h3><p>${s[1]}</p>${arrow}</article>`).join('')}</div><span class="detail-footnote eyebrow">Focus → Creative direction → Build & launch</span>`;
  }
  if (section.id === 'contact') body = `<div class="contact-copy"><p class="display">Your next chapter starts<br>with a conversation.</p><span class="eyebrow">Zagreb, Croatia / Working everywhere</span></div>`;
  return `${top}<div class="detail-body"><h2 class="detail-heading display" tabindex="-1">${kineticLines(headings[section.id])}</h2>${body}</div>`;
}

sections.forEach(section => {
  const panel = document.createElement('section');
  panel.className = `panel panel-${section.id}`;
  panel.id = `panel-${section.id}`;
  panel.dataset.section = section.id;
  panel.innerHTML = `<div class="panel-summary" aria-hidden="true">${summary(section)}</div><div class="compact-summary" aria-hidden="true"><span class="eyebrow">${number(sections.indexOf(section))} / ${section.label}</span>${arrow}<p class="display">${section.short}</p><span class="eyebrow">Open section</span></div><button class="panel-trigger" aria-expanded="false" aria-controls="detail-${section.id}" aria-label="Open ${section.name}" data-open="${section.id}"></button><div class="panel-detail" id="detail-${section.id}" hidden>${detail(section)}</div>`;
  workspace.append(panel);
});

document.querySelector('.menu-links').innerHTML = sections.map((s, i) => `<button class="menu-link" data-open="${s.id}"><span class="eyebrow">${number(i)}</span><span class="display">${s.name}</span>${arrow}</button>`).join('');
document.querySelector('.menu-links').insertAdjacentHTML('beforeend', '<a class="menu-link" href="brief.html"><span class="eyebrow">07</span><span class="display">Project brief</span><span class="arrow" aria-hidden="true">↗</span></a>');
mobileNav.innerHTML = sections.map(s => `<button data-open="${s.id}" class="eyebrow">${s.name}</button>`).join('');
const panels = [...workspace.querySelectorAll('.panel')];

function layout() {
  animationFrame = 0;
  if (!desktopQuery.matches) {
    panels.forEach(p => ['left','top','width','height'].forEach(prop => p.style.removeProperty(prop)));
    return;
  }
  const w = workspace.clientWidth, h = workspace.clientHeight, gap = 12;
  if (state.active) {
    const main = (w - gap) * .8, rail = w - main - gap;
    const compactHeight = (h - gap * 4) / 5;
    let row = 0;
    panels.forEach(p => {
      const rect = p.dataset.section === state.active ? [0, 0, main, h] : [main + gap, row++ * (compactHeight + gap), rail, compactHeight];
      setRect(p, rect);
    });
    return;
  }
  let sx = .5, ly = 425 / 856, ry = 570 / 856, lx = .25, sy = 715 / 856;
  switch (state.hover) {
    case 'intro': sx += 80 / 1392; ly += 49 / 856; break;
    case 'studio': lx += 68 / 1392; ly -= 49 / 856; break;
    case 'work': sx -= 80 / 1392; ry += 44 / 856; break;
    case 'services': lx -= 52 / 1392; ly -= 34 / 856; sy += 36 / 856; break;
    case 'process': lx -= 52 / 1392; sy -= 58 / 856; break;
    case 'contact': sx -= 40 / 1392; ry -= 64 / 856; break;
  }
  sx *= w; lx *= w; ly *= h; ry *= h; sy *= h;
  // Keep the smallest panel readable while shared boundaries animate.
  sy = Math.min(sy, h - 112);
  const rects = [ [0,0,sx-6,ly-6], [0,ly+6,lx-6,h-ly-6], [sx+6,0,w-sx-6,ry-6], [lx+6,ly+6,sx-lx-12,sy-ly-12], [lx+6,sy,sx-lx-12,h-sy], [sx+6,ry+6,w-sx-6,h-ry-6] ];
  panels.forEach((p, i) => setRect(p, rects[i]));
}
function setRect(panel, [x,y,w,h]) {
  panel.style.left = `${x}px`; panel.style.top = `${y}px`; panel.style.width = `${w}px`; panel.style.height = `${h}px`;
}
function scheduleLayout() { if (!animationFrame) animationFrame = requestAnimationFrame(layout); }
function reveal(element) {
  if (reducedMotion.matches || !element) return;
  element.getAnimations().forEach(animation => animation.cancel());
  element.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
}

function currentScroller() {
  return desktopQuery.matches && state.active ? document.querySelector(`#detail-${state.active}`) : document.scrollingElement;
}
function openSection(id, trigger) {
  if (id === 'contact') { location.href = 'contact.html'; return; }
  if (!sections.some(s => s.id === id)) return;
  clearTimeout(closingTimer); workspace.classList.remove('is-closing');
  if (state.active === id) { if (menuDialog.open) menuDialog.close(); return; }
  if (!state.active) { state.overviewScroll = window.scrollY; state.lastTrigger = trigger?.closest('.panel')?.querySelector('.panel-trigger') || document.querySelector(`[data-open="${id}"].panel-trigger`); }
  else savedScroll.set(state.active, currentScroller().scrollTop);
  if (menuDialog.open) menuDialog.close();
  state.active = id; state.hover = null;
  render();
  const scroller = currentScroller(); scroller.scrollTop = savedScroll.get(id) || 0;
  cancelAnimationFrame(focusFrame);
  focusFrame = requestAnimationFrame(() => {
    const heading = document.querySelector(`#detail-${id} .detail-heading, #detail-${id} .book-title`);
    heading?.focus({ preventScroll: true });
    reveal(document.querySelector(`#detail-${id} .detail-body`) || document.querySelector(`#detail-${id} .intro-detail`));
  });
  announce(`${sections.find(s => s.id === id).name} opened`);
}
function closeSection() {
  if (!state.active) return;
  savedScroll.set(state.active, currentScroller().scrollTop);
  state.active = null; state.hover = null;
  clearTimeout(closingTimer); workspace.classList.add('is-closing');
  closingTimer = setTimeout(() => workspace.classList.remove('is-closing'), 600);
  cancelAnimationFrame(focusFrame); render();
  window.scrollTo({ top: state.overviewScroll, behavior: 'instant' });
  state.lastTrigger?.focus({ preventScroll: true });
  announce('Overview');
}
function render() {
  workspace.classList.toggle('has-active', Boolean(state.active));
  workspace.classList.toggle('is-transitioning', Boolean(state.active));
  document.body.classList.toggle('section-open', Boolean(state.active));
  mobileNav.hidden = !state.active;
  document.querySelector('#current-location').textContent = state.active ? sections.find(s => s.id === state.active).name : 'Overview';
  panels.forEach(p => {
    const isActive = p.dataset.section === state.active;
    p.classList.toggle('is-active', isActive);
    p.classList.toggle('is-compact', Boolean(state.active) && !isActive);
    p.classList.toggle('is-hovered', !state.active && p.dataset.section === state.hover);
    p.querySelector('.panel-detail').hidden = !isActive;
    const button = p.querySelector('.panel-trigger');button.hidden = isActive;button.setAttribute('aria-expanded', String(isActive));
  });
  for (const button of [...mobileNav.children, ...document.querySelectorAll('.menu-links [data-open]')]) {
    if (button.dataset.open === state.active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  }
  layout();
  if (state.active && !desktopQuery.matches) {
    const tab = mobileNav.querySelector('[aria-current]');
    if (tab) mobileNav.scrollTo({left:tab.offsetLeft-(mobileNav.clientWidth-tab.offsetWidth)/2,behavior:reducedMotion.matches?'instant':'smooth'});
  }
  workspace.dispatchEvent(new Event('mosaicstatechange'));
}
function announce(text) { document.querySelector('#announcer').textContent = text; }

panels.forEach(panel => {
  panel.addEventListener('pointerenter', () => {
    if (!state.active && desktopQuery.matches && hoverQuery.matches) { state.hover = panel.dataset.section; render(); }
  });
  panel.querySelector('.panel-trigger').addEventListener('focus', event => {
    if (!state.active && desktopQuery.matches && event.target.matches(':focus-visible')) { state.hover = panel.dataset.section; render(); }
  });
});
workspace.addEventListener('pointerleave', () => { if (!state.active) { state.hover = null; render(); } });
workspace.addEventListener('focusout', event => {
  if (!workspace.contains(event.relatedTarget) && !state.active) { state.hover = null; render(); }
});
document.addEventListener('click', event => {
  const open = event.target.closest('[data-open]');
  if (open) { navigate(open.dataset.open, open); return; }
  if (event.target.closest('[data-close-section]')) navigate('');
  const project = event.target.closest('[data-project]');
  if (project) openProject(Number(project.dataset.project));
});
document.querySelector('.wordmark').addEventListener('click', event => { event.preventDefault(); navigate(''); if (!state.active) window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' }); });
menuToggle.addEventListener('click', () => { menuDialog.showModal(); menuToggle.setAttribute('aria-expanded', 'true'); document.body.classList.add('dialog-open'); reveal(menuDialog.querySelector('.menu-links')); });
menuDialog.querySelector('[data-close-menu]').addEventListener('click', () => menuDialog.close());
menuDialog.addEventListener('close', () => { menuToggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('dialog-open'); });
function closeOnBackdrop(dialog, event) {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
}
menuDialog.addEventListener('click', e => closeOnBackdrop(menuDialog, e));
projectDialog.addEventListener('click', e => closeOnBackdrop(projectDialog, e));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menuDialog.open && !projectDialog.open && state.active) { event.preventDefault(); navigate(''); }
});
function updateProject() {
  const project = projects[state.project];
  document.querySelector('#project-dialog-title').textContent = project.name;
  document.querySelector('#project-dialog-category').textContent = project.category;
  const img = document.querySelector('#project-dialog-image');img.src = `assets/${project.image}`;img.alt = project.alt;
  document.querySelector('#project-counter').textContent = `${number(state.project)} / ${number(projects.length - 1)}`;
}
function openProject(index) { state.project = index; updateProject(); projectDialog.showModal(); document.body.classList.add('dialog-open'); }
projectDialog.querySelector('[data-close-project]').addEventListener('click', () => projectDialog.close());
projectDialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
document.querySelector('#next-project').addEventListener('click', () => { state.project = (state.project + 1) % projects.length; updateProject(); reveal(document.querySelector('.project-image-wrap')); });

new ResizeObserver(scheduleLayout).observe(workspace);
desktopQuery.addEventListener('change', () => {
  const wasDesktop = mode; mode = desktopQuery.matches;
  if (state.active) {
    const detail = document.querySelector(`#detail-${state.active}`);
    if (wasDesktop) { const scroll = detail.scrollTop; render(); window.scrollTo({ top: scroll, behavior: 'instant' }); }
    else { const scroll = window.scrollY; render(); detail.scrollTop = scroll; window.scrollTo({ top: 0, behavior: 'instant' }); }
  } else { state.hover = null; render(); }
});
document.querySelector('#year').textContent = new Date().getFullYear();
render();

function parseSectionHash(hash) {
  let route;try {route=decodeURIComponent(hash.replace(/^#/,''));} catch {route='';}
  const [id,slug]=route.split('/');
  return {id:sections.some(s=>s.id===id)?id:null,slug:id==='services'?slug:undefined};
}
let routeTrigger;
function followSectionHash(){
  const route=parseSectionHash(location.hash);
  if(route.id==='contact'){location.replace('contact.html');return;}
  if(!route.id){closeSection();return;}
  const changed=state.active!==route.id;
  openSection(route.id,routeTrigger);routeTrigger=undefined;
  if(route.id==='services')window.TIMDSGN_BOOK_VIEW?.showSlug(route.slug,{animate:!changed,focus:true});
}
function navigate(route,trigger){
  if(route==='contact'){location.href='contact.html';return;}
  routeTrigger=trigger;
  const hash=route?'#'+route:'';
  if(location.hash!==hash)history.pushState(null,'',location.pathname+location.search+hash);
  followSectionHash();
}
window.TIMDSGN_ROUTE={navigate,follow:followSectionHash};
window.addEventListener('hashchange',followSectionHash);
window.addEventListener('popstate',followSectionHash);
followSectionHash();

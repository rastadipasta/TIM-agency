(() => {
  const data = window.TIMDSGN_BOOK;
  const root = document.querySelector('#services-book');
  if (!root || !data) return;
  const stage = root.querySelector('.book-spread');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1024px)');
  let index = 0, animations = [], token = 0;
  const num = n => String(n).padStart(2,'0');
  const esc = s => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stamp = '<span class="art-stamp eyebrow">TIMDSGN / Design study</span>';
  function artwork(s) {
    switch(s.art) {
      case 'branding': return `<div class="study-brand">${stamp}<div class="brand-symbol" aria-hidden="true"><i></i><i></i><i></i><i></i></div><strong class="display brand-type">A distinct<br>point of view.</strong><div class="brand-swatches"><i></i><i></i><i></i><span class="eyebrow">Aa / 01</span></div></div>`;
      case 'strategy': return `<div class="study-strategy">${stamp}<div class="strategy-orbit"><span class="eyebrow orbit-label label-a">Purpose</span><span class="eyebrow orbit-label label-b">People</span><span class="eyebrow orbit-label label-c">Position</span><span class="display orbit-core">WHY<br>YOU.</span></div><span class="eyebrow art-note">Clarity at the centre.</span></div>`;
      case 'naming': return `<div class="study-naming">${stamp}<div class="naming-words display"><span>Say it.</span><span>Mean it.</span><span>Own it<span class="lime-dot">.</span></span></div><span class="eyebrow art-note">Sound / Meaning / Character</span></div>`;
      case 'web': return `<div class="study-web"><span class="art-stamp eyebrow">TIMDSGN / Selected web work</span><div class="book-web-images"><figure><img src="assets/calma.png" alt="Calma Beauty website design" width="1600" height="770"><figcaption class="eyebrow">Calma Beauty ↗</figcaption></figure><figure><img src="assets/anna.png" alt="Anna Édition website design" width="1600" height="768"><figcaption class="eyebrow">Anna Édition ↗</figcaption></figure></div></div>`;
      case 'animation': return `<div class="study-animation">${stamp}<div class="sequence"><div class="sequence-frame seq-one"><i></i><span class="eyebrow">01 / Idea</span></div><div class="sequence-frame seq-two"><i></i><span class="eyebrow">02 / Shape</span></div><div class="sequence-frame seq-three"><i></i><span class="eyebrow">03 / Move</span></div></div><strong class="display art-bottom-title">Small shifts.<br>New possibilities.</strong></div>`;
      case 'motion': return `<div class="study-motion">${stamp}<div class="motion-words display"><span>MAKE</span><span>IT <i aria-hidden="true">↗</i></span><span>MOVE.</span></div><span class="eyebrow art-note">Type / Rhythm / Direction</span></div>`;
      case 'packaging': return `<div class="study-packaging">${stamp}<div class="package-layout"><div class="package-box pack-large"><span class="eyebrow">Objects / 01</span><strong class="display">FORM<br>WITH<br>FEELING.</strong><span class="eyebrow">Everyday essentials.</span></div><div class="package-box pack-small"><span class="eyebrow">Objects / 02</span><strong class="display">A little<br>more<br>purpose.</strong></div></div><span class="eyebrow art-note">Original packaging concept</span></div>`;
      case 'graphic': return `<div class="study-graphic">${stamp}<div class="graphic-poster"><span class="eyebrow">A study in visual expression / 08</span><strong class="display">LESS<br>NOISE.<br>MORE<br>MEANING.</strong><div class="poster-rule"></div><span class="eyebrow">Independent by design. ↗</span></div></div>`;
      default: return `<div class="study-advertising">${stamp}<div class="campaign-main"><span class="eyebrow">One idea / Many touchpoints</span><strong class="display">MAKE<br>IT<br>MATTER<span>.</span></strong><span class="campaign-arrow" aria-hidden="true">↗</span></div><div class="campaign-strip eyebrow"><span>Notice.</span><span>Connect.</span><span>Remember.</span></div></div>`;
    }
  }
  function cancel() { token++; animations.forEach(a=>a.cancel()); animations=[]; }
  function isStatic() { return reduce.matches || document.body.classList.contains('motion-static') || document.hidden; }
  function setChapter(next, {animate=true,focus=true}={}) {
    next = Math.max(0,Math.min(data.length,Number(next)||0));
    const previous=index; index=next; cancel();
    if (!next) {
      stage.innerHTML = `<article class="book-page book-page-left book-cover"><span class="eyebrow book-kicker">Independent by design / Services</span><h2 class="book-title display" tabindex="-1">ONE STUDIO.<br>EVERY<br>TOUCHPOINT<span>.</span></h2><p class="cover-intro">From the first idea to the final detail.<br>Nine ways to make your mark.</p><div class="cover-mark" aria-hidden="true">↗</div><div class="page-foot eyebrow"><span>TIMDSGN / Capabilities</span><span>01</span></div></article><article class="book-page book-page-right book-contents"><div class="contents-top"><span class="eyebrow">Explore the studio</span><h3 class="display">Contents<span> / 09</span></h3></div><ol>${data.map((s,i)=>`<li><a href="#services/${s.slug}" data-chapter="${i+1}"><span class="eyebrow">${num(i+1)}</span><span class="display">${esc(s.name)}</span><span aria-hidden="true">↗</span></a></li>`).join('')}</ol><div class="page-foot eyebrow"><span>Choose a chapter</span><span>02</span></div></article>`;
    } else {
      const s=data[next-1];
      stage.innerHTML=`<article class="book-page book-page-left book-copy"><span class="eyebrow book-kicker">${num(next)} / ${esc(s.name)}</span><h2 class="book-title display" tabindex="-1">${esc(s.headline).replace(/\n/g,'<br>')}</h2><p class="book-intro">${esc(s.intro)}</p><p class="book-description">${esc(s.copy)}</p><ul class="book-deliverables">${s.deliverables.map(d=>`<li>${esc(d)}</li>`).join('')}</ul><a class="book-cta eyebrow" href="/contact.html?service=${s.slug}">Let's talk about ${esc(s.name.toLowerCase())} <span aria-hidden="true">↗</span></a><div class="page-foot eyebrow"><span>TIMDSGN / ${esc(s.name)}</span><span>${num(next*2+1)}</span></div></article><article class="book-page book-page-right book-art" aria-label="${esc(s.name)} visual">${artwork(s)}<div class="page-foot eyebrow"><span>${s.art==='web'?'Selected work':'Original design study'}</span><span>${num(next*2+2)}</span></div></article>`;
    }
    root.dataset.bookChapter=String(index);
    root.querySelector('[data-book-prev]').disabled=index===0;
    root.querySelector('[data-book-next]').disabled=index===data.length;
    root.querySelector('[data-book-contents]').disabled=index===0;
    root.querySelector('.book-position').textContent=`${num(index+1)} / 10`;
    root.querySelector('.book-live').textContent=index?`${data[index-1].name}. Chapter ${index} of 9.`:'Services contents. Nine chapters.';
    const detail=root.closest('.panel-detail');
    if(detail)detail.scrollTop=0;
    stage.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;img.closest('figure').classList.add('image-failed');},{once:true}));
    if(focus) {
      stage.querySelector('.book-title').focus({preventScroll:true});
      if(!desktop.matches) { const top=root.getBoundingClientRect().top+scrollY-200; window.scrollTo({top:Math.max(0,top),behavior:'instant'}); }
    }
    if(animate && !isStatic()) {
      const direction=index>=previous?1:-1;
      animations=[...stage.querySelectorAll('.book-page')].map((page,i)=>page.animate(desktop.matches?[
        {opacity:.45,transform:`perspective(1000px) rotateY(${direction*(i? -6:3)}deg) translateX(${direction*(i?8:-4)}px)`},
        {opacity:1,transform:'perspective(1000px) rotateY(0deg) translateX(0)'}
      ]:[{opacity:.5,transform:`translateY(${direction*8}px)`},{opacity:1,transform:'translateY(0)'}],{duration:desktop.matches?500:300,easing:'cubic-bezier(.22,1,.36,1)'}));
      animations.push(stage.querySelector('.book-title').animate([{opacity:.5,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:500,easing:'cubic-bezier(.22,1,.36,1)'}));
      const current=token;Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>{if(current===token)animations=[];});
    }
  }
  function go(n) { const s=data[n-1];window.TIMDSGN_ROUTE.navigate(s?`services/${s.slug}`:'services'); }
  root.addEventListener('click',event=>{
    const chapter=event.target.closest('[data-chapter]');
    if(chapter){event.preventDefault();go(Number(chapter.dataset.chapter));}
    else if(event.target.closest('[data-book-next]'))go(index+1);
    else if(event.target.closest('[data-book-prev]'))go(index-1);
    else if(event.target.closest('[data-book-contents]'))go(0);
  });
  root.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||document.querySelector('dialog[open]'))return;
    if(event.key==='ArrowRight'&&index<data.length){event.preventDefault();go(index+1);}
    if(event.key==='ArrowLeft'&&index>0){event.preventDefault();go(index-1);}
  });
  const observer=new MutationObserver(()=>{if(isStatic()||document.body.classList.contains('dialog-open'))cancel();});
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  const syncVisibility=()=>{document.body.classList.toggle('book-hidden',document.hidden||!root.closest('.panel').classList.contains('is-active'));if(document.hidden)cancel();};
  document.addEventListener('visibilitychange',syncVisibility);
  new IntersectionObserver(entries=>{root.classList.toggle('book-offscreen',!entries[0].isIntersecting);},{threshold:0}).observe(root);
  reduce.addEventListener('change',cancel);window.addEventListener('resize',cancel,{passive:true});
  document.querySelector('#workspace').addEventListener('mosaicstatechange',()=>{syncVisibility();if(!root.closest('.panel').classList.contains('is-active'))cancel();});
  window.TIMDSGN_BOOK_VIEW={showSlug(slug,options){const found=data.findIndex(s=>s.slug===slug);setChapter(found+1,options);}};
  setChapter(0,{animate:false,focus:false});
  window.TIMDSGN_ROUTE.follow();
  syncVisibility();
})();

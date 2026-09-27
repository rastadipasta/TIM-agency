/* Native text and SVG: the scroll position moves a camera across a two-axis route. */
(() => {
  const section = document.querySelector('.scroll-process');
  if (!section || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const stage = section.querySelector('.scroll-process__stage');
  const viewport = section.querySelector('.process-viewport');
  const world = section.querySelector('.process-world');
  const nodes = [...section.querySelectorAll('.process-node')];
  const route = section.querySelector('.process-route path');
  const bar = section.querySelector('.scroll-process__progress span');
  const counter = section.querySelector('.process-counter');
  const grid = [[0,0],[1,0],[1,1],[0,1],[0,2],[1,2],[1,3],[0,3]];
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-native');
    let points = [];
    let width = 0, height = 0;
    const camera = { progress: 0 };
    const moveX = gsap.quickSetter(world, 'x', 'px');
    const moveY = gsap.quickSetter(world, 'y', 'px');
    function draw() {
      if (!points.length) return;
      // Each stop has a reading pause; transitions alternate horizontal/vertical.
      const position = camera.progress * 8;
      const index = Math.min(7, Math.floor(position));
      const next = Math.min(7, index + 1);
      let t = gsap.utils.clamp(0,1,(position-index-0.3)/0.7);
      t = t*t*(3-2*t);
      const x = points[index][0] + (points[next][0]-points[index][0])*t;
      const y = points[index][1] + (points[next][1]-points[index][1])*t;
      moveX(width/2-x); moveY(height/2-y);
      counter.textContent = `${String(t > .5 ? next+1 : index+1).padStart(2,'0')} / 08`;
      bar.style.transform = `scaleX(${camera.progress})`;
    }
    function layout() {
      width = viewport.clientWidth; height = viewport.clientHeight;
      points = grid.map(([x,y]) => [x*width*1.12,y*height*1.15]);
      nodes.forEach((node,i) => {
        node.style.left = `${points[i][0]}px`;
        node.style.top = `${points[i][1]}px`;
        node.style.width = `${Math.min(width*.84,1050)}px`;
      });
      const offset = Math.min(height*.32,210);
      let d = `M ${points[0][0]-width*.42} ${points[0][1]+offset}`;
      points.forEach(([x,y],i) => {
        if (!i) { d += ` H ${x}`; return; }
        const [px,py] = points[i-1];
        if (py===y) d += ` H ${x}`;
        else {
          const edge = px + (grid[i][0]===1 ? width*.49 : -width*.49);
          d += ` H ${edge} V ${y+offset} H ${x}`;
        }
      });
      d += ` h ${width*.3}`;
      route.setAttribute('d',d);
      draw();
    }
    layout();
    const tween = gsap.to(camera, {
      progress:1, ease:'none', onUpdate:draw,
      scrollTrigger:{trigger:section,pin:stage,start:'top top',
        end:()=>`+=${Math.max(innerHeight*7,4200)}`,scrub:.25,anticipatePin:1,
        invalidateOnRefresh:true,onRefresh:layout},
    });
    const resize = new ResizeObserver(layout);
    resize.observe(viewport);
    const isActive = () => tween.scrollTrigger?.isActive;
    function wheel(event) {
      if (!isActive() || Math.abs(event.deltaX)<=Math.abs(event.deltaY) || event.ctrlKey) return;
      event.preventDefault();
      window.scrollBy({top:event.deltaX*(event.deltaMode===1?16:1),behavior:'instant'});
    }
    function keys(event) {
      if (!['ArrowRight','ArrowLeft'].includes(event.key)) return;
      event.preventDefault();
      window.scrollBy({top:(event.key==='ArrowRight'?1:-1)*innerHeight*.7,behavior:'instant'});
    }
    // Vertical swipes use native page scrolling; horizontal swipes follow the same route.
    let touch;
    function touchStart(e) { if(e.touches.length===1) touch={x:e.touches[0].clientX,y:e.touches[0].clientY,axis:null}; }
    function touchMove(e) {
      if(!touch || !isActive() || e.touches.length!==1) return;
      const x=e.touches[0].clientX,y=e.touches[0].clientY,dx=touch.x-x,dy=touch.y-y;
      if(!touch.axis && Math.max(Math.abs(dx),Math.abs(dy))>10) touch.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
      if(touch.axis==='x') { e.preventDefault(); window.scrollBy({top:dx*2,behavior:'instant'});touch.x=x; }
    }
    viewport.addEventListener('wheel',wheel,{passive:false});
    viewport.addEventListener('keydown',keys);
    viewport.addEventListener('touchstart',touchStart,{passive:true});
    viewport.addEventListener('touchmove',touchMove,{passive:false});
    document.fonts.ready.then(()=>{if(section.classList.contains('is-native')) layout();});
    return () => {
      resize.disconnect();tween.scrollTrigger?.kill();tween.kill();
      viewport.removeEventListener('wheel',wheel);viewport.removeEventListener('keydown',keys);
      viewport.removeEventListener('touchstart',touchStart);viewport.removeEventListener('touchmove',touchMove);
      section.classList.remove('is-native');
      gsap.set(world,{clearProps:'transform'});
      nodes.forEach(node=>{node.style.left='';node.style.top='';node.style.width='';});
    };
  });
})();

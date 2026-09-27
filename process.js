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
  const confetti = document.createElement('canvas');
  confetti.className = 'process-confetti';
  confetti.setAttribute('aria-hidden','true');
  viewport.append(confetti);
  const ink = confetti.getContext('2d');
  let confettiFrame = 0;
  function clearConfetti() {
    cancelAnimationFrame(confettiFrame);
    confettiFrame = 0;
    ink?.clearRect(0,0,confetti.width,confetti.height);
  }
  function celebrate() {
    if (!ink) return;
    clearConfetti();
    const width = viewport.clientWidth, height = viewport.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1,2);
    confetti.width = Math.round(width*dpr);
    confetti.height = Math.round(height*dpr);
    ink.setTransform(dpr,0,0,dpr,0,0);
    const pieces = Array.from({length:width<768?55:90},(_,i) => ({
      x:width*(i%2?.78:.22), y:height*.58,
      vx:(i%2?-1:1)*(40+Math.random()*210), vy:-240-Math.random()*260,
      angle:Math.random()*Math.PI, spin:(Math.random()-.5)*12,
      size:4+Math.random()*5,
    }));
    const started = performance.now();
    function paint(now) {
      const t = (now-started)/1000;
      ink.clearRect(0,0,width,height);
      if(t>=2.6) { confettiFrame=0; return; }
      ink.fillStyle='#111';
      ink.globalAlpha=Math.min(1,(2.6-t)/.5);
      for(const p of pieces) {
        ink.save();
        ink.translate(p.x+p.vx*t,p.y+p.vy*t+220*t*t);
        ink.rotate(p.angle+p.spin*t);
        ink.scale(1,Math.cos(t*9+p.angle)*.7);
        ink.fillRect(-p.size/2,-p.size/2,p.size,p.size*.55);
        ink.restore();
      }
      confettiFrame=requestAnimationFrame(paint);
    }
    confettiFrame=requestAnimationFrame(paint);
  }
  const launchButton = section.querySelector('.process-launch');
  launchButton?.addEventListener('click', celebrate);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-native');
    let points = [];
    let stops = [];
    let routeLength = 0;
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
      // Reveal only the segment leading to the next step, using the same
      // eased progress as the camera. Distance checkpoints handle the elbows.
      const end = index === 7 ? routeLength : stops[next];
      const revealed = stops[index] + (end-stops[index])*t;
      route.style.strokeDashoffset = String(Math.max(0,routeLength-revealed));
      counter.textContent = `${String(t > .5 ? next+1 : index+1).padStart(2,'0')} / 08`;
      bar.style.transform = `scaleX(${camera.progress})`;
      if(camera.progress<.83 && confettiFrame) clearConfetti();
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
      let distance = width*.42;
      stops = [distance];
      let d = `M ${points[0][0]-width*.42} ${points[0][1]+offset}`;
      points.forEach(([x,y],i) => {
        if (!i) { d += ` H ${x}`; return; }
        const [px,py] = points[i-1];
        if (py===y) {
          d += ` H ${x}`;
          distance += Math.abs(x-px);
        }
        else {
          const edge = px + (grid[i][0]===1 ? width*.49 : -width*.49);
          d += ` H ${edge} V ${y+offset} H ${x}`;
          distance += Math.abs(edge-px)+Math.abs(y-py)+Math.abs(x-edge);
        }
        stops.push(distance);
      });
      d += ` h ${width*.3}`;
      route.setAttribute('d',d);
      routeLength = distance + width*.3;
      route.style.strokeDasharray = `${routeLength} ${routeLength}`;
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
      clearConfetti();
      viewport.removeEventListener('wheel',wheel);viewport.removeEventListener('keydown',keys);
      viewport.removeEventListener('touchstart',touchStart);viewport.removeEventListener('touchmove',touchMove);
      section.classList.remove('is-native');
      gsap.set(world,{clearProps:'transform'});
      route.style.strokeDasharray='';route.style.strokeDashoffset='';
      nodes.forEach(node=>{node.style.left='';node.style.top='';node.style.width='';});
    };
  });
})();

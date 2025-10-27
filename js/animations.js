// Reveal-on-scroll, counters, and small interactive helpers
(function(){
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  // Intersection Observer for .reveal / .reveal-up
  const io = new IntersectionObserver((entries)=>{
    for(const e of entries){
      if(e.isIntersecting){
        e.target.classList.add('inview');
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
  qsa('.reveal, .reveal-up').forEach(el => io.observe(el));

  // Counters
  function animateCounter(el){
    const to = parseInt(el.getAttribute('data-to')||'0', 10);
    const dur = 1400; const start = performance.now();
    const startVal = 0;
    function tick(ts){
      const p = Math.min(1, (ts - start) / dur);
      const ease = 1 - Math.pow(1-p, 3);
      const val = Math.floor(startVal + (to - startVal) * ease);
      el.textContent = val.toLocaleString();
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const cio = new IntersectionObserver((entries)=>{
    for(const e of entries){
      if(e.isIntersecting){
        animateCounter(e.target);
        cio.unobserve(e.target);
      }
    }
  },{rootMargin:'0px 0px -10% 0px', threshold: 0.4});
  qsa('.counter').forEach(el => cio.observe(el));

  // Export simple helpers
  window.CVAnimations = {
    tilt(el, strength=10){
      if(!el) return;
      const r = el.getBoundingClientRect();
      function onMove(e){
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateX(${(-y*strength)}deg) rotateY(${x*strength}deg)`;
      }
      function onLeave(){ el.style.transform = ''; }
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    },
    magnetic(el, radius=30){
      if(!el) return;
      const parent = el.parentElement || document.body;
      function onMove(e){
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width/2; const cy = r.top + r.height/2;
        const dx = (e.clientX - cx); const dy = (e.clientY - cy);
        const dist = Math.hypot(dx, dy);
        if(dist < 120){
          const f = Math.max(0, 1 - dist/120) * 8;
          el.style.transform = `translate(${dx/24}px, ${dy/24}px)`;
          el.style.boxShadow = '0 14px 30px rgba(124,58,237,.35)';
        } else { el.style.transform=''; el.style.boxShadow=''; }
      }
      function onLeave(){ el.style.transform=''; el.style.boxShadow=''; }
      parent.addEventListener('mousemove', onMove);
      parent.addEventListener('mouseleave', onLeave);
    }
  }
})();

// Shared dashboard utilities: auth check, navigation, utilities
(function(){
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  // If demo layer didn't override, fallback to fetch
  if(!window.apiRequest){
    window.apiRequest = async function(endpoint, options={}){
      const res = await fetch(endpoint, options);
      if(!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    }
  }

  async function getCurrentUser(){
    try { return await window.apiRequest('/api/auth/me'); } catch { return null; }
  }

  function formatDate(iso){ try{ return new Date(iso).toLocaleDateString(); }catch{ return iso; } }
  function formatCurrency(n){ try{ return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(n); } catch { return `€${n}`; } }

  function showNotification(msg, type='info'){
    const n = document.createElement('div');
    n.className = `toast ${type}`;
    n.textContent = msg;
    Object.assign(n.style, { position:'fixed', right:'16px', bottom:'16px', background:'rgba(0,0,0,.7)', color:'#fff', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,.16)', zIndex:10000 });
    document.body.appendChild(n); setTimeout(()=> n.remove(), 2200);
  }

  class DashboardCommon{
    constructor(){ this.user = null; this.currentSection = null; }

    async init(){
      // Read user from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      let user = null;
      if(urlParams.has('user')) {
        try {
          user = JSON.parse(atob(decodeURIComponent(urlParams.get('user'))));
        } catch {}
      }
      // Fallback to API if not in URL
      if(!user) user = await getCurrentUser();
      this.user = user;
      if(!this.user){ location.href = '../auth/login.html'; return; }
      this.bindNav();
      const first = qs('[data-section]');
      if(first) this.showSection(first.getAttribute('data-section'));
      this.fillUserPill();
    }

    bindNav(){
      qsa('[data-section]').forEach(s=> s.classList.remove('active'));
      qsa('[data-nav]').forEach(link =>{
        link.addEventListener('click', (e)=>{
          e.preventDefault();
          const sec = link.getAttribute('data-nav');
          this.showSection(sec);
        });
      });
    }

    showSection(id){
      qsa('[data-section]').forEach(s=> s.classList.toggle('active', s.getAttribute('data-section')===id));
      qsa('[data-nav]').forEach(a=> a.setAttribute('aria-current', a.getAttribute('data-nav')===id? 'page':'false'));
      const head = qs(`#${id}-head`); if(head) head.focus({preventScroll:true});
      this.currentSection = id;
    }

    fillUserPill(){
      const nameEl = qs('#userName'); const avatar = qs('#userAvatar');
      if(nameEl && this.user) nameEl.textContent = this.user.name || this.user.email;
      if(avatar && this.user){ avatar.style.background = this.user.avatarColor || 'linear-gradient(135deg, var(--primary), var(--accent))'; }
    }
  }

  window.DashboardCommon = DashboardCommon;
  window.dashboardUtils = { formatDate, formatCurrency, showNotification, getCurrentUser };
})();

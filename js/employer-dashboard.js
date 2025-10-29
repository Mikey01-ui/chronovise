  // Directly use demo data from window.demoAccounts
  function renderAllEmployers(){
    const employers = (window.demoAccounts || []).filter(u => u.type === 'employer');
    const list = qs('#allEmployersList');
    if(!list) return;
    list.innerHTML = '';
    employers.forEach(e => {
      const item = document.createElement('div'); item.className = 'list-item';
      item.innerHTML = `<strong>${e.name}</strong> — <span class='muted'>${e.email}</span> <span class='badge'>${e.company}</span> <span class='badge'>${e.location}</span>`;
      list.appendChild(item);
    });
  }
// Employer dashboard logic: overview, jobs, applications, simple post form (demo)
(function(){
  const { showNotification } = window.dashboardUtils || {};
  const qs = (s, r=document) => r.querySelector(s);

  async function loadOverview(){
    const o = await apiRequest('/api/employer/overview');
    qs('#eStatJobs').textContent = o.jobs;
    qs('#eStatApplicants').textContent = o.applicants;
    qs('#eStatInterviews').textContent = o.interviews;
  }

  async function loadJobs(){
    const jobs = await apiRequest('/api/employer/jobs');
    const list = qs('#eJobsList'); list.innerHTML='';
    jobs.forEach(j=>{
      const row = document.createElement('div'); row.className = 'list-item';
      row.innerHTML = `
        <div><strong>${j.title}</strong> — <span class="muted">${j.status}</span></div>
        <div><span class="badge">${j.applicants} applicants</span></div>
      `;
      list.appendChild(row);
    });
  }

  async function loadApplications(){
    const apps = await apiRequest('/api/employer/applications');
    const list = qs('#eAppsList'); list.innerHTML='';
    apps.forEach(a=>{
      const row = document.createElement('div'); row.className = 'list-item';
      row.innerHTML = `
        <div>
          <div><strong>${a.candidate}</strong> applied for <strong>${a.job}</strong></div>
          <div class="muted">Status: ${a.status}</div>
        </div>
        <div><button class="btn btn-small btn-outline">Open</button></div>
      `;
      list.appendChild(row);
    });
  }

  function bindPostForm(){
    const f = qs('#postJobForm'); if(!f) return;
    f.addEventListener('submit', (e)=>{
      e.preventDefault();
      showNotification('Job posted (demo).', 'success');
      f.reset();
    });
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    document.body.classList.add('dashboard');
    const common = new DashboardCommon();
    await common.init();
    if(!common.user) return;
    loadOverview();
    loadJobs();
    loadApplications();
    bindPostForm();
    renderAllEmployers();
    setupEmployerMessaging();
  });

  function setupEmployerMessaging(){
    const studentSelect = qs('#studentSelect');
    const loadBtn = qs('#loadConversation');
    const msgList = qs('#emMessagesList');
    const msgForm = qs('#emMessageForm');
    const msgInput = qs('#emMessageInput');
    if(!studentSelect || !loadBtn) return;
    // Populate student options
    const students = (window.demoAccounts || []).filter(a=> a.type==='student');
    studentSelect.innerHTML = students.map(s=>`<option value="${s.email}">${s.name} — ${s.email}</option>`).join('');
    function getAvatarByName(name){
      try{ const acct = (window.demoAccounts||[]).find(a=> a.name === name || a.email === name); if(acct) return acct.photo || acct.avatarColor || ''; }catch{} return '';
    }
    function loadConv(){
      const email = studentSelect.value;
      const key = 'demoMessages_' + email;
      let msgs = [];
      try{ msgs = JSON.parse(localStorage.getItem(key) || '[]'); }catch{}
      msgList.innerHTML = '';
      const me = (common.user && common.user.name) || '';
      msgs.forEach(m=>{
        const isMine = m.from === me;
        const wrapper = document.createElement('div'); wrapper.style = `display:flex;gap:10px;margin-bottom:8px;justify-content:${isMine? 'flex-end':'flex-start'};`;
        const avatarSrc = getAvatarByName(m.from);
        const bubble = document.createElement('div');
        bubble.style = `max-width:72%;padding:10px 12px;border-radius:12px;background:${isMine? 'linear-gradient(90deg,#7c3aed,#a78bfa)': 'rgba(255,255,255,0.04)'};color:${isMine? '#fff':'#ddd'};`;
        bubble.innerHTML = `<div style="font-size:13px;margin-bottom:6px;"><strong style="font-weight:600;">${m.from}</strong></div><div>${m.text}</div><div class="muted" style="font-size:11px;margin-top:6px;">${new Date(m.at).toLocaleString()}</div>`;
        if(isMine){
          wrapper.appendChild(bubble);
          if(avatarSrc){ const img=document.createElement('img'); img.src=avatarSrc; img.style='width:36px;height:36px;border-radius:8px;object-fit:cover;'; wrapper.appendChild(img); }
        }else{
          if(avatarSrc){ const img=document.createElement('img'); img.src=avatarSrc; img.style='width:36px;height:36px;border-radius:8px;object-fit:cover;'; wrapper.appendChild(img); }
          wrapper.appendChild(bubble);
        }
        msgList.appendChild(wrapper);
      });
      msgList.scrollTop = msgList.scrollHeight;
    }
    loadBtn.addEventListener('click', ()=> loadConv());
    msgForm.addEventListener('submit', e=>{
      e.preventDefault();
      const email = studentSelect.value; if(!email) return;
      const key = 'demoMessages_' + email;
      let msgs = [];
      try{ msgs = JSON.parse(localStorage.getItem(key) || '[]'); }catch{}
      msgs.push({ from: (common.user && common.user.name) || 'Employer', text: msgInput.value.trim(), at: Date.now() });
      localStorage.setItem(key, JSON.stringify(msgs));
      msgInput.value = '';
      loadConv();
      showNotification('Message sent (demo).','success');
    });
  }
})();

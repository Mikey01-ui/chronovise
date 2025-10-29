  // Directly use demo data from window.demoAccounts
  function renderAllStudents(){
    const students = (window.demoAccounts || []).filter(u => u.type === 'student');
    const list = qs('#allStudentsList');
    if(!list) return;
    list.innerHTML = '';
      students.forEach(s => {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.style = 'background:var(--surface);border-radius:16px;padding:18px;box-shadow:var(--shadow-1);display:flex;gap:18px;align-items:center;';
        // Avatar sticker
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.style = `width:56px;height:56px;border-radius:50%;background:${s.avatarColor};display:flex;align-items:center;justify-content:center;font-size:1.7em;color:#fff;font-weight:700;flex-shrink:0;`;
        avatar.textContent = s.name.split(' ')[0][0];
        const info = document.createElement('div');
        info.style = 'flex:1;';
        info.innerHTML = `
          <div style="font-size:1.15em;font-weight:600;">${s.name}</div>
          <div class="muted" style="margin-bottom:6px;">${s.email}</div>
          <div><span class="badge">${s.education}</span> <span class="badge">${s.location}</span> <span class="badge">Visa: ${s.visa}</span></div>
          <div style="margin:6px 0 2px 0;"><strong>Skills:</strong> ${(s.skills||[]).map(sk=>`<span class='badge'>${sk}</span>`).join(' ')}</div>
          <div style="margin-bottom:4px;"><strong>About:</strong> <span class="muted">${s.summary||'—'}</span></div>
        `;
        card.appendChild(avatar);
        card.appendChild(info);
        list.appendChild(card);
      });
  }
// Student dashboard logic: profile, stats, jobs, applications
(function(){
  const { formatDate, showNotification } = window.dashboardUtils || {};
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  async function loadProfile(){
    const p = await apiRequest('/api/students/profile');
  // Render profile picture (inject image before name)
  // Always set profile photo src
  try{
    const img = qs('#profilePhoto');
    if(img) { img.src = p.photo || ''; img.alt = p.name || 'Profile'; }
  }catch(e){}
// --- Demo messaging platform ---
function setupMessages(){
  const messagesList = document.getElementById('messagesList');
  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const user = window.currentUser || null;
  const conversationEmail = (user && user.email) || 'student';
  const key = 'demoMessages_' + conversationEmail;

  function getAvatarByName(name){
    try{ const acct = (window.demoAccounts||[]).find(a=> a.name === name || a.email === name); if(acct) return acct.photo || acct.avatarColor || ''; }catch{} return '';
  }

  function lastReadKey(convoEmail, viewerEmail){ return `demoLastRead_${convoEmail}|${viewerEmail}`; }
  function getLastRead(convoEmail, viewerEmail){ try{ return parseInt(localStorage.getItem(lastReadKey(convoEmail, viewerEmail))||'0',10); }catch{return 0;} }
  function setLastRead(convoEmail, viewerEmail, ts){ try{ localStorage.setItem(lastReadKey(convoEmail, viewerEmail), String(ts)); }catch{} }

  function loadMessages(){
    let msgs = [];
    try{ msgs = JSON.parse(localStorage.getItem(key)||'[]'); }catch{}
    messagesList.innerHTML = '';
    const me = (window.currentUser && window.currentUser.name) || '';
    const viewerEmail = (window.currentUser && window.currentUser.email) || '';
    const last = getLastRead(conversationEmail, viewerEmail) || 0;
    msgs.forEach(m=>{
      const isMine = m.from === me;
      const wrapper = document.createElement('div');
      wrapper.style = `display:flex;gap:10px;margin-bottom:8px;justify-content:${isMine? 'flex-end':'flex-start'};`;
      const avatarSrc = getAvatarByName(m.from);
      const bubble = document.createElement('div');
      bubble.style = `max-width:72%;padding:10px 12px;border-radius:12px;background:${isMine? 'linear-gradient(90deg,#7c3aed,#a78bfa)': 'rgba(255,255,255,0.04)'};color:${isMine? '#fff':'#ddd'};`;
      bubble.innerHTML = `<div style="font-size:13px;margin-bottom:6px;"><strong style="font-weight:600;">${m.from}</strong></div><div>${m.text}</div><div class="muted" style="font-size:11px;margin-top:6px;">${new Date(m.at).toLocaleString()}</div>`;
      if(isMine){ wrapper.appendChild(bubble); if(avatarSrc){ const img=document.createElement('img'); img.src=avatarSrc; img.style='width:36px;height:36px;border-radius:8px;object-fit:cover;'; wrapper.appendChild(img); } }
      else { if(avatarSrc){ const img=document.createElement('img'); img.src=avatarSrc; img.style='width:36px;height:36px;border-radius:8px;object-fit:cover;'; wrapper.appendChild(img); } wrapper.appendChild(bubble); }
      messagesList.appendChild(wrapper);
    });
    messagesList.scrollTop = messagesList.scrollHeight;
    // mark conversation as read now that it's rendered
    try{ setLastRead(conversationEmail, (window.currentUser && window.currentUser.email) || '', Date.now()); }catch(e){}
    // update unread badge after rendering
    updateMessagesBadge();
  }

  function updateMessagesBadge(){
    try{
      const badge = document.getElementById('navMessagesBadge'); if(!badge) return;
      let msgs = [];
      try{ msgs = JSON.parse(localStorage.getItem(key)||'[]'); }catch{}
      const me = (window.currentUser && window.currentUser.name) || '';
      const viewerEmail = (window.currentUser && window.currentUser.email) || '';
      const last = getLastRead(conversationEmail, viewerEmail) || 0;
      const unread = msgs.filter(m => m.from !== me && m.at > last).length;
      if(unread > 0){ badge.style.display = 'inline-block'; badge.textContent = unread>99? '99+' : String(unread); }
      else { badge.style.display = 'none'; }
    }catch(e){}
  }

  messageForm.addEventListener('submit', e=>{
    e.preventDefault();
    const text = messageInput.value.trim(); if(!text) return;
    let msgs = [];
    try{ msgs = JSON.parse(localStorage.getItem(key)||'[]'); }catch{}
    const sender = (window.currentUser && window.currentUser.name) || 'Student';
    msgs.push({ from: sender, text, at: Date.now() });
    localStorage.setItem(key, JSON.stringify(msgs));
    messageInput.value = '';
    loadMessages();
    updateMessagesBadge();
  });

  loadMessages();
  // Listen for storage events so messages sync across tabs/windows
  window.addEventListener('storage', (ev) => {
    if(!ev.key) return;
    // If the messages for this conversation change, reload and flash if it's an incoming message
    if(ev.key === key){
      try{
        // determine latest message and whether it's incoming
        const msgs = JSON.parse(localStorage.getItem(key) || '[]');
        const last = msgs && msgs.length ? msgs[msgs.length-1] : null;
        const me = (window.currentUser && window.currentUser.name) || '';
        loadMessages();
        if(last && last.from !== me){
          const items = messagesList.children; if(items && items.length){ const el = items[items.length-1]; el.classList.add('msg-incoming'); setTimeout(()=> el.classList.remove('msg-incoming'), 900); }
        }
      }catch(e){ loadMessages(); }
    }
    if(ev.key && ev.key.startsWith('demoLastRead_')){ loadMessages(); }
  });
}
  qs('#profileName').textContent = p.name;
  qs('#profileEdu').textContent = p.education + (p.location ? `, ${p.location}` : '');
  qs('#profileVisa').textContent = p.visa;
  qs('#profileSkills').textContent = (p.skills||[]).join(', ');
  // Populate top skill stat if present
  try{ const topEl = qs('#statTopSkill'); if(topEl) topEl.textContent = (p.skills && p.skills.length>0) ? p.skills[0] : '—'; }catch(e){}
  let extra = '';
  if(p.languages) extra += `\nLanguages: ${p.languages.join(', ')}`;
  if(p.awards) extra += `\nAwards: ${p.awards.join(', ')}`;
  if(p.interests) extra += `\nInterests: ${p.interests.join(', ')}`;
  if(p.github) extra += `\nGitHub: ${p.github}`;
  if(p.linkedin) extra += `\nLinkedIn: ${p.linkedin}`;
  qs('#profileSummary').textContent = (p.summary ? p.summary : '') + extra;
    // Enable CV download
    const cvBtn = qs('button[download-cv]');
    if(cvBtn){
      cvBtn.disabled = false;
      cvBtn.onclick = async function(){
        try{
          cvBtn.disabled = true; cvBtn.textContent = 'Generating PDF...';
          showSpinner('Generating PDF...');
          // build a printable CV element
          const cv = document.createElement('div');
          cv.id = 'cvExport';
          Object.assign(cv.style, { width:'800px', padding:'28px', background:'#ffffff', color:'#111', fontFamily:'Inter, Arial, sans-serif' });
          cv.innerHTML = `
            <div style="display:flex;gap:18px;align-items:center;margin-bottom:14px;">
              <div style="width:100px;height:100px;flex-shrink:0;">
                <img src="${p.photo||''}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;"/>
              </div>
              <div>
                <h1 style="margin:0;font-size:22px;">${p.name}</h1>
                <div style="color:#555;margin-top:6px;">${p.education || ''}${p.location? (' • '+p.location): ''}</div>
              </div>
            </div>
            <section style="margin-top:8px;">
              <h3 style="margin:0 0 6px 0;">Summary</h3>
              <div style="color:#333;line-height:1.4;">${(p.summary||'').replace(/\n/g,'<br/>')}</div>
            </section>
            <section style="margin-top:12px;display:flex;gap:24px;">
              <div style="flex:1;">
                <h4 style="margin:6px 0;">Skills</h4>
                <div>${(p.skills||[]).map(s=>`<span style=\"display:inline-block;background:#eef; padding:4px 8px;border-radius:8px;margin:4px;font-size:12px;color:#113\">${s}</span>`).join('')}</div>
              </div>
              <div style="width:220px;">
                <h4 style="margin:6px 0;">Details</h4>
                <div style="color:#333;line-height:1.6;">
                  <div><strong>Visa:</strong> ${p.visa||'—'}</div>
                  <div><strong>Languages:</strong> ${(p.languages||[]).join(', ')}</div>
                  <div><strong>Awards:</strong> ${(p.awards||[]).join(', ')}</div>
                </div>
              </div>
            </section>
          `;
          document.body.appendChild(cv);
          // render with html2canvas and export with jsPDF
          const canvas = await window.html2canvas(cv, { scale:2 });
          const imgData = canvas.toDataURL('image/png');
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF({ unit:'mm', format:'a4' });
          const pageWidth = pdf.internal.pageSize.getWidth();
          const margin = 10;
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pageWidth - margin*2;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          pdf.addImage(imgData, 'PNG', margin, 10, pdfWidth, pdfHeight);
          pdf.save(`${p.name.replace(/\s+/g,'_')}_CV.pdf`);
          cv.remove();
        }catch(err){ console.error(err); alert('Failed to generate PDF.'); }
        finally{ hideSpinner(); cvBtn.disabled = false; cvBtn.textContent = 'Download CV'; }
      };
    }
  }

  async function loadStats(){
    const s = await apiRequest('/api/students/statistics');
    qs('#statViews').textContent = s.views;
    qs('#statMatches').textContent = s.matches;
    qs('#statInterviews').textContent = s.interviews;
    const appEl = qs('#statApplications'); if(appEl) appEl.textContent = s.applications;
    const compEl = qs('#statCompleteness'); if(compEl) compEl.textContent = (s.profileCompleteness ? s.profileCompleteness + '%' : '—');
    const msgEl = qs('#statMessages'); if(msgEl) msgEl.textContent = (s.messages!=null ? s.messages : '—');
    // Render overview chart using a small synthetic timeseries based on views
    try{ renderOverviewChart(s); }catch(e){}
  }

  // Small helper to create a synthetic 7-day series around a base value
  function makeSeries(base, len=7){
    const arr = [];
    for(let i=0;i<len;i++){
      const jitter = Math.floor((Math.random()-0.5) * (base * 0.18));
      arr.push(Math.max(0, Math.round(base/len + jitter + (i*2))));
    }
    return arr;
  }

  let _overviewChart = null;
  function renderOverviewChart(stats){
    // Render a doughnut chart summarizing activity: views, matches, applications, interviews
    const canvas = qs('#overviewChart');
    if(!canvas || !window.Chart) return;
    const views = Math.max(0, stats.views || 0);
    const matches = Math.max(0, stats.matches || 0);
    const applications = Math.max(0, stats.applications || 0);
    const interviews = Math.max(0, stats.interviews || 0);
    const dataVals = [views, matches, applications, interviews];
    const labels = ['Views','Matches','Applications','Interviews'];
    const colors = ['#7c3aed','#10b981','#22d3ee','#f59e42'];
    if(_overviewChart) { _overviewChart.destroy(); _overviewChart = null; }
    _overviewChart = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: dataVals, backgroundColor: colors, borderColor: '#0b0b0b', borderWidth: 1 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: '#ddd' } },
          tooltip: { enabled: true }
        }
      }
    });
    // If all zeros, display muted message instead of chart
    if(dataVals.every(v=>v===0)){
      const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
      const tx = canvas.parentNode.querySelector('.muted'); if(tx) tx.textContent = 'No activity yet';
    }
  }

  // Spinner overlay for PDF generation
  function ensureSpinnerStyles(){
    if(document.getElementById('pdfSpinnerStyles')) return;
    const style = document.createElement('style'); style.id = 'pdfSpinnerStyles';
    style.textContent = `
      #pdfSpinnerOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:12000}
      .pdf-spinner{width:64px;height:64px;border-radius:50%;border:6px solid rgba(255,255,255,0.12);border-top-color:#7c3aed;animation:spin 1s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      #pdfSpinnerText{color:#fff;margin-top:12px;font-family:Inter,Arial,Helvetica,sans-serif}
    `;
    document.head.appendChild(style);
  }

  function showSpinner(text){
    ensureSpinnerStyles();
    if(document.getElementById('pdfSpinnerOverlay')) return;
    const overlay = document.createElement('div'); overlay.id = 'pdfSpinnerOverlay';
    const box = document.createElement('div'); box.style = 'display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px;border-radius:10px;';
    const spinner = document.createElement('div'); spinner.className = 'pdf-spinner';
    const t = document.createElement('div'); t.id = 'pdfSpinnerText'; t.textContent = text || 'Preparing PDF...';
    box.appendChild(spinner); box.appendChild(t); overlay.appendChild(box); document.body.appendChild(overlay);
  }

  function hideSpinner(){ const o = document.getElementById('pdfSpinnerOverlay'); if(o) o.remove(); }

  function renderJob(job){
    const li = document.createElement('li'); li.className = 'job-card';
    li.innerHTML = `
      <h4>${job.title} — <span class="muted">${job.company}</span></h4>
      <div class="job-meta">${job.location} • ${job.type} • ${job.posted} • ${job.salary||''}</div>
      <div>${(job.tags||[]).map(t=>`<span class="badge">${t}</span>`).join(' ')}</div>
      <div class="job-actions"><button class="btn btn-small btn-gradient" data-apply="${job.id}">Apply</button>
      <button class="btn btn-small btn-outline" data-view="${job.id}">Details</button></div>
    `;
    return li;
  }

  async function loadJobs(){
    const jobs = await apiRequest('/api/jobs');
    const list = qs('#jobsList'); list.innerHTML='';
    jobs.forEach(j=> list.appendChild(renderJob(j)));
    list.addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      if(btn.hasAttribute('data-apply')){
        showNotification('Application submitted (demo).', 'success');
      }
      if(btn.hasAttribute('data-view')){
        showNotification('Opening details (demo).', 'info');
      }
    });
  }

  async function loadApplications(){
    const apps = await apiRequest('/api/students/applications');
    const list = qs('#appsList'); list.innerHTML = '';
    apps.forEach(a=>{
      const item = document.createElement('div'); item.className = 'list-item';
      item.innerHTML = `
        <div>
          <div><strong>${a.job}</strong> — <span class="muted">${a.company}</span></div>
          <div class="muted">Applied ${formatDate(a.appliedAt)}</div>
        </div>
        <div><span class="badge">${a.status}</span></div>
      `;
      list.appendChild(item);
    });
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    document.body.classList.add('dashboard');
    const common = new DashboardCommon();
    await common.init();
    if(!common.user) return;
    // Load data for default sections
    loadProfile();
    loadStats();
    loadJobs();
    loadApplications();
    renderAllStudents();
    // Seed some demo messages from employers if the conversation is empty (so the demo looks active)
    (function seedDemoMessages(){
      try{
        const user = window.currentUser; if(!user || !user.email) return;
        const key = 'demoMessages_' + user.email;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if(existing && existing.length>0) return; // don't overwrite if messages exist
        const employers = (window.demoAccounts||[]).filter(a=> a.type === 'employer');
        if(!employers || employers.length===0) return;
        const now = Date.now();
        const samples = [];
        // pick up to 3 employers and craft short demo messages
        for(let i=0;i<Math.min(3, employers.length); i++){
          const e = employers[i];
          samples.push({ from: e.name, text: `Hi ${user.name.split(' ')[0]}, we saw your profile and think you'd be a great fit for a ${['Data Analyst','ML Engineer','Product Analyst'][i%3]} role.`, at: now - ((i+1)*86400*1000) });
        }
        // add a quick follow-up from student to simulate reply
        samples.push({ from: user.name, text: `Thanks — I'm interested! Happy to chat.`, at: now - 3600*1000 });
        localStorage.setItem(key, JSON.stringify(samples));
      }catch(e){}
    })();
    setupMessages();
  });
})();

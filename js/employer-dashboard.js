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

  // Load company profile for Employer > Company Profile section
  async function loadCompanyProfile(){
    try{
      const p = await apiRequest('/api/employer/profile');
      const sec = qs('[data-section="company"] .card');
      if(!sec) return;
      sec.innerHTML = '';
      const wrapper = document.createElement('div');
      wrapper.style = 'display:flex;gap:14px;align-items:flex-start;';
      const logoBox = document.createElement('div'); logoBox.style = 'width:96px;height:96px;flex-shrink:0;';
      const img = document.createElement('img'); img.src = p.logo || ''; img.alt = p.company || 'Logo'; img.style = 'width:100%;height:100%;object-fit:cover;border-radius:12px;';
      logoBox.appendChild(img);
      const info = document.createElement('div');
      info.innerHTML = `<h3 style="margin:0">${p.company || ''}</h3><div class="muted" style="margin:6px 0">${p.location || ''} • ${p.size || ''}</div><p style="margin:8px 0;color:var(--muted)">${p.description || ''}</p><div style="margin-top:6px"><strong>Industry:</strong> ${p.industry || '—'}</div><div style="margin-top:6px"><strong>Founded:</strong> ${p.founded || '—'}</div><div style="margin-top:6px"><strong>Website:</strong> <a href="${p.website||'#'}" target="_blank">${p.website||'—'}</a></div>`;
      const benefits = document.createElement('div'); benefits.style='margin-top:8px;'; benefits.innerHTML = `<strong>Benefits</strong>: ${(p.benefits||[]).map(b=>`<span class="badge">${b}</span>`).join(' ')}`;
      info.appendChild(benefits);
      wrapper.appendChild(logoBox); wrapper.appendChild(info);
      sec.appendChild(wrapper);
    }catch(e){ console.error('loadCompanyProfile failed', e); }
  }

  async function loadJobs(){
    const jobs = await apiRequest('/api/employer/jobs');
    const list = qs('#eJobsList'); list.innerHTML='';
    jobs.forEach(j=>{
      const row = document.createElement('div'); row.className = 'list-item';
      row.innerHTML = `
        <div style="flex:1">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div><strong>${j.title}</strong> <span class="muted">• ${j.location}</span></div>
            <div><span class="muted">${j.posted || ''}</span></div>
          </div>
          <div class="muted" style="margin-top:6px">${(j.tags||[]).slice(0,4).map(t=>`<span class='badge'>${t}</span>`).join(' ')}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <div><span class="badge">${j.status}</span></div>
          <div><span class="badge">${j.applicants} applicants</span></div>
        </div>
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
  loadCompanyProfile();
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
    function computeUnreadForStudent(student){
      try{
        const employerName = (window.currentUser && window.currentUser.name) || '';
        const employerEmail = (window.currentUser && window.currentUser.email) || '';
        const msgs = JSON.parse(localStorage.getItem('demoMessages_' + student.email) || '[]');
        const lastReadKey = `demoLastRead_${student.email}|${employerEmail}`;
        const last = parseInt(localStorage.getItem(lastReadKey)||'0',10) || 0;
        return (msgs||[]).filter(m=> m.from !== employerName && m.at > last).length;
      }catch(e){ return 0; }
    }
    function renderStudentOptions(){
      studentSelect.innerHTML = students.map(s=> `<option value="${s.email}">${s.name} — ${s.email}</option>` ).join('');
    }
    // Render a richer student list panel (avatars + unread badges)
    function renderStudentListPanel(){
      const panel = qs('#studentListPanel'); if(!panel) return;
      panel.innerHTML = '';
      students.forEach(s => {
        const item = document.createElement('div'); item.className = 'student-item';
        const avatar = getAvatarByName(s.email) || '';
        const unread = computeUnreadForStudent(s) || 0;
        item.innerHTML = `
          <div class="student-left">
            <img class="student-avatar" src="${avatar}" alt="${s.name}" onerror="this.style.background='${s.avatarColor||'#444'}';this.src='';" />
            <div class="student-meta"><div class="student-name">${s.name}</div><div class="muted student-email">${s.email}</div></div>
          </div>
          <div class="student-right">${unread>0? `<span class="student-unread-badge">${unread>99? '99+':unread}</span>` : ''}</div>
        `;
        item.addEventListener('click', ()=>{
          try{ studentSelect.value = s.email; updateSelectedStudentBadge(); loadConv(); panel.style.display = 'none'; }catch(e){}
        });
        panel.appendChild(item);
      });
    }
  renderStudentOptions(); renderStudentListPanel();
    // show unread for the selected student in a badge next to select
    const studentUnreadBadge = qs('#studentUnreadBadge');
    function updateSelectedStudentBadge(){
      try{
        const sel = studentSelect.value; if(!sel) { if(studentUnreadBadge) studentUnreadBadge.style.display='none'; return; }
        const st = students.find(s=> s.email === sel);
        if(!st){ studentUnreadBadge.style.display='none'; return; }
        const n = computeUnreadForStudent(st);
        if(n>0){ studentUnreadBadge.style.display='inline-block'; studentUnreadBadge.textContent = n>99? '99+' : String(n); }
        else { studentUnreadBadge.style.display='none'; }
      }catch(e){ if(studentUnreadBadge) studentUnreadBadge.style.display='none'; }
    }
    studentSelect.addEventListener('change', ()=> updateSelectedStudentBadge());
    // toggle panel button
    try{
      const toggle = qs('#toggleStudentList'); const panel = qs('#studentListPanel');
      if(toggle && panel){ toggle.addEventListener('click', ()=>{ panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; renderStudentListPanel(); }); }
    }catch(e){}
    updateSelectedStudentBadge();
    function getAvatarByName(name){
      try{ const acct = (window.demoAccounts||[]).find(a=> a.name === name || a.email === name); if(acct) return acct.photo || acct.avatarColor || ''; }catch{} return '';
    }
    function seedDemoMessagesForStudent(email){
      try{
        if(!email) return;
        const key = 'demoMessages_' + email;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if(existing && existing.length>0) return;
        const employers = (window.demoAccounts||[]).filter(a=> a.type === 'employer');
        if(!employers || employers.length===0) return;
        const student = students.find(s=> s.email === email) || { name: 'Student' };
        const now = Date.now();
        const samples = [];
        for(let i=0;i<Math.min(3, employers.length); i++){
          const e = employers[i];
          samples.push({ from: e.name, text: `Hi ${student.name.split(' ')[0]}, we think you'd be a great fit for our ${['Data Analyst','Product','DevOps'][i%3]} role.`, at: now - ((i+1)*86400*1000) });
        }
        samples.push({ from: student.name, text: `Thanks — I'd love to learn more.`, at: now - 3600*1000 });
        localStorage.setItem(key, JSON.stringify(samples));
      }catch(e){ console.error('seedDemoMessagesForStudent failed', e); }
    }

    // Seed messages coming from students to the selected employer conversation (so employer sees incoming messages)
    function seedStudentsMessagesForStudent(email){
      try{
        if(!email) return false;
        const key = 'demoMessages_' + email;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if(existing && existing.length>0) return false; // don't overwrite
        const students = (window.demoAccounts||[]).filter(a=> a.type === 'student');
        if(!students || students.length===0) return false;
        const now = Date.now(); const samples = [];
        students.slice(0,3).forEach((s,i)=>{
          samples.push({ from: s.name, text: `Hi — I'm ${s.name.split(' ')[0]} and I'm interested in opportunities at your company.`, at: now - ((i+1)*3600*1000) });
        });
        // add an employer reply to make it look conversational
        const employers = (window.demoAccounts||[]).filter(a=> a.type === 'employer');
        const em = employers && employers.length ? employers[0].name : (window.currentUser && window.currentUser.name) || 'Employer';
        samples.push({ from: em, text: `Thanks ${students[0].name.split(' ')[0]} — we'll review and be in touch.`, at: now - 1800*1000 });
        localStorage.setItem(key, JSON.stringify(samples));
        return true;
      }catch(e){ console.error('seedStudentsMessagesForStudent failed', e); return false; }
    }

    // helper: relative time
    function timeAgo(ts){
      try{
        const d = Date.now() - (ts || 0);
        const sec = Math.floor(d/1000);
        if(sec < 60) return `${sec}s ago`;
        const min = Math.floor(sec/60);
        if(min < 60) return `${min}m ago`;
        const hr = Math.floor(min/60);
        if(hr < 24) return `${hr}h ago`;
        const days = Math.floor(hr/24);
        return `${days}d ago`;
      }catch(e){ return new Date(ts).toLocaleString(); }
    }

    function loadConv(){
      const email = studentSelect.value;
      const key = 'demoMessages_' + email;
      let msgs = [];
      try{ msgs = JSON.parse(localStorage.getItem(key) || '[]'); }catch{}
      // If empty, try to seed demo messages so employers see content
      if((!msgs || msgs.length===0)){
        seedDemoMessagesForStudent(email);
        try{ msgs = JSON.parse(localStorage.getItem(key) || '[]'); }catch{}
      }
      msgList.innerHTML = '';
      const me = (window.currentUser && window.currentUser.name) || '';
      const viewerEmail = (window.currentUser && window.currentUser.email) || '';
      function lastReadKey(convoEmail, viewer){ return `demoLastRead_${convoEmail}|${viewer}`; }
      function getLastRead(convoEmail, viewer){ try{ return parseInt(localStorage.getItem(lastReadKey(convoEmail,viewer))||'0',10); }catch{return 0;} }
      function setLastRead(convoEmail, viewer, ts){ try{ localStorage.setItem(lastReadKey(convoEmail,viewer), String(ts)); }catch{} }
      msgs.forEach(m=>{
        const isMine = m.from === me;
        const wrapper = document.createElement('div'); wrapper.style = `display:flex;gap:10px;margin-bottom:8px;justify-content:${isMine? 'flex-end':'flex-start'};`;
        const avatarSrc = getAvatarByName(m.from);
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble ' + (isMine? 'mine':'their');
  bubble.style = `max-width:72%;padding:10px 12px;border-radius:12px;position:relative;`;
  bubble.innerHTML = `<div class="sender" style="font-size:13px;margin-bottom:6px;"><strong style="font-weight:600;">${m.from}</strong></div><div class="body">${m.text}</div><div class="muted timestamp" data-ts="${m.at}" style="font-size:11px;margin-top:6px;">${timeAgo(m.at)}</div>`;
        if(isMine){
          wrapper.appendChild(bubble);
          if(avatarSrc){ const img=document.createElement('img'); img.src=avatarSrc; img.style='width:36px;height:36px;border-radius:8px;object-fit:cover;'; wrapper.appendChild(img); }
          // show 'Seen' if the student has last-read >= this message time; otherwise show Delivered
          try{
            const studentLastRead = getLastRead(email, (email)); // student's own last-read for their view
            if(studentLastRead && studentLastRead >= m.at){ const seen = document.createElement('span'); seen.className='msg-seen'; seen.textContent='Seen'; bubble.appendChild(seen); }
            else { const del = document.createElement('span'); del.className='msg-delivered'; del.textContent='Delivered'; bubble.appendChild(del); }
          }catch(e){}
        }else{
          if(avatarSrc){ const img=document.createElement('img'); img.src=avatarSrc; img.style='width:36px;height:36px;border-radius:8px;object-fit:cover;'; wrapper.appendChild(img); }
          wrapper.appendChild(bubble);
        }
        msgList.appendChild(wrapper);
      });
  // apply relative-time tooltips (surprise)
  try{ if(window.dashboardUtils && window.dashboardUtils.applyTimestampTooltips) window.dashboardUtils.applyTimestampTooltips(msgList); }catch(e){}
  msgList.scrollTop = msgList.scrollHeight;
      // mark this conversation as read for the employer
      try{ setLastRead(email, viewerEmail, Date.now()); }catch(e){}
    }
    // Update the badge in the sidebar with unread counts across students
    function updateEmployerBadge(){
      try{
        const badge = document.getElementById('navMessagesBadge');
        if(!badge) return;
        const employerName = (window.currentUser && window.currentUser.name) || '';
        const employerEmail = (window.currentUser && window.currentUser.email) || '';
        let total = 0;
        students.forEach(s=>{
          try{
            const msgs = JSON.parse(localStorage.getItem('demoMessages_' + s.email) || '[]');
            const lastRead = getLastRead(s.email, employerEmail) || 0;
            const unreadForConversation = (msgs||[]).filter(m=> m.from !== employerName && m.at > lastRead).length;
            total += unreadForConversation;
          }catch(e){}
        });
        if(total>0){ badge.style.display='inline-block'; badge.textContent = total>99? '99+' : String(total); }
        else badge.style.display='none';
      }catch(e){}
    }
    loadBtn.addEventListener('click', ()=> loadConv());
    // Add a simulate incoming button next to load so demoers can create incoming messages
    try{
      const loadWrapper = loadBtn.parentNode;
      const sim = document.createElement('button'); sim.className='btn btn-outline'; sim.textContent='Simulate incoming';
      sim.style.marginLeft = '6px';
      sim.onclick = ()=>{
        try{
          const email = studentSelect.value; if(!email) return;
          const key = 'demoMessages_' + email;
          let msgs = JSON.parse(localStorage.getItem(key) || '[]');
          const student = students.find(s=> s.email === email) || { name: 'Student' };
          msgs.push({ from: student.name, text: '(simulated) Hello — this is a demo message from the student.', at: Date.now() });
          localStorage.setItem(key, JSON.stringify(msgs));
          showNotification && showNotification('Simulated incoming message', 'info');
        }catch(e){ console.error('simulate incoming failed', e); }
      };
      loadWrapper.insertBefore(sim, loadBtn.nextSibling);
      // Populate-from-students button for employers (force seed conversation with student-originated messages)
      try{
        const pop = document.createElement('button'); pop.className='btn btn-gradient'; pop.textContent = 'Populate from students';
        pop.style.marginLeft = '6px';
        pop.onclick = ()=>{
          try{
            const email = studentSelect.value; if(!email) return;
            const ok = seedStudentsMessagesForStudent(email);
            if(ok){ loadConv(); updateEmployerBadge(); showNotification && showNotification('Populated conversation with student messages', 'info'); }
            else { showNotification && showNotification('Nothing to populate (already present or no demo students)', 'info'); }
          }catch(e){ console.error(e); showNotification && showNotification('Populate failed', 'error'); }
        };
        loadWrapper.insertBefore(pop, sim.nextSibling);
      }catch(e){}
    }catch(e){}
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
      updateEmployerBadge();
    });

    // Keyboard shortcut: Ctrl/Cmd + Enter to submit employer message
    try{
      if(msgInput){
        msgInput.addEventListener('keydown', (ev)=>{
          if((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter'){
            ev.preventDefault();
            msgForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        });
      }
    }catch(e){}

    // Export conversation as plain text for the selected student
    try{
      const emExport = qs('#emExportConversation');
      if(emExport){
        emExport.addEventListener('click', ()=>{
          try{
            const email = studentSelect.value; if(!email) return showNotification && showNotification('Select a student first','error');
            const key = 'demoMessages_' + email;
            const msgs = JSON.parse(localStorage.getItem(key) || '[]') || [];
            const lines = msgs.map(m => `${new Date(m.at).toLocaleString()} — ${m.from}: ${m.text}`);
            const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${email.replace(/@.*/,'')}_conversation.txt`;
            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
            showNotification && showNotification('Conversation exported', 'info');
          }catch(err){ console.error('export failed', err); showNotification && showNotification('Export failed', 'error'); }
        });
      }
    }catch(e){}
    // storage event: refresh conversation if currently viewing that student, update options/panel and update badge
    window.addEventListener('storage', (ev)=>{
      if(!ev.key) return;
      // If messages changed for any student, refresh option badges and employer badge
      if(ev.key.startsWith('demoMessages_') || ev.key.startsWith('demoLastRead_')){
  // refresh options (no suffix), student panel and selected badge
  renderStudentOptions(); renderStudentListPanel(); updateSelectedStudentBadge();
        const selected = studentSelect.value;
        if(ev.key === 'demoMessages_' + selected || ev.key.startsWith('demoLastRead_' + selected)){
          // if the current conversation changed, reload it
          loadConv();
          // flash the last message if it was from the student (incoming)
          try{
            const msgs = JSON.parse(localStorage.getItem('demoMessages_' + selected) || '[]');
            const last = msgs && msgs.length ? msgs[msgs.length-1] : null;
            const me = (window.currentUser && window.currentUser.name) || '';
            if(last && last.from !== me){
              // add flash class to last message element
              const items = msgList.children; if(items && items.length){ const el = items[items.length-1]; el.classList.add('msg-incoming'); setTimeout(()=> el.classList.remove('msg-incoming'), 900); }
            }
          }catch(e){}
        }
        updateEmployerBadge();
      }
    });
    // initial badge update
    updateEmployerBadge();
  }
})();

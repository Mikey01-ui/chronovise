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
    renderStudentOptions();
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
    updateSelectedStudentBadge();
    function getAvatarByName(name){
      try{ const acct = (window.demoAccounts||[]).find(a=> a.name === name || a.email === name); if(acct) return acct.photo || acct.avatarColor || ''; }catch{} return '';
    }
    function loadConv(){
      const email = studentSelect.value;
      const key = 'demoMessages_' + email;
      let msgs = [];
      try{ msgs = JSON.parse(localStorage.getItem(key) || '[]'); }catch{}
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
        bubble.style = `max-width:72%;padding:10px 12px;border-radius:12px;background:${isMine? 'linear-gradient(90deg,#7c3aed,#a78bfa)': 'rgba(255,255,255,0.04)'};color:${isMine? '#fff':'#ddd'};`;
        bubble.innerHTML = `<div style="font-size:13px;margin-bottom:6px;"><strong style="font-weight:600;">${m.from}</strong></div><div>${m.text}</div><div class="muted" style="font-size:11px;margin-top:6px;">${new Date(m.at).toLocaleString()}</div>`;
        if(isMine){
          wrapper.appendChild(bubble);
          if(avatarSrc){ const img=document.createElement('img'); img.src=avatarSrc; img.style='width:36px;height:36px;border-radius:8px;object-fit:cover;'; wrapper.appendChild(img); }
          // show 'Seen' if the student has last-read >= this message time
          try{
            const studentLastRead = getLastRead(email, (email)); // student's own last-read for their view
            if(studentLastRead && studentLastRead >= m.at){ const seen = document.createElement('span'); seen.className='msg-seen'; seen.textContent='Seen'; bubble.appendChild(seen); }
          }catch(e){}
        }else{
          if(avatarSrc){ const img=document.createElement('img'); img.src=avatarSrc; img.style='width:36px;height:36px;border-radius:8px;object-fit:cover;'; wrapper.appendChild(img); }
          wrapper.appendChild(bubble);
        }
        msgList.appendChild(wrapper);
      });
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
    // storage event: refresh conversation if currently viewing that student, update options and update badge
    window.addEventListener('storage', (ev)=>{
      if(!ev.key) return;
      // If messages changed for any student, refresh option badges and employer badge
      if(ev.key.startsWith('demoMessages_') || ev.key.startsWith('demoLastRead_')){
  // refresh options (no suffix) and selected badge
  renderStudentOptions(); updateSelectedStudentBadge();
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

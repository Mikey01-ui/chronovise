  async function loadAllStudents(){
    const students = await apiRequest('/api/students/all');
    const list = qs('#allStudentsList');
    if(!list) return;
    list.innerHTML = '';
    students.forEach(s => {
      const item = document.createElement('div'); item.className = 'list-item';
      item.innerHTML = `<strong>${s.name}</strong> — <span class='muted'>${s.email}</span> <span class='badge'>${s.education}</span> <span class='badge'>${s.location}</span>`;
      list.appendChild(item);
    });
  }
// Student dashboard logic: profile, stats, jobs, applications
(function(){
  const { formatDate, showNotification } = window.dashboardUtils || {};
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  async function loadProfile(){
    const p = await apiRequest('/api/students/profile');
    qs('#profileName').textContent = p.name;
    qs('#profileEdu').textContent = p.education;
    qs('#profileVisa').textContent = p.visa;
    qs('#profileSkills').textContent = (p.skills||[]).join(', ');
    qs('#profileSummary').textContent = p.summary;
    // Enable CV download
    const cvBtn = qs('button[download-cv]');
    if(cvBtn){
      cvBtn.disabled = false;
      cvBtn.onclick = function(){
        const cvText = `CV for ${p.name}\n\nEducation: ${p.education}\nVisa: ${p.visa}\nSkills: ${(p.skills||[]).join(', ')}\nLocation: ${p.location||''}\nSummary: ${p.summary}`;
        const blob = new Blob([cvText], {type:'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${p.name.replace(/\s+/g,'_')}_CV.txt`;
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 500);
      };
    }
  }

  async function loadStats(){
    const s = await apiRequest('/api/students/statistics');
    qs('#statViews').textContent = s.views;
    qs('#statMatches').textContent = s.matches;
    qs('#statInterviews').textContent = s.interviews;
  }

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
      loadAllStudents();
  });
})();

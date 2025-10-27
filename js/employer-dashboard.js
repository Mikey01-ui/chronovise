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
  });
})();

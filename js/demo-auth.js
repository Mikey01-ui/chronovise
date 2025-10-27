// Demo authentication and API mocking for a fully client-side experience
(function(){
  const DEMO_PASSWORD = 'demo123';
  const STORAGE_KEY = 'user';

  function seed(name, i){
    const rand = (min, max) => Math.floor(min + Math.random()*(max-min+1));
    const skillsPool = ['Python','SQL','Excel','React','Node','Figma','Tableau','Java','C++','R','Next.js','TypeScript'];
    const skills = Array.from({length: 4}, ()=> skillsPool[rand(0, skillsPool.length-1)]);
    return {
      id: `${name.toLowerCase()}_${i}`,
      type: name === 'Student' ? 'student' : 'employer',
      email: `${name.toLowerCase()}${i}@demo.cv`,
      name: name === 'Student' ? `Student ${i}` : `Employer ${i}`,
      company: name === 'Employer' ? `Company ${i}` : undefined,
      education: name === 'Student' ? `MSc Program ${1 + (i%3)}` : undefined,
      visa: name === 'Student' ? ['NL','DE','FR','BE'][i%4] : undefined,
      skills,
      avatarColor: ['#7c3aed','#4f46e5','#22d3ee','#10b981'][i%4]
    };
  }

  // Generate a lot of demo students and employers with more realistic data
  const studentNames = [
    'Alice Johnson','Bob Smith','Charlie Lee','Diana Patel','Ethan Brown','Fiona Garcia','George Kim','Hannah Chen','Ivan Martinez','Julia Clark',
    'Kevin Turner','Lily Adams','Mason Wright','Nina Scott','Oscar Evans','Paula Rivera','Quentin Brooks','Rita Foster','Sam Young','Tina Hall',
    'Uma King','Victor Price','Wendy Bell','Xander Fox','Yara Grant','Zane Hughes','Ava Morgan','Ben Reed','Cleo Shaw','Derek Stone',
    'Ella Webb','Finn York','Gina Zane','Henry Cole','Isla Dean','Jack Ford','Kara Gill','Liam Hunt','Mia Irwin','Noah James',
    'Olivia Kent','Peter Lane','Queen Moss','Ryan Nash','Sara Owen','Tom Park','Ursula Quinn','Vera Ross','Will Sims','Zoe Tate'
  ];
  const employerNames = [
    'Acme Corp','Brightify','DataFlow','NovaBits','TechNest','GreenLeaf','BlueSky','RedStone','CloudNine','PeakLogic',
    'Sunrise Ltd','NextGen','PrimeWorks','UrbanEdge','SkyBridge','CoreFusion','SmartPath','Visionary','QuantumLeap','FutureSoft',
    'Hyperion','OmniTech','PulsePoint','Vertex','Zenith','Apex','Momentum','Synergy','Elemental','Infinity'
  ];
  function seedStudent(name, i){
    const rand = (min, max) => Math.floor(min + Math.random()*(max-min+1));
    const skillsPool = ['Python','SQL','Excel','React','Node','Figma','Tableau','Java','C++','R','Next.js','TypeScript','PowerBI','Django','Flask','Vue','Angular','SAS','SPSS','Ruby'];
    const skills = Array.from({length: 5}, ()=> skillsPool[rand(0, skillsPool.length-1)]);
    return {
      id: `student_${i}`,
      type: 'student',
      email: `student${i}@demo.cv`,
      name,
      education: `MSc Program ${1 + (i%4)}`,
      visa: ['NL','DE','FR','BE','IT','ES','SE','FI'][i%8],
      skills,
      avatarColor: ['#7c3aed','#4f46e5','#22d3ee','#10b981','#f59e42','#e11d48','#6366f1','#14b8a6'][i%8],
      summary: `Motivated student with experience in ${skills.slice(0,2).join(' and ')}. Passionate about data and product.`,
      location: ['Amsterdam','Rotterdam','Berlin','Paris','Brussels','Madrid','Stockholm','Helsinki'][i%8],
      company: undefined
    };
  }
  function seedEmployer(name, i){
    return {
      id: `employer_${i}`,
      type: 'employer',
      email: `employer${i}@demo.cv`,
      name,
      company: name,
      avatarColor: ['#7c3aed','#4f46e5','#22d3ee','#10b981','#f59e42','#e11d48','#6366f1','#14b8a6'][i%8],
      education: undefined,
      visa: undefined,
      skills: undefined,
      summary: `Employer in ${name}, seeking top student talent for internships and entry roles.`,
      location: ['Amsterdam','Rotterdam','Berlin','Paris','Brussels','Madrid','Stockholm','Helsinki'][i%8]
    };
  }
  const students = studentNames.map((n,i)=> seedStudent(n,i+1));
  const employers = employerNames.map((n,i)=> seedEmployer(n,i+1));
  const accounts = [...students, ...employers];

  function saveUser(u){ localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); }
  function getUser(){ const raw = localStorage.getItem(STORAGE_KEY); try{ return raw? JSON.parse(raw): null;}catch{ return null; } }
  function clearUser(){ localStorage.removeItem(STORAGE_KEY); }

  async function demoLogin(email, password){
  await delay(300);
  const user = accounts.find(a=> a.email.toLowerCase() === String(email).toLowerCase());
  if(!user) throw new Error('User not found in demo accounts');
  if(password !== DEMO_PASSWORD) throw new Error('Invalid demo password');
  // Encode user info in URL for dashboard
  const userParam = encodeURIComponent(btoa(JSON.stringify(user)));
  const target = user.type === 'student'
    ? `../dashboard/student.html?user=${userParam}`
    : `../dashboard/employer.html?user=${userParam}`;
  location.href = target;
  return user;
  }

  function useRandomDemoAccount(type='any'){
    const pool = type === 'student' ? students : type === 'employer' ? employers : accounts;
    const choice = pool[Math.floor(Math.random()*pool.length)];
    return demoLogin(choice.email, DEMO_PASSWORD);
  }

  function delay(ms){ return new Promise(r=> setTimeout(r, ms)); }

  // Mock API layer
  async function mockApi(endpoint, options={}){
    if(endpoint.includes('/api/students/all')){
      return { ok:true, status:200, data: students };
    }
    if(endpoint.includes('/api/employers/all')){
      return { ok:true, status:200, data: employers };
    }
    await delay(220 + Math.random()*180);
    const user = getUser();
    if(endpoint.includes('/api/auth/me')){
      if(!user) return { ok: false, status: 401, message: 'Not authenticated (demo)'};
      return { ok: true, status: 200, data: user };
    }
    if(endpoint.includes('/api/students/profile')){
      if(!user || user.type !== 'student') return { ok: false, status: 403, message: 'Forbidden' };
      return { ok:true, status:200, data: {
        name: user.name, education: user.education, visa: user.visa, skills: user.skills,
        photo: null, location: 'Amsterdam, NL', summary: 'Curious, fast‑learning student passionate about data and product.'
      }};
    }
    if(endpoint.includes('/api/students/statistics')){
      if(!user || user.type !== 'student') return { ok: false, status: 403 };
      return { ok:true, status:200, data: { views: 120 + Math.floor(Math.random()*200), matches: 8 + Math.floor(Math.random()*9), interviews: 1 + Math.floor(Math.random()*5) } };
    }
    if(endpoint.includes('/api/students/recent-activity')){
      if(!user || user.type !== 'student') return { ok: false, status: 403 };
      return { ok:true, status:200, data: [
        { id:1, type:'match', text:'Matched to Junior Data Analyst at DataFlow', at: new Date().toISOString() },
        { id:2, type:'view', text:'Company viewed your profile', at: new Date(Date.now()-86400000).toISOString() },
        { id:3, type:'apply', text:'Applied to Product Intern at Brightify', at: new Date(Date.now()-2*86400000).toISOString() }
      ] };
    }
    if(endpoint.includes('/api/jobs')){
      const jobs = [
        { id:'j1', title:'Junior Data Analyst', company:'DataFlow', location:'Amsterdam', type:'Hybrid', posted:'3d', salary:'€2.6k–€3.2k', tags:['Python','SQL','Tableau'] },
        { id:'j2', title:'Product Intern', company:'Brightify', location:'Rotterdam', type:'On-site', posted:'1w', salary:'€600/mo', tags:['Figma','Research'] },
        { id:'j3', title:'React Developer (Entry)', company:'NovaBits', location:'Remote (EU)', type:'Remote', posted:'2d', salary:'€2.8k–€3.5k', tags:['React','TypeScript'] },
      ];
      return { ok:true, status:200, data: jobs };
    }
    if(endpoint.includes('/api/students/applications')){
      return { ok:true, status:200, data: [
        { id:'a1', job:'Junior Data Analyst', company:'DataFlow', status:'Under review', appliedAt: new Date(Date.now()-2*86400000).toISOString() },
        { id:'a2', job:'Product Intern', company:'Brightify', status:'Interview', appliedAt: new Date(Date.now()-7*86400000).toISOString() }
      ] };
    }
    if(endpoint.includes('/api/employer/overview')){
      if(!user || user.type !== 'employer') return { ok:false, status:403 };
      return { ok:true, status:200, data: { jobs: 4, applicants: 26, interviews: 5 } };
    }
    if(endpoint.includes('/api/employer/jobs')){
      if(!user || user.type !== 'employer') return { ok:false, status:403 };
      return { ok:true, status:200, data: [
        { id:'e1', title:'Operations Intern', status:'Open', applicants: 12 },
        { id:'e2', title:'React Developer (Entry)', status:'Open', applicants: 7 },
        { id:'e3', title:'Marketing Assistant', status:'Closed', applicants: 19 }
      ] };
    }
    if(endpoint.includes('/api/employer/applications')){
      if(!user || user.type !== 'employer') return { ok:false, status:403 };
      return { ok:true, status:200, data: [
        { id:'ea1', candidate:'Student 3', job:'Operations Intern', status:'New' },
        { id:'ea2', candidate:'Student 9', job:'React Developer (Entry)', status:'Shortlisted' }
      ] };
    }
    return { ok:false, status:404, message:`Endpoint not available in demo: ${endpoint}` };
  }

  // Expose helpers
  window.demoAccounts = accounts;
  window.demoLogin = demoLogin;
  window.useRandomDemoAccount = useRandomDemoAccount;

  // Override apiRequest if present or define it
  window.apiRequest = async function(endpoint, options){
    const res = await mockApi(String(endpoint), options);
    if(!res.ok) throw new Error(res.message || `Demo error ${res.status}`);
    return res.data;
  }
})();

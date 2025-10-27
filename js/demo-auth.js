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
  // 3 demo students with rich information
  const students = [
    {
      id: 'student_1',
      type: 'student',
      email: 'alice.johnson@demo.cv',
      name: 'Alice Johnson',
      education: 'MSc Data Science, TU Delft',
      visa: 'NL',
      skills: ['Python', 'SQL', 'Machine Learning', 'TensorFlow', 'Data Visualization', 'Docker'],
      avatarColor: '#7c3aed',
      summary: 'Alice is a passionate data scientist with experience in predictive modeling, deep learning, and cloud deployment. She has interned at Philips and contributed to open-source ML libraries.',
      location: 'Amsterdam',
      company: undefined,
      github: 'alicejohnson',
      linkedin: 'alice-johnson-ds',
      languages: ['English', 'Dutch'],
      awards: ['Best Thesis Award 2024', 'Kaggle Silver Medalist'],
      interests: ['AI Ethics', 'Robotics', 'Travel']
    },
    {
      id: 'student_2',
      type: 'student',
      email: 'bob.smith@demo.cv',
      name: 'Bob Smith',
      education: 'MSc Computer Science, ETH Zurich',
      visa: 'CH',
      skills: ['Java', 'Spring Boot', 'React', 'AWS', 'Microservices', 'Kubernetes'],
      avatarColor: '#22d3ee',
      summary: 'Bob is a full-stack developer with a focus on scalable web applications and cloud infrastructure. He has worked at Google Zurich and built several open-source tools for DevOps.',
      location: 'Zurich',
      company: undefined,
      github: 'bobsmith',
      linkedin: 'bob-smith-dev',
      languages: ['English', 'German'],
      awards: ['ETH Hackathon Winner', 'AWS Certified Developer'],
      interests: ['Cycling', 'Open Source', 'Cloud Computing']
    },
    {
      id: 'student_3',
      type: 'student',
      email: 'hannah.chen@demo.cv',
      name: 'Hannah Chen',
      education: 'MSc Artificial Intelligence, University of Paris',
      visa: 'FR',
      skills: ['NLP', 'PyTorch', 'French', 'Deep Learning', 'Data Engineering', 'APIs'],
      avatarColor: '#f59e42',
      summary: 'Hannah specializes in natural language processing and multilingual AI systems. She has published research on sentiment analysis and built chatbots for French startups.',
      location: 'Paris',
      company: undefined,
      github: 'hannahchen',
      linkedin: 'hannah-chen-ai',
      languages: ['English', 'French', 'Mandarin'],
      awards: ['AI Research Grant 2025', 'Startup Demo Day Winner'],
      interests: ['Poetry', 'Startups', 'Language Learning']
    }
  ];
  // Keep a few demo employers for completeness
  const employers = [
    {
      id: 'employer_1',
      type: 'employer',
      email: 'hr@brighttech.cv',
      name: 'BrightTech',
      company: 'BrightTech',
      avatarColor: '#4f46e5',
      summary: 'BrightTech is a leading AI startup in Amsterdam, hiring for data science and engineering roles.',
      location: 'Amsterdam'
    },
    {
      id: 'employer_2',
      type: 'employer',
      email: 'talent@cloudnine.cv',
      name: 'CloudNine',
      company: 'CloudNine',
      avatarColor: '#10b981',
      summary: 'CloudNine builds cloud infrastructure and is looking for DevOps and backend engineers.',
      location: 'Zurich'
    }
  ];
  const accounts = [...students, ...employers];

  // Helper: generate a simple SVG avatar data URI with initials and background color
  function makeAvatar(name, color){
    try{
      const initials = (name||'').split(' ').map(n=>n[0]||'').slice(0,2).join('').toUpperCase() || '?';
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='100%' height='100%' fill='${color}'/><text x='50%' y='50%' dy='.08em' text-anchor='middle' fill='white' font-family='Inter, Helvetica, Arial, sans-serif' font-size='96' font-weight='700'>${initials}</text></svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }catch(e){ return null; }
  }

  // Attach generated photo URIs to demo accounts so profile images display when loaded directly
  accounts.forEach(a=>{ a.photo = makeAvatar(a.name, a.avatarColor || '#666'); });

  function saveUser(u){ localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); }
  function getUser(){ const raw = localStorage.getItem(STORAGE_KEY); try{ return raw? JSON.parse(raw): null;}catch{ return null; } }
  function clearUser(){ localStorage.removeItem(STORAGE_KEY); }

  async function demoLogin(email, password){
  await delay(300);
  const user = accounts.find(a=> a.email.toLowerCase() === String(email).toLowerCase());
  if(!user) throw new Error('User not found in demo accounts');
  if(password !== DEMO_PASSWORD) throw new Error('Invalid demo password');
  // Persist the demo user to localStorage so mock API calls see the authenticated user
  try{ saveUser(user); }catch(e){}
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
    await delay(220 + Math.random()*180);
    const user = getUser();
    if(endpoint.includes('/api/auth/me')){
      if(!user) return { ok: false, status: 401, message: 'Not authenticated (demo)'};
      return { ok: true, status: 200, data: user };
    }
    if(endpoint.includes('/api/students/profile')){
      if(!user || user.type !== 'student') return { ok: false, status: 403, message: 'Forbidden' };
      // Return all available fields from the demo student object
      return { ok:true, status:200, data: {
        name: user.name,
        education: user.education,
        visa: user.visa,
        skills: user.skills,
        photo: null,
        location: user.location,
        summary: user.summary,
        github: user.github,
        linkedin: user.linkedin,
        languages: user.languages,
        awards: user.awards,
        interests: user.interests
      }};
    }
    if(endpoint.includes('/api/students/statistics')){
      if(!user || user.type !== 'student') return { ok: false, status: 403 };
      // Provide richer demo statistics for the overview
      return { ok:true, status:200, data: {
        views: 120 + Math.floor(Math.random()*200),
        matches: 8 + Math.floor(Math.random()*9),
        interviews: 1 + Math.floor(Math.random()*5),
        applications: 1 + Math.floor(Math.random()*6),
        profileCompleteness: 70 + Math.floor(Math.random()*30),
        messages: Math.floor(Math.random()*5)
      } };
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

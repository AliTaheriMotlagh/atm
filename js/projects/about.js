import { shuffle, isTouch, hexNum } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { orderGame } from '../games/kit.js';

const project = {
  id: 'about', home: true, name: 'Ali Taheri Motlagh', short: 'Software Engineer', color: '#ffc53d', lang: 'Profile',
  tagline: 'Software Engineer · Senior Frontend Developer · 13+ years building web products, platforms and infrastructure.',
  chips: ['13+ years experience', 'TypeScript', 'Angular', 'NgRx', 'Tehran, Iran'],
  repos: [{ label: 'GitHub', url: 'https://github.com/AliTaheriMotlagh' }, { label: 'Repositories', url: 'https://github.com/AliTaheriMotlagh?tab=repositories' }],
  site: null,
  extraLinks: [
    { k: 'CV', url: 'https://atm-cv.vercel.app' },
    { k: 'LinkedIn', url: 'https://www.linkedin.com/in/alitaherimotlagh/' },
    { k: 'Links', url: 'https://linktr.ee/alanfilm' }
  ],
  tabs: { pitch: 'About', design: 'Experience', tech: 'Skills', docs: 'Education' },
  pitch: {
    line: 'Frontend engineer with more than 13 years of experience across startups, enterprises and large-scale products, with additional backend and DevOps experience.',
    rows: [
      ['Role', 'Software Engineer / Senior Frontend Developer.'],
      ['Location', 'Tehran, Tehran Province, Iran.'],
      ['Focus', 'Creating intuitive, user-friendly products while continuously improving engineering quality, architecture and technical depth.'],
      ['Top skills', 'TypeScript · Angular · NgRx'],
      ['Breadth', 'Frontend, full-stack development, browser graphics, data structures, infrastructure and DevOps.']
    ]
  },
  design: [
    { h: 'Senior Frontend Developer — Farineh Fanavar', items: [
      'Full-time · Jun 2024 – Present · Tehran · On-site.',
      'Angular, Canvas, NgRx, RxJS and tree data structures.',
      'Senior frontend ownership across complex application features and architecture.'
    ] },
    { h: 'Full-stack Developer — Freelance', items: [
      'Freelance · May 2021 – Sep 2024 · Tehran · Remote.',
      'Angular, React.js, Tailwind CSS, NestJS, Next.js, Prisma ORM, MySQL and PostgreSQL.'
    ] },
    { h: 'DevOps Engineer — Bookbal', items: [
      'Full-time · Apr 2020 – Mar 2021 · Tehran Province · On-site.',
      'Implemented infrastructure for a self-hosted web application using Linux, CentOS, Docker, ELK and Git.'
    ] },
    { h: 'Frontend Developer — Shatel', items: [
      'Full-time · May 2016 – Jun 2019 · Tehran · On-site.',
      'AngularJS, Angular, PWA, JavaScript, TypeScript, Node, HTML and CSS.',
      'Built and maintained web frontend experiences and collaborated across product, design and backend teams.'
    ] },
    { h: 'Information Technology Supervisor — Soorati', items: [
      'Full-time · Sep 2015 – Apr 2016 · Iran · On-site.',
      'Built networking infrastructure for 50+ employees with VoIP, Hyper-V, SQL and Windows Server.',
      'Assembled a physical server and deployed the agency web application on it.'
    ] },
    { h: 'Junior Software Engineer — Asan', items: [
      'Full-time · Apr 2012 – Sep 2015 · Tehran · On-site.',
      'WPF, ASP.NET MVC, C#, Entity Framework, SQL and networking.',
      'Worked directly with clients and focused on reliable delivery.'
    ] }
  ],
  tech: {
    stack: [
      ['Frontend', 'Angular, AngularJS, React.js, Next.js, TypeScript, JavaScript, PWA, HTML, SASS, CSS'],
      ['State & architecture', 'NgRx, RxJS, data structures, design patterns, OOP, SDLC, Agile'],
      ['Graphics', 'Canvas, SVG, browser graphics and interactive UI systems'],
      ['Backend & data', 'NestJS, Node.js, Prisma ORM, REST APIs, MySQL, PostgreSQL, SQL, ASP.NET MVC, C#'],
      ['Infrastructure', 'Docker, Linux, CentOS, Nginx, ELK, Git, Windows Server, Hyper-V, VoIP'],
      ['Other', 'WPF, Webpack, Angular CLI, WordPress, Final Cut Pro']
    ],
    numbers: [['13+', 'years engineering'], ['6', 'professional roles'], ['3', 'top skills: TS · Angular · NgRx'], ['2012', 'career start']]
  },
  docs: {
    note: 'Profile information supplied from LinkedIn, captured 30 Sep 2026.',
    steps: [
      { t: 'Education', code: 'Islamic Azad University\nBachelor’s degree — Computer Science\nOct 2012 – Jun 2016' },
      { t: 'Certification', code: 'Developing Microsoft SQL Server 2012/2014 Databases — CanDo\nIssued Nov 2014' },
      { t: 'Certification', code: 'Microsoft Certified Systems Engineer: Security (MCSE) — CanDo\nIssued Nov 2012' }
    ],
    extra: [{ h: 'Professional profile', items: [
      'Experience spans frontend engineering, full-stack product development, DevOps and IT infrastructure.',
      'Primary current strengths are TypeScript, Angular and NgRx.',
      'Portfolio projects emphasize browser-native tools, games, simulations, audio processing and interactive systems.'
    ] }]
  },
  glyph: '🏠',
  // Three challenges. `run(c)` builds the game into c.body (see games/runner.js);
  // `record` keeps a personal best on this device, where `lower` means a smaller score is better.
  games: [
    { key: 'timeline', icon: '🗓️', title: 'Career Timeline', desc: 'Put Ali\'s six roles in order, oldest first. The Experience tab has the answers.', run: gTimeline },
    { key: 'memory', icon: '🧠', title: 'Skill Memory', desc: 'Flip the cards and match all six skill pairs.', run: gMemory, record: { lower: true, fmt: v => `${v} moves` } },
    { key: 'stack', icon: '🧱', title: 'Stack Sorter', desc: 'Send each technology to its layer of the stack. Get 7 of 8 right.', run: gStack }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
function gTimeline(c) {
  const roles = project.design.slice().reverse().map(s => {
    const [role, co] = s.h.split(' — ');
    return { label: `${co} · ${role}`, note: s.items[0].split(' · ')[1] };
  });
  orderGame(c, roles, {
    intro: 'Tap the roles from the first job to the current one.',
    bad: it => `Not yet. ${it.label.split(' · ')[0]} comes later.`,
    win: '13+ years in the right order. You know the story!'
  });
}
function gMemory(c) {
  const faces = [['🔷', 'TypeScript'], ['🅰️', 'Angular'], ['🗃️', 'NgRx'], ['🌊', 'RxJS'], ['🐳', 'Docker'], ['🎨', 'Canvas']];
  const deck = shuffle([...faces, ...faces].map(([e, n]) => ({ e, n })));
  const grid = c.el('div', 'mem'); c.body.append(grid);
  let open = [], matched = 0, moves = 0, lock = false;
  const hideLabel = (b, i) => b.setAttribute('aria-label', `Card ${i + 1}, face down`);
  const cards = deck.map((f, i) => {
    const b = c.el('button', 'card-m'); b.innerHTML = `<span><i>${f.e}</i><small>${f.n}</small></span>`;
    hideLabel(b, i); b.onclick = () => flip(i); grid.append(b); return b;
  });
  function flip(i) {
    const b = cards[i];
    if (lock || c.won || b.classList.contains('open') || b.classList.contains('done')) return;
    b.classList.add('open'); b.setAttribute('aria-label', deck[i].n); open.push(i); sfx.play('tick');
    if (open.length < 2) return;
    moves++; const [x, y] = open; open = [];
    if (deck[x].n === deck[y].n) {
      cards[x].classList.add('done'); cards[y].classList.add('done'); matched++; sfx.tone(600 + matched * 70, 0.12);
      if (matched === faces.length) c.win(`All pairs matched in ${moves} moves!`, moves);
      else c.msg(`${deck[x].n} pair! ${faces.length - matched} to go.`, 'good');
    } else {
      lock = true; c.msg(`Moves: ${moves}`);
      c.after(750, () => { [x, y].forEach(k => { cards[k].classList.remove('open'); hideLabel(cards[k], k); }); lock = false; });
    }
  }
  c.msg('Find the six matching skill pairs.');
}
function gStack(c) {
  const LAYERS = [
    ['Frontend', ['Angular', 'React.js', 'NgRx', 'RxJS', 'SASS', 'PWA', 'Canvas', 'AngularJS']],
    ['Backend & data', ['NestJS', 'Prisma ORM', 'PostgreSQL', 'MySQL', 'ASP.NET MVC', 'Entity Framework']],
    ['Infrastructure', ['Docker', 'Nginx', 'CentOS', 'ELK', 'Hyper-V', 'Windows Server']]
  ];
  const pool = shuffle(LAYERS.flatMap(([, list], li) => list.map(t => ({ t, li })))).slice(0, 8);
  const wrap = c.html('<div class="quiz"><div class="eyebrow">Question <span>1</span> of 8</div><div class="quiz-term"></div><div class="seq-opts"></div></div>');
  const term = wrap.querySelector('.quiz-term'), num = wrap.querySelector('.eyebrow span'), opts = wrap.querySelector('.seq-opts');
  let q = 0, right = 0, busy = false;
  LAYERS.forEach(([name], li) => { const b = c.el('button', 'opt', isTouch ? name : `${li + 1} · ${name}`); b.onclick = () => answer(li); opts.append(b); });
  const show = () => { num.textContent = q + 1; term.textContent = pool[q].t; term.classList.remove('in'); void term.offsetWidth; term.classList.add('in'); };
  function answer(li) {
    if (busy || c.won || q >= pool.length) return;
    const it = pool[q], ok = li === it.li;
    if (ok) { right++; sfx.tone(720, 0.08); c.msg(`Yes, ${it.t} is ${LAYERS[it.li][0].toLowerCase()}.`, 'good'); }
    else c.fail(`${it.t} belongs in ${LAYERS[it.li][0]}.`);
    q++;
    if (q === pool.length) {
      if (right >= 7) c.win(`${right} of 8 correct. Full-stack thinking!`);
      else c.fail(`${right} of 8 correct. You need 7 to clear it. Press Restart.`);
      return;
    }
    busy = true; c.after(ok ? 450 : 1100, () => { busy = false; show(); });
  }
  c.key(e => { const n = +e.key; if (n >= 1 && n <= 3) answer(n - 1); });
  show(); c.msg('Where does each technology live?');
}

/* --- Landmark (local +Z faces the island centre) --- */
function landmark(g, c, { M, mat, tick }) {
  M(new THREE.BoxGeometry(6.4, 4, 6.4), mat(0xf5f6f8), 0, 2, 0, g);
  const roof = M(new THREE.ConeGeometry(5.4, 3.2, 4), mat(0xe0533d), 0, 5.6, 0, g); roof.rotation.y = Math.PI / 4;
  M(new THREE.BoxGeometry(1.5, 2.5, 0.12), mat(0x6b4a2e), 0, 1.25, 3.22, g);
  [-2, 2].forEach(x => M(new THREE.BoxGeometry(1.3, 1.1, 0.12), mat(0x9ee6ff, { emissive: 0x3a8fb0, emissiveIntensity: 0.4 }), x, 2.6, 3.22, g));
  M(new THREE.BoxGeometry(0.9, 1.6, 0.9), mat(0xb44a3a), 1.8, 6.4, -1, g);
  M(new THREE.CylinderGeometry(0.1, 0.12, 9, 8), mat(0xdfe3ea, { metalness: 0.5, roughness: 0.4 }), 4.6, 4.5, 4.6, g);
  const fg = new THREE.PlaneGeometry(2.8, 1.7, 10, 4);
  M(fg, mat(hexNum(c), { side: THREE.DoubleSide }), 6.0, 8.1, 4.6, g);
  const fp = fg.attributes.position, fb = Float32Array.from(fp.array);
  tick(t => {
    for (let i = 0; i < fp.count; i++) { const x = fb[i * 3] + 1.4; fp.array[i * 3 + 2] = Math.sin(x * 2.2 - t * 6) * 0.18 * x; }
    fp.needsUpdate = true;
  });
  return { solidR: 5.2, sign: 11 };
}

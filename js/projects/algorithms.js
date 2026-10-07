import { rnd, shake, hexNum, reduceMotion } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { keepFocus, secs } from '../games/kit.js';
import { GH } from './links.js';

const project = {
  id: 'algorithms', name: 'TS Algorithms', color: '#3178c6', lang: 'TypeScript',
  tagline: 'Classic algorithms and data structures in TypeScript, written as a tutorial.',
  chips: ['Tutorial', '22 implementations', 'Updated 27 May 2024'],
  repos: [{ url: GH + 'typescript-algorithms-and-data-structures' }], site: null,
  pitch: {
    line: 'The fundamentals, typed. Sorting, searching, trees, graphs and classic puzzles in the language you already ship.',
    rows: [
      ['Problem', 'Most algorithm tutorials use Python, Java or C++, which is a hurdle for web developers preparing for interviews.'],
      ['Solution', 'Small, readable TypeScript implementations, one file each, with a test runner.'],
      ['Who it\'s for', 'JavaScript and TypeScript developers learning DSA or preparing for interviews.'],
      ['Status', 'Code only, no website.']
    ]
  },
  design: [
    { h: 'Sorting', items: ['Bubble sort', 'Insertion sort', 'Merge sort', 'Quick sort'] },
    { h: 'Searching', items: ['Linear search', 'Binary search'] },
    { h: 'Data structures', items: ['Linked list, with tail, as a stack (plus a deliberately naive "bad" version)', 'Queue and circular queue', 'Hash table', 'Binary search tree', 'Graph'] },
    { h: 'Math and classic problems', items: ['Factorial, Fibonacci', 'Tower of Hanoi (solving live on this island)', 'Cartesian product', 'Climbing staircase', 'Happy number', 'Maximum subarray'] }
  ],
  tech: {
    stack: [['Language', 'TypeScript (`tsconfig.json`)'], ['Tests', '`test.ts` runner'], ['Editor', 'VS Code settings included']],
    numbers: [['4', 'sorting'], ['2', 'searching'], ['9', 'data structures'], ['7', 'math / puzzles']]
  },
  docs: {
    note: 'If ts-node isn\'t installed, compile with `npx tsc` and run the output with node.',
    steps: [{ t: 'Run the examples', code: 'git clone https://github.com/AliTaheriMotlagh/typescript-algorithms-and-data-structures.git\ncd typescript-algorithms-and-data-structures\nnpm install\nnpx ts-node test.ts' }],
    tree: 'src/\n├─ bubble-sort.ts  insertion-sort.ts  merge-sort.ts  quick-sort.ts\n├─ binary-search.ts  linear-search.ts\n├─ linklist.ts  linklist-with-tail.ts  link-list-stack.ts  link-list-bad.ts\n├─ queue.ts  circular-queue.ts  hash-table.ts\n├─ binary-search-tree.ts  graph.ts\n└─ factorial.ts  fibonacci.ts  tower-of-hanoi.ts  cartesian-product.ts\n   climbing-staircase.ts  happy-number.ts  max-sub-array.ts'
  },
  glyph: '🌳',
  // Three challenges. `run(c)` builds the game into c.body (see games/runner.js);
  // `record` keeps a personal best on this device, where `lower` means a smaller score is better.
  games: [
    { key: 'sort', icon: '🔢', title: 'Sort It', desc: 'Tap the values from smallest to largest.', run: gSort, record: { lower: true, fmt: secs } },
    { key: 'binary', icon: '🔍', title: 'Binary Search', desc: 'Find the hidden number from 1 to 64 in 7 guesses or fewer.', run: gBinary, record: { lower: true, fmt: v => `${v} guesses` } },
    { key: 'hanoi', icon: '🗼', title: 'Tower of Hanoi', desc: 'Move the tower to the right-hand peg. A bigger disk never sits on a smaller one.', run: gHanoi, record: { lower: true, fmt: v => `${v} moves` } }
  ],
  landmark
};
export default project;

/* --- Challenges --- */
function gSort(c) {
  const nums = []; while (nums.length < 6) { const n = rnd(1, 99); if (!nums.includes(n)) nums.push(n); }
  const sorted = nums.slice().sort((a, b) => a - b);
  const wrap = c.el('div', 'sort-game'), row = c.el('div', 'sort-row'), out = c.el('div', 'sort-out', 'Sorted: …');
  let step = 0, t0 = 0;
  nums.forEach(n => {
    const b = c.el('button', 'sort-num', n);
    b.onclick = () => {
      if (c.won) return;
      if (!t0) t0 = performance.now();
      if (n !== sorted[step]) { shake(b); c.fail('Not yet: pick the smallest remaining value.'); return; }
      b.classList.add('used'); b.disabled = true; keepFocus(b, row);
      out.textContent = 'Sorted: ' + sorted.slice(0, ++step).join(', '); sfx.tone(380 + step * 70, 0.07);
      if (step === sorted.length) { const s = (performance.now() - t0) / 1000; c.win(`Sorted in ${s.toFixed(1)} s. That's selection sort!`, s); }
    };
    row.append(b);
  });
  wrap.append(row, out); c.body.append(wrap);
  c.msg('Selection sort: always take the smallest remaining value.');
}
function gBinary(c) {
  const N = 64, MAX = 7, secret = rnd(1, N);
  let lo = 1, hi = N, guesses = 0;
  const wrap = c.el('div', 'w-game'), grid = c.el('div', 'bin'), dots = c.el('div', 'dots');
  dots.innerHTML = '<i></i>'.repeat(MAX); wrap.append(grid, dots); c.body.append(wrap);
  const cells = Array.from({ length: N }, (_, k) => { const b = c.el('button', '', k + 1); b.onclick = () => guess(k + 1); grid.append(b); return b; });
  function guess(n) {
    if (c.won || guesses >= MAX || n < lo || n > hi) return;
    guesses++; dots.children[guesses - 1].classList.add('on'); sfx.play('tick');
    if (n === secret) { cells[n - 1].classList.add('hit'); c.win(`Found ${secret} in ${guesses} ${guesses === 1 ? 'guess' : 'guesses'}. O(log n) in action!`, guesses); return; }
    if (n < secret) lo = n + 1; else hi = n - 1;
    const focused = document.activeElement;
    cells.forEach((b, k) => { const out = k + 1 < lo || k + 1 > hi; b.classList.toggle('out', out); b.disabled = out; });
    if (focused && focused.disabled) cells[Math.floor((lo + hi) / 2) - 1].focus({ preventScroll: true });
    if (guesses >= MAX) { cells.forEach(b => (b.disabled = true)); cells[secret - 1].classList.add('hit'); c.fail(`Out of guesses, it was ${secret}. Tip: always pick the middle of what's left.`); return; }
    c.msg(`${n} is too ${n < secret ? 'low' : 'high'}. It's between ${lo} and ${hi}. ${MAX - guesses} left.`);
  }
  c.msg(`I'm thinking of a number from 1 to ${N}. You have ${MAX} guesses.`);
}
function gHanoi(c) {
  const pegs = [[3, 2, 1], [], []], cols = [c.p.color, '#4f93e0', '#86bff5'];
  const wrap = c.el('div', 'w-game'), board = c.el('div', 'hanoi'), info = c.el('div', 'count', 'Moves: 0 · minimum 7');
  wrap.append(board, info); c.body.append(wrap);
  let sel = -1, moves = 0;
  const btns = pegs.map((_, i) => { const b = c.el('button', 'peg'); b.onclick = () => pick(i); board.append(b); return b; });
  const paint = () => btns.forEach((b, i) => {
    b.innerHTML = pegs[i].map(d => `<i class="disk" style="width:${25 + d * 22}%;background:${cols[3 - d]}"></i>`).join('');
    b.classList.toggle('sel', i === sel);
    b.setAttribute('aria-label', `Peg ${i + 1}: ${pegs[i].length ? 'disks ' + pegs[i].join(', ') : 'empty'}${i === sel ? ', lifted' : ''}`);
  });
  function pick(i) {
    if (c.won) return;
    if (sel < 0) { if (pegs[i].length) { sel = i; sfx.play('tick'); paint(); } return; }
    if (i === sel) { sel = -1; paint(); return; }
    const d = pegs[sel][pegs[sel].length - 1], top = pegs[i][pegs[i].length - 1];
    if (top && top < d) { shake(btns[i]); c.fail('A bigger disk can\'t sit on a smaller one.'); return; }
    pegs[i].push(pegs[sel].pop()); sel = -1; moves++; sfx.tone(300 + pegs[i].length * 90, 0.08); paint();
    info.textContent = `Moves: ${moves} · minimum 7`;
    if (pegs[2].length === 3) c.win(moves === 7 ? 'Solved in the minimum 7 moves: 2ⁿ − 1!' : `Solved in ${moves} moves. The minimum is 7.`, moves);
  }
  paint(); c.msg('Tap a peg to lift its top disk, then tap where to drop it.');
}

/* --- Landmark (local +Z faces the island centre) --- */
function landmark(g, c, { M, mat, tick }) {
  const C = hexNum(c);
  M(new THREE.BoxGeometry(15, 1, 6.5), mat(0x1f2a40), 0, 0.5, 0, g);
  M(new THREE.BoxGeometry(15.4, 0.3, 6.9), mat(C), 0, 0.15, 0, g);
  const PX = [-4.8, 0, 4.8], DH = 0.6, BASE = 1.25;
  PX.forEach(x => { M(new THREE.CylinderGeometry(2.4, 2.4, 0.2, 24), mat(0x33425e), x, 1.1, 0, g); M(new THREE.CylinderGeometry(0.25, 0.25, 4.4, 10), mat(0xe8edf5), x, 3.2, 0, g); });
  const radii = [2.1, 1.7, 1.3, 0.9], cols = [C, 0x4f93e0, 0x86bff5, 0xffc53d];
  const disks = radii.map((r, i) => M(new THREE.CylinderGeometry(r, r, DH, 28), mat(cols[i]), 0, 0, 0, g));
  const stacks = [[0, 1, 2, 3], [], []];
  const place = () => stacks.forEach((s, pi) => s.forEach((d, lvl) => disks[d].position.set(PX[pi], BASE + DH / 2 + lvl * DH, 0)));
  place();
  let moves = [], from = 0, mi = 0, mt = 0, pause = 1.2;
  const plan = (n, a, b, c2, out) => { if (!n) return out; plan(n - 1, a, c2, b, out); out.push([a, b]); plan(n - 1, c2, b, a, out); return out; };
  const nextRun = () => { const to = (from + 1) % 3; moves = plan(4, from, to, 3 - from - to, []); from = to; mi = 0; mt = 0; };
  nextRun();
  tick((t, dt) => {
    if (reduceMotion) return;
    if (pause > 0) { pause -= dt; return; }
    const [a, b] = moves[mi]; const d = stacks[a][stacks[a].length - 1], disk = disks[d];
    mt += dt / 0.75;
    const y0 = BASE + DH / 2 + (stacks[a].length - 1) * DH, y1 = BASE + DH / 2 + stacks[b].length * DH, top = 6.4;
    if (mt < 0.3) disk.position.set(PX[a], y0 + (top - y0) * (mt / 0.3), 0);
    else if (mt < 0.7) disk.position.set(PX[a] + (PX[b] - PX[a]) * ((mt - 0.3) / 0.4), top, 0);
    else if (mt < 1) disk.position.set(PX[b], top + (y1 - top) * ((mt - 0.7) / 0.3), 0);
    else {
      stacks[b].push(stacks[a].pop()); place(); mt = 0; mi++;
      if (mi >= moves.length) { nextRun(); pause = 1.8; }
    }
  });
  return { solidR: 8.6, sign: 10 };
}

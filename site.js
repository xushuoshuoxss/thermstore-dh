/* ThermStore-DH — small interactions: header, menu, season scene, cycling figures, scroll reveals, counters */
(() => {
  const d = document;
  d.documentElement.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // header: two rows at the top, one compact row once scrolled
  const header = d.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  const toggle = d.querySelector('.nav-toggle'), nav = d.getElementById('nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // hero: summer <-> winter scene, with the three steps lit up to match
  const hero = d.querySelector('.hero');
  const scene = d.querySelector('.scene');
  if (scene) {
    const NS = 'http://www.w3.org/2000/svg';
    const snow = scene.querySelector('.snow'), stars = scene.querySelector('.stars');
    for (let i = 0; i < 48; i++) {
      const c = d.createElementNS(NS, 'circle');
      c.setAttribute('cx', (Math.random() * 1200).toFixed(0));
      c.setAttribute('cy', (-10 - Math.random() * 20).toFixed(0));
      c.setAttribute('r', (1.4 + Math.random() * 2.4).toFixed(1));
      c.style.animationDuration = (5 + Math.random() * 6).toFixed(1) + 's';
      c.style.animationDelay = (-Math.random() * 11).toFixed(1) + 's';
      c.style.opacity = (0.55 + Math.random() * 0.45).toFixed(2);
      snow.appendChild(c);
    }
    for (let i = 0; i < 26; i++) {
      const c = d.createElementNS(NS, 'circle');
      c.setAttribute('cx', (Math.random() * 1200).toFixed(0));
      c.setAttribute('cy', (12 + Math.random() * 150).toFixed(0));
      c.setAttribute('r', (0.8 + Math.random() * 1.2).toFixed(1));
      c.style.animationDelay = (-Math.random() * 3).toFixed(1) + 's';
      stars.appendChild(c);
    }

    // when the picture is cropped (narrow screens), pan to the city in winter
    const svg = scene.querySelector(':scope > svg');
    const fit = () => {
      const w = svg.clientWidth, h = svg.clientHeight;
      const visible = Math.min(1200, (w * 520) / h);
      scene.style.setProperty('--pan', -(1200 - visible).toFixed(0) + 'px');
    };
    fit();
    window.addEventListener('resize', fit);

    const buttons = scene.querySelectorAll('[data-set]');
    const play = scene.querySelector('.play');
    let timer = null, auto = !reduce;
    const set = (s) => {
      scene.dataset.season = s;
      if (hero) hero.dataset.season = s;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.set === s)));
    };
    const next = () => set(scene.dataset.season === 'summer' ? 'winter' : 'summer');
    const start = () => { clearInterval(timer); timer = setInterval(next, 7500); auto = true; play.classList.remove('paused'); play.setAttribute('aria-label', 'Pause animation'); };
    const stop = () => { clearInterval(timer); auto = false; play.classList.add('paused'); play.setAttribute('aria-label', 'Play animation'); };
    buttons.forEach((b) => b.addEventListener('click', () => { stop(); set(b.dataset.set); }));
    play.addEventListener('click', () => { if (auto) stop(); else { next(); start(); } });
    // start empty (winter) and fill up, so the first thing visitors see is the store charging
    setTimeout(() => { set('summer'); auto ? start() : stop(); }, 400);
  }

  // figures that alternate between two states (summer/winter, today/with storage) while on screen
  d.querySelectorAll('.cycle').forEach((fig) => {
    const states = (fig.dataset.states || '').split(' ').filter(Boolean);
    if (states.length < 2) return;
    const chips = fig.querySelectorAll('[data-set]');
    const period = (parseFloat(getComputedStyle(fig).getPropertyValue('--period')) || 5) * 1000;
    const first = parseInt(fig.dataset.first || '700', 10);
    let timer = null, wait = null, manual = false, started = false;
    const set = (s) => {
      fig.dataset.state = s;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.set === s)));
    };
    const next = () => set(states[(states.indexOf(fig.dataset.state) + 1) % states.length]);
    const loop = () => { fig.classList.remove('auto'); void fig.offsetWidth; fig.classList.add('auto'); timer = setInterval(next, period); };
    const start = () => {
      if (manual || reduce || timer || wait) return;
      if (!started) {
        // the first switch shows the change the figure is about
        started = true;
        wait = setTimeout(() => { wait = null; next(); loop(); }, first);
        return;
      }
      loop();
    };
    const stop = () => { clearInterval(timer); clearTimeout(wait); timer = wait = null; fig.classList.remove('auto'); };
    chips.forEach((c) => c.addEventListener('click', () => { manual = true; stop(); set(c.dataset.set); }));
    if (!reduce) {
      // begin in the first state without animating
      fig.classList.add('init');
      set(states[0]);
      requestAnimationFrame(() => requestAnimationFrame(() => fig.classList.remove('init')));
    }
    new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) start();
      else { if (wait) started = false; stop(); }
    }), { threshold: 0.35 }).observe(fig);
  });

  // reveal on scroll
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15 });
  d.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // count-up numbers
  const cio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target; cio.unobserve(el);
    const end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10);
    const pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    if (reduce) { el.textContent = pre + end.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1500;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (end * k).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  d.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));
})();

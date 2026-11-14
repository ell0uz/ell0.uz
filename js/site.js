(() => {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- animated starfield background ---------- */
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  let W = 0,
    H = 0,
    stars = [],
    meteors = [];
  const mouse = { x: 0.5, y: 0.5 };
  const card = document.querySelector('.about-inner');
  let skyProgress = 0;
  let lastSkyFrameTime = 0;
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  let accentRgb = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-rgb')
    .trim();
  function updateThemeControl() {
    const lightTheme = document.documentElement.dataset.theme === 'light';
    themeLabel.textContent = lightTheme ? 'Dark' : 'Light';
    themeIcon.textContent = lightTheme ? 'dark_mode' : 'light_mode';
    themeToggle.setAttribute('aria-label', 'Switch to ' + (lightTheme ? 'dark' : 'light') + ' mode');
    themeToggle.setAttribute('aria-pressed', String(lightTheme));
  }
  function updateThemeColor() {
    if (!themeColorMeta) return;
    themeColorMeta.content =
      getComputedStyle(document.body).getPropertyValue('--md-sys-color-background').trim();
  }
  function updateAccentColor() {
    accentRgb = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent-rgb')
      .trim();
  }
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    updateThemeControl();
    updateAccentColor();
    updateThemeColor();
    try {
      window.localStorage.setItem('site-theme', theme);
    } catch (error) {
      console.warn('Could not save the theme preference.', error);
    }
    if (RM) draw(performance.now());
  }
  updateThemeControl();
  updateAccentColor();
  updateThemeColor();
  themeToggle.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
  });
  const targetCount = () => {
    const base = Math.min(260, Math.round((W * H) / 8000));
    return document.body.classList.contains('scrolled')
      ? Math.min(420, Math.round(base * 1.7))
      : base;
  }; // scrolled page gets a denser sky
  function makeStar() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.3 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.06,
      depth: 0.3 + Math.random() * 0.7,
      warm: Math.random() < 0.12,
    };
  }
  function seed() {
    stars = Array.from({ length: targetCount() }, makeStar);
  }
  /* Resize keeps the stars where they are: positions rescale proportionally into the
     new viewport instead of reseeding. (iOS Safari fires resize when the URL bar hides,
     which used to reshuffle the whole sky.) CSS size updates instantly; the bitmap
     rescale is debounced so resize storms don't thrash. */
  let resizeTimer = null;
  function applyResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const oldW = W,
      oldH = H;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (oldW > 0 && oldH > 0 && stars.length) {
      const sx = W / oldW,
        sy = H / oldH;
      for (const s of stars) {
        s.x = Math.min(Math.max(s.x * sx, -4), W + 4);
        s.y = Math.min(Math.max(s.y * sy, -4), H + 4);
      }
      const n = targetCount();
      while (stars.length < n) stars.push(makeStar());
      if (stars.length > n) stars.length = n;
    } else {
      seed();
    }
    if (RM) draw(performance.now()); // reduced-motion renders a single frame per state change (e.g. after resize)
  }
  function resize() {
    if (!W) {
      applyResize();
      return;
    } // first paint: immediate
    canvas.style.width = window.innerWidth + 'px'; // CSS size follows instantly…
    canvas.style.height = window.innerHeight + 'px';
    clearTimeout(resizeTimer); // …bitmap rescale is debounced
    resizeTimer = setTimeout(applyResize, 150);
  }
  function spawnMeteor() {
    const dir = Math.random() < 0.5 ? 1 : -1;
    meteors.push({
      x: W * (0.15 + Math.random() * 0.7),
      y: Math.random() * H * 0.3,
      vx: dir * (6 + Math.random() * 5),
      vy: 3 + Math.random() * 2.5,
      life: 1,
    });
  }
  let meteorTimer = 2200;
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const px = mouse.x - 0.5,
      py = mouse.y - 0.5;
    const lightTheme = document.documentElement.dataset.theme === 'light';
    const targetSkyProgress = document.body.classList.contains('scrolled') ? 1 : 0;
    const frameTime = lastSkyFrameTime ? Math.min(t - lastSkyFrameTime, 100) : 16;
    lastSkyFrameTime = t;
    const blend = RM ? 1 : 1 - Math.exp(-frameTime / 220);
    skyProgress += (targetSkyProgress - skyProgress) * blend;
    const aggro = 1 + 1.5 * skyProgress;
    const baseStarCount = Math.min(260, Math.round((W * H) / 8000));
    const points = stars.map((star, index) => ({
      star,
      x: star.x + px * 26 * star.depth,
      y: star.y + py * 26 * star.depth,
      opacity: index >= baseStarCount ? skyProgress : 1,
    }));
    const linkDistance = 96 + 24 * skyProgress;
    const linkDistanceSquared = linkDistance * linkDistance;
    const maxLinkOpacity = 0.2 + 0.06 * skyProgress;
    const linkBuckets = [[], [], [], [], [], []];
    for (let i = 0; i < points.length; i++) {
      const start = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const end = points[j];
        const dx = start.x - end.x;
        const dy = start.y - end.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared >= linkDistanceSquared) continue;
        const distance = Math.sqrt(distanceSquared);
        const opacity =
          maxLinkOpacity *
          (1 - distance / linkDistance) *
          Math.min(start.opacity, end.opacity);
        if (opacity < 0.01) continue;
        const bucket = Math.min(
          linkBuckets.length - 1,
          Math.floor((opacity / maxLinkOpacity) * linkBuckets.length),
        );
        linkBuckets[bucket].push(start, end);
      }
    }
    ctx.strokeStyle = 'rgb(' + accentRgb + ')';
    ctx.lineWidth = 0.75;
    ctx.lineCap = 'round';
    for (let bucket = 0; bucket < linkBuckets.length; bucket++) {
      const links = linkBuckets[bucket];
      if (!links.length) continue;
      ctx.globalAlpha = (maxLinkOpacity * (bucket + 0.5)) / linkBuckets.length;
      ctx.beginPath();
      for (let i = 0; i < links.length; i += 2) {
        ctx.moveTo(links[i].x, links[i].y);
        ctx.lineTo(links[i + 1].x, links[i + 1].y);
      }
      ctx.stroke();
    }
    for (const point of points) {
      const s = point.star;
      const normalTwinkle =
        0.35 + 0.65 * Math.abs(Math.sin(t * 0.001 * s.speed + s.phase));
      const scrolledTwinkle =
        0.3 + 0.7 * Math.abs(Math.sin(t * 0.002 * s.speed + s.phase));
      const tw = normalTwinkle + (scrolledTwinkle - normalTwinkle) * skyProgress;
      ctx.globalAlpha = tw * point.opacity;
      ctx.fillStyle = lightTheme
        ? s.warm
          ? 'rgb(' + accentRgb + ')'
          : '#193745'
        : s.warm
          ? 'rgb(' + accentRgb + ')'
          : '#f4f6fa';
      ctx.beginPath();
      const scrolledRadius = Math.max(s.r * 1.35, 0.65);
      ctx.arc(
        point.x,
        point.y,
        s.r + (scrolledRadius - s.r) * skyProgress,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      if (!RM) {
        s.x += s.vx * aggro;
        s.y += s.vy * aggro;
        if (s.x < -4) s.x = W + 4;
        else if (s.x > W + 4) s.x = -4;
        if (s.y < -4) s.y = H + 4;
        else if (s.y > H + 4) s.y = -4;
      }
    }
    if (!RM) {
      meteorTimer -= 16;
      if (meteorTimer <= 0) {
        spawnMeteor();
        meteorTimer = 3500 + Math.random() * 5500;
      }
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life -= 0.012;
      if (m.life <= 0 || m.y > H + 40) {
        meteors.splice(i, 1);
        continue;
      }
      const mc = accentRgb;
      const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 12, m.y - m.vy * 12);
      g.addColorStop(0, 'rgba(' + mc + ',' + (0.9 * m.life).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + mc + ',0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 12, m.y - m.vy * 12);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (!RM) requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX / Math.max(W, 1);
    mouse.y = e.clientY / Math.max(H, 1);
    if (!card || RM || e.pointerType === 'touch') return;
    const rect = card.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(rect.width, 1)));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / Math.max(rect.height, 1)));
    card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    card.style.setProperty('--rx', ((0.5 - y) * 2.4).toFixed(2) + 'deg');
    card.style.setProperty('--ry', ((x - 0.5) * 3).toFixed(2) + 'deg');
  });
  if (card) {
    card.addEventListener('pointerenter', () => card.classList.add('spotlight-active'));
    card.addEventListener('pointerleave', () =>
      card.classList.remove('spotlight-active'),
    );
    card.addEventListener('pointerdown', (e) => {
      if (RM || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const rect = card.getBoundingClientRect();
      const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
      const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
      card.style.setProperty('--press-x', x.toFixed(1) + 'px');
      card.style.setProperty('--press-y', y.toFixed(1) + 'px');
      card.classList.remove('pressing');
      void card.offsetWidth;
      card.classList.add('pressing');
    });
    card.addEventListener('animationend', (e) => {
      if (e.animationName === 'screenPress') card.classList.remove('pressing');
    });
  }
  resize();
  requestAnimationFrame(draw);

  /* ---------- rotating texts, bottom of center ---------- */
  const texts = [
    /* Delay the texts thing */
    '',
    'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.',
    'this is my domain dont ya know!!',
    '🇺🇿',
    'wip',
    'Bess site',
    'yea this thing better shut up',
    '',
    '',
  ];
  const textEl = document.getElementById('text');
  let ji = 0,
    timer = null;
  function next() {
    ji = (ji + 1) % texts.length;
    const h0 = textEl.offsetHeight; // height of the current text
    textEl.classList.add('swap'); // fade/slide out
    setTimeout(() => {
      textEl.textContent = texts[ji];
      const h1 = textEl.offsetHeight; // natural height of the new text
      textEl.classList.remove('swap'); // fade/slide in
      if (RM) return;
      // animate the height from old to new so line-count changes glide
      textEl.style.height = h0 + 'px';
      void textEl.offsetHeight; // force reflow
      textEl.style.height = h1 + 'px';
      setTimeout(() => {
        textEl.style.height = '';
      }, 500); // release to auto
    }, 450);
  }
  function arm() {
    clearInterval(timer);
    if (!RM) timer = setInterval(next, 6000);
  }
  textEl.textContent = texts[0];
  textEl.addEventListener('click', () => {
    next();
    arm();
  });
  textEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      next();
      arm();
    }
  });
  arm();

  /* ---------- free the letters for hover after entrance ---------- */
  document
    .querySelectorAll('.ltr')
    .forEach((el) =>
      el.addEventListener('animationend', () => el.classList.add('settled'), { once: true }),
    );

  /* ---------- the "0" flickers like a broken lamp: randomized WAAPI bursts ----------
     Each burst = random opacity keyframes + random duration + random easing per
     segment, chained via onfinish, so no two flickers are ever the same. */
  const lamp = document.getElementById('lamp');
  const EASINGS = [
    'ease-in-out',
    'ease-out',
    'ease-in',
    'linear',
    'cubic-bezier(.6,0,.9,.4)',
    'steps(2,end)',
    'steps(3,end)',
  ];
  const randEasing = () => EASINGS[Math.floor(Math.random() * EASINGS.length)];
  function lampFlicker() {
    if (RM) return;
    if (Math.random() < 0.55) {
      // steady stretch
      setTimeout(lampFlicker, 200 + Math.random() * 1200);
      return;
    }
    const n = 2 + Math.floor(Math.random() * 4); // burst length
    const kf = [{ opacity: 1, easing: randEasing() }];
    for (let k = 0; k < n; k++) {
      kf.push({
        opacity: +(
          Math.random() < 0.5 ? 0.05 + Math.random() * 0.3 : 0.5 + Math.random() * 0.5
        ).toFixed(2),
      });
    }
    kf.push({ opacity: 1 });
    const anim = lamp.animate(kf, {
      duration: 120 + Math.random() * 450,
      easing: 'ease-in-out',
      fill: 'none',
    });
    anim.onfinish = () => lampFlicker();
  }
  setTimeout(lampFlicker, 1700); // start after the entrance fade

  /* ---------- the two "l"s flicker as well — same randomized WAAPI bursts, but each letter
     runs its own independent loop with a staggered start, so they never flicker in sync ---------- */
  document.querySelectorAll('.ltr.flicker').forEach((el, idx) => {
    function lFlicker() {
      if (RM) return;
      if (Math.random() < 0.55) {
        // steady stretch
        setTimeout(lFlicker, 200 + Math.random() * 1200);
        return;
      }
      const n = 2 + Math.floor(Math.random() * 4); // burst length
      const kf = [{ opacity: 1, easing: randEasing() }];
      for (let k = 0; k < n; k++) {
        kf.push({
          opacity: +(
            Math.random() < 0.5 ? 0.05 + Math.random() * 0.3 : 0.5 + Math.random() * 0.5
          ).toFixed(2),
        });
      }
      kf.push({ opacity: 1 });
      const anim = el.animate(kf, {
        duration: 120 + Math.random() * 450,
        easing: 'ease-in-out',
        fill: 'none',
      });
      anim.onfinish = () => lFlicker();
    }
    setTimeout(lFlicker, 1700 + idx * 700 + Math.random() * 900);
  });

  /* ---------- scroll cue: hide once the hero is scrolled past ---------- */
  const cue = document.querySelector('.scroll-cue');
  const about = document.getElementById('about');
  const onScroll = () => {
    cue.classList.toggle('hide', window.scrollY > window.innerHeight * 0.35);
    // Light mode brings back the aqua scroll palette; the starfield also fades into its scrolled state.
    const scrolled = about.offsetTop < window.scrollY + window.innerHeight * 0.55;
    document.body.classList.toggle('scrolled', scrolled);
    document.documentElement.dataset.scrolled = String(scrolled);
    updateThemeColor();
    if (scrolled) {
      const n = targetCount();
      while (stars.length < n) stars.push(makeStar());
    } // sky thickens the moment we scroll down
    if (RM) draw(performance.now());
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- about: reveal from the bottom on scroll, headers first, then paragraphs ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (RM) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    revealEls.forEach((el) => io.observe(el));
  }
})();

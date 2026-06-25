// 交互特效：在首次加载与每次 View Transition 后调用 initEffects()。
// 全程尊重 prefers-reduced-motion，并对触屏设备优雅降级。

const prefersReduce = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = () =>
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- 1. 自定义磁吸光标（仅桌面，初始化一次） ----------
function initCursor() {
  if ((window as any).__cursorInit) return;
  const dot = document.querySelector<HTMLElement>('.cursor-dot');
  if (!dot || !canHover() || prefersReduce()) {
    dot?.remove();
    return;
  }
  (window as any).__cursorInit = true;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;

  window.addEventListener(
    'pointermove',
    (e) => {
      tx = e.clientX;
      ty = e.clientY;
    },
    { passive: true }
  );

  function render() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    dot!.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  // hover 可交互元素时光标放大
  document.addEventListener('pointerover', (e) => {
    const el = (e.target as HTMLElement)?.closest('a, button, .card, input, select');
    dot!.classList.toggle('grow', !!el);
  });
}

// ---------- 2. 3D 聚光灯倾斜卡片（仅 hover 设备） ----------
function initTilt() {
  const cards = document.querySelectorAll<HTMLElement>('.card:not([data-tilt-bound])');
  const tiltOn = canHover() && !prefersReduce();

  cards.forEach((card) => {
    card.dataset.tiltBound = 'true';
    if (!tiltOn) return;

    card.addEventListener(
      'pointermove',
      (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (0.5 - py) * 8; // 上下倾斜角
        const ry = (px - 0.5) * 10; // 左右倾斜角
        card.style.setProperty('--rx', `${rx}deg`);
        card.style.setProperty('--ry', `${ry}deg`);
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.classList.add('tilting');
      },
      { passive: true }
    );

    card.addEventListener('pointerleave', () => {
      card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

// ---------- 3. 滚动浮现（IntersectionObserver，移动端可靠） ----------
function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('.reveal:not([data-revealed])');
  if (prefersReduce()) {
    items.forEach((el) => {
      el.dataset.revealed = 'true';
      el.classList.add('in-view');
    });
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  items.forEach((el, i) => {
    el.dataset.revealed = 'true';
    el.style.setProperty('--reveal-delay', `${Math.min(i * 45, 360)}ms`);
    io.observe(el);
  });
}

// ---------- 4. 数字滚动（votes 进视口时从 0 滚到目标） ----------
function initCountUp() {
  const nums = document.querySelectorAll<HTMLElement>('[data-count]:not([data-counted])');
  nums.forEach((el) => {
    el.dataset.counted = 'true';
    const target = Number(el.dataset.count ?? '0');
    if (prefersReduce() || target <= 0) {
      el.textContent = String(target);
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        const dur = 900;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    });
    io.observe(el);
  });
}

// ---------- 5. 陀螺仪体感倾斜（移动端）----------
// 让卡片墙与背景随手机倾斜实时摆动。iOS 需用户点按授权，安卓直接生效。
function initGyro() {
  if ((window as any).__gyroInit) return;
  (window as any).__gyroInit = true;

  const btn = document.querySelector<HTMLButtonElement>('.gyro-btn');
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const supported = typeof window.DeviceOrientationEvent !== 'undefined';

  if (!isTouch || !supported || prefersReduce()) {
    btn?.remove();
    return;
  }

  const root = document.documentElement;
  let gx = 0;
  let gy = 0;
  let tgx = 0;
  let tgy = 0;
  let running = false;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  function onOrient(e: DeviceOrientationEvent) {
    const gamma = e.gamma ?? 0; // 左右倾斜 -90..90
    const beta = e.beta ?? 0; // 前后倾斜 -180..180（竖握时约 45）
    tgy = clamp(gamma, -22, 22) * 0.35; // rotateY，最大约 8deg
    tgx = clamp(beta - 50, -24, 24) * -0.25; // rotateX
  }

  function render() {
    if (!running) return;
    gx += (tgx - gx) * 0.12;
    gy += (tgy - gy) * 0.12;
    root.style.setProperty('--gx', `${gx.toFixed(2)}deg`);
    root.style.setProperty('--gy', `${gy.toFixed(2)}deg`);
    root.style.setProperty('--px', `${(gy * 0.8).toFixed(2)}px`);
    root.style.setProperty('--py', `${(gx * -0.8).toFixed(2)}px`);
    requestAnimationFrame(render);
  }

  function start() {
    if (running) return;
    running = true;
    root.classList.add('gyro-on');
    window.addEventListener('deviceorientation', onOrient, { passive: true });
    requestAnimationFrame(render);
    if (btn) btn.hidden = true;
  }

  // iOS 13+：必须在用户手势中调用 requestPermission
  const needsPerm =
    typeof (window.DeviceOrientationEvent as any).requestPermission === 'function';

  if (needsPerm) {
    if (btn) {
      btn.hidden = false;
      btn.addEventListener('click', async () => {
        try {
          const state = await (window.DeviceOrientationEvent as any).requestPermission();
          if (state === 'granted') start();
          else if (btn) btn.textContent = '体感被拒绝（去设置开启）';
        } catch {
          if (btn) btn.hidden = true;
        }
      });
    }
  } else {
    // 安卓等无需授权，直接开启
    start();
  }
}

export function initEffects() {
  initCursor();
  initTilt();
  initReveal();
  initCountUp();
  initGyro();
}

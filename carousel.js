/* 사진 넘기기(슬라이드) — 홈과 절 소개가 함께 씁니다.
   - 5초마다 왼쪽으로 한 장씩 넘어가고, 사진 아래 가운데의 작은 점과 좌우 화살표로도 넘길 수 있습니다.
   - 마지막 사진 다음에는 처음 사진이 이어서 왼쪽으로 들어옵니다.
   - 마우스를 올리거나 키보드로 머무는 동안은 멈추고, 휴대폰에서는 손가락으로 밀어 넘길 수 있습니다.
   사용: parent.append(buildCarousel(SITE_SLIDES))   (모양은 theme.css 의 .hero-media 부분) */

// 홈과 절 소개에 같이 보이는 사진 목록. 사진을 바꾸거나 더하려면 여기만 고치면 됩니다.
// pos = 사진이 잘릴 때 보여 줄 부분 (가로% 세로%)
const SITE_SLIDES = [
  { src: 'images/main.jpg',    alt: '봉불사 법당 안, 금빛 부처님과 오색 연등이 보이는 모습', pos: '50% 50%' },
  { src: 'images/slide-2.jpg', alt: '오색 연등 아래 법당에서 불자들이 함께 기도하는 모습',   pos: '50% 40%' },
  { src: 'images/slide-3.jpg', alt: '법당에서 법회를 이끄는 스님의 모습',                     pos: '50% 38%' },
];

// 홈에만 보이는 사진 (지금은 법당의 부처님 한 장). 한 장이면 화살표와 점 없이 그대로 보입니다.
// fit: 'contain' = 사진 전체를 자르지 않고 보여 줌 / 기본(cover) = 칸을 꽉 채우고 넘치는 부분은 잘림
// filter: 보이는 밝기 등을 CSS 로 조정 (원본 사진 파일은 그대로). brightness(1.1) = 10% 밝게. 숫자를 키우면 더 밝아짐.
const HOME_SLIDES = [
  { src: 'images/buddha.jpg', alt: '봉불사 법당의 금빛 부처님', pos: '50% 40%', filter: 'brightness(1.1)' },
];
const HOME_OPTS = { aspect: '3 / 2', bg: '#efe6d6' }; // 칸의 가로세로 비율, 사진이 로딩되기 전의 바탕색

function buildCarousel(slides, opts) {
  const INTERVAL = (opts && opts.interval) || 5000;
  const n = slides.length;
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mk = (tag, cls, attrs) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };

  const wrap = mk('div', 'hero-media');
  if (opts && opts.aspect) wrap.style.setProperty('--car-ratio', opts.aspect);
  if (opts && opts.bg) wrap.style.setProperty('--car-bg', opts.bg);
  const car = mk('div', 'carousel', { role: 'group', 'aria-roledescription': '사진 넘기기', 'aria-label': '봉불사 사진', tabindex: '0' });
  const track = mk('div', 'slides');
  const prevBtn = mk('button', 'car-btn prev', { type: 'button', 'aria-label': '이전 사진' }); prevBtn.textContent = '‹';
  const nextBtn = mk('button', 'car-btn next', { type: 'button', 'aria-label': '다음 사진' }); nextBtn.textContent = '›';
  const dotsBox = mk('div', 'car-dots', { role: 'group', 'aria-label': '사진 고르기' });
  car.append(track, prevBtn, nextBtn);
  wrap.append(car, dotsBox);

  const slide = (s, clone) => {
    const f = mk('figure', 'slide');
    const im = mk('img'); im.src = s.src; im.alt = clone ? '' : (s.alt || ''); im.style.objectPosition = s.pos || '50% 50%'; if (s.fit) im.style.objectFit = s.fit; if (s.filter) im.style.filter = s.filter; im.draggable = false;
    if (clone) f.setAttribute('aria-hidden', 'true');
    f.append(im); return f;
  };
  slides.forEach((s) => track.append(slide(s, false)));
  if (n > 1) track.append(slide(slides[0], true)); // 끝에 붙이는 복사본: 마지막 → 처음도 왼쪽으로 이어지게

  // 사진이 한 장뿐이면 화살표·점 없이 그냥 보여 줌
  if (n < 2) { prevBtn.hidden = true; nextBtn.hidden = true; return wrap; }

  const dots = slides.map((s, k) => {
    const b = mk('button', 'car-dot', { type: 'button', 'aria-label': `${k + 1}번째 사진 보기` });
    b.addEventListener('click', () => { goTo(k); restart(); });
    dotsBox.append(b); return b;
  });

  let idx = 0, busy = false, paused = false, timer = null, settleTimer = null;
  const place = (i, animate) => { track.classList.toggle('no-anim', !animate); track.style.transform = `translateX(${-i * 100}%)`; };
  const paintDots = () => dots.forEach((d, k) => d.setAttribute('aria-current', String(k === idx % n)));

  function settle() { // 한 번 넘어간 뒤 정리: 복사본까지 왔으면 소리 없이 처음 사진으로 되돌림
    clearTimeout(settleTimer);
    if (idx === n) { idx = 0; place(0, false); }
    busy = false;
  }
  function goTo(i) {
    if (busy || i === idx) return;
    busy = true; idx = i; place(idx, !reduceMotion); paintDots();
    settleTimer = setTimeout(settle, reduceMotion ? 0 : 800);
  }
  const next = () => goTo(idx + 1);
  function prev() {
    if (busy) return;
    if (idx === 0) { idx = n; place(n, false); void track.offsetWidth; } // 처음에서 뒤로 → 복사본 위치로 몰래 이동 후 한 장 뒤로
    goTo(idx - 1);
  }
  track.addEventListener('transitionend', (e) => { if (e.target === track) settle(); });

  function restart() {
    clearInterval(timer);
    if (reduceMotion) return; // 움직임 줄이기를 켠 사용자에게는 자동으로 넘기지 않음
    timer = setInterval(() => { if (!document.hidden && !paused && car.offsetParent) next(); }, INTERVAL);
  }

  nextBtn.addEventListener('click', () => { next(); restart(); });
  prevBtn.addEventListener('click', () => { prev(); restart(); });
  car.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prev(); restart(); } else if (e.key === 'ArrowRight') { next(); restart(); }
  });
  car.addEventListener('mouseenter', () => { paused = true; });
  car.addEventListener('mouseleave', () => { paused = false; });
  car.addEventListener('focusin', () => { paused = true; });
  car.addEventListener('focusout', () => { paused = false; });
  let sx = null;
  car.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  car.addEventListener('touchend', (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); restart(); }
  }, { passive: true });

  place(0, false); paintDots(); restart();
  return wrap;
}

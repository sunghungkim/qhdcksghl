/* 홈페이지에 처음 들어오면 뜨는 안내 팝업.
   ▶ 사진·제목을 바꾸는 방법: 기본적으로 성지순례 페이지의 전단과 같은 사진을 씁니다 → flyers.js 의 FLYERS 를 고치면
     이 팝업도 함께 바뀝니다. (사진은 images/flyer/ 폴더, 바꿀 때 FLYERS.id 도 새 값으로)
     팝업에만 다른 사진을 쓰고 싶으면 아래 POPUP 의 id / title / images 를 직접 적으세요.
   ▶ 동작: 홈페이지에 들어올 때마다 뜹니다. 위쪽 "닫기 ✕"로 닫았다가 다시 들어오면 또 뜹니다.
     아래 "오늘 하루 보지 않기"를 누른 방문자에게만 오늘 밤 12시까지 뜨지 않습니다.
   ▶ 미리 보기: 주소 끝에 ?popup=1 을 붙이면 숨김과 상관없이 항상 뜹니다. (?nopopup 이면 안 뜹니다)
   ▶ 잠시 끄기: enabled 를 false 로.  특정 날까지만 보이게: until 에 'YYYY-MM-DD'. */
const POPUP = {
  enabled: true,
  id: FLYERS.id,                        // 전단과 같은 값(flyers.js). 팝업만 따로 바꾸려면 직접 적으세요
  title: FLYERS.title,
  until: null,                          // 예: '2027-01-31' (그날까지만 보임). null 이면 계속 보임
  images: FLYERS.images,                // 성지순례 페이지의 전단과 같은 사진. 팝업만 다르게 하려면 [{ src: 'images/…', alt: '…' }, …]
};

function showEntryPopup(cfg) {
  if (!cfg || !cfg.enabled || !cfg.images || !cfg.images.length) return;
  const q = new URLSearchParams(location.search);
  if (q.has('nopopup')) return;
  const force = q.has('popup');
  // 왼쪽 위 "봉불사" 로고를 눌러 새로 고친 직후에는 이번 한 번만 건너뜀 (index.html 이 표시를 남김)
  let skipOnce = false;
  try { skipOnce = sessionStorage.getItem('popup-skip-once') === '1'; sessionStorage.removeItem('popup-skip-once'); } catch (e) {}
  if (skipOnce && !force) return;

  const today = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
  if (!force && cfg.until && today() > cfg.until) return; // 표시 기간이 지남

  // "오늘 하루 보지 않기" 기록: 같은 내용(id)에 대해 오늘 밤 12시까지만 숨김(localStorage).
  // 이 버튼을 누르지 않고 그냥 닫은 경우에는 아무것도 저장하지 않아서, 다시 들어오면 팝업이 또 뜹니다.
  const KEY = 'entry-popup-hide';
  try { sessionStorage.removeItem(KEY); } catch (e) {} // 바로 전 버전("이번 방문 동안만")의 기록이 있으면 지움
  const readHide = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  if (!force) {
    const h = readHide();
    if (h && h.id === cfg.id && Date.now() < h.until) return;
  }
  const hideToday = () => {
    const end = new Date(); end.setHours(24, 0, 0, 0);
    try { localStorage.setItem(KEY, JSON.stringify({ id: cfg.id, until: end.getTime() })); } catch (e) {}
  };

  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  const overlay = mk('div', 'popup-overlay');
  const box = mk('div', 'popup-box');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'popup-title');

  const head = mk('div', 'popup-head');
  const title = mk('h2', 'popup-title', cfg.title || '안내'); title.id = 'popup-title';
  const x = mk('button', 'btn ghost small popup-x', '닫기 ✕'); x.type = 'button'; x.setAttribute('aria-label', '팝업 닫기');
  head.append(title, x);

  const body = mk('div', 'popup-body');
  body.append(mk('p', 'popup-hint', '사진을 누르면 크게 볼 수 있습니다. (확대해서 읽으세요)'));
  cfg.images.forEach((im, i) => {
    const fig = mk('figure', 'popup-fig');
    const a = mk('a'); a.href = im.src; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.title = '크게 보기';
    const img = mk('img'); img.src = im.src; img.alt = im.alt || (cfg.title + ' ' + (i + 1)); img.loading = i === 0 ? 'eager' : 'lazy';
    a.append(img);
    fig.append(a);
    if (cfg.images.length > 1) fig.append(mk('figcaption', null, `${i + 1} / ${cfg.images.length}`));
    body.append(fig);
  });

  const foot = mk('div', 'popup-foot');
  const skip = mk('button', 'btn ghost', '오늘 하루 보지 않기'); skip.type = 'button';
  foot.append(skip); // 아래쪽에는 이 버튼 하나만. 그냥 닫기는 위쪽 "닫기 ✕", 바깥 누르기, Esc 로

  box.append(head, body, foot);
  overlay.append(box);

  const prevFocus = document.activeElement;
  const closeIt = () => {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} }
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { closeIt(); return; }
    if (e.key === 'Tab') { // 팝업 안에서만 Tab 이동
      const items = [...box.querySelectorAll('button, a[href]')];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  x.addEventListener('click', closeIt);
  skip.addEventListener('click', () => { hideToday(); closeIt(); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeIt(); });
  document.addEventListener('keydown', onKey);

  document.body.append(overlay);
  x.focus();
}

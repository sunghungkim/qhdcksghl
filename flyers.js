/* 성지순례 안내 전단(사진) — "성지순례 일정" 페이지 위쪽과 홈 팝업이 같은 목록을 씁니다.
   ▶ 전단을 바꾸는 방법: 아래 FLYERS 만 고치면 두 곳이 함께 바뀝니다.
     1) 새 전단 사진을 images/flyer/ 폴더에 넣고(파일 이름은 자유),
     2) images 목록의 src 를 그 파일 이름으로 바꾸거나 줄을 더하고 뺍니다. (한 장도, 여러 장도 됩니다)
     3) id 를 새 값으로 바꿉니다. (예: '2027-01') → "오늘 하루 보지 않기"를 누른 방문자에게도 팝업이 다시 보입니다.
   ▶ 사진을 모두 지우면(images: []) 성지순례 페이지의 전단 칸이 사라집니다.
   홈 팝업을 잠시 끄거나 팝업에만 다른 사진을 쓰려면 popup.js 의 POPUP 에서 고치세요. */
const FLYERS = {
  id: '2026-12-sample',                 // 전단이 바뀌면 이 값도 바꿔 주세요
  title: '성지순례 일정 안내',
  images: [
    { src: 'images/flyer/flyer-1.jpg', alt: '2026년 12월 성지순례 일정 안내 (1~2쪽): 점안법회, 영천 은해사, 청도 사리암, 문수기도, 청평암, 향일암, 영산재 회향법회, 남도 성지순례, 팔공산 갓바위, 12월 정기법회, 자비실천 방생법회' },
    { src: 'images/flyer/flyer-2.jpg', alt: '해맞이 일출법회 안내와 2027년 정월 삼사순례(삼보종찰, 삼대보궁) 안내 (3~4쪽)' },
  ],
};

// 성지순례 일정 페이지 위쪽에 놓는 전단 칸. 사진이 없으면 null.
function buildFlyerBox() {
  if (!FLYERS.images || !FLYERS.images.length) return null;
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const box = mk('section', 'flyers');
  box.setAttribute('aria-labelledby', 'flyers-title');
  const h = mk('h2', 'flyers-title', FLYERS.title); h.id = 'flyers-title';
  box.append(h, mk('p', 'flyers-hint', '사진을 누르면 크게 볼 수 있습니다. (확대해서 읽으세요)'));
  const grid = mk('div', 'flyers-grid');
  FLYERS.images.forEach((im, i) => {
    const fig = mk('figure', 'flyers-fig');
    const a = mk('a'); a.href = im.src; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.title = '크게 보기';
    const img = mk('img'); img.src = im.src; img.alt = im.alt || (FLYERS.title + ' ' + (i + 1)); img.loading = i === 0 ? 'eager' : 'lazy';
    a.append(img); fig.append(a);
    if (FLYERS.images.length > 1) fig.append(mk('figcaption', null, `${i + 1} / ${FLYERS.images.length}`));
    grid.append(fig);
  });
  box.append(grid);
  return box;
}

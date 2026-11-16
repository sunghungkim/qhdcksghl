/* "맨 위로" 화살표 버튼 — 긴 페이지에서 아래로 내려갔을 때 오른쪽 아래에 나타나고, 누르면 한 번에 맨 위로 올라갑니다.
   사용: addToTopButton()   (모양은 theme.css 의 .to-top). 기본은 400px 이상 내려가면 보입니다. */
function addToTopButton(showAfter) {
  const limit = showAfter || 400;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'to-top';
  b.hidden = true;
  b.setAttribute('aria-label', '맨 위로 올라가기');
  b.title = '맨 위로';
  b.textContent = '↑';
  b.addEventListener('click', () => {
    window.scrollTo(0, 0); // 한 번에 맨 위로
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
  document.body.append(b);

  const update = () => {
    const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    b.hidden = y < limit; // 가벼운 계산이라 스크롤할 때마다 바로 확인
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
  return b;
}

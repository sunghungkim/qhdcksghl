/* 입금 안내 팝업 (성지순례 일정 · 내 예약 공용)
   ▶ 계좌를 바꾸려면 아래 ACCOUNTS 만 고치세요. copy 는 "복사" 버튼으로 복사될 숫자(공백·하이픈 없음)입니다.
   ▶ 사용: showPayPopup({ heading, trip, amount, hideMine })
        heading  팝업 제목 (예: '입금 계좌 안내')   trip  예약 한 줄 설명(없으면 생략)
        amount   입금하실 금액 글자(없으면 생략)             hideMine  true 면 "내 예약 보기" 버튼을 숨김 */
const ACCOUNTS = [
  { bank: '국민은행', shown: '910 6627 8859', copy: '91066278859', owner: '박소희' },
  { bank: '농협', shown: '010 6627 8859 09', copy: '0106627885909', owner: '박소희' },
];

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try { // 일부 환경에서는 위 방법이 막혀 있어 예전 방식으로 한 번 더 시도
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(t); t.select();
    const ok = document.execCommand('copy'); t.remove(); return ok;
  } catch (e) { return false; }
}

function showPayPopup(opts) {
  opts = opts || {};
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const topGo = (hash) => { try { window.top.location.hash = hash; } catch (e) { location.href = 'index.html' + hash; } };

  const overlay = mk('div', 'popup-overlay');
  const box = mk('div', 'popup-box pay-box');
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'pay-title');
  const head = mk('div', 'popup-head');
  const title = mk('h2', 'popup-title', opts.heading || '입금 계좌 안내'); title.id = 'pay-title';
  const x = mk('button', 'btn ghost small popup-x', '닫기 ✕'); x.type = 'button';
  head.append(title, x);

  const body = mk('div', 'popup-body pay-body');
  if (opts.trip) body.append(mk('p', 'pay-trip', opts.trip));
  if (opts.amount) body.append(mk('p', 'pay-amt', '입금하실 금액: ' + opts.amount));
  body.append(mk('p', 'pay-sub', '아래 계좌로 입금해 주세요 (예금주 ' + ACCOUNTS[0].owner + ')'));
  ACCOUNTS.forEach((a) => {
    const row = mk('div', 'pay-acc');
    const info = mk('div', 'pay-info');
    const num = mk('div', 'pay-num', a.shown);
    info.append(mk('div', 'pay-bank', a.bank), num, mk('div', 'pay-owner', '예금주 ' + a.owner));
    const c = mk('button', 'btn', '복사'); c.type = 'button';
    c.setAttribute('aria-label', a.bank + ' 계좌번호 복사');
    c.addEventListener('click', async () => {
      const ok = await copyText(a.copy);
      if (!ok) { // 복사가 막힌 환경: 숫자를 선택해 두면 직접 복사할 수 있음
        try { const r = document.createRange(); r.selectNodeContents(num); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
      }
      c.textContent = ok ? '복사됨 ✓' : '숫자를 눌러 복사';
      setTimeout(() => { c.textContent = '복사'; }, 2000);
    });
    row.append(info, c);
    body.append(row);
  });
  body.append(mk('p', 'pay-note', '입금하신 뒤 "내 예약"에서 [입금 완료] 버튼을 눌러 주세요. 관리자가 입금을 확인하면 예약이 확정됩니다. 확정된 예약의 취소는 전화(02-387-8578)로 문의해 주세요.'));

  const foot = mk('div', 'popup-foot');
  const ok = mk('button', 'btn', '확인'); ok.type = 'button';
  if (!opts.hideMine) {
    const mine = mk('button', 'btn ghost', '내 예약 보기'); mine.type = 'button';
    mine.addEventListener('click', () => { close(); topGo('#reserve'); });
    foot.append(mine);
  }
  foot.append(ok);
  box.append(head, body, foot); overlay.append(box);

  const prev = document.activeElement;
  const close = () => { document.removeEventListener('keydown', onKey); overlay.remove(); if (prev && prev.focus) { try { prev.focus(); } catch (e) {} } };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  x.addEventListener('click', close); ok.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  ok.focus();
  return { close };
}

/* 확인 팝업: askPopup({ heading, message, yes, no }) → Promise<true|false>
   "예" 를 누르면 true, "아니요"·바깥 누르기·Esc 는 false. (잘못 눌러도 안전하도록 처음에는 "아니요"에 초점이 있음) */
function askPopup(opts) {
  opts = opts || {};
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  return new Promise((resolve) => {
    const overlay = mk('div', 'popup-overlay');
    const box = mk('div', 'popup-box ask-box');
    box.setAttribute('role', 'alertdialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'ask-title'); box.setAttribute('aria-describedby', 'ask-msg');
    const head = mk('div', 'popup-head');
    const title = mk('h2', 'popup-title', opts.heading || '확인해 주세요'); title.id = 'ask-title';
    head.append(title);
    const body = mk('div', 'popup-body');
    const msg = mk('p', 'ask-msg', opts.message || ''); msg.id = 'ask-msg';
    body.append(msg);
    const foot = mk('div', 'popup-foot');
    const no = mk('button', 'btn ghost', opts.no || '아니요'); no.type = 'button';
    const yes = mk('button', 'btn', opts.yes || '예'); yes.type = 'button';
    foot.append(no, yes);
    box.append(head, body, foot); overlay.append(box);

    const prev = document.activeElement;
    const done = (v) => { document.removeEventListener('keydown', onKey); overlay.remove(); if (prev && prev.focus) { try { prev.focus(); } catch (e) {} } resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') done(false); };
    yes.addEventListener('click', () => done(true));
    no.addEventListener('click', () => done(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) done(false); });
    document.addEventListener('keydown', onKey);
    document.body.append(overlay);
    no.focus();
  });
}

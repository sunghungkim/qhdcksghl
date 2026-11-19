/* 개인정보 수집·이용 안내 (예약·로그인 화면 공용)
   ▶ 내용을 바꾸려면 아래 PRIVACY 만 고치세요. (보관 기간, 위탁 업체 등이 바뀌면 여기서 수정)
   ▶ 사용: buildConsent() → { el, isChecked(), focus() }  /  showPrivacyPopup() */
const PRIVACY = {
  who: '봉불사 · 봉찬회',
  phone: '02-387-8578',
  items: '이름, 전화번호 (함께 가시는 분이 있으면 그분의 이름·전화번호), 선택한 차량 탑승지, 예약 일정·인원',
  purpose: '성지순례 예약 접수와 확인, 입금 안내, 예약 확정·변경·취소 연락, 차량 탑승 안내',
  retention: '예약한 일정이 끝난 날부터 1년 보관 후 삭제합니다. (법령에서 정한 보관 의무가 있으면 그 기간을 따릅니다)',
  refuse: '개인정보 수집·이용에 동의하지 않으실 수 있습니다. 다만 동의하지 않으시면 홈페이지에서 예약하실 수 없고, 전화(02-387-8578)로 문의해 주시면 됩니다.',
  outsourcing: '예약 정보 저장: Supabase(데이터 보관 서비스), 안내 문자 발송을 쓰는 경우: 문자 발송 업체(솔라피). 위 목적 외에는 사용하지 않으며 제3자에게 판매하거나 제공하지 않습니다.',
  companion: '함께 가시는 분의 이름·전화번호를 적으실 때는 그분께 알리고 동의를 받아 주세요.',
};

function showPrivacyPopup() {
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const overlay = mk('div', 'popup-overlay');
  const box = mk('div', 'popup-box privacy-box');
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'privacy-title');
  const head = mk('div', 'popup-head');
  const title = mk('h2', 'popup-title', '개인정보 수집·이용 안내'); title.id = 'privacy-title';
  const x = mk('button', 'btn ghost small popup-x', '닫기 ✕'); x.type = 'button';
  head.append(title, x);
  const body = mk('div', 'popup-body privacy-body');
  [
    ['수집하는 사람', PRIVACY.who],
    ['수집 항목', PRIVACY.items],
    ['이용 목적', PRIVACY.purpose],
    ['보관 기간', PRIVACY.retention],
    ['처리를 맡기는 곳', PRIVACY.outsourcing],
    ['동의를 거부할 권리', PRIVACY.refuse],
    ['함께 가시는 분', PRIVACY.companion],
    ['문의', '개인정보 열람·정정·삭제는 전화 ' + PRIVACY.phone + ' 로 요청해 주세요.'],
  ].forEach(([k, v]) => {
    const s = mk('div', 'privacy-sec');
    s.append(mk('b', null, k), mk('p', null, v));
    body.append(s);
  });
  const foot = mk('div', 'popup-foot');
  const ok = mk('button', 'btn', '확인'); ok.type = 'button';
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
}

// 동의 체크칸: [ ] 개인정보 수집·이용에 동의합니다 (필수)  [내용 보기]
function buildConsent() {
  const wrap = document.createElement('div');
  wrap.className = 'consent';
  const lab = document.createElement('label');
  lab.className = 'consent-lab';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  const txt = document.createElement('span');
  txt.textContent = '개인정보 수집·이용에 동의합니다 (필수)';
  lab.append(cb, txt);
  const more = document.createElement('button');
  more.type = 'button'; more.className = 'btn ghost small'; more.textContent = '내용 보기';
  more.addEventListener('click', showPrivacyPopup);
  const hint = document.createElement('p');
  hint.className = 'consent-hint';
  hint.textContent = '예약 안내를 위해 이름·전화번호를 수집하며, 일정이 끝난 뒤 1년간 보관합니다.';
  wrap.append(lab, more, hint);
  return { el: wrap, isChecked: () => cb.checked, focus: () => cb.focus(), box: cb };
}

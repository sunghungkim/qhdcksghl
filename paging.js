/* ---------- 검색 (성지순례 일정, 행사 일정 공용) ----------
   searchBox({ placeholder, onSearch(q) }) → { el, setInfo(text) }
   - 글자를 입력하면 바로 검색되고, 띄어쓰기로 나눈 낱말이 모두 들어 있는 항목만 남깁니다.
   matchesQuery(haystack, q) → 검색어 q 의 모든 낱말이 haystack 글자 안에 있으면 true (대소문자 구분 없음) */
function matchesQuery(haystack, q) {
  const words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  const h = String(haystack || '').toLowerCase();
  return words.every((w) => h.includes(w));
}

function searchBox(opts) {
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const form = mk('form', 'searchbar');
  form.setAttribute('role', 'search');
  const label = mk('label', 'searchbar-label', '일정 검색');
  const row = mk('div', 'searchbar-row');
  const input = mk('input');
  input.type = 'search';
  input.placeholder = (opts && opts.placeholder) || '검색어를 입력하세요';
  input.autocomplete = 'off';
  input.maxLength = 50;
  input.setAttribute('aria-label', '일정 검색어');
  const clear = mk('button', 'btn ghost', '지우기');
  clear.type = 'button';
  clear.hidden = true;
  row.append(input, clear);
  const info = mk('div', 'searchbar-info');
  info.setAttribute('role', 'status');
  form.append(label, row, info);

  let timer = null;
  const fire = () => { clear.hidden = !input.value; opts.onSearch(input.value.trim()); };
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(fire, 150); });
  form.addEventListener('submit', (e) => { e.preventDefault(); clearTimeout(timer); fire(); });
  clear.addEventListener('click', () => { input.value = ''; fire(); input.focus(); });

  return { el: form, setInfo: (t) => { info.textContent = t || ''; } };
}

/* 목록을 한 페이지에 N개씩 나누어 보여 주는 공용 기능 (성지순례 일정, 행사 일정)
   사용: paginate(container, groups, makeCard, { perPage: 5 })
   groups = [{ title: '다가오는 일정', rows: [...], past: false, emptyText: '없습니다' }, ...]  (보여 줄 순서대로)
   makeCard(row, group) 는 카드 DOM 을 돌려줍니다. 구역 제목은 그 구역의 첫 카드 위에 자동으로 붙습니다. */
function paginate(container, groups, makeCard, opts) {
  const perPage = (opts && opts.perPage) || 5;
  const mk = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  const entries = [];
  groups.forEach((g) => g.rows.forEach((row) => entries.push({ g, row })));
  const totalPages = Math.max(1, Math.ceil(entries.length / perPage));
  let page = 1;

  function pageNumbers() {
    // 1 … 현재-1 현재 현재+1 … 마지막
    const set = new Set([1, totalPages, page - 1, page, page + 1]);
    const nums = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    const out = [];
    nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push('…'); out.push(n); });
    return out;
  }

  function pager() {
    const nav = mk('nav', 'pager');
    nav.setAttribute('aria-label', '페이지 이동');
    const btn = (label, target, extra) => {
      const b = mk('button', 'btn ghost small' + (extra ? ' ' + extra : ''), label);
      b.type = 'button';
      if (target == null) b.disabled = true;
      else b.addEventListener('click', () => show(target));
      return b;
    };
    nav.append(btn('이전', page > 1 ? page - 1 : null));
    pageNumbers().forEach((n) => {
      if (n === '…') { nav.append(mk('span', 'pager-gap', '…')); return; }
      const b = btn(String(n), n === page ? null : n, n === page ? 'current' : '');
      if (n === page) { b.disabled = false; b.setAttribute('aria-current', 'page'); b.setAttribute('aria-label', n + '페이지 (현재)'); }
      else b.setAttribute('aria-label', n + '페이지로 이동');
      nav.append(b);
    });
    nav.append(btn('다음', page < totalPages ? page + 1 : null));
    const info = mk('div', 'pager-info', `총 ${entries.length}건 · ${page} / ${totalPages} 페이지`);
    const wrap = mk('div', 'pager-wrap');
    wrap.append(nav, info);
    return wrap;
  }

  function show(n) {
    page = Math.min(Math.max(1, n), totalPages);
    container.replaceChildren();

    // 첫 구역에 항목이 없으면(예: 다가오는 일정 없음) 안내 문구를 첫 페이지 맨 위에 보여 줌
    if (page === 1 && groups.length && !groups[0].rows.length && groups[0].emptyText) {
      container.append(mk('div', 'state', groups[0].emptyText));
    }

    let list = null, lastGroup = null;
    entries.slice((page - 1) * perPage, page * perPage).forEach(({ g, row }) => {
      if (g !== lastGroup) {
        container.append(mk('h2', 'sec', g.title));
        list = mk('div', 'list');
        container.append(list);
        lastGroup = g;
      }
      list.append(makeCard(row, g));
    });

    if (totalPages > 1) container.append(pager());
    try { window.scrollTo({ top: 0 }); } catch (e) {}
  }

  show(1);
  return { show };
}

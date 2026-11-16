# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static website for **봉찬회 · 봉불사** (a Korean Buddhist pilgrimage group and its temple). Visitors read pilgrimage/event schedules, the temple intro + history, a photo gallery, and can reserve trips; the owner (관리인) manages the same data from admin pages on the same site. **All user-facing text is Korean**, and the owner reads large, warm, easy-to-read UI as a requirement (base font 19px, warm palette in `theme.css`).

`PRD.md` is the *original* plan (5 pages, a `cafe-ai` Edge Function, open reservation inserts). The project has outgrown it — trust this file and the code, not the PRD. The `cafe-ai` Edge Function was never built.

## Run / verify

- **No build, no npm, no lint, no tests.** Plain HTML/CSS/JS files (only external dependency: Google Fonts via `@import` in `theme.css`). Don't introduce bundlers, `package.json`, or frameworks.
- **Serve over HTTP, never `file://`** (the shell uses `fetch` to check pages exist): from the project folder run
  `powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 [-Port 8780]` → http://localhost:8780/ . It dies on reboot; Python/Node are not installed. Preview tricks: `?popup=1` forces the entry popup, `?nopopup` suppresses it.
- In the Claude desktop preview pane, every edit auto-opens a `file://` tab that renders wrongly — close it and use the `http://localhost:8780` tab. The pane is very narrow (~270px); resize to 375px (phone) / 1280px (desktop) when judging layout.
- Verification is by browser (JS console / screenshots). DB logic was verified with SQL `DO $$ … raise exception 'TEST …' $$` blocks, which roll back and leave no data.

## Architecture

**`index.html` is the shell**: header + left menu (becomes a top bar ≤760px) + a center area. Home content is inline; every other page is a separate HTML file loaded into an `<iframe>`, chosen by URL hash (`#temple`). The menu is the `PAGES` array in its script (a `HEAD` fetch shows "준비 중" if a file is missing; `login` is a hidden entry, not in the menu). **Sub-pages must not include their own menu.** Menu order: 홈, 절 소개 `temple.html`, 성지순례 일정 `pilgrimage.html`, 행사 일정 `events.html`, 내 예약 `reserve.html`, 동행의 기록 `gallery.html`; plus `login.html`.

**Admin pages** are standalone (not in the menu; reached from header links after admin login): `menu.html` (행사 관리: add/edit pilgrimages & events, D-5 red), `sales.html` (매출), `reservations.html` (전체 예약: confirm/cancel). Each has its own top bar and a fallback admin login form.

**Shared files** (loaded by script/link tags, no modules): `theme.css` (all tokens + shared components: cards, buttons, forms, popup, slideshow, pager, search bar, to-top button), `paging.js` (`paginate`, `searchBox`, `matchesQuery` — 5 per page on 성지순례/행사, 6 on gallery), `carousel.js` (`buildCarousel`, home photo list `HOME_SLIDES`), `popup.js` (entry popup, config object `POPUP`), `story.js` (절 소개 "봉찬회에 대하여…" text + `buildStory`), `totop.js` (`addToTopButton`, used on `temple.html`). Cross-page state lives in `sessionStorage` (`admin_token`, `member`); iframe pages read the member with `window.top.getMember()` and refresh the header with `window.top.renderWho()`. Media: `images/` (home photos `buddha`/`slide-*`/`hero.jpg`; `images/popup/` flyers; `emblem.png` is unused), `video/temple-intro.mp4`, `일정/` (original flyer photos).

Page-specific behaviors worth knowing:
- **Home**: photo slideshow (8 photos, 5s auto-advance left, dots + arrows) and a two-line tagline whose 2nd line is aligned under "는" via an invisible `.tag-pad` copy of the text. The entry popup shows each visit; only its button "오늘 하루 보지 않기" hides it until midnight (`localStorage['entry-popup-hide']` = `{id, until}`); closing otherwise stores nothing. Change `POPUP.id` when the flyers change.
- **절 소개**: intro video (autoplays muted — it has audio — with "🔇 소리 켜기", centered "↻ 다시 보기" when it ends, "▶ 재생" if autoplay is blocked) → history/meaning section (`story.js`; text copied from the owner's two `.hwp` files, with the start year deliberately set to **1985** in both places) → contact card `#temple-info` (links list `LINKS`, map embed, phone). `temple_info.image_url` is no longer used.
- **성지순례/행사 일정**: upcoming + past groups, search, pagination; 예약하기 on a pilgrimage card needs a member login.
- **Gallery**: admin uploads photos (resized to ≤1600px JPEG in the browser) to Storage bucket `gallery` + table `gallery`; visitors view, search, open a lightbox.

## Backend: the owner's Supabase project

Project ref `iixmdxfxayyjhnmngpve`; the URL and **publishable** key are hard-coded in each page (fine — RLS is the protection). The schema was applied through the Supabase connector, **not stored in this repo** (no migration files) — inspect it with the connector (`list_tables`, `execute_sql`) before changing anything, and record DB changes here.

- Tables: `pilgrimages` (… `price`, `capacity`, `remaining`, `status` open/closed/canceled), `events`, `temple_info`, `reservations` (+`status` requested/confirmed/canceled), `sales`, `members`, `member_login_failures`, `site_settings`, `gallery`; Storage bucket `gallery` (public read, admin write, ≤5MB jpg/png/webp).
- RPCs: `member_login`, `member_check` (internal), `member_reserve`, `my_reservations`, `cancel_my_reservation` (anon-callable, SECURITY DEFINER), `record_sale`, `confirm_reservation`, `admin_cancel_reservation` (authenticated only). Triggers: `members_normalize_trg` (digits-only phone), `pilgrimages_sync_stock_trg`. The Supabase security advisor warns about the anon-callable definer functions — intentional.

## Auth model (two separate logins, both on `login.html`)

- **Admin** = Supabase Auth email/password; token in `sessionStorage['admin_token']`. RLS treats **any `authenticated` user as admin**, so public sign-ups must stay disabled. Logout (shell or admin pages) clears it and goes to `#login`.
- **Member** (아이디 = 이름, 비밀번호 = 전화번호) via the `member_login` RPC. **Open mode is currently ON** (`site_settings.member_login_open = 'true'`): any non-empty name+phone "logs in", so member status proves nothing yet — never gate personal data on it. To enforce the list: fill `members`, then `update site_settings set value = 'false' where key = 'member_login_open'` (then 5 wrong tries/name/10 min locks). Non-members can always browse everything.

## Reservations & stock

예약하기 → `member_reserve` (name+phone from the member session; direct anon inserts into `reservations` are blocked; one active reservation per person per trip). `reserve.html` lists/cancels via `my_reservations`/`cancel_my_reservation`. `pilgrimages.remaining` (empty = unlimited) is decreased only by `record_sale` and the admin `confirm_reservation` (which refuses if seats are short); `admin_cancel_reservation` of a confirmed booking returns the seats; the sync trigger keeps `remaining` in step when `capacity` is set/changed — so counting only starts once an admin enters a trip's 정원.

## Conventions and gotchas

- Render DB/user data with `textContent`/DOM builders, never `innerHTML` (every page follows this). The global `[hidden] { display: none !important }` in `theme.css` is relied on.
- Photos/video of 법회 show congregants' faces and donor names (등 이름표); the owner has been warned — don't publish more without asking.
- A bulk regex edit once silently deleted a whole block of the home page; after scripted multi-line edits, re-open the page and check it.
- Editing wording: `story.js` (역사 text), `carousel.js` (`HOME_SLIDES`), `popup.js` (`POPUP`), `temple.html` (`LINKS`), `index.html` (`PAGES`, tagline).

## Git

Remote `origin` = `https://github.com/sunghungkim/qhdcksghl.git`, branch `main`; repo-local identity 봉찬회 / qhdcksghl123@gmail.com. The owner asks for "커밋·push" after each change: stage the changed files by name, write the commit message in Korean (end with the Co-Authored-By line), then `git push` (Windows credential manager is already signed in). In PowerShell use a single-quoted here-string for the message and **no double quotes inside it** (that once broke the commit). The site is not deployed anywhere yet.

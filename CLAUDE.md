# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Greenfield. The repo currently contains only `PRD.md` (the source of truth for scope) — no code, build, lint, or test setup exists yet. Read `PRD.md` before building anything, and update it when decisions in its "확인이 필요한 사항" section get resolved. Write user-facing text and docs in Korean.

The site is the 성지순례 봉찬회 · 봉불사 homepage: visitors browse pilgrimage/event schedules and the temple intro, and submit reservations; the 관리인 (admin) manages content and views reservations.

## Hard constraints (from PRD)

- **One standalone HTML file per page, no npm / no build step.** CSS and JS live in (or are CDN-linked from) each HTML file. Don't introduce bundlers, package.json, or frameworks. To preview, open the files directly or serve the folder with any static server.
- **Menu pages**, in order: `index.html` (홈), `temple.html` (절 소개), `pilgrimage.html` (성지순례 일정), `events.html` (행사 일정), `reserve.html` (내 예약), `gallery.html` (동행의 기록 — trip/event photo gallery; admin uploads/deletes via Supabase Storage bucket `gallery` + table `gallery`, photos are resized to ≤1600px JPEG in the browser before upload). Admin editing is gated by login inside these pages — do not add a 6th admin page.
- **`index.html` is the shell**: it owns the left tab menu (the `PAGES` array in its script) and the center area. The home content is inline; the other four pages are separate HTML files loaded into an `<iframe>` in the center. If a page's file doesn't exist yet (checked with a `HEAD` fetch), the shell shows "준비 중" — so creating e.g. `events.html` is all it takes to make that menu entry go live. Sub-pages must therefore NOT include their own menu; they are just the content. Routing is by URL hash (`#events`).
- The shell needs to be served over HTTP (not opened via `file://`) for the existence check to work. Any static server works, e.g. PowerShell `HttpListener` or `python -m http.server`.
- **Backend = the owner's Supabase project** (tables: `pilgrimages`, `events`, `temple_info`, `reservations`) **plus a single Edge Function named `cafe-ai`** for the AI feature. Don't add other backends.

## Photo slideshow

Home and 절 소개 use one slideshow component: `carousel.js` (`buildCarousel(slides, opts)`; auto-advances left every 5s, dots + arrows, swipe, pauses on hover; with a single photo it just shows it, no arrows/dots) with its CSS in `theme.css`. Home uses `HOME_SLIDES` (currently one photo, the Buddha statue `images/buddha.jpg`, brightened 10% via the slide's CSS `filter`; `images/emblem.png` is currently unused); 절 소개 uses `SITE_SLIDES` (2 법회 photos) plus the photo in `temple_info.image_url` as an extra last slide. Photos live in `images/`.

## Two separate logins

Both are on `login.html` (side-by-side cards), opened by the header "로그인" button (`#login`; a hidden entry in the shell's `PAGES`, not in the left menu). The shell header (`renderWho()`) shows who is logged in plus logout; `menu.html` / `sales.html` still have their own admin login form as a fallback.

- **Admin** (Supabase Auth email/password): token kept in `sessionStorage['admin_token']`; after login the page goes to `menu.html`. RLS treats any `authenticated` user as admin, so sign-ups must stay disabled.
- **Member open mode (currently ON)**: while `site_settings.member_login_open = 'true'`, `member_login` accepts ANY non-empty name + phone (the members list is not consulted). So being "logged in as a member" proves nothing yet — do not gate personal data on it. To enforce the members list later: fill `members`, then `update site_settings set value = 'false' where key = 'member_login_open'`.
- **Member** (아이디 = 이름, 비밀번호 = 전화번호): when open mode is off, checked by the `member_login(p_name, p_phone)` RPC against the `members` table (anon cannot read `members` directly; phone is stored digits-only; 5 wrong tries per name in 10 min locks it). Result is kept in `sessionStorage['member']` and child pages can read it with `window.top.getMember()`. Non-members are never blocked from viewing schedules — login only unlocks member features. The members list is filled in later by the owner (Supabase dashboard / `members` table).

## Reservations ("내 예약")

Clicking 예약하기 on `pilgrimage.html` calls the `member_reserve` RPC with the logged-in member's name+phone (read from `window.top.getMember()`); `reserve.html` ("내 예약") lists them via `my_reservations` and cancels via `cancel_my_reservation`. All three go through `member_check`, so they obey the same open-mode / members-list switch. Direct inserts into `reservations` by anon are blocked (the old open insert policy was dropped); one active reservation per person per trip (partial unique index); status is `requested` → `confirmed` (admin sets it in the dashboard for now) / `canceled`. Stock (`pilgrimages.remaining`, empty = unlimited) is decreased only by `record_sale` (매출) and by the admin RPC `confirm_reservation` (예약 확정, in `reservations.html` "전체 예약"); `admin_cancel_reservation` gives a confirmed reservation's seats back. A DB trigger (`pilgrimages_sync_stock`) keeps `remaining` in step when `capacity` is set/changed — so a trip only counts down once an admin has entered its 정원 in `menu.html`.

## Security rules that shape the architecture

- Browser code may only use the Supabase **anon/publishable** key. AI provider keys (e.g. OpenRouter) live only in Edge Function env vars, never in HTML or git.
- RLS must be on for every table: visitors can read schedules/intro and insert reservations only; reading `reservations` (name/phone are personal data) and editing content is admin-only.

## Git

Remote `origin` is `https://github.com/sunghungkim/qhdcksghl.git` (default branch `main`). Repo-local git identity is set to 봉찬회 / qhdcksghl123@gmail.com. The remote repo may not exist yet — create it on GitHub before the first push.

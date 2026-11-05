# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Greenfield. The repo currently contains only `PRD.md` (the source of truth for scope) — no code, build, lint, or test setup exists yet. Read `PRD.md` before building anything, and update it when decisions in its "확인이 필요한 사항" section get resolved. Write user-facing text and docs in Korean.

The site is the 성지순례 봉찬회 · 봉불사 homepage: visitors browse pilgrimage/event schedules and the temple intro, and submit reservations; the 관리인 (admin) manages content and views reservations.

## Hard constraints (from PRD)

- **One standalone HTML file per page, no npm / no build step.** CSS and JS live in (or are CDN-linked from) each HTML file. Don't introduce bundlers, package.json, or frameworks. To preview, open the files directly or serve the folder with any static server.
- **Exactly 5 pages**: `index.html` (홈), `pilgrimage.html` (성지순례 일정), `events.html` (행사 일정), `temple.html` (절 소개), `reserve.html` (예약). Admin editing is gated by login inside these pages — do not add a 6th admin page.
- **`index.html` is the shell**: it owns the left tab menu (the `PAGES` array in its script) and the center area. The home content is inline; the other four pages are separate HTML files loaded into an `<iframe>` in the center. If a page's file doesn't exist yet (checked with a `HEAD` fetch), the shell shows "준비 중" — so creating e.g. `events.html` is all it takes to make that menu entry go live. Sub-pages must therefore NOT include their own menu; they are just the content. Routing is by URL hash (`#events`).
- The shell needs to be served over HTTP (not opened via `file://`) for the existence check to work. Any static server works, e.g. PowerShell `HttpListener` or `python -m http.server`.
- **Backend = the owner's Supabase project** (tables: `pilgrimages`, `events`, `temple_info`, `reservations`) **plus a single Edge Function named `cafe-ai`** for the AI feature. Don't add other backends.

## Security rules that shape the architecture

- Browser code may only use the Supabase **anon/publishable** key. AI provider keys (e.g. OpenRouter) live only in Edge Function env vars, never in HTML or git.
- RLS must be on for every table: visitors can read schedules/intro and insert reservations only; reading `reservations` (name/phone are personal data) and editing content is admin-only.

## Git

Remote `origin` is `https://github.com/sunghungkim/qhdcksghl.git` (default branch `main`). Repo-local git identity is set to 봉찬회 / qhdcksghl123@gmail.com. The remote repo may not exist yet — create it on GitHub before the first push.

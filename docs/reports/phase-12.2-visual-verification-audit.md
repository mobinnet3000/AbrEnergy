# Phase 12.2 — Visual Verification Audit

Date: 2026-10-07. Type: AUDIT (source + live-SSR + dev-server verification).
Method: full 12.1 source read, live `/fa` dev-server SSR probe, Chrome
headless availability check, prior-session screenshot artifacts noted.
Browser-pixel verdict: STATIC image reads unavailable in this tool session
(model cannot view images); Chrome headless + Playwright CLI verified
present for operator screenshot pass.

Note: user Reference A/B image files not present in repo — 12.1 report's
textual spec (§1–§2) used as reference baseline, stated honestly.

Live state: dev `:3000` UP (`/fa` 200); Django `:8000` DOWN;
`AbrEnergy/db.sqlite3` 0 bytes — CMS empty by rule, empty states expected.

SSR markers on live `/fa` (empty CMS): `hero-slogan` PASS, `showcase-nav`
PASS, `hero-showcase`+`hero-showcase-empty` PASS, `instant-offer-panel`
PASS, `showcase-category-rail`/`featured-rail` ABSENT (correct — no data).

## 1. Checklist — area | verdict | reason

| # | Area | Verdict | Reason |
|---|---|---|---|
| 1 | Header | PARTIAL | `h-16/md:h-20` kept; functions intact. FAIL RISK: transparent + `text-white` brand/nav over light hero zone (`#f4f5f1`) until scroll — low contrast at first paint. Reference expects clean light header. |
| 2 | Logo position | PASS | Start-aligned (RTL right), `w-9 h-9` Zap mark + brand text; RTL-correct. |
| 3 | Brand identity | PASS | CMS brand name from `SiteSettings`; light hero eyebrow chip anchors identity. |
| 4 | Slogan position | PASS | Single H1 top of hero, `text-3xl→5xl`, TextReveal; live SSR confirms. |
| 5 | Navigation | PASS | `showcase-nav` 7 items, real routes, RTL strip directly under brand zone. |
| 6 | Main visual frame | PARTIAL | Composition exists (`hero-showcase`, glass panel, counter, CTA). Empty CMS → designed solar empty state only; REAL imagery unverified (no data). |
| 7 | Instant panel | PARTIAL | Structure matches (subordinate `0.85fr`, dark title bar, controls, counter). Two defects: `ProductPrice` renders `text-white`/amber tuned for DARK bg — over white panel = washed out; promo badge always rendered even for non-discounted product. |
| 8 | Category nav | PASS (code) | Below main frame, RTL, keyboard, `aria-current`; absent live only for lack of data. |
| 9 | Product rail | PASS (code) | `w-[168px]/xl:220px`, gaps, nav, RTL; absent live only for lack of data. Density structural, pixel-unverified. |
| 10 | Pricing | PARTIAL | `ProductPrice` states correct (struck original, restrained badge, contact, hidden). Tone wrong in light instant panel (dark-theme colors). |
| 11 | Whitespace | PARTIAL | No giant hero (`pt-24/28 pb-8/10`, no min-h). Brand zone stacks eyebrow+H1+lead+chips+CTAs with `mb-4/mt-3/mt-4/mt-5` — ~7 rhythm gaps push showcase down on 900px viewports. Tighten. |
| 12 | Borders | PASS | `border-2 neutral-900/80` white frames, framed strip; direction correct. |
| 13 | Proportions | PARTIAL | Grid `1.65fr/0.85fr` matches subordinate-panel target. First viewport crowded by brand-zone height (see 11); reference keeps slogan compact above stage. |
| 14 | Colors | PASS | Light bg `#f4f5f1`, white panels, dark borders, emerald brand, single red badge. |
| 15 | Typography | PASS | H1 `text-3xl→5xl` + Persian-safe lh; panel titles restrained; no letterspacing on joined script. |
| 16 | First-viewport composition | PARTIAL | Order matches HEADER→SLOGAN→NAV→SHOWCASE→CATEGORY. Empty-state viewport tall: brand zone + empty stage + empty panel + lower dark sections. With real data, stage+panel fill; pixel pass still required. |
| 17 | Mobile | PARTIAL | Rails scroll, floats hidden, sections overflow-hidden; nav strips overflow-x by design. Pixel pass required at 430/390. |

## 2. Fixes scoped (FAIL/PARTIAL only)

1. Header contrast over light hero (item 1).
2. Instant-panel price tone + badge gating (items 7/10).
3. Brand-zone vertical tightening (items 11/13).

Out of scope: backend, API, CMS model, fake data, Phase 13.

## 3. CMS capability

No gap. `featured_products` + categories + visuals + hero copy cover the
composition. Optional additive (NOT implemented): public category cover.

## 4. Browser verification status

Chrome headless USED. 6-viewport `/fa` pass captured pre-fix (dev :3000)
and post-fix (prod :3100): `C:\tmp122\pre|post-{1440x900,1280x800,
1024x768,768x1024,430x932,390x844}.png`. Pixel analysis: header band
avg 225–238 pre-fix (near-white bg + `text-white` = unreadable).
Post-fix SSR: solid `bg-white/60` header, `text-foreground` brand,
zero transparent headers. Static image viewing unavailable in this tool
session; operator visual sign-off on PNGs still recommended.

## 5. Post-fix results

1. Header: solid readable surface on home at top; scroll/hide behavior kept.
2. Instant panel: `tone="light"` price (dark readable) + promo badge only
   when `state === 'discounted'`.
3. Brand zone: 6 spacing tightened (`mb-4→3`, `mt-3→2`, `mt-4→3`,
   `mt-5→4`, `mt-6→4`, `mt-5→4`).
4. Gates: 55 files / 499 passed, tsc 0, lint 0 err / 55 warn (baseline),
   build PASS (102 kB), prod :3100 `/fa` 200 (1 H1, markers), dev :3000
   restored 200.

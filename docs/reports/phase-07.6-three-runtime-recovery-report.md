# Phase 7.6 — Next.js Three.js Vendor-Chunk Runtime Recovery Report

Date: 2026-09-22. Scope: runtime recovery ONLY. No Phase 8 work, no CMS
change, no homepage redesign, no animation change, no Hero3D change, no
dependency change, no database change. Phase 7.5 was ACCEPTED and remains
the baseline (backend 143 passed, frontend 174/25 files, tsc 0 errors,
ESLint 0 errors / 55 warnings, production `/fa` 200).

All three prerequisite reports were read before any action:
`phase-06.1-runtime-recovery-report.md`, `phase-07-cms-content-homepage-report.md`,
`phase-07.5-cms-acceptance-audit-report.md`.

---

## 1. Executive Summary

**Status: RECOVERED — root cause proven by controlled reproduction.**

- The reported `GET /fa` 500 (`Cannot find module './vendor-chunks/three.js'`)
  was reproduced and fully evidenced BEFORE any change: identical require
  stack, `vendor-chunks/` containing only `@swc.js` + `next.js`, all files
  of the same build generation, no `*three*` file anywhere in `.next`.
- Dependency graph, Hero3D import graph, and `next.config.ts` were all
  audited and **exonerated** (single deduped `three@0.185.1`, correct
  `'use client'` boundaries, zero webpack customization).
- Recovery (`stop dev → delete ONLY .next → start dev`) was proven **4×**.
- The trigger was found and **reproduced deterministically**: running
  `npm run build` while `next dev` is live wipes the dev server's
  incrementally-compiled `vendor-chunks/` out from under it; the live dev
  process keeps referencing dev chunk IDs (`vendor-chunks/three.js`,
  `vendor-chunks/motion-dom.js`, …) that no longer exist on disk → 500 on
  subsequent requests. `next dev` and `next build` share one `.next`
  directory with no coordination.
- This also explains the session-start breakage: Phase 7.5 ended with a
  fresh `npm run build` + production probes, and the dev server was
  (re)started on top of build-output `.next` state — the same shared-`.next`
  hazard that caused Phase 6.1 (whose report identified the stale cache but
  not the build/dev interleaving trigger).
- No source file was modified, no dependency was touched, no database
  action was taken. All regression suites match the Phase 7.5 baseline
  exactly. Phase 8 was NOT started.

## 2. Current Failure

Captured before any change (2026-09-22, ~08:15–08:21 file generation):

- `GET http://127.0.0.1:3000/fa` → **500**. `GET /favicon.ico` → **200**.
- Error page payload (`__NEXT_DATA__`, `page: /_error`, `statusCode: 500`):
  `Cannot find module './vendor-chunks/three.js'` with require stack:
  `.next/server/webpack-runtime.js` →
  `.next/server/app/[locale]/(public)/page.js` →
  `next/dist/server/require.js` → `load-components.js` → `build/utils.js`
  → `server/dev/static-paths-worker.js` → jest-worker `processChild.js`.
  The `static-paths-worker` frame proves the serving process is `next dev`.
- The chunk ID `vendor-chunks/three` is referenced from three compiled dev
  page bundles (`[locale]/(public)/page.js`, `.../products/page.js`,
  `.../services/page.js`) but no such chunk file was ever emitted.

## 3. Previous Phase 6.1 Comparison

| Evidence | Phase 6.1 | Phase 7.6 (this time) |
|---|---|---|
| Error + require stack | identical | identical |
| `vendor-chunks/` content at failure | only `@swc.js` + `next.js` | only `@swc.js` + `next.js` |
| `three` installed / lockfile match | yes, `0.185.1` | yes, `0.185.1` |
| Nested three under drei→stats-gl | `0.170.0`, left alone | `0.170.0`, left alone |
| Import boundaries | sound (`'use client'` chain) | sound, re-verified |
| Fix applied | delete `.next`, restart | delete `.next`, restart (4× proven) |
| Trigger identified | **not identified** (stale cache only) | **identified + reproduced**: `next build` run while `next dev` is live (or dev (re)started over build-output `.next`) |
| `next.config` role | none | none (re-audited, still no webpack customization) |

What is different this time: the 6.1 report stopped at "stale/corrupt
cache". This phase proves the *mechanism that corrupts it*: the shared
`.next` directory between a live dev server and a production build.

## 4. Preflight

- The dev server found running at session start (`next dev`, PIDs
  26348→22492→15808, on :3000) was left untouched until all Step 1–4
  evidence was collected. No file was deleted before evidence capture.
- Backend Django runserver (`manage.py runserver`, PID 15292, on :8000)
  was running and was never stopped, restarted, or modified.
- Unrelated processes (Adobe CC node 13292, 9router nodes 18960/19204)
  were identified by command line and never touched.

## 5. Git/Process State

- Branch: `master`. HEAD: `342d1da HomePagePhase7Done` (same as Phase 7.5
  baseline; Phase 7.5 fixes remain uncommitted by the operator).
- `git status` at start: 4 modified files (exactly the two justified Phase
  7.5 fixes: `serializers/homepage.py` +41, `tests/test_phase7.py` +66,
  `homepage-form.ts` +10, `homepage-form.test.ts` +14) + 1 untracked file
  (`docs/reports/phase-07.5-cms-acceptance-audit-report.md`). No other
  delta. `git diff --stat` at end is byte-identical to start (129
  insertions, 2 deletions across the same 4 files) — **zero changes by
  this phase**.
- Processes at start: exactly ONE Next project instance
  (`npm run dev` 26348 → `next dev` 22492 → server child 15808, the
  `start-server.js` child is Next 15's normal dev-server worker, not a
  second server). No orphan/duplicate `next dev` or `next start`. Ports:
  :3000 (dev), :8000 (Django); :3001/:3100/:5173 free.
- End state: one `next dev` instance serving :3000 (:8000 Django
  untouched). The :3100 production probe server was stopped (PID 24992)
  and verified gone.

## 6. `.next` Evidence

Recorded BEFORE deletion (broken state):

- `.next/` last write 08:18:52; `webpack-runtime.js` 08:21:23;
  `(public)/page.js` 08:21:22; vendor chunks 08:21:22–23 — all the same
  build generation (no跨-generation mixing; the chunks were simply never
  emitted, not left over from an older build).
- `vendor-chunks/`: exactly 2 files, `@swc.js` (26,388 B) + `next.js`
  (9,606,158 B). No `three.js`, no `*three*` file anywhere under `.next/`.
- Mechanism (read from `webpack-runtime.js:190-198`): chunk loader does
  `installChunk(require("./" + __webpack_require__.u(chunkId)))` with
  `u(chunkId) => chunkId + ".js"`, so page bundle chunk ID
  `vendor-chunks/three` resolves to `require("./vendor-chunks/three.js")`
  → `MODULE_NOT_FOUND`. No literal `three` string exists in
  `webpack-runtime.js` (the ID arrives from the page bundle at runtime),
  which is why the failure is an emission gap, not a code reference bug.
- Healthy state (after each recovery): 60+ vendor chunks including
  `three.js` (6,742,989 B), `@react-three.js`, `framer-motion.js`, etc.

## 7. Dependency Graph

`npm ls three --all`: top-level `three@0.185.1`; `@react-three/fiber@9.6.1`
→ `three@0.185.1 deduped`; `@react-three/drei@10.7.7` → all deps deduped
to `0.185.1` EXCEPT `stats-gl@2.4.2 → three@0.170.0` (nested, unchanged
since Phase 6.1). Lockfile agrees (`node_modules/three` = `0.185.1`).
Resolution is deterministic; no install/upgrade/dedupe was performed (none
was needed — inconsistency was disproven by the successful recoveries on
the untouched tree).

## 8. Three.js Version Matrix

| Package | Declared | Installed | Required By | Resolution |
|---|---|---|---|---|
| next | ^15.5.21 | 15.5.21 | root | ok |
| react | 19.2.4 | 19.2.4 | root | ok |
| react-dom | 19.2.4 | 19.2.4 | root | ok |
| three | ^0.185.1 | 0.185.1 | root, fiber, drei (+7 drei sub-deps deduped) | single version |
| @react-three/fiber | ^9.6.1 | 9.6.1 | root | resolves to top-level three |
| @react-three/drei | ^10.7.7 | 10.7.7 | root | resolves to top-level three |

Nested only: `three@0.170.0` under `@react-three/drei → stats-gl@2.4.2`
(peer/optional diagnostic overlay; not imported by `Hero3D`, which uses
only `Canvas/useFrame` + `Float/Stars/MeshDistortMaterial`). No action
taken — same standing as Phase 6.1 §27.

## 9. Hero3D Import Graph

`src/app/[locale]/(public)/page.tsx` (server: metadata + render) →
`./homepage-client` (`'use client'`, line 1) → `@/components/home`
`HeroSection` (`'use client'`, line 1) → `Hero3D` (`'use client'`, line 1).
Grep over all of `src/`: the ONLY files importing `three`,
`@react-three/fiber`, or `@react-three/drei` are the three import lines in
`Hero3D.tsx` (lines 3–5). All 20+ home components carry `'use client'`.
Boundaries are the standard, correct pattern (identical to Phase 6.1
finding). No component was read for rewriting and none was modified.

## 10. Next.js Configuration Audit

`next.config.ts` (39 lines): only `eslint.ignoreDuringBuilds: false` and
`images.remotePatterns` (Phase 5.2 media-origin logic). **No**
`webpack` override, `experimental.*`, `transpilePackages`,
`serverExternalPackages`, `optimizePackageImports`, aliases, or externals.
`tsconfig` and `package.json` scripts are stock (`dev/build/start/lint/
typecheck/test`). Nothing in project configuration can produce a
referenced-but-unemitted vendor chunk. No configuration change was made.

## 11. Root Cause

**Primary category: A. STALE/CORRUPT NEXT BUILD CACHE — with a proven,
reproducible trigger (contributing factor: D-class process interaction,
not configuration).**

`next dev` and `next build` share the single `abr-energy-frontend/.next`
directory with no locking. Running `npm run build` while `next dev` is
live replaces `.next/server/vendor-chunks/` (the dev server's
incrementally compiled chunks) with production-build layout; the still-
running dev process keeps its in-memory chunk graph referencing dev chunk
IDs, so the next request requiring a not-yet-reloaded chunk fails with
`Cannot find module './vendor-chunks/<name>.js'`. A dev (re)start over a
build-output/mixed `.next` can likewise boot with an incomplete vendor-
chunk set. Dependencies (C), configuration (D), and import boundaries (E)
were each investigated and exonerated with evidence; no orphan-process
conflict (B) existed (single dev instance verified by PID/parent/command-
line analysis).

## 12. Recovery Steps

Only ever: stop the project's Next processes → verify :3000 free →
`Remove-Item .next` (and nothing else) → start `npm run dev` → `GET /fa`.
`node_modules`, `package-lock.json`, sources, and the database were never
touched. No reinstall, no upgrade, no downgrade, no config edit.

## 13. Reproducibility Cycles

| # | Procedure | Result |
|---|---|---|
| A | stop → delete `.next` → `next dev` → `/fa` | **200** (75,878 B; `three.js` 6.7 MB regenerated) |
| B | stop → restart WITHOUT deleting `.next` → `/fa` | **200** (healthy dev cache survives plain restarts) |
| C | stop → delete `.next` → `next dev` → `/fa` | **200** |
| Trigger | healthy dev running → `npm run build` (completed, "Compiled successfully") → `GET /fa` WITHOUT any restart | **500** — `Cannot find module './vendor-chunks/motion-dom.js'`, same stack; `vendor-chunks/` reduced to `@swc.js` + `next.js` |
| Final | stop → delete `.next` → `next dev` → `/fa`, `/fa/products` | **200 / 200**, `three.js` present |

The trigger experiment reproduces the exact failure family on demand
(chunk name varies with whichever chunk the dev graph needs next —
`three.js` at session start, `motion-dom.js` in the experiment).

## 14. Dev Runtime Verification

Final healthy dev (:3000): `/fa` **200** (exactly one `<h1`, `dir="rtl"`,
slogan words present in TextReveal spans, no `Powering the Future`
fallback, no `vendor-chunks` error text, `<canvas>` present);
`/fa/products` **200** (empty catalog, `count: 0` — correct hide-on-empty,
no fake data); `/favicon.ico` **200**; `GET /api/v1/homepage/` **200**;
anonymous `PATCH /api/v1/admin/homepage/` **401**. No real product slugs
exist in the dev DB (`/api/v1/products/` → `count: 0`), so product-detail
verification is empty-state only (products list renders 200 with no rows).

## 15. Production Runtime Verification

`npm run build` → success (3× this session, incl. full route table with
`/fa`, `/fa/products`, `/fa/products/[slug]`, `/[locale]/admin/content/
homepage` present in `app-path-routes-manifest.json`). `next start -p
3100` → `/fa` **200** (75,479 B; one h1, RTL, slogan words, no fallback,
canonical + `og:title` present, 9 `data-section` blocks, no vendor error);
`/fa/products` **200**. Prod server stopped cleanly afterwards (port
verified free). Note: the Step 7 prod probe is also what set up the
shared-`.next` hazard that later reproduced the bug — see §24.

## 16. Three.js/R3F Verification

- `Hero3D.tsx`, `HeroSection.tsx`, `homepage-client.tsx`, `page.tsx`:
  byte-identical (no diff); R3F `<Canvas>` marker (`<canvas>`) present in
  served HTML; dev + prod responses contain zero module errors; no React
  Three Fiber initialization error in responses; no `three.js`
  `MODULE_NOT_FOUND` after recovery.
- **Client-side canvas verification NOT TESTED** (no browser automation
  available in this environment; same standing as Phase 7.5). No claim of
  WebGL rendering is made — only that the bundling/runtime path serving
  Hero3D is healthy.

## 17. Process/Port Verification

- Session start: single project dev chain (`npm` 26348 → `next dev`
  22492 → worker 15808) on :3000; Django :8000 (15292, untouched);
  unrelated nodes (Adobe, 9router) identified and never touched.
- Every stop was verified (`netstat` shows no listener) before `.next`
  removal/restart. No orphan Next processes at end: one `next dev` chain
  on :3000, Django on :8000, :3100 free.
- Incidental observation: at 08:29:16 a fresh `next dev` instance
  (`cmd /d /s /c next dev`) appeared while Step 7's production build
  output occupied `.next`, and the dev compilation from that mixed state
  reproduced the exact session-start failure — consistent with the proven
  trigger, recorded here as corroborating field evidence (not as a
  controlled step).

## 18. Phase 7 Regression Verification

- CMS: `/[locale]/admin/content/homepage` present in production build
  manifest (prerenders); `GET /api/v1/homepage/` 200 (11-key payload,
  8 seeded sections); anonymous admin PATCH 401 (unchanged);
  content_manager/customer permission paths covered by the green backend
  suite (no auth file touched).
- Homepage: `/fa` 200 dev + prod; one H1; Persian slogan (TextReveal word
  spans, same as 6.1/7.5); RTL; Hero3D import chain intact; CursorGlow /
  FloatingParticles / MouseRipple / GradientMesh / ScrollReveal /
  TextReveal / parallax / tilt / ScrollProgress / PageTransition all
  present in source (untouched — zero diff) with `<canvas>` + 9
  `data-section` blocks in served HTML.
- CMS data: no content created, no fake data; empty relations render
  rails-hidden (verified live against real `count: 0` backend).

## 19. Automated Tests

| Suite | Result | Baseline (7.5) |
|---|---|---|
| Backend `pytest` (`AbrEnergy/`) | **143 passed** (4.86 s) | 143 — exact match |
| Frontend `vitest run` | **174 passed / 25 files** | 174 / 25 — exact match |
| `tsc --noEmit` | exit 0, 0 errors | exact match |
| `npm run lint` | 0 errors, 55 warnings | exact match |
| `npm run build` | success (×3) | success |

No test was added, weakened, skipped, or re-counted. ~15 `media/**` files
generated by this session's pytest run were deleted afterwards (same test-
byproduct hygiene as Phase 7.5 §4); final tree matches session start plus
this report.

## 20. Files Changed

**Application source changes: NONE.** `git diff --stat` at end =
`git diff --stat` at start (4 Phase 7.5 files, 129+/2-, all pre-existing
and uncommitted by the operator; untouched by this phase). No homepage,
CMS, Hero3D, config, dependency, or backend file was modified. No
developer-workflow helper script was added (deliberately — see §24).

## 21. Dependency Changes

NONE. No install, upgrade, downgrade, dedupe, lockfile regeneration, or
`node_modules` removal. `package.json` / `package-lock.json` byte-
identical. Nested `three@0.170.0` (drei→stats-gl) documented, not touched.

## 22. Database Changes

NONE. No migration, seed, flush, drop, reset, or content edit. Dev DB
verified read-only (`products count: 0`, homepage 8 seeded sections as
left by Phase 7.5). The temp-user round-trip technique from Phase 7.5 was
not needed and not repeated.

## 23. Remaining Risks

1. **Recurrence is procedural, not structural**: anyone running
   `npm run build` (or `next start`验证) while `next dev` is live, or
   (re)starting dev over a build-output `.next`, can re-trigger this exact
   500. The fix is always the same 3-step recovery, but it will keep
   biting until the workflow rule (§24) is followed.
2. **Nested `three@0.170.0`** (drei→stats-gl): exonerated for this
   incident (failure is an emission gap, version-independent — the missing
   chunk name varies), kept as deferred debt per 6.1 §27.
3. **No browser/WebGL sign-off** this phase (NOT TESTED, §16); R3F canvas
   health is inferred from bundling + SSR markers only.
4. **8:29 field observation** (§17) is corroboration, not a controlled
   step — the controlled trigger test (§13) is the proof.

## 24. Recommended Developer Workflow

Do NOT run a production build while the dev server is live — stop `next
dev` first, build/verify, then either keep serving production or delete
`.next` before returning to dev. Canonical recovery/switching sequence:

1. Stop dev (`Ctrl+C` / stop the process) and verify :3000 is free.
2. `Remove-Item .next -Recurse -Force` (Windows) / `rm -rf .next` (POSIX).
3. Start what you need (`npm run dev` or `npm run build` + `npm run start`).

No `dev:clean` script was added: the only portable implementation needs a
new `rimraf`-class dependency, which the phase rules forbid as unnecessary,
and a platform-specific `rmdir` script would be worse than the documented
3-step rule above. If a helper is ever wanted, it should be revisited as a
dedicated, dependency-free change — not smuggled into a recovery phase.

## 25. Final Status

**RECOVERED — root cause proven.** `/fa` 200 in dev and prod; `three.js`
vendor chunk consistently emitted; trigger reproduced and documented;
suites exactly at Phase 7.5 baseline; zero source/dependency/database
changes. STOP — Phase 8 NOT started (no draft/preview/scheduling/
campaigns/multilingual/A-B/approval/DAM/cart/checkout/payment/builder/
drag-drop/CKEditor work of any kind).

## 26. STOP CONDITION

Runtime recovery is complete. The dev server on :3000 serves `/fa` 200,
production build + `/fa` 200 verified, report written. No Phase 8 work
begun. Awaiting review of this report before any next phase.

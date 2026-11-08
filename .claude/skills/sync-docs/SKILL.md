---
name: sync-docs
description: Use after changing frontend code to find which files under .claude/rules or CLAUDE.md must be updated so the project docs stay true. Maps each kind of change to its document.
---

# Keep the docs in sync

Run `git diff --name-only` and map each changed file with this table. Edit the doc in the same commit as the code.

| Changed | Update |
|---|---|
| New or removed `src/app/**/page.tsx` | `.claude/rules/pages-and-routes.md` route table |
| `src/services/*`, `src/types/index.ts` | `patterns.md` if the calling pattern changed; otherwise nothing (the backend registry is the source) |
| `src/lib/api.ts`, `env.ts`, `errors.ts`, `tokens.ts` | `CLAUDE.md` conventions or gotchas |
| `src/lib/entitlement.ts`, `retention.ts`, `billing.ts`, `payments.ts`, billing or payments pages | `.claude/rules/billing-ui.md` |
| Lucky-draw page, `components/lucky-draw/*`, `useSpinSound`, `draw-sound.ts`, sound file | `.claude/rules/lucky-draw-ui.md` |
| New shared component, hook or helper pattern | `.claude/rules/patterns.md` |
| `middleware.ts`, layouts, `DashboardShell` | `CLAUDE.md` conventions and `pages-and-routes.md` header |
| `public/sw.js`, `manifest.ts`, `next.config.ts` | `CLAUDE.md` gotchas |
| `.github/workflows/*` | `CLAUDE.md` deploy section |
| A lesson learned the hard way | `CLAUDE.md` gotchas (one line) |

## How

1. List the changed files.
2. For each matching row, open the doc and make a surgical edit. No rewrites, no duplication between files.
3. Keep `CLAUDE.md` under 150 lines.
4. Run the `doc-standards` checklist.

## Checklist

- [ ] Every new route is in `pages-and-routes.md`
- [ ] No doc references a component, hook or constant that no longer exists
- [ ] Copy rules (no "free trial", no country marketing) still stated once, in `CLAUDE.md`
- [ ] `wc -l CLAUDE.md` under 150

---
name: commit-check
description: Use before every git commit in this repo. Runs lint, type check and tests, confirms UI changes were looked at in a browser, checks the docs under .claude, then commits. Never pushes.
---

# Commit check (frontend)

Do not commit until every step is green, and show the output.

## 1. The gate

```bash
npm run lint
npx tsc --noEmit
npm test
```

There is no Husky hook here. **Do not run Prettier**; it is not a dependency and reformats whole files.

## 2. Browser check for UI changes

Open the changed page at 390 px and 1280 px. Console has no errors. Dark overlays have readable headings. Toasts and dialogs show real messages, not "Validation failed".

## 3. Tests for changed helpers

Any changed or new file in `src/lib/` has a colocated `*.test.ts` covering the behaviour and its edges. Never skip or delete a test to go green.

## 4. Docs

Run the `sync-docs` skill so `.claude/rules/` and `CLAUDE.md` match the code in the same commit.

## 5. Commit

`fix(area): ...` / `feat(area): ...` / `chore(...)`, body says why. Commit only; **pushing deploys to production**. Push when the owner asks, then confirm the deploy is live (new `.next/BUILD_ID`, pm2 restarted after it, `/ready` 200).

## 6. Report

What changed, what was skipped and why, which commands passed.

---
name: doc-standards
description: Use when creating or editing CLAUDE.md, .claude/rules/*.md or .claude/skills/*/SKILL.md in this repo. The format rules that keep the instructions short, true and non-duplicated.
---

# Documentation standards

## CLAUDE.md

- Under 150 lines. It is loaded on every task, so every line costs attention.
- Order: one-line overview, tech stack, commands, structure, conventions, gotchas, domain index, deploy, mandatory verification.
- Gotchas are one line each and name the file or symbol.
- The domain index only points; a fact that lives in a rule file is not repeated.

## `.claude/rules/*.md`

- One file per domain. Plain markdown, no frontmatter. Always loaded, so tables over prose, real symbol names, code blocks under ten lines.
- Each file starts with the files it describes.
- Date anything that can go stale ("hidden since 2026-09-27").

## `.claude/skills/<name>/SKILL.md`

- Frontmatter with `name` and a `description` that says **when** to use it.
- One workflow per skill, steps pointing at real files, ending with a checklist.

## Everything

- English, plain words, no em dashes. `sena-temp` in docs; `KIMates` only in user-facing copy.
- No secrets or personal data. Credentials live outside the repo.
- Remove a line when it stops being true.

## Checklist

- [ ] `wc -l CLAUDE.md` under 150
- [ ] No fact appears in two files
- [ ] Every referenced file and symbol exists
- [ ] New skill has `name` and a trigger-style `description`
- [ ] Dates on anything that can go stale

# Financial Management

A static, client-side personal finance app. Multi-currency (CAD / USD / BRL out of the box, configurable), dark/light themed, PT-BR + EN, persisted in `localStorage`. Deployed to GitHub Pages.

## Status

Phase 1 — Foundation. Scaffold + theme + i18n + storage + rates + app shell + GitHub Pages deploy. No domain features yet (Phase 2 / 3).

See:

- Spec: `docs/superpowers/specs/2026-05-02-financial-management-design.md`
- Plan: `docs/superpowers/plans/2026-05-02-phase-1-foundation.md`
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md) — follows [Keep a Changelog](https://keepachangelog.com/).

## Develop

Requires Node 22 LTS (see `.nvmrc`).

```bash
nvm use   # picks Node 22 from .nvmrc
npm install
npm run dev
```

## Test / Lint / Type-check / Build

```bash
npm test
npm run lint
npm run check
npm run build
```

## Deploy

Push to `main`. The GitHub Action at `.github/workflows/deploy.yml` builds with `GITHUB_PAGES=true` and publishes to GitHub Pages.

> **First-time setup:** in the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**. The next push to `main` (or a manual `workflow_dispatch` run) will publish the site.

## Conventions

- All identifiers, filenames, comments, and commit messages in **English**.
- Hard limit: **200 lines per file** (enforced by ESLint `max-lines`).
- No hardcoded colors outside `src/theme/`.
- No inline UI strings outside `src/i18n/`.

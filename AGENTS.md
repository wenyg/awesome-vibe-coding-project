# AGENTS.md

## Cursor Cloud specific instructions

This is a **pure static site** built with [Astro](https://astro.build/) (Node.js). There is no backend/database; GitHub Issues + Actions act as the "backend" (see `DEVELOPMENT.md`). Project data lives as JSON files in `src/content/projects/`.

### Services & commands

There is a single service (the Astro dev server). Standard commands are defined in `package.json` and documented in `DEVELOPMENT.md`:

- Dev server: `npm run dev` → serves at `http://localhost:4321`
- Build: `npm run build` → outputs static files to `dist/`
- Preview built output: `npm run preview`

### Non-obvious notes

- There is **no lint or test script** configured in `package.json`. Type checking via `npx astro check` requires the optional `@astrojs/check` + `typescript` packages and will **prompt interactively to install them** — avoid running it non-interactively (it hangs waiting for input). Treat `npm run build` as the primary correctness check.
- `astro.config.mjs` switches `site`/`base` based on `PUBLIC_DEPLOY_TARGET`. Leave it unset for local dev (root path); the deploy workflow sets it to `github-pages`.
- The AI submission pipeline (`scripts/parse-issue.mjs`) and vote sync (`scripts/update-votes.mjs`) only run inside GitHub Actions and need a `GITHUB_TOKEN`; they are not part of local dev.

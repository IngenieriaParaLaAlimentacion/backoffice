# Contributing

## Development setup

```bash
npm install
```

Git hooks (`lint-staged` via Husky) are installed automatically — no separate
`pre-commit install`-style step needed (see README.md).

## Branching

CI (`pr-branch-policy.yaml`) enforces this on every PR:

- PRs into `develop` must come from `feat/*`, `fix/*`, `refactor/*`, `docs/*`,
  or `chore/*`.
- PRs into `main` are only accepted from `develop`.

Example: `feat/add-user-auth`, `fix/email-validation`, `docs/update-readme`.

## Commits

This project follows [Conventional Commits](https://www.conventionalcommits.org/).
Scope is optional.

```
<type>(<scope>): <description>

feat(geo): add georef address autocomplete
fix(surveys): correct duplicate survey status
docs: update README
refactor: extract shared revoke-access hook
```

Common types: `feat`, `fix`, `docs`, `refactor`, `chore`.

## Pull Requests

- Keep PRs small and focused — if a task is large, split it into incremental PRs.
- Delete the remote branch after merging.

## CI/CD

GitHub Actions runs on every push (`ci.yml`):

- Lint (`npm run lint`)
- Type check (`npm run typecheck`)
- Build (`npm run build`)
- Semgrep SAST scan
- Docker image build (verification only, not pushed)

## Tests

Tests use **Vitest**, **Testing Library**, and **MSW** (mocked backend, no
real database/service dependency needed).

```bash
# Run all tests
npm run test

# With coverage report
npm run test:ci
```

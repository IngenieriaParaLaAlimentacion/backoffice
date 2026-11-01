# Contributing

## Development setup

Follow the [installation steps in the README](README.md#installation).

Git hooks (`lint-staged` via Husky) are installed automatically by `npm install`. Before every commit they run ESLint and Prettier on the staged files, so do not bypass them with `--no-verify`.

## Branching

We use two long-lived branches:

- `develop`: integration branch. Every working branch starts from `develop` and goes back into `develop` through a PR.
- `main`: release branch. It only receives PRs from `develop`. Never merge working branches into it or commit directly to `main`.

CI ([`pr-branch-policy.yaml`](.github/workflows/pr-branch-policy.yaml)) enforces this on every PR:

- PRs into `develop` must come from `feat/*`, `fix/*`, `refactor/*`, `docs/*` or `chore/*`.
- PRs into `main` are only accepted from `develop`.

Examples: `feat/add-user-auth`, `fix/email-validation`, `docs/improve-docs`.

## Commits

This project follows [Conventional Commits](https://www.conventionalcommits.org/). Scope is optional.

```
<type>(<scope>): <description>

feat(geo): add georef address autocomplete
fix(surveys): correct duplicate survey status
docs: update README
refactor: extract shared revoke-access hook
```

Common types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `ci`.

## Pull Requests

- Target `develop`. Only releases go from `develop` to `main`.
- Keep PRs small and focused. If a task is large, split it into incremental PRs.
- Delete the remote branch after merging.

## CI/CD

GitHub Actions runs [`ci.yml`](.github/workflows/ci.yml) on every pull request and on pushes to `develop` and `main`:

- Lint (`npm run lint`).
- Type check (`npm run typecheck`).
- Unit tests with coverage (`npm run test:ci`), uploaded to Codecov.
- Build (`npm run build`).
- Semgrep SAST scan.
- Docker image build (verification only, not pushed).

Other workflows:

- [`e2e.yml`](.github/workflows/e2e.yml) runs the Playwright E2E suite against the backend stack on PRs into `develop` or `main`, on pushes to `main` and on demand. See [`docs/e2e.md`](docs/e2e.md).
- [`audit.yml`](.github/workflows/audit.yml) runs `npm run audit` when a PR or push changes the dependencies, and every Monday.
- [`manual-pages.yml`](.github/workflows/manual-pages.yml) publishes the user manual to GitHub Pages from `develop`.
- [`pr-branch-policy.yaml`](.github/workflows/pr-branch-policy.yaml) validates the source branch of every PR into `develop` or `main`.
- [`claude.yml`](.github/workflows/claude.yml) runs Claude Code when `@claude` is mentioned in an issue, a comment or a pull request review.

## Tests

Unit and component tests use **Vitest**, **Testing Library** and **MSW** (mocked backend, no real database or service needed). Tests are co-located next to their subject.

```bash
# Run all tests
npm run test

# With coverage report
npm run test:ci

# Run a specific file
npx vitest run path/to/file.test.ts
```

Codecov expects at least **70%** coverage for the project and for every patch ([`codecov.yml`](codecov.yml)). What counts toward coverage is set in `vitest.config.ts`, so `npm run test:ci` reports the same number locally.

Browser E2E tests (`npm run e2e`) run against a disposable backend stack. See [`docs/e2e.md`](docs/e2e.md).

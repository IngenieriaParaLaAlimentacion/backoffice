# Ingeniería en Alimentación · Backoffice

[![es](https://img.shields.io/badge/lang-es-red.svg?logo=googletranslate&logoColor=white)](README.es.md)
[![Node](https://img.shields.io/badge/node-24%20LTS-5FA04E.svg?logo=nodedotjs&logoColor=white)](package.json)
[![codecov](https://codecov.io/gh/IngenieriaParaLaAlimentacion/backoffice/graph/badge.svg)](https://codecov.io/gh/IngenieriaParaLaAlimentacion/backoffice)

Admin backoffice for the **Ingeniería para la Alimentación** project, built with Next.js (App Router), TypeScript and shadcn/ui.

---

## Documentation

- [User manual](https://ingenieriaparalaalimentacion.github.io/backoffice/) for administrators and analysts, in Spanish: read it online, or as [HTML](docs/manual-usuario/index.html) or [PDF](docs/manual-usuario/manual.pdf). The [editable sources](docs/manual-usuario/README.md) are also in the repository.
- [Architecture](docs/architecture.md): layering, auth flow, mocking, geo adapter, map, forms and testing setup.
- [Conventions](docs/conventions.md): Next.js conventions and how the repo avoids duplication.
- [Architecture decision records (ADRs)](docs/adr/).
- [E2E setup and sessions](docs/e2e.md): credentials, Chromium, reset, CI reports.
- [Contributing guide](CONTRIBUTING.md).
- [Development conventions for agents](CLAUDE.md).

---

## Prerequisites

| Tool    | Minimum version | Notes                                              |
| ------- | --------------- | -------------------------------------------------- |
| Node.js | 24 LTS          | Using `nvm` to manage Node versions is recommended |
| npm     |                 | Bundled with Node.js                               |
| Docker  |                 | Only for `docker compose` and the E2E tests        |

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/IngenieriaParaLaAlimentacion/backoffice.git
cd backoffice

# 2. Install dependencies
npm install

# 3. Create the environment file
cp .env.example .env
```

Git hooks (`lint-staged` via Husky) are installed automatically: `npm install` runs the `prepare` script of `package.json`, so no extra step is needed.

---

## Environment variables

Edit the `.env` created from `.env.example`:

| Variable                          | Description                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`        | Base URL of the backend API. Defaults to `http://localhost:3000/` when unset                       |
| `NEXT_PUBLIC_ENABLE_MSW`          | `true` runs the app against mocked data instead of a real backend                                  |
| `NEXT_PUBLIC_MAP_TILES`           | Base map of the establishments map: `ignColor` (default), `ign` or `osm`                           |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Only needed if the geo provider is switched to Google Places                                       |
| `INTERNAL_SERVICE_TOKEN`          | Server-only secret shared with the backend, which must have the same value. Leave empty to disable |
| `CLIENT_IP_HEADER`                | Header where the edge proxy writes the caller's address. Defaults to `x-real-ip`                   |
| `PORT`                            | Port used by `docker-compose.yml`                                                                  |

> `NEXT_PUBLIC_*` variables are inlined into the client bundle at build time. The server-only variables are read at runtime.

---

## Running

```bash
# Development server with hot reload
npm run dev

# Or using Docker
docker compose up --build
```

The app is available at `http://localhost:3000`. To work without a backend, set `NEXT_PUBLIC_ENABLE_MSW=true`.

---

## Tests

Unit and component tests use **Vitest**, **Testing Library** and **MSW** to mock the backend.

```bash
# Run all tests
npm run test

# With a coverage report
npm run test:ci

# Run a specific file
npx vitest run path/to/file.test.ts
```

Browser E2E tests use **Playwright** against a disposable backend stack. They need Docker and access to the private backend image:

```bash
npm run e2e
```

See [E2E setup and sessions](docs/e2e.md) for credentials, Chromium installation, reset, CI reports and the other `e2e:*` scripts.

---

## Linting and formatting

The project uses **ESLint 9** (flat config) and **Prettier**.

```bash
# Check for lint errors
npm run lint

# Type-check the app and the E2E suite
npm run typecheck
```

**lint-staged** runs ESLint and Prettier on the staged files before every commit, through Husky.

---

## Dependency audit

```bash
# Fails on high or critical vulnerabilities in runtime dependencies (CI runs it too)
npm run audit
```

---

## Contributing

Read the [contributing guide](CONTRIBUTING.md) before opening a PR: branches, commits and review.

---

## License

Academic project — **group-193**.

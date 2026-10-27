# Backoffice

[![es](https://img.shields.io/badge/lang-es-yellow.svg)](README.es.md)
[![Node](https://img.shields.io/badge/node-24%20LTS-green.svg)](package.json)

Admin backoffice for the **Food Engineering** project (Ingeniería Para La
Alimentación), developed with Next.js (App Router), TypeScript, and shadcn/ui.

---

## User manual

Spanish user guide for administrators and analysts: [HTML](docs/manual-usuario/index.html) · [PDF](docs/manual-usuario/manual.pdf) · [Editable sources](docs/manual-usuario/README.md).

## Prerequisites

| Tool    | Minimum Version        |
| ------- | ---------------------- |
| Node.js | 24 LTS                 |
| npm     | (bundled with Node.js) |

> For local development, using `nvm` to manage Node versions is recommended.

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/IngenieriaParaLaAlimentacion/backoffice.git

# 2. Install dependencies
npm install
```

Git hooks (`lint-staged` via Husky) are installed automatically — `npm install`
runs the `prepare` script (`package.json`) on its own, so no separate step like
Poetry's `pre-commit install` is needed.

---

## Environment Variables

Create a `.env` file in the project root based on `.env.example`.

> `NEXT_PUBLIC_*` variables are inlined into the client bundle at build time. Set
> `NEXT_PUBLIC_ENABLE_MSW=true` to run the app against mocked data instead of a
> real backend.

---

## Running the Application

```bash
# Development server with hot-reload
npm run dev

# Or using Docker
docker compose up --build
```

The app will be available at `http://localhost:3000`.

---

## Tests

Tests use **Vitest**, **Testing Library**, and **MSW** to mock the backend.

```bash
# Run all tests
npm run test

# With coverage report
npm run test:ci

# Run a specific file
npx vitest run path/to/file.test.ts
```

---

## Linting and Formatting

The project uses **ESLint 9** (flat config) and **Prettier**.

```bash
# Check for linting errors
npm run lint

# Type-check
npm run typecheck
```

**lint-staged** runs these automatically before each commit via Husky.

---

## Technologies

| Technology  | Version |
| ----------- | ------- |
| Node.js     | 24.x    |
| NextJS      | ^16.2.3 |
| React       | 19.2.4  |
| TypeScript  | ^5      |
| ESLint      | ^9      |
| Prettier    | 3.8.1   |
| lint-staged | 16.4.0  |

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the development workflow, and
[`CLAUDE.md`](CLAUDE.md) / [`docs/`](docs/) for architecture and coding
conventions.

---

## License

Academic project — **group-193**.

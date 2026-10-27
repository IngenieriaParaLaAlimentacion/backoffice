# Backoffice

[![en](https://img.shields.io/badge/lang-en-blue.svg)](README.md)
[![Node](https://img.shields.io/badge/node-24%20LTS-green.svg)](package.json)

Panel de administración para el proyecto **Ingeniería Para La Alimentación**,
desarrollado con Next.js (App Router), TypeScript y shadcn/ui.

---

## Manual de usuario

Guía para administradores y analistas: [HTML](docs/manual-usuario/index.html) · [PDF](docs/manual-usuario/manual.pdf) · [Fuentes editables](docs/manual-usuario/README.md).

## Requisitos previos

| Herramienta | Versión mínima         |
| ----------- | ---------------------- |
| Node.js     | 24 LTS                 |
| npm         | (incluido con Node.js) |

> Para el desarrollo local, se recomienda usar `nvm` para gestionar las versiones
> de Node.

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/IngenieriaParaLaAlimentacion/backoffice.git

# 2. Instalar dependencias
npm install
```

Los git hooks (`lint-staged` vía Husky) se instalan automáticamente —
`npm install` ejecuta el script `prepare` (`package.json`) por sí solo, así que
no hace falta un paso extra como `pre-commit install` en Poetry.

---

## Variables de entorno

Creá un archivo `.env` en la raíz del proyecto basado en `.env.example`.

> Las variables `NEXT_PUBLIC_*` se incrustan en el bundle del cliente al
> momento del build. Configurá `NEXT_PUBLIC_ENABLE_MSW=true` para correr la app
> contra datos simulados en lugar de un backend real.

---

## Ejecutar la aplicación

```bash
# Servidor de desarrollo con hot-reload
npm run dev

# O usando Docker
docker compose up --build
```

La app estará disponible en `http://localhost:3000`.

---

## Tests

Los tests usan **Vitest**, **Testing Library** y **MSW** para simular el
backend.

```bash
# Correr todos los tests
npm run test

# Con reporte de cobertura
npm run test:ci

# Correr un archivo específico
npx vitest run path/to/file.test.ts
```

---

## Linting y formateo

El proyecto usa **ESLint 9** (flat config) y **Prettier**.

```bash
# Verificar errores de lint
npm run lint

# Chequeo de tipos
npm run typecheck
```

**lint-staged** ejecuta estas verificaciones automáticamente antes de cada
commit vía Husky.

---

## Tecnologías

| Tecnología  | Versión |
| ----------- | ------- |
| Node.js     | 24.x    |
| NextJS      | ^16.2.3 |
| React       | 19.2.4  |
| TypeScript  | ^5      |
| ESLint      | ^9      |
| Prettier    | 3.8.1   |
| lint-staged | 16.4.0  |

---

## Contribuir

Consultá [`CONTRIBUTING.md`](CONTRIBUTING.md) para el flujo de trabajo de
desarrollo, y [`CLAUDE.md`](CLAUDE.md) / [`docs/`](docs/) para conocer la
arquitectura y las convenciones de código.

---

## Licencia

Proyecto académico — **group-193**.

# Ingeniería en Alimentación · Backoffice

[![en](https://img.shields.io/badge/lang-en-red.svg?logo=googletranslate&logoColor=white)](README.md)
[![Node](https://img.shields.io/badge/node-24%20LTS-5FA04E.svg?logo=nodedotjs&logoColor=white)](package.json)
[![codecov](https://codecov.io/gh/IngenieriaParaLaAlimentacion/backoffice/graph/badge.svg?token=2WHK1M5H51)](https://codecov.io/gh/IngenieriaParaLaAlimentacion/backoffice)

Panel de administración del proyecto **Ingeniería para la Alimentación**, desarrollado con Next.js (App Router), TypeScript y shadcn/ui.

---

## Documentación

> La documentación técnica está en inglés.

- [Manual de usuario](https://ingenieriaparalaalimentacion.github.io/backoffice/) para administradores y analistas: leelo en línea, o en [HTML](docs/manual-usuario/index.html) o [PDF](docs/manual-usuario/manual.pdf). Las [fuentes editables](docs/manual-usuario/README.md) también están en el repositorio.
- [Arquitectura](docs/architecture.md): capas, flujo de autenticación, mocks, adaptador geo, formularios y configuración de tests.
- [Funcionalidades](docs/features.md): notas de diseño del mapa de establecimientos, las pestañas del establecimiento, el reporte nutricional y la página de verificación de email.
- [Convenciones](docs/conventions.md): convenciones de Next.js y cómo el repo evita la duplicación.
- [Decisiones de arquitectura (ADR)](docs/adr/).
- [Configuración y sesiones E2E](docs/e2e.md): credenciales, Chromium, reinicio y reportes de CI.
- [Guía de contribución](CONTRIBUTING.md).
- [Convenciones de desarrollo para agentes](CLAUDE.md).

---

## Requisitos previos

| Herramienta | Versión mínima | Notas                                                         |
| ----------- | -------------- | ------------------------------------------------------------- |
| Node.js     | 24 LTS         | Se recomienda usar `nvm` para gestionar las versiones de Node |
| npm         |                | Incluido con Node.js                                          |
| Docker      |                | Solo para `docker compose` y los tests E2E                    |

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/IngenieriaParaLaAlimentacion/backoffice.git
cd backoffice

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env
```

Los git hooks (`lint-staged` vía Husky) se instalan automáticamente: `npm install` ejecuta el script `prepare` de `package.json`, así que no hace falta un paso extra.

---

## Variables de entorno

Editá el `.env` creado a partir de `.env.example`:

| Variable                          | Descripción                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`        | URL base de la API del backend. Si no se define, usa `http://localhost:3000/`                             |
| `NEXT_PUBLIC_ENABLE_MSW`          | Con `true`, la app corre contra datos simulados en lugar de un backend real                               |
| `NEXT_PUBLIC_MAP_TILES`           | Mapa base del mapa de establecimientos: `ignColor` (predeterminado), `ign` u `osm`                        |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Solo hace falta si el proveedor geo se cambia a Google Places                                             |
| `INTERNAL_SERVICE_TOKEN`          | Secreto solo del servidor, compartido con el backend, que debe tener el mismo valor. Vacío lo deshabilita |
| `CLIENT_IP_HEADER`                | Encabezado donde el proxy de borde escribe la dirección del cliente. Por defecto, `x-real-ip`             |
| `PORT`                            | Puerto que usa `docker-compose.yml`                                                                       |

> Las variables `NEXT_PUBLIC_*` se incrustan en el bundle del cliente al momento del build. Las variables solo del servidor se leen en tiempo de ejecución.

---

## Ejecución

```bash
# Servidor de desarrollo con hot reload
npm run dev

# O usando Docker
docker compose up --build
```

La app queda disponible en `http://localhost:3000`. Para trabajar sin backend, configurá `NEXT_PUBLIC_ENABLE_MSW=true`.

---

## Tests

Los tests unitarios y de componentes usan **Vitest**, **Testing Library** y **MSW** para simular el backend.

```bash
# Correr todos los tests
npm run test

# Con reporte de cobertura
npm run test:ci

# Correr un archivo específico
npx vitest run path/to/file.test.ts
```

Los tests E2E del navegador usan **Playwright** contra un entorno descartable del backend. Necesitan Docker y acceso a la imagen privada del backend:

```bash
npm run e2e
```

La [guía E2E](docs/e2e.md) explica credenciales, instalación de Chromium, reinicio, reportes de CI y el resto de los scripts `e2e:*`.

---

## Linting y formato

El proyecto usa **ESLint 9** (flat config) y **Prettier**.

```bash
# Verificar errores de lint
npm run lint

# Chequeo de tipos de la app y de la suite E2E
npm run typecheck
```

**lint-staged** ejecuta ESLint y Prettier sobre los archivos en staging antes de cada commit, vía Husky.

---

## Auditoría de dependencias

```bash
# Falla ante vulnerabilidades altas o críticas en dependencias de runtime (también corre en CI)
npm run audit
```

---

## Contribuir

Leé la [guía de contribución](CONTRIBUTING.md) antes de abrir un PR: ramas, commits y revisión.

---

## Licencia

Proyecto académico — **group-193**.

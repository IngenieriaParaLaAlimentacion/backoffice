# Plan: hacer el backoffice responsive

## Contexto

El backoffice (Next.js 16 + Tailwind v4 + shadcn/ui) fue construido enteramente para desktop. Un relevamiento de todo `app/` y `components/` confirma que **el único lugar con breakpoints reales es `app/dashboard/page.tsx`** (`sm:grid-cols-2 lg:grid-cols-3`); todo el resto usa anchos y layouts fijos:

- `AppShell`/`SideBar`: sidebar persistente (220px/60px) sin variante mobile — no hay forma de navegar sin él.
- 6 páginas de listado (`usuarios/[role]`, `usuarios` home, `sujetos`, `encuestas`, `solicitudes`, `establecimientos`, `mediciones-antropometricas`) repiten el mismo patrón: `<table>` + `overflow-x-auto` como única estrategia mobile.
- `sujetos` y `solicitudes` muestran el panel de detalle como una `Card w-[28rem]` fija al costado de la tabla — no entra en mobile.
- `app/(auth)/layout.tsx` tiene la card de login con `w-[400px]` fijo.
- En cambio, los `Dialog` de Base UI (`UserDetailPanel`, el drawer de evolución en mediciones, `InviteUserDialog`, `CreateSurveyDialog`) ya usan `w-full max-w-md`/`max-w-sm`, que es un patrón responsive por naturaleza — sirve de modelo a replicar en el resto.

El objetivo es incorporar breakpoints (`sm` 640 / `md` 768 / `lg` 1024, los defaults de Tailwind, ya en uso) de forma incremental, en pasos chicos y probables uno por uno con el navegador redimensionado o el device toolbar de devtools, sin tocar lógica de datos/fetching — solo layout y presentación.

## Paso 1 — Navegación mobile (el de mayor impacto, toca todas las páginas)

Convertir el shell en: sidebar persistente en `md+` (como hoy) + drawer deslizable en mobile.

- `components/SideBar.tsx`: agregar `hidden md:flex` al `<aside>` raíz (queda oculto por completo debajo de `md`).
- `components/MobileNav.tsx` (nuevo): drawer con el mismo patrón `Dialog` de Base UI que ya usan `UserDetailPanel`/`CreateSurveyDialog` (`Dialog.Backdrop` + `Dialog.Popup fixed inset-y-0 left-0 w-full max-w-[280px]`), reutilizando el array `navItems` exportado de `SideBar.tsx` y el componente `SideBarItem` (pasándole `isSidebarOpen={true}` siempre, ya que en el drawer no hay estado colapsado). Incluye logout. Se cierra al tocar el backdrop, la X, o al navegar (cerrar en el `onClick` de cada link, o con un `useEffect` sobre `usePathname`).
- `components/AppShell.tsx`: agrega un header mobile-only (`flex md:hidden h-14 items-center gap-2 px-3 border-b bg-card shrink-0`) con botón hamburguesa (abre `MobileNav`) + logo, ubicado arriba de `<main>`. Levanta el estado `isMobileNavOpen`.

**Probar:** `npm run dev`, achicar la ventana / device toolbar a ~375px y ~768px. Verificar: en `<768px` el sidebar desaparece y aparece el header con hamburguesa; el drawer abre, lista los mismos 7 items + perfil + logout, resalta la ruta activa, y navega correctamente; en `≥768px` el comportamiento actual (sidebar colapsable) queda intacto.

## Paso 2 — Auth layout (quick win, aislado)

- `app/(auth)/layout.tsx`: cambiar `w-[400px]` fijo por `w-full max-w-[400px] mx-4` (o `mx-auto` + padding horizontal en el contenedor externo) para que la card respire en pantallas angostas.

**Probar:** signin, forgot-password, reset-password, invite (`/invite`, `/invite/admin`, `/invite/analyst`) a 320–375px de ancho — sin corte ni scroll horizontal.

## Paso 3 — Polish del "page shell" compartido

Las ~8 páginas de dashboard comparten el mismo esqueleto (`<div className="flex flex-1 p-4"><Card className="flex-1 p-8 flex flex-col gap-6">`) con header `flex items-start justify-between gap-4` y una barra de filtros `flex flex-wrap items-end gap-3` con inputs de ancho fijo (`w-64`, `w-40`, `w-56`, `w-72`).

Aplicar, página por página (empezando por `usuarios/[role]/page.tsx` como piloto y confirmando antes de replicar):
- `Card` padding: `p-8` → `p-4 md:p-8`.
- Header: `flex items-start justify-between` → `flex flex-col gap-3 md:flex-row md:items-start md:justify-between` (título+subtítulo arriba, acción debajo en mobile).
- Inputs/selects de filtro con ancho fijo → `w-full sm:w-64` (etc., mismo valor que tenían en `sm+`), para que en mobile cada filtro ocupe el ancho disponible en vez de verse apretado dentro del `flex-wrap`.

Páginas a tocar: `usuarios/[role]/page.tsx`, `usuarios/page.tsx`, `sujetos/page.tsx`, `encuestas/page.tsx`, `establecimientos/page.tsx`, `solicitudes/page.tsx`, `mediciones-antropometricas/page.tsx`, `dashboard/page.tsx` (solo el padding, el grid ya es responsive).

**Probar:** cada página a 375/768/1024px — headers y filtros deben apilarse/desapilarse sin overflow horizontal ni elementos cortados.

## Paso 4 — Tablas → lista de cards en mobile

Patrón: envolver la `<table>` existente en `hidden md:block`, y agregar un hermano `md:hidden flex flex-col gap-2` que renderiza los mismos datos como cards apiladas (nombre en negrita + resto de campos como label/valor, reutilizando el mismo `onClick` de la fila para abrir el detalle).

- **Piloto:** `app/dashboard/usuarios/[role]/page.tsx` (la tabla más simple, 3 columnas). Implementar, probar a 375px, confirmar que abrir el detalle de usuario sigue funcionando desde la card.
- Si el markup de la card se repite igual entre páginas, evaluar extraer un presentational chico (`components/ui/mobile-list-item.tsx`) recién en ese punto — no antes, para no abstraer de más sobre un solo caso.
- **Rollout**, una página por vez, mismo patrón: `sujetos/page.tsx` → `encuestas/page.tsx` → `solicitudes/page.tsx` → `establecimientos/page.tsx` → `usuarios/page.tsx` (las 3 `RoleSection` de la home de usuarios) → `mediciones-antropometricas/page.tsx`.

**Probar:** cada página a 375px (cards, sin scroll horizontal) y 1024px (tabla intacta, sin regresión).

## Paso 5 — Unificar paneles de detalle al patrón Dialog

`sujetos/page.tsx` (línea ~367) y `solicitudes/page.tsx` (línea ~225) muestran el detalle como `<Card className="w-[28rem] shrink-0">` al costado de la tabla — no cabe en mobile y difiere del patrón ya usado en `UserDetailPanel.tsx` y el drawer de evolución en `mediciones-antropometricas/page.tsx`.

- Convertir ambos a `Dialog.Root` + `Dialog.Popup className="fixed inset-y-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl"`, mismo look & feel que los otros dos paneles.

**Probar:** abrir un detalle de sujeto y una revisión de solicitud a 375px (drawer full-width) y 1440px (drawer max-w-md) — mismo comportamiento que ya tiene `UserDetailPanel`.

## Paso 6 — Detalles puntuales restantes

- `components/MeasurementEvolutionChart.tsx`: ya usa `ResponsiveContainer` — sin cambios necesarios, solo confirmar en el paso de QA.
- `app/dashboard/mediciones-antropometricas/page.tsx` línea ~540: `grid grid-cols-2 gap-4` dentro del drawer de evolución → `grid grid-cols-1 sm:grid-cols-2 gap-4` (a 375px con `p-6` de padding del drawer, 2 columnas quedan apretadas para labels largos).
- `components/encuestas/QuestionEditor.tsx`: el contenido secundario (tipo de respuesta, checkbox "requerida", opciones) usa `pl-8` para alinearse bajo el input — en mobile ese padding fijo le come espacio útil; cambiar a `pl-0 sm:pl-8`.
- Revisar en el mismo paso, sin cambios anticipados salvo que se detecte algo en pruebas: `establecimientos/crear/page.tsx`, `perfil/page.tsx`, `perfil/editar/page.tsx`, `encuestas/nueva/page.tsx`, `encuestas/[id]/page.tsx` (no auditados en detalle, pero construidos con los mismos primitivos `AppTextField`/`Input`/`Card` ya vistos, que ya son responsive por defecto).

**Probar:** formulario de creación/edición de encuesta completo y drawer de evolución de mediciones a 375px.

## Paso 7 — QA final cruzado

- Recorrer las ~15 rutas del dashboard a 375px, 768px y 1440px (Chrome devtools device toolbar), confirmando: sin scroll horizontal accidental, sin texto cortado, targets táctiles usables (~44px) en botones de paginación/acciones.
- `npm run lint` y `npm run build` para asegurar que no quedaron errores de TS/ESLint por los cambios de clases.

## Notas de alcance

- No se toca lógica de fetching, hooks (`useUsers`, `useSurveys`, etc.) ni servicios — es un cambio puramente de presentación/layout.
- No se agrega ningún hook de JS para detectar breakpoints (`matchMedia`/`useMediaQuery`): todo se resuelve con clases responsive de Tailwind, ya usadas en el proyecto, más el estado local `isMobileNavOpen` del Paso 1.
- Cada paso queda en un estado funcional y probable por sí solo — se puede commitear/revisar de a uno.

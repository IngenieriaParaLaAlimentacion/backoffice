# Playwright en el backoffice: issues propuestas

Documento de planificación. **No hay código de implementación.** Ya subidas al proyecto: la
Issue 1 (backend#209), la Issue 2 (backend#210), la Issue 3 (backoffice#105) y la Issue 4
(backoffice#106). La Issue 5 es un borrador para quien tome el manual y la Issue 6 está diferida.
Son **5 issues para esta tanda** (2 en backend, 3 en backoffice) más una diferida (la 6, agentes), escritas con el formato de las issues del
proyecto [Ingeniería Para la Alimentación](https://github.com/orgs/IngenieriaParaLaAlimentacion/projects/1):
campos `Épica`, `Descripción` (Como / quiero / para), `Criterios de aceptación` (`CA N: título` con
checkboxes), `Puntos de historia`, `Tipo de historia` y `Notas`.

Convenciones tomadas de las issues existentes:

- Título con prefijo `[US]` (valor para una persona usuaria) o `[TASK]` (infraestructura,
  como #85 y #94). Aquí se usa `[TASK]` para infraestructura y `[US]` para el manual.
- Épica: se propone **Transversal (infraestructura)** para todas, porque no cuelga de un módulo
  funcional (ver P1).
- Labels: `backend` + `user-story` en backend; `backoffice` en backoffice (como hoy).
- Los CA van a nivel de negocio, sin nombres de archivos; el detalle técnico va en Notas.

---

## 1. Hallazgos que condicionan el diseño

Verificados leyendo `backoffice` y `backend` (`../backend`).

| #   | Hallazgo                                                                                                                                                                            | Consecuencia                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1  | El refresh token **rota y es de un solo uso** (`backend/app/services/auth/auth_service.py:187-215`) y el backoffice lo usa en **cada carga de página** (`context/AuthContext.tsx`). | Un `storageState` compartido entre tests o workers deja al segundo deslogueado. La decisión "storageState por rol" necesita una variante (login por worker). |
| H2  | Login limitado a **5/min por email** y 20/min por IP, con Redis (`backend/.env.example`).                                                                                           | En CI hay que subir esos límites.                                                                                                                            |
| H3  | El `CMD` del `Dockerfile` del backend ya ejecuta migraciones y seeds, y también corre en Railway (`railway.toml`).                                                                  | El seed de referencia no puede correr en producción.                                                                                                         |
| H4  | Roles del backend: `superadmin`, `admin`, `analyst`, `field_worker` (`app/domain/user.py`). `backend/CLAUDE.md` dice 3 y está desactualizado.                                       | En la UI, admin y superadmin son iguales. Se prueban **admin, analyst y field_worker** (este último como caso negativo y para crear datos por API).          |
| H5  | `SMTP_ENABLED=false` por defecto: los mails solo se loguean.                                                                                                                        | Invitar usuarios, recuperar contraseña y verificar email **no entran** en esta primera etapa.                                                                |
| H6  | `NEXT_PUBLIC_API_BASE_URL` se evalúa **en build** (`next.config.ts`). El fallback apunta a `localhost:3000`, el propio backoffice.                                                  | El `webServer` de Playwright tiene que buildear con la URL del backend de CI.                                                                                |
| H7  | El CI del backoffice corre `on: push`, sin `pull_request`. El backend no publica imágenes (`docker build` con `push: false`).                                                       | El workflow de E2E necesita trigger propio, y hay que crear la publicación en GHCR.                                                                          |
| H8  | No hay Playwright ni `data-testid` en el backoffice. Vitest busca `*.test.ts(x)`.                                                                                                   | Los specs deben vivir aparte (`*.spec.ts`) para que Vitest no los recoja.                                                                                    |

---

## 2. Issues

### Issue 1: backend

**Título:** `[TASK] Publicar la imagen del backend y dejarla lista para pruebas E2E`
**Repo:** backend · **Labels:** `backend`, `user-story`

```markdown
### Épica

Transversal (infraestructura)

### Descripción

**Como** integrante del equipo de frontend,
**quiero** que el CI del backend publique su imagen Docker y que pueda correr sin servicios externos ni límites que molesten,
**para** levantar un backend real y versionado en el CI del backoffice y correr las pruebas E2E sin construirlo ahí.

### Criterios de aceptación

**CA 1: Publicación**

- [ ] Cada push a `develop` y a `main` publica la imagen en GitHub Container Registry, con tags `develop` o `main` y el commit (`sha-<commit>`).
- [ ] Los PRs no publican ninguna imagen.

**CA 2: Acceso**

- [ ] La imagen es privada y el CI del repo backoffice puede descargarla con el token de su propio workflow, sin secretos manuales.

**CA 3: Arranque en CI**

- [ ] Con la imagen, PostgreSQL y Redis, el backend arranca, migra y responde "listo" sin configurar almacenamiento de archivos, Gemini ni SMTP.

**CA 4: Entorno de pruebas**

- [ ] Existe un conjunto de variables de entorno documentado y versionado para pruebas E2E, sin secretos reales.
- [ ] Con ese conjunto, 30 logins seguidos del mismo usuario en un minuto no son rechazados por el límite de intentos.

**CA 5: Documentación**

- [ ] El README o la documentación del backend indica el nombre de la imagen, los tags y cómo levantarla junto con sus dependencias.

### Puntos de historia

3

### Tipo de historia

⭐ Obligatoria

### Notas

- **Decisión tomada:** el CI del backoffice usa el tag `develop`, porque detecta antes los cambios del backend que rompen al frontend. El workflow registra en el log el commit exacto de la imagen usada, para saber de quién es el problema si falla. Como el job E2E no es check requerido, no bloquea PRs. Si hay muchas roturas ajenas, se pasa a un commit fijo (es cambiar una línea).
- Hoy el job `docker-build` construye la imagen con `push: false`. El `CMD` del `Dockerfile` ya corre migraciones y seeds al arrancar.
- Redis es obligatorio (límite de intentos). Con `SMTP_ENABLED=false` los mails solo se loguean.
- Hay que verificar que GHCR esté habilitado en la organización y dar acceso del paquete al repo backoffice.
```

### Issue 2: backend

**Título:** `[TASK] Datos de referencia para pruebas y manual de usuario`
**Repo:** backend · **Labels:** `backend`, `user-story`

```markdown
### Épica

Transversal (infraestructura)

### Descripción

**Como** integrante del equipo,
**quiero** un conjunto de datos de referencia con usuarios de todos los roles y datos realistas y estables,
**para** que las pruebas E2E y las capturas del manual de usuario partan siempre del mismo estado.

### Criterios de aceptación

**CA 1: Usuarios por rol**

- [ ] Existen usuarios de administrador, analista y relevador, con credenciales fijas, activos y con email verificado, además del superadmin actual.
- [ ] Cada uno puede iniciar sesión.

**CA 2: Datos de dominio**

- [ ] Hay establecimientos con direcciones reales de Argentina (el mapa se ve poblado), relevadores con acceso aprobado, sujetos con mediciones, stock con movimientos y al menos una encuesta FIES publicada con respuestas.
- [ ] Cada pantalla principal del backoffice muestra al menos un registro.

**CA 3: Repetible**

- [ ] Correrlo dos veces no falla ni duplica datos.

**CA 4: Nunca en producción**

- [ ] El comando no corre en el arranque normal del servicio ni en el deploy a producción.

**CA 5: Documentación**

- [ ] Están documentados cómo ejecutarlo y las credenciales de prueba (datos ficticios).

### Puntos de historia

5

### Tipo de historia

⭐ Obligatoria

### Notas

- **Decisión tomada:** se ejecuta como **script** (como `seed_superadmin.py` y `seed_food_catalog.py`), no como endpoint: no agrega una puerta nueva a la API y no puede quedar expuesto en producción por error.
- Hoy solo existen el seed del superadmin y el del catálogo de alimentos, y ambos corren en el `CMD` del `Dockerfile` (también en Railway). El script nuevo se ejecuta aparte (por ejemplo con `docker compose run`), no desde el `CMD`. Los helpers de `tests/integration/helpers.py` sirven de referencia.
- Los tests E2E crean sus propios datos por API; este seed es solo la base estable.
- **Verificado:** las respuestas de encuesta se crean con `POST /api/v1/surveys/{id}/responses`, y la puede enviar cualquier rol (relevador, analista, admin, superadmin). Si la encuesta apunta a sujetos hay que mandar `subject_id`, y si apunta a establecimientos, `establishment_id`. Cada sujeto o establecimiento solo puede responder una vez (409 si repite), así que el seed necesita **un sujeto distinto por respuesta**. Un analista necesita tener acceso aprobado al establecimiento.
- **Verificado:** la API casi no permite borrar. Los únicos `DELETE` de datos de negocio son los de encuestas, y solo si no tienen respuestas. No hay borrado de establecimientos, sujetos, mediciones, solicitudes ni movimientos. Por eso el seed debe poder **reconstruirse desde cero** (base nueva) y no depender de limpieza.
```

### Issue 3: backoffice

**Título:** `[TASK] Pruebas E2E con Playwright en CI: base, sesión por rol y primeros flujos`
**Repo:** backoffice · **Labels:** `backoffice`

```markdown
### Épica

Transversal (infraestructura)

### Descripción

**Como** integrante del equipo,
**quiero** una base de pruebas E2E con Playwright que corra en el CI contra un backend real,
**para** detectar regresiones del backoffice antes de mergear.

### Criterios de aceptación

**CA 1: Configuración**

- [ ] `npm run e2e` buildea el backoffice, lo levanta y corre las pruebas con Chromium; Firefox y WebKit quedan definidos pero desactivados.
- [ ] `npm run test`, `lint` y `typecheck` siguen pasando y Vitest no ejecuta las pruebas de Playwright.

**CA 2: Sesión por rol**

- [ ] Las pruebas arrancan ya autenticadas como administrador o analista, con credenciales leídas del entorno.
- [ ] Con 2 workers y 10 pruebas en paralelo con el mismo rol, 5 corridas seguidas no fallan por sesión vencida.

**CA 3: Datos de prueba**

- [ ] Cada prueba crea sus propios datos por API con nombres únicos, de modo que no choca con otras pruebas ni con una corrida anterior.
- [ ] En el CI la base se descarta al terminar la corrida; en local hay un comando documentado para reconstruirla desde cero.

**CA 4: Convenciones**

- [ ] Hay una guía breve de cómo elegir elementos (por rol y etiqueta primero, `data-testid` solo cuando no alcance) y Page Objects de inicio de sesión y menú.

**CA 5: CI**

- [ ] El workflow corre en cada PR a `develop` y `main` y en cada push a `main`, levantando backend, base de datos y Redis desde la imagen publicada.
- [ ] Al fallar, el reporte HTML y las trazas quedan como artefactos descargables.
- [ ] El job no figura como check requerido.

**CA 6: Primeros flujos**

- [ ] Inicio y cierre de sesión: login correcto, contraseña incorrecta, acceso sin sesión que redirige a `/signin` y sesión inválida que redirige a `/signin`.
- [ ] Permisos por rol: un analista no ve Solicitudes ni Usuarios en el menú, no entra a esas pantallas por URL y no ve las acciones de crear o eliminar.

**CA 7: Pruebas inestables**

- [ ] Las pruebas marcadas `@quarantine` quedan fuera de la corrida principal y existe un criterio escrito para pasar el job a requerido.

### Puntos de historia

5

### Tipo de historia

⭐ Obligatoria

### Notas

- **Dependencia:** requiere las dos issues del backend: imagen publicada (backend#209) y datos de referencia (backend#210). Se puede avanzar en local contra el `compose.yml` del backend antes de que la imagen esté publicada.
- **Decisión tomada, sesión:** login **por worker**. Cada worker de Playwright inicia sesión una vez por rol y comparte esa sesión entre sus tests. Se apoya en el entorno de CI con límites de login altos (backend#209). Hay que verificar que el estado de sesión se actualice cuando un test renueva el token, y documentar la estrategia.
- **Ojo con la sesión:** el refresh token rota y es de un solo uso, y el backoffice lo usa en cada carga de página. Un `storageState` reutilizado entre workers deja al segundo test deslogueado; por eso no se comparte entre workers.
- **Decisión tomada, puertos:** backend en `8080` y backoffice en `3001`, que es el valor que el backend espera en `BACKOFFICE_DEEPLINK_BASE` (`.env.example`). Hay que fijarlo explícito, porque el fallback de `next.config.ts` apunta a `localhost:3000`.
- **Ojo con el build:** `NEXT_PUBLIC_API_BASE_URL` se fija en el build, así que el `webServer` debe buildear con la URL del backend de CI.
- **Tipos y lint:** `tsconfig.json` incluye `**/*.ts` pero excluye solo `*.test.ts(x)`, así que los `*.spec.ts` se chequean. Tiene `types: ["vitest/globals"]`, que puede chocar con los tipos de Playwright; si choca, `e2e/` lleva su propio `tsconfig`. Excluir `e2e/` de `vitest.config.ts` y de `.dockerignore`.
- **Decisión tomada, alcance:** la política de `@quarantine` y el criterio de paso a requerido quedan en esta issue (son cortos). Si hay que achicarla, es lo primero que se saca.
- **Decisión tomada, tamaño:** se mantiene como una sola issue de 5 puntos: el CI sin pruebas no demuestra nada y las pruebas sin CI no sirven al equipo.
- **Sin limpieza por API:** el backend no permite borrar establecimientos, sujetos, mediciones ni solicitudes (solo encuestas sin respuestas). Por eso se aísla con datos de nombre único y, en CI, con una base descartable por corrida. Esto cambia la decisión original de que cada test "limpia sus propios datos".
- El CI actual solo tiene `on: push`; el workflow nuevo necesita `pull_request`.
- Propuesta del criterio de paso a requerido: 10 corridas seguidas en verde sobre `develop`.
- Conviene que el reporte marque como "flaky" las pruebas que pasaron solo en un reintento.
- Si la issue crece más de lo previsto, la forma natural de partirla es "configuración + sesión + flujos" por un lado y "workflow de CI" por otro.
```

### Issue 4: backoffice

**Título:** `[US] Pruebas E2E de los flujos críticos del backoffice`
**Repo:** backoffice · **Labels:** `backoffice`

```markdown
### Épica

Transversal (infraestructura)

### Descripción

**Como** integrante del equipo,
**quiero** que los flujos más importantes del backoffice estén cubiertos por pruebas E2E,
**para** poder cambiar el código con confianza y no romper lo que el equipo usa todos los días.

### Criterios de aceptación

**CA 1: Alta y edición de establecimientos**

- [ ] Un administrador crea un establecimiento eligiendo una dirección de la lista de sugerencias y lo ve en el listado; con el formulario vacío ve los errores de validación.
- [ ] Un administrador edita nombre y dirección, y un analista edita solo la ficha; los cambios persisten al recargar.

**CA 2: Solicitudes**

- [ ] Un administrador aprueba y rechaza una solicitud de creación de establecimiento; solo la aprobada aparece en el listado.
- [ ] Un administrador aprueba a un relevador y su acceso a un establecimiento, y luego lo revoca desde la ficha.

**CA 3: Encuestas**

- [ ] Un administrador crea una encuesta desde la plantilla FIES, cambia su estado y la duplica.
- [ ] Un analista ve las respuestas de una encuesta y las exporta; el archivo descargado tiene el nombre indicado por el servidor.

**CA 4: Stock**

- [ ] Un administrador registra una entrada y una salida de alimentos, y el stock y el historial se actualizan; una salida mayor al stock muestra el error.

**CA 5: Sujetos y mediciones**

- [ ] Un analista filtra sujetos por edad, abre la evolución de uno y exporta el listado.

**CA 6: Independencia**

- [ ] Cada prueba crea sus propios datos con nombres únicos y puede correr sola o en cualquier orden.

### Puntos de historia

8

### Tipo de historia

⭐ Obligatoria

### Notas

- **Dependencia:** requiere la base de pruebas E2E del backoffice (issue anterior) y los datos de referencia del backend (backend#210).
- **Decisión tomada, una sola issue:** cubre todos los flujos importantes y se entrega en **varios PRs, uno por grupo de CA**. El proyecto tiene el campo _Parent issue_, así que si más adelante hace falta repartir, cada CA se puede abrir como sub-issue sin rehacer nada.
- **Prioridad si hay que recortar:** núcleo = CA 1 (establecimientos), CA 2 (solicitudes) y CA 3 (encuestas); después CA 4 (stock) y CA 5 (sujetos y mediciones).
- **Decisión tomada, direcciones:** el autocompletado llama desde el navegador a la API pública `apis.datos.gob.ar/georef`, y el botón de crear está deshabilitado hasta elegir una dirección. Las pruebas **interceptan esa llamada** con una respuesta fija, porque lo que se prueba es el formulario y no el servicio del Estado. Se pierde probar esa integración real. Los mosaicos externos del mapa del listado tampoco deben condicionar las pruebas.
- **Decisión tomada, solicitudes:** las solicitudes de creación y los registros de relevadores se generan **por API** (cualquier rol puede crear una solicitud) y las pruebas verifican la revisión del administrador. No se recorre la pantalla de "proponer" del analista.
- **Exportaciones:** se verifica que el archivo se descarga con el nombre que indica el servidor y que la cantidad de filas coincide con la declarada; no se revisa el contenido interno.
- **Pregunta abierta:** la lista de flujos es una propuesta a partir de las rutas y permisos del código; falta validarla con producto (5 a 10 flujos).
- **Fuera de esta etapa:** invitar usuarios, recuperar contraseña y verificar email, porque dependen de recibir un mail (hoy con SMTP desactivado solo se loguea). Entrarían con un servidor de mail de pruebas.
```

### Issue 5: backoffice (BORRADOR: la define otra persona)

> Decisión: no se sube ni se cierra acá. Queda como borrador para quien tome el manual de
> usuario. Lo único decidido es el formato: **PDF**. Quedan por definir quién escribe el texto
> (en el repo como Markdown o en Google Docs), la política de versiones en Drive y si existe la
> cuenta de servicio de Google con la carpeta.

**Título:** `[US] Manual de usuario con capturas automáticas publicado en Drive`
**Repo:** backoffice · **Labels:** `backoffice`

```markdown
### Épica

Transversal (infraestructura)

### Descripción

**Como** persona usuaria del backoffice,
**quiero** encontrar en una carpeta de Drive un manual actualizado con capturas de las pantallas reales,
**para** aprender a usar el sistema sin depender de que alguien me lo explique.

### Criterios de aceptación

**CA 1: Contenido**

- [ ] El manual tiene una sección por pantalla principal (acceso, inicio, establecimientos, solicitudes, usuarios, encuestas, sujetos y mediciones, perfil) e indica qué rol la ve.

**CA 2: Capturas automáticas**

- [ ] Cada sección incluye capturas generadas por Playwright con los datos de referencia, con tamaño de pantalla fijo y los datos que cambian (fechas, contadores) ocultos.
- [ ] Dos generaciones seguidas sobre los mismos datos dan capturas equivalentes.

**CA 3: Documento**

- [ ] Se combina el texto con las capturas en un único documento (PDF o Google Doc) con la versión del backoffice y la fecha.
- [ ] Si falta una captura referenciada, la generación falla indicando cuál.

**CA 4: Publicación**

- [ ] Una corrida manual o una release sube el documento a la carpeta de Drive indicada.
- [ ] Si algo falla no se sube nada.

**CA 5: Sin bloqueos**

- [ ] Este proceso no corre en los PRs ni bloquea el CI normal.

### Puntos de historia

8

### Tipo de historia

⭐ Obligatoria

### Notas

- **Dependencia:** requiere los datos de referencia del backend y la base de Playwright del backoffice.
- **Decisión tomada:** el texto vive versionado en el repo (propuesta: Markdown) y se combina con las capturas; las capturas salen de un proyecto de Playwright separado (`docs`) que corre en cada release o con `workflow_dispatch`.
- **Pregunta abierta:** quién mantiene el texto y dónde se edita.
- **Pregunta abierta:** formato final (PDF, Google Doc o ambos) y si el documento de Drive se reemplaza o se agrega uno por versión.
- **Pregunta abierta:** cómo estabilizar el mapa en las capturas (mosaicos externos).
- **Prerrequisito manual:** una cuenta de servicio de Google con acceso a la carpeta y su secreto en GitHub Actions. No sabemos si ya existe.
- Hoy `docs/screenshots/` solo tiene 3 capturas sueltas del módulo de egresos.
- Fuera de alcance: regresión visual con `toHaveScreenshot` y videos tutoriales.
```

### Issue 6: backoffice (DIFERIDA: fuera de esta tanda)

> Decisión: no se sube por ahora. Aporta poco mientras la suite sea chica; tiene más sentido
> medirla cuando existan las Issues 3 y 4 y haya una suite real contra la cual comparar.

**Título:** `[TASK] Explorar los agentes de Playwright con Claude Code`
**Repo:** backoffice · **Labels:** `backoffice`

```markdown
### Épica

Transversal (infraestructura)

### Descripción

**Como** integrante del equipo,
**quiero** probar el planner, el generator y el healer de Playwright con Claude Code,
**para** decidir si ayudan a escribir y mantener las pruebas E2E.

### Criterios de aceptación

**CA 1: Prueba acotada**

- [ ] Se prueban el planner y el generator sobre un flujo ya cubierto a mano y se compara el resultado con la prueba existente.
- [ ] Se prueba el healer sobre una prueba rota a propósito.

**CA 2: Informe**

- [ ] Hay un informe de una página con qué se probó, qué salió bien y mal, tiempo y costo, y una recomendación: adoptar, adoptar con reglas o descartar.

**CA 3: Reglas**

- [ ] Todo código generado por un agente pasa por revisión de PR.
- [ ] El healer no se ejecuta de forma autónoma en el CI.
- [ ] Un cambio del healer exige explicar qué selector o paso cambió y por qué, sin debilitar aserciones ni borrar pasos.
- [ ] `CLAUDE.md` tiene una sección corta de E2E que enlaza las reglas.

### Puntos de historia

3

### Tipo de historia

_Sin definir_

### Notas

- **Dependencia:** requiere la base de pruebas E2E y al menos un flujo cubierto.
- Se usa `npx playwright init-agents --loop=claude`, que agrega archivos de definición de agentes en `.claude/`. Documentar cuáles y si conviene versionarlos.
- Tiempo sugerido: 1 a 2 días. Ya existen los workflows `claude.yml` y `claude-code-review.yml`, que hay que tener en cuenta.
```

---

## 3. Orden y dependencias

```
Backend (en paralelo)                 Backoffice
─────────────────────                 ──────────
Issue 1  Imagen + entorno ───┐
Issue 2  Datos de referencia ┼──► Issue 3  Base E2E + CI + 2 flujos ──┬─► Issue 4  Flujos críticos
                             │          (puede arrancar en local      ├─► Issue 5  Manual (también usa Issue 2)
                             │           contra el compose del        └─► Issue 6  Spike de agentes
                             │           backend, antes de Issue 1)
```

1. **Primero, en paralelo:** Issues 1 y 2 (backend) y arrancar la Issue 3 en local.
2. **Después, en paralelo:** Issues 4, 5 y 6.

## 4. Preguntas abiertas

| ID     | Pregunta                                                                                                                                                                           | Issue |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| P1     | ¿Épica **Transversal (infraestructura)** para todas, o el manual va a otra?                                                                                                        | todas |
| ~~P2~~ | ~~Qué tag de la imagen usa el CI del backoffice~~ **Resuelta:** `develop`, registrando el commit en el log.                                                                        | 1, 3  |
| ~~P3~~ | ~~Seed por script o endpoint; endpoints de borrado~~ **Resuelta:** script; casi no hay borrado, se aísla con datos únicos y base descartable.                                      | 2, 3  |
| ~~P4~~ | ~~Cómo se crean las respuestas de encuesta~~ **Resuelta:** `POST /surveys/{id}/responses`, cualquier rol; una respuesta por sujeto o establecimiento.                              | 2, 4  |
| P5     | ¿Cómo se prueban los flujos que dependen de mail (invitaciones, recuperar contraseña, verificar)?                                                                                  | 3, 4  |
| P6     | Lista final de 5 a 10 flujos críticos con producto.                                                                                                                                | 4     |
| ~~P7~~ | ~~Se interceptan los servicios externos del navegador~~ **Resuelta para la Issue 4:** sí, direcciones interceptadas. Queda pendiente el mapa en las capturas del manual (Issue 5). | 4, 5  |
| P8     | ¿Quién mantiene el texto del manual? ¿PDF, Google Doc o ambos? ¿Reemplazar o versionar en Drive?                                                                                   | 5     |
| P9     | ¿Existe la cuenta de servicio de Google y la carpeta de Drive? ¿Está habilitado GHCR en la organización?                                                                           | 1, 5  |
| P10    | ¿Qué hace el backoffice con un `field_worker` que inicia sesión? Hoy la UI no le da permisos y el login no lo bloquea.                                                             | 3     |

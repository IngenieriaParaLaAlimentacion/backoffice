# Mantener el manual de Backoffice

## Fuentes y entregas

Los capítulos editables y las capturas de esta plataforma viven en `docs/manual-usuario/`. `index.html` incluye las imágenes; se puede compartir sin carpetas adicionales. `manual.pdf` se genera a partir de ese HTML. El PDF incluye las figuras de los recorridos; la galería complementaria se conserva en HTML.

## Regenerar

Desde la raíz del repositorio:

```bash
python3 -m venv .context/manual-venv
.context/manual-venv/bin/pip install -r scripts/manual/requirements.txt
npm ci --prefix scripts/manual
npx --prefix scripts/manual playwright install chromium
.context/manual-venv/bin/python scripts/manual/render.py
node scripts/manual/export-pdf.mjs
python3 scripts/manual/verify.py
```

Para exportar con un Chrome ya instalado, definir `CHROME_EXECUTABLE` con la ruta del ejecutable. El HTML también permite imprimir desde el navegador.

Al actualizar una pantalla, revisar sus pasos, permisos, mensajes y capturas. Regenerar HTML y PDF y comprobar enlaces, búsqueda, ampliación, vista angosta e impresión. Revisar que ninguna captura incluya datos reales ni enlaces de autenticación con tokens. No hace falta levantar el backend para regenerar los documentos con las imágenes existentes.

## Publicar en GitHub Pages

El workflow [Manual de usuario · GitHub Pages](../../.github/workflows/manual-pages.yml) genera el HTML desde los capítulos y publica el sitio en <https://ingenieriaparalaalimentacion.github.io/backoffice/>. Incluye búsqueda, ampliación de capturas y descarga de `manual.pdf`.

Para habilitar la primera publicación:

1. En el repositorio, abrí **Settings > Pages**.
2. En **Build and deployment > Source**, seleccioná **GitHub Actions**.
3. Si el entorno `github-pages` restringe las ramas permitidas, agregá `develop`.
4. Integrá el workflow en `develop`. Si ya está integrado, ejecutalo desde **Actions > Manual de usuario · GitHub Pages > Run workflow**, seleccionando `develop`.
5. Comprobá la URL que muestra el paso de despliegue.

Los cambios del manual, sus scripts o el workflow que llegan a `develop` actualizan el sitio. Los pull requests a `develop` verifican enlaces y generan el artefacto sin publicarlo. Una ejecución manual desde otra rama tampoco publica.

El artefacto contiene únicamente `index.html`, `manual.pdf` y `.nojekyll`. Las imágenes están incluidas en el HTML. El PDF publicado es el archivo versionado: al cambiar los capítulos, regenerá HTML y PDF con los comandos anteriores e incluí ambos en el mismo cambio.

Para revisar el sitio localmente después de instalar las dependencias de Python:

```bash
.context/manual-venv/bin/python scripts/manual/render.py --output .context/manual-pages/index.html
cp docs/manual-usuario/manual.pdf .context/manual-pages/manual.pdf
python3 -m http.server 8000 --directory .context/manual-pages
```

Abrí <http://localhost:8000/>. La configuración de Pages sigue el [workflow oficial de GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Procedencia de las capturas

Esta entrega separa el material preparado originalmente en [backend#221](https://github.com/IngenieriaParaLaAlimentacion/backend/pull/221). Las capturas históricas conservan los datos ficticios del escenario Semillas del Sur y su fecha del 25/10/2026. Trasladarlas a este repositorio no implica que se hayan vuelto a ejecutar contra la revisión actual.

| Componente | Revisión de la captura                     |
| ---------- | ------------------------------------------ |
| backend    | `99a1acbfee78b021558155bbae13c2aa882b6bf2` |
| backoffice | `6d79a177742391443dc9560444be2d10f620b439` |

El [inventario](inventario.json) conserva las pantallas de esta plataforma, los enlaces a las revisiones exactas y los registros de captura. Antes de una edición nueva, actualizar esas evidencias junto con los ejemplos y las imágenes, sin atribuir capturas históricas a otro dataset o revisión.

## Comprobaciones y limitaciones

Las capturas históricas se tomaron con Playwright sobre el backoffice real, con datos persistidos. Se comprobaron consultas de mediciones y evolución, secciones del panel y descargas CSV/XLSX. Las capturas no constituyen una prueba exhaustiva de todos los permisos, validaciones y alternativas.

Los procedimientos de invitación y recuperación de contraseña se revisaron en código. La entrega de correos y el recorrido completo de sus enlaces siguen pendientes de comprobación con un buzón de prueba. La ausencia de una carga en el panel también puede deberse a que el teléfono todavía no terminó de sincronizarla.

## Actualización del 29/10/2026

El texto y el inventario de fuentes se contrastaron con `develop` de backoffice, revisión `27f57383ece1e01d62a2dba644dffd120b35494f`. Se incorporaron la edad actual y la antigüedad del último relevamiento (#123), el contenido del CSV de sujetos y el reporte nutricional mensual (#122). Los cambios de CI y E2E no agregan pasos de usuario.

Se renovaron o agregaron 16 capturas con Playwright: sujetos y detalle, mediciones y evolución, las pestañas de la ficha del establecimiento y los recorridos del reporte. Su revisión, fecha y modalidad de datos se registran individualmente en `inventario.json`. Las capturas nuevas muestran el backoffice actual con los fixtures MSW que trae el repositorio (Comedor Central Norte y otros ejemplos ficticios). Para sujetos, que no tienen un handler de listado en ese modo, se usó una API HTTP local de demostración con el mismo contrato; las mediciones usan los fixtures del repositorio.

Se comprobó la navegación, la generación de un mes nuevo en el modo de demostración, la regeneración de texto que habilita el PDF y el recálculo de un mes sin datos que pasa a tener ingresos en ese escenario. Estas comprobaciones no validan cálculo nutricional, persistencia real, generación de texto por IA ni el PDF servido por el backend. Los estados y límites restantes se contrastaron con el código; las imágenes históricas mantienen su procedencia original.

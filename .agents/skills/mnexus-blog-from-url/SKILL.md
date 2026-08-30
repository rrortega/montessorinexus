---
name: mnexus-blog-from-url
description: >-
  Investiga un articulo o referencia web a partir de una URL dada, sintetiza su tematica, redacta un articulo Montessori original y ampliado con rigor pedagogico, genera portada artistica con IA libre de texto, traduce automaticamente a 5 idiomas (EN, FR, PT, DE, RU) y lo publica tras el visto bueno del usuario. Invocable con /mnexus-blog-from-url <url>.
---

# Workflow: Creacion de Articulo MontessoriNexus a partir de una URL (/mnexus-blog-from-url)

Esta skill permite tomar cualquier articulo de referencia web, extraer sus ideas clave, reescribirlo con maxima profundidad pedagogica y cientifica segun la filosofia Montessori, ilustrarlo, traducirlo y publicarlo en el blog general de **MontessoriNexus**.

---

## Flujo de Trabajo en 4 Fases

### Fase 1: Lectura e Investigacion de la URL
Cuando el usuario pase una URL o invoque `/mnexus-blog-from-url <URL>`:
1. Utiliza la herramienta `read_url_content` para extraer el contenido completo de la pagina.
2. Analiza:
   - **Tesis principal y conceptos clave**.
   - **Etapa de desarrollo** a la que aplica (0-3 anos, 3-6 anos, 6-12 anos, adolescencia o comunidad general).
   - **Puntos de mejora**: lagunas pedagogicas, falta de rigor cientifico/neurocientifico, o necesidad de ejemplos practicos.

### Fase 2: Redaccion Original, Ampliacion y Enriquecimiento
1. Redacta un articulo completamente nuevo, original y ampliado (1000 - 1800 palabras) en Espanol.
2. Incorpora los estandares de excelencia de MontessoriNexus:
   - **Titulo potente y cautivador** en `# Titulo del Articulo`.
   - **Conexion con la neurociencia** (neuroplasticidad, conexion mano-cerebro, periodos sensibles, atencion sostenida/Flow).
   - **Fundamentacion en la obra de la Dra. Maria Montessori**: Toda cita o frase debe usar estrictamente el formato de cita/quote de Markdown (`> `), con comillas y atribución explícita (ej. `> "Sembrad en los niños ideas buenas, aunque no las entiendan..."` y `> — *Dra. Maria Montessori, La Mente Absorbente*`). Nunca dejar citas como texto plano en párrafos ordinarios.
   - **Estructura clara y navegable**: `##` y `###` tematicos con listas accionables de aplicacion en el hogar o la escuela.
   - **Perspectiva transformadora**: el error como aprendizaje, autonomia y preparacion para la vida.
3. Guarda el borrador en un archivo markdown temporal en `scratch/draft-[slug].md`.

### Fase 3: Revision y Solicitud del Visto Bueno
1. Presenta al usuario:
   - **Titulo propuesto**.
   - **Resumen comparativo**: que aspectos se enriquecieron y mejoraron respecto a la fuente original.
   - **Estructura general y extracto**.
2. **Pide explicitamente el visto bueno del usuario** antes de lanzar la publicacion y las traducciones.
3. Si el usuario pide cambios en el texto, aplicalos en el archivo temporal y confirma nuevamente.

### Fase 4: Pipeline Automatizado de Publicacion y Limpieza
Una vez obtenido el visto bueno:
1. Ejecuta el script de publicacion CLI con `BypassSandbox: true`:
   ```bash
   npx @dotenvx/dotenvx run -f .env.local -- node server/publish-blog-cli.cjs --file=<ruta-del-borrador.md> --clean
   ```
   *(El pipeline ejecuta de manera automatica)*:
   - **Generacion de metadatos SEO / OpenGraph** optimizados en Espanol (`metaTitle`, `metaDescription`, `slug`).
   - **Generacion de portada con IA**: estilo de dibujo a mano alzada en carboncillo negro y crayon terracota calido sobre lienzo texturizado, **estrictamente libre de texto y tipografia**, subida a `/api/storage/public/blog/...`.
   - **Traduccion automatica a 5 idiomas**: Ingles (`en`), Frances (`fr`), Portugues (`pt`), Aleman (`de`) y Ruso (`ru`).
   - **Publicacion directa en la base de datos**: como articulo oficial de plataforma SaaS (`schoolId: null`, `status: "PUBLISHED"`).
   - **Alineación taxonómica y asignación de categoría adecuada**: clasifica automáticamente el artículo en una categoría existente o crea una nueva pertinente con slug y descripción pedagógica.
   - **Asignación de autor pedagógico y avatar realista** de la biblioteca predefinida.
   - **Eliminacion automatica del archivo borrador temporal** (`--clean`).
2. Entrega el reporte final con el ID del post, portadas e hipervinculos generados.

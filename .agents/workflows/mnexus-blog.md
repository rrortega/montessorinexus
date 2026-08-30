---
name: mnexus-blog
description: >-
  Crea, redacta, ilustra con IA, traduce automaticamente a 5 idiomas (EN, FR, PT, DE, RU) y publica articulos completos para el blog oficial de MontessoriNexus. Soporta el flag --auto para ejecucion 100% autonoma sin confirmacion. Usa este workflow cuando el usuario pida crear un nuevo articulo de blog, redactar contenido para el blog general, o invoque /mnexus-blog [--auto].
---

# Workflow de Redaccion y Publicacion Automatica para MontessoriNexus Blog

Esta skill gestiona el ciclo completo de creacion, revision editorial, generacion de portadas artisticas con IA, traduccion multilingue y publicacion en base de datos para el blog oficial de **MontessoriNexus**.

> **Flag `--auto`**: Si el comando o petición incluye `--auto` (ej. `/mnexus-blog <tema> --auto`), el workflow opera en modo **100% autónomo**: omite las preguntas de la Fase 1 (asume el mejor criterio pedagógico) y omite la solicitud de confirmación de la Fase 3, ejecutando de inmediato la Fase 4 completa (portada IA, traducción a 5 idiomas y publicación en base de datos).

---

## Flujo de Trabajo en 4 Fases

### Fase 1: Exploracion y Preguntas Simples
Cuando el usuario indique una tematica o invoque el comando `/mnexus-blog`:
- **Si se incluye `--auto`**: **OMITE las preguntas.** Determina de forma experta la etapa adecuada, audiencia mixta (familias y educadores) y tono pedagógico riguroso y práctico, avanzando directo a la Fase 2.
- **Modo interactivo (sin `--auto`)**: Formula preguntas breves y concisas para afinar el enfoque:
  - **Enfoque Pedagogico**: ¿Para que etapa (Comunidad Infantil 0-3, Casa de Ninos 3-6, Taller 6-12) o concepto clave de Maria Montessori?
  - **Audiencia Objetivo**: ¿Padres de familia, guias/docentes, o directores de escuelas?
  - **Tono y Mensaje Clave**: ¿Informativo, reflexivo, practico con consejos para el hogar?
  *(Pregunta de forma clara respetando no abrumar al usuario).*

### Fase 2: Redaccion del Borrador en Markdown
Una vez definidas las directrices:
1. Redacta un articulo de alta calidad pedagogica (800 - 1500 palabras) en Espanol.
2. Estructura recomendada:
   - **Titulo atractivo** en `# Titulo del Articulo`.
   - **Introduccion cautivadora** conectando neurociencia, desarrollo humano y vision Montessori.
   - **Secciones claras con `##` y `###`** con explicaciones profundas y ejemplos practicos.
   - **Citas célebres y frases de Maria Montessori**: Formato estricto de cita/quote de Markdown (`> `), con la cita entre comillas y atribución explícita (ej. `> "La primera tarea de la educación es agitar la vida..."` seguido de `> — *Dra. Maria Montessori, El Método de la Pedagogía Científica*`). Nunca incluir citas textuales como párrafos normales sin formatear en bloque `>`.
   - **Tablas comparativas o de datos**: Usar estrictamente formato de tabla Markdown GFM (`| Columna 1 | Columna 2 |` y `| :--- | :--- |`). **NUNCA** generar tablas como diagramas ASCII o cajas de caracteres Unicode (`┌─┐`, `│`) dentro de bloques de código.
   - **Diagramas explicativos con Mermaid (` ```mermaid ... ``` `)**:
     - **Regla de oro de sintaxis**: **TODAS las etiquetas de nodo deben estar estrictamente encerradas entre comillas dobles** `["..."]` para evitar errores de renderizado (por ejemplo si contienen paréntesis `()`, dos puntos `:`, comas, corchetes o tildes).
       - ✅ *Correcto*: `A["Mente Absorbente (0-6 años)"] --> B["Mente Razonadora (6-12 años)"]`
       - ❌ *Incorrecto*: `A[Mente Absorbente (0-6 años)] --> B[Mente Razonadora]` *(los paréntesis sin comillas rompen el analizador léxico de Mermaid)*.
     - **Identificadores limpios**: Usar IDs de nodo alfanuméricos ASCII simples sin espacios (ej: `etapa1`, `ambientePrep`, `rolGuia`, `nodoA`).
     - **Tipos de diagrama recomendados**: `flowchart TD` / `flowchart LR` para procesos y metodologías, `mindmap` para esquemas conceptuales, `stateDiagram-v2` para planos de desarrollo, o `pie title "..."` para distribuciones.
     - **Enlaces y subgrafos**: Si una flecha lleva texto, colocarlo entre comillas o barras: `A -->|"Observación activa"| B`. Subgrafos siempre con etiqueta entre comillas: `subgraph Fase1 ["Fase 1: Preparación"]` ... `end`.
   - **Listas prácticas y accionables**.
   - **Conclusión inspiradora**.
3. Guarda el borrador temporal en un archivo markdown (por ejemplo `scratch/draft-[slug].md`).

### Fase 3: Revision y Visto Bueno del Usuario
- **Si se incluye `--auto`**: **OMITE esta fase por completo.** Procede de inmediato a ejecutar la Fase 4 de publicación y traducción sin requerir confirmación del usuario.
- **Modo interactivo (sin `--auto`)**:
  1. Muestra el titulo, extracto y resumen del borrador redactado al usuario.
  2. **Pide explicitamente su visto bueno** para proceder con la publicacion automatizada.
  3. Si el usuario solicita ajustes, aplicalos en el archivo markdown y vuelve a validar.

### Fase 4: Ejecucion del Pipeline Automatizado y Limpieza
Una vez aprobado el borrador por el usuario:
1. Ejecuta el script de publicacion CLI:
   ```bash
   npx @dotenvx/dotenvx run -f .env.local -- node server/publish-blog-cli.cjs --file=<ruta-del-borrador.md> --clean
   ```
   *(El script realiza automaticamente)*:
   - **Generacion de metadatos SEO / OpenGraph** (`metaTitle`, `metaDescription`, `slug`).
   - **Generacion de portada con IA**: estilo de dibujo a carboncillo negro y crayon terracota calido sobre lienzo texturizado, estrictamente libre de texto y tipografia, subida a `/api/storage/public/blog/...`.
   - **Traduccion completa a 5 idiomas**: Ingles (`en`), Frances (`fr`), Portugues (`pt`), Aleman (`de`) y Ruso (`ru`).
   - **Publicacion directa en base de datos**: `BlogPost` con `status: "PUBLISHED"` y `schoolId: null`.
   - **Asignacion de autor pedagogico y avatar realista**.
   - **Limpieza automatica del archivo borrador** (`--clean`).
2. Presenta al usuario el resumen final con URLs publicas, ID del post y lenguajes creados.

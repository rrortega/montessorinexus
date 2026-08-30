import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const author = await prisma.user.findFirst();
  
  if (!author) {
    console.error('No author found in the database.');
    process.exit(1);
  }

  // Identify the CEIBA school for MontessoriNexus
  const school = await prisma.school.findFirst({
    where: { slug: 'ceiba' }
  });

  const title = "El Poder de la Mente Absorbente y las Etapas Sensibles en Montessori";
  
  const content = `Durante los primeros seis años de vida, el cerebro humano experimenta transformaciones inigualables. En esta etapa, el aprendizaje ocurre de una forma tan natural e intensa que la Dra. María Montessori la consideró la fase más determinante de la vida humana. Como ella misma afirmaba: *"Es en este período cuando se forma la inteligencia, el gran instrumento del hombre"*.

## ¿Qué es la Mente Absorbente?

Esta increíble capacidad de transformación es posible porque los niños pequeños poseen un tipo de mente completamente diferente a la nuestra. Montessori la denominó **"mente absorbente"**. 

A diferencia del esfuerzo consciente que requerimos los adultos para memorizar o aprender, el niño pequeño absorbe toda la información de su entorno —el lenguaje, la cultura, las normas y las actitudes— simplemente viviendo. 

> "Todo lo que viene del ambiente se recibe, procesa y almacena en las células cerebrales sin ningún esfuerzo, usando una forma de absorción inconsciente." 

Si imagináramos un planeta donde los habitantes aprendieran todo sin esfuerzo, sin escuelas y solo por el hecho de existir en su entorno, nos parecería ciencia ficción. Sin embargo, este es exactamente el modo de aprender de un niño durante su primera infancia.

## El Tránsito de lo Inconsciente a lo Consciente

El desarrollo de la mente absorbente se divide en dos grandes sub-etapas:

1. **El Creador Inconsciente (0 a 3 años):** El niño asimila e incorpora toda la información del ambiente sin intención. Sus experiencias, observaciones y vivencias moldean su estructura cerebral interna.
2. **El Trabajador Consciente (3 a 6 años):** Comienza una búsqueda activa. El niño ya no absorbe "sin querer", sino que actúa con un propósito claro, seleccionando experiencias específicas que le permiten perfeccionar las habilidades asimiladas en la etapa anterior.

## Los Periodos Sensibles: Ventanas de Oportunidad

Durante estos primeros años, los niños atraviesan lo que Montessori definió como **Periodos Sensibles**. Se trata de ventanas de oportunidad donde existe una predisposición biológica e intenso interés por adquirir una habilidad particular, como el lenguaje, el orden, el refinamiento sensorial o las matemáticas.

La mente absorbente es el vehículo que permite aprovechar estos periodos de manera fluida. Cuando un niño está en un periodo sensible, su concentración es profunda y el aprendizaje le produce alegría, no fatiga.

## ¿Cómo Acompañar estas Etapas en Casa o en el Aula?

Para que un niño alcance su máximo potencial durante estas fases, nuestro rol como adultos no es imponer conocimientos, sino preparar el ambiente:

* **Observación Activa:** Presta atención a lo que atrae al niño. ¿Repite una acción constantemente? ¿Se fascina por objetos pequeños? Eso te indicará en qué periodo sensible se encuentra.
* **Libertad de Movimiento:** Permite que el niño explore espacios seguros a su ritmo. La independencia física es la precursora de la independencia intelectual.
* **Vida Práctica:** Involucrar al niño en tareas cotidianas como poner la mesa, lavar frutas o barrer, no solo refina su motricidad, sino que desarrolla su sentido de pertenencia, orden y lógica.
* **Contacto con la Naturaleza:** Experiencias sensoriales auténticas como jugar con arena, regar plantas o explorar un jardín, nutren profundamente su mente absorbente.

En MontessoriNexus y nuestra pedagogía integral, creemos firmemente en honrar estas etapas sensibles. Proporcionar el entorno adecuado en el momento justo es el mayor regalo que podemos hacerle al desarrollo de un niño.`;

  const excerpt = "Descubre cómo los niños de 0 a 6 años asimilan el mundo a su alrededor sin esfuerzo a través de la mente absorbente, y cómo podemos aprovechar los periodos sensibles para potenciar su aprendizaje natural.";
  const metaDescription = "Conoce qué es la mente absorbente de Montessori, los periodos sensibles de 0 a 6 años, y cómo acompañar el desarrollo infantil de forma respetuosa.";

  const post = await prisma.blogPost.create({
    data: {
      schoolId: school ? school.id : null,
      authorId: author.id,
      customAuthorName: "Dra. María Montessori",
      customAuthorAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
      status: "DRAFT",
      isFeatured: true,
      readingTimeMinutes: 4,
      translations: {
        create: [
          {
            locale: 'es',
            slug: slugify(title),
            title: title,
            excerpt: excerpt,
            content: content,
            metaTitle: title,
            metaDescription: metaDescription,
          }
        ]
      }
    }
  });

  console.log('Post created successfully:', post.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

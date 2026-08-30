import prismaPkg from '@prisma/client';
const { PrismaClient } = prismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pgPkg from 'pg';
const { Pool } = pgPkg;

let defaultPrisma = null;
function getPrismaInstance(prisma) {
  if (prisma) return prisma;
  if (!defaultPrisma) {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    defaultPrisma = new PrismaClient({ adapter });
    defaultPrisma.admissionStage = defaultPrisma.processStage;
    defaultPrisma.admissionApplication = defaultPrisma.processApplication;
    defaultPrisma.admissionFormTemplate = defaultPrisma.processFormTemplate;
  }
  return defaultPrisma;
}

/**
 * Extracts and returns the configured AI provider credentials for a school
 */
export async function getSchoolAiConfig(schoolId, prismaParam = null) {
  const prisma = getPrismaInstance(prismaParam);
  let apiKey = (process.env.OPENAI_API_KEY || process.env.AI_API_KEY || '').trim();
  let baseUrl = (process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim();
  let model = (process.env.AI_MODEL || process.env.OPENAI_MODEL || 'gpt-5.6-luna').trim();

  if (schoolId) {
    const settings = await prisma.siteSetting.findMany({
      where: {
        schoolId,
        key: {
          in: [
            'ai_api_key', 'openai_api_key', 'OPENAI_API_KEY', 'openai_key',
            'ai_base_url', 'openai_base_url', 'AI_BASE_URL',
            'ai_model', 'openai_model', 'AI_MODEL',
            'system_openai_api_key'
          ]
        }
      }
    });

    for (const s of settings) {
      const k = s.key.toLowerCase();
      const v = (s.value || '').trim();
      if (!v) continue;
      if (k.includes('key')) apiKey = v;
      else if (k.includes('base_url')) baseUrl = v;
      else if (k.includes('model')) model = v;
    }
  }

  return { apiKey, baseUrl, model };
}

/**
 * Targeted Voice Structuring: Separated into 'lesson' or 'tracker' modes
 */
export async function structureMontessoriVoiceObservation({
  rawText,
  targetType = 'lesson', // 'lesson' | 'tracker'
  schoolId,
  environmentId = null,
  studentId = null,
  prisma: customPrisma = null
}) {
  const prisma = getPrismaInstance(customPrisma);

  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('El texto de la observación es requerido');
  }

  const { apiKey, baseUrl, model } = await getSchoolAiConfig(schoolId, prisma);

  if (!apiKey) {
    const err = new Error('NO_AI_KEY_CONFIGURED');
    err.code = 'NO_AI_KEY_CONFIGURED';
    throw err;
  }

  // 1. Fetch contextual students in this school
  const students = await prisma.student.findMany({
    where: {
      schoolId
    },
    select: {
      id: true,
      fullName: true,
      grade: true,
      environmentId: true
    }
  });

  const studentsContext = students.map(s => ({ id: s.id, name: s.fullName, grade: s.grade }));

  let systemPrompt = '';
  let userContext = '';

  if (targetType === 'tracker') {
    // 2. Fetch Trackers / Habits hierarchy
    const trackerCategories = await prisma.trackerCategory.findMany({
      where: { schoolId },
      include: {
        subcategories: {
          include: {
            items: {
              select: { id: true, name: true, subcategoryId: true, description: true }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    const trackersContext = trackerCategories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      items: cat.subcategories.flatMap(sub => sub.items.map(item => ({
        itemId: item.id,
        itemName: item.name,
        subcategoryName: sub.name
      })))
    }));

    systemPrompt = `Eres un Asistente Pedagógico Montessori especializado en el registro de TRACKERS, HÁBITOS DE VIDA PRÁCTICA Y RUTINAS DIARIAS.

REGLAS DE BÚSQUEDA FONÉTICA Y ASIGNACIÓN DE ALUMNO:
- La transcripción por voz puede tener diferencias ortográficas o nombres incompletos (ej. "Alan" vs "Allan", "Sofi" vs "Sofía", "Mati" vs "Mateo", o solo el apellido "Rodriguez" / "Gómez").
- Busca coincidencias por nombre de pila, apodo, apellido o similitud fonética en "ALUMNOS DISPONIBLES EN EL COLEGIO".
- Si hay un alumno altamente probable (ej. "Alan Rodriguez" -> "Allan Rodriguez Olivera"), asigna su "studentId" y "studentName" con "confidence": 0.95.
- Devuelve siempre un arreglo "candidateStudents" con hasta 3 alumnos ordenados por probabilidad descendente [{ "studentId": "...", "studentName": "...", "confidence": 0.95 }].

OBJETIVO:
Estructurar el dictado de la guía identificando:
1. ALUMNO: "studentId" (ID de la lista), "studentName", "confidence" (0 a 1) y "candidateStudents".
2. RUTINA / HÁBITO: Identifica qué hábito o tracker se realizó (de la lista de trackers disponibles) y coloca "trackerItemId" y "trackerItemName".
3. ESTADO / REALIZACIÓN: "YES" (Realizado / Logrado), "NO" (No realizado / Dificultad), "PARTIAL" (En progreso / Con apoyo).
4. NOTA PÚBLICA (Para las familias y padres): Tono respetuoso, empático, formativo y constructivo sin tecnicismos que alarmen.
5. NOTA INTERNA (Para el equipo de guías y dirección): Tono pedagógico preciso, puede incluir detalles técnicos, juicio del guía y observaciones sobre cómo seguir acompañando al infante.

FORMATO DE RESPUESTA (Únicamente JSON válido):
{
  "targetType": "tracker",
  "results": [
    {
      "studentId": "id_del_alumno_de_la_lista_o_null",
      "studentName": "Nombre completo del alumno",
      "confidence": 0.95,
      "candidateStudents": [
        { "studentId": "id", "studentName": "Nombre", "confidence": 0.95 }
      ],
      "trackerCategoryId": "id_de_la_categoria_o_null",
      "trackerCategoryName": "Nombre de la categoría",
      "trackerItemId": "id_del_item_o_null",
      "trackerItemName": "Nombre del Hábito / Tracker",
      "status": "YES" | "NO" | "PARTIAL",
      "publicNote": "Nota clara y constructiva que verán los padres en el portal...",
      "internalNote": "Detalles técnicos, juicio del guía y pautas de seguimiento interno..."
    }
  ]
}`;

    userContext = `ALUMNOS DISPONIBLES EN EL COLEGIO: ${JSON.stringify(studentsContext)}
TRACKERS Y HÁBITOS DISPONIBLES: ${JSON.stringify(trackersContext)}
${studentId ? `Alumno preseleccionado ID: "${studentId}"` : ''}`;

  } else {
    // 2. Fetch Montessori Curriculum (Lessons & Areas)
    const curriculumAreas = await prisma.montessoriArea.findMany({
      where: { schoolId },
      include: {
        categories: {
          include: {
            lessons: {
              select: { id: true, name: true, categoryId: true, description: true }
            }
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    const curriculumContext = curriculumAreas.map(a => ({
      areaId: a.id,
      areaName: a.name,
      lessons: a.categories.flatMap(c => c.lessons.map(l => ({
        lessonId: l.id,
        lessonName: l.name,
        categoryId: c.id,
        categoryName: c.name
      })))
    }));

    systemPrompt = `Eres un Asistente Pedagógico Montessori (AMI / AMS) especializado en el SEGUIMIENTO DE LECCIONES Y PRESENTACIONES.

REGLAS DE BÚSQUEDA FONÉTICA Y ASIGNACIÓN DE ALUMNO:
- La transcripción por voz puede tener diferencias ortográficas o nombres incompletos (ej. "Alan" vs "Allan", "Sofi" vs "Sofía", "Mati" vs "Mateo", o solo el apellido "Rodriguez" / "Gómez").
- Busca coincidencias por nombre de pila, apodo, apellido o similitud fonética en "ALUMNOS DISPONIBLES EN EL COLEGIO".
- Si hay un alumno altamente probable (ej. "Alan Rodriguez" -> "Allan Rodriguez Olivera"), asigna su "studentId" y "studentName" con "confidence": 0.95.
- Devuelve siempre un arreglo "candidateStudents" con hasta 3 alumnos ordenados por probabilidad descendente [{ "studentId": "...", "studentName": "...", "confidence": 0.95 }].

OBJETIVO:
Estructurar el dictado de la guía identificando:
1. ALUMNO: "studentId" (ID de la lista), "studentName", "confidence" (0 a 1) y "candidateStudents".
2. LECCIÓN / ACTIVIDAD: Identifica el material/lección oficial del currículo Montessori ("lessonId", "lessonName", "areaId", "areaName").
3. ESTADO DE DOMINIO PEDAGÓGICO:
   - "PRESENTED": Presentado (1er Tiempo de Séguin / Asociación inicial por la guía).
   - "PRACTICING": En práctica (2do Tiempo / Exploración activa y repetición con material).
   - "MASTERED": Dominado (3er Tiempo / Abstracción y autonomía comprobada).
   - "SURPASSED": Superado (Va más allá del propósito básico del material, extensión creativa o ayuda a pares).
4. NOTA DE OBSERVACIÓN: Redacción pedagógica descriptiva, profesional, enfocada en la concentración, el control de error y la autonomía del niño.

FORMATO DE RESPUESTA (Únicamente JSON válido):
{
  "targetType": "lesson",
  "results": [
    {
      "studentId": "id_del_alumno_de_la_lista_o_null",
      "studentName": "Nombre completo del alumno",
      "confidence": 0.95,
      "candidateStudents": [
        { "studentId": "id", "studentName": "Nombre", "confidence": 0.95 }
      ],
      "areaId": "id_del_area_o_null",
      "areaName": "Nombre del Área",
      "lessonId": "id_de_la_leccion_o_null",
      "lessonName": "Nombre del Material / Lección",
      "status": "PRESENTED" | "PRACTICING" | "MASTERED" | "SURPASSED",
      "notes": "Redacción pedagógica de la observación cualitativa..."
    }
  ]
}`;

    userContext = `ALUMNOS DISPONIBLES EN EL COLEGIO: ${JSON.stringify(studentsContext)}
CURRÍCULO MONTESSORI DISPONIBLE: ${JSON.stringify(curriculumContext)}
${studentId ? `Alumno preseleccionado ID: "${studentId}"` : ''}`;
  }

  const userPrompt = `${userContext}

DICTADO DE LA GUÍA:
"""
${rawText}
"""

Genera el JSON estructurado:`;

  let cleanBaseUrl = (baseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
  cleanBaseUrl = cleanBaseUrl.replace(/\/models$/, '').replace(/\/chat\/completions$/, '');
  const chatUrl = `${cleanBaseUrl}/chat/completions`;

  let cleanModel = (model || '').trim().replace(/^models\//, '');
  if (!cleanModel) {
    cleanModel = /gemini|google/i.test(cleanBaseUrl) ? 'gemini-2.0-flash' : 'gpt-5.6-luna';
  }

  const isReasoning = /o[134]|deepseek-reasoner|r1|luna|gpt-5/i.test(cleanModel);

  const payload = {
    model: cleanModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    ...(isReasoning ? {} : { temperature: 0.2 }),
    response_format: { type: 'json_object' }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const resp = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '');
      throw new Error(`Error del proveedor AI (${resp.status}): ${errBody || resp.statusText}`);
    }

    const data = await resp.json();
    const rawAnswer = data?.choices?.[0]?.message?.content || '{}';
    
    let parsed;
    try {
      parsed = JSON.parse(rawAnswer);
    } catch {
      const jsonMatch = rawAnswer.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error('No se pudo interpretar la respuesta estructurada de la IA');
      }
    }

    const results = Array.isArray(parsed.results) ? parsed.results : (Array.isArray(parsed.observations) ? parsed.observations : [parsed]);

    return {
      success: true,
      rawText,
      targetType,
      modelUsed: cleanModel,
      results
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('El servicio de IA tardó demasiado en responder (Timeout 30s)');
    }
    throw err;
  }
}

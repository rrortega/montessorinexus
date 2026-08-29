# Arquitectura de Red de Colegios (School Network / Multi-Campus)
## MontessoriNexus OS — Especificación Técnica & Modelo de Dominio

> **Objetivo**: Extender el modelo multi-tenant actual de MontessoriNexus para soportar **Redes de Colegios**, permitiendo a directores, fundadores y patronatos gestionar múltiples planteles, niveles educativos (Casa de Niños, Taller, Secundaria) o franquicias bajo una identidad unificada, con continuidad de expedientes de alumnos, portal familiar multi-colegio y consola ejecutiva consolidada.

---

## 1. Jerarquía del Modelo de Dominio

```
                               ┌────────────────────────────────┐
                               │  SchoolNetwork (Red Matriz)    │
                               │  - Brand Assets & Paleta       │
                               │  - Currículo AMI Estandarizado │
                               │  - Políticas Globales          │
                               └───────────────┬────────────────┘
                                               │ (1 a N)
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
┌──────────────────────────────┐┌──────────────────────────────┐┌──────────────────────────────┐
│ Campus A: Sede Poniente      ││ Campus B: Sede Oriente       ││ Campus C: Erdkinder / Sec.   │
│ - Comunidad & Casa de Niños  ││ - Comunidad & Casa de Niños  ││ - Taller 2 & Adolescentes    │
│ - Dominio: poniente.esc.org  ││ - Dominio: oriente.esc.org   ││ - Dominio: secundaria.esc.org│
└──────────────┬───────────────┘└──────────────┬───────────────┘└──────────────┬───────────────┘
               │ (1 a N)                       │ (1 a N)                       │ (1 a N)
               ▼                               ▼                               ▼
    [Ambientes Preparados]          [Ambientes Preparados]          [Ambientes Preparados]
```

---

## 2. Definición de Entidades Clave

### 2.1. `SchoolNetwork` (La Red)
Representa la entidad corporativa o grupo educativo que agrupa 2 o más colegios.
* **Atributos**:
  - `id`: UUID único.
  - `name`: Nombre de la red (ej: *"Comunidad Montessori del Caribe"*).
  - `slug`: Identificador único (ej: `red-caribe`).
  - `billingModel`: `CENTRALIZED` (una sola cuenta de Stripe para toda la red) o `DECENTRALIZED` (cada colegio factura por su cuenta).
  - `sharedCurriculum`: Booleano que define si las presentaciones y materiales son compartidos o autónomos por sede.
  - `branding`: Logotipo corporativo, colores primarios y tipografías heredables.

### 2.2. `School / Campus` (El Colegio / Sede)
Representa una sede física o un nivel educativo específico con su propia operación diaria.
* **Atributos**:
  - `id`: UUID único.
  - `networkId`: Clave foránea opcional referenciando a `SchoolNetwork`.
  - `name`: Nombre del plantel (ej: *"Campus Puerto Cancún"*).
  - `slug`: Subdominio o ruta (ej: `puerto-cancun`).
  - `levels`: Array de niveles que atiende (`NIDO`, `COMUNIDAD_INFANTIL`, `CASA_DE_NINOS`, `TALLER_1`, `TALLER_2`, `ERDKINDER`).
  - `taxInfo`: Razón social, RFC/Tax ID y domicilio fiscal de la sede.

### 2.3. `GlobalUser` & `NetworkMembership` (Identidad Unificada)
Un único usuario (email/password) en el sistema con diferentes roles según la sede.
* **Roles soportados**:
  - `NETWORK_OWNER / NETWORK_DIRECTOR`: Acceso global a todas las sedes, reportes consolidados y configuración de red.
  - `CAMPUS_DIRECTOR`: Administración total de una sede específica.
  - `GUIDE / ASSISTANT`: Guía titular o asistente asignada a uno o varios ambientes (posibilidad de rotación entre sedes).
  - `PARENT`: Tutor legal con uno o varios hijos en diferentes colegios de la misma red.

### 2.4. `StudentProfile` & `SchoolEnrollment` (Expediente Único de Alumno)
Separación entre la **persona (el alumno)** y su **matrícula activa**:
* `StudentProfile` (Entidad Global): Nombre, fecha de nacimiento, CURP/DNI, tipo de sangre, historial médico/alergias, fotografías de referencia y contactos de emergencia.
* `SchoolEnrollment` (Historial de Matrícula): Registra la estancia en cada colegio (ej: 2023-2026 en Casa de Niños Poniente, 2026-2029 en Primaria Oriente), con sus bitácoras de observación y contratos asociados.

---

## 3. Casos de Uso y Fenómenos de Red

### 3.1. Traspaso y Egreso Inter-Campus con 1 Clic (Cero Burocracia)
* **Escenario**: Un alumno termina Casa de Niños (6 años) en el Plantel A y la red ofrece Primaria/Taller 1 en el Plantel B.
* **Flujo Operativo**:
  1. La dirección del Plantel A marca al alumno como *"Egreso Graduado / Transición a Sede B"*.
  2. El sistema crea automáticamente la pre-matrícula en el Plantel B.
  3. **El expediente completo viaja digitalmente**: CURP, actas, comprobantes médicos y la bitácora de 3 tiempos Montessori quedan disponibles para la guía de Taller 1 del Plantel B.
  4. Los padres no tienen que volver a llenar formularios ni subir documentos ya validados.

---

### 3.2. Portal Familiar Multi-Hijo y Multi-Sede (SSO)
* **Escenario**: Una familia tiene una hija de 3 años en *Comunidad Infantil (Sede Norte)* y un hijo de 9 años en *Taller 2 (Sede Centro)*.
* **Experiencia de Usuario**:
  - Un solo correo y contraseña para acceder a la aplicación móvil o web.
  - **Selector Rápido de Alumno/Sede** en la cabecera:
    ```
    ┌──────────────────────────────────────────────┐
    │ 👧 Sofía (3a) • Casa de Niños Norte    [ ▼ ] │
    │ 👦 Mateo (9a) • Taller 2 Centro              │
    └──────────────────────────────────────────────┘
    ```
  - **Feed Unificado**: Notificaciones, circulares y fotos de ambos colegios en una sola línea de tiempo ordenada.
  - **Estado de Cuenta Consolidado**: Visualización del total mensual de colegiaturas con opción de pago único o por separado.

---

### 3.3. Derivación Inteligente de Admisiones y Lista de Espera Cruzada
* **Escenario**: Una familia solicita plaza para Casa de Niños en la Sede Centro, pero los cupos están al 100%.
* **Mecanismo de IA & Red**:
  - El sistema detecta que la Sede Sur (a 15 minutos de distancia) cuenta con 2 vacantes disponibles en el mismo rango de edad.
  - El portal de admisiones ofrece a la familia:
    > *"Nuestra Sede Centro está completa para este ciclo. ¿Deseas postular automáticamente tu solicitud a nuestra Sede Sur con los mismos datos ya ingresados?"*
  - Maximiza la retención de matrículas dentro del grupo educativo sin perder prospectos.

---

### 3.4. Movilidad Docente y Sustituciones Ágiles
* **Escenario**: Una guía titular enferma en la Sede B.
* **Flujo**:
  - Una guía de apoyo o titular de la Sede A puede ser asignada temporalmente al ambiente de la Sede B.
  - Con su mismo login, accede inmediatamente a la lista de niños, lecciones de 3 tiempos y acuerdos de convivencia del aula que va a cubrir, sin crear cuentas temporales vulnerables.

---

### 3.5. Consola Ejecutiva de Red (C-Level Dashboard)
Métricas en tiempo real para el Patronato o Dirección General:
* **Matrícula Consolidada**: Total de alumnos activos en toda la red vs. capacidad instalada por campus.
* **Tasa de Retención Inter-Nivel**: Porcentaje de alumnos que pasan de Casa de Niños a Taller dentro de la red (KPI clave de fidelidad).
* **Salud Financiera Agregada**: Cartera vencida consolidada, ingresos proyectados a 12 meses y comparativa de costos operativos por sede.
* **Auditoría de Calidad Pedagógica**: Distribución del tiempo de trabajo y avance curricular comparativo entre planteles.

---

## 4. Modelos Fiscales y de Pasarelas de Pago

| Modelo | Arquitectura | Caso de Uso |
|---|---|---|
| **Centralizado** | 1 Cuenta Stripe Matriz conectada a `SchoolNetwork`. Los pagos de todas las sedes entran a la misma cuenta corporativa con sub-etiquetas de campus. | Grupos escolares con una sola razón social paraguas. |
| **Descentralizado** | Cada `School` tiene su propia cuenta de Stripe / SPEI y credenciales fiscales (RFC / Tax ID) independientes. | Franquicias o sedes constituidas como personas morales distintas. |
| **Híbrido (Stripe Connect)** | La red actúa como plataforma principal y las sedes operan como cuentas conectadas (*Connected Accounts*), permitiendo comisiones o cobros directos. | Redes de colegios franquiciados o afiliados. |

---

## 5. Matriz de Permisos y Control de Acceso (RBAC)

```
Nivel de Permiso      │ Ámbito de Visibilidad
──────────────────────┼─────────────────────────────────────────────────────────────
Network Owner         │ Acceso irrestricto a todas las sedes, finanzas y auditoría.
Campus Director       │ Acceso total a su sede (sin visibilidad de finanzas de otras sedes).
Guía Titular          │ Acceso exclusivo a los ambientes preparados que tiene asignados.
Psicopedagogía de Red │ Visibilidad longitudinal de expedientes de alumnos en cualquier sede.
Padre / Tutor         │ Acceso restringido exclusivamente a sus hijos acreditados.
```

---

## 6. Plan de Implementación Técnica por Fases

1. **Fase 1: Modelo de Datos & Relación `SchoolNetwork` ➔ `School`**:
   - Crear tablas/colecciones `school_networks` y vincular `network_id` en `schools`.
   - Modificar autenticación para soportar membresías multi-colegio.
2. **Fase 2: Portal Familiar Unificado (Multi-Child Switcher)**:
   - Selector de alumno/sede en la barra de navegación familiar.
   - Centralización de notificaciones y firmas electrónicas.
3. **Fase 3: Motor de Traspaso de Expedientes (Inter-School Transfer)**:
   - Asistente de egreso/ingreso para secretaría escolar.
   - Clonación segura de bitácoras pedagógicas y documentos.
4. **Fase 4: Consola Ejecutiva de Red (Executive Analytics)**:
   - Dashboard para directores generales con métricas financieras y pedagógicas agregadas.

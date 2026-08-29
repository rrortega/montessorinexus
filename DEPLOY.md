# 🚀 Guía de Despliegue en Producción (Easypanel + GitHub Actions + Vercel/Cloudflare)

Esta guía detalla paso a paso cómo desplegar la plataforma **Montessori Nexus**, soportando tanto una arquitectura en contenedores desacoplados (**Easypanel / VPS**) como una arquitectura 100% desacoplada con frontend en el Edge (**Vercel / Cloudflare Pages**) y backend + workers en contenedores.

---

## 🏗️ Topologías de Arquitectura Soportadas

```mermaid
flowchart TD
    subgraph OpcionA ["Topología 1: Desacoplada en Contenedores (Easypanel / VPS)"]
        WEB1["Servicio Web & API<br/>(SERVICE_ROLE=web)"]
        WRK1["Servicio Worker Asíncrono<br/>(SERVICE_ROLE=worker)"]
    end

    subgraph OpcionB ["Topología 2: 100% Desacoplada (Edge + API + Workers)"]
        VCL["Frontend SPA en Edge<br/>(Vercel / Cloudflare Pages)"]
        API2["Servicio API REST<br/>(SERVICE_ROLE=web)"]
        WRK2["Servicio Worker Asíncrono<br/>(SERVICE_ROLE=worker)"]
    end

    subgraph Infra ["Infraestructura Compartida"]
        PG[("PostgreSQL")]
        REDIS[("Redis (BullMQ)")]
        S3[("S3 / Cloudflare R2")]
    end

    WEB1 --> PG & REDIS & S3
    WRK1 --> PG & REDIS & S3

    VCL -->|"HTTP / REST"| API2
    API2 --> PG & REDIS & S3
    WRK2 --> PG & REDIS & S3
```

---

## 📌 Roles de Servicio (`SERVICE_ROLE`)

El contenedor Docker utiliza el script de arranque [`server/start.sh`](server/start.sh) que activa componentes según la variable `SERVICE_ROLE`:

| Valor de `SERVICE_ROLE` | ¿Qué ejecuta? | Uso Recomendado |
| :--- | :--- | :--- |
| `web` | **Únicamente Express API y Frontend SPA** (`node server/index.js`). | Servicio Web / API en producción. |
| `worker` | **Únicamente procesador de colas BullMQ** (`node server/worker.js`) con pantalla virtual Xvfb para Playwright. | Servicio Worker en producción. |
| `all` *(default)* | **Ejecuta Web + Worker simultáneamente** en el mismo contenedor. | Entornos de desarrollo, staging o despliegue single-node. |

---

## ⚙️ 1. Configuración de CI/CD (GitHub Actions & GHCR)

El flujo de trabajo automatizado se encuentra en [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml).

### A. Permisos en GitHub
1. En tu repositorio: **Settings** -> **Actions** -> **General**.
2. En **Workflow permissions**, selecciona **Read and write permissions** y guarda.

### B. Secretos en GitHub (Webhooks de Easypanel)
Ve a **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Secret | Descripción | Requerido |
| :--- | :--- | :--- |
| `EASYPANEL_WEB_WEBHOOK_URL` | Webhook de despliegue del servicio Web en Easypanel. | Opcional |
| `EASYPANEL_WORKER_WEBHOOK_URL` | Webhook de despliegue del servicio Worker en Easypanel. | Opcional |

> [!NOTE]
> Si los webhooks no están definidos, GitHub Actions construirá y subirá la imagen a `ghcr.io` sin fallar.

---

## 🖥️ 2. Despliegue en Easypanel (Servicio Web + Worker)

### Paso 1: Servicios de Base de Datos y Colas
1. **PostgreSQL**: Crear servicio `PostgreSQL` -> Guardar `DATABASE_URL`.
2. **Redis**: Crear servicio `Redis` -> Guardar `REDIS_URL` (ej. `redis://default:pass@redis:6379`).

---

### Paso 2: Servicio Web (`montessorinexus-web`)
1. **+ Service** -> **App**. Nombre: `web`.
2. **Source**: `Docker Image` -> `ghcr.io/rrortega/montessorinexus:latest`.
3. **Environment**:
   ```env
   NODE_ENV=production
   PORT=3001
   SERVICE_ROLE=web
   DATABASE_URL=postgres://usuario:pass@postgres:5432/database
   REDIS_URL=redis://default:pass@redis:6379
   SESSION_SECRET=clave_segura_de_sesion
   JWT_SECRET=clave_segura_jwt
   DEFAULT_EMAIL_DOMAIN=montessorinexus.com
   EMAIL_SENDER_DOMAIN=montessorinexus.com
   RESEND_API_KEY=re_tu_api_key

   # Storage S3 / R2 (Multi-tenant)
   STORAGE_DRIVER=s3
   S3_REGION="us-east-1"
   S3_BUCKET="montessorinexus-storage"
   S3_ACCESS_KEY_ID="tu_access_key_id"
   S3_SECRET_ACCESS_KEY="tu_secret_access_key"
   S3_FORCE_PATH_STYLE=false
   ```
4. **Domains / Ports**: Dominio (ej. `app.montessorinexus.com`) en puerto `3001`.
5. **Deploy**: Copiar Webhook URL a `EASYPANEL_WEB_WEBHOOK_URL` en GitHub Secrets.

---

### Paso 3: Servicio Worker (`montessorinexus-worker`)
1. **+ Service** -> **App**. Nombre: `worker`.
2. **Source**: `Docker Image` -> `ghcr.io/rrortega/montessorinexus:latest`.
3. **Environment**:
   ```env
   NODE_ENV=production
   SERVICE_ROLE=worker
   DATABASE_URL=postgres://usuario:pass@postgres:5432/database
   REDIS_URL=redis://default:pass@redis:6379
   SESSION_SECRET=misma_clave_que_en_web
   JWT_SECRET=misma_clave_que_en_web
   STORAGE_DRIVER=s3
   S3_REGION="us-east-1"
   S3_BUCKET="montessorinexus-storage"
   S3_ACCESS_KEY_ID="tu_access_key_id"
   S3_SECRET_ACCESS_KEY="tu_secret_access_key"
   ```
4. **Domains / Ports**: **No requiere dominio ni puertos expuestos** (consume tareas de Redis).
5. **Resources**: Asignar 1-2 CPUs y 1GB-2GB RAM (para Xvfb, Playwright y procesamiento Sharp/PicoJS).
6. **Deploy**: Copiar Webhook URL a `EASYPANEL_WORKER_WEBHOOK_URL` en GitHub Secrets.

---

## 🌐 3. Despliegue Desacoplado con Frontend en Vercel / Cloudflare Pages

Si decides alojar el frontend estático en **Vercel** o **Cloudflare Pages** y el backend/workers en **Easypanel**:

### Configuración en Vercel / Cloudflare Pages:
1. **Framework Preset**: `Vite`
2. **Build Command**: `pnpm build`
3. **Output Directory**: `dist`
4. **Environment Variables**:
   ```env
   VITE_API_URL=https://api.montessorinexus.com
   ```

### Configuración en el Backend Express (Easypanel):
En el servicio `web` de Easypanel, permitir el dominio del frontend en CORS:
```env
CORS_ORIGIN=https://montessorinexus.com,https://app.montessorinexus.com
```

---

## 🔄 4. Flujo de Despliegue Continuo (CI/CD)

```mermaid
graph TD
    A[Git Push a rama main] --> B[GitHub Actions: Build Docker Image]
    B --> C[Publica imagen en ghcr.io:latest]
    C --> D{¿Webhooks configurados?}
    D -- Sí --> E1[Webhook Web -> Redeploy Servicio Web]
    D -- Sí --> E2[Webhook Worker -> Redeploy Servicio Worker]
    D -- No --> F[Log: Imagen lista en GHCR]
```

---

## 🛠️ 5. Comandos Útiles para Pruebas Locales

```bash
# Construir imagen localmente
docker build -t montessorinexus:local .

# Ejecutar únicamente como Servicio Web
docker run -p 3001:3001 \
  -e DATABASE_URL="file:/app/server/data/dev.db" \
  -e SERVICE_ROLE="web" \
  montessorinexus:local

# Ejecutar únicamente como Worker
docker run \
  -e DATABASE_URL="file:/app/server/data/dev.db" \
  -e REDIS_URL="redis://localhost:6379" \
  -e SERVICE_ROLE="worker" \
  montessorinexus:local

# Ejecutar en modo combinado (Web + Worker)
docker run -p 3001:3001 \
  -e DATABASE_URL="file:/app/server/data/dev.db" \
  -e SERVICE_ROLE="all" \
  montessorinexus:local
```

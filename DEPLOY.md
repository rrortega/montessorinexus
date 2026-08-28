# 🚀 Guía de Despliegue en Producción (Easypanel + GitHub Actions)

Esta guía detalla paso a paso cómo configurar la integración continua (CI/CD) con **GitHub Actions**, el registro de imágenes en **GitHub Container Registry (GHCR)** y el despliegue desacoplado del **Servicio Web** y el **Servicio Worker** en **Easypanel**.

---

## 🏗️ Arquitectura de Producción

El sistema se compone de los siguientes servicios en Easypanel:

1. **PostgreSQL**: Base de datos relacional principal.
2. **Redis**: Gestor de colas en tiempo real (BullMQ) para tareas asíncronas, webhooks y envíos masivos.
3. **Servicio Web (`montessorinexus-web`)**:
   - Expone la aplicación web React + API Express en el puerto `3001`.
   - Variable de entorno: `SERVICE_ROLE=web` (o `SERVICE_ROLE=all`).
4. **Servicio Worker (`montessorinexus-worker`)**:
   - Procesa trabajos de fondo en segundo plano (Xvfb + Playwright headless, generación de reportes, sincronizaciones).
   - Variable de entorno: `SERVICE_ROLE=worker`.

---

## ⚙️ 1. Configuración de GitHub Actions & Registro GHCR

El flujo de trabajo automatizado se encuentra en [.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml).

### A. Permisos del Repositorio en GitHub
1. En tu repositorio de GitHub, ve a **Settings** -> **Actions** -> **General**.
2. En la sección **Workflow permissions**, selecciona **Read and write permissions**.
3. Guarda los cambios.

### B. Configuración de GitHub Secrets (Webhooks de Easypanel)
Para que GitHub Actions notifique a Easypanel automáticamente después de construir la imagen:

1. Ve a **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
2. Agrega los siguientes secretos (opcionales pero recomendados para Auto-Deploy):

| Secret | Descripción | Requerido |
| :--- | :--- | :--- |
| `EASYPANEL_WEB_WEBHOOK_URL` | URL del Webhook de despliegue del servicio Web generado en Easypanel. | Opcional |
| `EASYPANEL_WORKER_WEBHOOK_URL` | URL del Webhook de despliegue del servicio Worker generado en Easypanel. | Opcional |

> [!NOTE]
> Si estos secretos **no están configurados**, el flujo de GitHub Actions **no fallará**. Simplemente construirá y publicará la imagen en GHCR y dejará un registro en los logs indicando que los webhooks fueron omitidos.

---

## 📦 2. Visibilidad y Autenticación de GHCR

La imagen se publica bajo el registro de contenedores de GitHub:
`ghcr.io/rrortega/montessorinexus:latest`

### Si el repositorio o paquete es Privado:
Easypanel necesitará credenciales para descargar la imagen:
1. En GitHub: Ve a tu perfil -> **Settings** -> **Developer Settings** -> **Personal Access Tokens** -> **Tokens (classic)**.
2. Genera un nuevo token con el scope: `read:packages`.
3. Guarda el token generado.

---

## 🖥️ 3. Configuración Paso a Paso en Easypanel

### Paso 1: Crear Servicios de Base de Datos
1. En tu proyecto de Easypanel, haz clic en **+ Service** -> **PostgreSQL**.
   - Nombre: `postgres`
   - Guarda la URL de conexión interna generada (`DATABASE_URL`).
2. Haz clic en **+ Service** -> **Redis**.
   - Nombre: `redis`
   - Guarda la URL de conexión interna generada (`REDIS_URL`, ej. `redis://default:password@redis:6379`).

---

### Paso 2: Crear el Servicio Web (`montessorinexus-web`)

1. Haz clic en **+ Service** -> **App**.
2. Nombre: `web` (o `montessorinexus-web`).
3. En la pestaña **Source**:
   - **Type**: `Docker Image`
   - **Image Name**: `ghcr.io/rrortega/montessorinexus:latest`
4. En la pestaña **Registry** (solo si el paquete es privado):
   - **Server**: `ghcr.io`
   - **Username**: Tu usuario de GitHub (ej. `mayo11`)
   - **Password**: El Personal Access Token (PAT) con permiso `read:packages`.
5. En la pestaña **Environment**:
   ```env
   NODE_ENV=production
   PORT=3001
   SERVICE_ROLE=web
   DATABASE_URL=postgres://usuario:password@postgres:5432/database
   REDIS_URL=redis://default:password@redis:6379
   SESSION_SECRET=generar_una_clave_aleatoria_segura
   JWT_SECRET=generar_otra_clave_aleatoria_segura
   DEFAULT_EMAIL_DOMAIN=montessorinexus.com
   EMAIL_SENDER_DOMAIN=montessorinexus.com
   RESEND_API_KEY=re_tu_api_key_de_resend

   # Configuración de Almacenamiento Multi-inquilino (S3 / Cloud Storage)
   # Cada colegio tiene sus archivos aislados bajo la ruta: schools/<schoolId>/...
   STORAGE_DRIVER=s3
   S3_ENDPOINT=""
   S3_REGION="us-east-1"
   S3_BUCKET="montessorinexus-storage"
   S3_ACCESS_KEY_ID="tu_access_key_id"
   S3_SECRET_ACCESS_KEY="tu_secret_access_key"
   S3_FORCE_PATH_STYLE=false
   ```
6. En la pestaña **Domains / Ports**:
   - Agrega tu dominio (ej. `app.montessorinexus.com` o `colegio.tudominio.com`).
   - **Port**: `3001`
7. En la pestaña **Mounts / Persistent Storage**:
   - **Si usas S3 / Cloud Storage (`STORAGE_DRIVER=s3`)**: **NO se requiere ningún volumen persistente**. Todos los archivos de cada colegio se guardan y transmiten de forma privada y directa hacia el bucket de S3.
   - **Si usas almacenamiento local (`STORAGE_DRIVER=local`)**: Mapea el volumen persistente en:
     - `/app/storage` -> Volumen persistente (ej. `montessori_storage`)
8. En la pestaña **Deploy**:
   - Copia la **Webhook URL** proporcionada por Easypanel y pégala en GitHub Secrets como `EASYPANEL_WEB_WEBHOOK_URL`.

---

### Paso 3: Crear el Servicio Worker (`montessorinexus-worker`)

1. Haz clic en **+ Service** -> **App**.
2. Nombre: `worker` (o `montessorinexus-worker`).
3. En la pestaña **Source**:
   - **Type**: `Docker Image`
   - **Image Name**: `ghcr.io/rrortega/montessorinexus:latest`
4. En la pestaña **Registry** (si es privado):
   - Mismas credenciales que el servicio Web (`ghcr.io`).
5. En la pestaña **Environment**:
   ```env
   NODE_ENV=production
   SERVICE_ROLE=worker
   DATABASE_URL=postgres://usuario:password@postgres:5432/database
   REDIS_URL=redis://default:password@redis:6379
   SESSION_SECRET=misma_clave_que_en_web
   JWT_SECRET=misma_clave_que_en_web
   DEFAULT_EMAIL_DOMAIN=montessorinexus.com
   EMAIL_SENDER_DOMAIN=montessorinexus.com
   RESEND_API_KEY=re_tu_api_key_de_resend

   # Mismas variables de Storage que en Web
   STORAGE_DRIVER=s3
   S3_ENDPOINT=""
   S3_REGION="us-east-1"
   S3_BUCKET="montessorinexus-storage"
   S3_ACCESS_KEY_ID="tu_access_key_id"
   S3_SECRET_ACCESS_KEY="tu_secret_access_key"
   S3_FORCE_PATH_STYLE=false
   ```
6. En la pestaña **Domains / Ports**:
   - **No requiere dominio ni puertos expuestos** (este servicio consume trabajos directamente de Redis).
7. En la pestaña **Mounts / Persistent Storage**:
   - Si `STORAGE_DRIVER=local`, monta `/app/storage` -> `montessori_storage` (el mismo volumen que el servicio Web).
8. En la pestaña **Resources** (Opcional):
   - Se recomienda asignar al menos 1 CPU y 1GB - 2GB RAM para los procesos headless con Xvfb y Playwright.
9. En la pestaña **Deploy**:
   - Copia la **Webhook URL** del Worker y pégala en GitHub Secrets como `EASYPANEL_WORKER_WEBHOOK_URL`.

---

## 🔄 4. Flujo de Despliegue Continuo (CI/CD)

```mermaid
graph TD
    A[Push a rama main en GitHub] --> B[GitHub Actions Build & Push]
    B --> C[Publica imagen en ghcr.io:latest]
    C --> D{¿Webhooks configurados?}
    D -- Sí --> E1[Webhook Web -> Easypanel Redeploy Web]
    D -- Sí --> E2[Webhook Worker -> Easypanel Redeploy Worker]
    D -- No --> F[Log: Webhooks omitidos sin error]
```

Cada vez que realizas un `git push origin main`:
1. GitHub Actions compila el frontend y empaqueta la imagen Docker optimizada.
2. Publica la imagen en `ghcr.io/rrortega/montessorinexus:latest`.
3. Dispara los webhooks hacia Easypanel.
4. Easypanel descarga la nueva imagen y reinicia en caliente tanto el **Servicio Web** como el **Servicio Worker** sin caída de servicio.

---

## 🛠️ 5. Comandos Útiles para Pruebas Locales

Si deseas probar la imagen en local antes de desplegar:

```bash
# Construir imagen localmente
docker build -t montessorinexus:local .

# Ejecutar contenedor en modo combinado (Web + Worker)
docker run -p 3001:3001 \
  -e DATABASE_URL="file:/app/server/data/dev.db" \
  -e SERVICE_ROLE="all" \
  montessorinexus:local
```

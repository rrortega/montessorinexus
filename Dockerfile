# =============================================================================
# Stage 1: Build frontend (Vite + React)
# =============================================================================
FROM node:22-slim AS frontend-build

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests first for layer caching
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies for build
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY . .

# Build-time env vars (passed via --build-arg, Docker Compose, or Easypanel)
ARG VITE_CONTACT_PHONE
ARG VITE_CONTACT_EMAIL
ARG VITE_SCHOOL_ADDRESS
ARG VITE_MAP_LAT
ARG VITE_MAP_LNG
ARG VITE_SOCIAL_FACEBOOK
ARG VITE_SOCIAL_INSTAGRAM
ARG VITE_SHOW_TEACHERS_SECTION
ARG VITE_SHOW_GALLERY_SECTION
ARG VITE_UMAMI_HOST
ARG VITE_UMAMI_USERNAME
ARG VITE_UMAMI_PASSWORD
ARG VITE_UMAMI_SITE_ID

ENV VITE_CONTACT_PHONE=$VITE_CONTACT_PHONE
ENV VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL
ENV VITE_SCHOOL_ADDRESS=$VITE_SCHOOL_ADDRESS
ENV VITE_MAP_LAT=$VITE_MAP_LAT
ENV VITE_MAP_LNG=$VITE_MAP_LNG
ENV VITE_SOCIAL_FACEBOOK=$VITE_SOCIAL_FACEBOOK
ENV VITE_SOCIAL_INSTAGRAM=$VITE_SOCIAL_INSTAGRAM
ENV VITE_SHOW_TEACHERS_SECTION=$VITE_SHOW_TEACHERS_SECTION
ENV VITE_SHOW_GALLERY_SECTION=$VITE_SHOW_GALLERY_SECTION
ENV VITE_UMAMI_HOST=$VITE_UMAMI_HOST
ENV VITE_UMAMI_USERNAME=$VITE_UMAMI_USERNAME
ENV VITE_UMAMI_PASSWORD=$VITE_UMAMI_PASSWORD
ENV VITE_UMAMI_SITE_ID=$VITE_UMAMI_SITE_ID

# Build the frontend SPA bundle
RUN pnpm build

# =============================================================================
# Stage 2: Generate Prisma Client
# =============================================================================
FROM node:22-slim AS prisma-build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile || pnpm install
RUN npx prisma generate

# =============================================================================
# Stage 3: Production runtime
# =============================================================================
FROM node:22-slim AS production

WORKDIR /app

# Install OS dependencies required by Playwright Chromium and Xvfb (virtual display for headless anti-detection)
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libasound2 \
    libxshmfence1 \
    fonts-liberation \
    ca-certificates \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# Install Playwright Chromium binary
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install chromium

# Copy generated Prisma client from prisma-build stage
COPY --from=prisma-build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma-build /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Copy server code
COPY server ./server/

# Copy built frontend bundle from frontend-build stage
COPY --from=frontend-build /app/dist ./dist/

# Copy gallery seed data
COPY src/data/gallery.json ./src/data/gallery.json

# Set execute permissions on start script
RUN chmod +x /app/server/start.sh

# Create persistent directories for uploaded files and database
RUN mkdir -p /app/public/gallery /app/public/documents /app/server/data /ms-playwright

# Expose the Express server port
EXPOSE 3001

# Environment variables with sensible defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV SERVICE_ROLE=all

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/api/settings || exit 1

# Start via start.sh (handles Express, BullMQ Queue Worker, Xvfb, and Prisma migrations)
CMD ["/app/server/start.sh"]

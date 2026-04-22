# Stage 1: Build stage
FROM node:20-slim AS build

# Set the working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and lock files
# We copy all of them to ensure pnpm can use whatever is available, 
# although in a clean environment it might generate a new lockfile if not present.
COPY package.json pnpm-lock.yaml* package-lock.json* bun.lockb* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Set environment variables for the build process (can be overridden by Easypanel build-args)
ARG VITE_CONTACT_PHONE
ARG VITE_CONTACT_EMAIL
ARG VITE_SCHOOL_ADDRESS
ARG VITE_MAP_LAT
ARG VITE_MAP_LNG
ARG VITE_SOCIAL_FACEBOOK
ARG VITE_SOCIAL_INSTAGRAM
ARG VITE_SHOW_TEACHERS_SECTION
ARG VITE_SHOW_GALLERY_SECTION

ENV VITE_CONTACT_PHONE=$VITE_CONTACT_PHONE
ENV VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL
ENV VITE_SCHOOL_ADDRESS=$VITE_SCHOOL_ADDRESS
ENV VITE_MAP_LAT=$VITE_MAP_LAT
ENV VITE_MAP_LNG=$VITE_MAP_LNG
ENV VITE_SOCIAL_FACEBOOK=$VITE_SOCIAL_FACEBOOK
ENV VITE_SOCIAL_INSTAGRAM=$VITE_SOCIAL_INSTAGRAM
ENV VITE_SHOW_TEACHERS_SECTION=$VITE_SHOW_TEACHERS_SECTION
ENV VITE_SHOW_GALLERY_SECTION=$VITE_SHOW_GALLERY_SECTION

# Build the application
# Note: Vite automatically loads .env files from the root directory during build.
# The ARG/ENV declarations above allow these to also be passed from Easypanel.
RUN pnpm build

# Stage 2: Serve stage
FROM nginx:alpine

# Copy the build output from the build stage to the nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom nginx configuration to handle SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

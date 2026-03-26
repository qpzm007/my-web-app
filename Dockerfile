# Stage 1: Build dependencies
FROM node:20-alpine AS build

WORKDIR /app

# Add ARGs for build-time environment variables
ARG VITE_SUPABASE_URL=https://ffqoqmwrwvuoqkzokczf.supabase.co
ARG VITE_SUPABASE_ANON_KEY=sb_publishable_Tz3p6diJ5AIM6taPm7HVAg_Amf0gWhu

# Set them as environment variables so Vite can see them
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config for SPA (Single Page Application)
# Cloud Run expects the container to listen on the port defined by $PORT (default 8080)
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

# ---------- Build stage ----------
FROM node:20-alpine AS builder

# Accept API base URL at build time and expose to Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

WORKDIR /app

# Install dependencies using lockfile for reproducibility
COPY package*.json ./
COPY gopostgrest-sdk-1.0.0.tgz ./
RUN npm install --no-audit --no-fund

# Copy source
COPY . .

# Install SDK dependencies inside sdk (in root)
RUN npm install --no-audit --no-fund --prefix ./sdk

# Build app
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.29.4-alpine AS runner

# Replace default server config with SPA-friendly fallback on port 5050 and log to stdout/stderr
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 5050;
    server_name _;

    access_log /dev/stdout;
    error_log /dev/stderr warn;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5050

# Use Nginx default entrypoint/cmd
    
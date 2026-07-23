# ---- build stage ----
FROM node:18-bookworm AS builder
WORKDIR /usr/src/app

# CRA bakes REACT_APP_* into the bundle at build time, so the backend URL must
# be known here. Passed from docker-compose build args / Coolify env.
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL \
    REACT_APP_HOURS_CLOSE_TICKETS_AUTO=$REACT_APP_HOURS_CLOSE_TICKETS_AUTO \
    CI=false

COPY package*.json ./
# --legacy-peer-deps: React 16 + libs que pedem React 17/18 geram ERESOLVE
RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY . .
# Build do CRA direto (evita o cross-env do script sobrescrever NODE_OPTIONS),
# com heap maior p/ nao dar OOM (Killed) no build em VPS.
RUN NODE_OPTIONS="--openssl-legacy-provider --max-old-space-size=4096" \
    GENERATE_SOURCEMAP=false CI=false \
    ./node_modules/.bin/react-scripts build

# ---- runtime stage ----
FROM node:20-bookworm-slim
WORKDIR /usr/src/app
ENV NODE_ENV=production
RUN npm install express@4 --no-audit --no-fund

COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/server.js ./server.js

EXPOSE 3000
CMD ["node", "server.js"]

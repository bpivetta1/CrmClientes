# ---- build stage ----
FROM node:20-bookworm AS builder
WORKDIR /usr/src/app

# puppeteer nao e usado no codigo (engine e Baileys/Evolution); pula o download.
ENV PUPPETEER_SKIP_DOWNLOAD=true

# native addon build tooling (ws/bufferutil etc.)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# --legacy-peer-deps: baileys@6.7.21 declara peer jimp@^1.6.0, mas o projeto usa
# jimp@^0.16 (ERESOLVE no npm 7+). O fork oficial instala com --force/legacy.
RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:20-bookworm-slim
WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true

# ffmpeg (conversao de audio) + tini (init). Chromium removido: puppeteer nao e
# usado no codigo — economiza ~1GB de imagem/disco no build.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg tini ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/.sequelizerc ./.sequelizerc
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && mkdir -p public

EXPOSE 8081
ENTRYPOINT ["/usr/bin/tini", "--", "./docker-entrypoint.sh"]

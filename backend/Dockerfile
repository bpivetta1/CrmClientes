# ---- build stage ----
FROM node:20-bookworm AS builder
WORKDIR /usr/src/app

# puppeteer's bundled Chromium is not used at runtime (we use system chromium),
# so skip the heavy download during npm install.
ENV PUPPETEER_SKIP_DOWNLOAD=true

# native addon build tooling (ws/bufferutil etc.)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:20-bookworm-slim
WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# chromium + ffmpeg + fonts for baileys/puppeteer/media handling; tini as init
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium ffmpeg tini ca-certificates \
      fonts-liberation fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/.sequelizerc ./.sequelizerc
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && mkdir -p public

EXPOSE 8081
ENTRYPOINT ["/usr/bin/tini", "--", "./docker-entrypoint.sh"]

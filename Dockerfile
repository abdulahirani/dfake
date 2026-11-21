# --- Stage 1: Build React Frontend & Server Bundle ---
FROM node:22-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# --- Stage 2: Minimal Production Runtime ---
FROM node:22-slim
WORKDIR /app

RUN chown node:node /app
USER node

# Install only the lightweight Express runtime packages used by dist/server.cjs
RUN npm init -y > /dev/null 2>&1 \
    && npm install --no-audit --no-fund express fs-extra multer exif-parser dotenv

# Copy compiled frontend, server bundle, and static data
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/posts.json ./posts.json
COPY --from=builder --chown=node:node /app/config.json ./config.json

ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

CMD ["node", "dist/server.cjs"]

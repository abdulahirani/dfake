# --- Stage 1: Build React Frontend & Server Bundle ---
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# --- Stage 2: Production Runtime ---
FROM node:20-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN chown node:node /app
USER node

COPY --chown=node package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy built frontend, compiled server bundle, and static/data files
COPY --from=builder --chown=node /app/dist ./dist
COPY --from=builder --chown=node /app/public ./public
COPY --from=builder --chown=node /app/posts.json ./posts.json
COPY --from=builder --chown=node /app/config.json ./config.json
COPY --from=builder --chown=node /app/robots.txt ./robots.txt
COPY --from=builder --chown=node /app/ads.txt ./ads.txt
COPY --from=builder --chown=node /app/sitemap*.xml ./

ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

CMD ["npm", "start"]

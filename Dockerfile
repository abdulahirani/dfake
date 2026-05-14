# --- Stage 1: Build React Frontend ---
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Serve Backend & Frontend ---
FROM node:20-slim
WORKDIR /app

# Install system dependencies for any native modules
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Use existing 'node' user (UID 1000)
RUN chown node:node /app
USER node

# Copy dependencies and source
COPY --chown=node package*.json ./
RUN npm install --production

# Copy built files
COPY --from=builder --chown=node /app/dist ./dist
COPY --from=builder --chown=node /app/server.ts .
COPY --from=builder --chown=node /app/posts.json .
COPY --from=builder --chown=node /app/.env* ./

# Install tsx to run server.ts in production if needed, or follow package.json start
RUN npm install tsx

ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

# Run the server
CMD ["npm", "start"]

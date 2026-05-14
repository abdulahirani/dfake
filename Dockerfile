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

# Create non-root user
RUN useradd -m -u 1000 user
RUN chown user:user /app
USER user

# Copy dependencies and source
COPY --chown=user package*.json ./
RUN npm install --production

# Copy built files
COPY --from=builder --chown=user /app/dist ./dist
COPY --from=builder --chown=user /app/server.ts .
COPY --from=builder --chown=user /app/posts.json .
COPY --from=builder --chown=user /app/.env* ./

# Install tsx to run server.ts in production if needed, or follow package.json start
RUN npm install tsx

ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

# Run the server
CMD ["npm", "start"]

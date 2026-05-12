# ScanDeepFake Pro Deployment Module
FROM node:18-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Lightweight serving environment
FROM node:18-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 8080
# Serve on port 8080 as required by Cloud Run / App Engine
CMD ["serve", "-s", "dist", "-l", "8080"]

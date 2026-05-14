# --- Stage 1: Build React Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Serve Backend & Frontend ---
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy backend files
COPY app.py .
COPY .env* ./

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Create public folder if needed for local scripts
RUN mkdir -p public

# Environment setup
ENV PORT=7860
EXPOSE 7860

# Run the server
# Use Uvicorn to serve app.py (FastAPI) on port 7860
CMD ["uvicorn", "app.py:app", "--host", "0.0.0.0", "--port", "7860"]

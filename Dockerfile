# --- Stage 1: Build React Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Serve Backend & Frontend ---
FROM python:3.9-slim

# Set environment variables
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Create non-root user
RUN useradd -m -u 1000 user
WORKDIR /app
RUN chown user:user /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Switch to non-root user
USER user

# Copy backend files and built frontend
COPY --chown=user app.py .
COPY --chown=user .env* ./
COPY --from=frontend-builder --chown=user /app/dist ./dist

# Create public folder
RUN mkdir -p public

# Environment setup
ENV PORT=7860
EXPOSE 7860

# Run the server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]

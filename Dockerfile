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

# Pre-install Python dependencies as root
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Create a non-root user and setup directories
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Switch to the new user
USER user
WORKDIR /home/user/app

# Copy backend files and built frontend
COPY --chown=user app.py .
COPY --chown=user .env* ./
COPY --from=frontend-builder --chown=user /app/dist ./dist

# Create public folder if needed
RUN mkdir -p public

# Environment setup
ENV PORT=7860
EXPOSE 7860

# Run the server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]

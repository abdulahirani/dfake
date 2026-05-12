# ScanDeepFake Pro Deployment Module
FROM python:3.9-slim

WORKDIR /app

# System dependencies for image processing
RUN apt-get update && apt-get install -y \
    build-essential \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

# Serve on port 8080 as required by Cloud Run / App Engine
CMD ["streamlit", "run", "app.py", "--server.port=8080", "--server.address=0.0.0.0"]

FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip3 install -r requirements.txt

COPY . .

# SEO File Generation on Build
RUN python3 -c "from app import generate_seo_files; generate_seo_files()"

EXPOSE 3000

# Run Streamlit on port 3000 for AI Studio / Container compatibility
ENTRYPOINT ["streamlit", "run", "app.py", "--server.port=3000", "--server.address=0.0.0.0"]

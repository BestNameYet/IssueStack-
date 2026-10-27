FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip python3-venv ffmpeg libsndfile1 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt
ENV PATH="/opt/venv/bin:${PATH}" HF_HOME=/models/hf
COPY package.json ./
COPY src ./src
COPY tests ./tests
RUN mkdir -p /data/input /data/output /models/hf
ENTRYPOINT ["node", "src/compare.js"]

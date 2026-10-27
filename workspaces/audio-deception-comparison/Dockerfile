FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip python3-venv ffmpeg libsndfile1 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt
ENV PATH="/opt/venv/bin:${PATH}" HF_HOME=/models/hf PYTHONUNBUFFERED=1
COPY package.json ./
COPY src ./src
COPY tests ./tests
ARG BUNDLE_TRUTH_MODEL=1
RUN mkdir -p /data/input /data/output /models/truth /models/hf && \
    if [ "$BUNDLE_TRUTH_MODEL" = "1" ]; then python src/download_models.py; \
    elif [ "$BUNDLE_TRUTH_MODEL" != "0" ]; then echo "BUNDLE_TRUTH_MODEL must be 0 or 1" >&2; exit 1; fi
ENTRYPOINT ["node", "src/compare.js"]

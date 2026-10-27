FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 python3-pip python3-venv ffmpeg libsndfile1 ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt
ENV PATH=/opt/venv/bin:$PATH
ENV MODEL_DIR=/opt/models
COPY package.json ./
COPY src ./src
COPY tests ./tests
ARG TRUTH_MODEL_REVISION=""
RUN mkdir -p /data/input /data/output /opt/models && \
  if [ -n "$TRUTH_MODEL_REVISION" ]; then \
    python3 src/download_models.py --truth-revision "$TRUTH_MODEL_REVISION" --output /opt/models; \
  else echo "No pinned model revision supplied: runtime only"; fi
RUN npm test && python3 -m unittest discover -s tests -p 'test_*.py' -v
ENTRYPOINT ["node","src/compare.js"]

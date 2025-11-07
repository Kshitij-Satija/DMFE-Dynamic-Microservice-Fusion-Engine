FROM node:18-alpine
WORKDIR /app

# Install deps
COPY ./fusion-engine/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source
COPY ./fusion-engine/. .

ENV NODE_ENV=production
# POLICY_URL is set from compose
CMD ["node", "index.js"]

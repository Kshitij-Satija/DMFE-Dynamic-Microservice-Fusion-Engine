FROM node:18-alpine
WORKDIR /app

# Install deps
COPY ./fusion-gateway/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source
COPY ./fusion-gateway/. .

ENV PORT=5000 NODE_ENV=production
EXPOSE 5000

# server.js is your entry point
CMD ["node", "server.js"]

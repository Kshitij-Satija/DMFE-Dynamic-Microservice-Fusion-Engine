FROM node:18-alpine
WORKDIR /app

# Install deps
COPY ./fusion-policy-store/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source
COPY ./fusion-policy-store/. .

ENV PORT=3000 NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]

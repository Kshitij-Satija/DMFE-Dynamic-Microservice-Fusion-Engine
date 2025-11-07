FROM node:18-alpine
WORKDIR /app

# Install deps for fused runtime
COPY ./fused-products-service/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy fused runtime source
COPY ./fused-products-service/. .

# Copy v1 & v2 service code
COPY ./product-service-v1 ./v1
COPY ./product-service-v2 ./v2

ENV PORT=3000 NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]

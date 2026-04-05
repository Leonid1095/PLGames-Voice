FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY index.js stream-service.js ./
RUN mkdir -p /app/data && chown node:node /app/data
USER node
CMD ["node", "index.js"]

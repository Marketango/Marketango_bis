FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE 3000

CMD ["node", "src/server.js"]

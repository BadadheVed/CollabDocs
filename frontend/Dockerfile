# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app

# Install OpenSSL compatibility
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
FROM node:20-alpine AS production
WORKDIR /app

# Install OpenSSL compatibility
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
EXPOSE 3000
CMD ["npm", "run", "start"]
# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app

# Install OpenSSL compatibility
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for NEXT_PUBLIC_ environment variables
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_WS_URL

# Set as environment variables for the build
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

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
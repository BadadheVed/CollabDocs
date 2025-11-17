FROM node:20-alpine AS builder
WORKDIR /app

# Install OpenSSL compatibility
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:20-alpine AS production
WORKDIR /app

# Install OpenSSL compatibility
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 1234
CMD ["npm","run" ,"start"]
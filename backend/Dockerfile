FROM node:18-alpine

WORKDIR /app

# Install OpenSSL (Required for Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose API port
EXPOSE 4000

# Start command (Run migrations then start)
CMD ["sh", "-c", "npx prisma db push && npm run start"]

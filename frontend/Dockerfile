FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

# Start command
CMD ["sh", "-c", "npm run start -- -p ${PORT:-3000} -H 0.0.0.0"]

# BUILD stage
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN apt-get update && apt-get install -y ffmpeg
RUN npm install --only=production

COPY --from=builder /app/dist /app/dist

EXPOSE 3001

CMD [ "node", "./dist/index.js", "serve" ]
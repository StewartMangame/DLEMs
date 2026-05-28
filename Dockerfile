FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json frontend/
COPY backend/package*.json backend/
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["node", "backend/dist/main"]

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_USER_API_URL=http://127.0.0.1:3001
ENV NEXT_PUBLIC_ADMIN_API_URL=http://127.0.0.1:3001

COPY package*.json ./
COPY frontend/package*.json frontend/
COPY backend/package*.json backend/
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "PORT=3001 node backend/dist/main & PORT=${PORT:-3000} HOSTNAME=0.0.0.0 npm run start --workspace=frontend"]

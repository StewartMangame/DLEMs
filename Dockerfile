FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ sqlite-dev

ENV INTERNAL_BACKEND_PORT=4001
ENV NEXT_PUBLIC_USER_API_URL=http://127.0.0.1:4001
ENV NEXT_PUBLIC_ADMIN_API_URL=http://127.0.0.1:4001

COPY package*.json ./
COPY frontend/package*.json frontend/
COPY backend/package*.json backend/
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "PUBLIC_PORT=${PORT:-3000}; BACKEND_PORT=${INTERNAL_BACKEND_PORT:-4001}; PORT=$BACKEND_PORT node backend/dist/main & PORT=$PUBLIC_PORT HOSTNAME=0.0.0.0 npm run start --workspace=frontend"]

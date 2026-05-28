FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ sqlite-dev

COPY package*.json ./
RUN npm install

COPY . .

# Environment variable that expects to build correctly. 
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]

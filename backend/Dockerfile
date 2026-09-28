FROM node:24.14.1-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "if [ -f drizzle/meta/_journal.json ]; then npm run db:migrate; fi; npm start"]
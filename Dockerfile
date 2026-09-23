FROM node:16.20.2-bookworm

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

USER node

EXPOSE 8080

CMD ["node", "app.js"]

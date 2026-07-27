FROM node:20-bullseye-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 4000
CMD ["node", "dist/index.js"]

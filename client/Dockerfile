FROM node:19.8.1-alpine3.17 AS Build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm
RUN pnpm i
COPY . .

ENTRYPOINT [ "pnpm","dev","--host" ]
EXPOSE 5173

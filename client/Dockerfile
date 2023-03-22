FROM node:19.8.1-alpine3.17 AS Build

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

COPY package.json .
RUN pnpm i
COPY . .

ENTRYPOINT [ "pnpm","dev","--host" ]
EXPOSE 5173

FROM node:19.8.1-alpine3.17 AS Build

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn
COPY . .

ENTRYPOINT [ "yarn","dev","--host" ]
EXPOSE 5173

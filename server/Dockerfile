FROM node:19.8.1-alpine3.17
RUN apk add poppler-utils
RUN apk add ghostscript
RUN apk add imagemagick
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /server

COPY package.json pnpm-lock.yaml ./
RUN pnpm i 
COPY .  .

ENTRYPOINT [ "pnpm", "dev" ]
EXPOSE ${PORT} 


FROM node:19.8.1-alpine3.17
ENV NODE_ENV production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /server

RUN apk add poppler-utils
RUN apk add ghostscript
# RUN apk add tesseract-ocr
RUN apk add imagemagick


COPY package.json pnpm-lock.yaml ./
RUN pnpm i 
COPY .  .


EXPOSE ${SERVER_PORT} 
ENTRYPOINT [ "pnpm", "dev" ]


FROM node:19.8.1 

WORKDIR /server

RUN apt update
RUN apt -y upgrade

# Adding packages for pdf ocr
RUN apt -y install pdftk
RUN apt -y install poppler-utils
RUN apt -y install ghostscript
RUN apt -y install tesseract-ocr

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

COPY package.json .
RUN pnpm i
COPY . .

ENTRYPOINT [ "pnpm", "dev" ]
EXPOSE ${SERVER_PORT}

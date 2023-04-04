FROM node:19.8.1 

WORKDIR /server

RUN apt update
RUN apt -y upgrade

# Adding packages for pdf ocr
RUN apt -y install pdftk
RUN apt -y install poppler-utils
RUN apt -y install ghostscript
RUN apt -y install tesseract-ocr
RUN apt -y install imagemagick --fix-missing
RUN sed -i '/disable ghostscript format types/,+6d' /etc/ImageMagick-6/policy.xml

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

COPY package.json yarn.lock* ./
RUN yarn --frozen-lock
COPY . .

ENTRYPOINT [ "yarn", "dev" ]
EXPOSE ${SERVER_PORT}

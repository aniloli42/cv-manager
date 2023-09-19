FROM node:19.8.1-alpine3.17

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm i 
COPY .  .

ENTRYPOINT [ "pnpm", "dev","--host" ]
EXPOSE 5173 

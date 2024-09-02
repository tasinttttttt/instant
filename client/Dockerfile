FROM node:20

WORKDIR /app

COPY package*.json ./

COPY turbo.json ./

RUN corepack enable pnpm && pnpm i

# RUN pnpm run build

# WORKDIR /app/www

EXPOSE 3000

CMD ["pnpm", "dev"]
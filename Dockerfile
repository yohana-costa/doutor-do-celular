# Imagem unica com dois alvos para a VPS (docker-compose.yml):
#   api -> Express + Prisma (aplica as migrations ao subir)
#   web -> nginx com o site estatico, repassando /api e /uploads para a API
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# o postinstall roda prisma generate, entao o schema precisa estar aqui antes do npm ci
COPY package*.json ./
COPY backend/prisma ./backend/prisma
RUN npm ci

COPY . .
# backend/src -> backend/dist; seed (que importa src/lib) -> backend/build-seed
RUN npx tsc -p backend/tsconfig.json \
 && npx tsc -p backend/tsconfig.prisma.json --noEmit false --outDir backend/build-seed \
 && npm run build

FROM node:20-bookworm-slim AS api
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOADS_LOCAL=1
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/build-seed ./backend/build-seed
COPY docker/entrypoint.sh ./entrypoint.sh
RUN mkdir -p ./uploads
EXPOSE 3000
ENTRYPOINT ["sh", "./entrypoint.sh"]

FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

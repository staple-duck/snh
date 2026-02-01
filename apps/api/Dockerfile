FROM node:20-alpine AS prepare
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @snh/api --docker

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=prepare /app/out/json/ .
RUN npm install

COPY --from=prepare /app/out/full/ .
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npx prisma generate
RUN npm run build --filter=@snh/api

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache postgresql-client

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/node_modules ./node_modules

RUN printf '#!/bin/sh\n\
echo "Running database migrations..."\n\
npx prisma migrate deploy\n\
echo "Starting API..."\n\
cd /app && node -r tsconfig-paths/register dist/apps/api/src/main.js\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]

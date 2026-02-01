FROM node:20-alpine AS prepare
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @snh/web --docker

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=prepare /app/out/json/ .
RUN npm install

COPY --from=prepare /app/out/full/ .

FROM base AS development
EXPOSE 4200
ENV NODE_ENV=development
CMD ["npm", "run", "dev", "--filter=@snh/web"]

FROM base AS builder
ENV NODE_ENV=production
RUN npm run build --filter=@snh/web

FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4200
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 4200
CMD ["node", "apps/web/server.js"]

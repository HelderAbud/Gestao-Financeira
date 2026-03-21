# Build from monorepo root: docker build -f apps/web/Dockerfile .
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/types/openapi.snapshot.json ./packages/types/
COPY packages/types/src/api.d.ts ./packages/types/src/
RUN npm install --workspaces --include-workspace-root

COPY apps/web ./apps/web
COPY packages/types ./packages/types

WORKDIR /app/apps/web
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/apps/web/.next/standalone ./
COPY --from=deps /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=deps /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]

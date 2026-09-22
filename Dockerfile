# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV CORS_ORIGIN=*
ENV PERSIST_JOBS=true
ENV DATA_DIR=/app/data
ENV CLIENT_DIST=/app/client/dist
ENV SEED_ON_BOOT=false

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --omit=dev

COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist

RUN mkdir -p /app/data /app/uploads \
  && chown -R node:node /app

USER node
EXPOSE 4000
WORKDIR /app/server
CMD ["node", "dist/index.js"]

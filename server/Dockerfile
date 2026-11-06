# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Compiles TypeScript if a build script exists; no-op otherwise
RUN npm run build --if-present
RUN npm prune --omit=dev

# ---- runtime stage ----
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD wget -qO- http://localhost:5000/api/health || exit 1
CMD ["npm", "start"]

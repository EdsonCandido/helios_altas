FROM node:24-alpine AS base
WORKDIR /app
RUN addgroup -S helios && adduser -S helios -G helios

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

FROM deps AS development
COPY . .
USER helios
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/src/db/schema ./src/db/schema
USER helios
EXPOSE 3000
CMD ["node", "dist/index.js"]

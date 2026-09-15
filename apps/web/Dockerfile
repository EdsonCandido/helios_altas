FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
ARG API_URL=""
RUN printf '{ "apiUrl": "%s", "socketUrl": "%s" }\n' "$API_URL" "$API_URL" > public/config.json
RUN npm run build

FROM nginx:1.27-alpine
RUN addgroup -S helios && adduser -S helios -G helios
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/web/browser /usr/share/nginx/html
EXPOSE 80
USER nginx

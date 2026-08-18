FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web-panel/package.json apps/web-panel/package.json
RUN npm install
COPY packages/shared packages/shared
COPY apps/web-panel apps/web-panel
RUN npm --workspace @droidview/shared run build
RUN npm --workspace @droidview/web-panel run build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/web-panel/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

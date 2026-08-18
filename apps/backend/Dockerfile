FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN npm install

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN npm --workspace @droidview/shared run build
RUN npm --workspace @droidview/backend run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
EXPOSE 3000
CMD ["npm", "--workspace", "@droidview/backend", "run", "start"]

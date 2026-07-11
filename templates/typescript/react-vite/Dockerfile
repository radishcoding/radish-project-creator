# syntax=docker/dockerfile:1

# 阶段 1: 构建 SPA 静态产物.
FROM node:22-alpine AS build
ENV HUSKY=0
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段 2: Caddy 作为唯一公网源, 服务静态 + 反代 /api/v1 到后端 (单源, 无 CORS).
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80

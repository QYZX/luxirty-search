FROM node:26-slim AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV ASTRO_TELEMETRY_DISABLED=1
WORKDIR /app

# 准备编译环境:只拷贝依赖清单,安装依赖(仅当依赖变更时才会重建此层)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm@11.28.7
RUN --mount=type=cache,id=pnpm,target=/pnpm/store  pnpm i --frozen-lockfile

# 生成编译产物:拷贝全部源码,基于已装好的依赖进行构建
FROM deps AS build
COPY . .
RUN pnpm build

# 生产环境:nginx 仅包含编译产物
FROM nginx:stable-alpine AS production-stage
COPY ./conf/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

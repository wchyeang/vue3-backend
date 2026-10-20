# Vue3 项目 Docker 部署迁移提示词

> 将以下提示词粘贴给 AI，即可在 Vue 3 + Vite 项目中一比一复刻本项目的 Docker 部署方案。

---

## 提示词（Prompt）

```
你是一个前端 DevOps 工程师。请为当前 Vue 3 + Vite 项目搭建以下 Docker 部署基础设施，参考 React 项目的成熟方案，严格对齐架构。

---

## 文件清单（共 8 个）

| # | 文件 | 用途 |
|---|------|------|
| 1 | `Dockerfile` | 三阶段构建（deps → builder → Nginx runtime） |
| 2 | `nginx.conf` | Nginx 生产配置（SPA 路由、API 代理、静态缓存、安全头、健康检查） |
| 3 | `docker-compose.yml` | 本地/生产编排 |
| 4 | `docker-compose.ci.yml` | CI 覆盖文件（禁用缓存、不映射端口） |
| 5 | `.dockerignore` | 排除不必要文件，减小构建上下文 |
| 6 | `deploy.sh` | Linux/Mac 一键部署脚本（bash） |
| 7 | `deploy.ps1` | Windows 一键部署脚本（PowerShell） |
| 8 | `.env` / `.env.development` / `.env.production` | 环境变量 |

---

## 一、通用要求

1. **包管理器**：保持项目现有包管理器（npm / pnpm / yarn）。如果原本用 pnpm，需包含 `.npmrc` 镜像加速。
2. **镜像名称**：将 `react-backend` 替换为 `vue3-admin`（或该项目实际名称）。
3. **容器名称**：将 `react-backend` 替换为 `vue3-admin`。
4. **构建产物目录**：Vite 默认输出 `dist/`，确认一致；否则替换。
5. **环境变量前缀**：Vite 统一使用 `VITE_` 前缀，变量名不变：
   - `VITE_API_BASE_URL`  — 后端 API 地址
   - `VITE_USE_MOCK`       — 是否启用 Mock
6. **Slogan 注释**：所有文件头部注释中 "React 后台管理" 改为 "Vue3 后台管理"。
7. **所有文件用 UTF-8 编码，LF 行尾。**

---

## 二、各文件详细说明

### 2.1 Dockerfile（三阶段构建）

```

Stage 1 — deps（依赖安装层）

- FROM node:22-alpine
- 配置 npm 镜像（国内加速）+ 启用 corepack（如用 pnpm）
- 仅 COPY package.json / lock 文件 / 包管理器配置，利用缓存
- RUN install --frozen-lockfile

Stage 2 — builder（构建层）

- FROM node:22-alpine
- COPY --from=deps node_modules
- COPY . .
- ARG VITE_API_BASE_URL=/api  + ENV 注入（默认值）
- ARG VITE_USE_MOCK=false     + ENV 注入（默认值）
- RUN build（执行项目的 build 脚本）

Stage 3 — runtime（运行时层）

- FROM nginx:1.27-alpine
- 安装 curl（供 HEALTHCHECK）
- 删除默认 conf，注入自定义 nginx.conf
- COPY --from=builder /app/dist → /usr/share/nginx/html
- 创建 nginxuser（uid/gid 1001），降权运行 worker
- EXPOSE 80
- HEALTHCHECK curl <http://localhost:80/health>
- CMD ["nginx", "-g", "daemon off;"]

```

### 2.2 nginx.conf

功能要点（沿用相同结构）：

| 模块 | 说明 |
|------|------|
| `worker_processes auto` | 自动匹配 CPU 核数 |
| `user nginxuser` | worker 降权 |
| `log_format main` | JSON 格式日志（含耗时、上游响应时间） |
| `gzip` | 开启，压缩 JS/CSS/JSON/SVG |
| `server_tokens off` | 隐藏 Nginx 版本 |
| `location /assets/` | 带哈希静态资源，1 年强缓存 |
| `location /api/` | 反向代理到 `$backend`（变量化 upstream），附带 WebSocket 升级头 |
| `location /` | SPA try_files 回退到 index.html |
| `location /health` | 健康检查端点，返回 200 |
| 安全头 | `X-Frame-Options`、`X-Content-Type-Options`、`X-XSS-Protection`、`Referrer-Policy`，server 级 + 关键 location 级显式复述（因为 add_header 会覆盖父级） |

**关键差异**：反向代理的 `$backend` 默认值改为 `backend:8080`，前端无需改。

### 2.3 docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: /api
        VITE_USE_MOCK: "false"
    image: vue3-admin:${IMAGE_TAG:-latest}
    container_name: vue3-admin
    ports:
      - "${HOST_PORT:-80}:80"
    restart: unless-stopped
    environment:
      - TZ=Asia/Shanghai
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    # 可选：backend 容器（注释掉，按需启用）

networks:
  app-network:
    driver: bridge
```

### 2.4 docker-compose.ci.yml

```yaml
services:
  frontend:
    build:
      args:
        VITE_USE_MOCK: "false"
        VITE_API_BASE_URL: "${VITE_API_BASE_URL:-/api}"
      no_cache: true
    ports: []
```

### 2.5 .dockerignore

排除：`node_modules`、`dist`、`.git`、`.env*`、`coverage`、`*.md`、`.vscode`、`.idea`、CI 目录等。沿用同一份，无需改动。

### 2.6 deploy.sh（bash）

- `IMAGE_NAME="vue3-admin"`
- `load_env_file` 函数保持不变（支持 `.env` + `.env.production` 叠加）
- `TAG` 从 `package.json` 的 `version` 字段读取，可通过 `IMAGE_TAG` 覆盖
- 子命令：`build` / `push` / `run` / `stop` / `lint` / `clean`
- `do_build` 中 `--build-arg` 使用 `VITE_API_BASE_URL` / `VITE_USE_MOCK`
- `do_clean` 中容器名改为 `vue3-admin`

### 2.7 deploy.ps1（PowerShell）

- `$ImageName = "vue3-admin"`
- `Import-DotEnv` 函数保持不变
- 子命令：`build` / `run` / `stop` / `clean`
- 同样的 `VITE_*` build-arg

### 2.8 环境变量文件

**.env**（基础共享）：

```
VITE_API_BASE_URL=/api
```

**.env.development**：

```
VITE_USE_MOCK=true
```

**.env.production**：

```
VITE_USE_MOCK=false
HOST_PORT=18880
```

---

## 三、Vue 3 特有问题与检查清单

| # | 检查项 |
| --- | -------- |
| 1 | **包管理器确认**：检查 `pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` 存在哪个，Dockerfile 中 install 命令对应调整 |
| 2 | **构建命令**：确认 `package.json` 中 `build` 脚本是否为 `vite build`（Vue 3 通常是 `vue-tsc --noEmit && vite build` 或类似） |
| 3 | **TypeScript 检查**：如果项目有 `vue-tsc`，Dockerfile builder 阶段已执行 `pnpm build`（内含类型检查），无需额外步骤 |
| 4 | **路由模式**：确认是否使用 `createWebHistory`（History 模式）。如果是，Nginx `try_files` 已正确处理；如果是 Hash 模式也兼容 |
| 5 | **静态资源目录**：Vite 默认 `dist/assets/`，与 React 一致，Nginx 缓存规则无需改动 |
| 6 | **环境变量访问**：Vue 3 中 Vite 变量用 `import.meta.env.VITE_XXX`，Dockerfile ARG → ENV 注入方式完全兼容 |
| 7 | **Nginx 反向代理地址**：如果 Vue 项目有独立的后端容器名，修改 nginx.conf 中 `$backend` 默认值 |

---

## 四、最终验证命令

```bash
# 构建镜像
./deploy.sh build

# 本地运行
./deploy.sh run

# 访问 http://localhost:80（或 $HOST_PORT）
# 健康检查
curl http://localhost:80/health
# 预期输出: ok

# 停止
./deploy.sh stop

# 清理
./deploy.sh clean
```

---

请严格按照上述架构和文件清单，在当前 Vue 3 项目根目录生成全部 8 个文件。

```

---

## 使用说明

1. 复制上方 `提示词（Prompt）` 区块的全部内容
2. 将 `vue3-admin` 替换为实际项目名称（全局搜索替换）
3. 确认 Vite 构建输出目录和包管理器类型
4. 粘贴给 AI 即可完成复刻

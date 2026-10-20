# vue3-backend

基于 Vue 3 的中后台管理系统前端模板，提供响应式布局、全局主题（明/暗）、多语言（中/英）、登录鉴权以及可选的鼠标拖尾趣味效果，开箱即用。

## 技术栈

| 类别 | 依赖 |
| ------ | ------ |
| 框架 | Vue 3（Composition API + `<script setup>`） |
| 构建 | Vite |
| 语言 | TypeScript |
| UI 组件库 | Ant Design Vue 4（含 `@ant-design/icons-vue`） |
| 状态管理 | Pinia |
| HTTP | Axios（双 token 拦截器 + 自动刷新） |
| Mock | MSW（Mock Service Worker） |
| 路由 | Vue Router |
| 国际化 | vue-i18n |
| 工具 | VueUse（`@vueuse/core`） |
| 测试 | Vitest（单元）、Playwright（E2E） |

## 功能特性

- **登录鉴权（JWT 双 token）**：接入 Axios，采用 `accessToken` + `refreshToken` 双 token 方案。
  - Token 持久化基于 VueUse `useStorage`（`composables/useAuthStorage`），不重复造轮子；
  - 请求拦截器自动注入 `Authorization: Bearer <accessToken>`（登录/刷新白名单除外）；
  - 响应拦截器统一处理 `{ code, message, data }`：业务 `code === 401` 自动刷新 —— **单次刷新 + 并发等待队列重放**，避免同时失效的多个请求触发刷新风暴；
  - 刷新失败自动清空登录态并跳转 `/login`；路由守卫（`meta.requiresAuth`）按 auth store 登录态控制访问。
- **接口 Mock（MSW）**：通过 Service Worker 在浏览器层拦截网络，无需真实后端即可开发联调。
  - 覆盖 `POST /api/auth/login`、`/api/auth/refresh`、`/api/auth/logout`、`GET /api/user/info`；
  - 用环境变量 `VITE_USE_MOCK` 开启/关闭（开发默认开启），关闭后直连真实后端，前端代码零改动。
- **响应式布局**：移动优先。
  - 手机（xs）：顶部条 + 左侧 Drawer 抽屉导航；
  - 平板 / 桌面：可折叠固定 `Sider` + 面包屑。
  - 基于 antd `useBreakpoint` 封装在 `composables/useResponsive`。
- **明/暗主题**：Pinia store（`stores/theme`）切换 `antd` 的 `darkAlgorithm / defaultAlgorithm`，同时给 `<html>` 设置 `data-theme` 以便自定义样式跟随。
- **多语言**：中文 / English 切换，持久化到 `localStorage`，词典集中在 `src/locales`。
- **鼠标拖尾效果**：头部「鼠标拖尾」下拉可选
  - **基础拖尾**（`CursorTrail`）— 弹簧/阻尼跟随的圆点轨迹；
  - **像素网格**（`PixelTrail`）— 网格像素衰减的发光拖尾；
  - **Emoji 雨**（`TextRain`）— 光标扫过溅射 Emoji 粒子。
  - 统一处理移动端触屏坐标（`clientX/Y`）、高分屏（`devicePixelRatio`）与视口缩放。
- **仪表盘**：统计卡片、最近订单表格（移动端列宽 `max-content` 纵向滚动）、性能指标。
- **404 页**：`NotFound` 兜底路由。

## 目录结构

```text
src/
├── main.ts                  # 入口：挂载 Pinia / Router / i18n / antd；按 VITE_USE_MOCK 条件启动 MSW
├── App.vue                  # 根组件：按配置动态加载拖尾效果
├── api/                     # 接口层
│   ├── http.ts              # Axios 实例 + 拦截器（token 注入 / 401 自动刷新队列）
│   ├── auth.ts              # 登录 / 刷新 / 登出 / 用户信息接口封装
│   └── index.ts             # 统一导出
├── components/              # 全局组件：三种鼠标拖尾 effect
├── composables/             # 组合式函数
│   ├── useResponsive.ts     # 封装 antd 断点 -> xs/md/lg...
│   └── useAuthStorage.ts    # token 存取（VueUse useStorage）
├── layout/
│   └── MainLayout.vue       # 主布局：Sider/Header/Content + 移动 Drawer
├── locales/                 # vue-i18n 词典（zh-CN / en-US）
├── mocks/                   # MSW mock
│   ├── browser.ts           # setupWorker 启动实例
│   ├── handlers.ts          # /auth/* 与 /user/info 接口处理器
│   └── utils.ts             # 演示用 token 生成 / 过期判定
├── router/
│   └── index.ts             # 路由 + 登录守卫（依赖 auth store）
├── stores/                  # Pinia：counter / theme / trail / auth
├── styles/
│   ├── tokens.css           # 设计令牌（间距/字号/布局/安全区）
│   └── responsive.css       # 移动优先响应式 + 打印样式
├── types/
│   └── api.ts               # 统一响应 { code, message, data } 与接口类型
└── views/                   # Login / Home / NotFound
```

## 项目启动

```sh
pnpm install
```

### 开发（热更新）

```sh
pnpm run dev
```

> 开发模式默认启用 **MSW mock**（见下方「接口 Mock」），登录账号 `admin / admin`。

### 构建

```sh
pnpm run build          # 生产构建（先类型检查，再打包）
pnpm run build:demo     # Demo 构建（MSW mock，部署到 Cloudflare Pages）
pnpm run preview        # 本地预览 dist 产物
```

### 类型检查

```sh
pnpm run type-check   # vue-tsc --build
```

### 单元测试（Vitest）

```sh
pnpm run test:unit
```

> 说明：默认的 `src/__tests__/App.spec.ts` 与 `e2e/vue.spec.ts` 仍源自脚手架模板（断言 `You did it!`），尚未针对本应用改写；接入真实页面时请补充对应断言。

### E2E 测试（Playwright）

```sh
# 首次运行需安装浏览器
npx playwright install

# CI 前需先构建
pnpm run build

pnpm run test:e2e                       # 全部
pnpm run test:e2e -- --project=chromium # 仅 Chromium
pnpm run test:e2e -- --debug            # 调试
```

## 运行模式

项目支持三种运行模式，通过 Vite `--mode` 参数选择，每种模式对应不同的 `.env` 文件：

| 模式 | 命令 | 环境文件 | `VITE_USE_MOCK` | 说明 |
| ------ | ------ | ------ | :------: | ------ |
| development | `pnpm run dev` | `.env.development` | `true` | 本地开发，HMR 热更新 + MSW mock |
| demo | `pnpm run build:demo` | `.env.demo` | `true` | 构建产物含 MSW，可部署到 Cloudflare Pages |
| production | `pnpm run build` | `.env.production` | `false` | 生产构建，MSW 代码在编译期被 tree-shaking 剔除 |

### 接口 Mock（MSW）

通过 Service Worker 在浏览器层拦截 `/api` 请求，无需真实后端即可串联「登录 → 鉴权 → 双 token 刷新」全链路。

| 接口 | 说明 |
| ------ | ------ |
| `POST /api/auth/login` | 校验 `admin / admin`，返回 `accessToken` + `refreshToken` + 用户信息 |
| `POST /api/auth/refresh` | 携带 refreshToken，签发新的双 token |
| `POST /api/auth/logout` | 登出 |
| `GET /api/user/info` | 校验 accessToken，过期返回 `code: 401`（触发自动刷新） |

**本地开发**

```sh
pnpm run dev
```

开发模式默认启用 MSW，登录页会显示 `演示账号：admin / admin` 提示。Vite dev server 的 `/api` 代理配置不会被触发（请求已被 MSW 拦截）。

**Demo 模式（无后端部署）**

```sh
pnpm run build:demo    # 以 --mode demo 构建
pnpm run preview       # 本地预览，验证部署效果
```

Demo 构建特点：

- 打包 MSW 代码（`browser.ts` 通过动态 `import()` 加载，仅 Demo 模式包含在产物中）；
- 保留 `dist/mockServiceWorker.js` 和 `dist/_redirects`（Cloudflare Pages SPA 回退规则）；
- 登录页显示 Demo 账号提示。

**生产模式（直连真实后端）**

将 `.env.production` 中 `VITE_USE_MOCK` 设为 `false`，运行 `pnpm run build` 即可。构建插件会自动：

- 删除 `dist/mockServiceWorker.js`（不暴露 MSW）；
- 删除 `dist/_redirects`（Docker / Nginx 部署不需要）；
- 通过 Vite tree-shaking 剔除所有 MSW 代码。

> 实现位于 `src/mocks/`（handlers / browser / utils），由 `src/main.ts` 中的 `import.meta.env.VITE_USE_MOCK === 'true'` 条件控制启动。首次接入或更改 mock 时，确保 `public/mockServiceWorker.js` 存在（由 `npx msw init public/` 生成）。

## Cloudflare Pages 部署（Demo 模式）

Demo 模式专为 Cloudflare Pages 设计，无需任何后端服务。

**部署配置**

| 配置项 | 值 |
| ------ | ------ |
| Build command | `pnpm build:demo` |
| Build output directory | `dist` |
| 环境变量 | 无需额外设置（`.env.demo` 已包含 `VITE_USE_MOCK=true`） |

**SPA 路由回退**

项目使用 History 路由模式（`createWebHistory`），因此 `public/_redirects` 中配置了 `/* /index.html 200`，确保 Cloudflare Pages 处理 SPA 路由时不会返回 404。Demo 构建时该文件会保留，生产构建时自动移除。

## 双 token 鉴权设计

- **存储**：`composables/useAuthStorage` 基于 VueUse `useStorage` 管理 `accessToken` / `refreshToken`。
- **请求**：`api/http.ts` 请求拦截器对白名单（`/auth/login`、`/auth/refresh`）外的请求注入 `Authorization: Bearer <accessToken>`。
- **响应**：统一读取 `{ code, message, data }`；`code === 0` 直接返回 `data`，其余业务码统一 `message.error`。
- **自动刷新**：业务码或 HTTP 401 且非白名单时，进入 `retryAfterRefresh` —— 用 `isRefreshing` 保证同一时刻仅发起一次刷新，并发请求进入等待队列，刷新成功后以新 token 依次重放；刷新失败执行 `setRefreshFailHandler` 注册的回调（auth store 中为清空登录态并跳转 `/login`）。
- **状态**：`stores/auth.ts` 提供 `login` / `logout` / `isAuthenticated` / `userInfo`，供路由守卫与各页面使用。

### 代码检查与格式化

```sh
pnpm run lint          # oxlint + eslint（--fix，带缓存）
pnpm run format        # prettier 格式化 src/
```

## 环境要求

- Node.js `^22.18.0 || >=24.12.0`（见 `package.json` 的 `engines`）
- 包管理器建议使用 pnpm（仓库使用 `.pnpm` 安装）

## 设计约定

- **设计令牌**：全局在 `src/styles/tokens.css` 通过 CSS 变量维护间距（4px 阶梯）、字号、布局尺寸、安全区（iPhone 刘海屏），antd v5 之外的 UI 一律引用这些令牌，避免魔法值。
- **根字号**：`1rem = 10px`（`font-size: calc(1rem * 0.625)`），既方便换算，又能随浏览器「默认字号 / 文本缩放」无障碍设置成比例变化。
- **移动端**：安全区（`--safe-*`）适配刘海屏；触摸目标 ≥ `--touch-target-min`（44px，WCAG 2.5.5）；打印时隐藏 Sider / Header。
- **路径别名**：`@` 指向 `src/`（见 `vite.config.ts` 与 JS/TS 配置）。

## 环境变量

项目使用 Vite 的 [多环境模式](https://cn.vite.dev/guide/env-and-mode.html)，不同模式加载不同 `.env` 文件：

| 文件 | 适用模式 | 说明 |
| ------ | ------ | ------ |
| `.env` | 所有模式 | 共享配置（`VITE_API_BASE_URL` 等） |
| `.env.development` | `dev` | 开发专用，默认 `VITE_USE_MOCK=true` |
| `.env.demo` | `build:demo` | Demo 构建，`VITE_USE_MOCK=true` |
| `.env.production` | `build` | 生产构建，`VITE_USE_MOCK=false` |

**核心变量**

- `VITE_API_BASE_URL`：接口基础路径（默认 `/api`），`api/http.ts` 以此作为 Axios `baseURL`。
- `VITE_USE_MOCK`：是否启用 MSW mock。`'true'` 时通过动态 `import()` 加载 MSW worker，`'false'` 时 MSW 代码在编译期被完全剔除。
- `import.meta.env.BASE_URL`：路由 history 基路径（Vite 提供）。
- 类型声明见 `env.d.ts` 的 `ImportMetaEnv`。

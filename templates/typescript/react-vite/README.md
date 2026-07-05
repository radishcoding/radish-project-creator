# 萝卜前端模板 (radish-frontend-template)

生产级, 可复用的通用前端项目模板. 页面本身是一张白屏 (仅右上角一个主题切换控件), 但底层集成了一整套横切基础设施: HTTP 请求, 鉴权/令牌, 加解密, 校验, 状态管理, 国际化, 错误处理, 日志, 测试与工程化. 目标是作为新项目的**起点**直接复用, 你只需在此之上添加业务页面与接口.

## 特性

- **类型安全**: TypeScript strict + `verbatimModuleSyntax` + `erasableSyntaxOnly`, 全量 `tsc` 零错误.
- **HTTP 层**: Axios 实例 + 拦截器, 统一响应解包与错误规范化, 401 静默刷新 (并发去重).
- **鉴权**: 可配置令牌存储适配器 (默认内存, 可切 localStorage), jose 解码, 会话派生, 路由守卫.
- **服务端状态**: TanStack Query v5, 全局错误处理经 QueryCache/MutationCache.
- **客户端状态**: Zustand v5 工厂 (内置 devtools + immer 中间件, 消除样板).
- **国际化**: react-i18next, 内置中英文, 浏览器语言自动检测.
- **主题**: 亮/暗/跟随系统三态, FOUC 防闪, 键盘 `D` 快捷键, 跨标签同步.
- **错误处理**: react-error-boundary 组件级边界 + 全局未捕获错误/Promise 拒绝捕获.
- **测试**: Vitest + React Testing Library 单元/组件测试, Playwright E2E, MSW 接口 mock.
- **工程化**: ESLint (含 import 排序) + Prettier, Husky + lint-staged + commitlint, GitHub Actions CI.
- **构建**: Vite 8 (Rolldown) + React Compiler, 手动分块 (vendor 拆分).

## 技术栈

| 领域       | 选型                                                         |
| ---------- | ------------------------------------------------------------ |
| 构建/框架  | Vite 8 (Rolldown) + React 19 (React Compiler) + TypeScript 6 |
| 样式/UI    | Tailwind v4 + shadcn (base-nova) + Base UI + lucide-react    |
| 字体       | JetBrains Mono (@fontsource-variable)                        |
| 路由       | React Router v8                                              |
| 客户端状态 | Zustand v5 (+ immer / devtools 中间件)                       |
| 服务端状态 | TanStack Query v5                                            |
| HTTP       | Axios (拦截器 + 401 静默刷新)                                |
| 鉴权       | jose (JWT 解码) + 令牌存储适配器 + 会话 + 路由守卫           |
| 加解密     | crypto-js (AES / SHA / HMAC / MD5 / Base64)                  |
| 表单/校验  | React Hook Form + Zod v4 (env / 接口响应 / 表单 schema)      |
| 国际化     | react-i18next + i18next-browser-languagedetector             |
| 日期       | date-fns v4                                                  |
| 工具函数   | es-toolkit                                                   |
| 动效       | Motion                                                       |
| 文档头/SEO | @unhead/react                                                |
| 错误处理   | react-error-boundary + 全局捕获                              |
| 日志       | 自建分级 Logger (可挂 Sentry sink)                           |
| 测试       | Vitest + React Testing Library + Playwright + MSW            |
| 代码质量   | ESLint (simple-import-sort) + Prettier + typescript-eslint   |
| 提交规范   | Husky + lint-staged + commitlint (Conventional Commits)      |

> 说明: Zod 同时用于环境变量, 接口响应与表单 schema 校验. 表单用 React Hook Form + `@hookform/resolvers` 的 `zodResolver` 接入 Zod. 模板本身不含表单页面 (白屏起点), 但依赖与用法已就绪, 直接按下方示例写业务表单即可.

## 环境要求

- Node.js >= 20 (推荐 22, 与 CI 一致)
- npm (仓库使用 `package-lock.json`)
- 运行 E2E 前需安装 Playwright 浏览器 (见下方测试章节)

## 快速开始

```bash
# 1. 安装依赖 (会自动经 prepare 装好 git 钩子)
npm install

# 2. 复制环境变量模板并按需填写 (Windows PowerShell 用 Copy-Item)
cp .env.example .env.local

# 3. 启动开发服务器
npm run dev
```

## 目录结构

```
.
├── e2e/                      # Playwright 端到端用例
│   └── smoke.spec.ts
├── public/
│   └── mockServiceWorker.js  # MSW 生成的 Service Worker
├── src/
│   ├── api/                  # HTTP 层
│   │   ├── client.ts         #   apiClient (含拦截器) / bareClient (裸)
│   │   ├── interceptors.ts   #   请求/响应拦截器 + 401 刷新编排 + 错误规范化
│   │   ├── query-client.ts   #   TanStack Query 客户端 + 全局错误
│   │   ├── types.ts          #   ApiResponse / Paginated / AppError / ErrorCode
│   │   ├── index.ts          #   组装点 (导出已挂拦截器的 apiClient)
│   │   └── endpoints/        #   类型化端点示例 (auth.ts)
│   ├── auth/                 # 鉴权
│   │   ├── token-store.ts    #   令牌存储适配器 (内存 / localStorage)
│   │   ├── refresh.ts        #   并发去重的静默刷新
│   │   ├── session.ts        #   会话派生 + 登出事件 + useSession
│   │   └── guard.tsx         #   <RequireAuth> 路由守卫
│   ├── components/           # UI
│   │   ├── theme-context.ts  #   ThemeProviderContext + useTheme
│   │   ├── theme-provider.tsx#   三态主题 Provider (FOUC 防闪 / D 快捷键 / 跨标签同步)
│   │   ├── theme-toggle.tsx  #   右上角三态切换控件
│   │   └── ui/button.tsx     #   cva Button 原语
│   ├── config/
│   │   ├── env.ts            #   Zod 校验的类型安全环境变量
│   │   └── constants.ts      #   全局常量
│   ├── hooks/                # 通用 hooks
│   │   ├── use-media-query.ts
│   │   ├── use-debounced-value.ts
│   │   ├── use-is-mounted.ts
│   │   └── use-copy-to-clipboard.ts
│   ├── i18n/
│   │   ├── index.ts          #   react-i18next 初始化
│   │   └── locales/          #   zh-CN / en-US (common 命名空间)
│   ├── lib/                  # 无状态工具 (叶子层)
│   │   ├── crypto.ts         #   crypto-js 封装 (AES/SHA/HMAC/MD5/Base64)
│   │   ├── jwt.ts            #   jose 解码 / 过期判断
│   │   ├── logger.ts         #   分级 Logger + sink
│   │   ├── storage.ts        #   类型安全 local/session 存储
│   │   ├── date.ts           #   date-fns 封装
│   │   ├── global-errors.ts  #   全局错误监听
│   │   └── utils.ts          #   cn() 类名合并
│   ├── mocks/                # MSW
│   │   ├── handlers.ts       #   请求处理器
│   │   ├── node.ts           #   setupServer (测试)
│   │   └── browser.ts        #   setupWorker (开发)
│   ├── providers/
│   │   ├── app-providers.tsx #   组合根 (Error > Head > Query > I18n > Theme)
│   │   └── error-fallback.tsx#   错误边界降级 UI
│   ├── router/
│   │   ├── index.tsx         #   createBrowserRouter
│   │   ├── routes.tsx        #   路由表
│   │   ├── layouts/root-layout.tsx  # 白屏布局 + 主题切换 + 页面过渡
│   │   └── pages/home-page.tsx      # 空白首页
│   ├── stores/
│   │   ├── create-store.ts   #   Zustand 工厂 (devtools + immer)
│   │   └── ui-store.ts       #   示例 store
│   ├── test/
│   │   └── setup.ts          #   Vitest setup (jest-dom / matchMedia / MSW)
│   ├── App.tsx               # 挂载 RouterProvider
│   ├── main.tsx              # 入口 (AppProviders + 全局错误 + MSW 开关)
│   └── index.css             # Tailwind + 主题 CSS 变量
├── .env.example              # 环境变量模板
├── .gitattributes            # 强制 LF 行尾 (跨平台一致)
├── commitlint.config.js      # Conventional Commits 规则
├── components.json           # shadcn 配置 (base-nova)
├── eslint.config.js          # ESLint 扁平配置
├── playwright.config.ts      # Playwright 配置
├── vite.config.ts            # Vite + Vitest + React Compiler + 分块
└── .github/workflows/ci.yml  # CI
```

## 可用脚本

| 脚本                    | 说明                                                            |
| ----------------------- | --------------------------------------------------------------- |
| `npm run dev`           | 开发服务器 (HMR)                                                |
| `npm run build`         | 生产构建 (`tsc -b` + `vite build`)                              |
| `npm run preview`       | 本地预览构建产物                                                |
| `npm run test`          | 单元/组件测试 (Vitest, 一次性)                                  |
| `npm run test:watch`    | 测试监视模式                                                    |
| `npm run test:coverage` | 覆盖率报告 (输出 `coverage/`)                                   |
| `npm run test:e2e`      | E2E 测试 (Playwright)                                           |
| `npm run lint`          | ESLint 检查                                                     |
| `npm run lint:fix`      | ESLint 自动修复 (含 import 排序)                                |
| `npm run format`        | Prettier 格式化 (改写文件)                                      |
| `npm run format:check`  | Prettier 格式检查 (只读, 不改文件)                              |
| `npm run typecheck`     | TypeScript 类型检查                                             |
| `npm run verify`        | 全量校验: 类型 -> lint -> 格式 -> 测试 -> 构建 -> E2E, 失败即停 |

## 核心模块用法

### 环境变量 (Zod 校验)

在 `src/config/env.ts` 的 schema 中声明变量; 启动时校验, 缺失或格式错误会立即抛错.

```ts
import { env } from "@/config/env"

apiClient.get(env.VITE_API_BASE_URL + "/ping")
```

### HTTP 请求

`@/api` 导出已挂拦截器的 `apiClient`. 拦截器自动注入令牌与 traceId, 解包 `ApiResponse<T>`, 把错误规范化为 `AppError`, 并在 401 时静默刷新令牌后重放请求. 在 `src/api/endpoints/` 下写类型化端点:

```ts
import { apiClient } from "@/api"

export async function getUser(id: number): Promise<User> {
  const response = await apiClient.get<User>(`/users/${id}`)
  return response.data // 已由拦截器解包
}
```

配合 TanStack Query:

```ts
import { useQuery } from "@tanstack/react-query"

function useUser(id: number) {
  return useQuery({ queryKey: ["user", id], queryFn: () => getUser(id) })
}
```

### 鉴权

```ts
import { tokenStore } from "@/auth/token-store"
import { useSession } from "@/auth/session"

tokenStore.setAccessToken(accessToken) // 登录后写入
const { isAuthenticated, claims, logout } = useSession()
```

路由守卫:

```tsx
import { RequireAuth } from "@/auth/guard"

{ path: "/dashboard", element: <RequireAuth><Dashboard /></RequireAuth> }
```

### 客户端状态 (Zustand)

`createStore` 工厂已集成 devtools 与 immer, `set` 支持草稿式变更:

```ts
import { createStore } from "@/stores/create-store"

export const useCounterStore = createStore<{ count: number; inc: () => void }>(
  "counter",
  (set) => ({
    count: 0,
    inc: () =>
      set((state) => {
        state.count += 1
      }),
  })
)
```

### 表单 (React Hook Form + Zod)

用 `zodResolver` 把 Zod schema 接到 React Hook Form:

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
})
type FormValues = z.infer<typeof schema>

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  return (
    <form onSubmit={handleSubmit((values) => console.log(values))}>
      <input {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}
      <input type="password" {...register("password")} />
      <button type="submit">登录</button>
    </form>
  )
}
```

### 国际化

在 `src/i18n/locales/{zh-CN,en-US}/common.json` 加键, 组件内:

```tsx
import { useTranslation } from "react-i18next"

const { t, i18n } = useTranslation()
t("themeToggle") // 切换主题 / Toggle theme
i18n.changeLanguage("en-US")
```

### 主题

`ThemeProvider` 已在组合根注入; 用 `useTheme` 读写, `ThemeToggle` 可嵌入任意布局:

```tsx
import { useTheme } from "@/components/theme-context"

const { theme, setTheme } = useTheme() // theme: "light" | "dark" | "system"
```

### 工具库 (lib)

```ts
import { encryptAes, sha256 } from "@/lib/crypto"
import { decodeToken, isExpired } from "@/lib/jwt"
import { createLogger } from "@/lib/logger"
import { formatDate } from "@/lib/date"

const log = createLogger("payment")
log.info("已下单", orderId)
```

## 约定

### 提交规范

提交遵循 [Conventional Commits](https://www.conventionalcommits.org/), 由 commit-msg 钩子经 commitlint 强制校验; pre-commit 钩子经 lint-staged 自动 lint/format 暂存文件. 常用类型: `feat` (新功能), `fix` (缺陷), `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`.

### 环境变量

所有变量经 Zod 在启动时校验 (见 `src/config/env.ts`), 未通过则启动即报错. 模板见 `.env.example`.

| 变量                | 说明                                         | 默认值                  |
| ------------------- | -------------------------------------------- | ----------------------- |
| `VITE_API_BASE_URL` | 后端 API 基地址 (需合法 URL)                 | `http://localhost:8080` |
| `VITE_APP_ENV`      | 运行环境: development / staging / production | `development`           |
| `VITE_SENTRY_DSN`   | Sentry DSN (可选, 留空则不启用)              | (空)                    |
| `VITE_ENABLE_MSW`   | 是否启用开发态 MSW mock: true / false        | `false`                 |

### 令牌存储

- 默认存**内存** (抗 XSS), 页面刷新后令牌丢失.
- 切换为 localStorage 持久化: 把 `src/auth/token-store.ts` 末尾的单例导出改为 `createLocalStorageTokenStore()`.
- 401 响应由 Axios 响应拦截器自动触发静默刷新 (并发去重); 刷新失败则清除令牌并派发登出事件, 由 `<RequireAuth>` 跳转登录.

### 主题系统

三态 (亮 / 暗 / 跟随系统), 默认跟随系统. 已内置: 首帧 FOUC 防闪 (见 `index.html` 内联脚本), 键盘 `D` 快捷键切换, 跨标签页同步, `prefers-reduced-motion` 时动效降级.

## 测试

- **单元/组件** (Vitest + RTL, jsdom 环境): `npm run test`. 注意: 部分测试故意触发错误路径, 会在控制台打印 `[global] 未捕获错误` 等日志, 这是被测功能正常工作的证据, 不是失败 (以每个文件前的 `✓` 与末尾 `passed` 为准).
- **覆盖率**: `npm run test:coverage`, 报告在 `coverage/index.html`.
- **E2E** (Playwright): 首次需装浏览器, 之后运行用例:

  ```bash
  npx playwright install chromium
  npm run test:e2e
  ```

  若报 `browserType.launch: Executable doesn't exist`, 重新执行 `npx playwright install chromium` 即可.

- **接口 mock** (MSW): 测试环境由 `src/test/setup.ts` 自动启用 (Node 适配器); 开发态设 `VITE_ENABLE_MSW=true` 启用浏览器 Service Worker. handlers 位于 `src/mocks/handlers.ts`.

## 代码质量

- **ESLint** (`eslint.config.js`): typescript-eslint + react-hooks + react-refresh + simple-import-sort (导入自动分组排序).
- **Prettier** (`.prettierrc`): 无分号, 双引号, `endOfLine: lf`, 集成 tailwindcss 插件 (自动排序类名).
- **Husky 钩子**: pre-commit 跑 lint-staged (eslint --fix + prettier), commit-msg 跑 commitlint.
- **行尾**: `.gitattributes` 强制文本文件 LF, 避免 Windows CRLF 触发 `format:check` 误报.

一条命令跑完全部门禁: `npm run verify`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) 在 push 到 `master`/`main` 或 PR 时触发两个并行 job (Node 22):

- **quality**: `npm ci` -> typecheck -> lint -> test -> build
- **e2e**: `npm ci` -> `npx playwright install --with-deps chromium` -> test:e2e

## License

本模板可自由用作项目起点. 仓库当前未附带 LICENSE 文件; 如需明确授权, 请自行添加 (例如 MIT).

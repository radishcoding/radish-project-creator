# go-template

生产级 Go 纯后端 API 项目模板. 模块路径 `github.com/radishcoding/go-template`, Go 1.26, MIT 协议.

分层架构、统一响应、全套中间件、可观测性、容器化与 CI 开箱即用. 仅内置健康检查端点, 供快速验证; 业务端点按需在其上扩展.

## 特性

- **分层架构**: `handler → service → repository/platform` 单向依赖, 手动构造注入 (无 DI 框架魔法), 各层经接口通信、易替换易测.
- **统一响应信封**: 所有响应为 `{code, message, data, requestId}` (camelCase), 字符串错误码 + 真实 HTTP 状态码; 未匹配路由也返回 404 信封.
- **完整中间件链**: request_id 透传/生成、panic 恢复、结构化访问日志、安全响应头、CORS、请求体上限、超时、Redis 分布式限流.
- **可观测性**: OpenTelemetry (Trace + Metrics, OTLP 导出), 日志含 requestId/traceId; 本地一键起 Jaeger + Prometheus + Grafana.
- **健康探针**: `/livez` (存活, 恒 200, 不依赖任何外部依赖)、`/readyz` (就绪, 探 PostgreSQL + Redis); 探针绕开限流, 适配 k8s.
- **数据层**: pgx v5 连接池 + sqlc 类型安全代码生成 + golang-migrate 版本化迁移.
- **认证组件**: golang-jwt v5 的 JWT 验签中间件 (可复用组件, 未挂载业务端点).
- **优雅关闭**: 收到 SIGINT/SIGTERM 后停止收新请求、有序关闭 HTTP/OTel/Redis/pgx, 超时兜底.
- **工程化**: Task 任务运行器、golangci-lint、air 热重载、lefthook 提交钩子、GitHub Actions CI、多阶段 Dockerfile (distroless 非 root)、Swagger 文档.

## 技术栈

| 类别      | 组件                                                   |
| --------- | ------------------------------------------------------ |
| 框架      | Gin                                                    |
| 数据库    | pgx/v5 + sqlc + golang-migrate                         |
| 缓存/限流 | go-redis v9 + redis_rate                               |
| 日志      | zap                                                    |
| 配置      | Viper                                                  |
| 可观测性  | OpenTelemetry (traces + metrics)                       |
| 认证      | golang-jwt/v5                                          |
| 文档      | swaggo                                                 |
| 测试      | testify + testcontainers-go                            |
| 工具链    | Task + golangci-lint + air + lefthook + GitHub Actions |

## 目录结构

```
cmd/server/main.go            # 入口 (含容器 healthcheck 子命令)
internal/
├── app/                      # 装配层 (手动 DI) + 生命周期 (启动/优雅关闭)
├── config/                   # Viper 配置
├── server/                   # HTTP 层
│   ├── router.go             # 路由 + 中间件链装配
│   ├── handler/              # 健康检查 handler
│   ├── middleware/           # recovery/accesslog/secure/cors/bodylimit/timeout/ratelimit/auth
│   ├── requestid/            # request_id 中间件与 context 存取 (叶子包, 破环)
│   └── response/             # 统一响应信封 + error-返回式 handler 适配器
├── service/health/           # 业务逻辑 (健康探活)
├── repository/               # 数据访问 (含 db/ sqlc 生成代码)
├── platform/                 # 基础设施: auth/cache/database/logger/observability
└── version/                  # 构建版本
pkg/apperror/                 # 框架无关的应用错误类型 (字符串码 + HTTP 映射)
db/migrations, db/queries     # 迁移与 sqlc 查询源
api/openapi/                  # swaggo 生成的文档
configs/ build/ deployments/ .github/workflows/
```

## 环境要求

- **Go 1.26+**.
- **Docker** (Docker Desktop 或 daemon): 用于本地依赖 (PostgreSQL/Redis) 与完整测试 (testcontainers).
- 可选 **Task** 任务运行器 (`go install github.com/go-task/task/v3/cmd/task@latest`); 未安装时下文均给出等价的原生命令.
- 可选命令行工具 (sqlc/swag/air/migrate/gofumpt), 一键装: `task tools`.

## 快速开始

### 1. 拉起依赖

仅运行应用只需 PostgreSQL + Redis:

```bash
docker compose -f deployments/docker-compose.yml up -d postgres redis
```

需要完整可观测性栈 (Jaeger/Prometheus/Grafana/OTel Collector) 时:

```bash
task compose:up            # 等价 docker compose (dir: deployments) up -d --build
```

### 2. 启动服务

```bash
go run ./cmd/server        # 直接运行
# 或
task run                   # 同上
task dev                   # air 热重载 (改 .go/.yaml 自动重建)
```

默认监听 `:8000`. 配置默认值与 compose 中的 postgres/redis 一致, 零配置即可连上.

### 3. 验证

```bash
curl http://localhost:8000/livez     # 存活: 200
curl http://localhost:8000/readyz    # 就绪: 探 postgres + redis, 全就绪 200 否则 503
```

预期就绪响应:

```json
{
  "code": "ok",
  "message": "ready",
  "data": { "postgres": "up", "redis": "up" },
  "requestId": "..."
}
```

## API 约定

**统一响应信封** (所有端点, 含错误与 404):

```jsonc
// 成功
{ "code": "ok", "message": "success", "data": { }, "requestId": "..." }
// 失败 (HTTP 状态码同时为真实语义码)
{ "code": "resource_not_found", "message": "route not found", "data": null, "requestId": "..." }
```

- **错误码**: lower_snake 字符串枚举 (`invalid_argument`/`unauthorized`/`forbidden`/`resource_not_found`/`too_many_requests`/`internal_error`/`service_unavailable`), 集中定义于 `pkg/apperror`.
- **request_id**: 透传入站 `X-Request-ID`, 缺失则生成 UUID; 注入 context、响应头与访问日志.
- **健康探针**: `/livez`、`/readyz` 在**根路径** (不带 `/api/v1` 前缀), 且绕开限流; `/api/v1` 是为业务端点预留的前缀 (见路由注释中的挂载示例).

## 中间件链

全局顺序 (外→内): `request_id → recovery → otel → accesslog → secure → cors → bodylimit → timeout → ratelimit`.

- **限流**: 基于 Redis (redis_rate) 按客户端 IP 计数, 超限返回 429 + `Retry-After`; **Redis 不可用时 fail-open** (记告警并放行, 避免拖垮全站). 健康探针不受限流. 客户端 IP 经 `server.trusted_proxies` 判定是否采信 `X-Forwarded-For`: 默认信任无代理 (取直连地址); 部署在反代 (如 Caddy) 后须填代理网段, 否则 IP 可被伪造以绕过限流.
- **认证**: `middleware.Auth` 是可复用的 JWT 验签组件 (校验签名/过期/issuer), 默认不挂载; 挂载示例见 `internal/server/router.go` 注释.

## 配置

配置优先级: **默认值 → `configs/config.yaml` → 环境变量**. 环境变量前缀 `APP_`, 嵌套键用下划线连接.

常用覆盖项:

| 环境变量                                                          | 说明                              | 默认                       |
| ----------------------------------------------------------------- | --------------------------------- | -------------------------- |
| `APP_APP_PORT`                                                    | 监听端口                          | 8000                       |
| `APP_APP_ENV`                                                     | 运行环境 (development/production) | development                |
| `APP_POSTGRES_HOST` / `APP_POSTGRES_PASSWORD` / `APP_POSTGRES_DB` | PostgreSQL                        | localhost / postgres / app |
| `APP_REDIS_ADDR`                                                  | Redis 地址                        | localhost:6379             |
| `APP_AUTH_JWT_SECRET`                                             | JWT 密钥                          | change-me-in-production    |
| `APP_RATELIMIT_RPS` / `APP_RATELIMIT_BURST`                       | 限流速率/突发                     | 100 / 200                  |
| `APP_OTEL_ENABLED` / `APP_OTEL_ENDPOINT`                          | 开启 OTel / collector 地址        | false / localhost:4317     |
| `APP_LOG_LEVEL` / `APP_LOG_FORMAT`                                | 日志级别 / 格式 (json\|console)   | info / json                |

示例:

```bash
APP_APP_PORT=9000 APP_POSTGRES_HOST=db go run ./cmd/server
```

> 生产提示: 当 `APP_APP_ENV=production` 且 `APP_AUTH_JWT_SECRET` 仍为默认值时, 启动会因配置校验失败而退出 —— 上线务必替换密钥.

## API 文档

Swagger UI (仅非生产环境, `APP_APP_ENV != production`):

```
http://localhost:8000/swagger/index.html
```

修改 handler 上的 `@...` 注解后重新生成:

```bash
task swag:generate
# 或: swag init -g cmd/server/main.go -o api/openapi
```

## 测试

```bash
go test -short ./...     # 仅单元测试 (毫秒级, 无需 Docker)
go test ./...            # 全量 (含 testcontainers 集成测试, 需 Docker)
go test -race ./...      # 加竞态检测 (需 C 编译器/CGO; Windows 需装 MinGW-w64)
task ci                  # 等价 CI: lint → 全量测试 → build
```

集成测试 (database/cache/repository/ratelimit) 用 testcontainers 自动拉起真实 PostgreSQL/Redis 容器. GitHub Actions 在 ubuntu 上跑全量 + 竞态.

## 可观测性

`task compose:up` 后 (需 `APP_OTEL_ENABLED=true` 运行应用以产生数据):

| 服务                  | 地址                   |
| --------------------- | ---------------------- |
| Jaeger (链路追踪)     | http://localhost:16686 |
| Grafana (指标看板)    | http://localhost:3000  |
| Prometheus (指标采集) | http://localhost:9090  |

## 容器化与部署

多阶段构建 → distroless 非 root 镜像, 内置 `HEALTHCHECK` (调用 `server healthcheck` 子命令自探 `/livez`):

```bash
docker build -f build/Dockerfile -t go-template:local .
# 或: task docker:build
```

`deployments/docker-compose.yml` 提供含应用与全套依赖的本地编排.

## 数据库迁移

```bash
task migrate:up                      # 应用迁移
task migrate:down                    # 回滚一步
task migrate:create -- <name>        # 新建迁移
```

需本机 `migrate` CLI (`task tools` 已含). 迁移文件在 `db/migrations/`; 修改 schema 后跑 `task sqlc:generate` 重新生成类型安全代码.

## 开发工具

```bash
go fmt ./...        # 格式化 (内置); 或 task fmt (gofumpt, 更严格)
task lint           # golangci-lint
task dev            # air 热重载
lefthook install    # 装 git 提交钩子 (pre-commit 跑 fmt/lint/test)
```

## 扩展指南

- **加业务端点**: 在 `internal/server/router.go` 的 `/api/v1` 组下注册 (可套 `middleware.Auth`); 参考 health 的 handler → service → repository 分层写法.
- **移除 sqlc 示例**: `db/queries/health.sql` 的 `HealthCheck` 仅为演示. 删除该文件并 `task sqlc:generate` 重新生成, 同时清理 `internal/repository/health_repo.go` 中的引用.

## 许可证

MIT

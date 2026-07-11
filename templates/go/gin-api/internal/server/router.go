// Package server 装配 Gin 引擎: 中间件链 + 路由注册.
package server

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.uber.org/zap"

	"github.com/radishcoding/go-template/internal/config"
	"github.com/radishcoding/go-template/internal/platform/auth"
	"github.com/radishcoding/go-template/internal/server/handler"
	"github.com/radishcoding/go-template/internal/server/middleware"
	"github.com/radishcoding/go-template/internal/server/requestid"
	"github.com/radishcoding/go-template/internal/server/response"
	"github.com/radishcoding/go-template/internal/service/health"
	"github.com/radishcoding/go-template/pkg/apperror"
)

// Deps 汇总构建路由所需的全部依赖.
type Deps struct {
	Cfg         *config.Config
	Logger      *zap.Logger
	Redis       *redis.Client
	AuthManager *auth.Manager
	Health      *health.Service
}

// New 构建配置了中间件链与路由的 Gin 引擎.
func New(d Deps) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	// 全局中间件链 (外→内).
	r.Use(requestid.Middleware())
	r.Use(middleware.Recovery(d.Logger))
	r.Use(otelgin.Middleware(d.Cfg.App.Name))
	r.Use(middleware.AccessLog(d.Logger))
	r.Use(middleware.Secure())
	// 单源部署 (前端经反向代理/同源) 无需 CORS; 仅当显式配置了白名单 (跨源部署) 才挂载.
	if len(d.Cfg.Server.CORSOrigins) > 0 {
		r.Use(middleware.CORS(d.Cfg.Server.CORSOrigins))
	}
	r.Use(middleware.BodyLimit(d.Cfg.Server.BodyLimitBytes))
	r.Use(middleware.Timeout(d.Cfg.Server.RequestTimeout))

	// 健康探针 (不带版本前缀). 注册在限流之前, 使其不依赖 Redis、不被限流:
	// 保证 /livez 恒 200 (符合 spec), 且 Redis 故障时 /readyz 仍能正常返回 503 明细.
	hh := handler.NewHealthHandler(d.Health)
	r.GET("/livez", hh.Livez)
	r.GET("/readyz", hh.Readyz)

	// 限流仅作用于其后注册的业务路由; Redis 可用时挂载.
	if d.Redis != nil {
		r.Use(middleware.RateLimit(d.Redis, d.Cfg.RateLimit, d.Logger))
	}

	// 业务路由组 (示例: 受保护组的挂载方式).
	// v1 := r.Group(d.Cfg.App.APIPrefix)
	// protected := v1.Group("", middleware.Auth(d.AuthManager))
	// _ = protected // 模板暂无业务端点, 按需在此注册.
	_ = d.AuthManager

	if d.Cfg.App.Env != "production" {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// 未匹配路由统一返回 404 信封. 显式设置 NoRoute 也修正了 timeout 中间件的
	// 缓冲响应默认 200 导致未匹配路由返回空 200 (而非 404) 的问题.
	r.NoRoute(func(c *gin.Context) {
		response.Error(c, apperror.NewNotFound("route not found"))
	})

	return r
}

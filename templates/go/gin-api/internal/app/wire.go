package app

import (
	"context"
	"fmt"

	"github.com/radishcoding/go-template/internal/config"
	"github.com/radishcoding/go-template/internal/platform/auth"
	"github.com/radishcoding/go-template/internal/platform/cache"
	"github.com/radishcoding/go-template/internal/platform/database"
	"github.com/radishcoding/go-template/internal/platform/logger"
	"github.com/radishcoding/go-template/internal/platform/observability"
	"github.com/radishcoding/go-template/internal/repository"
	"github.com/radishcoding/go-template/internal/server"
	"github.com/radishcoding/go-template/internal/service/health"
	"github.com/radishcoding/go-template/internal/version"
)

// build 手动构造并注入全部依赖, 返回装配好的 App.
// 任一步失败时逆序回滚已建立的资源, 与 App.Close 的关闭语义对称, 避免连接/goroutine 泄漏.
func build(ctx context.Context, cfg *config.Config) (app *App, err error) {
	var cleanups []func()
	defer func() {
		if err != nil {
			for i := len(cleanups) - 1; i >= 0; i-- {
				cleanups[i]()
			}
		}
	}()

	log, err := logger.New(cfg.Log)
	if err != nil {
		return nil, fmt.Errorf("init logger: %w", err)
	}

	// 发布构建 (ldflags 注入版本) 时以真实版本上报 OTel, 覆盖配置默认的 "dev".
	if v := version.Version(); v != "dev" {
		cfg.OTel.ServiceVersion = v
	}

	otelShutdown, err := observability.Init(ctx, cfg.OTel)
	if err != nil {
		return nil, fmt.Errorf("init observability: %w", err)
	}
	cleanups = append(cleanups, func() { _ = otelShutdown(context.Background()) })

	pool, err := database.NewPool(ctx, cfg.Postgres)
	if err != nil {
		return nil, fmt.Errorf("init postgres: %w", err)
	}
	cleanups = append(cleanups, pool.Close)

	redisClient, err := cache.NewClient(cfg.Redis)
	if err != nil {
		return nil, fmt.Errorf("init redis: %w", err)
	}
	cleanups = append(cleanups, func() { _ = redisClient.Close() })

	authMgr := auth.NewManager(cfg.Auth)

	// readyz 经 sqlc 生成的 HealthCheck 查询探 postgres (真实查询往返), redis 用 Ping.
	healthSvc := health.New(map[string]health.Pinger{
		"postgres": repository.NewHealthRepo(pool),
		"redis":    health.PingFunc(func(ctx context.Context) error { return redisClient.Ping(ctx).Err() }),
	})

	engine := server.New(server.Deps{
		Cfg:         cfg,
		Logger:      log,
		Redis:       redisClient,
		AuthManager: authMgr,
		Health:      healthSvc,
	})

	return &App{
		cfg:          cfg,
		logger:       log,
		pool:         pool,
		redis:        redisClient,
		engine:       engine,
		otelShutdown: otelShutdown,
	}, nil
}

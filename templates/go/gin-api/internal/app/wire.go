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
	"github.com/radishcoding/go-template/internal/server"
	"github.com/radishcoding/go-template/internal/service/health"
)

// build 手动构造并注入全部依赖, 返回装配好的 App.
func build(ctx context.Context, cfg *config.Config) (*App, error) {
	log, err := logger.New(cfg.Log)
	if err != nil {
		return nil, fmt.Errorf("init logger: %w", err)
	}

	otelShutdown, err := observability.Init(ctx, cfg.OTel)
	if err != nil {
		return nil, fmt.Errorf("init observability: %w", err)
	}

	pool, err := database.NewPool(ctx, cfg.Postgres)
	if err != nil {
		return nil, fmt.Errorf("init postgres: %w", err)
	}

	redisClient, err := cache.NewClient(cfg.Redis)
	if err != nil {
		return nil, fmt.Errorf("init redis: %w", err)
	}

	authMgr := auth.NewManager(cfg.Auth)

	// readyz 直接 ping pgxpool/redis; repository.HealthRepo 为 sqlc 演示, 不在探活热路径.
	healthSvc := health.New(map[string]health.Pinger{
		"postgres": pool,
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

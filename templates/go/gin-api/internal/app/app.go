// Package app 组合各组件为可运行应用, 管理启动与优雅关闭.
package app

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radishcoding/go-template/internal/config"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// App 持有全部运行时依赖, 负责生命周期管理.
type App struct {
	cfg          *config.Config
	logger       *zap.Logger
	pool         *pgxpool.Pool
	redis        *redis.Client
	engine       *gin.Engine
	server       *http.Server
	otelShutdown func(context.Context) error
}

// addr 将端口号格式化为 HTTP 监听地址.
func addr(port int) string { return fmt.Sprintf(":%d", port) }

// New 加载全部依赖并返回装配好的应用.
func New(ctx context.Context, cfg *config.Config) (*App, error) {
	return build(ctx, cfg)
}

// Run 启动 HTTP 服务并阻塞至收到终止信号, 随后优雅关闭.
func (a *App) Run(ctx context.Context) error {
	ctx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	a.server = &http.Server{
		Addr:         addr(a.cfg.App.Port),
		Handler:      a.engine,
		ReadTimeout:  a.cfg.Server.ReadTimeout,
		WriteTimeout: a.cfg.Server.WriteTimeout,
	}

	errCh := make(chan error, 1)
	go func() {
		a.logger.Info("server starting", zap.String("addr", a.server.Addr))
		if err := a.server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	select {
	case err := <-errCh:
		return fmt.Errorf("server error: %w", err)
	case <-ctx.Done():
		a.logger.Info("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), a.cfg.Server.ShutdownTimeout)
	defer cancel()
	return a.Close(shutdownCtx)
}

// Close 依序关闭 HTTP 服务与各资源.
func (a *App) Close(ctx context.Context) error {
	var errs []error
	if a.server != nil {
		if err := a.server.Shutdown(ctx); err != nil {
			errs = append(errs, fmt.Errorf("http shutdown: %w", err))
		}
	}
	if a.otelShutdown != nil {
		if err := a.otelShutdown(ctx); err != nil {
			errs = append(errs, fmt.Errorf("otel shutdown: %w", err))
		}
	}
	if a.redis != nil {
		if err := a.redis.Close(); err != nil {
			errs = append(errs, fmt.Errorf("redis close: %w", err))
		}
	}
	if a.pool != nil {
		a.pool.Close()
	}
	if a.logger != nil {
		_ = a.logger.Sync()
	}
	return errors.Join(errs...)
}

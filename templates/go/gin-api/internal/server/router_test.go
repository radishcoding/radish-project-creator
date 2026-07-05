package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/radishcoding/go-template/internal/config"
	"github.com/radishcoding/go-template/internal/platform/auth"
	"github.com/radishcoding/go-template/internal/service/health"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

// newTestEngine 构建一个仅含基础依赖 (无 Redis) 的测试引擎.
func newTestEngine() *gin.Engine {
	cfg := &config.Config{}
	cfg.App.APIPrefix = "/api/v1"
	cfg.Server.RequestTimeout = time.Second
	cfg.Server.CORSOrigins = []string{"*"}
	cfg.Server.BodyLimitBytes = 1 << 20

	return New(Deps{
		Cfg:         cfg,
		Logger:      zap.NewNop(),
		Redis:       nil, // 无限流依赖时路由内部应跳过 RateLimit 装配
		AuthManager: auth.NewManager(config.Auth{JWTSecret: "s", Issuer: "t", TTL: time.Hour}),
		Health:      health.New(nil),
	})
}

func TestRouterLivez(t *testing.T) {
	w := httptest.NewRecorder()
	newTestEngine().ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/livez", nil))
	require.Equal(t, http.StatusOK, w.Code)
}

// TestRouterNotFound 验证未匹配路由返回 404 统一信封 (而非空 200).
func TestRouterNotFound(t *testing.T) {
	w := httptest.NewRecorder()
	newTestEngine().ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/no/such/route", nil))
	require.Equal(t, http.StatusNotFound, w.Code)
	require.Contains(t, w.Body.String(), "resource_not_found")
}

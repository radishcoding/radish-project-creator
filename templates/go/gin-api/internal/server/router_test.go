package server

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"

	"github.com/radishcoding/go-template/internal/config"
	"github.com/radishcoding/go-template/internal/platform/auth"
	"github.com/radishcoding/go-template/internal/service/health"
)

// newTestEngineWithOrigins 构建带指定 CORS 白名单的测试引擎 (无 Redis).
func newTestEngineWithOrigins(corsOrigins []string) *gin.Engine {
	cfg := &config.Config{}
	cfg.App.APIPrefix = "/api/v1"
	cfg.Server.RequestTimeout = time.Second
	cfg.Server.CORSOrigins = corsOrigins
	cfg.Server.BodyLimitBytes = 1 << 20

	return New(Deps{
		Cfg:         cfg,
		Logger:      zap.NewNop(),
		Redis:       nil, // 无限流依赖时路由内部应跳过 RateLimit 装配
		AuthManager: auth.NewManager(config.Auth{JWTSecret: "s", Issuer: "t", TTL: time.Hour}),
		Health:      health.New(nil),
	})
}

// newTestEngine 构建一个仅含基础依赖 (无 Redis) 的测试引擎.
func newTestEngine() *gin.Engine {
	return newTestEngineWithOrigins([]string{"*"})
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

// TestCORSDisabledByDefault 验证单源默认 (空白名单) 不挂载 CORS: 跨源请求无 ACAO 响应头.
func TestCORSDisabledByDefault(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/livez", nil)
	req.Header.Set("Origin", "http://evil.example.com")
	newTestEngineWithOrigins(nil).ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
	require.Empty(t, w.Header().Get("Access-Control-Allow-Origin"))
}

// TestCORSEnabledWhenConfigured 验证配置具体白名单 (跨源部署) 时挂载 CORS: 匹配源回显 ACAO 与凭据头.
func TestCORSEnabledWhenConfigured(t *testing.T) {
	const origin = "http://app.example.com"
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/livez", nil)
	req.Header.Set("Origin", origin)
	newTestEngineWithOrigins([]string{origin}).ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
	require.Equal(t, origin, w.Header().Get("Access-Control-Allow-Origin"))
	require.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
}

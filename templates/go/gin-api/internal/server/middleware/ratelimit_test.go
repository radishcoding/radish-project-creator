package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/radishcoding/go-template/internal/config"
	"github.com/radishcoding/go-template/internal/server/requestid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcredis "github.com/testcontainers/testcontainers-go/modules/redis"
	"go.uber.org/zap"
)

func TestRateLimitBlocksAfterBurst(t *testing.T) {
	if testing.Short() {
		t.Skip("skip integration test in -short mode")
	}
	ctx := t.Context()
	ctr, err := tcredis.Run(ctx, "redis:7-alpine")
	require.NoError(t, err)
	t.Cleanup(func() { _ = testcontainers.TerminateContainer(ctr) })
	connStr, _ := ctr.ConnectionString(ctx)
	opt, _ := redis.ParseURL(connStr)
	rdb := redis.NewClient(opt)
	defer rdb.Close()

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(requestid.Middleware(), RateLimit(rdb, config.RateLimit{RPS: 1, Burst: 1}, zap.NewNop()))
	r.GET("/", func(c *gin.Context) { c.Status(200) })

	do := func() int {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/", nil))
		return w.Code
	}
	require.Equal(t, http.StatusOK, do())
	require.Equal(t, http.StatusTooManyRequests, do())
}

// TestRateLimitFailsOpenWhenBackendDown 验证 Redis 不可达时限流 fail-open (放行, 而非 5xx).
// 无需 Docker: 指向一个无人监听的地址, 让 limiter.Allow 快速失败.
func TestRateLimitFailsOpenWhenBackendDown(t *testing.T) {
	rdb := redis.NewClient(&redis.Options{Addr: "127.0.0.1:1", DialTimeout: 200 * time.Millisecond, MaxRetries: -1})
	defer rdb.Close()

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(requestid.Middleware(), RateLimit(rdb, config.RateLimit{RPS: 1, Burst: 1}, zap.NewNop()))
	r.GET("/", func(c *gin.Context) { c.Status(http.StatusOK) })

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/", nil))
	require.Equal(t, http.StatusOK, w.Code)
}

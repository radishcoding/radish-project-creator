package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis_rate/v10"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/radishcoding/go-template/internal/config"
	"github.com/radishcoding/go-template/internal/server/response"
	"github.com/radishcoding/go-template/pkg/apperror"
)

// RateLimit 基于 Redis 做分布式限流, 按客户端 IP 计数; 超限返回 429 + Retry-After.
// Redis 后端不可用时采用 fail-open: 记录告警并放行, 避免 Redis 抖动拖垮整个 API
// (代价是该期间无限流保护; 如需 fail-closed, 可改为返回 5xx).
func RateLimit(rdb *redis.Client, cfg config.RateLimit, log *zap.Logger) gin.HandlerFunc {
	limiter := redis_rate.NewLimiter(rdb)
	limit := redis_rate.Limit{Rate: cfg.RPS, Burst: cfg.Burst, Period: time.Second}
	return func(c *gin.Context) {
		res, err := limiter.Allow(c.Request.Context(), "ratelimit:"+c.ClientIP(), limit)
		if err != nil {
			log.Warn("rate limiter backend unavailable, failing open",
				zap.String("clientIp", c.ClientIP()), zap.Error(err))
			c.Next()
			return
		}
		if res.Allowed == 0 {
			c.Header("Retry-After", strconv.Itoa(int(res.RetryAfter.Seconds())+1))
			response.Error(c, apperror.NewTooManyRequests("rate limit exceeded"))
			c.Abort()
			return
		}
		c.Next()
	}
}

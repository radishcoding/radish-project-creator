package middleware

import (
	"net/http"
	"time"

	"github.com/gin-contrib/timeout"
	"github.com/gin-gonic/gin"
	"github.com/radishcoding/go-template/internal/server/response"
)

// Timeout 为请求设置处理超时, 超时返回统一 503 信封.
func Timeout(d time.Duration) gin.HandlerFunc {
	return timeout.New(
		timeout.WithTimeout(d),
		timeout.WithResponse(func(c *gin.Context) {
			response.Write(c, http.StatusServiceUnavailable, "request_timeout", "request timed out", nil)
		}),
	)
}

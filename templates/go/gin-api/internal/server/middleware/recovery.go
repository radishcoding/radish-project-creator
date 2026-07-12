// Package middleware 提供 Gin 通用中间件: Recovery 与 AccessLog.
package middleware

import (
	"runtime/debug"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/radishcoding/go-template/internal/server/requestid"
	"github.com/radishcoding/go-template/internal/server/response"
	"github.com/radishcoding/go-template/pkg/apperror"
)

// Recovery 捕获下游 panic, 记录堆栈并返回统一 500 信封.
func Recovery(log *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				log.Error("panic recovered",
					zap.Any("panic", r),
					zap.String("method", c.Request.Method),
					zap.String("path", c.Request.URL.Path),
					zap.String("requestId", requestid.Get(c.Request.Context())),
					zap.ByteString("stack", debug.Stack()),
				)
				response.Error(c, apperror.NewInternal(nil))
				c.Abort()
			}
		}()
		c.Next()
	}
}

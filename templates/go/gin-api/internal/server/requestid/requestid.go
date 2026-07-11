// Package requestid 提供请求 ID 中间件与 context 存取, 作为叶子包避免包循环.
package requestid

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// HeaderXRequestID 是承载请求 ID 的 HTTP 头名称.
const HeaderXRequestID = "X-Request-ID"

type ctxKey struct{}

// Middleware 透传入站 X-Request-ID, 缺失则生成 UUID, 写入响应头与请求 context.
func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader(HeaderXRequestID)
		if id == "" {
			id = uuid.NewString()
		}
		c.Header(HeaderXRequestID, id)
		ctx := context.WithValue(c.Request.Context(), ctxKey{}, id)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// Get 从 context 取请求 ID, 不存在返回空串.
func Get(ctx context.Context) string {
	if v, ok := ctx.Value(ctxKey{}).(string); ok {
		return v
	}
	return ""
}

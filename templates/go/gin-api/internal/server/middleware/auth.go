package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/radishcoding/go-template/internal/platform/auth"
	"github.com/radishcoding/go-template/internal/server/response"
	"github.com/radishcoding/go-template/pkg/apperror"
)

// bearerPrefix 是 Authorization 头中 Bearer 令牌的前缀 (匹配时大小写不敏感).
const bearerPrefix = "Bearer "

// Auth 校验 Bearer 令牌, 通过后将主体注入 context; 失败返回 401.
// 用法: protected := r.Group("/api/v1", middleware.Auth(mgr)).
func Auth(m *auth.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		// RFC 7235: 认证 scheme 大小写不敏感, 用 EqualFold 匹配前缀.
		token := ""
		if len(header) >= len(bearerPrefix) && strings.EqualFold(header[:len(bearerPrefix)], bearerPrefix) {
			token = strings.TrimSpace(header[len(bearerPrefix):])
		}
		if token == "" {
			response.Error(c, apperror.NewUnauthorized("missing or malformed bearer token"))
			c.Abort()
			return
		}
		claims, err := m.Verify(token)
		if err != nil {
			response.Error(c, apperror.NewUnauthorized("invalid token"))
			c.Abort()
			return
		}
		c.Request = c.Request.WithContext(auth.WithSubject(c.Request.Context(), claims.Subject))
		c.Next()
	}
}

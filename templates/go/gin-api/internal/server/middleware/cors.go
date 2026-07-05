package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORS 依据白名单构造跨域中间件. origins 含 "*" 时放通全部来源.
func CORS(origins []string) gin.HandlerFunc {
	cfg := cors.Config{
		AllowMethods:  []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:  []string{"Origin", "Content-Type", "Authorization", "X-Request-ID"},
		ExposeHeaders: []string{"X-Request-ID"},
		MaxAge:        12 * time.Hour,
	}
	if len(origins) == 1 && origins[0] == "*" {
		cfg.AllowAllOrigins = true
		// 通配来源按 CORS 规范不能同时携带凭证, 故此模式下不开启 AllowCredentials.
	} else {
		cfg.AllowOrigins = origins
		cfg.AllowCredentials = true
	}
	return cors.New(cfg)
}

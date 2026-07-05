package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/radishcoding/go-template/internal/server/requestid"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

// AccessLog 输出结构化访问日志, 含 requestId 与 traceId 便于链路关联.
func AccessLog(log *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		// traceId 仅在 OTel 启用 (otel.enabled=true) 时非空.
		traceID := ""
		if sc := trace.SpanContextFromContext(c.Request.Context()); sc.HasTraceID() {
			traceID = sc.TraceID().String()
		}
		log.Info("http_request",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.Duration("latency", time.Since(start)),
			zap.String("clientIp", c.ClientIP()),
			zap.String("requestId", requestid.Get(c.Request.Context())),
			zap.String("traceId", traceID),
		)
	}
}

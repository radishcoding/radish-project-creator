// Package handler 承载 HTTP 处理器: 解析请求、调用 service、写统一响应.
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/radishcoding/go-template/internal/server/response"
	"github.com/radishcoding/go-template/internal/service/health"
)

// HealthHandler 提供存活与就绪两个健康检查端点.
type HealthHandler struct {
	svc *health.Service
}

// NewHealthHandler 构造 HealthHandler.
func NewHealthHandler(svc *health.Service) *HealthHandler {
	return &HealthHandler{svc: svc}
}

// Livez godoc
// @Summary  存活探针
// @Tags     health
// @Produce  json
// @Success  200 {object} response.Envelope
// @Router   /livez [get]
func (h *HealthHandler) Livez(c *gin.Context) {
	response.Success(c, gin.H{"status": "alive"})
}

// Readyz godoc
// @Summary  就绪探针 (探测 DB/Redis)
// @Tags     health
// @Produce  json
// @Success  200 {object} response.Envelope
// @Failure  503 {object} response.Envelope
// @Router   /readyz [get]
func (h *HealthHandler) Readyz(c *gin.Context) {
	ready, details := h.svc.Readiness(c.Request.Context())
	if !ready {
		response.Write(c, http.StatusServiceUnavailable, "not_ready", "one or more dependencies are not ready", details)
		return
	}
	response.Write(c, http.StatusOK, "ok", "ready", details)
}

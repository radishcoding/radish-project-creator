// Package response 提供统一 JSON 信封, 错误映射与 error-返回式 handler 适配器.
package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/radishcoding/go-template/internal/server/requestid"
	"github.com/radishcoding/go-template/pkg/apperror"
)

// Envelope 是所有响应的统一结构 (camelCase).
type Envelope struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	Data      any    `json:"data"`
	RequestID string `json:"requestId"`
}

// Write 以指定 HTTP 状态码写出信封.
func Write(c *gin.Context, status int, code, message string, data any) {
	c.JSON(status, Envelope{
		Code:      code,
		Message:   message,
		Data:      data,
		RequestID: requestid.Get(c.Request.Context()),
	})
}

// Success 以 200 写出成功信封.
func Success(c *gin.Context, data any) { Write(c, http.StatusOK, "ok", "success", data) }

// Created 以 201 写出创建成功信封.
func Created(c *gin.Context, data any) { Write(c, http.StatusCreated, "ok", "created", data) }

// Error 将任意错误归一化为 *apperror.Error 后写出对应状态与信封.
func Error(c *gin.Context, err error) {
	ae := apperror.From(err)
	if ae == nil { // 防御: err 为 nil 时按内部错误处理, 避免空指针
		ae = apperror.NewInternal(nil)
	}
	Write(c, ae.HTTPStatus, string(ae.Code), ae.Message, nil)
}

// HandlerFunc 是返回 error 的处理器签名, 业务只需 return err.
type HandlerFunc func(*gin.Context) error

// Wrap 适配 HandlerFunc 为 gin.HandlerFunc: 返回错误时统一走 Error.
func Wrap(h HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := h(c); err != nil {
			Error(c, err)
		}
	}
}

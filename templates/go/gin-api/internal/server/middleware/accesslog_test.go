package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/radishcoding/go-template/internal/server/requestid"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

func TestAccessLogEmitsEntry(t *testing.T) {
	core, logs := observer.New(zap.InfoLevel)
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(requestid.Middleware(), AccessLog(zap.New(core)))
	r.GET("/", func(c *gin.Context) { c.Status(http.StatusOK) })
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/", nil))
	require.Equal(t, 1, logs.Len())
	require.Equal(t, "http_request", logs.All()[0].Message)
}

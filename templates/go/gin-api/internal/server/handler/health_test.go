package handler

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/radishcoding/go-template/internal/server/requestid"
	"github.com/radishcoding/go-template/internal/service/health"
	"github.com/stretchr/testify/require"
)

func newEngine(svc *health.Service) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(requestid.Middleware())
	h := NewHealthHandler(svc)
	r.GET("/livez", h.Livez)
	r.GET("/readyz", h.Readyz)
	return r
}

func TestLivez(t *testing.T) {
	w := httptest.NewRecorder()
	newEngine(health.New(nil)).ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/livez", nil))
	require.Equal(t, http.StatusOK, w.Code)
	require.Contains(t, w.Body.String(), "alive")
}

func TestReadyzDown(t *testing.T) {
	svc := health.New(map[string]health.Pinger{
		"postgres": health.PingFunc(func(context.Context) error { return errors.New("x") }),
	})
	w := httptest.NewRecorder()
	newEngine(svc).ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/readyz", nil))
	require.Equal(t, http.StatusServiceUnavailable, w.Code)
	require.Contains(t, w.Body.String(), "not_ready")
}

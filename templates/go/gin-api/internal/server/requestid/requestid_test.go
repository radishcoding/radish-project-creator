package requestid

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func setup() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Middleware())
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, Get(c.Request.Context()))
	})
	return r
}

func TestGeneratesWhenAbsent(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	setup().ServeHTTP(w, req)
	require.NotEmpty(t, w.Body.String())
	require.NotEmpty(t, w.Header().Get(HeaderXRequestID))
}

func TestPropagatesInbound(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set(HeaderXRequestID, "abc-123")
	setup().ServeHTTP(w, req)
	require.Equal(t, "abc-123", w.Body.String())
	require.Equal(t, "abc-123", w.Header().Get(HeaderXRequestID))
}

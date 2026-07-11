package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"

	"github.com/radishcoding/go-template/internal/config"
	"github.com/radishcoding/go-template/internal/platform/auth"
	"github.com/radishcoding/go-template/internal/server/requestid"
)

func TestAuthRejectsMissingToken(t *testing.T) {
	m := auth.NewManager(config.Auth{JWTSecret: "s", Issuer: "t", TTL: time.Hour})
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(requestid.Middleware(), Auth(m))
	r.GET("/", func(c *gin.Context) { c.Status(200) })
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/", nil))
	require.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthAcceptsValidToken(t *testing.T) {
	m := auth.NewManager(config.Auth{JWTSecret: "s", Issuer: "t", TTL: time.Hour})
	tok, _ := m.Issue("u1")
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(requestid.Middleware(), Auth(m))
	r.GET("/", func(c *gin.Context) {
		require.Equal(t, "u1", auth.SubjectFrom(c.Request.Context()))
		c.Status(200)
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	r.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
}

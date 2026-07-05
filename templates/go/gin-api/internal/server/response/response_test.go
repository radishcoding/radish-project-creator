package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/radishcoding/go-template/internal/server/requestid"
	"github.com/radishcoding/go-template/pkg/apperror"
	"github.com/stretchr/testify/require"
)

func run(h gin.HandlerFunc) *httptest.ResponseRecorder {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(requestid.Middleware())
	r.GET("/", h)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/", nil))
	return w
}

func TestSuccessEnvelope(t *testing.T) {
	w := run(func(c *gin.Context) { Success(c, gin.H{"k": "v"}) })
	require.Equal(t, http.StatusOK, w.Code)
	var e Envelope
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &e))
	require.Equal(t, "ok", e.Code)
	require.NotEmpty(t, e.RequestID)
}

func TestWrapMapsAppError(t *testing.T) {
	w := run(Wrap(func(c *gin.Context) error { return apperror.NewNotFound("gone") }))
	require.Equal(t, http.StatusNotFound, w.Code)
	var e Envelope
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &e))
	require.Equal(t, "resource_not_found", e.Code)
	require.Equal(t, "gone", e.Message)
}

func TestErrorWithNilDoesNotPanic(t *testing.T) {
	w := run(func(c *gin.Context) { Error(c, nil) })
	require.Equal(t, http.StatusInternalServerError, w.Code)
}

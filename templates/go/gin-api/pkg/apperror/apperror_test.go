package apperror

import (
	"errors"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNewNotFound(t *testing.T) {
	e := NewNotFound("user not found")
	require.Equal(t, CodeNotFound, e.Code)
	require.Equal(t, http.StatusNotFound, e.HTTPStatus)
	require.Equal(t, "user not found", e.Message)
}

func TestFromAppError(t *testing.T) {
	e := NewForbidden("nope")
	require.Same(t, e, From(e))
}

func TestFromUnknownWrapsInternal(t *testing.T) {
	e := From(errors.New("boom"))
	require.Equal(t, CodeInternal, e.Code)
	require.Equal(t, http.StatusInternalServerError, e.HTTPStatus)
	require.ErrorContains(t, e, "boom")
}

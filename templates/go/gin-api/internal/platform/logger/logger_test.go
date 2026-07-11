package logger

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/radishcoding/go-template/internal/config"
)

func TestNewJSON(t *testing.T) {
	l, err := New(config.Log{Level: "info", Format: "json"})
	require.NoError(t, err)
	require.NotNil(t, l)
}

func TestInvalidLevel(t *testing.T) {
	_, err := New(config.Log{Level: "nope", Format: "json"})
	require.Error(t, err)
}

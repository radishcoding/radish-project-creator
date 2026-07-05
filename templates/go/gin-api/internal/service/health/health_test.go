package health

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLiveness(t *testing.T) {
	require.True(t, New(nil).Liveness())
}

func TestReadinessAllUp(t *testing.T) {
	s := New(map[string]Pinger{
		"postgres": PingFunc(func(context.Context) error { return nil }),
		"redis":    PingFunc(func(context.Context) error { return nil }),
	})
	ready, details := s.Readiness(context.Background())
	require.True(t, ready)
	require.Equal(t, "up", details["postgres"])
	require.Equal(t, "up", details["redis"])
}

func TestReadinessOneDown(t *testing.T) {
	s := New(map[string]Pinger{
		"postgres": PingFunc(func(context.Context) error { return errors.New("down") }),
	})
	ready, details := s.Readiness(context.Background())
	require.False(t, ready)
	require.Contains(t, details["postgres"], "down")
}

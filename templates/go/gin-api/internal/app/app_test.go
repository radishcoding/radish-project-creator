package app

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestAddr(t *testing.T) {
	require.Equal(t, ":8000", addr(8000))
	require.Equal(t, ":9090", addr(9090))
}

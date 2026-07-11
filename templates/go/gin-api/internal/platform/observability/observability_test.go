package observability

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/radishcoding/go-template/internal/config"
)

func TestInitDisabledReturnsNoopShutdown(t *testing.T) {
	shutdown, err := Init(context.Background(), config.OTel{Enabled: false})
	require.NoError(t, err)
	require.NotNil(t, shutdown)
	require.NoError(t, shutdown(context.Background()))
}

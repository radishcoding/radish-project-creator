package observability

import (
	"context"
	"testing"

	"github.com/radishcoding/go-template/internal/config"
	"github.com/stretchr/testify/require"
)

func TestInitDisabledReturnsNoopShutdown(t *testing.T) {
	shutdown, err := Init(context.Background(), config.OTel{Enabled: false})
	require.NoError(t, err)
	require.NotNil(t, shutdown)
	require.NoError(t, shutdown(context.Background()))
}

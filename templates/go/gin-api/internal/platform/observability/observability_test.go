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

// TestNewResourceNoSchemaConflict 防回归: 自建 resource 不得与 resource.Default() 的 schema URL
// 冲突, 否则 OTel 启用时 Init 会返错致启动失败 (改 NewSchemaless 前此用例会因 ErrSchemaURLConflict 失败).
func TestNewResourceNoSchemaConflict(t *testing.T) {
	res, err := newResource(config.OTel{ServiceName: "svc", ServiceVersion: "1.0.0"})
	require.NoError(t, err)
	require.NotNil(t, res)
}

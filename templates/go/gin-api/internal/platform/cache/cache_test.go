package cache

import (
	"context"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcredis "github.com/testcontainers/testcontainers-go/modules/redis"

	"github.com/radishcoding/go-template/internal/config"
)

func TestCacheSetGetDel(t *testing.T) {
	if testing.Short() {
		t.Skip("skip integration test in -short mode")
	}
	ctx := context.Background()
	ctr, err := tcredis.Run(ctx, "redis:7-alpine")
	require.NoError(t, err)
	t.Cleanup(func() { _ = testcontainers.TerminateContainer(ctr) })

	connStr, err := ctr.ConnectionString(ctx)
	require.NoError(t, err)
	opt, err := redis.ParseURL(connStr)
	require.NoError(t, err)

	client, err := NewClient(config.Redis{Addr: opt.Addr, DB: opt.DB, PoolSize: 5})
	require.NoError(t, err)
	// 测试结束时关闭客户端, 关闭错误无需处理.
	defer func() { _ = client.Close() }()

	c := New(client)
	require.NoError(t, c.Set(ctx, "k", "v", time.Minute))

	got, err := c.Get(ctx, "k")
	require.NoError(t, err)
	require.Equal(t, "v", got)

	require.NoError(t, c.Del(ctx, "k"))
	_, err = c.Get(ctx, "k")
	require.ErrorIs(t, err, ErrCacheMiss)
}

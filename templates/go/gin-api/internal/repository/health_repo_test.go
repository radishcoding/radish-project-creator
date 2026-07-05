package repository

import (
	"context"
	"testing"
	"time"

	"github.com/radishcoding/go-template/internal/config"
	"github.com/radishcoding/go-template/internal/platform/database"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

func TestHealthRepoPing(t *testing.T) {
	if testing.Short() {
		t.Skip("skip integration test in -short mode")
	}
	ctx := context.Background()
	ctr, err := tcpostgres.Run(ctx, "postgres:16-alpine",
		tcpostgres.WithDatabase("app"),
		tcpostgres.WithUsername("postgres"),
		tcpostgres.WithPassword("postgres"),
		testcontainers.WithWaitStrategy(
			wait.ForListeningPort("5432/tcp").WithStartupTimeout(60*time.Second)),
	)
	require.NoError(t, err)
	t.Cleanup(func() { _ = testcontainers.TerminateContainer(ctr) })

	host, _ := ctr.Host(ctx)
	port, _ := ctr.MappedPort(ctx, "5432/tcp")
	pool, err := database.NewPool(ctx, config.Postgres{
		Host: host, Port: int(port.Num()), User: "postgres", Password: "postgres",
		DB: "app", SSLMode: "disable", PoolSize: 5,
	})
	require.NoError(t, err)
	defer pool.Close()

	repo := NewHealthRepo(pool)
	require.NoError(t, repo.Ping(ctx))
}

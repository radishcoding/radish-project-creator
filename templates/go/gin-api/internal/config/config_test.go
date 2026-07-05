package config

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLoadDefaults(t *testing.T) {
	cfg, err := Load("")
	require.NoError(t, err)
	require.Equal(t, 8000, cfg.App.Port)
	require.Equal(t, "/api/v1", cfg.App.APIPrefix)
}

func TestEnvOverride(t *testing.T) {
	t.Setenv("APP_POSTGRES_HOST", "db.example.com")
	t.Setenv("APP_APP_PORT", "9001")
	cfg, err := Load("")
	require.NoError(t, err)
	require.Equal(t, "db.example.com", cfg.Postgres.Host)
	require.Equal(t, 9001, cfg.App.Port)
}

func TestDSN(t *testing.T) {
	p := Postgres{Host: "h", Port: 5432, User: "u", Password: "p", DB: "d", SSLMode: "disable"}
	require.Equal(t, "postgres://u:p@h:5432/d?sslmode=disable", p.DSN())
}

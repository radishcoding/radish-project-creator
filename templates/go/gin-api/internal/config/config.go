// Package config 定义应用配置结构并从默认值/文件/环境变量加载.
package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	App       App       `mapstructure:"app"`
	Server    Server    `mapstructure:"server"`
	Log       Log       `mapstructure:"log"`
	Postgres  Postgres  `mapstructure:"postgres"`
	Redis     Redis     `mapstructure:"redis"`
	Auth      Auth      `mapstructure:"auth"`
	RateLimit RateLimit `mapstructure:"ratelimit"`
	OTel      OTel      `mapstructure:"otel"`
}

type App struct {
	Name      string `mapstructure:"name"`
	Env       string `mapstructure:"env"`
	Port      int    `mapstructure:"port"`
	APIPrefix string `mapstructure:"api_prefix"`
}

type Server struct {
	ReadTimeout     time.Duration `mapstructure:"read_timeout"`
	WriteTimeout    time.Duration `mapstructure:"write_timeout"`
	ShutdownTimeout time.Duration `mapstructure:"shutdown_timeout"`
	BodyLimitBytes  int64         `mapstructure:"body_limit_bytes"`
	RequestTimeout  time.Duration `mapstructure:"request_timeout"`
	CORSOrigins     []string      `mapstructure:"cors_origins"`
}

type Log struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"` // json | console
}

type Postgres struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	DB       string `mapstructure:"db"`
	SSLMode  string `mapstructure:"sslmode"`
	PoolSize int32  `mapstructure:"pool_size"`
}

func (p Postgres) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		p.User, p.Password, p.Host, p.Port, p.DB, p.SSLMode)
}

type Redis struct {
	Addr     string `mapstructure:"addr"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
	PoolSize int    `mapstructure:"pool_size"`
}

type Auth struct {
	JWTSecret string        `mapstructure:"jwt_secret"`
	Issuer    string        `mapstructure:"issuer"`
	TTL       time.Duration `mapstructure:"ttl"`
}

type RateLimit struct {
	RPS   int `mapstructure:"rps"`
	Burst int `mapstructure:"burst"`
}

type OTel struct {
	Enabled        bool   `mapstructure:"enabled"`
	Endpoint       string `mapstructure:"endpoint"`
	ServiceName    string `mapstructure:"service_name"`
	ServiceVersion string `mapstructure:"service_version"`
}

// Load 按 默认值 -> 配置文件(可选) -> 环境变量(APP_ 前缀) 的优先级构建配置.
// path 为空时跳过文件读取, 仅用默认值 + 环境变量.
func Load(path string) (*Config, error) {
	v := viper.New()
	setDefaults(v)

	v.SetEnvPrefix("APP")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	if path != "" {
		v.SetConfigFile(path)
		if err := v.ReadInConfig(); err != nil {
			return nil, fmt.Errorf("read config %q: %w", path, err)
		}
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}
	if err := cfg.validate(); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func setDefaults(v *viper.Viper) {
	v.SetDefault("app.name", "go-template")
	v.SetDefault("app.env", "development")
	v.SetDefault("app.port", 8000)
	v.SetDefault("app.api_prefix", "/api/v1")

	v.SetDefault("server.read_timeout", "15s")
	v.SetDefault("server.write_timeout", "15s")
	v.SetDefault("server.shutdown_timeout", "10s")
	v.SetDefault("server.body_limit_bytes", 1<<20) // 1 MiB
	v.SetDefault("server.request_timeout", "30s")
	v.SetDefault("server.cors_origins", []string{"*"})

	v.SetDefault("log.level", "info")
	v.SetDefault("log.format", "json")

	v.SetDefault("postgres.host", "localhost")
	v.SetDefault("postgres.port", 5432)
	v.SetDefault("postgres.user", "postgres")
	v.SetDefault("postgres.password", "postgres")
	v.SetDefault("postgres.db", "app")
	v.SetDefault("postgres.sslmode", "disable")
	v.SetDefault("postgres.pool_size", 10)

	v.SetDefault("redis.addr", "localhost:6379")
	v.SetDefault("redis.db", 0)
	v.SetDefault("redis.pool_size", 10)

	v.SetDefault("auth.jwt_secret", "change-me-in-production")
	v.SetDefault("auth.issuer", "go-template")
	v.SetDefault("auth.ttl", "24h")

	v.SetDefault("ratelimit.rps", 100)
	v.SetDefault("ratelimit.burst", 200)

	v.SetDefault("otel.enabled", false)
	v.SetDefault("otel.endpoint", "localhost:4317")
	v.SetDefault("otel.service_name", "go-template")
	v.SetDefault("otel.service_version", "dev")
}

func (c *Config) validate() error {
	if c.App.Port <= 0 || c.App.Port > 65535 {
		return fmt.Errorf("invalid app.port: %d", c.App.Port)
	}
	if c.App.Env == "production" && c.Auth.JWTSecret == "change-me-in-production" {
		return fmt.Errorf("auth.jwt_secret must be set in production")
	}
	return nil
}

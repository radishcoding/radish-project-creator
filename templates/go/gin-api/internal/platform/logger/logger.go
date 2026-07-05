// Package logger 基于 zap 构造结构化日志器.
package logger

import (
	"fmt"
	"os"

	"github.com/radishcoding/go-template/internal/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// New 依据配置构造 *zap.Logger. format 支持 "json" 与 "console".
func New(cfg config.Log) (*zap.Logger, error) {
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(cfg.Level)); err != nil {
		return nil, fmt.Errorf("invalid log level %q: %w", cfg.Level, err)
	}

	encCfg := zap.NewProductionEncoderConfig()
	encCfg.TimeKey = "ts"
	encCfg.EncodeTime = zapcore.ISO8601TimeEncoder

	var encoder zapcore.Encoder
	switch cfg.Format {
	case "console":
		encoder = zapcore.NewConsoleEncoder(encCfg)
	default:
		encoder = zapcore.NewJSONEncoder(encCfg)
	}

	core := zapcore.NewCore(encoder, zapcore.Lock(zapcore.AddSync(os.Stdout)), level)
	return zap.New(core, zap.AddCaller()), nil
}

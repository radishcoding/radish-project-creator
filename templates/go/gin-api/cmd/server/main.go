// @title        go-template API
// @version      1.0
// @description  生产级 Go API 模板
// @BasePath     /
// 说明: 健康探针在根路径 (/livez, /readyz); 业务端点请以完整路径注解 @Router /api/v1/xxx.

// Command server 是 API 服务入口.
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/radishcoding/go-template/internal/app"
	"github.com/radishcoding/go-template/internal/config"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		os.Exit(runHealthcheck())
	}

	cfg, err := config.Load(resolveConfigPath())
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	ctx := context.Background()
	application, err := app.New(ctx, cfg)
	if err != nil {
		log.Fatalf("init app: %v", err)
	}

	if err := application.Run(ctx); err != nil {
		log.Fatalf("run: %v", err)
	}
}

// runHealthcheck 供容器 HEALTHCHECK 使用: 访问本地 /livez, 200 返回 0, 否则 1.
func runHealthcheck() int {
	cfg, err := config.Load(resolveConfigPath())
	if err != nil {
		return 1
	}
	client := &http.Client{Timeout: 3 * time.Second}
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, fmt.Sprintf("http://127.0.0.1:%d/livez", cfg.App.Port), nil)
	if err != nil {
		return 1
	}
	resp, err := client.Do(req)
	if err != nil {
		return 1
	}
	defer func() { _ = resp.Body.Close() }() // 健康检查进程即将退出, 忽略关闭错误
	if resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}

// resolveConfigPath 解析配置文件路径: 优先 APP_CONFIG_FILE 环境变量;
// 未设时若默认路径 configs/config.yaml 存在则用之, 否则返回空 (仅用默认值 + 环境变量).
func resolveConfigPath() string {
	if path := os.Getenv("APP_CONFIG_FILE"); path != "" {
		return path
	}
	const defaultPath = "configs/config.yaml"
	if _, err := os.Stat(defaultPath); err == nil {
		return defaultPath
	}
	return ""
}

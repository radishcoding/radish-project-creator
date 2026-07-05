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

	cfg, err := config.Load(os.Getenv("APP_CONFIG_FILE"))
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
	cfg, err := config.Load(os.Getenv("APP_CONFIG_FILE"))
	if err != nil {
		return 1
	}
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(fmt.Sprintf("http://127.0.0.1:%d/livez", cfg.App.Port))
	if err != nil {
		return 1
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}

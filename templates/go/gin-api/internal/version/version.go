// Package version 暴露构建版本信息, 由 -ldflags 注入.
package version

var version = "dev"

// Version 返回当前构建版本 (默认 "dev", 发布时由 ldflags 覆盖).
func Version() string { return version }

// Package health 汇总各依赖的探活状态, 供健康检查端点使用.
package health

import "context"

// Pinger 是任意可探活依赖的抽象.
type Pinger interface {
	Ping(ctx context.Context) error
}

// PingFunc 将函数适配为 Pinger, 便于包装非标准签名的客户端 (如 redis).
type PingFunc func(ctx context.Context) error

func (f PingFunc) Ping(ctx context.Context) error { return f(ctx) }

// Service 持有一组命名依赖并汇总其健康状态.
type Service struct {
	deps map[string]Pinger
}

func New(deps map[string]Pinger) *Service { return &Service{deps: deps} }

// Liveness 表示进程存活, 恒为 true.
func (s *Service) Liveness() bool { return true }

// Readiness 探测全部依赖; 全部通过时 ready=true, details 给出每项状态.
func (s *Service) Readiness(ctx context.Context) (bool, map[string]string) {
	ready := true
	details := make(map[string]string, len(s.deps))
	for name, p := range s.deps {
		if err := p.Ping(ctx); err != nil {
			ready = false
			details[name] = "down: " + err.Error()
			continue
		}
		details[name] = "up"
	}
	return ready, details
}

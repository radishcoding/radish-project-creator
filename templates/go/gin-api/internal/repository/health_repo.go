// Package repository 封装 sqlc 生成的查询, 对上层暴露领域友好的方法.
package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/radishcoding/go-template/internal/repository/db"
)

// HealthRepo 演示以 sqlc 查询做数据库探活.
type HealthRepo struct {
	q *db.Queries
}

// NewHealthRepo 创建 HealthRepo, 使用给定的连接池初始化 sqlc 查询.
func NewHealthRepo(pool *pgxpool.Pool) *HealthRepo {
	return &HealthRepo{q: db.New(pool)}
}

// Ping 执行一次 sqlc 查询以确认数据库可用.
func (repo *HealthRepo) Ping(ctx context.Context) error {
	_, err := repo.q.HealthCheck(ctx)
	return err
}

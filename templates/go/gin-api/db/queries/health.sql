-- name: HealthCheck :one
-- 返回数据库当前时间, 用于演示 sqlc 生成流程并验证连通性.
SELECT now()::timestamptz AS now;

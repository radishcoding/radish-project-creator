// Package auth 提供 JWT 签发与验证, 以及从 context 读取主体的辅助.
package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/radishcoding/go-template/internal/config"
)

// Claims 是 JWT 标准声明的封装.
type Claims struct {
	jwt.RegisteredClaims
}

// Manager 负责 JWT 的签发与验证.
type Manager struct {
	secret []byte
	issuer string
	ttl    time.Duration
}

// NewManager 使用给定配置创建 Manager.
func NewManager(cfg config.Auth) *Manager {
	return &Manager{secret: []byte(cfg.JWTSecret), issuer: cfg.Issuer, ttl: cfg.TTL}
}

// Issue 为 subject 签发 HS256 令牌.
func (m *Manager) Issue(subject string) (string, error) {
	now := time.Now()
	claims := Claims{RegisteredClaims: jwt.RegisteredClaims{
		Subject:   subject,
		Issuer:    m.issuer,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
	}}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.secret)
}

// Verify 校验签名与标准声明, 返回解析后的 Claims.
func (m *Manager) Verify(token string) (*Claims, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return m.secret, nil
	}, jwt.WithIssuer(m.issuer), jwt.WithValidMethods([]string{"HS256"}))
	if err != nil {
		return nil, err
	}
	return claims, nil
}

type ctxKey struct{}

// WithSubject 将主体写入 context.
func WithSubject(ctx context.Context, subject string) context.Context {
	return context.WithValue(ctx, ctxKey{}, subject)
}

// SubjectFrom 从 context 读取主体, 不存在返回空串.
func SubjectFrom(ctx context.Context) string {
	if v, ok := ctx.Value(ctxKey{}).(string); ok {
		return v
	}
	return ""
}

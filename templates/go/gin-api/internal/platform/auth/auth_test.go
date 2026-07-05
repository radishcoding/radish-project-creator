package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/radishcoding/go-template/internal/config"
	"github.com/stretchr/testify/require"
)

func mgr() *Manager {
	return NewManager(config.Auth{JWTSecret: "secret", Issuer: "test", TTL: time.Hour})
}

func TestIssueThenVerify(t *testing.T) {
	tok, err := mgr().Issue("user-1")
	require.NoError(t, err)
	claims, err := mgr().Verify(tok)
	require.NoError(t, err)
	require.Equal(t, "user-1", claims.Subject)
}

func TestVerifyRejectsTampered(t *testing.T) {
	_, err := mgr().Verify("not-a-token")
	require.Error(t, err)
}

func TestVerifyRejectsAlgNone(t *testing.T) {
	claims := Claims{RegisteredClaims: jwt.RegisteredClaims{
		Subject: "u1", Issuer: "test",
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
	}}
	tok, err := jwt.NewWithClaims(jwt.SigningMethodNone, claims).SignedString(jwt.UnsafeAllowNoneSignatureType)
	require.NoError(t, err)
	_, err = mgr().Verify(tok)
	require.Error(t, err)
}

func TestVerifyRejectsWrongIssuer(t *testing.T) {
	attacker := NewManager(config.Auth{JWTSecret: "secret", Issuer: "attacker", TTL: time.Hour})
	tok, err := attacker.Issue("u1")
	require.NoError(t, err)
	_, err = mgr().Verify(tok) // mgr() enforces issuer "test"
	require.Error(t, err)
}

func TestVerifyRejectsExpired(t *testing.T) {
	expired := NewManager(config.Auth{JWTSecret: "secret", Issuer: "test", TTL: -time.Hour})
	tok, err := expired.Issue("u1")
	require.NoError(t, err)
	_, err = mgr().Verify(tok)
	require.Error(t, err)
}

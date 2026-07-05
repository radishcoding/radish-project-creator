// Package apperror 定义框架无关的应用错误类型, 携带字符串错误码与 HTTP 状态映射.
package apperror

import (
	"errors"
	"fmt"
	"net/http"
)

type Code string

const (
	CodeInvalidArgument Code = "invalid_argument"
	CodeUnauthorized    Code = "unauthorized"
	CodeForbidden       Code = "forbidden"
	CodeNotFound        Code = "resource_not_found"
	CodeTooManyRequests Code = "too_many_requests"
	CodeInternal        Code = "internal_error"
	CodeUnavailable     Code = "service_unavailable"
)

// Error 是应用统一错误. Message 面向调用方可读; Err 保留底层原因供日志.
type Error struct {
	Code       Code
	HTTPStatus int
	Message    string
	Err        error
}

func (e *Error) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *Error) Unwrap() error { return e.Err }

func newf(code Code, status int, msg string) *Error {
	return &Error{Code: code, HTTPStatus: status, Message: msg}
}

func NewInvalidArgument(msg string) *Error {
	return newf(CodeInvalidArgument, http.StatusBadRequest, msg)
}
func NewUnauthorized(msg string) *Error {
	return newf(CodeUnauthorized, http.StatusUnauthorized, msg)
}
func NewForbidden(msg string) *Error {
	return newf(CodeForbidden, http.StatusForbidden, msg)
}
func NewNotFound(msg string) *Error {
	return newf(CodeNotFound, http.StatusNotFound, msg)
}
func NewTooManyRequests(msg string) *Error {
	return newf(CodeTooManyRequests, http.StatusTooManyRequests, msg)
}
func NewUnavailable(msg string) *Error {
	return newf(CodeUnavailable, http.StatusServiceUnavailable, msg)
}

// NewInternal 包装底层错误为 500, Message 对外统一为通用文案.
func NewInternal(err error) *Error {
	return &Error{Code: CodeInternal, HTTPStatus: http.StatusInternalServerError, Message: "internal server error", Err: err}
}

// From 将任意 error 归一化为 *Error: 已是 *Error 原样返回, 否则包装为内部错误.
func From(err error) *Error {
	if err == nil {
		return nil
	}
	var ae *Error
	if errors.As(err, &ae) {
		return ae
	}
	return NewInternal(err)
}

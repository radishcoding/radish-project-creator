// Package apperror 定义框架无关的应用错误类型, 携带字符串错误码与 HTTP 状态映射.
package apperror

import (
	"errors"
	"fmt"
	"net/http"
)

// Code 表示应用错误的字符串错误码.
type Code string

// 应用错误码常量.
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

// NewInvalidArgument 构造一个表示参数非法的 400 错误.
func NewInvalidArgument(msg string) *Error {
	return newf(CodeInvalidArgument, http.StatusBadRequest, msg)
}

// NewUnauthorized 构造一个表示未认证的 401 错误.
func NewUnauthorized(msg string) *Error {
	return newf(CodeUnauthorized, http.StatusUnauthorized, msg)
}

// NewForbidden 构造一个表示无权限的 403 错误.
func NewForbidden(msg string) *Error {
	return newf(CodeForbidden, http.StatusForbidden, msg)
}

// NewNotFound 构造一个表示资源不存在的 404 错误.
func NewNotFound(msg string) *Error {
	return newf(CodeNotFound, http.StatusNotFound, msg)
}

// NewTooManyRequests 构造一个表示请求过多的 429 错误.
func NewTooManyRequests(msg string) *Error {
	return newf(CodeTooManyRequests, http.StatusTooManyRequests, msg)
}

// NewUnavailable 构造一个表示服务不可用的 503 错误.
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

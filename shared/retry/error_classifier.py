"""
エラー分類器
API制限やその他の一時的なエラーを識別し、リトライ可能性を判定する
"""

import re
import logging
from typing import Dict, Any, Optional, Tuple
from enum import Enum
from dataclasses import dataclass


class ErrorType(Enum):
    """エラータイプ分類"""
    RATE_LIMIT = "rate_limit"           # API制限エラー
    QUOTA_EXCEEDED = "quota_exceeded"   # クォータ超過
    NETWORK_ERROR = "network_error"     # ネットワークエラー
    SERVICE_ERROR = "service_error"     # サービス一時停止
    TIMEOUT_ERROR = "timeout_error"     # タイムアウトエラー
    AUTH_ERROR = "auth_error"           # 認証エラー
    INVALID_REQUEST = "invalid_request" # 不正なリクエスト
    CONTENT_ERROR = "content_error"     # コンテンツエラー
    UNKNOWN_ERROR = "unknown_error"     # 不明なエラー


@dataclass
class FailureReason:
    """
    構造化された失敗理由
    """
    error_type: ErrorType              # エラータイプ
    provider: str                      # プロバイダー名
    original_message: str              # 元のエラーメッセージ
    is_retryable: bool                 # リトライ可能かどうか
    suggested_delay: int               # 推奨待機時間（秒）
    details: Dict[str, Any]            # 追加詳細情報
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        return {
            'error_type': self.error_type.value,
            'provider': self.provider,
            'original_message': self.original_message,
            'is_retryable': self.is_retryable,
            'suggested_delay': self.suggested_delay,
            'details': self.details
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'FailureReason':
        """辞書から復元"""
        return cls(
            error_type=ErrorType(data['error_type']),
            provider=data['provider'],
            original_message=data['original_message'],
            is_retryable=data['is_retryable'],
            suggested_delay=data['suggested_delay'],
            details=data['details']
        )


class ErrorClassifier:
    """
    エラー分類器
    各AIプロバイダーのエラーパターンを識別し、リトライ可能性を判定
    """
    
    def __init__(self):
        """初期化"""
        self.logger = logging.getLogger(__name__)
        
        # OpenAIエラーパターン
        self.openai_patterns = {
            ErrorType.RATE_LIMIT: [
                r"rate_limit_exceeded",
                r"rate limit exceeded",
                r"too many requests",
                r"429",
                r"requests per minute",
                r"requests per day"
            ],
            ErrorType.QUOTA_EXCEEDED: [
                r"quota exceeded",
                r"insufficient_quota",
                r"billing_not_active",
                r"usage limit exceeded",
                r"credit limit exceeded"
            ],
            ErrorType.NETWORK_ERROR: [
                r"connection error",
                r"network error",
                r"connection timeout",
                r"connection refused",
                r"dns resolution failed"
            ],
            ErrorType.SERVICE_ERROR: [
                r"service_unavailable",
                r"502 bad gateway",
                r"503 service unavailable",
                r"504 gateway timeout",
                r"internal server error",
                r"500"
            ],
            ErrorType.TIMEOUT_ERROR: [
                r"timeout",
                r"request timeout",
                r"read timeout",
                r"connection timeout"
            ],
            ErrorType.AUTH_ERROR: [
                r"invalid_api_key",
                r"unauthorized",
                r"401",
                r"403 forbidden",
                r"authentication failed"
            ],
            ErrorType.INVALID_REQUEST: [
                r"invalid_request_error",
                r"bad_request",
                r"400",
                r"malformed request",
                r"invalid parameter"
            ]
        }
        
        # Claudeエラーパターン
        self.claude_patterns = {
            ErrorType.RATE_LIMIT: [
                r"rate_limit_error",
                r"rate limit exceeded",
                r"too_many_requests",
                r"429",
                r"requests per minute exceeded"
            ],
            ErrorType.QUOTA_EXCEEDED: [
                r"credit_balance_too_low",
                r"usage_limit_exceeded",
                r"monthly limit exceeded",
                r"insufficient credits"
            ],
            ErrorType.NETWORK_ERROR: [
                r"connection_error",
                r"network_error",
                r"connection timeout",
                r"connection failed"
            ],
            ErrorType.SERVICE_ERROR: [
                r"overloaded_error",
                r"api_error",
                r"internal_server_error",
                r"service_unavailable",
                r"502",
                r"503"
            ],
            ErrorType.TIMEOUT_ERROR: [
                r"timeout_error",
                r"request_timeout",
                r"processing_timeout"
            ],
            ErrorType.AUTH_ERROR: [
                r"authentication_error",
                r"invalid_api_key",
                r"unauthorized",
                r"401",
                r"permission_error"
            ],
            ErrorType.INVALID_REQUEST: [
                r"invalid_request_error",
                r"validation_error",
                r"bad_request",
                r"400"
            ]
        }
        
        # Geminiエラーパターン
        self.gemini_patterns = {
            ErrorType.RATE_LIMIT: [
                r"RATE_LIMIT_EXCEEDED",
                r"quota exceeded",
                r"429",
                r"too many requests",
                r"requests per minute"
            ],
            ErrorType.QUOTA_EXCEEDED: [
                r"QUOTA_EXCEEDED",
                r"quota_exceeded",
                r"usage limit exceeded",
                r"daily limit exceeded"
            ],
            ErrorType.NETWORK_ERROR: [
                r"UNAVAILABLE",
                r"connection error",
                r"network error",
                r"connection timeout"
            ],
            ErrorType.SERVICE_ERROR: [
                r"INTERNAL",
                r"internal error",
                r"service unavailable",
                r"502",
                r"503"
            ],
            ErrorType.TIMEOUT_ERROR: [
                r"DEADLINE_EXCEEDED",
                r"timeout",
                r"request timeout"
            ],
            ErrorType.AUTH_ERROR: [
                r"UNAUTHENTICATED",
                r"PERMISSION_DENIED",
                r"invalid api key",
                r"401",
                r"403"
            ],
            ErrorType.INVALID_REQUEST: [
                r"INVALID_ARGUMENT",
                r"invalid request",
                r"bad request",
                r"400"
            ]
        }
        
        # リトライ可能なエラータイプ
        self.retryable_errors = {
            ErrorType.RATE_LIMIT,
            ErrorType.QUOTA_EXCEEDED,
            ErrorType.NETWORK_ERROR,
            ErrorType.SERVICE_ERROR,
            ErrorType.TIMEOUT_ERROR
        }
        
        # エラータイプ別推奨待機時間（秒）
        self.suggested_delays = {
            ErrorType.RATE_LIMIT: 300,      # 5分
            ErrorType.QUOTA_EXCEEDED: 1800, # 30分
            ErrorType.NETWORK_ERROR: 60,    # 1分
            ErrorType.SERVICE_ERROR: 300,   # 5分
            ErrorType.TIMEOUT_ERROR: 120,   # 2分
            ErrorType.AUTH_ERROR: 0,        # リトライ不可
            ErrorType.INVALID_REQUEST: 0,   # リトライ不可
            ErrorType.CONTENT_ERROR: 0,     # リトライ不可
            ErrorType.UNKNOWN_ERROR: 300    # 5分（安全側）
        }
    
    def classify_error(self, error: Exception, provider: str = "unknown") -> FailureReason:
        """
        エラーを分類し、構造化された失敗理由を返す
        
        Args:
            error: 発生したエラー
            provider: プロバイダー名 (openai, claude, gemini等)
            
        Returns:
            FailureReason: 構造化された失敗理由
        """
        error_message = str(error).lower()
        provider_lower = provider.lower()
        
        # プロバイダー別パターンマッチング
        error_type = self._match_error_patterns(error_message, provider_lower)
        
        # リトライ可能性を判定
        is_retryable = error_type in self.retryable_errors
        
        # 推奨待機時間を取得
        suggested_delay = self.suggested_delays.get(error_type, 300)
        
        # 詳細情報を抽出
        details = self._extract_error_details(error, error_message, provider_lower)
        
        failure_reason = FailureReason(
            error_type=error_type,
            provider=provider,
            original_message=str(error),
            is_retryable=is_retryable,
            suggested_delay=suggested_delay,
            details=details
        )
        
        self.logger.debug(f"エラー分類完了: {provider} - {error_type.value} (リトライ可能: {is_retryable})")
        
        return failure_reason
    
    def is_retryable_error(self, error: Exception, provider: str = "unknown") -> bool:
        """
        エラーがリトライ可能かどうかを判定
        
        Args:
            error: 発生したエラー
            provider: プロバイダー名
            
        Returns:
            bool: リトライ可能な場合True
        """
        failure_reason = self.classify_error(error, provider)
        return failure_reason.is_retryable
    
    def get_failure_reason_string(self, error: Exception, provider: str = "unknown") -> str:
        """
        失敗理由を文字列として取得
        
        Args:
            error: 発生したエラー
            provider: プロバイダー名
            
        Returns:
            str: 失敗理由の文字列
        """
        failure_reason = self.classify_error(error, provider)
        
        reason_parts = [
            f"プロバイダー: {failure_reason.provider}",
            f"エラータイプ: {failure_reason.error_type.value}",
            f"リトライ可能: {'はい' if failure_reason.is_retryable else 'いいえ'}"
        ]
        
        if failure_reason.is_retryable:
            reason_parts.append(f"推奨待機時間: {failure_reason.suggested_delay}秒")
        
        if failure_reason.details:
            for key, value in failure_reason.details.items():
                reason_parts.append(f"{key}: {value}")
        
        return " | ".join(reason_parts)
    
    def _match_error_patterns(self, error_message: str, provider: str) -> ErrorType:
        """
        エラーメッセージをパターンマッチングして分類
        
        Args:
            error_message: エラーメッセージ（小文字）
            provider: プロバイダー名（小文字）
            
        Returns:
            ErrorType: 分類されたエラータイプ
        """
        # プロバイダー別パターンを選択
        if "openai" in provider or "gpt" in provider:
            patterns = self.openai_patterns
        elif "claude" in provider or "anthropic" in provider:
            patterns = self.claude_patterns
        elif "gemini" in provider or "google" in provider:
            patterns = self.gemini_patterns
        else:
            # 汎用パターン（全プロバイダーの共通パターン）
            patterns = self._get_generic_patterns()
        
        # パターンマッチング
        for error_type, pattern_list in patterns.items():
            for pattern in pattern_list:
                if re.search(pattern, error_message, re.IGNORECASE):
                    return error_type
        
        # マッチしない場合は不明なエラー
        return ErrorType.UNKNOWN_ERROR
    
    def _get_generic_patterns(self) -> Dict[ErrorType, list]:
        """
        汎用エラーパターンを取得
        
        Returns:
            Dict[ErrorType, list]: 汎用パターン辞書
        """
        return {
            ErrorType.RATE_LIMIT: [
                r"rate.?limit",
                r"too.?many.?requests",
                r"429",
                r"throttle"
            ],
            ErrorType.QUOTA_EXCEEDED: [
                r"quota",
                r"limit.?exceeded",
                r"usage.?limit",
                r"credit"
            ],
            ErrorType.NETWORK_ERROR: [
                r"connection",
                r"network",
                r"dns",
                r"socket"
            ],
            ErrorType.SERVICE_ERROR: [
                r"50[0-9]",
                r"service.?unavailable",
                r"internal.?server",
                r"bad.?gateway"
            ],
            ErrorType.TIMEOUT_ERROR: [
                r"timeout",
                r"deadline"
            ],
            ErrorType.AUTH_ERROR: [
                r"40[13]",
                r"unauthorized",
                r"forbidden",
                r"authentication",
                r"api.?key"
            ],
            ErrorType.INVALID_REQUEST: [
                r"400",
                r"bad.?request",
                r"invalid",
                r"malformed"
            ]
        }
    
    def _extract_error_details(self, error: Exception, error_message: str, provider: str) -> Dict[str, Any]:
        """
        エラーから詳細情報を抽出
        
        Args:
            error: 元のエラーオブジェクト
            error_message: エラーメッセージ（小文字）
            provider: プロバイダー名（小文字）
            
        Returns:
            Dict[str, Any]: 抽出された詳細情報
        """
        details = {
            'error_class': error.__class__.__name__,
            'timestamp': self._get_current_timestamp()
        }
        
        # HTTPステータスコードを抽出
        status_code = self._extract_status_code(error_message)
        if status_code:
            details['status_code'] = status_code
        
        # レート制限情報を抽出
        rate_limit_info = self._extract_rate_limit_info(error_message)
        if rate_limit_info:
            details.update(rate_limit_info)
        
        # プロバイダー固有の詳細を抽出
        provider_details = self._extract_provider_specific_details(error, provider)
        if provider_details:
            details.update(provider_details)
        
        return details
    
    def _extract_status_code(self, error_message: str) -> Optional[int]:
        """HTTPステータスコードを抽出"""
        # 3桁の数字パターンを検索
        match = re.search(r'\b([4-5]\d{2})\b', error_message)
        if match:
            return int(match.group(1))
        return None
    
    def _extract_rate_limit_info(self, error_message: str) -> Dict[str, Any]:
        """レート制限情報を抽出"""
        info = {}
        
        # リクエスト数制限
        requests_match = re.search(r'(\d+)\s*requests?\s*per\s*(minute|hour|day)', error_message)
        if requests_match:
            info['limit_requests'] = int(requests_match.group(1))
            info['limit_period'] = requests_match.group(2)
        
        # 残り時間
        retry_after_match = re.search(r'retry.?after[:\s]*(\d+)', error_message)
        if retry_after_match:
            info['retry_after'] = int(retry_after_match.group(1))
        
        return info
    
    def _extract_provider_specific_details(self, error: Exception, provider: str) -> Dict[str, Any]:
        """プロバイダー固有の詳細情報を抽出"""
        details = {}
        
        # OpenAI固有
        if "openai" in provider:
            if hasattr(error, 'response'):
                response = error.response
                if hasattr(response, 'status_code'):
                    details['openai_status'] = response.status_code
                if hasattr(response, 'headers'):
                    headers = response.headers
                    if 'x-ratelimit-remaining-requests' in headers:
                        details['remaining_requests'] = headers['x-ratelimit-remaining-requests']
                    if 'x-ratelimit-reset-requests' in headers:
                        details['reset_requests'] = headers['x-ratelimit-reset-requests']
        
        # Claude固有
        elif "claude" in provider or "anthropic" in provider:
            if hasattr(error, 'status_code'):
                details['claude_status'] = error.status_code
            if hasattr(error, 'error_type'):
                details['claude_error_type'] = error.error_type
        
        # Gemini固有
        elif "gemini" in provider:
            if hasattr(error, 'code'):
                details['gemini_code'] = error.code
            if hasattr(error, 'details'):
                details['gemini_details'] = str(error.details)
        
        return details
    
    def _get_current_timestamp(self) -> str:
        """現在のタイムスタンプを取得"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def get_error_statistics(self, failure_reasons: list) -> Dict[str, Any]:
        """
        失敗理由の統計情報を取得
        
        Args:
            failure_reasons: FailureReasonオブジェクトのリスト
            
        Returns:
            Dict[str, Any]: 統計情報
        """
        if not failure_reasons:
            return {}
        
        # エラータイプ別集計
        error_type_counts = {}
        provider_counts = {}
        retryable_count = 0
        
        for reason in failure_reasons:
            # エラータイプ集計
            error_type = reason.error_type.value
            error_type_counts[error_type] = error_type_counts.get(error_type, 0) + 1
            
            # プロバイダー集計
            provider = reason.provider
            provider_counts[provider] = provider_counts.get(provider, 0) + 1
            
            # リトライ可能数集計
            if reason.is_retryable:
                retryable_count += 1
        
        return {
            'total_errors': len(failure_reasons),
            'retryable_errors': retryable_count,
            'non_retryable_errors': len(failure_reasons) - retryable_count,
            'retry_rate': retryable_count / len(failure_reasons),
            'error_types': error_type_counts,
            'providers': provider_counts,
            'most_common_error': max(error_type_counts.items(), key=lambda x: x[1])[0] if error_type_counts else None,
            'most_problematic_provider': max(provider_counts.items(), key=lambda x: x[1])[0] if provider_counts else None
        }
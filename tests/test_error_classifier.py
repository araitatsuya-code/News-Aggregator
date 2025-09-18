"""
ErrorClassifierのテストケース
各種APIエラーレスポンスのテストデータを使用してエラー分類ロジックをテスト
"""

import pytest
from unittest.mock import Mock
from datetime import datetime

from shared.retry.error_classifier import ErrorClassifier, ErrorType, FailureReason


class TestErrorClassifier:
    """ErrorClassifierのテストクラス"""
    
    def setup_method(self):
        """各テストメソッドの前に実行される初期化"""
        self.classifier = ErrorClassifier()
    
    def test_openai_rate_limit_error(self):
        """OpenAIレート制限エラーの分類テスト"""
        # テストデータ: OpenAI rate limit error
        error = Exception("Rate limit exceeded. Please try again in 60 seconds.")
        
        result = self.classifier.classify_error(error, "openai")
        
        assert result.error_type == ErrorType.RATE_LIMIT
        assert result.provider == "openai"
        assert result.is_retryable is True
        assert result.suggested_delay == 300  # 5分
        assert "rate limit exceeded" in result.original_message.lower()
    
    def test_openai_quota_exceeded_error(self):
        """OpenAIクォータ超過エラーの分類テスト"""
        error = Exception("You exceeded your current quota, please check your plan and billing details.")
        
        result = self.classifier.classify_error(error, "openai")
        
        assert result.error_type == ErrorType.QUOTA_EXCEEDED
        assert result.provider == "openai"
        assert result.is_retryable is True
        assert result.suggested_delay == 1800  # 30分
    
    def test_openai_429_error(self):
        """OpenAI 429エラーの分類テスト"""
        error = Exception("429 Too Many Requests")
        
        result = self.classifier.classify_error(error, "openai")
        
        assert result.error_type == ErrorType.RATE_LIMIT
        assert result.is_retryable is True
        assert result.details['status_code'] == 429
    
    def test_claude_rate_limit_error(self):
        """Claudeレート制限エラーの分類テスト"""
        error = Exception("rate_limit_error: Number of requests per minute exceeded")
        
        result = self.classifier.classify_error(error, "claude")
        
        assert result.error_type == ErrorType.RATE_LIMIT
        assert result.provider == "claude"
        assert result.is_retryable is True
        assert result.suggested_delay == 300
    
    def test_claude_credit_balance_error(self):
        """Claudeクレジット不足エラーの分類テスト"""
        error = Exception("credit_balance_too_low: Your credit balance is too low to access the Anthropic API")
        
        result = self.classifier.classify_error(error, "claude")
        
        assert result.error_type == ErrorType.QUOTA_EXCEEDED
        assert result.is_retryable is True
        assert result.suggested_delay == 1800
    
    def test_claude_overloaded_error(self):
        """Claudeサーバー過負荷エラーの分類テスト"""
        error = Exception("overloaded_error: Anthropic's API is temporarily overloaded")
        
        result = self.classifier.classify_error(error, "claude")
        
        assert result.error_type == ErrorType.SERVICE_ERROR
        assert result.is_retryable is True
        assert result.suggested_delay == 300
    
    def test_gemini_rate_limit_error(self):
        """Geminiレート制限エラーの分類テスト"""
        error = Exception("RATE_LIMIT_EXCEEDED: Quota exceeded for requests per minute")
        
        result = self.classifier.classify_error(error, "gemini")
        
        assert result.error_type == ErrorType.RATE_LIMIT
        assert result.provider == "gemini"
        assert result.is_retryable is True
    
    def test_gemini_quota_exceeded_error(self):
        """Geminiクォータ超過エラーの分類テスト"""
        error = Exception("QUOTA_EXCEEDED: Daily limit exceeded")
        
        result = self.classifier.classify_error(error, "gemini")
        
        assert result.error_type == ErrorType.QUOTA_EXCEEDED
        assert result.is_retryable is True
    
    def test_network_error(self):
        """ネットワークエラーの分類テスト"""
        error = Exception("Connection error: Failed to establish connection")
        
        result = self.classifier.classify_error(error, "openai")
        
        assert result.error_type == ErrorType.NETWORK_ERROR
        assert result.is_retryable is True
        assert result.suggested_delay == 60
    
    def test_timeout_error(self):
        """タイムアウトエラーの分類テスト"""
        error = Exception("Request timeout after 30 seconds")
        
        result = self.classifier.classify_error(error, "claude")
        
        assert result.error_type == ErrorType.TIMEOUT_ERROR
        assert result.is_retryable is True
        assert result.suggested_delay == 120
    
    def test_auth_error_not_retryable(self):
        """認証エラー（リトライ不可）の分類テスト"""
        error = Exception("401 Unauthorized: Invalid API key")
        
        result = self.classifier.classify_error(error, "openai")
        
        assert result.error_type == ErrorType.AUTH_ERROR
        assert result.is_retryable is False
        assert result.suggested_delay == 0
        assert result.details['status_code'] == 401
    
    def test_invalid_request_not_retryable(self):
        """不正なリクエスト（リトライ不可）の分類テスト"""
        error = Exception("400 Bad Request: Invalid parameter 'model'")
        
        result = self.classifier.classify_error(error, "openai")
        
        assert result.error_type == ErrorType.INVALID_REQUEST
        assert result.is_retryable is False
        assert result.suggested_delay == 0
        assert result.details['status_code'] == 400
    
    def test_unknown_error(self):
        """不明なエラーの分類テスト"""
        error = Exception("Something went wrong with the AI processing")
        
        result = self.classifier.classify_error(error, "unknown_provider")
        
        assert result.error_type == ErrorType.UNKNOWN_ERROR
        assert result.is_retryable is False  # 不明なエラーはリトライ不可
        assert result.suggested_delay == 300
    
    def test_is_retryable_error_method(self):
        """is_retryable_errorメソッドのテスト"""
        # リトライ可能なエラー
        rate_limit_error = Exception("Rate limit exceeded")
        assert self.classifier.is_retryable_error(rate_limit_error, "openai") is True
        
        # リトライ不可なエラー
        auth_error = Exception("401 Unauthorized")
        assert self.classifier.is_retryable_error(auth_error, "openai") is False
    
    def test_get_failure_reason_string(self):
        """get_failure_reason_stringメソッドのテスト"""
        error = Exception("Rate limit exceeded")
        
        reason_string = self.classifier.get_failure_reason_string(error, "openai")
        
        assert "プロバイダー: openai" in reason_string
        assert "エラータイプ: rate_limit" in reason_string
        assert "リトライ可能: はい" in reason_string
        assert "推奨待機時間: 300秒" in reason_string
    
    def test_extract_status_code(self):
        """HTTPステータスコード抽出のテスト"""
        error_message = "HTTP 429 Too Many Requests"
        status_code = self.classifier._extract_status_code(error_message.lower())
        
        assert status_code == 429
    
    def test_extract_rate_limit_info(self):
        """レート制限情報抽出のテスト"""
        error_message = "Rate limit exceeded: 100 requests per minute"
        info = self.classifier._extract_rate_limit_info(error_message.lower())
        
        assert info['limit_requests'] == 100
        assert info['limit_period'] == 'minute'
    
    def test_failure_reason_serialization(self):
        """FailureReasonのシリアライゼーションテスト"""
        error = Exception("Rate limit exceeded")
        failure_reason = self.classifier.classify_error(error, "openai")
        
        # 辞書に変換
        data = failure_reason.to_dict()
        
        assert data['error_type'] == 'rate_limit'
        assert data['provider'] == 'openai'
        assert data['is_retryable'] is True
        
        # 辞書から復元
        restored = FailureReason.from_dict(data)
        
        assert restored.error_type == ErrorType.RATE_LIMIT
        assert restored.provider == "openai"
        assert restored.is_retryable is True
    
    def test_generic_patterns_for_unknown_provider(self):
        """不明なプロバイダーでの汎用パターンテスト"""
        # 汎用レート制限パターン
        error = Exception("Too many requests, please try again later")
        result = self.classifier.classify_error(error, "unknown_provider")
        
        assert result.error_type == ErrorType.RATE_LIMIT
        assert result.is_retryable is True
    
    def test_multiple_error_patterns_in_message(self):
        """複数のエラーパターンが含まれるメッセージのテスト"""
        # レート制限とクォータの両方が含まれる場合、最初にマッチしたものが優先される
        error = Exception("Rate limit exceeded due to quota usage")
        result = self.classifier.classify_error(error, "openai")
        
        # rate_limitパターンが先にマッチするはず
        assert result.error_type == ErrorType.RATE_LIMIT
    
    def test_case_insensitive_matching(self):
        """大文字小文字を区別しないマッチングのテスト"""
        error = Exception("RATE LIMIT EXCEEDED")
        result = self.classifier.classify_error(error, "openai")
        
        assert result.error_type == ErrorType.RATE_LIMIT
        assert result.is_retryable is True
    
    def test_error_statistics(self):
        """エラー統計情報のテスト"""
        # 複数の失敗理由を作成
        errors = [
            Exception("Rate limit exceeded"),
            Exception("401 Unauthorized"),
            Exception("Rate limit exceeded"),
            Exception("Quota exceeded")
        ]
        
        failure_reasons = []
        for error in errors:
            failure_reasons.append(self.classifier.classify_error(error, "openai"))
        
        stats = self.classifier.get_error_statistics(failure_reasons)
        
        assert stats['total_errors'] == 4
        assert stats['retryable_errors'] == 3  # rate_limit x2 + quota_exceeded x1
        assert stats['non_retryable_errors'] == 1  # auth_error x1
        assert stats['retry_rate'] == 0.75
        assert stats['most_common_error'] == 'rate_limit'
        assert stats['most_problematic_provider'] == 'openai'
    
    def test_provider_specific_details_extraction(self):
        """プロバイダー固有詳細情報抽出のテスト"""
        # OpenAI固有のエラーオブジェクトをモック
        mock_error = Mock()
        mock_error.__str__ = lambda: "Rate limit exceeded"
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.headers = {
            'x-ratelimit-remaining-requests': '0',
            'x-ratelimit-reset-requests': '60s'
        }
        mock_error.response = mock_response
        
        result = self.classifier.classify_error(mock_error, "openai")
        
        assert result.details['openai_status'] == 429
        assert result.details['remaining_requests'] == '0'
        assert result.details['reset_requests'] == '60s'
    
    def test_empty_error_statistics(self):
        """空のエラー統計のテスト"""
        stats = self.classifier.get_error_statistics([])
        assert stats == {}
    
    def test_service_error_503(self):
        """503サービス利用不可エラーのテスト"""
        error = Exception("503 Service Unavailable")
        result = self.classifier.classify_error(error, "claude")
        
        assert result.error_type == ErrorType.SERVICE_ERROR
        assert result.is_retryable is True
        assert result.details['status_code'] == 503


class TestErrorClassifierIntegration:
    """ErrorClassifierの統合テスト"""
    
    def setup_method(self):
        """初期化"""
        self.classifier = ErrorClassifier()
    
    def test_real_world_openai_errors(self):
        """実際のOpenAIエラーメッセージのテスト"""
        real_errors = [
            "openai.RateLimitError: Error code: 429 - {'error': {'message': 'Rate limit reached for gpt-4 in organization org-xxx on requests per min (RPM): Limit 500, Used 500, Requested 1. Please try again in 120ms.', 'type': 'requests', 'param': None, 'code': 'rate_limit_exceeded'}}",
            "openai.APIError: Error code: 503 - {'error': {'message': 'The server is temporarily overloaded. Please try again later.', 'type': 'server_error', 'param': None, 'code': None}}",
            "openai.AuthenticationError: Error code: 401 - {'error': {'message': 'Incorrect API key provided', 'type': 'invalid_request_error', 'param': None, 'code': 'invalid_api_key'}}"
        ]
        
        expected_types = [
            ErrorType.RATE_LIMIT,
            ErrorType.SERVICE_ERROR,
            ErrorType.AUTH_ERROR
        ]
        
        expected_retryable = [True, True, False]
        
        for i, error_msg in enumerate(real_errors):
            error = Exception(error_msg)
            result = self.classifier.classify_error(error, "openai")
            
            assert result.error_type == expected_types[i], f"Error {i}: Expected {expected_types[i]}, got {result.error_type}"
            assert result.is_retryable == expected_retryable[i], f"Error {i}: Expected retryable={expected_retryable[i]}, got {result.is_retryable}"
    
    def test_real_world_claude_errors(self):
        """実際のClaudeエラーメッセージのテスト"""
        real_errors = [
            "anthropic.RateLimitError: Error code: 429 - {'type': 'error', 'error': {'type': 'rate_limit_error', 'message': 'Number of requests per minute exceeded'}}",
            "anthropic.APIError: Error code: 529 - {'type': 'error', 'error': {'type': 'overloaded_error', 'message': 'Anthropic\\'s API is temporarily overloaded'}}",
            "anthropic.AuthenticationError: Error code: 401 - {'type': 'error', 'error': {'type': 'authentication_error', 'message': 'invalid x-api-key'}}"
        ]
        
        expected_types = [
            ErrorType.RATE_LIMIT,
            ErrorType.SERVICE_ERROR,
            ErrorType.AUTH_ERROR
        ]
        
        for i, error_msg in enumerate(real_errors):
            error = Exception(error_msg)
            result = self.classifier.classify_error(error, "claude")
            
            assert result.error_type == expected_types[i]
    
    def test_batch_error_classification(self):
        """バッチエラー分類のテスト"""
        errors_and_providers = [
            (Exception("Rate limit exceeded"), "openai"),
            (Exception("QUOTA_EXCEEDED"), "gemini"),
            (Exception("Connection timeout"), "claude"),
            (Exception("401 Unauthorized"), "openai"),
            (Exception("Invalid request"), "gemini")
        ]
        
        results = []
        for error, provider in errors_and_providers:
            result = self.classifier.classify_error(error, provider)
            results.append(result)
        
        # 統計を確認
        stats = self.classifier.get_error_statistics(results)
        
        assert stats['total_errors'] == 5
        assert stats['retryable_errors'] == 3  # rate_limit, quota_exceeded, network_error
        assert stats['non_retryable_errors'] == 2  # auth_error, invalid_request
        
        # プロバイダー別集計を確認
        assert stats['providers']['openai'] == 2
        assert stats['providers']['gemini'] == 2
        assert stats['providers']['claude'] == 1


if __name__ == "__main__":
    pytest.main([__file__])
"""
カスタム例外クラス
AI News Aggregator で使用する例外を定義
"""


class AINewsAggregatorError(Exception):
    """基底例外クラス"""
    pass


class RSSCollectionError(AINewsAggregatorError):
    """RSS収集エラー"""
    
    def __init__(self, source: str, reason: str):
        self.source = source
        self.reason = reason
        super().__init__(f"RSS collection failed for {source}: {reason}")


class AIProcessingError(AINewsAggregatorError):
    """AI処理エラー"""
    
    def __init__(self, message: str, article_id: str = None):
        self.article_id = article_id
        if article_id:
            message = f"AI processing failed for article {article_id}: {message}"
        super().__init__(message)


class DataSaveError(AINewsAggregatorError):
    """データ保存エラー"""
    
    def __init__(self, path: str, reason: str):
        self.path = path
        self.reason = reason
        super().__init__(f"Failed to save data to {path}: {reason}")


class ConfigurationError(AINewsAggregatorError):
    """設定エラー"""
    pass


class ValidationError(AINewsAggregatorError):
    """データ検証エラー"""
    pass
"""
カスタム例外クラス定義
AI News Aggregator システムで使用される例外を定義
"""


class RSSCollectionError(Exception):
    """RSS収集時のエラー"""
    def __init__(self, source: str, reason: str):
        self.source = source
        self.reason = reason
        super().__init__(f"RSS収集エラー - ソース: {source}, 理由: {reason}")


class AIProcessingError(Exception):
    """AI処理時のエラー"""
    def __init__(self, message: str, article_id: str = None):
        self.article_id = article_id
        super().__init__(f"AI処理エラー: {message}" + (f" (記事ID: {article_id})" if article_id else ""))


class DataProcessingError(Exception):
    """データ処理時のエラー"""
    pass


class ConfigurationError(Exception):
    """設定エラー"""
    pass
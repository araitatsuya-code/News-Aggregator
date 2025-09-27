#!/usr/bin/env python3
"""
ClaudeSummarizer の動作テストスクリプト
実際のClaude APIを使用してテストを行う（API キーが設定されている場合のみ）
"""

import asyncio
import os
import sys
from datetime import datetime

# プロジェクトルートをパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.ai import ClaudeSummarizer
from shared.types import RawNewsItem, RSSSource
from shared.config import AppConfig
from shared.utils.logger import setup_logger


async def test_summarizer():
    """ClaudeSummarizerのテスト実行"""
    logger = setup_logger("test_summarizer")
    
    try:
        # 設定読み込み
        config = AppConfig.from_env()
        logger.info("設定読み込み完了")
        
        # Summarizer初期化
        summarizer = ClaudeSummarizer(config)
        logger.info("ClaudeSummarizer初期化完了")
        
        # テスト用記事データ作成
        test_source = RSSSource(
            url="https://example.com/rss",
            category="テスト",
            language="en",
            name="Test Source"
        )
        
        test_articles = [
            RawNewsItem(
                title="OpenAI Releases New GPT Model with Enhanced Capabilities",
                url="https://example.com/article1",
                published_at=datetime.now(),
                source=test_source,
                content="OpenAI has announced a new version of their GPT model with improved reasoning capabilities and better performance on complex tasks."
            ),
            RawNewsItem(
                title="Google's AI Research Breakthrough in Quantum Computing",
                url="https://example.com/article2",
                published_at=datetime.now(),
                source=test_source,
                content="Google researchers have achieved a significant breakthrough in quantum computing using AI-assisted optimization algorithms."
            )
        ]
        
        # 記事IDを設定
        for i, article in enumerate(test_articles):
            article.id = f"test_article_{i}"
        
        logger.info(f"テスト記事数: {len(test_articles)}")
        
        # バッチ処理テスト
        logger.info("バッチ処理開始...")
        processed_articles = await summarizer.batch_process(test_articles)
        
        logger.info(f"処理完了: {len(processed_articles)}/{len(test_articles)} 記事")
        
        # 結果表示
        for article in processed_articles:
            print(f"\n--- 処理結果 ---")
            print(f"ID: {article.id}")
            print(f"元タイトル: {article.original_title}")
            print(f"翻訳タイトル: {article.title}")
            print(f"要約: {article.summary}")
            print(f"タグ: {', '.join(article.tags)}")
            print(f"信頼度: {article.ai_confidence}")
        
        # 日次トレンド分析テスト
        if processed_articles:
            logger.info("日次トレンド分析開始...")
            daily_summary = await summarizer.analyze_daily_trends(processed_articles)
            
            print(f"\n--- 日次サマリー ---")
            print(f"日付: {daily_summary.date}")
            print(f"記事数: {daily_summary.total_articles}")
            print(f"トレンド: {', '.join(daily_summary.top_trends)}")
            print(f"日本語サマリー: {daily_summary.summary_ja}")
            print(f"英語サマリー: {daily_summary.summary_en}")
        
        logger.info("テスト完了")
        
    except ValueError as e:
        if "CLAUDE_API_KEY" in str(e):
            logger.warning("CLAUDE_API_KEY が設定されていません。実際のAPIテストをスキップします。")
            print("環境変数 CLAUDE_API_KEY を設定してから実行してください。")
        else:
            logger.error(f"設定エラー: {e}")
    except Exception as e:
        logger.error(f"テスト実行エラー: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(test_summarizer())
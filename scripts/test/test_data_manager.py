#!/usr/bin/env python3
"""
DataManagerの動作テストスクリプト
実際のデータを使用してDataManagerの機能をテスト
"""

import sys
import os
from datetime import datetime
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.append(str(Path(__file__).parent.parent))

from shared.data.data_manager import DataManager
from shared.types import NewsItem, DailySummary, ProcessingMetrics
from shared.utils.logger import setup_logger


def create_sample_data():
    """サンプルデータを作成"""
    # サンプルニュース記事
    articles = [
        NewsItem(
            id="demo-1",
            title="ChatGPTの新機能が発表",
            original_title="New ChatGPT Features Announced",
            summary="OpenAIがChatGPTの新機能を発表しました。音声認識機能とリアルタイム翻訳機能が追加され、より使いやすくなりました。",
            url="https://example.com/chatgpt-news",
            source="TechCrunch AI",
            category="海外",
            published_at=datetime(2024, 8, 31, 10, 0, 0),
            language="ja",
            tags=["ChatGPT", "OpenAI", "AI"],
            ai_confidence=0.95
        ),
        NewsItem(
            id="demo-2",
            title="日本のAI企業が新技術を開発",
            original_title="Japanese AI Company Develops New Technology",
            summary="日本のスタートアップ企業が画像認識技術の新しいアルゴリズムを開発しました。従来比で精度が30%向上しています。",
            url="https://example.com/japan-ai-news",
            source="日経AI",
            category="国内",
            published_at=datetime(2024, 8, 31, 11, 30, 0),
            language="ja",
            tags=["画像認識", "日本", "スタートアップ"],
            ai_confidence=0.88
        ),
        NewsItem(
            id="demo-3",
            title="機械学習の最新研究動向",
            original_title="Latest Machine Learning Research Trends",
            summary="Reddit上で議論されている機械学習の最新研究動向をまとめました。特に強化学習とトランスフォーマーモデルに注目が集まっています。",
            url="https://reddit.com/r/MachineLearning/post123",
            source="Reddit ML",
            category="Reddit",
            published_at=datetime(2024, 8, 31, 9, 15, 0),
            language="ja",
            tags=["機械学習", "研究", "強化学習"],
            ai_confidence=0.82
        )
    ]
    
    # サンプル日次サマリー
    summary = DailySummary(
        date="2024-08-31",
        total_articles=3,
        top_trends=["ChatGPT", "画像認識", "機械学習"],
        significant_news=articles[:2],  # 重要ニュース2件
        category_breakdown={"海外": 1, "国内": 1, "Reddit": 1},
        summary_ja="本日はChatGPTの新機能発表と日本企業の画像認識技術開発が注目されました。AI技術の進歩が加速しています。",
        summary_en="Today's highlights include new ChatGPT features and Japanese company's image recognition breakthrough. AI technology advancement is accelerating.",
        generated_at=datetime(2024, 8, 31, 12, 0, 0)
    )
    
    # サンプル処理メトリクス
    metrics = ProcessingMetrics(
        start_time=datetime(2024, 8, 31, 8, 0, 0),
        end_time=datetime(2024, 8, 31, 8, 30, 0),
        articles_collected=5,
        articles_processed=3,
        articles_failed=2,
        api_calls_made=3,
        errors=["RSS feed timeout", "API rate limit"]
    )
    
    return articles, summary, metrics


def main():
    """メイン処理"""
    logger = setup_logger("data_manager_test")
    logger.info("DataManager動作テストを開始します")
    
    try:
        # DataManagerを初期化
        data_manager = DataManager()
        logger.info("DataManagerを初期化しました")
        
        # サンプルデータを作成
        articles, summary, metrics = create_sample_data()
        logger.info(f"サンプルデータを作成しました: 記事{len(articles)}件")
        
        # 日別ニュースデータを保存
        date = "2024-08-31"
        data_manager.save_daily_news(date, articles)
        logger.info(f"{date}の日別ニュースデータを保存しました")
        
        # 日次サマリーを保存
        data_manager.save_daily_summary(summary)
        logger.info(f"{date}の日次サマリーを保存しました")
        
        # 設定ファイルを保存
        data_manager.save_config_files()
        logger.info("設定ファイルを保存しました")
        
        # 処理メトリクスを保存
        data_manager.save_processing_metrics(metrics)
        logger.info("処理メトリクスを保存しました")
        
        # 既存データの読み込みテスト
        loaded_articles = data_manager.load_existing_data(date)
        if loaded_articles:
            logger.info(f"既存データを読み込みました: {len(loaded_articles)}件")
            for article in loaded_articles:
                logger.info(f"  - {article.title} ({article.source})")
        
        # 出力ファイルの確認
        output_path = Path("frontend/public/data")
        logger.info(f"出力ファイルの確認:")
        
        # ニュースファイル
        news_files = list((output_path / "news").rglob("*.json"))
        logger.info(f"  ニュースファイル: {len(news_files)}件")
        for file in news_files:
            logger.info(f"    - {file.relative_to(output_path)}")
        
        # サマリーファイル
        summary_files = list((output_path / "summaries").glob("*.json"))
        logger.info(f"  サマリーファイル: {len(summary_files)}件")
        for file in summary_files:
            logger.info(f"    - {file.relative_to(output_path)}")
        
        # 設定ファイル
        config_files = list((output_path / "config").glob("*.json"))
        logger.info(f"  設定ファイル: {len(config_files)}件")
        for file in config_files:
            logger.info(f"    - {file.relative_to(output_path)}")
        
        # メトリクスファイル
        metrics_files = list((output_path / "metrics").glob("*.json"))
        logger.info(f"  メトリクスファイル: {len(metrics_files)}件")
        for file in metrics_files:
            logger.info(f"    - {file.relative_to(output_path)}")
        
        logger.info("DataManager動作テストが正常に完了しました")
        
    except Exception as e:
        logger.error(f"テスト中にエラーが発生しました: {e}")
        raise


if __name__ == "__main__":
    main()
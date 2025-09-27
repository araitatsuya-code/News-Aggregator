#!/usr/bin/env python3
"""
リアルAPIを使用した完全パイプラインテスト
実際のRSS収集とClaude APIを使用してシステム全体をテスト
"""

import sys
import asyncio
import os
from datetime import datetime
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.append(str(Path(__file__).parent.parent))

# .envファイルを読み込み
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print("✅ .envファイルを読み込みました")
    else:
        print("⚠️ .envファイルが見つかりません")
except ImportError:
    print("⚠️ python-dotenvがインストールされていません")

from shared.collectors.rss_collector import RSSCollector
from shared.ai.claude_summarizer import ClaudeSummarizer
from shared.data.data_manager import DataManager
from shared.config import get_default_rss_sources, AppConfig
from shared.utils.logger import setup_logger
from shared.types import ProcessingMetrics


async def test_real_api():
    """リアルAPIを使用したテスト"""
    logger = setup_logger("real_api_test")
    logger.info("🚀 リアルAPIテストを開始します")
    
    start_time = datetime.now()
    errors = []
    
    try:
        # 環境変数の確認
        if not os.getenv('CLAUDE_API_KEY'):
            logger.error("❌ CLAUDE_API_KEY環境変数が設定されていません")
            logger.info("💡 以下のコマンドでAPIキーを設定してください:")
            logger.info("   export CLAUDE_API_KEY='your-api-key-here'")
            return
        
        # 設定を読み込み
        config = AppConfig.from_env()
        logger.info("✅ 設定を読み込みました")
        
        # コンポーネントを初期化
        rss_sources = get_default_rss_sources()[:2]  # 最初の2つのソースのみ使用
        collector = RSSCollector(rss_sources)
        logger.info(f"✅ RSS収集器を初期化: {len(rss_sources)}ソース")
        
        # テスト用に小さなバッチサイズを設定
        test_config = AppConfig(
            claude_api_key=config.claude_api_key,
            claude_model=config.claude_model,
            claude_max_tokens=config.claude_max_tokens,
            claude_batch_size=3,  # 小さなバッチサイズでテスト
            output_path=config.output_path,
            retention_days=config.retention_days,
            log_level=config.log_level,
            log_dir=config.log_dir,
            max_retries=config.max_retries,
            retry_delay=config.retry_delay
        )
        
        summarizer = ClaudeSummarizer(test_config)
        logger.info("✅ AI要約器を初期化")
        
        data_manager = DataManager(config.output_path)
        logger.info("✅ データ管理器を初期化")
        
        # Phase 1: RSS収集
        logger.info("\n📡 Phase 1: RSS収集を開始...")
        try:
            async with collector:
                raw_articles = await collector.collect_all()
            logger.info(f"✅ RSS収集完了: {len(raw_articles)}件の記事を収集")
            
            if not raw_articles:
                logger.warning("⚠️ 収集された記事がありません")
                return
            
            # テスト用に最初の5件のみ処理
            raw_articles = raw_articles[:5]
            logger.info(f"📝 テスト用に{len(raw_articles)}件の記事を処理します")
            
            # 収集した記事の詳細を表示
            for i, article in enumerate(raw_articles, 1):
                logger.info(f"  {i}. {article.title[:50]}... ({article.source.name})")
                
        except Exception as e:
            error_msg = f"RSS収集エラー: {e}"
            logger.error(f"❌ {error_msg}")
            errors.append(error_msg)
            return
        
        # Phase 2: AI要約処理
        logger.info("\n🤖 Phase 2: AI要約処理を開始...")
        try:
            processed_articles = await summarizer.batch_process(raw_articles)
            logger.info(f"✅ AI要約処理完了: {len(processed_articles)}件の記事を処理")
            
            # 処理結果の詳細を表示
            for i, article in enumerate(processed_articles, 1):
                logger.info(f"  {i}. {article.title}")
                logger.info(f"     要約: {article.summary[:100]}...")
                logger.info(f"     タグ: {', '.join(article.tags[:3])}")
                logger.info(f"     信頼度: {article.ai_confidence:.2f}")
                
        except Exception as e:
            error_msg = f"AI要約処理エラー: {e}"
            logger.error(f"❌ {error_msg}")
            errors.append(error_msg)
            return
        
        # Phase 3: 日次サマリー生成
        logger.info("\n📊 Phase 3: 日次サマリー生成を開始...")
        try:
            daily_summary = await summarizer.analyze_daily_trends(processed_articles)
            logger.info("✅ 日次サマリー生成完了")
            
            logger.info(f"  📅 日付: {daily_summary.date}")
            logger.info(f"  📰 総記事数: {daily_summary.total_articles}")
            logger.info(f"  🔥 トップトレンド: {', '.join(daily_summary.top_trends[:5])}")
            logger.info(f"  📝 日本語サマリー: {daily_summary.summary_ja[:100]}...")
            
        except Exception as e:
            error_msg = f"日次サマリー生成エラー: {e}"
            logger.error(f"❌ {error_msg}")
            errors.append(error_msg)
            return
        
        # Phase 4: データ保存
        logger.info("\n💾 Phase 4: データ保存を開始...")
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            
            # 既存データをバックアップ
            existing_data = data_manager.load_existing_data(today)
            if existing_data:
                logger.info(f"  📂 既存データを検出: {len(existing_data)}件")
                # 新しいデータと既存データをマージ
                all_articles = existing_data + processed_articles
                # 重複を除去（IDベース）
                seen_ids = set()
                unique_articles = []
                for article in all_articles:
                    if article.id not in seen_ids:
                        unique_articles.append(article)
                        seen_ids.add(article.id)
                processed_articles = unique_articles
                logger.info(f"  🔄 データをマージ: {len(processed_articles)}件（重複除去後）")
            
            data_manager.save_daily_news(today, processed_articles)
            data_manager.save_daily_summary(daily_summary)
            data_manager.save_config_files()
            
            logger.info("✅ データ保存完了")
            
        except Exception as e:
            error_msg = f"データ保存エラー: {e}"
            logger.error(f"❌ {error_msg}")
            errors.append(error_msg)
            return
        
        # Phase 5: 処理メトリクス保存
        end_time = datetime.now()
        metrics = ProcessingMetrics(
            start_time=start_time,
            end_time=end_time,
            articles_collected=len(raw_articles),
            articles_processed=len(processed_articles),
            articles_failed=len(raw_articles) - len(processed_articles),
            api_calls_made=len(processed_articles) + 1,  # 記事処理 + サマリー生成
            errors=errors
        )
        
        try:
            data_manager.save_processing_metrics(metrics)
            logger.info("✅ 処理メトリクス保存完了")
        except Exception as e:
            logger.error(f"❌ メトリクス保存エラー: {e}")
        
        # 結果サマリー
        logger.info("\n🎉 リアルAPIテスト完了!")
        logger.info("=" * 50)
        logger.info(f"⏱️  処理時間: {(end_time - start_time).total_seconds():.1f}秒")
        logger.info(f"📊 成功率: {metrics.articles_processed / max(metrics.articles_collected, 1) * 100:.1f}%")
        logger.info(f"🔥 トップトレンド: {', '.join(daily_summary.top_trends[:3])}")
        logger.info(f"💾 保存場所: {config.output_path}")
        
        # 生成されたファイルを確認
        logger.info("\n📁 生成されたファイル:")
        output_path = Path(config.output_path)
        
        # 今日のニュースファイル
        news_dir = output_path / "news" / today
        if news_dir.exists():
            for file in news_dir.glob("*.json"):
                logger.info(f"  📄 {file.relative_to(output_path)}")
        
        # サマリーファイル
        summary_file = output_path / "summaries" / f"{today}.json"
        if summary_file.exists():
            logger.info(f"  📄 {summary_file.relative_to(output_path)}")
        
        # 最新ファイル
        latest_files = [
            output_path / "news" / "latest.json",
            output_path / "summaries" / "latest.json"
        ]
        for file in latest_files:
            if file.exists():
                logger.info(f"  📄 {file.relative_to(output_path)}")
        
        logger.info("\n✨ すべての処理が正常に完了しました!")
        
    except Exception as e:
        logger.error(f"❌ 予期しないエラーが発生しました: {e}")
        raise


def main():
    """メイン関数"""
    print("🔧 リアルAPIテストの準備...")
    print("📋 このテストでは以下を実行します:")
    print("   1. 実際のRSSフィードから記事を収集")
    print("   2. Claude APIで記事を要約・翻訳")
    print("   3. 日次サマリーを生成")
    print("   4. 構造化されたJSONファイルを出力")
    print("   5. 処理メトリクスを記録")
    print()
    
    # APIキーの確認
    if not os.getenv('CLAUDE_API_KEY'):
        print("❌ CLAUDE_API_KEY環境変数が設定されていません")
        print()
        print("💡 APIキーを設定してからテストを実行してください:")
        print("   export CLAUDE_API_KEY='your-api-key-here'")
        print("   python scripts/test/test_real_api.py")
        return
    
    print("✅ CLAUDE_API_KEY が設定されています")
    print("🚀 テストを開始します...\n")
    
    asyncio.run(test_real_api())


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
トレンド分析機能の包括的テスト
日次サマリー生成とトレンド抽出の動作を検証
"""

import sys
import asyncio
from datetime import datetime
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.append(str(Path(__file__).parent.parent))

from shared.ai.claude_summarizer import ClaudeSummarizer
from shared.data.data_manager import DataManager
from shared.config import AppConfig
from shared.utils.logger import setup_logger
from shared.types import NewsItem


async def test_trend_analysis():
    """トレンド分析機能の包括的テスト"""
    logger = setup_logger("trend_analysis_test")
    logger.info("トレンド分析機能のテストを開始します")
    
    try:
        # 設定読み込み
        config = AppConfig.from_env()
        logger.info("設定読み込み完了")
        
        # AI要約器を初期化
        summarizer = ClaudeSummarizer(config)
        logger.info("ClaudeSummarizer初期化完了")
        
        # データ管理器を初期化
        data_manager = DataManager()
        logger.info("DataManager初期化完了")
        
        # テスト用のニュース記事を作成
        test_articles = create_test_articles()
        logger.info(f"テスト記事数: {len(test_articles)}")
        
        # 日次トレンド分析を実行
        logger.info("日次トレンド分析を開始...")
        daily_summary = await summarizer.analyze_daily_trends(test_articles)
        logger.info("日次トレンド分析完了")
        
        # 結果を表示
        print_analysis_results(daily_summary)
        
        # データを保存
        today = datetime.now().strftime("%Y-%m-%d")
        logger.info("データ保存を開始...")
        
        data_manager.save_daily_news(today, test_articles)
        data_manager.save_daily_summary(daily_summary)
        
        logger.info("データ保存完了")
        
        # 保存されたデータを検証
        verify_saved_data(data_manager, today, daily_summary)
        
        logger.info("トレンド分析機能のテストが正常に完了しました")
        
    except Exception as e:
        logger.error(f"テスト中にエラーが発生しました: {e}")
        raise


def create_test_articles():
    """テスト用のニュース記事を作成"""
    articles = [
        NewsItem(
            id="test-1",
            title="OpenAIが新しいGPT-5モデルを発表、推論能力が大幅向上",
            original_title="OpenAI Announces GPT-5 with Significantly Enhanced Reasoning",
            summary="OpenAIは次世代言語モデルGPT-5を発表しました。従来モデルと比較して推論能力が大幅に向上し、複雑な数学問題や論理的思考を要するタスクで優れた性能を示しています。また、マルチモーダル機能も強化され、画像と文章を組み合わせた処理が可能になりました。",
            url="https://example.com/openai-gpt5",
            source="AI News",
            category="海外",
            published_at=datetime.now(),
            language="ja",
            tags=["GPT-5", "OpenAI", "言語モデル", "推論能力", "マルチモーダル"],
            ai_confidence=0.95
        ),
        NewsItem(
            id="test-2", 
            title="Googleが量子コンピューティングでAI学習を高速化する新技術を開発",
            original_title="Google Develops New Technology to Accelerate AI Training with Quantum Computing",
            summary="Googleの研究チームは、量子コンピューティングを活用してAIモデルの学習を高速化する革新的な技術を開発しました。従来の古典的コンピューターでは数週間かかる学習プロセスを数時間に短縮することが可能になります。この技術により、より大規模で複雑なAIモデルの開発が現実的になると期待されています。",
            url="https://example.com/google-quantum-ai",
            source="Tech Review",
            category="海外",
            published_at=datetime.now(),
            language="ja",
            tags=["Google", "量子コンピューティング", "AI学習", "高速化", "機械学習"],
            ai_confidence=0.92
        ),
        NewsItem(
            id="test-3",
            title="日本のAIスタートアップが自動運転技術で世界初の完全無人配送を実現",
            original_title="Japanese AI Startup Achieves World's First Fully Autonomous Delivery",
            summary="日本のAIスタートアップ企業が、完全無人での配送サービスを世界で初めて実用化しました。独自開発のAI技術により、複雑な都市環境での自動運転を実現し、安全性と効率性を両立させています。この技術は物流業界に革命をもたらす可能性があり、人手不足の解決策としても注目されています。",
            url="https://example.com/japan-autonomous-delivery",
            source="日本AI新聞",
            category="国内",
            published_at=datetime.now(),
            language="ja",
            tags=["自動運転", "無人配送", "日本", "スタートアップ", "物流"],
            ai_confidence=0.88
        ),
        NewsItem(
            id="test-4",
            title="MicrosoftがAzure AIサービスに新しい画像生成機能を追加",
            original_title="Microsoft Adds New Image Generation Features to Azure AI Services",
            summary="Microsoftは、Azure AIサービスに高品質な画像生成機能を新たに追加しました。テキストから画像を生成するだけでなく、既存の画像を編集・加工する機能も提供されます。企業向けのクリエイティブワークフローを支援し、マーケティングやデザイン業務の効率化が期待されています。",
            url="https://example.com/microsoft-azure-image-gen",
            source="Microsoft News",
            category="海外",
            published_at=datetime.now(),
            language="ja",
            tags=["Microsoft", "Azure", "画像生成", "クリエイティブ", "企業向け"],
            ai_confidence=0.90
        ),
        NewsItem(
            id="test-5",
            title="AI倫理に関する国際ガイドラインが策定、各国が協調して規制強化へ",
            original_title="International AI Ethics Guidelines Established, Countries Collaborate on Stronger Regulations",
            summary="主要国が参加する国際会議で、AI技術の倫理的使用に関する包括的なガイドラインが策定されました。プライバシー保護、アルゴリズムの透明性、バイアス排除などが重点項目として挙げられています。各国は今後、このガイドラインに基づいて国内法の整備を進める予定です。",
            url="https://example.com/ai-ethics-guidelines",
            source="Global Tech Policy",
            category="海外",
            published_at=datetime.now(),
            language="ja",
            tags=["AI倫理", "国際ガイドライン", "規制", "プライバシー", "透明性"],
            ai_confidence=0.87
        )
    ]
    
    return articles


def print_analysis_results(daily_summary):
    """分析結果を表示"""
    print("\n" + "="*60)
    print("日次トレンド分析結果")
    print("="*60)
    
    print(f"日付: {daily_summary.date}")
    print(f"総記事数: {daily_summary.total_articles}")
    print(f"生成日時: {daily_summary.generated_at}")
    
    print(f"\n【トップトレンド】")
    for i, trend in enumerate(daily_summary.top_trends, 1):
        print(f"{i}. {trend}")
    
    print(f"\n【カテゴリ別内訳】")
    for category, count in daily_summary.category_breakdown.items():
        print(f"- {category}: {count}件")
    
    print(f"\n【重要ニュース（上位3件）】")
    for i, article in enumerate(daily_summary.significant_news[:3], 1):
        print(f"{i}. {article.title[:50]}... (信頼度: {article.ai_confidence})")
    
    print(f"\n【日本語サマリー】")
    print(daily_summary.summary_ja)
    
    print(f"\n【英語サマリー】")
    print(daily_summary.summary_en)
    
    print("="*60)


def verify_saved_data(data_manager, date, expected_summary):
    """保存されたデータを検証"""
    logger = setup_logger("data_verification")
    
    try:
        # 日次サマリーファイルの存在確認
        summary_file = Path(f"frontend/public/data/summaries/{date}.json")
        latest_summary_file = Path("frontend/public/data/summaries/latest.json")
        
        if summary_file.exists():
            logger.info(f"✅ 日次サマリーファイルが正常に保存されました: {summary_file}")
        else:
            logger.error(f"❌ 日次サマリーファイルが見つかりません: {summary_file}")
        
        if latest_summary_file.exists():
            logger.info(f"✅ 最新サマリーファイルが正常に保存されました: {latest_summary_file}")
        else:
            logger.error(f"❌ 最新サマリーファイルが見つかりません: {latest_summary_file}")
        
        # ニュースファイルの存在確認
        news_dir = Path(f"frontend/public/data/news/{date}")
        articles_file = news_dir / "articles.json"
        metadata_file = news_dir / "metadata.json"
        
        if articles_file.exists():
            logger.info(f"✅ 記事ファイルが正常に保存されました: {articles_file}")
        else:
            logger.error(f"❌ 記事ファイルが見つかりません: {articles_file}")
        
        if metadata_file.exists():
            logger.info(f"✅ メタデータファイルが正常に保存されました: {metadata_file}")
        else:
            logger.error(f"❌ メタデータファイルが見つかりません: {metadata_file}")
        
        logger.info("データ検証完了")
        
    except Exception as e:
        logger.error(f"データ検証中にエラーが発生しました: {e}")


if __name__ == "__main__":
    asyncio.run(test_trend_analysis())
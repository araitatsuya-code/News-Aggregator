"""
フルパイプライン統合テスト
RSS収集からJSON出力までの全体処理をテスト
"""

import pytest
import asyncio
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timezone
from unittest.mock import patch, Mock, AsyncMock
import json
import sys

# プロジェクトルートをパスに追加
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from shared.types import RSSSource, RawNewsItem, NewsItem, DailySummary, ProcessingMetrics
from shared.collectors.rss_collector import RSSCollector
from shared.ai.claude_summarizer import ClaudeSummarizer
from shared.data.data_manager import DataManager
from scripts.main import NewsAggregatorPipeline


class TestFullPipeline:
    """フルパイプライン統合テスト"""
    
    @pytest.fixture
    def temp_output_dir(self):
        """テスト用出力ディレクトリ"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def test_sources(self):
        """テスト用RSSソース"""
        return [
            RSSSource(
                url="https://example.com/ai-feed.xml",
                category="AI",
                language="en",
                name="AI News Source"
            ),
            RSSSource(
                url="https://example.com/jp-ai-feed.xml",
                category="国内",
                language="ja",
                name="日本AI情報"
            )
        ]
    
    @pytest.fixture
    def mock_rss_data(self):
        """モックRSSデータ"""
        return {
            "https://example.com/ai-feed.xml": {
                'entries': [
                    {
                        'title': 'Revolutionary AI Model Released',
                        'link': 'https://example.com/ai-model',
                        'published_parsed': datetime(2024, 8, 31, 10, 0, 0).timetuple(),
                        'summary': 'A new AI model with breakthrough capabilities has been released.',
                        'id': 'ai-model-1'
                    },
                    {
                        'title': 'Machine Learning in Healthcare',
                        'link': 'https://example.com/ml-healthcare',
                        'published_parsed': datetime(2024, 8, 31, 11, 0, 0).timetuple(),
                        'summary': 'New applications of ML in medical diagnosis.',
                        'id': 'ml-healthcare-1'
                    }
                ]
            },
            "https://example.com/jp-ai-feed.xml": {
                'entries': [
                    {
                        'title': '日本のAI企業が新技術を発表',
                        'link': 'https://example.com/jp-ai-tech',
                        'published_parsed': datetime(2024, 8, 31, 12, 0, 0).timetuple(),
                        'summary': '国内AI企業が革新的な技術を発表しました。',
                        'id': 'jp-ai-tech-1'
                    }
                ]
            }
        }
    
    @pytest.fixture
    def mock_claude_responses(self):
        """モックClaude API レスポンス"""
        return {
            'Revolutionary AI Model Released': {
                "summary_ja": "革新的なAIモデルがリリースされました。このモデルは従来の性能を大幅に上回る能力を持っています。",
                "tags": ["AI", "モデル", "技術革新"],
                "confidence": 0.92
            },
            'Machine Learning in Healthcare': {
                "summary_ja": "医療分野での機械学習応用が進んでいます。診断精度の向上が期待されます。",
                "tags": ["機械学習", "医療", "診断"],
                "confidence": 0.88
            },
            '日本のAI企業が新技術を発表': {
                "summary_ja": "国内AI企業が革新的な技術を発表し、業界に大きな影響を与えると予想されます。",
                "tags": ["AI", "企業", "技術発表"],
                "confidence": 0.85
            }
        }
    
    @pytest.mark.asyncio
    async def test_end_to_end_processing(self, temp_output_dir, test_sources, mock_rss_data, mock_claude_responses):
        """エンドツーエンド処理テスト"""
        
        # パイプラインを初期化
        pipeline = NewsAggregatorPipeline(
            sources=test_sources,
            output_path=str(temp_output_dir),
            api_key="test-api-key"
        )
        
        # RSS収集をモック
        with patch('shared.collectors.rss_collector.feedparser.parse') as mock_parse:
            def mock_parse_side_effect(url):
                return mock_rss_data.get(url, {'entries': []})
            
            mock_parse.side_effect = mock_parse_side_effect
            
            # Claude APIをモック
            with patch('shared.ai.claude_summarizer.anthropic.AsyncAnthropic') as mock_anthropic:
                mock_client = AsyncMock()
                mock_anthropic.return_value = mock_client
                
                def mock_claude_response(title):
                    response_data = mock_claude_responses.get(title, {
                        "summary_ja": f"{title}の要約",
                        "tags": ["AI"],
                        "confidence": 0.8
                    })
                    
                    mock_response = Mock()
                    mock_response.content = [Mock()]
                    mock_response.content[0].text = json.dumps(response_data)
                    return mock_response
                
                # タイトルに基づいてレスポンスを返すように設定
                async def mock_create(*args, **kwargs):
                    messages = kwargs.get('messages', [])
                    if messages:
                        content = messages[-1]['content']
                        # タイトルを抽出してレスポンスを生成
                        for title in mock_claude_responses.keys():
                            if title in content:
                                return mock_claude_response(title)
                    return mock_claude_response("Default")
                
                mock_client.messages.create.side_effect = mock_create
                
                # パイプラインを実行
                metrics = await pipeline.run()
                
                # 処理結果を検証
                assert metrics.articles_collected >= 3
                assert metrics.articles_processed >= 3
                assert metrics.articles_failed == 0
                
                # 出力ファイルが作成されることを確認
                assert (temp_output_dir / "news" / "2024-08-31" / "articles.json").exists()
                assert (temp_output_dir / "news" / "latest.json").exists()
                assert (temp_output_dir / "summaries" / "2024-08-31.json").exists()
                assert (temp_output_dir / "summaries" / "latest.json").exists()
                
                # 記事データの内容を検証
                with open(temp_output_dir / "news" / "2024-08-31" / "articles.json", 'r', encoding='utf-8') as f:
                    articles = json.load(f)
                
                assert len(articles) >= 3
                assert any("革新的なAIモデル" in article['summary'] for article in articles)
                
                # サマリーデータの内容を検証
                with open(temp_output_dir / "summaries" / "2024-08-31.json", 'r', encoding='utf-8') as f:
                    summary = json.load(f)
                
                assert summary['total_articles'] >= 3
                assert len(summary['top_trends']) > 0
                assert 'AI' in summary['top_trends']
    
    @pytest.mark.asyncio
    async def test_error_recovery(self, temp_output_dir, test_sources):
        """エラー発生時の復旧テスト"""
        
        pipeline = NewsAggregatorPipeline(
            sources=test_sources,
            output_path=str(temp_output_dir),
            api_key="test-api-key"
        )
        
        # 一部のRSSソースでエラーが発生する状況をシミュレート
        with patch('shared.collectors.rss_collector.feedparser.parse') as mock_parse:
            def mock_parse_side_effect(url):
                if "ai-feed.xml" in url:
                    # 最初のソースは成功
                    return {
                        'entries': [{
                            'title': 'Working AI News',
                            'link': 'https://example.com/working',
                            'published_parsed': datetime(2024, 8, 31, 10, 0, 0).timetuple(),
                            'summary': 'This source works fine.',
                            'id': 'working-1'
                        }]
                    }
                else:
                    # 2番目のソースはエラー
                    raise Exception("RSS feed error")
            
            mock_parse.side_effect = mock_parse_side_effect
            
            # Claude APIをモック
            with patch('shared.ai.claude_summarizer.anthropic.AsyncAnthropic') as mock_anthropic:
                mock_client = AsyncMock()
                mock_anthropic.return_value = mock_client
                
                mock_response = Mock()
                mock_response.content = [Mock()]
                mock_response.content[0].text = json.dumps({
                    "summary_ja": "動作するAIニュースの要約です。",
                    "tags": ["AI", "ニュース"],
                    "confidence": 0.8
                })
                mock_client.messages.create.return_value = mock_response
                
                # パイプラインを実行
                metrics = await pipeline.run()
                
                # エラーがあっても処理が継続されることを確認
                assert metrics.articles_collected >= 1
                assert metrics.articles_processed >= 1
                assert len(metrics.errors) > 0  # エラーが記録されている
                
                # 成功した記事のデータが出力されることを確認
                assert (temp_output_dir / "news" / "latest.json").exists()
    
    @pytest.mark.asyncio
    async def test_api_rate_limiting(self, temp_output_dir, test_sources):
        """API レート制限対応テスト"""
        
        pipeline = NewsAggregatorPipeline(
            sources=test_sources,
            output_path=str(temp_output_dir),
            api_key="test-api-key",
            batch_size=2  # 小さなバッチサイズでテスト
        )
        
        # 多数の記事を生成
        many_articles = []
        for i in range(10):
            many_articles.append({
                'title': f'AI Article {i}',
                'link': f'https://example.com/article{i}',
                'published_parsed': datetime(2024, 8, 31, 10 + i, 0, 0).timetuple(),
                'summary': f'AI article content {i}',
                'id': f'article-{i}'
            })
        
        with patch('shared.collectors.rss_collector.feedparser.parse') as mock_parse:
            mock_parse.return_value = {'entries': many_articles}
            
            # Claude APIでレート制限をシミュレート
            with patch('shared.ai.claude_summarizer.anthropic.AsyncAnthropic') as mock_anthropic:
                mock_client = AsyncMock()
                mock_anthropic.return_value = mock_client
                
                call_count = 0
                async def mock_create_with_rate_limit(*args, **kwargs):
                    nonlocal call_count
                    call_count += 1
                    
                    # 3回目の呼び出しでレート制限エラー
                    if call_count == 3:
                        from anthropic import RateLimitError
                        raise RateLimitError("Rate limit exceeded")
                    
                    mock_response = Mock()
                    mock_response.content = [Mock()]
                    mock_response.content[0].text = json.dumps({
                        "summary_ja": f"記事 {call_count} の要約",
                        "tags": ["AI"],
                        "confidence": 0.8
                    })
                    return mock_response
                
                mock_client.messages.create.side_effect = mock_create_with_rate_limit
                
                # パイプラインを実行
                metrics = await pipeline.run()
                
                # レート制限エラーが適切に処理されることを確認
                assert metrics.articles_collected == 10
                assert metrics.articles_processed < 10  # 一部の記事が処理されない
                assert "Rate limit" in str(metrics.errors)
    
    @pytest.mark.asyncio
    async def test_data_persistence_and_cleanup(self, temp_output_dir, test_sources):
        """データ永続化とクリーンアップテスト"""
        
        pipeline = NewsAggregatorPipeline(
            sources=test_sources,
            output_path=str(temp_output_dir),
            api_key="test-api-key"
        )
        
        # 複数日のデータを作成
        dates = ["2024-08-29", "2024-08-30", "2024-08-31"]
        
        for i, date in enumerate(dates):
            # 各日のディレクトリを作成
            date_dir = temp_output_dir / "news" / date
            date_dir.mkdir(parents=True, exist_ok=True)
            
            # ダミーデータを作成
            articles = [{
                "id": f"article-{date}-{j}",
                "title": f"記事 {date} {j}",
                "summary": f"要約 {date} {j}",
                "url": f"https://example.com/{date}/{j}",
                "source": "テストソース",
                "category": "AI",
                "published_at": f"{date}T12:00:00Z",
                "language": "ja",
                "tags": ["AI"],
                "ai_confidence": 0.8
            } for j in range(3)]
            
            with open(date_dir / "articles.json", 'w', encoding='utf-8') as f:
                json.dump(articles, f, ensure_ascii=False, indent=2)
        
        # データマネージャーでクリーンアップをテスト
        data_manager = DataManager(str(temp_output_dir))
        data_manager.cleanup_old_data(retention_days=2)
        
        # 古いデータが削除され、新しいデータが残ることを確認
        assert not (temp_output_dir / "news" / "2024-08-29").exists()
        assert (temp_output_dir / "news" / "2024-08-30").exists()
        assert (temp_output_dir / "news" / "2024-08-31").exists()
    
    @pytest.mark.asyncio
    async def test_concurrent_processing(self, temp_output_dir, test_sources):
        """並行処理テスト"""
        
        # 複数のパイプラインを同時実行
        pipelines = []
        for i in range(3):
            pipeline = NewsAggregatorPipeline(
                sources=test_sources,
                output_path=str(temp_output_dir / f"pipeline_{i}"),
                api_key="test-api-key"
            )
            pipelines.append(pipeline)
        
        with patch('shared.collectors.rss_collector.feedparser.parse') as mock_parse:
            mock_parse.return_value = {
                'entries': [{
                    'title': 'Concurrent Test Article',
                    'link': 'https://example.com/concurrent',
                    'published_parsed': datetime(2024, 8, 31, 10, 0, 0).timetuple(),
                    'summary': 'Testing concurrent processing.',
                    'id': 'concurrent-1'
                }]
            }
            
            with patch('shared.ai.claude_summarizer.anthropic.AsyncAnthropic') as mock_anthropic:
                mock_client = AsyncMock()
                mock_anthropic.return_value = mock_client
                
                mock_response = Mock()
                mock_response.content = [Mock()]
                mock_response.content[0].text = json.dumps({
                    "summary_ja": "並行処理テスト記事の要約",
                    "tags": ["テスト"],
                    "confidence": 0.8
                })
                mock_client.messages.create.return_value = mock_response
                
                # 並行実行
                results = await asyncio.gather(*[pipeline.run() for pipeline in pipelines])
                
                # 全てのパイプラインが正常に完了することを確認
                for i, metrics in enumerate(results):
                    assert metrics.articles_processed > 0
                    assert (temp_output_dir / f"pipeline_{i}" / "news" / "latest.json").exists()
    
    def test_configuration_validation(self, temp_output_dir):
        """設定検証テスト"""
        
        # 不正な設定でパイプラインを初期化
        with pytest.raises(ValueError):
            NewsAggregatorPipeline(
                sources=[],  # 空のソースリスト
                output_path=str(temp_output_dir),
                api_key="test-api-key"
            )
        
        with pytest.raises(ValueError):
            NewsAggregatorPipeline(
                sources=[RSSSource(
                    url="invalid-url",  # 不正なURL
                    category="AI",
                    language="ja",
                    name="テストソース"
                )],
                output_path=str(temp_output_dir),
                api_key="test-api-key"
            )
    
    @pytest.mark.asyncio
    async def test_metrics_collection(self, temp_output_dir, test_sources):
        """メトリクス収集テスト"""
        
        pipeline = NewsAggregatorPipeline(
            sources=test_sources,
            output_path=str(temp_output_dir),
            api_key="test-api-key"
        )
        
        with patch('shared.collectors.rss_collector.feedparser.parse') as mock_parse:
            mock_parse.return_value = {
                'entries': [{
                    'title': 'Metrics Test Article',
                    'link': 'https://example.com/metrics',
                    'published_parsed': datetime(2024, 8, 31, 10, 0, 0).timetuple(),
                    'summary': 'Testing metrics collection.',
                    'id': 'metrics-1'
                }]
            }
            
            with patch('shared.ai.claude_summarizer.anthropic.AsyncAnthropic') as mock_anthropic:
                mock_client = AsyncMock()
                mock_anthropic.return_value = mock_client
                
                mock_response = Mock()
                mock_response.content = [Mock()]
                mock_response.content[0].text = json.dumps({
                    "summary_ja": "メトリクステスト記事の要約",
                    "tags": ["テスト"],
                    "confidence": 0.8
                })
                mock_client.messages.create.return_value = mock_response
                
                # パイプラインを実行
                metrics = await pipeline.run()
                
                # メトリクスが正しく収集されることを確認
                assert isinstance(metrics, ProcessingMetrics)
                assert metrics.articles_collected > 0
                assert metrics.articles_processed > 0
                assert metrics.api_calls_made > 0
                assert metrics.end_time > metrics.start_time
                
                # メトリクスファイルが作成されることを確認
                metrics_files = list((temp_output_dir / "metrics").glob("metrics_*.json"))
                assert len(metrics_files) > 0
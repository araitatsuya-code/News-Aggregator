# マルチプロバイダーAIシステム

AI News Aggregatorでは、複数のAIプロバイダーを使い分けることで、レート制限の回避、コスト最適化、処理速度の向上を実現しています。

## 概要

### 対応プロバイダー

| プロバイダー       | 特徴                   | レート制限 | コスト | 推奨用途           |
| ------------------ | ---------------------- | ---------- | ------ | ------------------ |
| **OpenAI GPT-4o**  | 高速・安価・高品質     | 500req/min | 低     | メイン処理（推奨） |
| **Claude**         | 最高品質               | 50req/min  | 高     | 重要記事・分析     |
| **Google Gemini**  | 大容量コンテキスト     | 300req/min | 中     | 長文処理           |
| **ローカルモデル** | 完全無料・プライバシー | 無制限     | 無料   | 開発・テスト       |

### システムアーキテクチャ

```
┌─────────────────┐    ┌──────────────────┐
│   RSS記事収集   │───▶│ マルチAI要約器    │
└─────────────────┘    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  プロバイダー選択  │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │ OpenAI処理   │    │ Claude処理   │
            └──────────────┘    └──────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    ┌──────────────────┐
                    │   結果マージ     │
                    └──────────────────┘
```

## 設定方法

### 1. 環境変数設定

`.env`ファイルで使用するプロバイダーを設定：

```bash
# OpenAI設定（推奨）
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o
OPENAI_BATCH_SIZE=10

# Claude設定
CLAUDE_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-3-haiku-20240307
CLAUDE_BATCH_SIZE=1

# Gemini設定
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-1.5-pro
GEMINI_BATCH_SIZE=5

# プロバイダー優先順位
PREFERRED_PROVIDERS=openai,claude,gemini,local
```

### 2. 最小設定

最低限OpenAIキーのみでも動作：

```bash
# 最小設定
OPENAI_API_KEY=your_openai_key
```

## 動作原理

### 1. プロバイダー選択アルゴリズム

```python
def _select_provider(self, task_type: str = "summarize") -> Optional[AIProvider]:
    # 1. 利用可能なプロバイダーをフィルタリング
    available_providers = [
        provider for provider, status in self.provider_status.items()
        if status.available and not status.is_rate_limited()
    ]
    
    # 2. タスク別優先度で選択
    task_preferences = {
        "summarize": [OpenAI, Claude, Gemini, Local],
        "translate": [OpenAI, Gemini, Claude, Local],
        "analyze": [Claude, Gemini, OpenAI, Local]
    }
    
    # 3. 優先度順で利用可能なプロバイダーを選択
    return first_available_provider
```

### 2. 自動フォールバック機能

```python
# プロバイダーでエラーが発生した場合
for attempt_provider in [primary_provider, fallback_providers...]:
    try:
        result = await provider.process(article)
        if result:
            return result
    except RateLimitError:
        # レート制限の場合は一時的に無効化
        self.provider_status[provider].rate_limit_reset = now + 300
        continue
    except Exception as e:
        # その他のエラーは次のプロバイダーを試行
        continue
```

### 3. 負荷分散処理

```python
def _distribute_articles(self, articles: List[RawNewsItem]):
    # 重み付けに基づいて記事を分散
    provider_weights = {
        AIProvider.OPENAI: 0.4,    # 40%
        AIProvider.CLAUDE: 0.3,    # 30%
        AIProvider.GEMINI: 0.2,    # 20%
        AIProvider.LOCAL: 0.1      # 10%
    }
    
    # 各記事を重み付きランダムで分散
    for article in articles:
        provider = weighted_random_choice(available_providers, weights)
        provider_batches[provider].append(article)
```

## パフォーマンス比較

### 処理速度比較（100記事処理時）

| プロバイダー | 処理時間 | バッチ間待機  | 総時間 |
| ------------ | -------- | ------------- | ------ |
| Claude単体   | ~50分    | 45秒×10バッチ | ~58分  |
| OpenAI単体   | ~5分     | 2秒×10バッチ  | ~5.5分 |
| マルチ併用   | ~3分     | 並行処理      | ~3.5分 |

### コスト比較（1000記事処理時）

| プロバイダー | 入力コスト | 出力コスト | 総コスト |
| ------------ | ---------- | ---------- | -------- |
| Claude       | $15.00     | $75.00     | $90.00   |
| OpenAI       | $2.50      | $10.00     | $12.50   |
| Gemini       | $3.50      | $10.50     | $14.00   |

## エラーハンドリング

### 1. レート制限対応

```python
class ProviderStatus:
    def mark_rate_limit_error(self, reset_time: int):
        """レート制限エラーを記録"""
        self.rate_limit_reset = datetime.now() + timedelta(seconds=reset_time)
        self.available = False
    
    def is_rate_limited(self) -> bool:
        """レート制限中かチェック"""
        if self.rate_limit_reset and datetime.now() < self.rate_limit_reset:
            return True
        self.available = True  # 制限解除
        return False
```

### 2. 連続エラー対応

```python
def mark_error(self, error: str):
    """エラーを記録"""
    self.error_count += 1
    self.last_error = error
    
    # 連続エラーが3回以上の場合は一時的に無効化
    if self.error_count >= 3:
        self.available = False
```

## 監視とメトリクス

### プロバイダー状態確認

```python
# プロバイダーの状態を取得
status = summarizer.get_provider_status()
print(status)
# {
#   "openai": {
#     "available": true,
#     "error_count": 0,
#     "last_used": "2025-01-09T10:30:00",
#     "rate_limited": false
#   },
#   "claude": {
#     "available": false,
#     "error_count": 3,
#     "last_error": "rate_limit_error",
#     "rate_limited": true
#   }
# }
```

### ログ出力例

```
2025-01-09 10:30:00 INFO マルチAI要約器を初期化しました
2025-01-09 10:30:00 INFO 利用可能なAIプロバイダー: openai, claude, gemini
2025-01-09 10:30:05 INFO openai: 40件の記事を割り当て
2025-01-09 10:30:05 INFO claude: 30件の記事を割り当て
2025-01-09 10:30:05 INFO gemini: 20件の記事を割り当て
2025-01-09 10:32:00 WARNING claudeでレート制限エラー: 60秒待機します
2025-01-09 10:32:00 INFO openaiにフォールバック
2025-01-09 10:35:00 INFO マルチプロバイダーバッチ処理完了: 90/100
```

## ベストプラクティス

### 1. プロバイダー選択指針

- **日常処理**: OpenAI GPT-4o（高速・安価）
- **重要記事**: Claude（最高品質）
- **大量処理**: Gemini（大容量コンテキスト）
- **開発・テスト**: ローカルモデル（無料）

### 2. コスト最適化

```bash
# コスト重視設定
PREFERRED_PROVIDERS=openai,gemini,claude
OPENAI_BATCH_SIZE=15
GEMINI_BATCH_SIZE=10
CLAUDE_BATCH_SIZE=1
```

### 3. 品質重視設定

```bash
# 品質重視設定
PREFERRED_PROVIDERS=claude,openai,gemini
CLAUDE_BATCH_SIZE=3
OPENAI_BATCH_SIZE=8
```

### 4. 速度重視設定

```bash
# 速度重視設定
PREFERRED_PROVIDERS=openai,gemini,local
OPENAI_BATCH_SIZE=20
GEMINI_BATCH_SIZE=15
USE_LOCAL_MODEL=true
```

## トラブルシューティング

### よくある問題

1. **すべてのプロバイダーが利用不可**
   ```
   ERROR: 利用可能なプロバイダーがありません
   ```
   - 解決策: APIキーの確認、レート制限の解除待ち

2. **OpenAI初期化失敗**
   ```
   WARNING: OpenAI初期化失敗: Invalid API key
   ```
   - 解決策: `OPENAI_API_KEY`の確認

3. **処理速度が遅い**
   - 解決策: `OPENAI_BATCH_SIZE`を増加、Claudeの使用を減らす

### デバッグ方法

```bash
# デバッグログ有効化
LOG_LEVEL=DEBUG

# 特定プロバイダーのみ使用
PREFERRED_PROVIDERS=openai
```

## 今後の拡張予定

- **Anthropic Claude 3.5 Sonnet**対応
- **Azure OpenAI**対応
- **AWS Bedrock**対応
- **動的重み調整**機能
- **コスト追跡**機能
- **A/Bテスト**機能

## 関連ファイル

- `shared/ai/multi_summarizer.py` - メインシステム
- `shared/ai/openai_summarizer.py` - OpenAI実装
- `shared/ai/claude_summarizer.py` - Claude実装
- `shared/config.py` - 設定管理
- `scripts/main.py` - メイン処理
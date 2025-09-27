# ユーティリティスクリプト単体テスト

このディレクトリには、ワンコマンドデプロイメント機能のユーティリティスクリプトの単体テストが含まれています。

## テストスイート一覧

### 1. 仮想環境マネージャーテスト (`test_venv_manager.sh`)
- **対象**: `scripts/utils/venv-manager.sh`
- **要件**: 要件5（仮想環境の自動検出と有効化）
- **テスト内容**:
  - 仮想環境の検出機能（正常系・異常系）
  - 仮想環境の有効化・無効化
  - Python環境の検証
  - 依存関係のチェック
  - エラーハンドリング

### 2. 進行状況ロガーテスト (`test_progress_logger.sh`)
- **対象**: `scripts/utils/progress-logger.sh`
- **要件**: 要件6（進行状況の表示）、要件7（ログ出力）
- **テスト内容**:
  - ログレベルの設定と出力
  - ステップ管理機能
  - プログレスバー表示
  - ログファイル出力
  - エラーハンドリング

### 3. 時間トラッカーテスト (`test_time_tracker.sh`)
- **対象**: `scripts/utils/time-tracker.sh`
- **要件**: 要件4（実行時間の計測）
- **テスト内容**:
  - ワークフロータイマー機能
  - ステップ別時間計測
  - 時間フォーマット機能
  - 統計情報表示
  - JSON出力機能

### 4. エラーハンドラーテスト (`test_error_handler.sh`)
- **対象**: `scripts/utils/error-handler.sh`
- **要件**: 要件7（エラーハンドリング）
- **テスト内容**:
  - エラー分類と処理
  - 警告・エラー・致命的エラーの処理
  - 回復手順の表示
  - エラー統計機能
  - 安全なコマンド実行

### 5. 詳細ログ出力機能テスト (`test_detailed_logger.sh`)
- **対象**: `scripts/utils/detailed-logger.sh`
- **要件**: 要件7（詳細ログ出力）
- **テスト内容**:
  - テキスト・JSON形式のログ出力
  - ログレベルフィルタリング
  - 構造化ログ機能
  - ログローテーション
  - 実行サマリー生成

## 実行方法

### 全テストの実行
```bash
# すべてのテストを実行
./tests/unit/run_all_unit_tests.sh

# 詳細出力で実行
./tests/unit/run_all_unit_tests.sh --verbose

# サマリーのみ表示
./tests/unit/run_all_unit_tests.sh --summary-only
```

### 個別テストの実行
```bash
# 仮想環境マネージャーのテストのみ
./tests/unit/run_all_unit_tests.sh venv-manager

# 複数のテストを指定
./tests/unit/run_all_unit_tests.sh progress-logger time-tracker

# 個別にテストスクリプトを実行
./tests/unit/test_venv_manager.sh
```

### 並列実行（実験的）
```bash
# 並列でテストを実行（高速化）
./tests/unit/run_all_unit_tests.sh --parallel
```

## テストフレームワーク

### 基本構造
各テストスクリプトは以下の構造を持っています：

```bash
#!/bin/bash

# テスト設定
TEST_NAME="テスト名"
TEST_COUNT=0
PASSED_COUNT=0
FAILED_COUNT=0

# アサーション関数
assert_equals() { ... }
assert_true() { ... }
assert_false() { ... }
# ... その他のアサーション

# テスト関数
test_function_name() {
    echo -e "\n${BLUE}=== テスト名 ===${NC}"
    # テストロジック
    assert_equals "expected" "actual" "テストの説明"
}

# メイン実行
main() {
    setup_test_environment
    run_all_tests
    show_test_summary
    cleanup_test_environment
}
```

### アサーション関数
- `assert_equals(expected, actual, description)` - 等価比較
- `assert_true(condition, description)` - 真偽判定
- `assert_false(condition, description)` - 偽判定
- `assert_file_exists(path, description)` - ファイル存在確認
- `assert_contains(haystack, needle, description)` - 文字列包含確認
- `assert_numeric(value, description)` - 数値判定
- `assert_greater_than(value, threshold, description)` - 大小比較

### テスト環境
- 各テストは独立した一時ディレクトリで実行
- テスト終了時に自動クリーンアップ
- 元のスクリプトを変更せずにテスト

## テスト結果の解釈

### 成功例
```
✓ 仮想環境の検出が成功すること
✓ 検出されたパスが正しいこと

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
仮想環境マネージャーテスト 結果サマリー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
総テスト数: 25
成功: 25
失敗: 0

✓ すべてのテストが成功しました！
```

### 失敗例
```
✗ 仮想環境の検出が成功すること
  理由: 条件が真ではありませんでした

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
仮想環境マネージャーテスト 結果サマリー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
総テスト数: 25
成功: 24
失敗: 1

✗ 1 個のテストが失敗しました
```

## トラブルシューティング

### よくある問題

1. **テストファイルが見つからない**
   ```
   エラー: テストファイルが見つかりません: ./test_xxx.sh
   ```
   - 解決方法: テストファイルに実行権限があることを確認
   ```bash
   chmod +x tests/unit/*.sh
   ```

2. **ユーティリティスクリプトが見つからない**
   ```
   エラー: venv-manager.shが見つかりません
   ```
   - 解決方法: `scripts/utils/` ディレクトリにスクリプトが存在することを確認

3. **一時ディレクトリの作成に失敗**
   ```
   エラー: テスト環境の作成に失敗しました
   ```
   - 解決方法: `/tmp` ディレクトリの書き込み権限を確認

### デバッグ方法

1. **詳細出力でテストを実行**
   ```bash
   ./tests/unit/run_all_unit_tests.sh --verbose
   ```

2. **個別テストを直接実行**
   ```bash
   ./tests/unit/test_venv_manager.sh
   ```

3. **テストスクリプトの内容を確認**
   ```bash
   cat tests/unit/test_venv_manager.sh
   ```

## テストの追加・修正

### 新しいテストの追加
1. 新しいテストファイルを作成
2. `run_all_unit_tests.sh` の `TEST_SUITES` 配列に追加
3. `TEST_SUITE_NAMES` 連想配列に表示名を追加

### 既存テストの修正
1. 対象のテストファイルを編集
2. 新しいテスト関数を追加
3. `run_all_tests()` 関数で新しいテストを呼び出し

## 継続的インテグレーション

このテストスイートは以下の用途で使用できます：

- **開発時の品質確認**: コード変更後の動作確認
- **リリース前の検証**: 全機能の動作確認
- **リグレッションテスト**: 既存機能の動作保証
- **CI/CDパイプライン**: 自動テスト実行

### CI/CDでの使用例
```yaml
# GitHub Actions例
- name: Run Unit Tests
  run: |
    chmod +x tests/unit/run_all_unit_tests.sh
    ./tests/unit/run_all_unit_tests.sh --summary-only
```

## 要件との対応

| 要件 | 対応テスト | 検証内容 |
|------|------------|----------|
| 要件4 | time-tracker | 実行時間の計測と表示 |
| 要件5 | venv-manager | 仮想環境の自動検出と有効化 |
| 要件6 | progress-logger | 進行状況の表示 |
| 要件7 | error-handler, detailed-logger | エラーハンドリングとログ出力 |

すべてのテストが成功することで、ワンコマンドデプロイメント機能の品質が保証されます。
# 統合テスト

ワンコマンドデプロイメント機能の統合テストスクリプトです。

## 概要

このディレクトリには、ワンコマンドデプロイメント機能の全ワークフローを検証する統合テストが含まれています。テストは安全なモック環境で実行され、実際のAPIやデプロイメントは行いません。

## テストファイル

- `test_deployment_workflows.sh` - メインの統合テストスクリプト
- `run_integration_tests.sh` - 統合テスト実行用のヘルパースクリプト
- `README.md` - このファイル

## 実行方法

### 基本的な実行

```bash
# 統合テストの実行
./tests/integration/run_integration_tests.sh

# または直接実行
./tests/integration/test_deployment_workflows.sh
```

### オプション付き実行

```bash
# 詳細出力で実行
./tests/integration/run_integration_tests.sh --verbose

# キャッシュクリア後に実行
./tests/integration/run_integration_tests.sh --clean

# 静かに実行（エラーのみ表示）
./tests/integration/run_integration_tests.sh --quiet
```

## テスト内容

### 1. フルデプロイワークフローテスト
- 仮想環境の有効化
- データ収集の実行
- データコピーの実行
- Vercelデプロイの実行
- 全体の処理時間計測

### 2. データ準備のみワークフローテスト
- データ収集とコピーのみを実行
- 生成されたデータの検証
- 統計情報の表示確認

### 3. 環境指定デプロイテスト
- プレビュー環境へのデプロイ
- 本番環境デプロイの確認プロンプト
- 無効な環境指定のエラーハンドリング

### 4. エラーハンドリングテスト
- 仮想環境が存在しない場合の処理
- 依存関係が不足している場合の処理
- 適切なエラーメッセージの表示

### 5. ログ出力とレポート機能テスト
- ログファイルの生成確認
- 実行サマリーの出力確認
- エラー情報の記録確認

## モックデータ

テストでは以下のモックデータを使用します：

- **モック記事データ**: テスト用の記事情報（JSON形式）
- **モック設定ファイル**: テスト用のソース設定
- **モック版main.py**: 実際のAPI呼び出しを行わないデータ収集スクリプト
- **モック版Vercelデプロイ**: 実際のデプロイを行わないデプロイスクリプト

## テスト環境

テストは以下の環境で実行されます：

- **テストワークスペース**: `tests/integration/test_workspace`
- **モックデータディレクトリ**: `tests/integration/mock_data`
- **ログファイル**: `tests/integration/integration_test_YYYYMMDD_HHMMSS.log`

テスト完了後、これらの一時ファイルは自動的にクリーンアップされます。

## 前提条件

### 必須
- Python 3.x
- Bash 4.0以上

### 推奨
- `jq` - JSONファイルの検証用
- `timeout` - テストのタイムアウト制御用

### インストール例（macOS）

```bash
# Homebrewを使用
brew install jq coreutils

# または手動インストール
# jq: https://stedolan.github.io/jq/download/
# timeout: GNU coreutilsに含まれる
```

## トラブルシューティング

### よくある問題

1. **Python3が見つからない**
   ```
   [ERROR] Python3が見つかりません
   ```
   - Python 3.xをインストールしてください
   - パスが通っていることを確認してください

2. **権限エラー**
   ```
   Permission denied
   ```
   - スクリプトに実行権限を付与してください：
     ```bash
     chmod +x tests/integration/*.sh
     ```

3. **テストがタイムアウトする**
   - ネットワーク接続を確認してください
   - システムリソースの使用状況を確認してください
   - `--verbose`オプションで詳細を確認してください

### ログの確認

詳細なログは以下の場所に保存されます：
```
tests/integration/integration_test_YYYYMMDD_HHMMSS.log
```

エラーが発生した場合は、このログファイルを確認してください。

## 継続的インテグレーション

このテストはCI/CDパイプラインに組み込むことができます：

```yaml
# GitHub Actions例
- name: Run Integration Tests
  run: |
    ./tests/integration/run_integration_tests.sh --verbose
```

## 貢献

新しいテストケースを追加する場合は：

1. `test_deployment_workflows.sh`に新しいテスト関数を追加
2. メイン関数でテスト関数を呼び出し
3. 適切なエラーハンドリングを実装
4. このREADMEを更新

## 関連ドキュメント

- [ワンコマンドデプロイメント要件定義](../../.kiro/specs/one-command-deployment/requirements.md)
- [ワンコマンドデプロイメント設計書](../../.kiro/specs/one-command-deployment/design.md)
- [実装計画](../../.kiro/specs/one-command-deployment/tasks.md)
- [単体テスト](../unit/README.md)
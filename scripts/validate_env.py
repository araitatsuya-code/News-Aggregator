#!/usr/bin/env python3
"""
環境変数検証スクリプト
AI News Aggregator の実行に必要な環境変数をチェックする
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Optional


class EnvironmentValidator:
    """環境変数検証クラス"""
    
    def __init__(self):
        """初期化"""
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.project_root = Path(__file__).parent.parent
        
        # .envファイルを読み込み
        self.load_env_file()
        
    def validate_required_env_vars(self) -> bool:
        """必須環境変数の検証"""
        # AI APIキーのいずれかが必要
        ai_api_keys = {
            'OPENAI_API_KEY': 'OpenAI API キー',
            'CLAUDE_API_KEY': 'Claude API キー', 
            'ANTHROPIC_API_KEY': 'Anthropic API キー',
            'GEMINI_API_KEY': 'Google Gemini API キー',
        }
        
        required_vars = {
            'VERCEL_TOKEN': 'Vercel デプロイトークン（オプション）',
        }
        
        optional_vars = {
            'VERCEL_ORG_ID': 'Vercel 組織ID',
            'VERCEL_PROJECT_ID': 'Vercel プロジェクトID',
            'LOG_LEVEL': 'ログレベル（デフォルト: INFO）',
            'MAX_ARTICLES': '最大記事数（デフォルト: 50）',
            'CLAUDE_BATCH_SIZE': 'Claude バッチサイズ（デフォルト: 5）',
        }
        
        print("🔍 必須環境変数をチェック中...")
        
        # AI APIキーのチェック（いずれか1つは必要）
        ai_key_found = False
        print("🤖 AI APIキーをチェック中...")
        for var_name, description in ai_api_keys.items():
            value = os.getenv(var_name)
            if value:
                ai_key_found = True
                masked_value = value[:8] + '...' if len(value) > 8 else '***'
                print(f"✅ {var_name}: {masked_value} - {description}")
            else:
                print(f"ℹ️  {var_name}: 未設定 - {description}")
        
        if not ai_key_found:
            self.errors.append("❌ AI APIキーが設定されていません（OPENAI_API_KEY, CLAUDE_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY のいずれか1つは必要）")
            print("❌ AI APIキーが見つかりません")
        else:
            print("✅ AI APIキーが設定されています")
        
        # その他の必須変数のチェック
        for var_name, description in required_vars.items():
            value = os.getenv(var_name)
            if not value:
                if var_name == 'VERCEL_TOKEN':
                    self.warnings.append(f"⚠️  {var_name} が設定されていません（{description}）")
                    print(f"⚠️  {var_name}: 未設定 - {description}")
                else:
                    self.errors.append(f"❌ {var_name} が設定されていません（{description}）")
                    print(f"❌ {var_name}: 未設定 - {description}")
            else:
                # APIキーの場合は一部のみ表示
                if 'API_KEY' in var_name or 'TOKEN' in var_name:
                    masked_value = value[:8] + '...' if len(value) > 8 else '***'
                    print(f"✅ {var_name}: {masked_value} - {description}")
                else:
                    print(f"✅ {var_name}: {value} - {description}")
        
        # オプション変数のチェック
        print("\n🔧 オプション環境変数をチェック中...")
        for var_name, description in optional_vars.items():
            value = os.getenv(var_name)
            if value:
                print(f"✅ {var_name}: {value} - {description}")
            else:
                print(f"ℹ️  {var_name}: 未設定 - {description}")
        
        return len(self.errors) == 0
    
    def load_env_file(self):
        """環境変数ファイルを読み込み"""
        env_file = self.project_root / '.env'
        if env_file.exists():
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            key = key.strip()
                            value = value.strip()
                            # 既に環境変数が設定されていない場合のみ設定
                            if key and not os.getenv(key):
                                os.environ[key] = value
            except Exception as e:
                print(f"⚠️  .env ファイルの読み込みに失敗: {e}")
    
    def validate_env_file(self) -> bool:
        """環境設定ファイルの検証"""
        print("\n📄 環境設定ファイルをチェック中...")
        
        env_file = self.project_root / '.env'
        env_example = self.project_root / '.env.example'
        
        if not env_file.exists():
            if env_example.exists():
                self.warnings.append("⚠️  .env ファイルが見つかりません。.env.example をコピーして作成してください")
                print("⚠️  .env ファイルが見つかりません")
                print("💡 以下のコマンドで作成できます: cp .env.example .env")
            else:
                self.errors.append("❌ .env ファイルと .env.example ファイルが見つかりません")
                print("❌ .env ファイルと .env.example ファイルが見つかりません")
            return False
        else:
            print("✅ .env ファイルが存在します")
            
            # .envファイルの内容をチェック
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    env_content = f.read()
                
                # 重要な設定項目をチェック
                ai_keys = ['OPENAI_API_KEY', 'CLAUDE_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY']
                ai_key_found_in_file = False
                for key in ai_keys:
                    if f"{key}=" in env_content:
                        print(f"✅ {key} の設定が見つかりました")
                        ai_key_found_in_file = True
                
                if not ai_key_found_in_file:
                    self.warnings.append("⚠️  AI APIキーの設定が .env ファイルに見つかりません")
                    print("⚠️  AI APIキーの設定が見つかりません")
                
                other_important_keys = ['LOG_LEVEL', 'OUTPUT_PATH']
                for key in other_important_keys:
                    if f"{key}=" in env_content:
                        print(f"✅ {key} の設定が見つかりました")
                    else:
                        self.warnings.append(f"⚠️  {key} の設定が .env ファイルに見つかりません")
                        print(f"⚠️  {key} の設定が見つかりません")
                        
            except Exception as e:
                self.errors.append(f"❌ .env ファイルの読み込みに失敗: {e}")
                print(f"❌ .env ファイルの読み込みに失敗: {e}")
                return False
        
        return True
    
    def validate_directories(self) -> bool:
        """必要なディレクトリの検証"""
        print("\n📁 必要なディレクトリをチェック中...")
        
        required_dirs = [
            'scripts',
            'shared',
            'frontend',
            'logs',
            'frontend/public/data',
        ]
        
        all_exist = True
        for dir_path in required_dirs:
            full_path = self.project_root / dir_path
            if full_path.exists():
                print(f"✅ {dir_path} ディレクトリが存在します")
            else:
                print(f"⚠️  {dir_path} ディレクトリが見つかりません（自動作成します）")
                try:
                    full_path.mkdir(parents=True, exist_ok=True)
                    print(f"✅ {dir_path} ディレクトリを作成しました")
                except Exception as e:
                    self.errors.append(f"❌ {dir_path} ディレクトリの作成に失敗: {e}")
                    print(f"❌ {dir_path} ディレクトリの作成に失敗: {e}")
                    all_exist = False
        
        return all_exist
    
    def validate_python_dependencies(self) -> bool:
        """Python依存関係の検証"""
        print("\n🐍 Python依存関係をチェック中...")
        
        requirements_file = self.project_root / 'requirements.txt'
        if not requirements_file.exists():
            self.errors.append("❌ requirements.txt が見つかりません")
            print("❌ requirements.txt が見つかりません")
            return False
        
        print("✅ requirements.txt が存在します")
        
        # 重要なパッケージの確認
        try:
            import anthropic
            print("✅ anthropic パッケージがインストールされています")
        except ImportError:
            self.warnings.append("⚠️  anthropic パッケージがインストールされていません")
            print("⚠️  anthropic パッケージがインストールされていません")
            print("💡 pip install anthropic でインストールできます")
        
        try:
            import aiohttp
            print("✅ aiohttp パッケージがインストールされています")
        except ImportError:
            self.warnings.append("⚠️  aiohttp パッケージがインストールされていません")
            print("⚠️  aiohttp パッケージがインストールされていません")
        
        return True
    
    def validate_scripts(self) -> bool:
        """スクリプトファイルの検証"""
        print("\n📜 スクリプトファイルをチェック中...")
        
        required_scripts = [
            'scripts/core/main.py',
            'scripts/deploy/deploy-full.sh',
            'scripts/deploy/deploy-data-only.sh',
            'scripts/utils/parallel-processor.sh',
            'scripts/utils/deployment-optimizer.sh',
        ]
        
        all_exist = True
        for script_path in required_scripts:
            full_path = self.project_root / script_path
            if full_path.exists():
                print(f"✅ {script_path} が存在します")
                
                # 実行権限をチェック（.shファイルの場合）
                if script_path.endswith('.sh'):
                    if os.access(full_path, os.X_OK):
                        print(f"✅ {script_path} は実行可能です")
                    else:
                        self.warnings.append(f"⚠️  {script_path} に実行権限がありません")
                        print(f"⚠️  {script_path} に実行権限がありません")
                        print(f"💡 chmod +x {script_path} で実行権限を付与できます")
            else:
                self.errors.append(f"❌ {script_path} が見つかりません")
                print(f"❌ {script_path} が見つかりません")
                all_exist = False
        
        return all_exist
    
    def run_validation(self) -> bool:
        """全ての検証を実行"""
        print("🔍 AI News Aggregator 環境検証を開始します...\n")
        
        # 各検証を実行
        env_vars_ok = self.validate_required_env_vars()
        env_file_ok = self.validate_env_file()
        dirs_ok = self.validate_directories()
        deps_ok = self.validate_python_dependencies()
        scripts_ok = self.validate_scripts()
        
        # 結果サマリー
        print("\n" + "="*50)
        print("🔍 環境検証結果サマリー")
        print("="*50)
        
        if self.errors:
            print("\n❌ エラー:")
            for error in self.errors:
                print(f"  {error}")
        
        if self.warnings:
            print("\n⚠️  警告:")
            for warning in self.warnings:
                print(f"  {warning}")
        
        all_ok = env_vars_ok and env_file_ok and dirs_ok and deps_ok and scripts_ok
        
        if all_ok and not self.errors:
            print("\n✅ 環境検証が完了しました！")
            print("🚀 デプロイメントを実行できます")
            return True
        elif not self.errors:
            print("\n⚠️  警告がありますが、デプロイメントは実行可能です")
            return True
        else:
            print("\n❌ 環境検証に失敗しました")
            print("🔧 上記のエラーを修正してから再実行してください")
            return False


def main():
    """メイン処理"""
    validator = EnvironmentValidator()
    
    try:
        success = validator.run_validation()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  検証が中断されました")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 予期しないエラーが発生しました: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
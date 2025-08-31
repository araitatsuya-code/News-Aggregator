#!/usr/bin/env python3
"""
環境変数の検証スクリプト
Docker起動前に必要な環境変数が設定されているかチェックする
"""

import os
import sys
from typing import List, Dict, Optional
from pathlib import Path

# .envファイルの読み込み
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenvがインストールされていない場合は手動で.envファイルを読み込み
    env_file = Path('.env')
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# 必須環境変数の定義
REQUIRED_VARS = [
    "CLAUDE_API_KEY",
]

# オプション環境変数とデフォルト値
OPTIONAL_VARS = {
    "CLAUDE_MODEL": "claude-3-haiku-20240307",
    "CLAUDE_MAX_TOKENS": "1000",
    "CLAUDE_BATCH_SIZE": "5",
    "LOG_LEVEL": "INFO",
    "LOG_DIR": "logs",
    "OUTPUT_PATH": "frontend/public/data",
    "RETENTION_DAYS": "30",
    "MAX_RETRIES": "3",
    "RETRY_DELAY": "1.0",
    "PYTHONPATH": "/app",
    "NODE_ENV": "development",
    "NEXT_TELEMETRY_DISABLED": "1",
}

def validate_required_vars() -> List[str]:
    """必須環境変数の検証"""
    missing_vars = []
    
    for var in REQUIRED_VARS:
        value = os.getenv(var)
        if not value:
            # Docker Secretsファイルもチェック
            secret_file = os.getenv(f"{var}_FILE")
            if secret_file and Path(secret_file).exists():
                continue
            missing_vars.append(var)
        elif var == "CLAUDE_API_KEY":
            # Claude API キーの形式チェック
            if not value.startswith("sk-ant-api03-"):
                print(f"警告: {var} の形式が正しくない可能性があります")
    
    return missing_vars

def validate_optional_vars() -> Dict[str, str]:
    """オプション環境変数の検証とデフォルト値設定"""
    validated_vars = {}
    
    for var, default_value in OPTIONAL_VARS.items():
        value = os.getenv(var, default_value)
        validated_vars[var] = value
        
        # 特定の変数の値チェック
        if var == "LOG_LEVEL" and value not in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]:
            print(f"警告: {var}={value} は有効なログレベルではありません")
        elif var == "CLAUDE_BATCH_SIZE":
            try:
                batch_size = int(value)
                if batch_size < 1 or batch_size > 10:
                    print(f"警告: {var}={value} は推奨範囲(1-10)外です")
            except ValueError:
                print(f"エラー: {var}={value} は数値ではありません")
        elif var == "RETENTION_DAYS":
            try:
                days = int(value)
                if days < 1:
                    print(f"警告: {var}={value} は1以上である必要があります")
            except ValueError:
                print(f"エラー: {var}={value} は数値ではありません")
    
    return validated_vars

def validate_directories() -> List[str]:
    """必要なディレクトリの存在確認"""
    missing_dirs = []
    required_dirs = [
        "logs",
        "frontend/public/data",
        "scripts",
        "shared",
    ]
    
    for dir_path in required_dirs:
        if not Path(dir_path).exists():
            missing_dirs.append(dir_path)
    
    return missing_dirs

def validate_files() -> List[str]:
    """必要なファイルの存在確認"""
    missing_files = []
    required_files = [
        "requirements.txt",
        "scripts/main.py",
        "shared/config.py",
    ]
    
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
    
    return missing_files

def create_env_file_if_missing():
    """環境変数ファイルが存在しない場合は.env.exampleからコピー"""
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists() and env_example.exists():
        print("⚠️  .envファイルが見つかりません")
        print(f"📋 .env.exampleを参考に.envファイルを作成してください")
        print(f"💡 コマンド例: cp .env.example .env")
        return False
    
    return True

def main():
    """メイン検証処理"""
    print("🔍 AI News Aggregator 環境設定検証")
    print("=" * 50)
    
    # .envファイルの存在確認
    if not create_env_file_if_missing():
        sys.exit(1)
    
    # 必須環境変数の検証
    print("📋 必須環境変数の確認...")
    missing_required = validate_required_vars()
    if missing_required:
        print(f"❌ 以下の必須環境変数が設定されていません:")
        for var in missing_required:
            print(f"   - {var}")
        print("\n💡 .envファイルまたはDocker Secretsで設定してください")
        sys.exit(1)
    else:
        print("✅ 必須環境変数は正常に設定されています")
    
    # オプション環境変数の検証
    print("\n⚙️  オプション環境変数の確認...")
    validated_optional = validate_optional_vars()
    print("✅ オプション環境変数の検証完了")
    
    # ディレクトリの存在確認
    print("\n📁 必要なディレクトリの確認...")
    missing_dirs = validate_directories()
    if missing_dirs:
        print(f"⚠️  以下のディレクトリが存在しません（自動作成されます）:")
        for dir_path in missing_dirs:
            print(f"   - {dir_path}")
            Path(dir_path).mkdir(parents=True, exist_ok=True)
    print("✅ ディレクトリの確認完了")
    
    # ファイルの存在確認
    print("\n📄 必要なファイルの確認...")
    missing_files = validate_files()
    if missing_files:
        print(f"❌ 以下の必要なファイルが見つかりません:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        sys.exit(1)
    else:
        print("✅ 必要なファイルは全て存在します")
    
    print("\n🎉 環境設定の検証が完了しました！")
    print("🚀 Docker Composeを起動できます")
    
    # 推奨コマンドの表示
    print("\n💡 推奨起動コマンド:")
    print("   開発環境: docker compose --profile dev up --build")
    print("   本番環境: docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Claude APIキーの検証テスト
"""

import sys
import asyncio
import os
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

from anthropic import AsyncAnthropic


async def test_api_key():
    """APIキーの検証テスト"""
    print("🔑 Claude APIキーの検証テストを開始します")
    
    api_key = os.getenv('CLAUDE_API_KEY')
    
    if not api_key:
        print("❌ CLAUDE_API_KEY環境変数が設定されていません")
        return False
    
    print(f"📋 APIキーの形式: {api_key[:15]}...")
    print(f"📏 APIキーの長さ: {len(api_key)}文字")
    
    if not api_key.startswith('sk-ant-api03-'):
        print("❌ APIキーの形式が正しくありません")
        print("💡 正しい形式: sk-ant-api03-...")
        return False
    
    print("✅ APIキーの形式は正しいです")
    
    # 実際のAPI呼び出しテスト
    try:
        client = AsyncAnthropic(api_key=api_key)
        
        print("🧪 簡単なAPI呼び出しテストを実行します...")
        
        response = await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=50,
            messages=[
                {"role": "user", "content": "Hello! Please respond with just 'API test successful'."}
            ]
        )
        
        print("✅ API呼び出し成功!")
        print(f"📝 レスポンス: {response.content[0].text}")
        return True
        
    except Exception as e:
        print(f"❌ API呼び出し失敗: {e}")
        
        if "authentication_error" in str(e):
            print("💡 認証エラー: APIキーが無効または期限切れの可能性があります")
        elif "rate_limit" in str(e):
            print("💡 レート制限: しばらく待ってから再試行してください")
        else:
            print("💡 その他のエラー: ネットワーク接続を確認してください")
        
        return False


def main():
    """メイン関数"""
    print("🔧 Claude APIキー検証テスト")
    print("=" * 40)
    
    result = asyncio.run(test_api_key())
    
    print("\n" + "=" * 40)
    if result:
        print("🎉 APIキーの検証が成功しました!")
        print("💡 リアルAPIテストを実行できます:")
        print("   python scripts/test_real_api.py")
    else:
        print("❌ APIキーの検証に失敗しました")
        print("💡 以下を確認してください:")
        print("   1. Anthropic Consoleで有効なAPIキーを取得")
        print("   2. .envファイルに正しいAPIキーを設定")
        print("   3. APIキーの使用制限や残高を確認")


if __name__ == "__main__":
    main()
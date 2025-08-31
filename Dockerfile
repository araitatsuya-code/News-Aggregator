FROM python:3.11-slim

# 作業ディレクトリ設定
WORKDIR /app

# システム依存関係のインストール
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションファイルのコピー
COPY scripts/ ./scripts/
COPY shared/ ./shared/

# ログディレクトリ作成
RUN mkdir -p logs

# 出力ディレクトリ作成
RUN mkdir -p frontend/public/data

# 環境変数設定
ENV PYTHONPATH=/app
ENV LOG_LEVEL=INFO

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import sys; sys.exit(0)"

# メイン処理実行
CMD ["python", "scripts/main.py"]
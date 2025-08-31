# マルチステージビルドで最適化
FROM python:3.11-slim as base

# セキュリティ強化：非rootユーザーの作成
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 作業ディレクトリ設定
WORKDIR /app

# システム依存関係のインストール（最小限）
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 開発ステージ
FROM base as development

# 開発用の追加パッケージ
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係のインストール（開発用）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir pytest pytest-asyncio pytest-cov

# アプリケーションファイルのコピー
COPY --chown=appuser:appuser scripts/ ./scripts/
COPY --chown=appuser:appuser shared/ ./shared/
COPY --chown=appuser:appuser tests/ ./tests/

# 必要なディレクトリ作成
RUN mkdir -p logs frontend/public/data .cache \
    && chown -R appuser:appuser logs frontend/public/data .cache

# 本番ステージ
FROM base as production

# Python依存関係のインストール（本番用のみ）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip cache purge

# アプリケーションファイルのコピー
COPY --chown=appuser:appuser scripts/ ./scripts/
COPY --chown=appuser:appuser shared/ ./shared/

# 必要なディレクトリ作成
RUN mkdir -p logs frontend/public/data .cache \
    && chown -R appuser:appuser logs frontend/public/data .cache

# 環境変数設定
ENV PYTHONPATH=/app \
    LOG_LEVEL=INFO \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# 非rootユーザーに切り替え
USER appuser

# ヘルスチェック機能の強化
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD python -c "import sys; import os; import logging; \
  from pathlib import Path; \
  logs_exist = Path('/app/logs').exists(); \
  data_dir_exist = Path('/app/frontend/public/data').exists(); \
  sys.exit(0 if logs_exist and data_dir_exist else 1)"

# メイン処理実行
CMD ["python", "scripts/main.py"]
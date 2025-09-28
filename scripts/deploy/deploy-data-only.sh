#!/bin/bash

# データ準備専用スクリプト
# AI News Aggregator - Data Preparation Script
# 記事収集からデータコピーまでを実行する

set -e

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ユーティリティスクリプトを読み込み
source "$PROJECT_ROOT/scripts/utils/error-handler.sh"
source "$PROJECT_ROOT/scripts/utils/detailed-logger.sh"
source "$PROJECT_ROOT/scripts/utils/progress-logger.sh"
source "$PROJECT_ROOT/scripts/utils/time-tracker.sh"
source "$PROJECT_ROOT/scripts/utils/venv-manager.sh"
source "$PROJECT_ROOT/scripts/utils/parallel-processor.sh"
source "$PROJECT_ROOT/scripts/utils/deployment-optimizer.sh"

# デフォルト設定
VERBOSE_MODE=false
BACKUP_ENABLED=false
SKIP_VALIDATION=false
LOG_FILE="$PROJECT_ROOT/logs/deploy-data-$(date +%Y%m%d_%H%M%S).log"

# ヘルプ表示
show_help() {
    cat << EOF
AI News Aggregator - データ準備専用スクリプト

使用方法:
    $0 [オプション]

オプション:
    --verbose, -v           詳細ログを出力
    --backup, -b            既存データのバックアップを作成
    --skip-validation, -s   データ検証をスキップ
    --log-file <path>       ログファイルのパスを指定
    --help, -h              このヘルプを表示

説明:
    このスクリプトは記事収集からデータコピーまでを実行します。
    Vercelデプロイは実行されません。

例:
    $0                      # 基本実行
    $0 --verbose --backup   # 詳細ログとバックアップ付き
    $0 --skip-validation    # 検証スキップ

実行ステップ:
    1. 環境確認と仮想環境有効化
    2. データ収集（main.py実行）
    3. データコピー（latest.json更新）
    4. データ統計表示

EOF
}

# コマンドライン引数解析
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v)
                VERBOSE_MODE=true
                shift
                ;;
            --backup|-b)
                BACKUP_ENABLED=true
                shift
                ;;
            --skip-validation|-s)
                SKIP_VALIDATION=true
                shift
                ;;
            --log-file)
                if [[ -n "$2" ]] && [[ "$2" != -* ]]; then
                    LOG_FILE="$2"
                    shift 2
                else
                    log_error "ログファイルパスが指定されていません"
                    exit 1
                fi
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "不明なオプション: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 初期化処理
initialize() {
    # プロジェクトルートに移動
    cd "$PROJECT_ROOT"
    
    # ログ設定
    set_log_file "$LOG_FILE"
    
    if [[ "$VERBOSE_MODE" == "true" ]]; then
        set_log_level "debug"
    else
        set_log_level "info"
    fi
    
    # 時間トラッカー初期化
    init_time_tracker
    
    log_info "AI News Aggregator データ準備スクリプト開始"
    log_info "実行時刻: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "作業ディレクトリ: $PROJECT_ROOT"
    log_info "ログファイル: $LOG_FILE"
    
    if [[ "$VERBOSE_MODE" == "true" ]]; then
        log_info "詳細ログモード: 有効"
    fi
    
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        log_info "バックアップ機能: 有効"
    fi
    
    if [[ "$SKIP_VALIDATION" == "true" ]]; then
        log_info "データ検証: スキップ"
    fi
}

# 環境確認
check_environment() {
    log_info "環境確認を実行中..."
    
    # プロジェクトルートディレクトリの確認
    if [[ ! -f "requirements.txt" ]]; then
        log_error "プロジェクトルートディレクトリで実行してください（requirements.txtが見つかりません）"
        return 1
    fi
    
    # main.pyの存在確認
    if [[ ! -f "scripts/core/main.py" ]]; then
        log_error "scripts/core/main.py が見つかりません"
        return 1
    fi
    
    # 必要なディレクトリの確認
    local required_dirs=("shared" "frontend/public/data")
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_error "必要なディレクトリが見つかりません: $dir"
            return 1
        fi
    done
    
    log_success "環境確認完了"
    return 0
}

# 既存データのバックアップ作成
create_backup() {
    if [[ "$BACKUP_ENABLED" != "true" ]]; then
        log_debug "バックアップはスキップされました"
        return 0
    fi
    
    log_info "既存データのバックアップを作成中..."
    
    local backup_dir="backups/data-$(date +%Y%m%d_%H%M%S)"
    local data_dir="frontend/public/data"
    
    if [[ ! -d "$data_dir" ]]; then
        log_warn "バックアップ対象のデータディレクトリが存在しません: $data_dir"
        return 0
    fi
    
    # バックアップディレクトリを作成
    mkdir -p "$backup_dir"
    
    # データをコピー
    if cp -r "$data_dir"/* "$backup_dir/" 2>/dev/null; then
        log_success "バックアップを作成しました: $backup_dir"
        
        # バックアップサイズを表示
        local backup_size=$(du -sh "$backup_dir" | cut -f1)
        log_info "バックアップサイズ: $backup_size"
    else
        log_warn "バックアップの作成に失敗しました（データが存在しない可能性があります）"
    fi
    
    return 0
}

# データ収集を実行
execute_data_collection() {
    log_info "データ収集を開始中..."
    
    # Python環境の最終確認
    if ! command -v python3 >/dev/null 2>&1; then
        log_error "Python3が見つかりません"
        return 1
    fi
    
    # main.pyの実行
    log_info "記事収集・要約処理を実行中..."
    
    if [[ "$VERBOSE_MODE" == "true" ]]; then
        log_debug "実行コマンド: python3 scripts/core/main.py"
    fi
    
    # プログレスバーを表示しながら実行
    local main_py_pid=""
    
    # バックグラウンドでmain.pyを実行
    if [[ "$VERBOSE_MODE" == "true" ]]; then
        python3 scripts/core/main.py 2>&1 | tee -a "$LOG_FILE" &
        main_py_pid=$!
    else
        python3 scripts/core/main.py >> "$LOG_FILE" 2>&1 &
        main_py_pid=$!
    fi
    
    # プロセスの監視とプログレス表示
    local progress=0
    local dots=0
    
    while kill -0 "$main_py_pid" 2>/dev/null; do
        progress=$(( (progress + 2) % 100 ))
        show_progress $progress "記事収集・要約処理中..."
        sleep 2
        ((dots++))
        
        # 長時間実行の警告（10分以上）
        if [[ $dots -gt 300 ]]; then
            log_warn "データ収集が長時間実行されています（10分以上）"
            dots=0
        fi
    done
    
    # プロセスの終了状態を確認
    wait "$main_py_pid"
    local exit_code=$?
    
    finish_progress
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "データ収集が完了しました"
        return 0
    else
        log_error "データ収集に失敗しました（終了コード: $exit_code）"
        
        # エラーログの最後の部分を表示
        if [[ -f "$LOG_FILE" ]]; then
            log_error "エラーログの詳細:"
            tail -10 "$LOG_FILE" | while read -r line; do
                log_error "  $line"
            done
        fi
        
        return 1
    fi
}

# データコピーを実行
execute_data_copy() {
    log_info "データコピーを開始中..."
    
    # update_latest.pyの実行
    log_info "latest.jsonファイルを更新中..."
    
    if [[ "$VERBOSE_MODE" == "true" ]]; then
        log_debug "実行コマンド: python3 scripts/core/update_latest.py"
    fi
    
    if python3 scripts/core/update_latest.py >> "$LOG_FILE" 2>&1; then
        log_success "latest.jsonファイルの更新が完了しました"
    else
        log_error "latest.jsonファイルの更新に失敗しました"
        return 1
    fi
    
    # データファイルの存在確認
    local data_files=(
        "frontend/public/data/news/latest.json"
        "frontend/public/data/summaries/latest.json"
    )
    
    for file in "${data_files[@]}"; do
        if [[ -f "$file" ]]; then
            local file_size=$(du -h "$file" | cut -f1)
            log_info "確認: $file (サイズ: $file_size)"
        else
            log_warn "ファイルが見つかりません: $file"
        fi
    done
    
    return 0
}

# データ検証を実行（並列処理対応）
validate_generated_data() {
    if [[ "$SKIP_VALIDATION" == "true" ]]; then
        log_info "データ検証はスキップされました"
        return 0
    fi
    
    log_info "生成されたデータの検証中（並列処理）..."
    
    local validation_errors=0
    
    # 必須ファイルの存在確認
    local required_files=(
        "frontend/public/data/news/latest.json"
        "frontend/public/data/summaries/latest.json"
    )
    
    # 並列処理を初期化
    init_parallel_processor
    
    local job_count=0
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "必須ファイルが見つかりません: $file"
            ((validation_errors++))
        else
            # 並列JSON検証ジョブを追加
            local validate_command="python3 -m json.tool '$file' >/dev/null 2>&1"
            add_parallel_job "validate_$(basename "$file")" "$validate_command" "JSON検証: $(basename "$file")"
            ((job_count++))
        fi
    done
    
    # 全JSONファイルの並列検証
    log_info "全JSONファイルの並列検証を実行中..."
    if ! parallel_json_validation "frontend/public/data/**" "全データファイル検証"; then
        log_warn "一部のJSONファイル検証に失敗しました"
        show_parallel_results
        ((validation_errors++))
    fi
    
    # 最新の日付フォルダの確認
    local news_dir="frontend/public/data/news"
    if [[ -d "$news_dir" ]]; then
        local latest_date_folder=$(find "$news_dir" -maxdepth 1 -type d -name "????-??-??" | sort | tail -1)
        if [[ -n "$latest_date_folder" ]]; then
            log_info "最新データフォルダ: $(basename "$latest_date_folder")"
            
            # 記事数の確認
            local articles_file="$latest_date_folder/articles.json"
            if [[ -f "$articles_file" ]]; then
                local article_count=$(python3 -c "import json; print(len(json.load(open('$articles_file'))))" 2>/dev/null || echo "0")
                log_info "生成された記事数: $article_count"
                
                if [[ $article_count -eq 0 ]]; then
                    log_warn "記事が生成されていません"
                    ((validation_errors++))
                fi
            fi
        else
            log_error "日付フォルダが見つかりません"
            ((validation_errors++))
        fi
    fi
    
    if [[ $validation_errors -eq 0 ]]; then
        log_success "データ検証が完了しました"
        return 0
    else
        log_error "データ検証で $validation_errors 個のエラーが見つかりました"
        return 1
    fi
}

# データ統計を表示
show_data_statistics() {
    log_info "データ統計を生成中..."
    
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "データ統計情報"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 最新の日付フォルダを取得
    local news_dir="frontend/public/data/news"
    local summaries_dir="frontend/public/data/summaries"
    
    if [[ -d "$news_dir" ]]; then
        local latest_date_folder=$(find "$news_dir" -maxdepth 1 -type d -name "????-??-??" | sort | tail -1)
        
        if [[ -n "$latest_date_folder" ]]; then
            local date_name=$(basename "$latest_date_folder")
            echo "処理日時: $date_name"
            
            # 記事統計の表示
            show_article_statistics "$latest_date_folder"
            
            # カテゴリ別統計の表示
            show_category_statistics "$latest_date_folder"
            
            # ソース別統計の表示
            show_source_statistics "$latest_date_folder"
            
            # ファイルサイズ統計の表示
            show_file_size_statistics "$latest_date_folder"
            
        else
            echo "❌ 日付フォルダが見つかりません"
        fi
    else
        echo "❌ ニュースディレクトリが見つかりません: $news_dir"
    fi
    
    # サマリー統計の表示
    show_summary_statistics "$summaries_dir"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 記事統計を表示
show_article_statistics() {
    local date_folder="$1"
    local articles_file="$date_folder/articles.json"
    
    echo
    echo "📰 記事統計:"
    
    if [[ -f "$articles_file" ]]; then
        # Python を使用してJSONを解析し統計を取得
        local stats=$(python3 -c "
import json
import sys
from collections import Counter

try:
    with open('$articles_file', 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    total_count = len(articles)
    
    # 言語別統計
    languages = Counter()
    categories = Counter()
    sources = Counter()
    
    for article in articles:
        lang = article.get('language', 'unknown')
        languages[lang] += 1
        
        category = article.get('category', 'unknown')
        categories[category] += 1
        
        source = article.get('source', 'unknown')
        sources[source] += 1
    
    print(f'TOTAL:{total_count}')
    print('LANGUAGES:' + ','.join([f'{k}:{v}' for k, v in languages.most_common()]))
    
except Exception as e:
    print(f'ERROR:{e}', file=sys.stderr)
    sys.exit(1)
")
        
        if [[ $? -eq 0 ]]; then
            # 統計結果を解析して表示
            local total=$(echo "$stats" | grep "^TOTAL:" | cut -d: -f2)
            local languages=$(echo "$stats" | grep "^LANGUAGES:" | cut -d: -f2-)
            
            echo "  総記事数: $total"
            
            if [[ -n "$languages" ]]; then
                echo "  言語別:"
                IFS=',' read -ra LANG_ARRAY <<< "$languages"
                for lang_stat in "${LANG_ARRAY[@]}"; do
                    local lang=$(echo "$lang_stat" | cut -d: -f1)
                    local count=$(echo "$lang_stat" | cut -d: -f2)
                    echo "    $lang: $count 記事"
                done
            fi
            
        else
            echo "  ❌ 記事統計の取得に失敗しました"
        fi
    else
        echo "  ❌ articles.json が見つかりません"
    fi
}

# カテゴリ別統計を表示
show_category_statistics() {
    local date_folder="$1"
    local articles_file="$date_folder/articles.json"
    
    echo
    echo "📂 カテゴリ別統計:"
    
    if [[ -f "$articles_file" ]]; then
        local category_stats=$(python3 -c "
import json
from collections import Counter

try:
    with open('$articles_file', 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    categories = Counter()
    for article in articles:
        category = article.get('category', 'その他')
        categories[category] += 1
    
    for category, count in categories.most_common():
        print(f'  {category}: {count} 記事')
        
except Exception as e:
    print(f'  ❌ カテゴリ統計の取得に失敗: {e}')
")
        echo "$category_stats"
    else
        echo "  ❌ articles.json が見つかりません"
    fi
}

# ソース別統計を表示
show_source_statistics() {
    local date_folder="$1"
    local articles_file="$date_folder/articles.json"
    
    echo
    echo "🌐 ソース別統計:"
    
    if [[ -f "$articles_file" ]]; then
        local source_stats=$(python3 -c "
import json
from collections import Counter

try:
    with open('$articles_file', 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    sources = Counter()
    for article in articles:
        source = article.get('source', '不明')
        sources[source] += 1
    
    for source, count in sources.most_common():
        print(f'  {source}: {count} 記事')
        
except Exception as e:
    print(f'  ❌ ソース統計の取得に失敗: {e}')
")
        echo "$source_stats"
    else
        echo "  ❌ articles.json が見つかりません"
    fi
}

# ファイルサイズ統計を表示
show_file_size_statistics() {
    local date_folder="$1"
    
    echo
    echo "💾 ファイルサイズ統計:"
    
    local articles_file="$date_folder/articles.json"
    local metadata_file="$date_folder/metadata.json"
    
    if [[ -f "$articles_file" ]]; then
        local articles_size=$(du -h "$articles_file" | cut -f1)
        echo "  articles.json: $articles_size"
    fi
    
    if [[ -f "$metadata_file" ]]; then
        local metadata_size=$(du -h "$metadata_file" | cut -f1)
        echo "  metadata.json: $metadata_size"
    fi
    
    # latest.json のサイズ
    local latest_news="frontend/public/data/news/latest.json"
    if [[ -f "$latest_news" ]]; then
        local latest_size=$(du -h "$latest_news" | cut -f1)
        echo "  latest.json: $latest_size"
    fi
}

# サマリー統計を表示
show_summary_statistics() {
    local summaries_dir="$1"
    
    echo
    echo "📋 サマリー統計:"
    
    if [[ -d "$summaries_dir" ]]; then
        local latest_summary_date=$(find "$summaries_dir" -maxdepth 1 -name "????-??-??.json" | sort | tail -1)
        
        if [[ -n "$latest_summary_date" ]]; then
            local summary_file="$latest_summary_date"
            
            if [[ -f "$summary_file" ]]; then
                local summary_stats=$(python3 -c "
import json

try:
    with open('$summary_file', 'r', encoding='utf-8') as f:
        summary = json.load(f)
    
    # サマリーの基本情報
    date = summary.get('date', '不明')
    total_articles = summary.get('total_articles', 0)
    
    print(f'  処理日: {date}')
    print(f'  対象記事数: {total_articles}')
    
    # カテゴリ別サマリー
    categories = summary.get('categories', {})
    if categories:
        print('  カテゴリ別サマリー:')
        for category, data in categories.items():
            article_count = data.get('article_count', 0)
            print(f'    {category}: {article_count} 記事')
    
except Exception as e:
    print(f'  ❌ サマリー統計の取得に失敗: {e}')
")
                echo "$summary_stats"
                
                # サマリーファイルサイズ
                local summary_size=$(du -h "$summary_file" | cut -f1)
                echo "  サマリーファイルサイズ: $summary_size"
                
            else
                echo "  ❌ summary.json が見つかりません"
            fi
        else
            echo "  ❌ サマリーファイルが見つかりません"
        fi
        
        # latest summary のサイズ
        local latest_summary="$summaries_dir/latest.json"
        if [[ -f "$latest_summary" ]]; then
            local latest_summary_size=$(du -h "$latest_summary" | cut -f1)
            echo "  latest summary サイズ: $latest_summary_size"
        fi
    else
        echo "  ❌ サマリーディレクトリが見つかりません"
    fi
}

# JSON形式でデータ統計をエクスポート
export_data_statistics_json() {
    local output_file="$1"
    
    if [[ -z "$output_file" ]]; then
        output_file="data_statistics_$(date +%Y%m%d_%H%M%S).json"
    fi
    
    log_info "データ統計をJSON形式でエクスポート中: $output_file"
    
    local news_dir="frontend/public/data/news"
    local latest_date_folder=$(find "$news_dir" -maxdepth 1 -type d -name "????-??-??" | sort | tail -1)
    
    if [[ -n "$latest_date_folder" ]]; then
        local articles_file="$latest_date_folder/articles.json"
        
        python3 -c "
import json
import sys
from collections import Counter
from datetime import datetime

try:
    # 記事データの読み込み
    with open('$articles_file', 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    # 統計データの生成
    stats = {
        'generated_at': datetime.now().isoformat(),
        'date_folder': '$(basename "$latest_date_folder")',
        'total_articles': len(articles),
        'languages': {},
        'categories': {},
        'sources': {}
    }
    
    # 各種統計の計算
    languages = Counter()
    categories = Counter()
    sources = Counter()
    
    for article in articles:
        languages[article.get('language', 'unknown')] += 1
        categories[article.get('category', 'unknown')] += 1
        sources[article.get('source', 'unknown')] += 1
    
    stats['languages'] = dict(languages)
    stats['categories'] = dict(categories)
    stats['sources'] = dict(sources)
    
    # JSON出力
    with open('$output_file', 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    print('✅ 統計データをエクスポートしました: $output_file')
    
except Exception as e:
    print(f'❌ 統計データのエクスポートに失敗: {e}', file=sys.stderr)
    sys.exit(1)
"
    else
        log_error "日付フォルダが見つからないため、統計データをエクスポートできません"
        return 1
    fi
}

# メイン処理を実行
main() {
    # 引数解析
    parse_arguments "$@"
    
    # 初期化
    initialize
    
    # デプロイメント最適化を初期化
    init_deployment_optimizer
    
    # 総ステップ数を設定（バックアップ有無で調整）
    local total_steps=4
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        total_steps=5
    fi
    
    set_total_steps $total_steps
    start_workflow_timer
    
    # ステップ1: 環境確認と仮想環境有効化（最適化版）
    start_step "環境確認と仮想環境有効化"
    start_step_timer "環境確認"
    
    # データパイプライン最適化を実行
    if ! optimize_deployment_pipeline "data-only"; then
        log_warn "パイプライン最適化に失敗しましたが、処理を続行します"
    fi
    
    if ! check_environment; then
        fail_step "環境確認" "環境確認に失敗しました"
        exit 1
    fi
    
    if ! setup_and_verify_environment; then
        fail_step "仮想環境有効化" "仮想環境のセットアップに失敗しました"
        exit 1
    fi
    
    local step1_duration=$(end_step_timer "環境確認")
    complete_step "環境確認と仮想環境有効化" "$step1_duration"
    
    # ステップ2: バックアップ作成（オプション）
    if [[ "$BACKUP_ENABLED" == "true" ]]; then
        start_step "既存データのバックアップ作成"
        start_step_timer "バックアップ作成"
        
        if ! create_backup; then
            fail_step "バックアップ作成" "バックアップの作成に失敗しました"
            exit 1
        fi
        
        local step2_duration=$(end_step_timer "バックアップ作成")
        complete_step "既存データのバックアップ作成" "$step2_duration"
    fi
    
    # ステップ3: データ収集
    start_step "データ収集（記事取得・要約）"
    start_step_timer "データ収集"
    
    if ! execute_data_collection; then
        fail_step "データ収集" "データ収集に失敗しました"
        exit 1
    fi
    
    local step3_duration=$(end_step_timer "データ収集")
    complete_step "データ収集（記事取得・要約）" "$step3_duration"
    
    # ステップ4: データコピー
    start_step "データコピー（latest.json更新）"
    start_step_timer "データコピー"
    
    if ! execute_data_copy; then
        fail_step "データコピー" "データコピーに失敗しました"
        exit 1
    fi
    
    local step4_duration=$(end_step_timer "データコピー")
    complete_step "データコピー（latest.json更新）" "$step4_duration"
    
    # ステップ5: データ検証
    start_step "データ検証"
    start_step_timer "データ検証"
    
    if ! validate_generated_data; then
        fail_step "データ検証" "データ検証に失敗しました"
        exit 1
    fi
    
    local step5_duration=$(end_step_timer "データ検証")
    complete_step "データ検証" "$step5_duration"
    
    # 完了処理
    local total_duration=$(end_workflow_timer)
    
    log_success "データ準備が完了しました！"
    
    # データ統計を表示
    show_data_statistics
    
    # 実行時間統計を表示
    show_time_statistics
    
    # 最適化サマリーを表示
    show_optimization_summary
    
    # 次のステップの案内
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "データ準備完了"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    echo "次のステップ:"
    echo "1. Vercelデプロイを実行:"
    echo "   ./scripts/deploy/deploy-vercel.sh --prod"
    echo "   または"
    echo "   ./scripts/deploy/deploy-vercel.sh --preview"
    echo
    echo "オプション:"
    echo "- 統計データをJSONでエクスポート: export_data_statistics_json [ファイル名]"
    echo
}

# エラー時のクリーンアップ
cleanup() {
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        log_error "スクリプトがエラーで終了しました（終了コード: $exit_code）"
        show_interrupted_time
    fi
    
    cleanup_environment
    
    exit $exit_code
}

# シグナルハンドラーを設定
trap cleanup EXIT INT TERM

# メイン処理を実行
main "$@"
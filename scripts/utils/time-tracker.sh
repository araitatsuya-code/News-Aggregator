#!/bin/bash

# 時間トラッカー - 実行時間計測機能を提供する
# 要件4.1, 4.2, 4.3に対応

# ステップ情報を保存するファイル（一時的）
STEP_DATA_FILE="/tmp/time_tracker_$$"

# グローバル変数
WORKFLOW_START_TIME=""
WORKFLOW_END_TIME=""
TOTAL_STEPS=0
COMPLETED_STEPS=0

# 初期化処理
init_time_tracker() {
    # 一時ファイルを初期化
    echo "# ステップ名|開始時間|実行時間" > "$STEP_DATA_FILE"
}

# クリーンアップ処理
cleanup_time_tracker() {
    if [[ -f "$STEP_DATA_FILE" ]]; then
        rm -f "$STEP_DATA_FILE"
    fi
}

# 終了時のクリーンアップを設定
trap cleanup_time_tracker EXIT

# 現在時刻を秒で取得
get_current_time() {
    date +%s
}

# 現在時刻を人間が読める形式で取得
get_current_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# ワークフロー全体の開始時刻を記録
# 要件4.1に対応
start_workflow_timer() {
    WORKFLOW_START_TIME=$(get_current_time)
    echo "ワークフロー開始時刻: $(get_current_timestamp)"
    
    # ログファイルが設定されている場合は記録
    if [[ -n "$LOG_FILE" ]] && command -v log_info >/dev/null 2>&1; then
        log_info "ワークフロー開始 - $(get_current_timestamp)"
    fi
}

# ステップの開始時刻を記録
# 引数: ステップ名
# 要件4.2に対応
start_step_timer() {
    local step_name="$1"
    if [[ -z "$step_name" ]]; then
        echo "エラー: ステップ名が指定されていません" >&2
        return 1
    fi
    
    # 初期化されていない場合は初期化
    if [[ ! -f "$STEP_DATA_FILE" ]]; then
        init_time_tracker
    fi
    
    local start_time=$(get_current_time)
    
    # ステップ情報をファイルに記録
    echo "$step_name|$start_time|" >> "$STEP_DATA_FILE"
    
    # デバッグ情報
    if command -v log_debug >/dev/null 2>&1; then
        log_debug "ステップタイマー開始: $step_name"
    fi
}

# ステップの終了時刻を記録し、実行時間を計算
# 引数: ステップ名
# 戻り値: 実行時間（秒）
# 要件4.2に対応
end_step_timer() {
    local step_name="$1"
    if [[ -z "$step_name" ]]; then
        echo "エラー: ステップ名が指定されていません" >&2
        return 1
    fi
    
    if [[ ! -f "$STEP_DATA_FILE" ]]; then
        echo "エラー: ステップデータファイルが見つかりません" >&2
        return 1
    fi
    
    local end_time=$(get_current_time)
    
    # ステップの開始時間を検索
    local start_time=""
    local temp_file="/tmp/time_tracker_temp_$$"
    
    while IFS='|' read -r name start dur; do
        if [[ "$name" == "$step_name" ]] && [[ -z "$dur" ]]; then
            start_time="$start"
            local duration=$((end_time - start_time))
            # 実行時間を更新
            echo "$name|$start|$duration" >> "$temp_file"
        else
            echo "$name|$start|$dur" >> "$temp_file"
        fi
    done < "$STEP_DATA_FILE"
    
    mv "$temp_file" "$STEP_DATA_FILE"
    
    if [[ -z "$start_time" ]]; then
        echo "エラー: ステップ '$step_name' の開始時刻が記録されていません" >&2
        return 1
    fi
    
    local duration=$((end_time - start_time))
    ((COMPLETED_STEPS++))
    
    # 実行時間を表示
    local formatted_duration=$(format_duration $duration)
    echo "ステップ '$step_name' 実行時間: $formatted_duration"
    
    # ログ出力
    if command -v log_info >/dev/null 2>&1; then
        log_info "ステップ完了: $step_name (実行時間: ${formatted_duration})"
    fi
    
    # 実行時間を返す
    echo $duration
}

# ワークフロー全体の終了時刻を記録し、総実行時間を計算
# 戻り値: 総実行時間（秒）
# 要件4.3に対応
end_workflow_timer() {
    WORKFLOW_END_TIME=$(get_current_time)
    
    if [[ -z "$WORKFLOW_START_TIME" ]]; then
        echo "エラー: ワークフローの開始時刻が記録されていません" >&2
        return 1
    fi
    
    local total_duration=$((WORKFLOW_END_TIME - WORKFLOW_START_TIME))
    local formatted_duration=$(format_duration $total_duration)
    
    echo
    echo "ワークフロー終了時刻: $(get_current_timestamp)"
    echo "総実行時間: $formatted_duration"
    
    # ログ出力
    if command -v log_info >/dev/null 2>&1; then
        log_info "ワークフロー完了 - 総実行時間: ${formatted_duration}"
    fi
    
    # 総実行時間を返す
    echo $total_duration
}

# 処理が中断された場合の実行時間を表示
# 要件4.4に対応
show_interrupted_time() {
    local current_time=$(get_current_time)
    
    if [[ -z "$WORKFLOW_START_TIME" ]]; then
        echo "ワークフローの開始時刻が記録されていません"
        return 1
    fi
    
    local elapsed_time=$((current_time - WORKFLOW_START_TIME))
    local formatted_duration=$(format_duration $elapsed_time)
    
    echo
    echo "処理が中断されました"
    echo "中断時刻: $(get_current_timestamp)"
    echo "中断までの実行時間: $formatted_duration"
    
    # ログ出力
    if command -v log_warn >/dev/null 2>&1; then
        log_warn "処理中断 - 実行時間: ${formatted_duration}"
    fi
}

# 秒数を人間が読みやすい形式にフォーマット
# 引数: 秒数
# 戻り値: フォーマット済み文字列（例: "1時間23分45秒"）
format_duration() {
    local total_seconds="$1"
    
    if [[ ! "$total_seconds" =~ ^[0-9]+$ ]]; then
        echo "無効な秒数: $total_seconds"
        return 1
    fi
    
    local hours=$((total_seconds / 3600))
    local minutes=$(((total_seconds % 3600) / 60))
    local seconds=$((total_seconds % 60))
    
    local result=""
    
    if [[ $hours -gt 0 ]]; then
        result="${hours}時間"
    fi
    
    if [[ $minutes -gt 0 ]]; then
        result="${result}${minutes}分"
    fi
    
    if [[ $seconds -gt 0 ]] || [[ -z "$result" ]]; then
        result="${result}${seconds}秒"
    fi
    
    echo "$result"
}

# 実行時間の統計情報を表示
show_time_statistics() {
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "実行時間統計"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # ワークフロー全体の時間
    if [[ -n "$WORKFLOW_START_TIME" ]] && [[ -n "$WORKFLOW_END_TIME" ]]; then
        local total_duration=$((WORKFLOW_END_TIME - WORKFLOW_START_TIME))
        echo "総実行時間: $(format_duration $total_duration)"
    fi
    
    # 各ステップの実行時間
    if [[ -f "$STEP_DATA_FILE" ]]; then
        echo
        echo "ステップ別実行時間:"
        local step_total=0
        local step_count=0
        
        while IFS='|' read -r name start duration; do
            # ヘッダー行をスキップ
            [[ "$name" == "# ステップ名" ]] && continue
            
            if [[ -n "$duration" ]] && [[ "$duration" != "" ]]; then
                printf "  %-30s %s\n" "$name:" "$(format_duration $duration)"
                step_total=$((step_total + duration))
                ((step_count++))
            fi
        done < "$STEP_DATA_FILE"
        
        if [[ $step_count -gt 0 ]]; then
            echo
            echo "ステップ合計時間: $(format_duration $step_total)"
            
            # オーバーヘッド計算
            if [[ -n "$WORKFLOW_START_TIME" ]] && [[ -n "$WORKFLOW_END_TIME" ]]; then
                local total_duration=$((WORKFLOW_END_TIME - WORKFLOW_START_TIME))
                local overhead=$((total_duration - step_total))
                if [[ $overhead -gt 0 ]]; then
                    echo "オーバーヘッド時間: $(format_duration $overhead)"
                fi
            fi
        fi
    fi
    
    echo "完了ステップ数: $COMPLETED_STEPS"
    if [[ $TOTAL_STEPS -gt 0 ]]; then
        echo "総ステップ数: $TOTAL_STEPS"
        local completion_rate=$((COMPLETED_STEPS * 100 / TOTAL_STEPS))
        echo "完了率: ${completion_rate}%"
    fi
}

# パフォーマンス分析を表示
show_performance_analysis() {
    if [[ ! -f "$STEP_DATA_FILE" ]]; then
        echo "パフォーマンス分析: データがありません"
        return
    fi
    
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "パフォーマンス分析"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 最も時間のかかったステップ
    local slowest_step=""
    local slowest_duration=0
    
    # 最も速かったステップ
    local fastest_step=""
    local fastest_duration=999999
    
    # 平均実行時間の計算
    local total_duration=0
    local step_count=0
    
    while IFS='|' read -r name start duration; do
        # ヘッダー行をスキップ
        [[ "$name" == "# ステップ名" ]] && continue
        
        if [[ -n "$duration" ]] && [[ "$duration" != "" ]] && [[ "$duration" =~ ^[0-9]+$ ]]; then
            total_duration=$((total_duration + duration))
            step_count=$((step_count + 1))
            
            if [[ $duration -gt $slowest_duration ]]; then
                slowest_duration=$duration
                slowest_step="$name"
            fi
            
            if [[ $duration -lt $fastest_duration ]]; then
                fastest_duration=$duration
                fastest_step="$name"
            fi
        fi
    done < "$STEP_DATA_FILE"
    
    if [[ $step_count -eq 0 ]]; then
        echo "パフォーマンス分析: 完了したステップがありません"
        return
    fi
    
    local average_duration=$((total_duration / step_count))
    
    echo "最も時間のかかったステップ: $slowest_step ($(format_duration $slowest_duration))"
    echo "最も速かったステップ: $fastest_step ($(format_duration $fastest_duration))"
    echo "平均実行時間: $(format_duration $average_duration)"
    
    # 改善提案
    echo
    echo "改善提案:"
    if [[ $slowest_duration -gt $((average_duration * 2)) ]]; then
        echo "  • '$slowest_step' の実行時間が平均の2倍以上です。最適化を検討してください。"
    fi
    
    if [[ $step_count -gt 1 ]]; then
        local time_variance=$((slowest_duration - fastest_duration))
        if [[ $time_variance -gt $((average_duration * 3)) ]]; then
            echo "  • ステップ間の実行時間のばらつきが大きいです。並列処理を検討してください。"
        fi
    fi
}

# 総ステップ数を設定
set_total_steps() {
    TOTAL_STEPS="$1"
    COMPLETED_STEPS=0
}

# 実行時間をJSON形式で出力
export_time_data_json() {
    local output_file="$1"
    
    if [[ -z "$output_file" ]]; then
        output_file="/dev/stdout"
    fi
    
    local total_duration=0
    if [[ -n "$WORKFLOW_START_TIME" ]] && [[ -n "$WORKFLOW_END_TIME" ]]; then
        total_duration=$((WORKFLOW_END_TIME - WORKFLOW_START_TIME))
    fi
    
    cat > "$output_file" << EOF
{
  "workflow": {
    "start_time": "${WORKFLOW_START_TIME}",
    "end_time": "${WORKFLOW_END_TIME}",
    "total_duration": ${total_duration},
    "completed_steps": ${COMPLETED_STEPS},
    "total_steps": ${TOTAL_STEPS}
  },
  "steps": {
EOF
    
    if [[ -f "$STEP_DATA_FILE" ]]; then
        local first=true
        while IFS='|' read -r name start duration; do
            # ヘッダー行をスキップ
            [[ "$name" == "# ステップ名" ]] && continue
            
            if [[ -n "$duration" ]] && [[ "$duration" != "" ]]; then
                if [[ "$first" == "true" ]]; then
                    first=false
                else
                    echo "," >> "$output_file"
                fi
                
                local end_time=$((start + duration))
                
                cat >> "$output_file" << EOF
    "${name}": {
      "start_time": ${start},
      "end_time": ${end_time},
      "duration": ${duration}
    }
EOF
            fi
        done < "$STEP_DATA_FILE"
    fi
    
    cat >> "$output_file" << EOF

  }
}
EOF
}

# ヘルプメッセージを表示
show_help() {
    cat << EOF
時間トラッカー - 実行時間計測機能

使用方法:
  source time-tracker.sh

主要関数:
  start_workflow_timer          - ワークフロー全体のタイマーを開始
  end_workflow_timer           - ワークフロー全体のタイマーを終了
  
  start_step_timer <name>      - ステップのタイマーを開始
  end_step_timer <name>        - ステップのタイマーを終了
  
  show_interrupted_time        - 中断時の実行時間を表示
  format_duration <seconds>    - 秒数を人間が読める形式に変換
  
  show_time_statistics         - 実行時間統計を表示
  show_performance_analysis    - パフォーマンス分析を表示
  export_time_data_json [file] - 実行時間データをJSON形式で出力

例:
  start_workflow_timer
  start_step_timer "データ収集"
  # ... 処理実行 ...
  end_step_timer "データ収集"
  end_workflow_timer
  show_time_statistics
EOF
}

# 割り込みシグナル（Ctrl+C）をキャッチして中断時間を表示
trap 'show_interrupted_time; exit 1' INT TERM

# スクリプトが直接実行された場合はヘルプを表示
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    show_help
fi
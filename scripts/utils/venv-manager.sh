#!/bin/bash

# 仮想環境マネージャー - 仮想環境の検出と有効化機能を提供する
# 要件5.1, 5.2, 5.3, 5.4に対応

# 仮想環境のパス候補
readonly VENV_PATHS=(
    "venv"
    ".venv"
    "env"
    ".env"
    "virtualenv"
)

# Python実行ファイルの候補
readonly PYTHON_COMMANDS=(
    "python3"
    "python"
)

# グローバル変数
DETECTED_VENV_PATH=""
ORIGINAL_VIRTUAL_ENV=""
VENV_ACTIVATED=false

# 仮想環境の存在を確認する
# 要件5.1に対応
detect_virtual_environment() {
    log_debug "仮想環境の検出を開始します"
    
    for venv_path in "${VENV_PATHS[@]}"; do
        if [[ -d "$venv_path" ]]; then
            # activate スクリプトの存在確認
            local activate_script="$venv_path/bin/activate"
            if [[ -f "$activate_script" ]]; then
                DETECTED_VENV_PATH="$venv_path"
                log_info "仮想環境を検出しました: $venv_path"
                return 0
            else
                log_debug "ディレクトリ '$venv_path' は存在しますが、activate スクリプトがありません"
            fi
        fi
    done
    
    log_warn "仮想環境が見つかりませんでした"
    return 1
}

# 仮想環境を有効化する
# 要件5.2に対応
activate_virtual_environment() {
    if [[ -z "$DETECTED_VENV_PATH" ]]; then
        log_error "仮想環境のパスが設定されていません。先に detect_virtual_environment を実行してください"
        return 1
    fi
    
    local activate_script="$DETECTED_VENV_PATH/bin/activate"
    
    if [[ ! -f "$activate_script" ]]; then
        log_error "activate スクリプトが見つかりません: $activate_script"
        return 1
    fi
    
    # 既に仮想環境が有効化されているかチェック
    if [[ -n "$VIRTUAL_ENV" ]]; then
        log_info "既に仮想環境が有効化されています: $VIRTUAL_ENV"
        
        # 検出した仮想環境と現在の仮想環境が同じかチェック
        local current_venv_name=$(basename "$VIRTUAL_ENV")
        local detected_venv_name=$(basename "$(realpath "$DETECTED_VENV_PATH")")
        
        if [[ "$current_venv_name" == "$detected_venv_name" ]]; then
            log_info "正しい仮想環境が既に有効化されています"
            VENV_ACTIVATED=true
            return 0
        else
            log_warn "異なる仮想環境が有効化されています。切り替えます..."
            deactivate_virtual_environment
        fi
    fi
    
    # 現在の VIRTUAL_ENV を保存
    ORIGINAL_VIRTUAL_ENV="$VIRTUAL_ENV"
    
    # 仮想環境を有効化
    log_info "仮想環境を有効化しています: $DETECTED_VENV_PATH"
    
    # activate スクリプトを実行
    source "$activate_script"
    
    if [[ $? -eq 0 ]] && [[ -n "$VIRTUAL_ENV" ]]; then
        log_success "仮想環境の有効化に成功しました: $VIRTUAL_ENV"
        VENV_ACTIVATED=true
        return 0
    else
        log_error "仮想環境の有効化に失敗しました"
        return 1
    fi
}

# 仮想環境を無効化する
deactivate_virtual_environment() {
    if [[ "$VENV_ACTIVATED" == "true" ]] && command -v deactivate >/dev/null 2>&1; then
        log_info "仮想環境を無効化しています"
        deactivate
        VENV_ACTIVATED=false
        log_info "仮想環境を無効化しました"
    fi
}

# Python環境を検証する
# 要件5.3に対応
verify_python_environment() {
    log_info "Python環境の検証を開始します"
    
    # Python コマンドの存在確認
    local python_cmd=""
    for cmd in "${PYTHON_COMMANDS[@]}"; do
        if command -v "$cmd" >/dev/null 2>&1; then
            python_cmd="$cmd"
            break
        fi
    done
    
    if [[ -z "$python_cmd" ]]; then
        log_error "Python が見つかりません。Python をインストールしてください"
        return 1
    fi
    
    # Python バージョンの確認
    local python_version=$($python_cmd --version 2>&1)
    log_info "Python バージョン: $python_version"
    
    # Python 3.6 以上かチェック
    local version_number=$($python_cmd -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    local major_version=$(echo "$version_number" | cut -d. -f1)
    local minor_version=$(echo "$version_number" | cut -d. -f2)
    
    if [[ $major_version -lt 3 ]] || [[ $major_version -eq 3 && $minor_version -lt 6 ]]; then
        log_error "Python 3.6 以上が必要です。現在のバージョン: $version_number"
        return 1
    fi
    
    # 仮想環境内のPythonかチェック
    if [[ -n "$VIRTUAL_ENV" ]]; then
        local python_path=$($python_cmd -c "import sys; print(sys.executable)")
        if [[ "$python_path" == "$VIRTUAL_ENV"* ]]; then
            log_success "仮想環境内のPythonを使用しています: $python_path"
        else
            log_warn "仮想環境外のPythonを使用している可能性があります: $python_path"
        fi
    else
        log_warn "仮想環境が有効化されていません"
    fi
    
    return 0
}

# 依存関係をチェックする
# 要件5.4に対応
check_dependencies() {
    log_info "依存関係のチェックを開始します"
    
    # requirements.txt の存在確認
    if [[ ! -f "requirements.txt" ]]; then
        log_warn "requirements.txt が見つかりません"
        return 1
    fi
    
    # Python コマンドの取得
    local python_cmd=""
    for cmd in "${PYTHON_COMMANDS[@]}"; do
        if command -v "$cmd" >/dev/null 2>&1; then
            python_cmd="$cmd"
            break
        fi
    done
    
    if [[ -z "$python_cmd" ]]; then
        log_error "Python が見つかりません"
        return 1
    fi
    
    # pip の存在確認
    if ! $python_cmd -m pip --version >/dev/null 2>&1; then
        log_error "pip が見つかりません。pip をインストールしてください"
        return 1
    fi
    
    log_info "requirements.txt の依存関係をチェックしています..."
    
    # 依存関係の確認
    local missing_packages=()
    local outdated_packages=()
    
    while IFS= read -r line; do
        # コメント行と空行をスキップ
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue
        
        # パッケージ名を抽出（バージョン指定を除去）
        local package_spec="$line"
        local package_name=$(echo "$package_spec" | sed 's/[>=<!=].*//' | tr -d '[:space:]')
        
        if [[ -n "$package_name" ]]; then
            # パッケージがインストールされているかチェック
            if ! $python_cmd -c "import $package_name" >/dev/null 2>&1; then
                # パッケージ名にハイフンが含まれる場合はアンダースコアに変換して再試行
                local alt_package_name=$(echo "$package_name" | tr '-' '_')
                if ! $python_cmd -c "import $alt_package_name" >/dev/null 2>&1; then
                    missing_packages+=("$package_spec")
                fi
            fi
        fi
    done < requirements.txt
    
    # 結果の表示
    if [[ ${#missing_packages[@]} -eq 0 ]]; then
        log_success "すべての依存関係が満たされています"
        return 0
    else
        log_error "不足している依存関係があります:"
        for package in "${missing_packages[@]}"; do
            log_error "  - $package"
        done
        
        echo
        echo "依存関係をインストールするには以下のコマンドを実行してください:"
        echo "  $python_cmd -m pip install -r requirements.txt"
        
        return 1
    fi
}

# 仮想環境のセットアップ手順を表示
# 要件5.3に対応（エラー時の対処法提示）
show_venv_setup_instructions() {
    cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
仮想環境セットアップ手順
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

仮想環境が見つからない場合は、以下の手順で作成してください:

1. 仮想環境の作成:
   python3 -m venv venv

2. 仮想環境の有効化:
   source venv/bin/activate

3. 依存関係のインストール:
   pip install -r requirements.txt

4. 再度デプロイスクリプトを実行:
   ./scripts/deploy-full.sh

注意: 
- Python 3.6 以上が必要です
- pip が最新版であることを確認してください: pip install --upgrade pip

EOF
}

# 仮想環境の完全なセットアップと検証を実行
setup_and_verify_environment() {
    log_info "仮想環境のセットアップと検証を開始します"
    
    # 1. 仮想環境の検出
    if ! detect_virtual_environment; then
        log_error "仮想環境が見つかりません"
        show_venv_setup_instructions
        return 1
    fi
    
    # 2. 仮想環境の有効化
    if ! activate_virtual_environment; then
        log_error "仮想環境の有効化に失敗しました"
        return 1
    fi
    
    # 3. Python環境の検証
    if ! verify_python_environment; then
        log_error "Python環境の検証に失敗しました"
        return 1
    fi
    
    # 4. 依存関係のチェック
    if ! check_dependencies; then
        log_error "依存関係のチェックに失敗しました"
        return 1
    fi
    
    log_success "仮想環境のセットアップと検証が完了しました"
    return 0
}

# 環境情報を表示
show_environment_info() {
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "環境情報"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 仮想環境の状態
    if [[ -n "$VIRTUAL_ENV" ]]; then
        echo "仮想環境: 有効 ($VIRTUAL_ENV)"
    else
        echo "仮想環境: 無効"
    fi
    
    # Python情報
    for cmd in "${PYTHON_COMMANDS[@]}"; do
        if command -v "$cmd" >/dev/null 2>&1; then
            local python_version=$($cmd --version 2>&1)
            local python_path=$(which "$cmd")
            echo "Python ($cmd): $python_version ($python_path)"
            break
        fi
    done
    
    # pip情報
    if command -v pip >/dev/null 2>&1; then
        local pip_version=$(pip --version 2>&1)
        echo "pip: $pip_version"
    fi
    
    # 作業ディレクトリ
    echo "作業ディレクトリ: $(pwd)"
    
    # requirements.txt の存在
    if [[ -f "requirements.txt" ]]; then
        local req_count=$(grep -v '^#' requirements.txt | grep -v '^[[:space:]]*$' | wc -l)
        echo "requirements.txt: 存在 (${req_count}個のパッケージ)"
    else
        echo "requirements.txt: 存在しない"
    fi
}

# クリーンアップ処理
cleanup_environment() {
    if [[ "$VENV_ACTIVATED" == "true" ]]; then
        log_info "環境のクリーンアップを実行します"
        deactivate_virtual_environment
    fi
}

# ヘルプメッセージを表示
show_help() {
    cat << EOF
仮想環境マネージャー - 仮想環境の検出と有効化機能

使用方法:
  source venv-manager.sh

主要関数:
  detect_virtual_environment       - 仮想環境を検出
  activate_virtual_environment     - 仮想環境を有効化
  deactivate_virtual_environment   - 仮想環境を無効化
  
  verify_python_environment        - Python環境を検証
  check_dependencies              - 依存関係をチェック
  
  setup_and_verify_environment    - 完全なセットアップと検証を実行
  show_environment_info           - 環境情報を表示
  show_venv_setup_instructions    - セットアップ手順を表示
  
  cleanup_environment             - クリーンアップ処理

例:
  setup_and_verify_environment
  show_environment_info

注意:
  このスクリプトは source コマンドで読み込んで使用してください。
  直接実行すると仮想環境の有効化が正しく動作しません。
EOF
}

# 終了時のクリーンアップを設定
trap cleanup_environment EXIT

# スクリプトが直接実行された場合は警告とヘルプを表示
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "警告: このスクリプトは source コマンドで読み込んで使用してください。"
    echo "例: source scripts/utils/venv-manager.sh"
    echo
    show_help
fi
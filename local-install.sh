#!/bin/bash

# Qwen Code (no-telemetry) local installer
#
# All files installed locally in $HOME — no root, no sudo, no system packages.
# Safe to use in ephemeral Docker containers (--rm).
#
# Usage:
#   bash local-install.sh
#
# This script builds and installs from the CURRENT repository directory.
#

if [[ -z "${BASH_VERSION}" ]]; then
    exec bash "${0}" "${@}"
fi

export GIT_PAGER=cat
export PAGER=cat
set -o pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
NVM_VERSION="v0.40.3"
NODE_VERSION="20"
NPM_PREFIX="${HOME}/.npm-global"   # npm global prefix — stays in $HOME
NVM_DIR="${HOME}/.nvm"             # NVM install dir   — stays in $HOME

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
usage() {
    echo "Usage: $0"
    echo ""
    echo "This script builds and installs Qwen Code from the CURRENT directory."
    echo ""
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h) usage ;;
        *)         echo "Error: Unknown argument: $1"; usage ;;
    esac
done

UPDATING=false
# Check both system PATH and the npm-global bin where qwen lives after install
if command -v qwen >/dev/null 2>&1 || [[ -x "${HOME}/.npm-global/bin/qwen" ]]; then
    UPDATING=true
fi

# Get the current directory as the source
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_URL="file://${SCRIPT_DIR}"

echo "==========================================="
echo " Qwen Code (no-telemetry) Installer"
echo "==========================================="
echo "  Source Dir : ${SCRIPT_DIR}"
echo "  NVM dir    : ${NVM_DIR}"
echo "  npm prefix : ${NPM_PREFIX}}"
[[ "${UPDATING}" == "true"  ]] && echo "  Mode       : update"
echo "==========================================="
echo ""

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
command_exists() { command -v "$1" >/dev/null 2>&1; }

# ---------------------------------------------------------------------------
# Ensure curl is available (only tool we need from the system)
# ---------------------------------------------------------------------------
ensure_curl() {
    command_exists curl && return 0
    echo "✗ curl is required but not found."
    echo "  Install it with your system package manager (e.g. apt-get install -y curl)"
    echo "  curl is the only system dependency — everything else installs into \$HOME."
    exit 1
}

# ---------------------------------------------------------------------------
# Install Node.js via NVM into $HOME/.nvm  (no root needed)
# ---------------------------------------------------------------------------
install_nodejs() {
    export NVM_DIR="${NVM_DIR}"

    # Install NVM if missing
    if [[ ! -s "${NVM_DIR}/nvm.sh" ]]; then
        echo "Installing NVM ${NVM_VERSION} into ${NVM_DIR}..."
        ensure_curl
        # PROFILE=/dev/null: prevent NVM from writing to shell config — we do it ourselves
        curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" \
            | NVM_DIR="${NVM_DIR}" PROFILE=/dev/null bash 2>&1 | grep -v "^=> Profile\|^=> Create\|^=> Append\|^=> Close\|^   OR\|^export NVM\|^\[ -s\|^nvm use" \
            || { echo "✗ NVM installation failed"; exit 1; }
        echo "✓ NVM installed"
    else
        echo "✓ NVM already present"
    fi

    # NVM refuses to load if ~/.npmrc has `prefix` or `globalconfig` set.
    # Wipe any npmrc files that could contain these settings before loading NVM.
    for _npmrc in "${HOME}/.npmrc" "${HOME}/.npm/etc/npmrc"; do
        [[ -f "${_npmrc}" ]] && sed -i '/^prefix/d; /^globalconfig/d' "${_npmrc}" 2>/dev/null || true
    done
    # Also unset via environment so NVM is satisfied even if npmrc is cached
    unset npm_config_prefix npm_config_globalconfig 2>/dev/null || true

    # Load NVM into current shell
    \. "${NVM_DIR}/nvm.sh" || { echo "✗ Failed to load NVM"; exit 1; }

    # Now tell NVM to delete the prefix from its own tracking too
    nvm use --delete-prefix "${NODE_VERSION}" --silent 2>/dev/null || true

    # Install Node if missing or too old
    local need_install=false
    if command_exists node; then
        local maj
        maj=$(node --version | sed 's/v//' | cut -d. -f1)
        if [[ "${maj}" =~ ^[0-9]+$ ]] && [[ "${maj}" -ge 20 ]]; then
            echo "✓ Node.js $(node --version) already installed"
        else
            echo "⚠ Node.js $(node --version) too old — installing v${NODE_VERSION}"
            need_install=true
        fi
    else
        echo "Node.js not found — installing v${NODE_VERSION} via NVM..."
        need_install=true
    fi

    if [[ "${need_install}" == "true" ]]; then
        nvm install "${NODE_VERSION}" >/dev/null 2>&1 \
            || { echo "✗ Failed to install Node.js ${NODE_VERSION}"; exit 1; }
        echo "✓ Node.js $(node --version) installed"
    fi

    nvm use "${NODE_VERSION}"      >/dev/null 2>&1
    nvm alias default "${NODE_VERSION}" >/dev/null 2>&1

    command_exists npm || { echo "✗ npm not found after Node install"; exit 1; }
    echo "✓ npm $(npm --version) available"
}

# ---------------------------------------------------------------------------
# Configure npm to use a prefix inside $HOME (no root needed for -g installs)
# ---------------------------------------------------------------------------
configure_npm_prefix() {
    mkdir -p "${NPM_PREFIX}/bin" "${NPM_PREFIX}/lib"
    npm config set prefix "${NPM_PREFIX}"
    export PATH="${NPM_PREFIX}/bin:${PATH}"
    echo "✓ npm prefix set to ${NPM_PREFIX}"
}

# ---------------------------------------------------------------------------
# Install Qwen Code from current directory
# ---------------------------------------------------------------------------
install_qwen_code() {
    if [[ "${UPDATING}" == "true" ]]; then
        local cur_ver
        cur_ver=$(qwen --version 2>/dev/null || echo "unknown")
        echo "ℹ Existing installation (version: ${cur_ver}) — updating..."
        echo ""
    fi

    local work_dir
    work_dir=$(mktemp -d "${TMPDIR:-/tmp}/qwen-install.XXXXXXXXXX")
    trap 'rm -rf "${work_dir}"' EXIT

    echo "Building package from local source (${SCRIPT_DIR})..."
    
    # Copy the current directory to work_dir and build there
    cp -r "${SCRIPT_DIR}"/* "${work_dir}/" 2>/dev/null || \
    cp -r "${SCRIPT_DIR}"/.* "${work_dir}/" 2>/dev/null || true
    
    # Remove any hidden files that might interfere (like .git)
    rm -rf "${work_dir}/.git" 2>/dev/null || true
    rm -f "${work_dir}/.gitignore" 2>/dev/null || true

    local pack_output tgz
    # tee /dev/stderr shows the build output; tail -1 captures the tgz filename
    pack_output=$(cd "${work_dir}" && npm pack 2>&1 | tee /dev/stderr)
    tgz=$(echo "${pack_output}" | tail -1 | tr -d '[:space:]')
    tgz="${tgz##*/}"  # strip any path prefix

    if [[ -z "${tgz}" || ! -f "${work_dir}/${tgz}" ]]; then
        echo "✗ npm pack failed — .tgz not found in ${work_dir}"
        exit 1
    fi

    # Sanity check: valid qwen package is several MB
    local tgz_size
    tgz_size=$(stat -c%s "${work_dir}/${tgz}" 2>/dev/null \
            || stat -f%z "${work_dir}/${tgz}" 2>/dev/null \
            || echo 0)
    if [[ "${tgz_size}" -lt 1000000 ]]; then
        echo "✗ Packed tgz too small (${tgz_size} bytes) — build likely failed"
        exit 1
    fi
    echo "✓ Packed: ${tgz} ($(( tgz_size / 1024 / 1024 ))MB)"

    echo "Installing globally into ${NPM_PREFIX}..."
    # Uninstall first to ensure version switches (downgrades) work correctly
    npm uninstall -g @qwen-code/qwen-code 2>/dev/null || true
    ( cd "${work_dir}" && npm install -g "./${tgz}" ) \
        || { echo "✗ Global install failed"; exit 1; }
    echo "✓ Installed successfully"

    trap - EXIT
    rm -rf "${work_dir}"

    # Save install metadata
    mkdir -p "${HOME}/.qwen"
    cat > "${HOME}/.qwen/source.json" <<EOF
{
  "source": "local",
  "repository": "$(printf '%s' "${REPO_URL}" | sed 's/\\/\\\\/g; s/"/\\"/g')",
  "local_path": "$(printf '%s' "${SCRIPT_DIR}" | sed 's/\\/\\\\/g; s/"/\\"/g')"
}
EOF
    echo "✓ Saved install info to ~/.qwen/source.json"
}

# ---------------------------------------------------------------------------
# Write shell config (~/.bashrc) — each block written only once
# ---------------------------------------------------------------------------
configure_shell() {
    local shell_cfg=""
    for f in "${HOME}/.bashrc" "${HOME}/.bash_profile" "${HOME}/.profile"; do
        [[ -f "${f}" ]] && { shell_cfg="${f}"; break; }
    done
    [[ -z "${shell_cfg}" ]] && return 0

    local changed=false

    # NVM bootstrap
    if ! grep -qF 'NVM_DIR' "${shell_cfg}"; then
        {
            echo ""
            echo "# NVM (added by Qwen Code installer)"
            echo "export NVM_DIR=\"\${HOME}/.nvm\""
            echo "[ -s \"\${NVM_DIR}/nvm.sh\" ] && \\. \"\${NVM_DIR}/nvm.sh\""
            echo "[ -s \"\${NVM_DIR}/bash_completion\" ] && \\. \"\${NVM_DIR}/bash_completion\""
            echo "# Remove npm prefix conflict before activating node version"
            echo "sed -i '/^prefix/d; /^globalconfig/d' \"\${HOME}/.npmrc\" 2>/dev/null || true"
            echo "unset npm_config_prefix npm_config_globalconfig 2>/dev/null || true"
            echo "nvm use ${NODE_VERSION} >/dev/null 2>&1"
            echo "# Restore npm prefix after NVM"
            echo "export PATH=\"\${HOME}/.npm-global/bin:\${PATH}\""
        } >> "${shell_cfg}"
        changed=true
    fi

    # npm global prefix
    if ! grep -qF 'npm-global' "${shell_cfg}"; then
        {
            echo ""
            echo "# npm global prefix (added by Qwen Code installer)"
            echo "export PATH=\"\${HOME}/.npm-global/bin:\$PATH\""
        } >> "${shell_cfg}"
        changed=true
    fi

    [[ "${changed}" == "true" ]] && echo "✓ Shell config updated in ${shell_cfg}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    # Ensure HOME is set
    if [[ -z "${HOME}" ]]; then
        [[ "$(id -u)" -eq 0 ]] && export HOME="/root" \
            || export HOME="$(eval echo "~$(whoami)")"
        echo "HOME set to ${HOME}"
    fi
    [[ -d "${HOME}" ]] || { echo "Error: HOME directory ${HOME} does not exist"; exit 1; }

    # Check that we're running from the qwen-code repository
    if [[ ! -f "${SCRIPT_DIR}/package.json" ]] || \
       ! grep -q '"@qwen-code/qwen-code"' "${SCRIPT_DIR}/package.json" 2>/dev/null; then
        echo "Error: ${SCRIPT_DIR} does not appear to be the qwen-code repository"
        echo "  Expected package.json with @qwen-code/qwen-code in ${SCRIPT_DIR}"
        exit 1
    fi

    echo "--- Node.js (via NVM into \$HOME) ---"
    install_nodejs
    echo ""

    echo "--- npm prefix (\$HOME only) ---"
    configure_npm_prefix
    echo ""

    echo "--- Qwen Code ---"
    install_qwen_code
    echo ""

    configure_shell

    echo ""
    echo "==========================================="
    echo "✓ Done!  local build from ${SCRIPT_DIR}"
    echo "==========================================="
    echo ""

    # Final check — reload PATH with npm global bin (NVM bin already on PATH from install_nodejs)

    if command_exists qwen; then
        echo "✓ qwen is ready. Run: qwen"
    else
        echo "⚠ Open a new terminal (or: source ~/.bashrc) then run: qwen"
    fi
}

main "$@"

#!/bin/bash

# Qwen Code (no-telemetry) installer
#
# All files installed locally in $HOME — no root, no sudo, no system packages.
# Safe to use in ephemeral Docker containers (--rm).
#
# Usage:
#   curl -fsSL https://undici77.it/install.sh | bash -s <branch-or-tag>
#
# Examples:
#   bash install.sh v0.12.3-no-telemetry
#   bash install.sh v0.12.3-no-telemetry --source github

if [[ -z "${BASH_VERSION}" ]]; then
    exec bash "${0}" "${@}"
fi

export GIT_PAGER=cat
export PAGER=cat
set -o pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
REPO_URL="https://github.com/undici77/qwen-code-no-telemetry"
NVM_VERSION="v0.40.3"
NODE_VERSION="20"
NPM_PREFIX="${HOME}/.npm-global"   # npm global prefix — stays in $HOME
NVM_DIR="${HOME}/.nvm"             # NVM install dir   — stays in $HOME

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
usage() {
    echo "Usage: $0 <branch-or-tag> [--source SOURCE]"
    echo ""
    echo "Examples:"
    echo "  bash install.sh v0.12.3-no-telemetry"
    echo "  bash install.sh v0.12.3-no-telemetry --source github"
    echo ""
    exit 1
}

REF=""
SOURCE="unknown"
while [[ $# -gt 0 ]]; do
    case $1 in
        --source|-s)
            [[ -z "$2" || "$2" == -* ]] && { echo "Error: --source requires a value"; usage; }
            SOURCE="$2"; shift 2 ;;
        --help|-h) usage ;;
        -*)        echo "Error: Unknown option: $1"; usage ;;
        *)
            if [[ -z "${REF}" ]]; then REF="$1"; shift
            else echo "Error: Unexpected argument: $1"; usage; fi ;;
    esac
done
[[ -z "${REF}" ]] && { echo "Error: branch or tag is required"; usage; }

UPDATING=false
# Check both system PATH and the npm-global bin where qwen lives after install
if command -v qwen >/dev/null 2>&1 || [[ -x "${HOME}/.npm-global/bin/qwen" ]]; then
    UPDATING=true
fi

echo "==========================================="
echo " Qwen Code (no-telemetry) Installer"
echo "==========================================="
echo "  Repository : ${REPO_URL}"
echo "  Ref        : ${REF}"
echo "  NVM dir    : ${NVM_DIR}"
echo "  npm prefix : ${NPM_PREFIX}"
[[ "${SOURCE}" != "unknown" ]] && echo "  Source     : ${SOURCE}"
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
# Install Qwen Code via npm pack
# ---------------------------------------------------------------------------
install_qwen_code() {
    local pkg_ref="${REPO_URL}#${REF}"

    if [[ "${UPDATING}" == "true" ]]; then
        local cur_ver
        cur_ver=$(qwen --version 2>/dev/null || echo "unknown")
        echo "ℹ Existing installation (version: ${cur_ver}) — updating..."
        echo ""
    fi

    local work_dir
    work_dir=$(mktemp -d "${TMPDIR:-/tmp}/qwen-install.XXXXXXXXXX")
    trap 'rm -rf "${work_dir}"' EXIT

    echo "Packing ${REF} from GitHub (builds the package)..."
    local pack_output tgz
    # tee /dev/stderr shows the build output; tail -1 captures the tgz filename
    # Pass build info via environment variables. REF acts as the hash here.
    local clean_ver="${REF#v}"
    pack_output=$(cd "${work_dir}" && GIT_COMMIT_HASH="${REF}" CLI_VERSION="${clean_ver}" npm pack "${pkg_ref}" 2>&1 | tee /dev/stderr)
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
  "source": "$(printf '%s' "${SOURCE}"   | sed 's/\\/\\\\/g; s/"/\\"/g')",
  "ref":    "$(printf '%s' "${REF}"      | sed 's/\\/\\\\/g; s/"/\\"/g')",
  "repository": "$(printf '%s' "${REPO_URL}" | sed 's/\\/\\\\/g; s/"/\\"/g')"
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
    echo "✓ Done!  ref: ${REF}"
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

# Qwen Code (no-telemetry) installer for Windows.
#
# All files installed locally under %LOCALAPPDATA% and %USERPROFILE% - no
# admin rights, no system packages. Mirrors install.sh's approach: builds
# from source via `npm pack <repo>#<ref>` rather than downloading a prebuilt
# binary.
#
# Requires Git for Windows (https://git-scm.com/download/win) - npm needs
# git.exe on PATH to fetch the package from GitHub.
#
# Usage (after downloading this file):
#   .\install.ps1 v0.21.14-no-telemetry
#   .\install.ps1 v0.21.14-no-telemetry -Source github
#
# One-liner:
#   iwr https://undici77.it/install.ps1 -OutFile install.ps1; .\install.ps1 v0.21.14-no-telemetry

param(
    [Parameter(Position = 0)]
    [string]$Ref,

    [Alias('s')]
    [string]$Source = 'unknown'
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
$RepoUrl = 'https://github.com/undici77/qwen-code-no-telemetry'
$NodeMajorVersion = 22
$InstallBase = Join-Path $env:LOCALAPPDATA 'qwen-code-no-telemetry'
$NodeDir = Join-Path $InstallBase 'node'
$NpmPrefix = Join-Path $InstallBase 'npm-global'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Show-Usage {
    Write-Host "Usage: .\install.ps1 <branch-or-tag> [-Source SOURCE]"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\install.ps1 v0.21.14-no-telemetry"
    Write-Host "  .\install.ps1 v0.21.14-no-telemetry -Source github"
    Write-Host ""
}

function Write-Ok   ($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Info ($msg) { Write-Host $msg }
function Write-Warn ($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err  ($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

function Test-CommandExists {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Download-File {
    param([string]$Url, [string]$OutFile)
    if (Test-CommandExists 'curl.exe') {
        curl.exe --connect-timeout 15 --max-time 300 --retry 2 -sSfLo $OutFile $Url
        if ($LASTEXITCODE -ne 0) {
            throw "curl.exe download failed (exit code $LASTEXITCODE)"
        }
        return
    }
    Invoke-WebRequest -Uri $Url -OutFile $OutFile -UseBasicParsing -MaximumRedirection 10 -TimeoutSec 300
}

function Get-InstalledNodeMajor {
    if (-not (Test-CommandExists 'node')) {
        return $null
    }
    $verStr = (& node --version 2>$null)
    if ($verStr -match '^v(\d+)\.') {
        return [int]$Matches[1]
    }
    return $null
}

# ---------------------------------------------------------------------------
# Ensure git is available (needed by `npm pack <repo>#<ref>`)
# ---------------------------------------------------------------------------
function Assert-Git {
    if (Test-CommandExists 'git') {
        return
    }
    Write-Err "git is required but not found."
    Write-Host "  npm needs git.exe on PATH to fetch the package from GitHub."
    Write-Host "  Install Git for Windows: https://git-scm.com/download/win"
    exit 1
}

# ---------------------------------------------------------------------------
# Install Node.js as a portable, user-local copy (no admin needed)
# ---------------------------------------------------------------------------
function Install-NodeJs {
    $existingMajor = Get-InstalledNodeMajor
    if ($null -ne $existingMajor -and $existingMajor -ge $NodeMajorVersion) {
        Write-Ok "Node.js $(node --version) already installed"
        return $null
    }

    if ($null -ne $existingMajor) {
        Write-Warn "Node.js v$existingMajor is too old - installing a portable v$NodeMajorVersion.x"
    } else {
        Write-Info "Node.js not found - installing a portable v$NodeMajorVersion.x into $NodeDir"
    }

    Write-Info "Resolving latest Node.js v$NodeMajorVersion.x release..."
    $index = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json'
    $candidate = $index |
        Where-Object { $_.version -match "^v$NodeMajorVersion\." } |
        Sort-Object { [version]($_.version.TrimStart('v')) } -Descending |
        Select-Object -First 1
    if ($null -eq $candidate) {
        Write-Err "Could not find a Node.js v$NodeMajorVersion.x release."
        exit 1
    }
    $version = $candidate.version
    $zipName = "node-$version-win-x64.zip"
    $zipUrl = "https://nodejs.org/dist/$version/$zipName"

    $workDir = Join-Path $env:TEMP ("qwen-node-" + [IO.Path]::GetRandomFileName())
    New-Item -ItemType Directory -Force -Path $workDir | Out-Null
    try {
        $zipPath = Join-Path $workDir $zipName
        Write-Info "Downloading $zipUrl ..."
        Download-File -Url $zipUrl -OutFile $zipPath

        Write-Info "Extracting..."
        Expand-Archive -LiteralPath $zipPath -DestinationPath $workDir -Force

        $extractedDir = Join-Path $workDir "node-$version-win-x64"
        if (-not (Test-Path -LiteralPath $extractedDir)) {
            Write-Err "Extraction did not produce the expected folder: $extractedDir"
            exit 1
        }

        New-Item -ItemType Directory -Force -Path $InstallBase | Out-Null
        if (Test-Path -LiteralPath $NodeDir) {
            Remove-Item -LiteralPath $NodeDir -Recurse -Force
        }
        Move-Item -LiteralPath $extractedDir -Destination $NodeDir
    } finally {
        Remove-Item -LiteralPath $workDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    $env:Path = "$NodeDir;$env:Path"
    Write-Ok "Node.js $version installed into $NodeDir"
    return $NodeDir
}

# ---------------------------------------------------------------------------
# Configure npm to use a prefix inside %LOCALAPPDATA% (no admin needed for -g installs)
# ---------------------------------------------------------------------------
function Set-NpmPrefix {
    New-Item -ItemType Directory -Force -Path $NpmPrefix | Out-Null
    & npm config set prefix "$NpmPrefix"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to set npm prefix"
        exit 1
    }
    $env:Path = "$NpmPrefix;$env:Path"
    Write-Ok "npm prefix set to $NpmPrefix"
}

# ---------------------------------------------------------------------------
# Install Qwen Code via npm pack
# ---------------------------------------------------------------------------
function Install-QwenCode {
    param([string]$Ref, [string]$Source, [bool]$Updating)

    $pkgRef = "$RepoUrl#$Ref"

    if ($Updating) {
        # qwen.ps1 is itself a script; if the existing install is broken, its
        # internal `node ...` call can throw a terminating error that inherits
        # our $ErrorActionPreference = 'Stop'. This is just a display nicety,
        # so any failure here must fall back to 'unknown' rather than abort.
        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $curVer = 'unknown'
        try {
            $result = (& qwen --version) 2>$null
            if ($result) { $curVer = $result }
        } catch {
            # Existing install is broken - keep 'unknown', we're overwriting it anyway.
        } finally {
            $ErrorActionPreference = $prevEap
        }
        Write-Info "Existing installation (version: $curVer) - updating..."
        Write-Host ""
    }

    $workDir = Join-Path $env:TEMP ("qwen-install-" + [IO.Path]::GetRandomFileName())
    New-Item -ItemType Directory -Force -Path $workDir | Out-Null

    try {
        Write-Info "Packing $Ref from GitHub (builds the package)..."
        $cleanVer = $Ref -replace '^v', ''

        Push-Location $workDir
        $prevEap = $ErrorActionPreference
        try {
            $env:GIT_COMMIT_HASH = $Ref
            $env:CLI_VERSION = $cleanVer
            # npm writes routine notices to stderr; merging via 2>&1 wraps them as
            # ErrorRecord objects, which $ErrorActionPreference = 'Stop' would treat
            # as terminating errors. Relax it for just this call.
            $ErrorActionPreference = 'Continue'
            $packOutput = & npm pack $pkgRef 2>&1
            $packOutput | ForEach-Object { Write-Host $_ }
            $packExit = $LASTEXITCODE
        } finally {
            $ErrorActionPreference = $prevEap
            Remove-Item Env:\GIT_COMMIT_HASH -ErrorAction SilentlyContinue
            Remove-Item Env:\CLI_VERSION -ErrorAction SilentlyContinue
            Pop-Location
        }

        if ($packExit -ne 0) {
            Write-Err "npm pack failed"
            exit 1
        }

        $tgzLine = ($packOutput | Where-Object { $_ -match '\S' } | Select-Object -Last 1)
        $tgz = ($tgzLine -replace '^.*[/\\]', '').Trim()
        $tgzPath = Join-Path $workDir $tgz

        if ([string]::IsNullOrWhiteSpace($tgz) -or -not (Test-Path -LiteralPath $tgzPath)) {
            Write-Err "npm pack failed - .tgz not found in $workDir"
            exit 1
        }

        $tgzSize = (Get-Item -LiteralPath $tgzPath).Length
        if ($tgzSize -lt 1000000) {
            Write-Err "Packed tgz too small ($tgzSize bytes) - build likely failed"
            exit 1
        }
        Write-Ok "Packed: $tgz ($([math]::Round($tgzSize / 1MB))MB)"

        Write-Info "Installing globally into $NpmPrefix..."
        & npm uninstall -g '@qwen-code/qwen-code' 2>$null | Out-Null

        # Ensure patch-package is available in PATH for the package's postinstall
        # script (it applies local patches, e.g. ink+7.1.1.patch). When installing
        # from a tgz, postinstall runs in a fresh context where node_modules\.bin
        # is not on PATH, so patch-package must be installed globally first.
        if (-not (Test-CommandExists 'patch-package')) {
            Write-Info "  Installing patch-package globally (required by postinstall)..."
            & npm install -g patch-package --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) {
                Write-Err "Failed to install patch-package"
                exit 1
            }
            Write-Ok "patch-package installed"
        }

        Push-Location $workDir
        try {
            & npm install -g "./$tgz"
            $installExit = $LASTEXITCODE
        } finally {
            Pop-Location
        }
        if ($installExit -ne 0) {
            Write-Err "Global install failed"
            exit 1
        }
        Write-Ok "Installed successfully"
    } finally {
        Remove-Item -LiteralPath $workDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    $qwenDir = Join-Path $env:USERPROFILE '.qwen'
    New-Item -ItemType Directory -Force -Path $qwenDir | Out-Null
    $sourceInfo = [ordered]@{
        source     = $Source
        ref        = $Ref
        repository = $RepoUrl
    }
    ($sourceInfo | ConvertTo-Json) | Set-Content -LiteralPath (Join-Path $qwenDir 'source.json') -Encoding utf8
    Write-Ok "Saved install info to $qwenDir\source.json"
}

# ---------------------------------------------------------------------------
# Persist PATH entries for future sessions (User scope - no admin needed)
# ---------------------------------------------------------------------------
function Add-PersistentPath {
    param([string[]]$Directories)

    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $entries = @($userPath -split ';' | Where-Object { $_ })
    $changed = $false

    foreach ($dir in $Directories) {
        if (-not $dir) { continue }
        $alreadyPresent = $entries | Where-Object { $_ -ieq $dir }
        if (-not $alreadyPresent) {
            $entries = @($dir) + $entries
            $changed = $true
        }
    }

    if ($changed) {
        [Environment]::SetEnvironmentVariable('Path', ($entries -join ';'), 'User')
        Write-Ok "PATH updated for future sessions (open a new terminal to pick it up)"
    }
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if ([string]::IsNullOrWhiteSpace($Ref)) {
    Write-Err "branch or tag is required"
    Show-Usage
    exit 1
}

$npmGlobalQwen = Join-Path $NpmPrefix 'qwen.cmd'
$Updating = (Test-CommandExists 'qwen') -or (Test-Path -LiteralPath $npmGlobalQwen)

Write-Host "==========================================="
Write-Host " Qwen Code (no-telemetry) Installer"
Write-Host "==========================================="
Write-Host "  Repository : $RepoUrl"
Write-Host "  Ref        : $Ref"
Write-Host "  Node dir   : $NodeDir"
Write-Host "  npm prefix : $NpmPrefix"
if ($Source -ne 'unknown') { Write-Host "  Source     : $Source" }
if ($Updating) { Write-Host "  Mode       : update" }
Write-Host "==========================================="
Write-Host ""

Write-Info "--- Prerequisites ---"
Assert-Git
Write-Host ""

Write-Info "--- Node.js (portable, user-local) ---"
$newNodeDir = Install-NodeJs
Write-Host ""

Write-Info "--- npm prefix (user-local) ---"
Set-NpmPrefix
Write-Host ""

Write-Info "--- Qwen Code ---"
Install-QwenCode -Ref $Ref -Source $Source -Updating $Updating
Write-Host ""

Add-PersistentPath -Directories @($newNodeDir, $NpmPrefix)

Write-Host ""
Write-Host "==========================================="
Write-Host "Done!  ref: $Ref"
Write-Host "==========================================="
Write-Host ""

if (Test-CommandExists 'qwen') {
    Write-Ok "qwen is ready. Run: qwen"
} else {
    Write-Warn "Open a new terminal, then run: qwen"
}

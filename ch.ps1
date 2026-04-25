$ErrorActionPreference = "Stop"

# === 設定 ===
$repo = "C:\Users\dacco\Downloads\vertical_shooter_s_rank_v6_3_full_i18n\Vertical-Shooter-S-Rank"
$version = "1.0.0"
$zipName = "Vertical-Shooter-S-Rank-v$version.zip"
$distDir = Join-Path $repo "dist"
$zipPath = Join-Path $distDir $zipName

cd $repo

Write-Host "=== [1] 最新取得 ==="
git pull --rebase origin main

# =========================
# ① バージョン v1.0.0 化
# =========================
Write-Host "=== [2] manifest更新 ==="
$m = Get-Content .\manifest.json -Raw -Encoding UTF8
$m = $m -replace '"version"\s*:\s*"[^"]+"', "`"version`": `"$version`""
Set-Content .\manifest.json $m -Encoding UTF8

# =========================
# ② README 更新
# =========================
Write-Host "=== [3] README更新 ==="

$readme = @"
# Vertical Shooter S-Rank

A browser-based vertical shooter game.

## Features
- Rank-based scoring system
- NEW RECORD detection
- Result screen with rank display
- Score sharing (COPY RESULT)
- Local score history (RECENT RUNS)
- Multilingual UI
- BGM support

## Controls
Move: Arrow / WASD  
Shoot: Z / Space / Enter  
Bomb: X  
Slow: Shift  
Overdrive: V  

## Version
v$version
"@

Set-Content .\README.md $readme -Encoding UTF8

# =========================
# ③ CHANGELOG 作成
# =========================
Write-Host "=== [4] CHANGELOG更新 ==="

$changelog = @"
# CHANGELOG

## v1.0.0
- Stable release
- Result screen UI
- NEW RECORD system
- Score share feature
- Local history (RECENT RUNS)

## v6.x
- Iterative UI and gameplay improvements
"@

Set-Content .\CHANGELOG.md $changelog -Encoding UTF8

# =========================
# Git commit & push
# =========================
Write-Host "=== [5] Commit & Push ==="
git add .
git commit -m "Release v1.0.0"
git push origin main

# =========================
# ZIP作成
# =========================
Write-Host "=== [6] ZIP作成 ==="

if (!(Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

$exclude = @(".git", "dist", "*.ps1")

$files = Get-ChildItem -Recurse | Where-Object {
    $full = $_.FullName
    -not ($full -match "\\.git") -and
    -not ($full -match "\\dist\\") -and
    -not ($full -match "\.ps1$")
}

$tempDir = Join-Path $repo "temp_release"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

foreach ($file in $files) {
    $target = $file.FullName.Replace($repo, $tempDir)
    if ($file.PSIsContainer) {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
    } else {
        Copy-Item $file.FullName -Destination $target -Force
    }
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath)

Remove-Item $tempDir -Recurse -Force

Write-Host "ZIP作成完了: $zipPath"

# =========================
# GitHub Release（任意）
# =========================
Write-Host "=== [7] Release作成（ghがある場合） ==="

$ghExists = Get-Command gh -ErrorAction SilentlyContinue

if ($ghExists) {
    gh release create "v$version" $zipPath `
        --title "Vertical Shooter S-Rank v$version" `
        --notes "Initial stable release"
} else {
    Write-Host "gh CLI 未検出 → 手動でRelease作成してください"
}

Write-Host "=== 完了 ==="
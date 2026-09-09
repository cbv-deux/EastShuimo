@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 未找到 Node.js，请安装 Node.js 后重试。
  pause
  exit /b 1
)
node scripts/start-preview.mjs
if errorlevel 1 pause

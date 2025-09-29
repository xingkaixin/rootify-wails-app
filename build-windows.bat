@echo off
REM Rootify Windows 构建脚本

echo 🚀 开始构建 Rootify Windows 版本...

REM 检查前置依赖
echo 📋 检查前置依赖...
wails version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 wails 命令，请先安装 Wails CLI
    echo    安装命令: go install github.com/wailsapp/wails/v2/cmd/wails@latest
    exit /b 1
)

bun --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 bun 命令，请先安装 Bun
    echo    安装命令: powershell -c "irm bun.sh/install.ps1 | iex"
    exit /b 1
)

REM 清理构建目录
echo 🧹 清理构建目录...
if exist "build\*" (
    rmdir /s /q build
)

REM 安装前端依赖
echo 📦 安装前端依赖...
cd frontend
bun install
cd ..

REM 构建 Windows 版本
echo 🔨 构建 Windows 版本...
wails build -platform windows/amd64

echo.
echo ✅ 构建完成！
echo 📁 输出目录: build\
echo.
echo 📦 构建产物:
dir build\bin\
echo.
echo 💡 提示:
echo   直接运行 rootify-amd64.exe 文件
echo   数据库文件位置: %%APPDATA%%\rootify\rootify.db
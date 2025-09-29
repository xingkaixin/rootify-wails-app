#!/bin/bash

# Rootify 构建脚本
# 支持 macOS (x86_64, arm64) 和 Windows (x64)

set -e

echo "🚀 开始构建 Rootify 应用..."

# 检查前置依赖
echo "📋 检查前置依赖..."
if ! command -v wails &> /dev/null; then
    echo "❌ 错误: 未找到 wails 命令，请先安装 Wails CLI"
    echo "   安装命令: go install github.com/wailsapp/wails/v2/cmd/wails@latest"
    exit 1
fi

if ! command -v bun &> /dev/null; then
    echo "❌ 错误: 未找到 bun 命令，请先安装 Bun"
    echo "   安装命令: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# 清理构建目录
echo "🧹 清理构建目录..."
rm -rf ./build/*

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend && bun install && cd ..

# 构建所有平台
echo "🔨 构建所有目标平台..."
wails build -platform all

echo ""
echo "✅ 构建完成！"
echo "📁 输出目录: ./build/"
echo ""
echo "📦 构建产物:"
ls -la ./build/bin/
echo ""
echo "💡 提示:"
echo "   - macOS Intel 用户: 直接运行 rootify-amd64.app"
echo "   - macOS Apple Silicon 用户: 直接运行 rootify-arm64.app"
echo "   - Windows 用户: 直接运行 rootify-amd64.exe"
echo "   - 数据库文件位置:"
echo "       macOS: ~/Library/Application Support/rootify/rootify.db"
echo "       Windows: %APPDATA%/rootify/rootify.db"
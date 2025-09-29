# Rootify - 金融词根翻译器

一个基于 Wails 构建的跨平台桌面应用，用于金融术语的词根翻译和文本分析。

## 功能特性

- 🔤 中文金融词根翻译
- 📝 文本分词和翻译
- 💾 SQLite 本地数据库存储
- 🖥️ 跨平台支持 (macOS, Windows)
- 🎨 现代化用户界面

## 构建说明

### 前置依赖

- **Go 1.23+** - [下载地址](https://golang.org/dl/)
- **Wails CLI** - `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- **Bun** - [安装指南](https://bun.sh/)

### 快速构建


1. 安装前端依赖：
```bash
make deps
```

2. 构建所有平台：
```bash
make clean
make build-mac
make build-windows
```


### 构建输出

构建产物位于 `./build/bin/` 目录：

- **macOS Universal**: `rootify.app` (完整的应用包)
- **Windows**: `rootify.exe` (直接可执行文件)

### 平台支持

| 平台 | 架构 | 状态 |
|------|------|------|
| macOS | x86_64 (Intel) | ✅ 支持 |
| macOS | arm64 (Apple Silicon) | ✅ 支持 |
| Windows | x64 | ✅ 支持 |

### 数据库位置

应用数据存储在平台标准位置：

- **macOS**: `~/Library/Application Support/rootify/rootify.db`
- **Windows**: `%APPDATA%/rootify/rootify.db`
- **Linux**: `~/.config/rootify/rootify.db`

## 开发模式

运行开发服务器：
```bash
wails dev
```

这将启动：
- 前端开发服务器 (Vite)
- 后端 Go 服务
- 热重载支持

## 项目结构

```
├── app.go              # Go 后端主逻辑
├── main.go             # 应用入口
├── wails.json          # Wails 配置
├── frontend/           # 前端代码
│   ├── src/           # React 组件
│   ├── package.json   # 前端依赖
│   └── vite.config.ts # Vite 配置
└── build/             # 构建输出目录
```

## 许可证

MIT License

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
├── docs/spec/          # 技术规格文档
│   ├── 功能链路说明.md    # 详细功能实现说明
│   ├── 技术架构说明.md    # 系统架构设计
│   ├── API接口说明.md     # API接口文档
│   ├── 数据库设计说明.md   # 数据库设计
│   └── 部署与开发指南.md   # 部署和开发指南
└── build/             # 构建输出目录
```

## 技术文档

详细的技术规格和实现说明请参考 [docs/spec/](./docs/spec/) 目录：

- [功能链路说明](./docs/spec/功能链路说明.md) - 详细的功能实现链路和代码位置
- [技术架构说明](./docs/spec/技术架构说明.md) - 系统架构设计和技术选型
- [API接口说明](./docs/spec/API接口说明.md) - 前后端API接口文档
- [数据库设计说明](./docs/spec/数据库设计说明.md) - 数据库表结构和设计思路
- [部署与开发指南](./docs/spec/部署与开发指南.md) - 部署和开发环境配置

## 许可证

MIT License

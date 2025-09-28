# 金融词根翻译系统 - API接口说明

## 概述

本文档详细说明金融词根翻译系统的后端API接口。所有接口通过Wails框架自动绑定到前端，提供类型安全的调用方式。

## API接口列表

### 1. 词根管理接口

#### 1.1 GetAllRoots - 获取所有词根

**文件位置**: `app.go:68-92`

**TypeScript定义**: `frontend/wailsjs/go/main/App.d.ts:12`
```typescript
export function GetAllRoots(): Promise<Record<string, string>>;
```

**Go方法签名**:
```go
func (a *App) GetAllRoots() (map[string]string, error)
```

**功能描述**: 从数据库获取所有词根数据，返回中文到英文的映射。

**参数**: 无

**返回值**:
- `Promise<Record<string, string>>`: 词根映射对象，键为中文，值为英文
- 错误时返回空对象 `{}`

**调用示例** (前端 `App.tsx:18`):
```typescript
const roots = await GoAPI.GetAllRoots();
// roots = { "交易": "trade", "日期": "date", ... }
```

**后端实现关键代码**:
```go
rows, err := a.db.Query("SELECT chinese, english FROM word_roots ORDER BY chinese")
// ... 遍历结果构建map
```

#### 1.2 AddRoot - 添加/更新词根

**文件位置**: `app.go:95-112`

**TypeScript定义**: `frontend/wailsjs/go/main/App.d.ts:4`
```typescript
export function AddRoot(arg1:string, arg2:string): Promise<void>;
```

**Go方法签名**:
```go
func (a *App) AddRoot(chinese, english string) error
```

**功能描述**: 添加新的词根或更新已存在的词根。

**参数**:
- `chinese: string` - 中文词根
- `english: string` - 英文翻译

**返回值**:
- `Promise<void>` - 成功时无返回值
- 错误时抛出异常

**调用示例** (前端 `App.tsx:532`):
```typescript
await GoAPI.AddRoot("区块链", "blockchain");
```

**后端实现关键代码**:
```go
_, err := a.db.Exec(
    "INSERT OR REPLACE INTO word_roots (chinese, english, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    chinese, english,
)
```

#### 1.3 DeleteRoot - 删除词根

**文件位置**: `app.go:115-129`

**TypeScript定义**: `frontend/wailsjs/go/main/App.d.ts:8`
```typescript
export function DeleteRoot(arg1:string): Promise<void>;
```

**Go方法签名**:
```go
func (a *App) DeleteRoot(chinese string) error
```

**功能描述**: 根据中文词根删除对应的词根记录。

**参数**:
- `chinese: string` - 要删除的中文词根

**返回值**:
- `Promise<void>` - 成功时无返回值

**调用示例** (前端 `App.tsx:176`):
```typescript
await GoAPI.DeleteRoot("区块链");
```

**后端实现关键代码**:
```go
_, err := a.db.Exec("DELETE FROM word_roots WHERE chinese = ?", chinese)
```

#### 1.4 ClearAllRoots - 清空所有词根

**文件位置**: `app.go:132-146`

**TypeScript定义**: `frontend/wailsjs/go/main/App.d.ts:6`
```typescript
export function ClearAllRoots(): Promise<void>;
```

**Go方法签名**:
```go
func (a *App) ClearAllRoots() error
```

**功能描述**: 删除数据库中的所有词根记录。

**参数**: 无

**返回值**:
- `Promise<void>` - 成功时无返回值

**调用示例** (前端 `App.tsx:217`):
```typescript
await GoAPI.ClearAllRoots();
```

**后端实现关键代码**:
```go
_, err := a.db.Exec("DELETE FROM word_roots")
```

#### 1.5 ImportRoots - 批量导入词根

**文件位置**: `app.go:149-177`

**TypeScript定义**: `frontend/wailsjs/go/main/App.d.ts:14`
```typescript
export function ImportRoots(arg1:Record<string, string>): Promise<void>;
```

**Go方法签名**:
```go
func (a *App) ImportRoots(roots map[string]string) error
```

**功能描述**: 批量导入词根数据，使用事务确保数据一致性。

**参数**:
- `roots: Record<string, string>` - 词根映射对象

**返回值**:
- `Promise<void>` - 成功时无返回值

**调用示例** (前端 `App.tsx:232`):
```typescript
const rootsToImport = { "交易": "trade", "日期": "date" };
await GoAPI.ImportRoots(rootsToImport);
```

**后端实现关键代码**:
```go
tx, err := a.db.Begin()
stmt, err := tx.Prepare("INSERT OR REPLACE INTO word_roots ...")
// ... 批量插入
return tx.Commit()
```

#### 1.6 ExportRoots - 导出词根为CSV

**文件位置**: `app.go:180-206`

**TypeScript定义**: `frontend/wailsjs/go/main/App.d.ts:10`
```typescript
export function ExportRoots(): Promise<string>;
```

**Go方法签名**:
```go
func (a *App) ExportRoots() (string, error)
```

**功能描述**: 将所有词根导出为CSV格式的字符串。

**参数**: 无

**返回值**:
- `Promise<string>` - CSV格式的字符串

**调用示例** (前端 `App.tsx:186`):
```typescript
const csvContent = await GoAPI.ExportRoots();
// csvContent = "中文词根,英文对应\n"交易","trade"\n"日期","date"\n"
```

**后端实现关键代码**:
```go
var csvContent string
csvContent = "中文词根,英文对应\n"
for rows.Next() {
    csvContent += fmt.Sprintf("\"%s\",\"%s\"\n", chinese, english)
}
```

### 2. 翻译功能接口

#### 2.1 SegmentText - 文本分词

**文件位置**: `app.go:209-253`

**TypeScript定义**: `frontend/wailsjs/go/main/App.d.ts:16`
```typescript
export function SegmentText(arg1:string): Promise<Array<Record<string, any>>>;
```

**Go方法签名**:
```go
func (a *App) SegmentText(text string) ([]map[string]any, error)
```

**功能描述**: 对中文文本进行分词，识别出已知的词根和未知的字符。

**参数**:
- `text: string` - 要分词的中文文本

**返回值**:
- `Promise<Array<Record<string, any>>>` - 分词结果数组

**返回数据结构**:
```typescript
interface SegmentationResult {
    chinese: string;    // 中文片段
    english: string;    // 英文翻译（如果已知）
    isUnknown?: boolean; // 是否为未知字符
}
```

**调用示例** (前端 `App.tsx:40`):
```typescript
const segments = await GoAPI.SegmentText("交易日期");
// segments = [
//   { chinese: "交易", english: "trade", isUnknown: false },
//   { chinese: "日期", english: "date", isUnknown: false }
// ]
```

**后端算法核心**:
- 使用最长匹配算法
- 最多匹配10个字符
- 支持UTF-8字符处理

#### 2.2 TranslateText - 文本翻译

**文件位置**: `app.go:256-278`

**TypeScript定义**: `frontend/wailsjs/go/main/App.d.ts:18`
```typescript
export function TranslateText(arg1:string): Promise<string>;
```

**Go方法签名**:
```go
func (a *App) TranslateText(text string) (string, error)
```

**功能描述**: 将中文文本翻译成英文，使用下划线连接翻译结果。

**参数**:
- `text: string` - 要翻译的中文文本

**返回值**:
- `Promise<string>` - 翻译后的英文字符串

**调用示例** (前端 `App.tsx:501`):
```typescript
const translated = await GoAPI.TranslateText("交易日期");
// translated = "trade_date"
```

**后端实现逻辑**:
1. 调用 `SegmentText` 进行分词
2. 将分词结果用下划线连接
3. 未知字符保持原样

### 3. 应用生命周期接口

#### 3.1 startup - 应用启动初始化

**文件位置**: `app.go:29-32`

**功能描述**: 应用启动时自动调用，用于初始化数据库连接。

**调用机制**: Wails框架自动调用，无需前端显式调用。

**实现代码**:
```go
func (a *App) startup(ctx context.Context) {
    a.ctx = ctx
    a.initDB()  // 初始化数据库
}
```

## 错误处理规范

### 前端错误处理模式

所有API调用都应使用try-catch包装：
```typescript
try {
    await GoAPI.AddRoot(chinese, english);
} catch (error) {
    console.error("添加词根失败:", error);
    // 显示用户友好的错误提示
}
```

### 后端错误返回

所有Go方法都返回error类型，前端需要处理可能的异常：
- 数据库连接错误
- SQL执行错误
- 参数验证错误
- 并发访问错误

## 数据类型映射

### Go ↔ TypeScript 类型映射

| Go类型 | TypeScript类型 | 说明 |
|--------|----------------|------|
| `string` | `string` | 字符串 |
| `map[string]string` | `Record<string, string>` | 键值对映射 |
| `[]map[string]any` | `Array<Record<string, any>>` | 对象数组 |
| `error` | 异常抛出 | 错误处理 |

### 特殊数据结构说明

#### 分词结果结构
```typescript
// 前端定义
interface SegmentationResult {
    chinese: string;
    english: string;
    isUnknown?: boolean;
}

// 后端返回
[]map[string]any{
    {"chinese": "交易", "english": "trade", "isUnknown": false},
    {"chinese": "日", "english": "", "isUnknown": true}
}
```

## 性能注意事项

### 高频调用接口
1. **GetAllRoots**: 应用启动时调用一次，结果缓存在前端
2. **TranslateText**: 用户输入时频繁调用，已优化算法性能

### 批量操作接口
1. **ImportRoots**: 使用事务确保性能和数据一致性
2. 避免在循环中调用单个添加接口

## 扩展接口指南

### 添加新接口的步骤
1. 在 `app.go` 中添加导出方法
2. 重新运行 `wails dev` 生成TypeScript绑定
3. 在前端调用新生成的API

### 接口命名规范
- 使用驼峰命名法
- 动词开头描述操作类型
- 保持命名一致性

这个API接口说明文档为开发者提供了完整的接口参考，包括每个接口的功能、参数、返回值和实现细节。
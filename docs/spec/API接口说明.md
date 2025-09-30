# 金融词根翻译系统 - API接口说明

## 概述

本文档详细说明金融词根翻译系统的后端API接口。所有接口通过Wails框架自动绑定到前端，提供类型安全的调用方式。

## API接口列表

### 1. 词根管理接口

#### 1.1 GetAllRoots - 获取所有词根

**文件位置**: `backend/app/app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:12`
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

**调用示例** (前端 `services/api.ts`):
```typescript
const roots = await getAllRoots();
// roots = { "交易": "trade", "日期": "date", ... }
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function getAllRoots(): Promise<Record<string, string>> {
  try {
    const roots = await GoAPI.GetAllRoots();
    return roots || {};
  } catch (error) {
    console.error("Failed to load roots:", error);
    return {};
  }
}
```

**后端实现关键代码**:
```go
rows, err := a.db.Query("SELECT chinese, english FROM word_roots ORDER BY chinese")
// ... 遍历结果构建map
```

#### 1.2 AddRoot - 添加/更新词根

**文件位置**: `app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:4`
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

**调用示例** (前端 `services/api.ts`):
```typescript
await addRoot("区块链", "blockchain");
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function addRoot(chinese: string, english: string): Promise<void> {
  try {
    await GoAPI.AddRoot(chinese.trim(), english.trim());
  } catch (error) {
    console.error("Failed to add root:", error);
    throw error;
  }
}
```

**后端实现关键代码**:
```go
_, err := a.db.Exec(
    "INSERT OR REPLACE INTO word_roots (chinese, english, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    chinese, english,
)
```

#### 1.3 DeleteRoot - 删除词根

**文件位置**: `app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:8`
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

**调用示例** (前端 `services/api.ts`):
```typescript
await deleteRoot("区块链");
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function deleteRoot(chinese: string): Promise<void> {
  try {
    await GoAPI.DeleteRoot(chinese);
  } catch (error) {
    console.error("Failed to delete root:", error);
    throw error;
  }
}
```

**后端实现关键代码**:
```go
_, err := a.db.Exec("DELETE FROM word_roots WHERE chinese = ?", chinese)
```

#### 1.4 ClearAllRoots - 清空所有词根

**文件位置**: `app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:6`
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

**调用示例** (前端 `services/api.ts`):
```typescript
await clearAllRoots();
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function clearAllRoots(): Promise<void> {
  try {
    await GoAPI.ClearAllRoots();
  } catch (error) {
    console.error("Failed to clear roots:", error);
    throw error;
  }
}
```

**后端实现关键代码**:
```go
_, err := a.db.Exec("DELETE FROM word_roots")
```

#### 1.5 ImportRoots - 批量导入词根

**文件位置**: `app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:14`
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

**调用示例** (前端 `services/api.ts`):
```typescript
const rootsToImport = { "交易": "trade", "日期": "date" };
await importRoots(rootsToImport);
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function importRoots(roots: Record<string, string>): Promise<void> {
  try {
    await GoAPI.ImportRoots(roots);
  } catch (error) {
    console.error("Failed to import roots:", error);
    throw error;
  }
}
```

**后端实现关键代码**:
```go
tx, err := a.db.Begin()
stmt, err := tx.Prepare("INSERT OR REPLACE INTO word_roots ...")
// ... 批量插入
return tx.Commit()
```

#### 1.6 ExportRoots - 导出词根为CSV

**文件位置**: `app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:10`
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

**调用示例** (前端 `services/api.ts`):
```typescript
const csvContent = await exportRoots();
// csvContent = "中文词根,英文对应\n"交易","trade"\n"日期","date"\n"
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function exportRoots(): Promise<string> {
  try {
    const csvContent = await GoAPI.ExportRoots();
    return csvContent || "中文词根,英文对应\n";
  } catch (error) {
    console.error("Failed to export roots:", error);
    throw error;
  }
}
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

**文件位置**: `app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:16`
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

**调用示例** (前端 `services/api.ts`):
```typescript
const segments = await segmentText("交易日期");
// segments = [
//   { chinese: "交易", english: "trade", isUnknown: false },
//   { chinese: "日期", english: "date", isUnknown: false }
// ]
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function segmentText(text: string): Promise<SegmentationResult[]> {
  try {
    const segments = await GoAPI.SegmentText(text);
    return (segments || []) as SegmentationResult[];
  } catch (error) {
    console.error("Failed to segment text:", error);
    return [];
  }
}
```

**后端算法核心**:
- 使用最长匹配算法
- 最多匹配10个字符
- 支持UTF-8字符处理

#### 2.2 TranslateText - 文本翻译

**文件位置**: `app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:18`
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

**调用示例** (前端 `services/api.ts`):
```typescript
const translated = await translateText("交易日期");
// translated = "trade_date"
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function translateText(text: string): Promise<string> {
  try {
    const translated = await GoAPI.TranslateText(text);
    return translated || "";
  } catch (error) {
    console.error("Failed to translate text:", error);
    return "";
  }
}
```

**后端实现逻辑**:
1. 调用 `SegmentText` 进行分词
2. 将分词结果用下划线连接
3. 未知字符保持原样

### 3. 翻译历史接口

#### 3.1 SaveTranslationHistory - 保存翻译历史

**文件位置**: `backend/app/app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:12`
```typescript
export function SaveTranslationHistory(arg1:string, arg2:string): Promise<void>;
```

**Go方法签名**:
```go
func (a *App) SaveTranslationHistory(chineseText, englishText string) error
```

**功能描述**: 保存翻译记录到历史数据库。

**参数**:
- `chineseText: string` - 中文原文
- `englishText: string` - 英文翻译结果

**返回值**:
- `Promise<void>` - 成功时无返回值

**调用示例** (前端 `services/api.ts`):
```typescript
await saveTranslationHistory("交易日期", "trade_date");
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function saveTranslationHistory(chineseText: string, englishText: string): Promise<void> {
  try {
    await GoAPI.SaveTranslationHistory(chineseText, englishText);
  } catch (error) {
    console.error("Failed to save translation history:", error);
    // 不抛出错误，历史记录保存失败不应影响主要功能
  }
}
```

**后端实现关键代码**:
```go
_, err := a.db.Exec(
    "INSERT INTO translation_history (chinese_text, english_text) VALUES (?, ?)",
    chineseText, englishText,
)
```

#### 3.2 GetTranslationHistory - 获取翻译历史

**文件位置**: `backend/app/app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:10`
```typescript
export function GetTranslationHistory(): Promise<Array<Record<string, any>>>;
```

**Go方法签名**:
```go
func (a *App) GetTranslationHistory() ([]map[string]any, error)
```

**功能描述**: 获取所有翻译历史记录，按时间倒序排列。

**参数**: 无

**返回值**:
- `Promise<Array<Record<string, any>>>` - 历史记录数组

**返回数据结构**:
```typescript
interface TranslationHistoryItem {
    id: number;          // 记录ID
    chineseText: string; // 中文原文
    englishText: string; // 英文翻译
    createdAt: string;   // 创建时间
}
```

**调用示例** (前端 `services/api.ts`):
```typescript
const history = await getTranslationHistory();
// history = [
//   { id: 1, chineseText: "交易日期", englishText: "trade_date", createdAt: "2024-01-01 10:00:00" },
//   { id: 2, chineseText: "区块链", englishText: "blockchain", createdAt: "2024-01-01 09:30:00" }
// ]
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function getTranslationHistory(): Promise<TranslationHistoryItem[]> {
  try {
    const history = await GoAPI.GetTranslationHistory();
    return (history || []) as TranslationHistoryItem[];
  } catch (error) {
    console.error("Failed to get translation history:", error);
    return [];
  }
}
```

**后端实现关键代码**:
```go
rows, err := a.db.Query(
    "SELECT id, chinese_text, english_text, created_at FROM translation_history ORDER BY created_at DESC LIMIT 100",
)
```

#### 3.3 ClearTranslationHistory - 清空翻译历史

**文件位置**: `backend/app/app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:4`
```typescript
export function ClearTranslationHistory(): Promise<void>;
```

**Go方法签名**:
```go
func (a *App) ClearTranslationHistory() error
```

**功能描述**: 清空所有翻译历史记录。

**参数**: 无

**返回值**:
- `Promise<void>` - 成功时无返回值

**调用示例** (前端 `services/api.ts`):
```typescript
await clearTranslationHistory();
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function clearTranslationHistory(): Promise<void> {
  try {
    await GoAPI.ClearTranslationHistory();
  } catch (error) {
    console.error("Failed to clear translation history:", error);
    throw error;
  }
}
```

**后端实现关键代码**:
```go
_, err := a.db.Exec("DELETE FROM translation_history")
```

#### 3.4 IsTranslationComplete - 检查翻译完整性

**文件位置**: `backend/app/app.go`

**TypeScript定义**: `frontend/wailsjs/go/app/App.d.ts:8`
```typescript
export function IsTranslationComplete(arg1:string): Promise<boolean>;
```

**Go方法签名**:
```go
func (a *App) IsTranslationComplete(text string) (bool, error)
```

**功能描述**: 检查翻译是否完全成功（没有未知词根）。

**参数**:
- `text: string` - 要检查的中文文本

**返回值**:
- `Promise<boolean>` - 是否完全翻译成功

**调用示例** (前端 `services/api.ts`):
```typescript
const complete = await isTranslationComplete("交易日期");
// complete = true
```

**前端服务层封装** (`services/api.ts`):
```typescript
export async function isTranslationComplete(text: string): Promise<boolean> {
  try {
    const isComplete = await GoAPI.IsTranslationComplete(text);
    return isComplete || false;
  } catch (error) {
    console.error("Failed to check translation completeness:", error);
    return false;
  }
}
```

**后端实现关键代码** (`backend/service/translation.go`):
```go
func (s *TranslationService) IsTranslationComplete(text string) bool {
    segments := s.SegmentText(text)
    for _, segment := range segments {
        if segment.IsUnknown {
            return false
        }
    }
    return true
}
```

### 4. 应用生命周期接口

#### 4.1 startup - 应用启动初始化

**文件位置**: `app.go`

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

## 前端服务层架构

### 服务层设计原则

#### 1. 统一错误处理
所有API调用都包含错误处理逻辑：
```typescript
try {
  return await GoAPI.Method();
} catch (error) {
  console.error("操作失败:", error);
  // 返回默认值或抛出错误
}
```

#### 2. 类型安全
- 使用TypeScript类型定义确保类型安全
- 对后端返回的数据进行类型断言
- 提供统一的类型定义文件

#### 3. 业务逻辑封装
- 参数预处理（如trim操作）
- 数据格式转换
- 默认值处理

### 服务层文件结构

#### `services/api.ts` - API服务层
```typescript
// 词根管理API
export async function getAllRoots(): Promise<Record<string, string>>;
export async function addRoot(chinese: string, english: string): Promise<void>;
export async function deleteRoot(chinese: string): Promise<void>;
export async function clearAllRoots(): Promise<void>;
export async function importRoots(roots: Record<string, string>): Promise<void>;
export async function exportRoots(): Promise<string>;

// 翻译功能API
export async function segmentText(text: string): Promise<SegmentationResult[]>;
export async function translateText(text: string): Promise<string>;
```

#### `services/csv.ts` - 文件处理工具
```typescript
// CSV解析和生成
export function parseCSVContent(csvContent: string, existingRoots: Record<string, string>): ImportPreviewItem[];
export function downloadCSVFile(csvContent: string, filename: string): void;

// 剪贴板工具
export async function copyToClipboard(text: string): Promise<boolean>;
```

### 组件调用模式

#### 直接调用模式
```typescript
import { getAllRoots } from "../services/api";

const roots = await getAllRoots();
```

#### Hook封装模式
```typescript
// hooks/useRoots.ts
export function useRoots() {
  const [allRoots, setAllRoots] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllRoots().then(setAllRoots);
  }, []);

  return { allRoots, refreshRoots };
}

// 组件中使用
const { allRoots, refreshRoots } = useRoots();
```

### 优势

1. **代码复用**: 统一的服务层避免重复代码
2. **易于维护**: 业务逻辑集中管理
3. **类型安全**: 完整的TypeScript支持
4. **错误处理**: 统一的错误处理机制
5. **测试友好**: 服务层易于单元测试

这个API接口说明文档为开发者提供了完整的接口参考，包括每个接口的功能、参数、返回值和实现细节。
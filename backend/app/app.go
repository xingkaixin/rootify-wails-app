package app

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"runtime"

	"rootify-wails-app/backend/repository"
	"rootify-wails-app/backend/service"

	_ "github.com/mattn/go-sqlite3"
)

// App struct 保持与 Wails 绑定的结构
// 这是前端直接调用的接口层，方法签名必须保持不变
type App struct {
	ctx context.Context
	// 使用仓库模式，消除重复的数据库检查
	repo *repository.WordRootRepository
	// 直接存储数据库连接，用于历史记录操作
	db *sql.DB
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// Startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	a.initDB()
}

// initDB 初始化数据库连接
func (a *App) initDB() error {
	appDataDir, err := getAppDataDir()
	if err != nil {
		return fmt.Errorf("failed to get app data directory: %v", err)
	}

	dbPath := filepath.Join(appDataDir, "rootify.db")
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}

	// 创建表结构
	createTableSQL := `
		CREATE TABLE IF NOT EXISTS word_roots (
			chinese TEXT PRIMARY KEY,
			english TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_chinese ON word_roots(chinese);

		CREATE TABLE IF NOT EXISTS translation_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			chinese_text TEXT NOT NULL,
			english_text TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_history_created_at ON translation_history(created_at DESC);
	`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		return fmt.Errorf("failed to create table: %v", err)
	}

	// 初始化仓库
	a.repo = repository.NewWordRootRepository(db)
	a.db = db

	return nil
}

// GetAllRoots returns all word roots from database
// 方法签名保持不变，确保前端兼容性
func (a *App) GetAllRoots() (map[string]string, error) {
	if a.repo == nil {
		return nil, fmt.Errorf("repository not initialized")
	}
	return a.repo.GetAll()
}

// AddRoot adds a new word root to database
func (a *App) AddRoot(chinese, english string) error {
	if a.repo == nil {
		return fmt.Errorf("repository not initialized")
	}
	return a.repo.Add(chinese, english)
}

// DeleteRoot deletes a word root from database
func (a *App) DeleteRoot(chinese string) error {
	if a.repo == nil {
		return fmt.Errorf("repository not initialized")
	}
	return a.repo.Delete(chinese)
}

// ClearAllRoots deletes all word roots from database
func (a *App) ClearAllRoots() error {
	if a.repo == nil {
		return fmt.Errorf("repository not initialized")
	}
	return a.repo.ClearAll()
}

// ImportRoots imports multiple word roots to database
func (a *App) ImportRoots(roots map[string]string) error {
	if a.repo == nil {
		return fmt.Errorf("repository not initialized")
	}
	return a.repo.Import(roots)
}

// ExportRoots exports all word roots as CSV string
func (a *App) ExportRoots() (string, error) {
	if a.repo == nil {
		return "", fmt.Errorf("repository not initialized")
	}
	return a.repo.Export()
}

// SegmentText segments Chinese text using word roots
func (a *App) SegmentText(text string) ([]map[string]any, error) {
	if a.repo == nil {
		return nil, fmt.Errorf("repository not initialized")
	}

	roots, err := a.repo.GetAll()
	if err != nil {
		return nil, err
	}

	translationService := service.NewTranslationService(roots)
	segments := translationService.SegmentText(text)

	// 转换为前端期望的格式
	results := make([]map[string]any, len(segments))
	for i, segment := range segments {
		results[i] = map[string]any{
			"chinese":   segment.Chinese,
			"english":   segment.English,
			"isUnknown": segment.IsUnknown,
		}
	}

	return results, nil
}

// TranslateText translates Chinese text to English using word roots with underscores
func (a *App) TranslateText(text string) (string, error) {
	if a.repo == nil {
		return "", fmt.Errorf("repository not initialized")
	}

	roots, err := a.repo.GetAll()
	if err != nil {
		return "", err
	}

	translationService := service.NewTranslationService(roots)
	return translationService.TranslateText(text), nil
}

// SaveTranslationHistory saves a translation record to history
func (a *App) SaveTranslationHistory(chineseText, englishText string) error {
	if a.db == nil {
		return fmt.Errorf("database not initialized")
	}

	// 简单的插入操作，无需复杂逻辑
	_, err := a.db.Exec(
		"INSERT INTO translation_history (chinese_text, english_text) VALUES (?, ?)",
		chineseText, englishText,
	)
	return err
}

// GetTranslationHistory returns all translation history records
func (a *App) GetTranslationHistory() ([]map[string]any, error) {
	if a.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	rows, err := a.db.Query(
		"SELECT id, chinese_text, english_text, created_at FROM translation_history ORDER BY created_at DESC LIMIT 100",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []map[string]any
	for rows.Next() {
		var id int
		var chineseText, englishText, createdAt string

		if err := rows.Scan(&id, &chineseText, &englishText, &createdAt); err != nil {
			return nil, err
		}

		history = append(history, map[string]any{
			"id":          id,
			"chineseText": chineseText,
			"englishText": englishText,
			"createdAt":   createdAt,
		})
	}

	return history, nil
}

// ClearTranslationHistory clears all translation history records
func (a *App) ClearTranslationHistory() error {
	if a.db == nil {
		return fmt.Errorf("database not initialized")
	}

	_, err := a.db.Exec("DELETE FROM translation_history")
	return err
}

// IsTranslationComplete 检查翻译是否完全成功（没有未知词根）
func (a *App) IsTranslationComplete(text string) (bool, error) {
	if a.repo == nil {
		return false, fmt.Errorf("repository not initialized")
	}

	roots, err := a.repo.GetAll()
	if err != nil {
		return false, err
	}

	translationService := service.NewTranslationService(roots)
	return translationService.IsTranslationComplete(text), nil
}

// getAppDataDir 获取应用数据目录（跨平台）
func getAppDataDir() (string, error) {
	var appDataDir string

	switch runtime.GOOS {
	case "darwin":
		// macOS: ~/Library/Application Support/rootify/
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("failed to get home directory: %v", err)
		}
		appDataDir = filepath.Join(homeDir, "Library", "Application Support", "rootify")
	case "windows":
		// Windows: %APPDATA%/rootify/
		appData := os.Getenv("APPDATA")
		if appData == "" {
			return "", fmt.Errorf("APPDATA environment variable not set")
		}
		appDataDir = filepath.Join(appData, "rootify")
	case "linux":
		// Linux: ~/.config/rootify/
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("failed to get home directory: %v", err)
		}
		appDataDir = filepath.Join(homeDir, ".config", "rootify")
	default:
		return "", fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}

	// Create directory if it doesn't exist
	err := os.MkdirAll(appDataDir, 0755)
	if err != nil {
		return "", fmt.Errorf("failed to create app data directory: %v", err)
	}

	return appDataDir, nil
}
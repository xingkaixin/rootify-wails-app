package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"unicode/utf8"

	_ "github.com/mattn/go-sqlite3"
)

// App struct
type App struct {
	ctx context.Context
	db *sql.DB
	mu sync.RWMutex
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.initDB()
}

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

	a.db = db

	// Create table if not exists
	createTableSQL := `
		CREATE TABLE IF NOT EXISTS word_roots (
			chinese TEXT PRIMARY KEY,
			english TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		CREATE INDEX IF NOT EXISTS idx_chinese ON word_roots(chinese);
	`

	_, err = a.db.Exec(createTableSQL)
	if err != nil {
		return fmt.Errorf("failed to create table: %v", err)
	}

	return nil
}

// GetAllRoots returns all word roots from database
func (a *App) GetAllRoots() (map[string]string, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	if a.db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	rows, err := a.db.Query("SELECT chinese, english FROM word_roots ORDER BY chinese")
	if err != nil {
		return nil, fmt.Errorf("failed to query roots: %v", err)
	}
	defer rows.Close()

	roots := make(map[string]string)
	for rows.Next() {
		var chinese, english string
		if err := rows.Scan(&chinese, &english); err != nil {
			return nil, fmt.Errorf("failed to scan row: %v", err)
		}
		roots[chinese] = english
	}

	return roots, nil
}

// AddRoot adds a new word root to database
func (a *App) AddRoot(chinese, english string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.db == nil {
		return fmt.Errorf("database not initialized")
	}

	_, err := a.db.Exec(
		"INSERT OR REPLACE INTO word_roots (chinese, english, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
		chinese, english,
	)
	if err != nil {
		return fmt.Errorf("failed to add root: %v", err)
	}

	return nil
}

// DeleteRoot deletes a word root from database
func (a *App) DeleteRoot(chinese string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.db == nil {
		return fmt.Errorf("database not initialized")
	}

	_, err := a.db.Exec("DELETE FROM word_roots WHERE chinese = ?", chinese)
	if err != nil {
		return fmt.Errorf("failed to delete root: %v", err)
	}

	return nil
}

// ClearAllRoots deletes all word roots from database
func (a *App) ClearAllRoots() error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.db == nil {
		return fmt.Errorf("database not initialized")
	}

	_, err := a.db.Exec("DELETE FROM word_roots")
	if err != nil {
		return fmt.Errorf("failed to clear roots: %v", err)
	}

	return nil
}

// ImportRoots imports multiple word roots to database
func (a *App) ImportRoots(roots map[string]string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	if a.db == nil {
		return fmt.Errorf("database not initialized")
	}

	tx, err := a.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare("INSERT OR REPLACE INTO word_roots (chinese, english, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %v", err)
	}
	defer stmt.Close()

	for chinese, english := range roots {
		_, err := stmt.Exec(chinese, english)
		if err != nil {
			return fmt.Errorf("failed to insert root %s: %v", chinese, err)
		}
	}

	return tx.Commit()
}

// ExportRoots exports all word roots as CSV string
func (a *App) ExportRoots() (string, error) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	if a.db == nil {
		return "", fmt.Errorf("database not initialized")
	}

	rows, err := a.db.Query("SELECT chinese, english FROM word_roots ORDER BY chinese")
	if err != nil {
		return "", fmt.Errorf("failed to query roots: %v", err)
	}
	defer rows.Close()

	var csvContent string
	csvContent = "中文词根,英文对应\n"

	for rows.Next() {
		var chinese, english string
		if err := rows.Scan(&chinese, &english); err != nil {
			return "", fmt.Errorf("failed to scan row: %v", err)
		}
		csvContent += fmt.Sprintf("\"%s\",\"%s\"\n", chinese, english)
	}

	return csvContent, nil
}

// SegmentText segments Chinese text using word roots
func (a *App) SegmentText(text string) ([]map[string]any, error) {
	roots, err := a.GetAllRoots()
	if err != nil {
		return nil, err
	}

	results := []map[string]any{}
	i := 0

	for i < len(text) {
		matched := false

		// 尝试匹配最长可能的词根（最多10个字符）
		for length := min(10, len(text)-i); length >= 1; length-- {
			substring := text[i : i+length]
			if english, exists := roots[substring]; exists {
				results = append(results, map[string]any{
					"chinese":  substring,
					"english":  english,
					"isUnknown": false,
				})
				i += length
				matched = true
				break
			}
		}

		if !matched {
			// 正确处理UTF-8字符
			runeValue, size := utf8.DecodeRuneInString(text[i:])
			if size == 0 {
				break
			}

			results = append(results, map[string]any{
				"chinese":  string(runeValue),
				"english":  "",
				"isUnknown": true,
			})
			i += size
		}
	}

	return results, nil
}

// TranslateText translates Chinese text to English using word roots with underscores
func (a *App) TranslateText(text string) (string, error) {
	segments, err := a.SegmentText(text)
	if err != nil {
		return "", err
	}

	var result strings.Builder
	for i, segment := range segments {
		if i > 0 {
			result.WriteString("_")
		}

		english := segment["english"].(string)
		if english == "" {
			// 对于未翻译的中文字符，保持原样
			result.WriteString(segment["chinese"].(string))
		} else {
			result.WriteString(english)
		}
	}

	return result.String(), nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

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

package repository

import (
	"database/sql"
	"fmt"
	"sync"
)

// WordRootRepository 处理词根数据的存储和检索
// 集中管理数据库操作，消除重复的 nil 检查
type WordRootRepository struct {
	db *sql.DB
	mu sync.RWMutex
}

// NewWordRootRepository 创建新的词根仓库实例
func NewWordRootRepository(db *sql.DB) *WordRootRepository {
	return &WordRootRepository{
		db: db,
	}
}

// GetAll 获取所有词根
func (r *WordRootRepository) GetAll() (map[string]string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	rows, err := r.db.Query("SELECT chinese, english FROM word_roots ORDER BY chinese")
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

// Add 添加或更新词根
func (r *WordRootRepository) Add(chinese, english string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	_, err := r.db.Exec(
		"INSERT OR REPLACE INTO word_roots (chinese, english, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
		chinese, english,
	)
	if err != nil {
		return fmt.Errorf("failed to add root: %v", err)
	}

	return nil
}

// Delete 删除词根
func (r *WordRootRepository) Delete(chinese string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	_, err := r.db.Exec("DELETE FROM word_roots WHERE chinese = ?", chinese)
	if err != nil {
		return fmt.Errorf("failed to delete root: %v", err)
	}

	return nil
}

// ClearAll 清空所有词根
func (r *WordRootRepository) ClearAll() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	_, err := r.db.Exec("DELETE FROM word_roots")
	if err != nil {
		return fmt.Errorf("failed to clear roots: %v", err)
	}

	return nil
}

// Import 批量导入词根
func (r *WordRootRepository) Import(roots map[string]string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	tx, err := r.db.Begin()
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

// Export 导出所有词根为 CSV 格式
func (r *WordRootRepository) Export() (string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	rows, err := r.db.Query("SELECT chinese, english FROM word_roots ORDER BY chinese")
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
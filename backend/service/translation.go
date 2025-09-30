package service

import (
	"unicode/utf8"
)

// SegmentationResult 表示文本分割的结果
type SegmentationResult struct {
	Chinese   string `json:"chinese"`
	English   string `json:"english"`
	IsUnknown bool   `json:"isUnknown"`
}

// TranslationService 处理文本分割和翻译业务逻辑
type TranslationService struct {
	wordRoots map[string]string
}

// NewTranslationService 创建新的翻译服务实例
func NewTranslationService(wordRoots map[string]string) *TranslationService {
	return &TranslationService{
		wordRoots: wordRoots,
	}
}

// SegmentText 分割中文文本为词根序列
// 使用最长匹配算法，优先匹配最长的词根
func (s *TranslationService) SegmentText(text string) []SegmentationResult {
	results := []SegmentationResult{}
	i := 0

	for i < len(text) {
		matched := false

		// 尝试匹配最长可能的词根（最多10个字符）
		for length := min(10, len(text)-i); length >= 1; length-- {
			substring := text[i : i+length]
			if english, exists := s.wordRoots[substring]; exists {
				results = append(results, SegmentationResult{
					Chinese:   substring,
					English:   english,
					IsUnknown: false,
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

			results = append(results, SegmentationResult{
				Chinese:   string(runeValue),
				English:   "",
				IsUnknown: true,
			})
			i += size
		}
	}

	return results
}

// TranslateText 将中文文本翻译为英文，使用下划线连接
func (s *TranslationService) TranslateText(text string) string {
	segments := s.SegmentText(text)

	var result string
	for i, segment := range segments {
		if i > 0 {
			result += "_"
		}

		if segment.English == "" {
			// 对于未翻译的中文字符，保持原样
			result += segment.Chinese
		} else {
			result += segment.English
		}
	}

	return result
}

// IsTranslationComplete 检查翻译是否完全成功（没有未知词根）
func (s *TranslationService) IsTranslationComplete(text string) bool {
	segments := s.SegmentText(text)

	for _, segment := range segments {
		if segment.IsUnknown {
			return false
		}
	}

	return true
}

// min 返回两个整数中的较小值
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
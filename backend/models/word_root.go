package models

// WordRoot 表示一个中文词根及其英文对应
// 这是核心数据结构，定义了词根映射关系
type WordRoot struct {
	Chinese  string `json:"chinese"`
	English  string `json:"english"`
}
package models

import (
	"database/sql"
	"time"
)

type ReportJob struct {
	ID           uint         `gorm:"primaryKey" json:"id"`
	ReportType   string       `gorm:"not null" json:"report_type"`
	Status       string       `gorm:"not null;default:'pending'" json:"status"` // pending, processing, completed, failed
	InputData    string       `gorm:"type:text" json:"input_data"`             // Store input JSON string
	MinioBucket  string       `json:"minio_bucket,omitempty"`
	MinioKey     string       `json:"minio_key,omitempty"`
	DownloadURL  string       `json:"download_url,omitempty"`
	ErrorMessage string       `json:"error_message,omitempty"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
	CompletedAt  sql.NullTime `json:"completed_at,omitempty"`
}

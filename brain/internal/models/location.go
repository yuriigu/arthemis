package models

import (
	"database/sql/driver"
	"encoding/json"

	"gorm.io/gorm"
)

type JSONB map[string]any

func (j JSONB) Value() (driver.Value, error) {
	valueString, err := json.Marshal(j)
	return string(valueString), err
}

func (j *JSONB) Scan(value any) error {
	if err := json.Unmarshal(value.([]byte), &j); err != nil {
		return err
	}
	return nil
}

type Location struct {
	gorm.Model
	ProjectID  uint
	Ecosystem  string  `gorm:"type:varchar(100)"`
	Extent     float32 `gorm:"type:decimal"`
	Country    string  `gorm:"type:varchar(100)"`
	Position   JSONB   `gorm:"type:jsonb"`
	Indicators []Indicator
}

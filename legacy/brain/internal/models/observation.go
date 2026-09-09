package models

import (
	"time"

	"gorm.io/gorm"
)

type Observation struct {
	gorm.Model
	IndicatorID uint
	Value       float32   `gorm:"type:decimal"`
	Date        time.Time `gorm:"type:date"`
	Position    JSONB     `gorm:"type:jsonb"`
}

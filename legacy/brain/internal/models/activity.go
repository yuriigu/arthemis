package models

import (
	"gorm.io/gorm"
)

type Activity struct {
	gorm.Model
	ProjectID     uint
	Name          string     `gorm:"type:varchar(100)"`
	Description   string     `gorm:"type:text"`
	Justification string     `gorm:"type:text"`
	Locations     []Location `gorm:"many2many:activity_locations;"`
	Indicators    []Indicator
}

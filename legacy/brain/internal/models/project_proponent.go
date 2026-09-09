package models

import "gorm.io/gorm"

type ProjectProponent struct {
	gorm.Model
	ProponentID uint
	ProjectID   uint
	Role        string `gorm:"type:varchar(50)"`
}

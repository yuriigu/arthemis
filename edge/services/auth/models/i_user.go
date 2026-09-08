package models

type User struct {
	Sub      string `gorm:"primaryKey;column:sub"`
	Username string `gorm:"uniqueIndex;not null;column:username"`
	Password string `gorm:"not null;column:password"`
	Role     string `gorm:"not null;column:role"`
}

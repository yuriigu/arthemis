package database

import (
	"fmt"
	"log/slog"
	"time"

	"arthemis-brain/internal/env"
	"arthemis-brain/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectToDatabase(logger *slog.Logger) (*gorm.DB, error) {
	host := env.GetEnv("DB_HOST", "arthemis-brain-postgres")
	port := env.GetEnv("DB_PORT", "5432")
	user := env.GetEnv("DB_USER", "app_user")
	password := env.GetEnv("DB_PASSWORD", "app_password")
	databaseName := env.GetEnv("DB_NAME", "app_db")
	// dev := env.GetEnv("DEVELOPMENT", "true")

	connectionString := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host,
		port,
		user,
		password,
		databaseName,
	)

	db, err := gorm.Open(
		postgres.Open(connectionString),
		&gorm.Config{},
	)
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxIdleTime(30 * time.Minute)

	if err := db.AutoMigrate(&models.Proponent{}); err != nil {
		logger.Error("Error on AutoMigrate: Proponent")
		return nil, err
	}
	if err := db.AutoMigrate(&models.Project{}); err != nil {
		logger.Error("Error on AutoMigrate: Project")
		return nil, err
	}
	if err := db.AutoMigrate(&models.ProjectProponent{}); err != nil {
		logger.Error("Error on AutoMigrate: ProjectProponent")
		return nil, err
	}
	if err := db.AutoMigrate(&models.Activity{}); err != nil {
		logger.Error("Error on AutoMigrate: Activity")
		return nil, err
	}
	if err := db.AutoMigrate(&models.Location{}); err != nil {
		logger.Error("Error on AutoMigrate: Location")
		return nil, err
	}
	if err := db.AutoMigrate(&models.Indicator{}); err != nil {
		logger.Error("Error on AutoMigrate: Indicator")
		return nil, err
	}
	if err := db.AutoMigrate(&models.Observation{}); err != nil {
		logger.Error("Error on AutoMigrate: Observation")
		return nil, err
	}
	if err := db.AutoMigrate(&models.User{}); err != nil {
		logger.Error("Error on AutoMigrate: User")
		return nil, err
	}

	return db, nil
}

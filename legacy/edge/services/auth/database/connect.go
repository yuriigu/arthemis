package database

import (
	"fmt"
	"time"

	"github.com/andre-homelab/arthemis-edge/handlers"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect() (*gorm.DB, error) {
	host := handlers.GetEnv("DB_HOST")
	port := handlers.GetEnv("DB_PORT")
	user := handlers.GetEnv("DB_USER")
	password := handlers.GetEnv("DB_PASSWORD")
	databaseName := handlers.GetEnv("DB_NAME")
	dev := handlers.GetEnv("DEVELOPMENT")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=UTC",
		host, port, user, password, databaseName,
	)

	logLevel := logger.Warn

	if dev == "true" {
		logLevel = logger.Info
	}

	gormCfg := &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	}

	db, err := gorm.Open(postgres.Open(dsn), gormCfg)

	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	return db, nil
}

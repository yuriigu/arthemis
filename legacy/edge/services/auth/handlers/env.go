package handlers

import (
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

func init() {
	slog.Debug("rodando...")

	if err := godotenv.Load("./.env"); err == nil {
		slog.Info(".env encontrado.")
		return
	}

	slog.Error("nenhum arquivo .env encontrado.")
	os.Exit(1)
}

func GetEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		slog.Error("environment variable %s is required!", "key", key)
		os.Exit(1)
	}
	return value
}

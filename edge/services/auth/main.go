package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"

	_ "github.com/andre-homelab/arthemis-edge/docs"
	"github.com/andre-homelab/arthemis-edge/handlers"
	"github.com/andre-homelab/arthemis-edge/models"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	httpSwagger "github.com/swaggo/http-swagger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// @title           Authentication API
// @version         1.0
// @description     API service for JWT token validation and authentication.
// @termsOfService  http://swagger.io/terms/

// @license.name  MIT
// @license.url   http://opensource.org/licenses/MIT

// @host      localhost:6769
// @BasePath  /

// @securityDefinitions.apikey BearerAuth
// @in                         header
// @name                       Authorization
// @description                Type "Bearer " followed by your JWT token.

func main() {
	initDatabase()

	mux := chi.NewRouter()

	mux.Use(middleware.Logger)
	mux.Use(middleware.Recoverer)
	mux.Use(middleware.RealIP)

	mux.Get("/health", handlers.Health)

	/*
		Aparentemente, ao fazer o roteamento dentro de uma docker network usando o chi causa um comportamento inesperado com o método mux.Route().
		Assim, decidi usar o MethodFunc() para lidar com essas questões.
	*/
	mux.MethodFunc(http.MethodGet, "/validate", handlers.Validate)
	mux.MethodFunc(http.MethodPost, "/validate", handlers.Validate)
	mux.MethodFunc(http.MethodGet, "/validate/", handlers.Validate)
	mux.MethodFunc(http.MethodPost, "/validate/", handlers.Validate)

	mux.Route("/login", func(mux chi.Router) {
		mux.Post("/", handlers.Login)
	})

	mux.Route("/register", func(mux chi.Router) {
		mux.Post("/", handlers.Register)
	})

	mux.Route("/unregister", func(mux chi.Router) {
		mux.Post("/", handlers.Unregister)
	})

	mux.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("doc.json"),
	))

	slog.Info("Server running on", "port", 6769)
	slog.Info("API documentation on", "URL", "http://localhost:6769/swagger/index.html")
	if err := http.ListenAndServe(":6769", mux); err != nil {
		slog.Error("Failed to start server", "err", err)
	}
}

func initDatabase() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		handlers.GetEnv("DB_HOST"),
		handlers.GetEnv("DB_USER"),
		handlers.GetEnv("DB_PASSWORD"),
		handlers.GetEnv("DB_NAME"),
		handlers.GetEnv("DB_PORT"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err := db.AutoMigrate(&models.User{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	handlers.DB = db
}

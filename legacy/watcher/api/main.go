// @title           Arthemis Watcher API
// @version         1.0
// @description     API service for Arthemis Watcher.
// @termsOfService  http://swagger.io/terms/

// @license.name  MIT
// @license.url   http://opensource.org/licenses/MIT

// @host      localhost:8082
// @BasePath  /
package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"arthemis-watcher/internal/database"
	"arthemis-watcher/internal/env"
	"arthemis-watcher/internal/handlers"
	"arthemis-watcher/internal/reports"

	_ "arthemis-watcher/docs"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	httpSwagger "github.com/swaggo/http-swagger"
)

func main() {
	r := chi.NewRouter()
	r.Use(chiMiddleware.Logger)
	r.Use(CORSMiddleware)

	textHandler := slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})

	logger := slog.New(textHandler)

	db, err := database.ConnectToDatabase(logger)
	if err != nil {
		for i := 0; i < 10; i++ {
			logger.Warn("Failed to connect to database, retrying in 2 seconds...", "attempt", i+1, "error", err)
			time.Sleep(2 * time.Second)
			db, err = database.ConnectToDatabase(logger)
			if err == nil {
				break
			}
		}
	}

	if err != nil {
		logger.Error("Failed to initialize database after retries! Exiting.")
		os.Exit(1)
	}

	healthHandler := handlers.HealthHandler(logger, db)
	r.Get("/health", healthHandler.HealthCheck)

	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("doc.json"),
	))

	auditHandler := handlers.AuditHandler(logger, db)
	r.Post("/audit/log", auditHandler.CreateAuditLog)

	// Initialize MinIO storage
	var storage *reports.MinioStorage
	if db != nil {
		var err error
		storage, err = reports.NewMinioStorage(logger)
		if err != nil {
			logger.Error("Failed to initialize MinIO storage, PDF uploads will be unavailable!", "error", err)
		} else {
			logger.Info("MinIO storage initialized successfully")
		}
	}

	// Initialize and start reports worker pool
	var pool *reports.WorkerPool
	if db != nil {
		pool = reports.NewWorkerPool(db, storage, logger, 5) // 5 concurrent workers
		pool.Start()
		
		// Clean start: submit any pending or interrupted jobs from the DB
		pool.RecoverPendingJobs()
	}

	// Register reports handlers
	if db != nil && pool != nil {
		reportHandler := handlers.ReportHandler(logger, db, storage, pool)
		r.Post("/reports", reportHandler.RequestReport)
		r.Get("/reports/{id}", reportHandler.GetReportStatus)
	}

	port := env.GetEnv("PORT", "8082")
	logger.Info("Server started!")
	logger.Info("http://localhost:" + port)

	if err := http.ListenAndServe(":"+port, r); err != nil {
		logger.Error("HTTP routing error", "error", err)
	}
}

// CORSMiddleware handles Cross-Origin Resource Sharing (CORS) preflight and credentials headers.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

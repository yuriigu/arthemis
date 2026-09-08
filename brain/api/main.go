// @title           Arthemis Brain API
// @version         1.0
// @description     API service for Arthemis Brain.
// @termsOfService  http://swagger.io/terms/

// @license.name  MIT
// @license.url   http://opensource.org/licenses/MIT

// @host      localhost:8081
// @BasePath  /
package main

import (
	"log/slog"
	"net/http"
	"os"

	"arthemis-brain/internal/database"
	"arthemis-brain/internal/handlers"

	_ "arthemis-brain/docs"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	httpSwagger "github.com/swaggo/http-swagger"
)

func main() {
	r := chi.NewRouter()
	r.Use(chiMiddleware.Logger)
	// r.Use(ownMiddleware.PermissionMiddleware)

	textHandler := slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})

	logger := slog.New(textHandler)

	db, err := database.ConnectToDatabase(logger)
	if err != nil {
		logger.Error("Error initializing database!")
	}

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		if _, err := w.Write([]byte("Hello World!")); err != nil {
			logger.Error("Error")
		}
	})

	healthHandler := handlers.HealthHandler(logger, db)
	r.Get("/health", healthHandler.HealthCheck)

	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("doc.json"),
	))

	proponentHandler := handlers.ProponentHandler(logger, db)
	r.Route("/proponent", func(r chi.Router) {
		r.Post("/create", proponentHandler.CreateProponent)
		r.Get("/{id}", proponentHandler.GetProponent)
		r.Get("/", proponentHandler.GetAllProponents)
		r.Patch("/update/{id}", proponentHandler.UpdateProponent)
		r.Delete("/delete/{id}", proponentHandler.DeleteProponent)
	})

	projectHandler := handlers.ProjectHandler(logger, db)
	r.Route("/project", func(r chi.Router) {
		r.Post("/create", projectHandler.CreateProject)
		r.Get("/{id}", projectHandler.GetProject)
		r.Put("/update/{id}", projectHandler.UpdateProject)
		r.Delete("/delete/{id}", projectHandler.DeleteProject)
		r.Post("/{id}/add_proponent", projectHandler.AddProponent)
		r.Delete("/{projectId}/remove_proponent/{proponentId}", projectHandler.RemoveProponent)
	})

	activityHandler := handlers.ActivityHandler(logger, db)
	r.Route("/activity", func(r chi.Router) {
		r.Post("/create", activityHandler.CreateActivity)
		r.Get("/{id}", activityHandler.GetActivity)
		r.Put("/update/{id}", activityHandler.UpdateActivity)
		r.Delete("/delete/{id}", activityHandler.DeleteActivity)
	})

	locationHandler := handlers.LocationHandler(logger, db)
	r.Route("/location", func(r chi.Router) {
		r.Post("/create", locationHandler.CreateLocation)
		r.Get("/{id}", locationHandler.GetLocation)
		r.Put("/update/{id}", locationHandler.UpdateLocation)
		r.Delete("/delete/{id}", locationHandler.DeleteLocation)
	})

	indicatorHandler := handlers.IndicatorHandler(logger, db)
	r.Route("/indicator", func(r chi.Router) {
		r.Post("/create", indicatorHandler.CreateIndicator)
		r.Get("/{id}", indicatorHandler.GetIndicator)
		r.Put("/update/{id}", indicatorHandler.UpdateIndicator)
		r.Delete("/delete/{id}", indicatorHandler.DeleteIndicator)
	})

	userHandler := handlers.UserHandler(logger, db)
	r.Route("/user", func(r chi.Router) {
		r.Post("/create", userHandler.CreateUser)
		r.Get("/{id}", userHandler.GetUser)
		r.Get("/", userHandler.GetAllUsers)
		r.Patch("/update/{id}", userHandler.UpdateUser)
		r.Delete("/delete/{id}", userHandler.DeleteUser)
	})

	observationHandler := handlers.ObservationHandler(logger, db)
	r.Route("/observation", func(r chi.Router) {
		r.Post("/create", observationHandler.CreateObservations)
		r.Get("/{id}", observationHandler.GetObservation)
		r.Patch("/update/{id}", observationHandler.UpdateObservation)
		r.Delete("/delete/{id}", observationHandler.DeleteObservation)
	})

	logger.Info("Server started!")
	logger.Info("http://localhost:8081")

	if err := http.ListenAndServe(":8081", r); err != nil {
		logger.Error("HTTP routing error", "error", err)
	}
}

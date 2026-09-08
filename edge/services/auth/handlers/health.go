package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/andre-homelab/arthemis-edge/models"
)

// Health returns the current service status and its critical dependency checks.
// @Summary      Health check
// @Description  Reports service availability and database connectivity.
// @Tags         Operational
// @Produce      json
// @Success      200  {object}  models.HealthCheckResponse  "Service healthy"
// @Failure      503  {object}  models.HealthCheckResponse  "Service unhealthy"
// @Router       /health [get]
func Health(w http.ResponseWriter, _ *http.Request) {
	response := models.HealthCheckResponse{
		Status:    "ok",
		Service:   "auth",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Checks: map[string]models.HealthCheck{
			"database": {
				Status: "up",
			},
		},
	}

	statusCode := http.StatusOK

	if DB == nil {
		response.Status = "degraded"
		response.Checks["database"] = models.HealthCheck{
			Status:  "down",
			Message: "database connection not initialized",
		}
		statusCode = http.StatusServiceUnavailable
	} else {
		sqlDB, err := DB.DB()
		if err != nil {
			response.Status = "degraded"
			response.Checks["database"] = models.HealthCheck{
				Status:  "down",
				Message: "failed to access database handle",
			}
			statusCode = http.StatusServiceUnavailable
		} else {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			if err := sqlDB.PingContext(ctx); err != nil {
				response.Status = "degraded"
				response.Checks["database"] = models.HealthCheck{
					Status:  "down",
					Message: "database ping failed",
				}
				statusCode = http.StatusServiceUnavailable
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(response)
}

package handlers

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"arthemis-watcher/internal/models"
	"arthemis-watcher/internal/reports"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

type ReportParams struct {
	logger  *slog.Logger
	db      *gorm.DB
	storage *reports.MinioStorage
	pool    *reports.WorkerPool
}

// ReportHandler initializes and returns a ReportParams controller instance.
func ReportHandler(logger *slog.Logger, db *gorm.DB, storage *reports.MinioStorage, pool *reports.WorkerPool) *ReportParams {
	return &ReportParams{
		logger:  logger,
		db:      db,
		storage: storage,
		pool:    pool,
	}
}

// RequestReportPayload defines the request schema to submit a report job.
type RequestReportPayload struct {
	ReportType string          `json:"report_type"` // e.g. "project_summary"
	Data       json.RawMessage `json:"data"`        // Flexible JSON payload containing report content
}

// RequestReport handles creating a report generation job.
// @Summary      Request Report
// @Description  Creates an asynchronous report generation job and enqueues it.
// @Tags         reports
// @Accept       json
// @Produce      json
// @Param        payload  body      RequestReportPayload  true  "Report Request payload"
// @Success      202      {object}  models.ReportJob       "Job accepted and enqueued"
// @Failure      400      {object}  map[string]string      "Invalid request body"
// @Failure      500      {object}  map[string]string      "Failed to create job"
// @Router       /reports [post]
func (rp *ReportParams) RequestReport(w http.ResponseWriter, r *http.Request) {
	var payload RequestReportPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		rp.logger.Error("failed to decode report request body", "err", err)
		rp.writeJSONError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if payload.ReportType == "" {
		rp.writeJSONError(w, http.StatusBadRequest, "report_type is required")
		return
	}

	// Create new job in db
	job := models.ReportJob{
		ReportType: payload.ReportType,
		Status:     "pending",
		InputData:  string(payload.Data),
	}

	if err := rp.db.Create(&job).Error; err != nil {
		rp.logger.Error("failed to create report job in database", "err", err)
		rp.writeJSONError(w, http.StatusInternalServerError, "Failed to create report job")
		return
	}

	// Submit to worker pool for async processing
	rp.pool.Submit(job.ID)

	w.Header().Set("content-type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_ = json.NewEncoder(w).Encode(job)
}

// GetReportStatus retrieves the status of a report generation job.
// @Summary      Get Report Status
// @Description  Retrieves the status of a report job by ID. If complete, returns the temporary MinIO download URL.
// @Tags         reports
// @Produce      json
// @Param        id   path      int  true  "Job ID"
// @Success      200  {object}  models.ReportJob   "Current job details"
// @Failure      400  {object}  map[string]string  "Invalid Job ID"
// @Failure      404  {object}  map[string]string  "Job not found"
// @Failure      500  {object}  map[string]string  "Failed to fetch job"
// @Router       /reports/{id} [get]
func (rp *ReportParams) GetReportStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		rp.writeJSONError(w, http.StatusBadRequest, "Invalid Job ID")
		return
	}

	var job models.ReportJob
	if err := rp.db.First(&job, uint(id)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			rp.writeJSONError(w, http.StatusNotFound, "Job not found")
			return
		}
		rp.logger.Error("failed to fetch job status", "id", id, "err", err)
		rp.writeJSONError(w, http.StatusInternalServerError, "Failed to fetch job status")
		return
	}

	// Regenerate a fresh presigned URL if completed and storage is configured.
	// This ensures the link is never expired when requested by the user.
	if job.Status == "completed" && rp.storage != nil && job.MinioKey != "" {
		freshURL, err := rp.storage.GetPresignedURL(r.Context(), job.MinioKey)
		if err == nil {
			job.DownloadURL = freshURL
		} else {
			rp.logger.Warn("failed to regenerate presigned URL, using database fallback", "id", id, "err", err)
		}
	}

	w.Header().Set("content-type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(job)
}

func (rp *ReportParams) writeJSONError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

package reports

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"arthemis-watcher/internal/models"

	"gorm.io/gorm"
)

// WorkerPool manages asynchronous processing of report generation jobs.
type WorkerPool struct {
	db      *gorm.DB
	storage *MinioStorage
	logger  *slog.Logger
	jobChan chan uint
	wg      sync.WaitGroup
	workers int
}

// NewWorkerPool creates a new instance of the worker pool.
func NewWorkerPool(db *gorm.DB, storage *MinioStorage, logger *slog.Logger, workers int) *WorkerPool {
	return &WorkerPool{
		db:      db,
		storage: storage,
		logger:  logger,
		jobChan: make(chan uint, 100),
		workers: workers,
	}
}

// Start spawns the worker goroutines.
func (wp *WorkerPool) Start() {
	wp.logger.Info("Starting report worker pool", "workers", wp.workers)
	for i := 0; i < wp.workers; i++ {
		wp.wg.Add(1)
		go wp.worker(i)
	}
}

// Submit enqueues a job ID to be processed by one of the workers.
func (wp *WorkerPool) Submit(jobID uint) {
	wp.jobChan <- jobID
}

// RecoverPendingJobs scans the database for unfinished tasks on startup and submits them.
func (wp *WorkerPool) RecoverPendingJobs() {
	var pendingJobs []models.ReportJob
	// Recover pending or previously processing (interrupted) jobs
	err := wp.db.Where("status = ? OR status = ?", "pending", "processing").Find(&pendingJobs).Error
	if err != nil {
		wp.logger.Error("Failed to query pending jobs for recovery", "err", err)
		return
	}

	if len(pendingJobs) > 0 {
		wp.logger.Info("Recovering pending or interrupted report jobs", "count", len(pendingJobs))
		for _, job := range pendingJobs {
			if job.Status == "processing" {
				// Reset interrupted job status to pending
				job.Status = "pending"
				wp.db.Save(&job)
			}
			wp.Submit(job.ID)
		}
	}
}

// Stop closes the channel and waits for all workers to finish.
func (wp *WorkerPool) Stop() {
	close(wp.jobChan)
	wp.wg.Wait()
	wp.logger.Info("Report worker pool stopped")
}

func (wp *WorkerPool) worker(id int) {
	defer wp.wg.Done()
	wp.logger.Debug("Worker started", "worker_id", id)

	for jobID := range wp.jobChan {
		wp.logger.Info("Worker picked up job", "worker_id", id, "job_id", jobID)
		wp.processJob(jobID)
	}
}

func (wp *WorkerPool) processJob(jobID uint) {
	var job models.ReportJob
	if err := wp.db.First(&job, jobID).Error; err != nil {
		wp.logger.Error("Failed to fetch job from database", "job_id", jobID, "err", err)
		return
	}

	// Update status to processing
	job.Status = "processing"
	if err := wp.db.Save(&job).Error; err != nil {
		wp.logger.Error("Failed to update job status to processing", "job_id", jobID, "err", err)
		return
	}

	err := wp.executeJob(&job)
	if err != nil {
		wp.logger.Error("Job execution failed", "job_id", jobID, "err", err)
		job.Status = "failed"
		job.ErrorMessage = err.Error()
		wp.db.Save(&job)
		return
	}

	// Update status to completed
	job.Status = "completed"
	job.CompletedAt = sql.NullTime{Time: time.Now(), Valid: true}
	wp.db.Save(&job)
	wp.logger.Info("Job completed successfully", "job_id", jobID)
}

func (wp *WorkerPool) executeJob(job *models.ReportJob) error {
	// Parse input data based on report type
	var data interface{}
	templateType := job.ReportType

	switch job.ReportType {
	case "project_summary":
		var proj models.ProjectData
		if err := json.Unmarshal([]byte(job.InputData), &proj); err != nil {
			return fmt.Errorf("failed to parse project summary data: %w", err)
		}
		data = proj
	case "db_project_summary":
		var req struct {
			ProjectID uint `json:"project_id"`
		}
		if err := json.Unmarshal([]byte(job.InputData), &req); err != nil {
			return fmt.Errorf("failed to parse project_id for db_project_summary: %w", err)
		}
		if req.ProjectID == 0 {
			return fmt.Errorf("project_id must be provided and greater than 0")
		}

		projData, err := models.LoadProjectDataFromDB(wp.db, req.ProjectID)
		if err != nil {
			return fmt.Errorf("failed to load project from database: %w", err)
		}
		data = *projData
		templateType = "project_summary"
	default:
		// Fallback for custom or dynamic reports: use generic map representation
		var generic map[string]interface{}
		if err := json.Unmarshal([]byte(job.InputData), &generic); err != nil {
			return fmt.Errorf("failed to parse generic data: %w", err)
		}
		data = generic
	}

	// 1. Render report template to HTML
	htmlContent, err := RenderReport(job.ID, templateType, data)
	if err != nil {
		return fmt.Errorf("rendering template to HTML failed: %w", err)
	}

	// 2. Convert HTML to PDF using go-wkhtmltopdf
	pdfBytes, err := GeneratePDFFromHTML(htmlContent)
	if err != nil {
		return fmt.Errorf("converting HTML to PDF failed: %w", err)
	}

	// 3. Upload generated PDF to MinIO
	if wp.storage == nil {
		return fmt.Errorf("MinIO storage client is not configured")
	}

	objectKey := fmt.Sprintf("reports/%s/job-%d-%d.pdf", job.ReportType, job.ID, time.Now().Unix())
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	downloadURL, err := wp.storage.UploadPDF(ctx, objectKey, pdfBytes)
	if err != nil {
		return fmt.Errorf("upload to MinIO failed: %w", err)
	}

	// Update job fields with MinIO object metadata
	job.MinioBucket = wp.storage.bucketName
	job.MinioKey = objectKey
	job.DownloadURL = downloadURL

	return nil
}

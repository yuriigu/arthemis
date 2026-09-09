package reports

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"time"

	"arthemis-watcher/internal/env"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioStorage struct {
	client     *minio.Client
	bucketName string
	logger     *slog.Logger
}

// NewMinioStorage initializes the MinIO client using environment configurations.
func NewMinioStorage(logger *slog.Logger) (*MinioStorage, error) {
	endpoint := env.GetEnv("MINIO_ENDPOINT", "localhost:9000")
	accessKey := env.GetEnv("MINIO_ACCESS_KEY", "minioadmin")
	secretKey := env.GetEnv("MINIO_SECRET_KEY", "minioadmin")
	useSSL := env.GetEnv("MINIO_USE_SSL", "false") == "true"
	bucketName := env.GetEnv("MINIO_BUCKET_NAME", "reports")
	skipVerify := env.GetEnv("MINIO_SKIP_VERIFY", "true") == "true"

	// Handle fully qualified URLs by extracting only the Host/Port
	// and enabling SSL automatically if the scheme is https.
	if parsedURL, err := url.Parse(endpoint); err == nil && parsedURL.Scheme != "" {
		endpoint = parsedURL.Host
		if parsedURL.Scheme == "https" {
			useSSL = true
		}
	}

	transport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: skipVerify},
	}

	client, err := minio.New(endpoint, &minio.Options{
		Creds:     credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure:    useSSL,
		Transport: transport,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to initialize MinIO client: %w", err)
	}

	storage := &MinioStorage{
		client:     client,
		bucketName: bucketName,
		logger:     logger,
	}

	// Ensure the bucket exists. Note that this might fail if MinIO is not running/accessible.
	// We handle this gracefully: if it fails, we log a warning on startup, but still return
	// the storage client so that it can try again at runtime.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	exists, err := client.BucketExists(ctx, bucketName)
	if err != nil {
		logger.Warn("Failed to check if MinIO bucket exists on startup. Client will still be initialized and retry on upload.", "bucket", bucketName, "error", err)
		return storage, nil
	}

	if !exists {
		logger.Info("MinIO bucket does not exist, creating it...", "bucket", bucketName)
		err = client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			logger.Warn("Failed to create bucket on startup.", "bucket", bucketName, "error", err)
		}
	}

	return storage, nil
}

func (s *MinioStorage) UploadPDF(ctx context.Context, objectKey string, pdfBytes []byte) (string, error) {
	// Dynamically ensure the bucket exists on upload (self-healing)
	exists, err := s.client.BucketExists(ctx, s.bucketName)
	if err == nil && !exists {
		s.logger.Info("MinIO bucket does not exist at upload time, creating it...", "bucket", s.bucketName)
		_ = s.client.MakeBucket(ctx, s.bucketName, minio.MakeBucketOptions{})
	}

	reader := bytes.NewReader(pdfBytes)
	size := int64(len(pdfBytes))

	_, err = s.client.PutObject(ctx, s.bucketName, objectKey, reader, size, minio.PutObjectOptions{
		ContentType: "application/pdf",
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload PDF to bucket %s: %w", s.bucketName, err)
	}

	// Generate a presigned URL valid for 24 hours so the client can retrieve the report securely
	reqParams := make(url.Values)
	presignedURL, err := s.client.PresignedGetObject(ctx, s.bucketName, objectKey, 24*time.Hour, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL.String(), nil
}

// GetPresignedURL regenerates a temporary URL for an already generated report.
func (s *MinioStorage) GetPresignedURL(ctx context.Context, objectKey string) (string, error) {
	reqParams := make(url.Values)
	presignedURL, err := s.client.PresignedGetObject(ctx, s.bucketName, objectKey, 24*time.Hour, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}
	return presignedURL.String(), nil
}

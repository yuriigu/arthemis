package reports

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"time"
)

//go:embed templates/*
var templatesFS embed.FS

// TemplateData is the wrapper structure passed to layout.html
type TemplateData struct {
	JobID       uint
	GeneratedAt string
	Data        interface{}
}

// RenderReport parses the layout template and specific report template from the embedded FS,
// rendering the HTML string.
func RenderReport(jobID uint, reportType string, data interface{}) (string, error) {
	tmplPath := fmt.Sprintf("templates/%s.html", reportType)

	// Parse layout.html and the specific sub-template
	tmpl, err := template.ParseFS(templatesFS, "templates/layout.html", tmplPath)
	if err != nil {
		return "", fmt.Errorf("failed to parse templates for report type %q: %w", reportType, err)
	}

	wrappedData := TemplateData{
		JobID:       jobID,
		GeneratedAt: time.Now().Format("02/01/2006 15:04:05"),
		Data:        data,
	}

	var buf bytes.Buffer
	// Execute layout template which wraps the content template
	err = tmpl.ExecuteTemplate(&buf, "layout", wrappedData)
	if err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

package reports

import (
	"fmt"
	"strings"

	wkhtml "github.com/SebastiaanKlippert/go-wkhtmltopdf"
)

// GeneratePDFFromHTML converts an HTML string into a PDF byte slice.
func GeneratePDFFromHTML(htmlContent string) ([]byte, error) {
	// Create a new PDF generator. Note: this requires wkhtmltopdf binary to be installed on the system.
	pdfg, err := wkhtml.NewPDFGenerator()
	if err != nil {
		return nil, fmt.Errorf("failed to create PDF generator (make sure wkhtmltopdf is installed): %w", err)
	}

	// Set up standard options for the PDF document
	pdfg.Dpi.Set(300)
	pdfg.PageSize.Set(wkhtml.PageSizeA4)
	pdfg.Grayscale.Set(false)
	pdfg.Orientation.Set(wkhtml.OrientationPortrait)
	
	// Add the page reader
	page := wkhtml.NewPageReader(strings.NewReader(htmlContent))
	page.EnableLocalFileAccess.Set(true)
	page.Zoom.Set(1.0)

	pdfg.AddPage(page)

	// Execute wkhtmltopdf process to build the PDF document
	err = pdfg.Create()
	if err != nil {
		return nil, fmt.Errorf("failed to create PDF: %w", err)
	}

	return pdfg.Bytes(), nil
}

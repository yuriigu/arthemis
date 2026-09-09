package reports

import (
	"strings"
	"testing"
	"time"

	"arthemis-watcher/internal/models"
)

func TestRenderReport(t *testing.T) {
	data := models.ProjectData{
		ID:          "proj_123",
		Title:       "Desenvolvimento de Energia Limpa",
		Description: "Um projeto para implementar painéis solares em comunidades carentes.",
		CreatedAt:   time.Now(),
		Proponents: []models.Proponent{
			{Name: "Alice Silva", Email: "alice@example.com", Role: "Coordenadora"},
			{Name: "Bob Souza", Email: "bob@example.com", Role: "Engenheiro"},
		},
		Activities: []models.Activity{
			{Name: "Mapeamento", Description: "Mapear as residências que receberão os painéis", Status: "Concluído"},
			{Name: "Instalação", Description: "Instalar os painéis e conectar à rede", Status: "Em Andamento"},
		},
		Locations: []models.Location{
			{City: "Recife", State: "PE"},
			{City: "Olinda", State: "PE"},
		},
		SDGs: []models.SDG{
			{Code: 7, Name: "Energia Limpa e Acessível", Description: "Garantir o acesso a fontes de energia modernas e sustentáveis."},
			{Code: 11, Name: "Cidades e Comunidades Sustentáveis", Description: "Tornar as cidades e os assentamentos humanos inclusivos, seguros, resilientes e sustentáveis."},
		},
	}

	html, err := RenderReport(99, "project_summary", data)
	if err != nil {
		t.Fatalf("failed to render project summary: %v", err)
	}

	// Verify key elements are present in the rendered HTML
	expectedSubstrings := []string{
		"Desenvolvimento de Energia Limpa",
		"Alice Silva",
		"alice@example.com",
		"Mapeamento",
		"Energia Limpa e Acessível",
		"Recife - PE",
		"ID do Job: #99",
	}

	for _, sub := range expectedSubstrings {
		if !strings.Contains(html, sub) {
			t.Errorf("expected HTML to contain %q, but it did not", sub)
		}
	}
}

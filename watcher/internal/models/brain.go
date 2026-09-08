package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// BrainProject maps to the "projects" table created by the brain service
type BrainProject struct {
	gorm.Model
	ProponentID   uint      `gorm:"column:proponent_id"`
	Name          string    `gorm:"column:name"`
	LifetimeStart time.Time `gorm:"column:lifetime_start"`
	LifetimeEnd   time.Time `gorm:"column:lifetime_end"`
	Justification string    `gorm:"column:justification"`
}

func (BrainProject) TableName() string {
	return "projects"
}

// BrainProponent maps to the "proponents" table created by the brain service
type BrainProponent struct {
	gorm.Model
	Name  string `gorm:"column:name"`
	Email string `gorm:"column:email"`
}

func (BrainProponent) TableName() string {
	return "proponents"
}

// BrainActivity maps to the "activities" table created by the brain service
type BrainActivity struct {
	gorm.Model
	ProjectID     uint   `gorm:"column:project_id"`
	Name          string `gorm:"column:name"`
	Description   string `gorm:"column:description"`
	Justification string `gorm:"column:justification"`
}

type BrainProjectSdgs struct {
	ProjectID uint `gorm:"column:project_id;primaryKey"`
	SdgID     uint `gorm:"column:sdg_id;primaryKey"`
}

func (BrainProjectSdgs) TableName() string {
	return "project_sdg"
}

type BrainSdgs struct {
	gorm.Model
	Number  uint   `gorm:"column:number"`
	Name    string `gorm:"column:name"`
	IconUrl string `gorm:"column:icon_url"`
}

func (BrainSdgs) TableName() string {
	return "sdgs"
}

func (BrainActivity) TableName() string {
	return "activities"
}

// BrainLocation maps to the "locations" table created by the brain service
type BrainLocation struct {
	gorm.Model
	ProjectID uint    `gorm:"column:project_id"`
	Ecosystem string  `gorm:"column:ecosystem"`
	Extent    float32 `gorm:"column:extent"`
	Country   string  `gorm:"column:country"`
}

func (BrainLocation) TableName() string {
	return "locations"
}

// LoadProjectDataFromDB queries the shared database to retrieve a project, its proponent,
// activities, and locations, then maps them into the unified ProjectData structure.
func LoadProjectDataFromDB(db *gorm.DB, projectID uint) (*ProjectData, error) {
	var brainProj BrainProject
	if err := db.Unscoped().First(&brainProj, projectID).Error; err != nil {
		return nil, fmt.Errorf("failed to find project in database: %w", err)
	}

	var brainProp BrainProponent
	if err := db.Unscoped().First(&brainProp, brainProj.ProponentID).Error; err != nil {
		return nil, fmt.Errorf("failed to find project proponent (ID: %d) in database: %w", brainProj.ProponentID, err)
	}

	var brainActs []BrainActivity
	if err := db.Unscoped().Where("project_id = ?", brainProj.ID).Find(&brainActs).Error; err != nil {
		return nil, fmt.Errorf("failed to load project activities: %w", err)
	}

	var brainLocs []BrainLocation
	if err := db.Unscoped().Where("project_id = ?", brainProj.ID).Find(&brainLocs).Error; err != nil {
		return nil, fmt.Errorf("failed to load project locations: %w", err)
	}

	var brainSdgs []BrainSdgs
	if err := db.Unscoped().
		Joins("JOIN project_sdg ON project_sdg.sdg_id = sdgs.id").
		Where("project_sdg.project_id = ?", brainProj.ID).
		Find(&brainSdgs).Error; err != nil {
		return nil, fmt.Errorf("failed to load project SDGs: %w", err)
	}

	// Map DB entities to the ProjectData struct
	data := &ProjectData{
		ID:          fmt.Sprintf("%d", brainProj.ID),
		Title:       brainProj.Name,
		Description: brainProj.Justification,
		CreatedAt:   brainProj.CreatedAt,
		Proponents: []Proponent{
			{
				Name:  brainProp.Name,
				Email: brainProp.Email,
				Role:  "Proponente Principal",
			},
		},
		Activities: make([]Activity, len(brainActs)),
		Locations:  make([]Location, len(brainLocs)),
		SDGs:       make([]SDG, len(brainSdgs)),
	}

	for i, act := range brainActs {
		data.Activities[i] = Activity{
			Name:        act.Name,
			Description: act.Description,
			Status:      "Cadastrado",
		}
	}

	for i, loc := range brainLocs {
		city := loc.Ecosystem
		if city == "" {
			city = "Ecosistema N/A"
		}
		data.Locations[i] = Location{
			City:  city,
			State: loc.Country,
		}
	}

	for i, sdg := range brainSdgs {
		data.SDGs[i] = SDG{
			Code:    int(sdg.Number),
			Name:    sdg.Name,
			IconURL: sdg.IconUrl,
		}
	}

	return data, nil
}

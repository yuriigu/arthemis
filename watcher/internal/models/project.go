package models

import "time"

type Proponent struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type Activity struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

type Location struct {
	City  string `json:"city"`
	State string `json:"state"`
}

type SDG struct {
	Code        int    `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IconURL     string `json:"icon_url"`
}

type ProjectData struct {
	ID          string      `json:"id"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Proponents  []Proponent `json:"proponents"`
	Activities  []Activity  `json:"activities"`
	Locations   []Location  `json:"locations"`
	SDGs        []SDG       `json:"sdgs"`
	CreatedAt   time.Time   `json:"created_at"`
}

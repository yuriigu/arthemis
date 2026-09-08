package models

type HealthCheckResponse struct {
	Status    string                 `json:"status"`
	Service   string                 `json:"service"`
	Timestamp string                 `json:"timestamp"`
	Checks    map[string]HealthCheck `json:"checks"`
}

type HealthCheck struct {
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
}

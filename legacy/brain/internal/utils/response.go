package utils

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Error   string `json:"error" example:"Tarefa não encontrada"`
	Message string `json:"message,omitempty" example:"ID inválido fornecido"`
}

func RespondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		return
	}
}

func RespondError(w http.ResponseWriter, status int, message string, err error) {
	errResp := ErrorResponse{Error: message}
	if err != nil {
		errResp.Message = err.Error()
	}
	RespondJSON(w, status, errResp)
}

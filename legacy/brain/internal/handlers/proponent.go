package handlers

import (
	"arthemis-brain/internal/models"
	"arthemis-brain/internal/utils"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

func ProponentHandler(logger *slog.Logger, db *gorm.DB) *GlobalParams {
	return &GlobalParams{logger, db}
}

// @Summary      Create Proponent
// @Description  Creates a new proponent
// @Tags         proponent
// @Accept       json
// @Produce      json
// @Param        proponent  body      models.Proponent  true   "Proponent details"
// @Success      202        {boolean} true              "Proponent created successfully"
// @Failure      400        {object}  utils.ErrorResponse "Invalid JSON or bad request"
// @Router       /proponent/create [post]
func (g *GlobalParams) CreateProponent(w http.ResponseWriter, r *http.Request) {
	var reqProponent models.Proponent
	if err := json.NewDecoder(r.Body).Decode(&reqProponent); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "JSON inválido", err)
		return
	}
	res := g.db.Create(&reqProponent)
	if res.Error != nil {
		utils.RespondError(w, http.StatusBadRequest, "Erro ao criar o proponente", res.Error)
		return
	}
	utils.RespondJSON(w, http.StatusAccepted, reqProponent.ID)
}

// @Summary      Get Proponent
// @Description  Retrieves a proponent by ID
// @Tags         proponent
// @Produce      json
// @Param        id   path      string  true  "Proponent ID"
// @Success      200  {object}  models.Proponent
// @Failure      400  {object}  utils.ErrorResponse "ProponentID not found"
// @Failure      404  {object}  utils.ErrorResponse "Proponent not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /proponent/{id} [get]
func (g *GlobalParams) GetProponent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id") // or mux.Vars(r)["id"] if using gorilla/mux
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ProponentID not found", nil)
		return
	}

	var proponent models.Proponent
	res := g.db.Preload("Projects").First(&proponent, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "Proponent not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error finding proponent", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, proponent)
}

// @Summary      Update Proponent
// @Description  Updates an existing proponent by ID
// @Tags         proponent
// @Accept       json
// @Produce      json
// @Param        id         path      string            true   "Proponent ID"
// @Param        proponent  body      models.Proponent  true   "Proponent details to update"
// @Success      200        {object}  models.Proponent
// @Failure      400        {object}  utils.ErrorResponse "Invalid JSON or ProponentID not found"
// @Failure      404        {object}  utils.ErrorResponse "Proponent not found"
// @Failure      500        {object}  utils.ErrorResponse "Internal server error"
// @Router       /proponent/update/{id} [patch]
func (g *GlobalParams) UpdateProponent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ProponentID not found", nil)
		return
	}

	var existing models.Proponent
	res := g.db.First(&existing, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "Proponent not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error finding proponent", res.Error)
		return
	}

	var reqProponent models.Proponent
	if err := json.NewDecoder(r.Body).Decode(&reqProponent); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	res = g.db.Model(&existing).Updates(&reqProponent)
	reqProponent.ID = existing.ID
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error updating proponent", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, reqProponent)
}

// @Summary      Delete Proponent
// @Description  Deletes a proponent by ID
// @Tags         proponent
// @Produce      json
// @Param        id   path      string  true  "Proponent ID"
// @Success      200  {boolean} true    "Proponent deleted successfully"
// @Failure      400  {object}  utils.ErrorResponse "ProponentID not found"
// @Failure      404  {object}  utils.ErrorResponse "Proponent not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /proponent/delete/{id} [delete]
func (g *GlobalParams) DeleteProponent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ProponentID not found", nil)
		return
	}

	res := g.db.Delete(&models.Proponent{}, "id = ?", id)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error deleting proponent", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		utils.RespondError(w, http.StatusNotFound, "Proponent not found", nil)
		return
	}

	utils.RespondJSON(w, http.StatusOK, true)
}

// @Summary      Gets all proponents
// @Description  Retrieves every proponent
// @Tags         proponent
// @Produce      json
// @Success      200  {boolean} true    "Proponent deleted successfully"
// @Failure      404  {object}  utils.ErrorResponse "Proponent not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /proponent/ [get]
func (g *GlobalParams) GetAllProponents(w http.ResponseWriter, r *http.Request) {
	var proponents []models.Proponent
	res := g.db.Preload("Projects").Find(&proponents)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "Proponent not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error finding proponent", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, proponents)
}

package handlers

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"arthemis-brain/internal/models"
	"arthemis-brain/internal/utils"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

func IndicatorHandler(logger *slog.Logger, db *gorm.DB) *GlobalParams {
	return &GlobalParams{logger, db}
}

// @Summary      Create Indicators
// @Description  Creates multiple indicators
// @Tags         indicator
// @Produce      json
// @Param        indicators  body      []models.Indicator  true   "List of indicator details"
// @Success      202  {array}   uint                "IDs of created indicators"
// @Failure      400  {object}  utils.ErrorResponse "Invalid request body"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /indicator/create [post]
func (g *GlobalParams) CreateIndicator(w http.ResponseWriter, r *http.Request) {
	var reqIndicators []models.Indicator
	if err := json.NewDecoder(r.Body).Decode(&reqIndicators); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	if len(reqIndicators) == 0 {
		utils.RespondError(w, http.StatusBadRequest, "No indicators provided", nil)
		return
	}

	res := g.db.Create(&reqIndicators)
	if res.Error != nil {
		utils.RespondError(w, http.StatusBadRequest, "Error creating the indicators", res.Error)
		return
	}

	ids := make([]uint, len(reqIndicators))
	for i, indicator := range reqIndicators {
		ids[i] = indicator.ID
	}

	utils.RespondJSON(w, http.StatusAccepted, ids)
}

// @Summary      Get Indicator
// @Description  Retrieves an indicator
// @Tags         indicator
// @Produce      json
// @Param        id    path     string  true   "Indicator ID"
// @Success      200  {object}  models.Activity   "Indicator retrtieved successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Indicator not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /indicator/{id} [get]
func (g *GlobalParams) GetIndicator(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id") // or mux.Vars(r)["id"] if using gorilla/mux
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "indicatorID not found", nil)
		return
	}

	var indicator models.Indicator
	res := g.db.Preload("Observations").First(&indicator, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "indicator not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error finding indicator", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, indicator)
}

// @Summary      Update Indicator
// @Description  Updates a indicator
// @Tags         indicator
// @Produce      json
// @Param        id    path     string  true   "Indicator ID"
// @Param        project  body      models.Indicator  true   "Indicator details to update"
// @Success      200  {object}  models.Indicator    "Indicator updated successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Indicator not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /indicator/update/{id} [put]
func (g *GlobalParams) UpdateIndicator(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "indicatorID not found", nil)
		return
	}

	var existing models.Indicator
	res := g.db.First(&existing, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "indicator not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error finding indicator", res.Error)
		return
	}

	var reqindicator models.Indicator
	if err := json.NewDecoder(r.Body).Decode(&reqindicator); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	res = g.db.Model(&existing).Updates(&reqindicator)
	reqindicator.ID = existing.ID
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error updating indicator", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, reqindicator)
}

// @securityDefinitions.basic  BasicAuth
// @Summary      Delete Indicator
// @Description  Deletes an Indicator
// @Tags         indicator
// @Produce      json
// @Param        id    path     string  true   "Indicator ID"
// @Success      200  {boolean} true    "Indicator removed successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Indicator not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /indicator/delete/{id} [delete]
func (g *GlobalParams) DeleteIndicator(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "indicatorID not found", nil)
		return
	}

	res := g.db.Delete(&models.Indicator{}, "id = ?", id)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error deleting indicator", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		utils.RespondError(w, http.StatusNotFound, "indicator not found", nil)
		return
	}

	utils.RespondJSON(w, http.StatusOK, true)
}

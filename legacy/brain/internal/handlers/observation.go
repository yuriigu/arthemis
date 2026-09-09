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

func ObservationHandler(logger *slog.Logger, db *gorm.DB) *GlobalParams {
	return &GlobalParams{logger, db}
}

// @Summary      Create Observations
// @Description  Creates multiple observations
// @Tags         observation
// @Produce      json
// @Param        observations  body      []models.Observation  true   "List of observation details"
// @Success      202  {array}   uint                "IDs of created observations"
// @Failure      400  {object}  utils.ErrorResponse "Invalid request body"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /observation/create [post]
func (g *GlobalParams) CreateObservations(w http.ResponseWriter, r *http.Request) {
	var reqObservations []models.Observation
	if err := json.NewDecoder(r.Body).Decode(&reqObservations); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	if len(reqObservations) == 0 {
		utils.RespondError(w, http.StatusBadRequest, "No observations provided", nil)
		return
	}

	res := g.db.Create(&reqObservations)
	if res.Error != nil {
		utils.RespondError(w, http.StatusBadRequest, "Error creating the observations", res.Error)
		return
	}

	ids := make([]uint, len(reqObservations))
	for i, observation := range reqObservations {
		ids[i] = observation.ID
	}

	utils.RespondJSON(w, http.StatusAccepted, ids)
}

// @Summary      Get Observation
// @Description  Retrieves an observation
// @Tags         observation
// @Produce      json
// @Param        id    path     string  true   "Observation ID"
// @Success      200  {object}  models.Activity   "Observation retrtieved successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Observation not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /observation/{id} [get]
func (g *GlobalParams) GetObservation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id") // or mux.Vars(r)["id"] if using gorilla/mux
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "observationID not found", nil)
		return
	}

	var observation models.Observation
	res := g.db.First(&observation, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "observation not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error finding observation", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, observation)
}

// @Summary      Update Observation
// @Description  Updates a observation
// @Tags         observation
// @Produce      json
// @Param        id    path     string  true   "Observation ID"
// @Param        project  body      models.Location  true   "Observation details to update"
// @Success      200  {object}  models.Location    "Observation updated successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Observation not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /observation/update/{id} [put]
func (g *GlobalParams) UpdateObservation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "observationID not found", nil)
		return
	}

	var existing models.Observation
	res := g.db.First(&existing, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "observation not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error finding observation", res.Error)
		return
	}

	var reqobservation models.Observation
	if err := json.NewDecoder(r.Body).Decode(&reqobservation); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	res = g.db.Model(&existing).Updates(&reqobservation)
	reqobservation.ID = existing.ID
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error updating observation", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, reqobservation)
}

// @securityDefinitions.basic  BasicAuth
// @Summary      Delete Observation
// @Description  Deletes an Observation
// @Tags         location
// @Produce      json
// @Param        id    path     string  true   "Observation ID"
// @Success      200  {boolean} true    "Observation removed successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Observation not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /observation/delete/{id} [delete]
func (g *GlobalParams) DeleteObservation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "observationID not found", nil)
		return
	}

	res := g.db.Delete(&models.Observation{}, "id = ?", id)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error deleting observation", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		utils.RespondError(w, http.StatusNotFound, "observation not found", nil)
		return
	}

	utils.RespondJSON(w, http.StatusOK, true)
}

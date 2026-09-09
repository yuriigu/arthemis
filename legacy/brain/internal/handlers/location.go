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

func LocationHandler(logger *slog.Logger, db *gorm.DB) *GlobalParams {
	return &GlobalParams{logger, db}
}

// @Summary      Create Locations
// @Description  Creates multiple locations
// @Tags         location
// @Produce      json
// @Param        locations  body      []models.Location  true   "List of location details"
// @Success      202  {array}   uint                "IDs of created locations"
// @Failure      400  {object}  utils.ErrorResponse "Invalid request body"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /location/create [post]
func (g *GlobalParams) CreateLocation(w http.ResponseWriter, r *http.Request) {
	var reqLocations []models.Location
	if err := json.NewDecoder(r.Body).Decode(&reqLocations); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	if len(reqLocations) == 0 {
		utils.RespondError(w, http.StatusBadRequest, "No locations provided", nil)
		return
	}

	res := g.db.Create(&reqLocations)
	if res.Error != nil {
		utils.RespondError(w, http.StatusBadRequest, "Error creating the locations", res.Error)
		return
	}

	ids := make([]uint, len(reqLocations))
	for i, location := range reqLocations {
		ids[i] = location.ID
	}

	utils.RespondJSON(w, http.StatusAccepted, ids)
}

// @Summary      Get Location
// @Description  Retrieves a location
// @Tags         location
// @Produce      json
// @Param        id    path     string  true   "Location ID"
// @Success      200  {object}  models.Location   "Location retrtieved successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Location not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /location/{id} [get]
func (g *GlobalParams) GetLocation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id") // or mux.Vars(r)["id"] if using gorilla/mux
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "LocationID not recieved", nil)
		return
	}

	var location models.Location
	res := g.db.First(&location, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "Location not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error retrieving the Location", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, location)
}

// @Summary      Update Location
// @Description  Updates a location
// @Tags         location
// @Produce      json
// @Param        id    path     string  true   "Location ID"
// @Param        project  body      models.Location  true   "Location details to update"
// @Success      200  {object}  models.Location    "Location updated successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Location not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /location/update/{id} [put]
func (g *GlobalParams) UpdateLocation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "LocationID not recieved", nil)
		return
	}

	var existing models.Location
	res := g.db.First(&existing, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "Location not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error searching for location", res.Error)
		return
	}

	var reqLocation models.Location
	if err := json.NewDecoder(r.Body).Decode(&reqLocation); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	reqLocation.ID = existing.ID
	res = g.db.Model(&existing).Updates(&reqLocation)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error updating location", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, reqLocation)
}

// @Summary      Delete Location
// @Description  Deletes a Location
// @Tags         location
// @Produce      json
// @Param        id    path     string  true   "Location ID"
// @Success      200  {boolean} true    "Location removed successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Location not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /location/delete/{id} [delete]
func (g *GlobalParams) DeleteLocation(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ID not informed", nil)
		return
	}

	res := g.db.Delete(&models.Location{}, "id = ?", id)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error deleting location", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		utils.RespondError(w, http.StatusNotFound, "location not found", nil)
		return
	}

	utils.RespondJSON(w, http.StatusOK, true)
}

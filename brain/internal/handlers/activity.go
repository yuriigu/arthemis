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

func ActivityHandler(logger *slog.Logger, db *gorm.DB) *GlobalParams {
	return &GlobalParams{logger, db}
}

type CreateActivityRequest struct {
	ProjectID     uint
	Name          string
	Description   string
	Justification string
	LocationIDs   []uint
}

// @Summary      Create Activity
// @Description  Creates an activity
// @Tags         activity
// @Produce      json
// @Param        activity  body []models.Activity  true   "Activity details"
// @Success      200  {array}   uint  "Activity created"
// @Failure      400  {object}  utils.ErrorResponse "No activities provided"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /activity/create [post]
func (g *GlobalParams) CreateActivity(w http.ResponseWriter, r *http.Request) {
	var reqs []CreateActivityRequest
	if err := json.NewDecoder(r.Body).Decode(&reqs); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	if len(reqs) == 0 {
		utils.RespondError(w, http.StatusBadRequest, "No activities provided", nil)
		return
	}

	// Build Activity slice and collect location IDs per activity
	activities := make([]models.Activity, len(reqs))
	locationIDsPerActivity := make([][]uint, len(reqs))
	for i, req := range reqs {
		activities[i] = models.Activity{
			ProjectID:     req.ProjectID,
			Name:          req.Name,
			Description:   req.Description,
			Justification: req.Justification,
		}
		locationIDsPerActivity[i] = req.LocationIDs
	}

	// Create all activities in a single query (no associations yet)
	if res := g.db.Omit("Locations").Create(&activities); res.Error != nil {
		utils.RespondError(w, http.StatusBadRequest, "Error creating the activities", res.Error)
		return
	}

	// Link locations for each activity individually
	for i, activity := range activities {
		if len(locationIDsPerActivity[i]) == 0 {
			continue
		}

		// Build Location stubs — GORM only needs the primary keys to form the join table rows
		locations := make([]models.Location, len(locationIDsPerActivity[i]))
		for j, id := range locationIDsPerActivity[i] {
			locations[j] = models.Location{Model: gorm.Model{ID: id}}
		}

		if err := g.db.Model(&activity).Association("Locations").Replace(locations); err != nil {
			utils.RespondError(w, http.StatusInternalServerError, "Error associating locations", err)
			return
		}
	}

	ids := make([]uint, len(activities))
	for i, activity := range activities {
		ids[i] = activity.ID
	}

	utils.RespondJSON(w, http.StatusAccepted, ids)
}

// @Summary      Get Activity
// @Description  Retrieves an activity
// @Tags         activity
// @Produce      json
// @Param        id    path     string  true   "Activity ID"
// @Success      200  {object}  models.Activity   "Activity retrtieved successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Activity not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /activity/{id} [get]
func (g *GlobalParams) GetActivity(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id") // or mux.Vars(r)["id"] if using gorilla/mux
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ActivityID not recieved", nil)
		return
	}

	var activity models.Activity
	res := g.db.Preload("Indicators").First(&activity, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "Activity not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error retrieving the Activity", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, activity)
}

// @Summary      Update Activity
// @Description  Updates an activity
// @Tags         activity
// @Produce      json
// @Param        id    path     string  true   "Activity ID"
// @Param        project  body      models.Activity  true   "Activity details to update"
// @Success      200  {object}  models.Activity    "Activity updated successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Activity not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /activity/update/{id} [put]
func (g *GlobalParams) UpdateActivity(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ActivityID not recieved", nil)
		return
	}

	var existing models.Activity
	res := g.db.First(&existing, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "Activity not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error searching for activity", res.Error)
		return
	}

	var reqActivity models.Activity
	if err := json.NewDecoder(r.Body).Decode(&reqActivity); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	reqActivity.ID = existing.ID
	res = g.db.Model(&existing).Updates(&reqActivity)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error updating activity", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, reqActivity)
}

// @Summary      Delete Activity
// @Description  Deletes an activity
// @Tags         activity
// @Produce      json
// @Param        id    path     string  true   "Activity ID"
// @Success      200  {boolean} true    "Activity removed successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Activity not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /activity/delete/{id} [delete]
func (g *GlobalParams) DeleteActivity(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ID not informed", nil)
		return
	}

	res := g.db.Delete(&models.Activity{}, "id = ?", id)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error deleting activity", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		utils.RespondError(w, http.StatusNotFound, "activity not found", nil)
		return
	}

	utils.RespondJSON(w, http.StatusOK, true)
}

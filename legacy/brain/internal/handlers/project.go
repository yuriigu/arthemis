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

func ProjectHandler(logger *slog.Logger, db *gorm.DB) *GlobalParams {
	return &GlobalParams{logger, db}
}

// @Summary      Create project
// @Description  Creates a new project associated with a proponent ID
// @Tags         project
// @Accept       json
// @Produce      json
// @Param        project  body      models.Project  true   "Project details"
// @Success      202      {boolean} true            "Project created successfully"
// @Failure      400      {object}  utils.ErrorResponse "Invalid JSON or bad request"
// @Failure      401      {object}  utils.ErrorResponse "Unauthorized: proponent_id context missing"
// @Failure      409      {object}  utils.ErrorResponse "Proponent already has a project"
// @Router       /project/create [post]
func (g *GlobalParams) CreateProject(w http.ResponseWriter, r *http.Request) {
	var reqProject models.Project
	if err := json.NewDecoder(r.Body).Decode(&reqProject); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	res := g.db.Create(&reqProject)
	if res.Error != nil {
		utils.RespondError(w, http.StatusBadRequest, "Error creating the project", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusAccepted, reqProject.ID)
}

// @Summary      Get project
// @Description  Retrieves a project by ID
// @Tags         project
// @Produce      json
// @Param        id   path      string  true  "Project ID"
// @Success      200  {object}  models.Project
// @Failure      400  {object}  utils.ErrorResponse "ProjectID not received"
// @Failure      404  {object}  utils.ErrorResponse "Project not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /project/{id} [get]
func (g *GlobalParams) GetProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id") // or mux.Vars(r)["id"] if using gorilla/mux
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ProjectID not recieved", nil)
		return
	}

	var project models.Project
	res := g.db.Preload("Locations").Preload("Activities").Preload("ProjectProponents").First(&project, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "Project not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error retrieving the Project", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, project)
}

// @Summary      Update project
// @Description  Updates an existing project by ID
// @Tags         project
// @Accept       json
// @Produce      json
// @Param        id       path      string          true   "Project ID"
// @Param        project  body      models.Project  true   "Project details to update"
// @Success      200      {object}  models.Project
// @Failure      400      {object}  utils.ErrorResponse "Invalid JSON or ProjectID not received"
// @Failure      404      {object}  utils.ErrorResponse "Project not found"
// @Failure      500      {object}  utils.ErrorResponse "Internal server error"
// @Router       /project/update/{id} [put]
func (g *GlobalParams) UpdateProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ProjectID not recieved", nil)
		return
	}

	var existing models.Project
	res := g.db.First(&existing, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "projecte não encontrado", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Erro ao buscar o projecte", res.Error)
		return
	}

	var reqProject models.Project
	if err := json.NewDecoder(r.Body).Decode(&reqProject); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "JSON inválido", err)
		return
	}

	reqProject.ID = existing.ID
	res = g.db.Model(&existing).Updates(&reqProject)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Erro ao atualizar o projecte", res.Error)
		return
	}

	utils.RespondJSON(w, http.StatusOK, reqProject)
}

// @Summary      Delete Project
// @Description  Deletes a project by ID
// @Tags         project
// @Produce      json
// @Param        id   path      string  true  "Project ID"
// @Success      200  {boolean} true    "Project deleted successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Project not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /project/delete/{id} [delete]
func (g *GlobalParams) DeleteProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ID não informado", nil)
		return
	}

	res := g.db.Delete(&models.Project{}, "id = ?", id)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Erro ao deletar o projecte", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		utils.RespondError(w, http.StatusNotFound, "projecto não encontrado", nil)
		return
	}

	utils.RespondJSON(w, http.StatusOK, true)
}

type ProponentInput struct {
	ProponentID uint   `json:"proponentId"`
	Role        string `json:"role"`
}

// @Summary      Add Proponents
// @Description  Adds multiple proponents to a project by ID
// @Tags         project
// @Accept       json
// @Produce      json
// @Param        id    path      string                  true  "Project ID"
// @Param        body  body      []ProponentInput        true  "List of proponents"
// @Success      200   {array}   uint                    "IDs of added proponents"
// @Failure      400   {object}  utils.ErrorResponse     "ID not informed or invalid JSON"
// @Failure      404   {object}  utils.ErrorResponse     "Project not found"
// @Failure      500   {object}  utils.ErrorResponse     "Internal server error"
// @Router       /project/{id}/add_proponent [post]
func (g *GlobalParams) AddProponent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "ID não informado", nil)
		return
	}

	var project models.Project
	if err := g.db.Preload("Locations").Preload("Activities").First(&project, "id = ?", id).Error; err != nil {
		utils.RespondError(w, http.StatusNotFound, "Project not found", err)
		return
	}

	var body []ProponentInput

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	if len(body) == 0 {
		utils.RespondError(w, http.StatusBadRequest, "No proponents provided", nil)
		return
	}

	proponents := make([]models.ProjectProponent, len(body))
	for i, p := range body {
		proponents[i] = models.ProjectProponent{
			ProponentID: p.ProponentID,
			ProjectID:   project.ID,
			Role:        p.Role,
		}
	}

	if err := g.db.Create(&proponents).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to add proponents", err)
		return
	}

	ids := make([]uint, len(proponents))
	for i, p := range proponents {
		ids[i] = p.ID
	}

	utils.RespondJSON(w, http.StatusOK, ids)
}

// @Summary      Remove Proponent
// @Description  Removes proponent from a project by ID
// @Tags         project
// @Produce      json
// @Param        projectId   path      string  true  "Project ID"
// @Param        proponentId   path      string  true  "Project ID"
// @Success      200  {boolean} true    "Proponent removed successfully"
// @Failure      400  {object}  utils.ErrorResponse "ID not informed"
// @Failure      404  {object}  utils.ErrorResponse "Project not found"
// @Failure      500  {object}  utils.ErrorResponse "Internal server error"
// @Router       /project/{projectId}/remove_proponent/{proponentId} [delete]
func (g *GlobalParams) RemoveProponent(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	if projectID == "" {
		utils.RespondError(w, http.StatusBadRequest, "ID do projeto não informado", nil)
		return
	}

	var project models.Project
	g.db.First(&project, "id = ?", projectID)

	proponentID := chi.URLParam(r, "proponentId")
	if proponentID == "" {
		utils.RespondError(w, http.StatusBadRequest, "ID do projeto não informado", nil)
		return
	}

	if err := g.db.Where("project_id = ? AND proponent_id = ?", projectID, proponentID).
		Delete(&models.ProjectProponent{}).Error; err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Failed to remove proponent", err)
		return
	}

	utils.RespondJSON(w, http.StatusOK, true)
}

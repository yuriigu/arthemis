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

func UserHandler(logger *slog.Logger, db *gorm.DB) *GlobalParams {
	return &GlobalParams{logger, db}
}

// sanitizeUser impede que campos de credencial sejam retornados caso o model
// mude no futuro. Dados de senha nunca devem ser expostos pelos endpoints do brain.
func sanitizeUser(user *models.User) {
	user.Password = ""
}

func validUserRole(role models.UserRole) bool {
	switch role {
	case models.UserRoleAdmin, models.UserRoleManager, models.UserRoleVisitor:
		return true
	default:
		return false
	}
}

// createUserRequest é separado de models.User de propósito.
// Clientes da API só devem enviar campos que pertencem a este caso de uso,
// enquanto campos apenas de persistência, como Password, continuam
// controlados internamente.
type createUserRequest struct {
	ID          string          `json:"id"`
	ProponentID uint            `json:"proponent_id"`
	Username    string          `json:"username"`
	Email       string          `json:"email"`
	Role        models.UserRole `json:"role"`
}

// updateUserRequest usa ponteiros para que o PATCH diferencie um campo omitido
// de um valor zero enviado, atualizando apenas o que o cliente realmente mandou.
type updateUserRequest struct {
	ProponentID *uint            `json:"proponent_id"`
	Username    *string          `json:"username"`
	Email       *string          `json:"email"`
	Role        *models.UserRole `json:"role"`
}

// @title           Create User
// @version         1.0
// @description     Creates a user
// @termsOfService  http://swagger.io/terms/

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8081
// @BasePath  /user/create

// @securityDefinitions.basic  BasicAuth
func (g *GlobalParams) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req createUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	if req.Role == "" {
		req.Role = models.UserRole(r.Header.Get("X-User-Role"))
	}
	if req.Role == "" {
		req.Role = models.UserRoleVisitor
	}
	if req.ID == "" {
		// Quando a request vem pelo Traefik, o validate do arthemis-edge define
		// X-User-Id a partir da claim "sub" do JWT. Testes diretos ainda podem
		// enviar o id no JSON.
		req.ID = r.Header.Get("X-User-Id")
	}

	if req.ID == "" || req.ProponentID == 0 || req.Username == "" || req.Email == "" {
		utils.RespondError(w, http.StatusBadRequest, "Missing required fields", nil)
		return
	}
	if !validUserRole(req.Role) {
		utils.RespondError(w, http.StatusBadRequest, "Invalid user role", nil)
		return
	}

	reqUser := models.User{
		ID:          req.ID,
		ProponentID: req.ProponentID,
		Username:    req.Username,
		Email:       req.Email,
		// O brain mantém apenas o perfil do usuário; hashes de senha ficam no auth.
		Password: "",
		Role:     req.Role,
	}

	res := g.db.Create(&reqUser)
	if res.Error != nil {
		utils.RespondError(w, http.StatusBadRequest, "Error creating the user", res.Error)
		return
	}

	sanitizeUser(&reqUser)
	utils.RespondJSON(w, http.StatusCreated, reqUser)
}

// @title           Get User
// @version         1.0
// @description     Reads a user
// @termsOfService  http://swagger.io/terms/

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8081
// @BasePath  /user/{id}

// @securityDefinitions.basic  BasicAuth
func (g *GlobalParams) GetUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "UserID not found", nil)
		return
	}

	var user models.User
	res := g.db.Preload("Proponent").First(&user, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "User not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error finding user", res.Error)
		return
	}

	sanitizeUser(&user)
	utils.RespondJSON(w, http.StatusOK, user)
}

// @title           Get All User
// @version         1.0
// @description     Reads a user
// @termsOfService  http://swagger.io/terms/

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8081
// @BasePath  /user/

// @securityDefinitions.basic  BasicAuth
func (g *GlobalParams) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	res := g.db.Preload("Proponent").Find(&users)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error finding users", res.Error)
		return
	}

	for i := range users {
		sanitizeUser(&users[i])
	}
	utils.RespondJSON(w, http.StatusOK, users)
}

// @title           Update User
// @version         1.0
// @description     Updates a user
// @termsOfService  http://swagger.io/terms/

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8081
// @BasePath  /user/update/{id}

// @securityDefinitions.basic  BasicAuth
func (g *GlobalParams) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "UserID not found", nil)
		return
	}

	var existing models.User
	res := g.db.First(&existing, "id = ?", id)
	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			utils.RespondError(w, http.StatusNotFound, "User not found", res.Error)
			return
		}
		utils.RespondError(w, http.StatusInternalServerError, "Error finding user", res.Error)
		return
	}

	var req updateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}
	if req.Role != nil && !validUserRole(*req.Role) {
		utils.RespondError(w, http.StatusBadRequest, "Invalid user role", nil)
		return
	}
	if req.ProponentID != nil && *req.ProponentID == 0 {
		utils.RespondError(w, http.StatusBadRequest, "Invalid proponent_id", nil)
		return
	}
	if req.Username != nil && *req.Username == "" {
		utils.RespondError(w, http.StatusBadRequest, "Invalid username", nil)
		return
	}
	if req.Email != nil && *req.Email == "" {
		utils.RespondError(w, http.StatusBadRequest, "Invalid email", nil)
		return
	}

	// O mapa de atualização é montado explicitamente para impedir que o PATCH
	// altere campos fora do contrato deste endpoint, como o ID alinhado ao auth.
	updates := map[string]any{}
	if req.ProponentID != nil {
		updates["proponent_id"] = *req.ProponentID
	}
	if req.Username != nil {
		updates["username"] = *req.Username
	}
	if req.Email != nil {
		updates["email"] = *req.Email
	}
	if req.Role != nil {
		updates["role"] = *req.Role
	}

	res = g.db.Model(&existing).Updates(updates)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error updating user", res.Error)
		return
	}

	res = g.db.Preload("Proponent").First(&existing, "id = ?", id)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error retrieving updated user", res.Error)
		return
	}

	sanitizeUser(&existing)
	utils.RespondJSON(w, http.StatusOK, existing)
}

// @title           Delete User
// @version         1.0
// @description     Deletes a user
// @termsOfService  http://swagger.io/terms/

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8081
// @BasePath  /user/delete/{id}

// @securityDefinitions.basic  BasicAuth
func (g *GlobalParams) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		utils.RespondError(w, http.StatusBadRequest, "UserID not found", nil)
		return
	}

	res := g.db.Delete(&models.User{}, "id = ?", id)
	if res.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error deleting user", res.Error)
		return
	}
	if res.RowsAffected == 0 {
		utils.RespondError(w, http.StatusNotFound, "User not found", nil)
		return
	}

	utils.RespondJSON(w, http.StatusOK, true)
}

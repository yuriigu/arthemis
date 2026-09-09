package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/andre-homelab/arthemis-edge/models"
	"gorm.io/gorm"
)

// @Summary      Unregister user
// @Description  Removes an existing user from the database by username.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        body  body      models.DeleteUserRequest   true  "User to remove"
// @Success      200   {object}  models.DeleteUserResponse  "User removido com sucesso"
// @Failure      400   {string}  string                     "Bad Request: invalid body"
// @Failure      404   {string}  string                     "Not Found: user does not exist"
// @Failure      500   {string}  string                     "Internal Server Error"
// @Router       /unregister [post]
func Unregister(w http.ResponseWriter, r *http.Request) {
	var req models.DeleteUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Username == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	user, err := deleteUser(req.Username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(models.DeleteUserResponse{
		Sub:      user.Sub,
		Username: user.Username,
		Role:     user.Role,
	})
}

func deleteUser(username string) (*models.User, error) {
	var user models.User

	result := DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}

	if err := DB.Delete(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

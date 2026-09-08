package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/andre-homelab/arthemis-edge/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var ErrUserAlreadyExists = errors.New("user already exists")
var DB *gorm.DB

// @Summary      Register user
// @Description  Receives user data, hashes the password and persists the new user.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        body  body      models.CreateUserRequest   true  "New user data"
// @Success      201   {object}  models.CreateUserResponse  "User criado com sucesso"
// @Failure      400   {string}  string                     "Bad Request: invalid body"
// @Failure      409   {string}  string                     "Conflict: username already exists"
// @Failure      500   {string}  string                     "Internal Server Error"
// @Router       /register [post]
func Register(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" || req.Role == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	user, err := saveUser(req.Username, string(hashedPassword), req.Role)
	if err != nil {
		if err == ErrUserAlreadyExists {
			http.Error(w, "Username already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(models.CreateUserResponse{
		Sub:      user.Sub,
		Username: user.Username,
		Role:     user.Role,
	})
}

func saveUser(username, hashedPassword, role string) (*models.User, error) {
	user := &models.User{
		Sub:      uuid.NewString(),
		Username: username,
		Password: hashedPassword,
		Role:     role,
	}

	result := DB.Create(user)
	if result.Error != nil {
		if isDuplicateKeyError(result.Error) {
			return nil, ErrUserAlreadyExists
		}
		return nil, result.Error
	}

	return user, nil
}

func isDuplicateKeyError(err error) bool {
	return err != nil && strings.Contains(err.Error(), "duplicate key value violates unique constraint")
}

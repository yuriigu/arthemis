package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/andre-homelab/arthemis-edge/models"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Login generates a JWT token for valid credentials.
// @Summary      Login
// @Description  Validates user credentials and returns a signed JWT token with sub and role claims.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        body  body      models.LoginRequest   true  "User credentials"
// @Success      200   {object}  models.LoginResponse  "JWT token gerado com sucesso"
// @Failure      400   {string}  string         "Bad Request: invalid body"
// @Failure      401   {string}  string         "Unauthorized: invalid credentials"
// @Failure      500   {string}  string         "Internal Server Error"
// @Router       /login [post]
func Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	sub, role, ok := authenticateUser(req.Username, req.Password)
	if !ok {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	secret := []byte(GetEnv("JWT_TOKEN"))

	claims := jwt.MapClaims{
		"sub":  sub,
		"role": role,
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(secret)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(models.LoginResponse{Token: tokenString})
}

func authenticateUser(username, password string) (sub string, role string, ok bool) {
	var user models.User

	result := DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return "", "", false
		}
		return "", "", false
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", "", false
	}

	return user.Sub, user.Role, true
}

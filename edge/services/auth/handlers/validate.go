package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// validate checks the JWT token validity and returns user claims in headers.
// @Summary      Validate JWT Token
// @Description  Parses the Authorization header, validates the HMAC signature, and returns user identity in response headers.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param Authorization header string true "Bearer token" example(Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
// @Success      200  {string}  string    "Token is valid. User info returned in X-User-Id and X-User-Role headers."
// @Failure      401  {string}  string    "Unauthorized: Missing or invalid token"
// @Router       /validate [post]
func Validate(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")

	if authHeader == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	var secret = []byte(GetEnv("JWT_TOKEN"))

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		http.Error(w, "Invalid claims", http.StatusUnauthorized)
		return
	}

	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		http.Error(w, "Invalid or missing 'sub'", http.StatusUnauthorized)
		return
	}

	role, ok := claims["role"].(string)
	if !ok || role == "" {
		http.Error(w, "Invalid or missing 'role'", http.StatusUnauthorized)
		return
	}

	w.Header().Set("X-User-Id", fmt.Sprintf("%v", sub))
	w.Header().Set("X-User-Role", fmt.Sprintf("%v", role))

	w.WriteHeader(http.StatusOK)
}

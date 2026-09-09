package models

type CreateUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type CreateUserResponse struct {
	Sub      string `json:"sub"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

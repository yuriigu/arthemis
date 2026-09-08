package models

type DeleteUserRequest struct {
	Username string `json:"username"`
}

type DeleteUserResponse struct {
	Sub      string `json:"sub"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

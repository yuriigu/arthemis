package middlewares

import (
	"fmt"
	"net/http"
)

func PermissionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role := r.Header.Get("X-User-Role")

		endpoint := r.URL.Path

		if !CheckPermission(role, endpoint) {
			message := fmt.Sprintf("Você não tem permissão para acessar %s", endpoint)
			http.Error(w, message, http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

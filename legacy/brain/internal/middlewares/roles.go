package middlewares

import "slices"

var rolesMap = map[string][]string{
	"visitor": {"/"},
	"manager": {"/", "/health"},
	"admin":   {"/", "/health", "/swagger"},
}

func GetRoles() map[string][]string {
	return rolesMap
}

func CheckPermission(role string, fn string) bool {
	roles := rolesMap[role]

	return slices.Contains(roles, fn)
}

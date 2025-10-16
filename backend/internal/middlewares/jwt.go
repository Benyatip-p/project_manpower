package middlewares

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("YOUR_ULTRA_SECURE_SECRET_KEY")

const (
	CtxEmployeeID = "employee_id"
	CtxEmail      = "email"
	CtxRoleName   = "role_name"
	CtxDeptID     = "dept_id"
	CtxPosID      = "pos_id"
	CtxSectionID  = "section_id"
)

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		tokenStr := strings.TrimPrefix(auth, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid claims"})
			return
		}

		// string claims
		c.Set(CtxEmployeeID, getStringClaim(claims, "employee_id"))
		c.Set(CtxEmail, getStringClaim(claims, "email"))
		c.Set(CtxRoleName, getStringClaim(claims, "role_name"))

		// int claims (from float64)
		c.Set(CtxDeptID, getIntClaim(claims, "dept_id"))
		c.Set(CtxPosID, getIntClaim(claims, "pos_id"))
		c.Set(CtxSectionID, getIntClaim(claims, "section_id"))

		c.Next()
	}
}

func getStringClaim(m jwt.MapClaims, key string) string {
	if v, ok := m[key]; ok {
		if s, ok2 := v.(string); ok2 {
			return s
		}
	}
	return ""
}
func getIntClaim(m jwt.MapClaims, key string) int {
	if v, ok := m[key]; ok {
		switch t := v.(type) {
		case float64:
			return int(t)
		case int:
			return t
		}
	}
	return 0
}

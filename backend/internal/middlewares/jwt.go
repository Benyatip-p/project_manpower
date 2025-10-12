package middlewares

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// สำคัญ: ต้องให้ secret เดียวกับ services.Authenticate
var jwtSecret = []byte("YOUR_ULTRA_SECURE_SECRET_KEY")

// Context Keys (ใช้ c.GetString / c.GetInt อ่านใน handler)
const (
	CtxEmployeeID = "employee_id"
	CtxEmail      = "email"
	CtxRoleName   = "role_name"
	CtxDeptID     = "dept_id"
	CtxPosID      = "pos_id"
)

// JWTAuth: ตรวจ Authorization header -> แยก Bearer token -> parse -> set claims ลง Gin context
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid Authorization header"})
			return
		}
		tokenStr := strings.TrimPrefix(auth, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			// ป้องกัน alg none / ผิด method
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrTokenMalformed
			}
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		// ดึงค่าจาก claims แล้ววางลง context (กัน type issue ของ JSON ด้วยตัวแปลงเล็ก ๆ)
		c.Set(CtxEmployeeID, strFromAny(claims["employee_id"]))
		c.Set(CtxEmail,      strFromAny(claims["email"]))
		c.Set(CtxRoleName,   strFromAny(claims["role_name"]))
		c.Set(CtxDeptID,     intFromAny(claims["dept_id"]))
		c.Set(CtxPosID,      intFromAny(claims["pos_id"]))

		c.Next()
	}
}

// ===== helpers =====

func intFromAny(v any) int {
	switch x := v.(type) {
	case float64:
		return int(x)
	case int:
		return x
	case int32:
		return int(x)
	case int64:
		return int(x)
	default:
		return 0
	}
}
func strFromAny(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
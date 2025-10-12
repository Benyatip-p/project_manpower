package services

import (
	"database/sql"
	"errors"
	"log"
	"mantest/backend/internal/database"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("YOUR_ULTRA_SECURE_SECRET_KEY")

func Authenticate(email, password string) (string, string, string, error) {
	email = strings.ToLower(email)

	var (
		employeeID, storedPassword, roleName string
		deptID, posID                        sql.NullInt64
	)

	query := `
		SELECT
			e.employee_id,
			e.password,
			r.role_name,
			e.dept_id,
			e.pos_id
		FROM employees e
		JOIN roles r ON e.role_id = r.role_id
		WHERE e.email = $1 AND e.status = 'Active'
	`

	err := database.DB.QueryRow(query, email).Scan(&employeeID, &storedPassword, &roleName, &deptID, &posID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Authentication failed for email %s: user not found or inactive", email)
			return "", "", "", errors.New("authentication failed: invalid credentials")
		}
		log.Printf("Database error during authentication for email %s: %v", email, err)
		return "", "", "", errors.New("database error")
	}

	if storedPassword != password {
		log.Printf("Authentication failed for email %s: incorrect password", email)
		return "", "", "", errors.New("authentication failed: invalid credentials")
	}

	// แปลง Null -> 0 (กัน NULL ใน token)
	dept := 0
	pos := 0
	if deptID.Valid {
		dept = int(deptID.Int64)
	}
	if posID.Valid {
		pos = int(posID.Int64)
	}

	claims := jwt.MapClaims{
		"employee_id": employeeID,
		"email":       email,
		"role_name":   roleName,
		"dept_id":     dept, // ✅ ใส่เพิ่ม
		"pos_id":      pos,  // ✅ ใส่เพิ่ม
		"exp":         time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		log.Printf("Failed to generate token for email %s: %v", email, err)
		return "", "", "", errors.New("failed to generate token")
	}

	return tokenString, roleName, email, nil
}
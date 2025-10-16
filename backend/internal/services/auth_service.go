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
	// Normalize credentials to avoid case/whitespace login mismatches
	email = strings.ToLower(strings.TrimSpace(email))
	password = strings.TrimSpace(password)

	var (
		employeeID, storedPassword, roleName, userStatus string
		deptID, posID                                   sql.NullInt64
		sectionID                                       sql.NullInt64
	)

	query := `
		       SELECT e.employee_id, e.password, r.role_name,
		              e.dept_id, e.pos_id, e.section_id, e.status
		       FROM employees e
		       JOIN roles r ON e.role_id = r.role_id
		       WHERE LOWER(e.email) = LOWER($1) AND e.status = 'Active'
		   `
	err := database.DB.QueryRow(query, email).Scan(
		&employeeID, &storedPassword, &roleName,
		&deptID, &posID, &sectionID, &userStatus,
	)
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

	// Check if user account is active
	if userStatus != "Active" {
		log.Printf("Authentication failed for email %s: account is %s", email, userStatus)
		return "", "", "", errors.New("authentication failed: account is not active")
	}

	// Normalize email to lowercase for token claim consistency
	claims := jwt.MapClaims{
		"employee_id": employeeID,
		"email":       email,
		"role_name":   roleName,
		"dept_id":     intFromNull(deptID),
		"pos_id":      intFromNull(posID),
		"section_id":  intFromNull(sectionID),
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

func intFromNull(v sql.NullInt64) int {
	if v.Valid {
		return int(v.Int64)
	}
	return 0
}

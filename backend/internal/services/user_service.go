package services

import (
	"database/sql"
	"errors"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
)

// GetUserProfileByEmail fetches user profile information from the database
func GetUserProfileByEmail(email string) (*models.UserProfile, error) {
	var profile models.UserProfile

	query := `
        SELECT e.first_name, e.last_name, e.email, r.role_name, d.dept_name
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.role_id
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        WHERE e.email = $1
    `
	err := database.DB.QueryRow(query, email).Scan(
		&profile.FirstName,
		&profile.LastName,
		&profile.Email,
		&profile.Role,
		&profile.Department,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &profile, nil
}
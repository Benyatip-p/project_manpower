package services

import (
	"database/sql"
	"errors"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
)

func GetUserProfileByEmail(email string) (*models.UserProfile, error) {
	var profile models.UserProfile
	var section sql.NullString

	query := `
        SELECT e.first_name, e.last_name, e.email, r.role_name, d.dept_name, s.section_name
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.role_id
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        LEFT JOIN sections s ON e.section_id = s.section_id
        WHERE e.email = $1
    `
	err := database.DB.QueryRow(query, email).Scan(
		&profile.FirstName,
		&profile.LastName,
		&profile.Email,
		&profile.Role,
		&profile.Department,
		&section,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	// Handle NULL section
	if section.Valid {
		profile.Section = section.String
	} else {
		profile.Section = ""
	}

	return &profile, nil
}

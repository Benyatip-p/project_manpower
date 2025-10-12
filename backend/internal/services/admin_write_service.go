package services

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
	"strings"
)

func CreateNewEmployee(req *models.NewEmployeeRequest) error {
	roleName := strings.ToUpper(req.Role)
	roleID, err := GetIDByName("role", roleName)
	if err != nil {
		return fmt.Errorf("invalid role name: %s", req.Role)
	}

	var deptID, posID int
	if req.Department != "" {
		deptID, err = GetIDByName("department", strings.ToUpper(req.Department))
		if err != nil {
			return fmt.Errorf("invalid department name: %s", req.Department)
		}
	}
	if req.Position != "" {
		posID, err = GetIDByName("position", strings.ToUpper(req.Position))
		if err != nil {
			return fmt.Errorf("invalid position name: %s", req.Position)
		}
	}

	var sqlDeptID, sqlPosID sql.NullInt32
	if deptID != 0 {
		sqlDeptID = sql.NullInt32{Int32: int32(deptID), Valid: true}
	}
	if posID != 0 {
		sqlPosID = sql.NullInt32{Int32: int32(posID), Valid: true}
	}

	query := `
		INSERT INTO employees (
			employee_id, first_name, last_name, email, password, pos_id, dept_id, role_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err = database.DB.Exec(query,
		req.EmployeeID,
		req.FirstName,
		req.LastName,
		req.Email,
		req.Password,
		sqlPosID,
		sqlDeptID,
		roleID,
	)

	if err != nil {
		log.Printf("SQL INSERT Employee Error: %v", err)
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
			return errors.New("employee ID or Email already exists in the system")
		}
		return errors.New("failed to save new employee to database")
	}

	return nil
}
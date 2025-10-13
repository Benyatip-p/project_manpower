package services

import (
	"errors"
	"fmt"
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
	"strings"
)

func UpdateEmployee(employeeID string, req *models.UpdateEmployeeRequest) error {
	// สร้าง query แบบ dynamic เพื่ออัพเดตเฉพาะ field ที่มีค่า
	query := "UPDATE employees SET "
	params := []interface{}{}
	paramIndex := 1
	updates := []string{}

	if req.FirstName != "" {
		updates = append(updates, fmt.Sprintf("first_name = $%d", paramIndex))
		params = append(params, req.FirstName)
		paramIndex++
	}
	if req.LastName != "" {
		updates = append(updates, fmt.Sprintf("last_name = $%d", paramIndex))
		params = append(params, req.LastName)
		paramIndex++
	}
	if req.Email != "" {
		updates = append(updates, fmt.Sprintf("email = $%d", paramIndex))
		params = append(params, req.Email)
		paramIndex++
	}
	if req.Password != "" {
		updates = append(updates, fmt.Sprintf("password = $%d", paramIndex))
		params = append(params, req.Password)
		paramIndex++
	}

	// แปลง Role เป็น role_id
	if req.Role != "" {
		roleID, err := GetIDByName("role", strings.ToUpper(req.Role))
		if err != nil {
			return fmt.Errorf("invalid role name: %s", req.Role)
		}
		updates = append(updates, fmt.Sprintf("role_id = $%d", paramIndex))
		params = append(params, roleID)
		paramIndex++
	}

	// แปลง Department เป็น dept_id
	if req.Department != "" {
		deptID, err := GetIDByName("department", strings.ToUpper(req.Department))
		if err != nil {
			return fmt.Errorf("invalid department name: %s", req.Department)
		}
		updates = append(updates, fmt.Sprintf("dept_id = $%d", paramIndex))
		params = append(params, deptID)
		paramIndex++
	}

	// แปลง Position เป็น pos_id
	if req.Position != "" {
		posID, err := GetIDByName("position", strings.ToUpper(req.Position))
		if err != nil {
			return fmt.Errorf("invalid position name: %s", req.Position)
		}
		updates = append(updates, fmt.Sprintf("pos_id = $%d", paramIndex))
		params = append(params, posID)
		paramIndex++
	}

	if len(updates) == 0 {
		return errors.New("no fields to update")
	}

	query += strings.Join(updates, ", ")
	query += fmt.Sprintf(" WHERE employee_id = $%d", paramIndex)
	params = append(params, employeeID)

	result, err := database.DB.Exec(query, params...)
	if err != nil {
		log.Printf("SQL UPDATE Employee Error: %v", err)
		return errors.New("failed to update employee")
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("employee not found")
	}

	return nil
}

func DeleteEmployee(employeeID string) error {
	query := "DELETE FROM employees WHERE employee_id = $1"

	result, err := database.DB.Exec(query, employeeID)
	if err != nil {
		log.Printf("SQL DELETE Employee Error: %v", err)
		return errors.New("failed to delete employee")
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("employee not found")
	}

	return nil
}

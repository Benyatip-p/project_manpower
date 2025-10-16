package services

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
	"strconv"
	"strings"
)

// GenerateEmployeeID สร้างรหัสพนักงานอัตโนมัติ รูปแบบ E001, E002, ...
func GenerateEmployeeID() (string, error) {
	var lastID string
	query := `
		SELECT employee_id 
		FROM employees 
		WHERE employee_id ~ '^E[0-9]+$'
		ORDER BY CAST(SUBSTRING(employee_id FROM 2) AS INTEGER) DESC 
		LIMIT 1
	`

	err := database.DB.QueryRow(query).Scan(&lastID)
	if err != nil {
		if err == sql.ErrNoRows {
			// ถ้ายังไม่มีพนักงานเลย เริ่มที่ E001
			return "E001", nil
		}
		return "", err
	}

	// ดึงตัวเลขจาก E001 -> 001 -> 1
	numStr := lastID[1:] // ตัดตัว E ออก
	num, err := strconv.Atoi(numStr)
	if err != nil {
		return "", fmt.Errorf("invalid employee_id format: %s", lastID)
	}

	// เพิ่มเลขขึ้น 1 และ format กลับเป็น E001, E002, ...
	newNum := num + 1
	newID := fmt.Sprintf("E%03d", newNum)

	return newID, nil
}

func CreateNewEmployee(req *models.NewEmployeeRequest) error {
	// ถ้าไม่ได้ส่ง employee_id มา ให้ auto-generate
	employeeID := req.EmployeeID
	if employeeID == "" {
		var err error
		employeeID, err = GenerateEmployeeID()
		if err != nil {
			return fmt.Errorf("failed to generate employee ID: %v", err)
		}
	}
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
		employeeID, // ใช้ employeeID ที่ generate หรือที่ส่งมา
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

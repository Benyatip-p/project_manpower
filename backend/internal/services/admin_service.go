package services

import (
	"database/sql"
	"errors"
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
)

// GetAllEmployees ดึงรายการพนักงานทั้งหมดพร้อมรายละเอียดสำหรับ Admin
func GetAllEmployees() ([]models.EmployeeDetail, error) {
	query := `
         SELECT
             e.employee_id,
             r.role_name,
             d.dept_name,
             p.pos_name,
             e.first_name,
             e.last_name,
             e.email,
             e.password,
             e.status
         FROM employees e
         LEFT JOIN roles r ON e.role_id = r.role_id
         LEFT JOIN departments d ON e.dept_id = d.dept_id
         LEFT JOIN positions p ON e.pos_id = p.pos_id
         ORDER BY e.employee_id ASC
     `

	rows, err := database.DB.Query(query)
	if err != nil {
		log.Printf("Error querying all employees: %v", err)
		return nil, err
	}
	defer rows.Close()

	var employees []models.EmployeeDetail
	var deptName, posName sql.NullString

	for rows.Next() {
		var employee models.EmployeeDetail

		var status string
		err := rows.Scan(
			&employee.EmployeeID,
			&employee.Role,
			&deptName,
			&posName,
			&employee.FirstName,
			&employee.LastName,
			&employee.Email,
			&employee.PasswordPlaceholder,
			&status,
		)
		if err != nil {
			log.Printf("Error scanning employee row: %v", err)
			return nil, err
		}

		// Set default status if null or empty
		if status == "" {
			status = "Active"
		}
		employee.Status = status
		if err != nil {
			log.Printf("Error scanning employee row: %v", err)
			return nil, err
		}

		employee.Department = deptName.String
		employee.Position = posName.String
		employees = append(employees, employee)
	}

	return employees, rows.Err()
}

// UpdateEmployeeStatus อัปเดตสถานะของพนักงาน (Active/Inactive)
func UpdateEmployeeStatus(employeeID, status string) error {
	query := `UPDATE employees SET status = $1 WHERE employee_id = $2`

	result, err := database.DB.Exec(query, status, employeeID)
	if err != nil {
		log.Printf("Error updating employee status: %v", err)
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("employee not found")
	}

	return nil
}
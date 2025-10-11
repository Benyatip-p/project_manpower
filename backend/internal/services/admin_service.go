package services

import (
	"database/sql"
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
)

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
            e.password 
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.role_id
        LEFT JOIN departments d ON e.dept_id = d.dept_id
        LEFT JOIN positions p ON e.pos_id = p.pos_id
        WHERE e.status = 'Active'
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

		err := rows.Scan(
			&employee.EmployeeID,
			&employee.Role,
			&deptName,
			&posName,
			&employee.FirstName,
			&employee.LastName,
			&employee.Email,
			&employee.PasswordPlaceholder,
		)
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
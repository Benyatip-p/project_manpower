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

func UpdateEmployee(employeeID string, req *models.NewEmployeeRequest) error {
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
    
    // Build Dynamic SQL
    updateFields := []string{
        "first_name = $1",
        "last_name = $2",
        "email = $3",
        "pos_id = $4",
        "dept_id = $5",
        "role_id = $6",
    }
    args := []interface{}{
        req.FirstName,
        req.LastName,
        req.Email,
        sqlPosID,
        sqlDeptID,
        roleID,
    }

    // Include password only if it's provided
    if req.Password != "" {
        updateFields = append(updateFields, fmt.Sprintf("password = $%d", len(args)+1))
        args = append(args, req.Password)
    }

    // Add employeeID as the last argument for the WHERE clause
    args = append(args, employeeID) 

    query := fmt.Sprintf(`
        UPDATE employees SET
        %s
        WHERE employee_id = $%d
    `, strings.Join(updateFields, ", "), len(args))

    result, err := database.DB.Exec(query, args...)

    if err != nil {
        log.Printf("SQL UPDATE Employee Error: %v", err)
        if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
            return errors.New("Email already exists in the system")
        }
        return errors.New("failed to update employee data")
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        return errors.New("employee not found or no changes made")
    }

	return nil
}

func DeleteEmployee(employeeID string) error {
    // Start a transaction to ensure data consistency
    tx, err := database.DB.Begin()
    if err != nil {
        log.Printf("Transaction begin error: %v", err)
        return errors.New("failed to start transaction")
    }
    defer func() {
        if err != nil {
            tx.Rollback()
        }
    }()

    // First check if employee exists
    var exists bool
    checkQuery := "SELECT EXISTS(SELECT 1 FROM employees WHERE employee_id = $1)"
    err = tx.QueryRow(checkQuery, employeeID).Scan(&exists)
    if err != nil {
        log.Printf("SQL CHECK Employee Error: %v", err)
        return errors.New("failed to check employee existence")
    }

    if !exists {
        return errors.New("employee not found")
    }

    // For demo purposes, allow deletion of employees with requests
    // In production, you might want to keep this restriction
    // Check if employee has any related records (optional - for demo we allow deletion)
    var hasRequests bool
    requestCheck := "SELECT EXISTS(SELECT 1 FROM manpower_requests WHERE employee_id = $1)"
    err = tx.QueryRow(requestCheck, employeeID).Scan(&hasRequests)
    if err != nil {
        log.Printf("SQL CHECK Requests Error: %v", err)
        return errors.New("failed to check employee requests")
    }

    // Allow deletion even with requests for demo purposes
    // if hasRequests {
    //     return errors.New("cannot delete employee with existing manpower requests")
    // }

    // Check approval history (optional)
    var hasHistory bool
    historyCheck := "SELECT EXISTS(SELECT 1 FROM approval_history WHERE approver_id = $1)"
    err = tx.QueryRow(historyCheck, employeeID).Scan(&hasHistory)
    if err != nil {
        log.Printf("SQL CHECK History Error: %v", err)
        return errors.New("failed to check approval history")
    }

    // Allow deletion even with history for demo purposes
    // if hasHistory {
    //     return errors.New("cannot delete employee with approval history")
    // }

    // Proceed with deletion
    result, err := tx.Exec("DELETE FROM employees WHERE employee_id = $1", employeeID)
    if err != nil {
        log.Printf("SQL DELETE Employee Error: %v", err)
        return errors.New("failed to delete employee from database")
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        return errors.New("employee not found")
    }

    // Commit the transaction
    if err = tx.Commit(); err != nil {
        log.Printf("Transaction commit error: %v", err)
        return errors.New("failed to commit transaction")
    }

	return nil
}
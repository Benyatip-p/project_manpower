// backend/internal/models/admin_input.go
package models

type NewEmployeeRequest struct {
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required"`
	Role      string `json:"role" binding:"required"`      // Role Name (e.g., 'Admin')
	Department string `json:"department"` // Dept Name
	Position  string `json:"position"`  // Pos Name
	EmployeeID string `json:"employeeId" binding:"required"`
}
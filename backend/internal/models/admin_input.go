package models

type NewEmployeeRequest struct {
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required"`
	Role      string `json:"role" binding:"required"`   
	Department string `json:"department"` 
	Position  string `json:"position"`  
	EmployeeID string `json:"employeeId" binding:"required"`
}
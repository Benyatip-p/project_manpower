package models

type NewEmployeeRequest struct {
	FirstName  string `json:"firstName" binding:"required"`
	LastName   string `json:"lastName" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required"`
	Role       string `json:"role" binding:"required"`
	Department string `json:"department"`
	Position   string `json:"position"`
	EmployeeID string `json:"employeeId" binding:"required"`
}

type UpdateEmployeeRequest struct {
	FirstName  string `json:"firstName"`
	LastName   string `json:"lastName"`
	Email      string `json:"email"`
	Password   string `json:"password"` // ถ้าไม่ส่งมาจะไม่เปลี่ยนรหัสผ่าน
	Role       string `json:"role"`
	Department string `json:"department"`
	Position   string `json:"position"`
}

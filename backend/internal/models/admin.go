package models

type EmployeeDetail struct {
	EmployeeID          string `json:"employeeId"`
	Role                string `json:"role"`
	Department          string `json:"department"`
	Position            string `json:"position"`
	FirstName           string `json:"firstName"`
	LastName            string `json:"lastName"`
	Email               string `json:"email"`
	// Warning: ในการใช้งานจริง ไม่ควรส่ง Password กลับไป
	PasswordPlaceholder string `json:"password"`
}
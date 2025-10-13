package models

import "time"

type ManpowerRequest struct {
	RequestID          int        `json:"request_id" db:"request_id"`
	DocNumber          string     `json:"doc_number" db:"doc_number"`
	DocDate            time.Time  `json:"doc_date" db:"doc_date"`

	DepartmentID       int        `json:"department_id" db:"requesting_dept_id"`
	DepartmentName     string     `json:"department_name" db:"dept_name"`

	SectionID          *int       `json:"section_id" db:"requesting_section_id"`
	SectionName        string     `json:"section_name" db:"section_name"`

	PositionID         int        `json:"position_id" db:"requesting_pos_id"`
	PositionName       string     `json:"position_name" db:"pos_name"`

	EmployeeID         string     `json:"employee_id" db:"employee_id"`
	RequesterName      string     `json:"requester_name" db:"requester_name"`

	EmploymentType     string     `json:"employment_type" db:"employment_type_name"`
	ContractType       string     `json:"contract_type" db:"contract_type_name"`
	Reason             string     `json:"reason" db:"reason_name"`

	RequiredPositionName string   `json:"required_position_name" db:"required_position_name"`
	MinAge              int       `json:"min_age" db:"min_age"`
	MaxAge              int       `json:"max_age" db:"max_age"`
	Gender              string    `json:"gender" db:"gender_name"`
	Nationality         string    `json:"nationality" db:"nat_name"`
	Experience          string    `json:"experience" db:"exp_name"`
	EducationLevel      string    `json:"education_level" db:"edu_name"`
	SpecialQualifications string  `json:"special_qualifications" db:"special_qualifications"`

	OriginStatus        string    `json:"origin_status" db:"origin_status"`
	HRStatus            string    `json:"hr_status" db:"hr_status"`
	OverallStatus       string    `json:"overall_status" db:"overall_status"`

	DisplayStatus string `json:"display_status"`

	TargetHireDate      *time.Time `json:"target_hire_date" db:"target_hire_date"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at" db:"updated_at"`
}

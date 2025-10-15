package models

import "time"

type ManpowerRequest struct {
	RequestID          int        `json:"request_id" db:"request_id"`
	DocNumber          string     `json:"doc_number" db:"doc_number"`
	DocDate            time.Time  `json:"doc_date" db:"doc_date"`

	Division           string     `json:"division" db:"dept_name"`
	Department         string     `json:"department" db:"section_name"`

	DepartmentID       int        `json:"department_id" db:"requesting_dept_id"`
	DepartmentName     string     `json:"department_name" db:"dept_name"`

	SectionID          *int       `json:"section_id" db:"requesting_section_id"`
	SectionName        string     `json:"section_name" db:"section_name"`

	PositionID         int        `json:"position_id" db:"requesting_pos_id"`
	PositionName       string     `json:"position_name" db:"pos_name"`
	JobCode            int        `json:"job_code" db:"requesting_pos_id"`

	EmployeeID         string     `json:"employee_id" db:"employee_id"`
	RequesterName      string     `json:"requester_name" db:"requester_name"`

	Requester          string     `json:"requester" db:"requester_name"`

	EmploymentType     string     `json:"employmentType" db:"employment_type_name"`
	ContractType       string     `json:"contractType" db:"contract_type_name"`
	Reason             string     `json:"reason" db:"reason_name"` // เหตุผลในการขอ

	RequiredPositionName string   `json:"required_position_name" db:"required_position_name"`

	PositionRequired    string   `json:"positionRequired" db:"required_position_name"` // ตำแหน่งที่ต้องการ
	MinAge              int       `json:"min_age" db:"min_age"`
	MaxAge              int       `json:"max_age" db:"max_age"`

	AgeFrom             int       `json:"ageFrom" db:"min_age"`
	AgeTo               int       `json:"ageTo" db:"max_age"`
	Gender              string    `json:"gender" db:"gender_name"`
	Nationality         string    `json:"nationality" db:"nat_name"` 
	Experience          string    `json:"experience" db:"exp_name"` // ประสบการณ์
	EducationLevel      string    `json:"educationLevel" db:"edu_name"`// ระดับการศึกษา
	SpecialQualifications string  `json:"special_qualifications" db:"special_qualifications"`

	OriginStatus        string    `json:"origin_status" db:"origin_status"` // DRAFT, SUBMITTED, MGR_APPROVED, MGR_REJECTED
	HRStatus            string    `json:"hr_status" db:"hr_status"` // NONE, IN_PROGRESS, WAITING_HR_MANAGER, WAITING_HR_DIRECTOR, APPROVED, DISAPPROVED
	ManagementStatus    string    `json:"management_status" db:"management_status"` // NONE, IN_PROGRESS, WAITING_MANAGEMENT, APPROVED, DISAPPROVED
	OverallStatus       string    `json:"overall_status" db:"overall_status"` // NONE, IN_PROGRESS, WAITING_RECRUITER, WAITING_HR_MANAGER, WAITING_HR_DIRECTOR, WAITING_MANAGEMENT, APPROVED, DISAPPROVED

	ManagerStatus       string    `json:"managerStatus" db:"origin_status"` // DRAFT, SUBMITTED, MGR_APPROVED, MGR_REJECTED
	CeoStatus           string    `json:"ceoStatus" db:"overall_status"` // NONE, IN_PROGRESS, WAITING_RECRUITER, WAITING_HR_MANAGER, WAITING_HR_DIRECTOR, WAITING_MANAGEMENT, APPROVED, DISAPPROVED

	DisplayStatus string `json:"display_status"`

	TargetHireDate      *time.Time `json:"target_hire_date" db:"target_hire_date"`
	CreatedAt           time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at" db:"updated_at"`

	// Normalized display statuses for table rendering (Thai, consistent format)
	ManagerStatusDisplay string `json:"manager_status_display"`
	HRStatusDisplay      string `json:"hr_status_display"`
	CeoStatusDisplay     string `json:"overall_status_display"`
}

package handlers

import (
	"fmt"
	"log"
	"mantest/backend/internal/database"
	mw "mantest/backend/internal/middlewares"
	"mantest/backend/internal/models"
	"net/http"

	// "strconv"
	"database/sql"
	"time"

	"github.com/gin-gonic/gin"
)

// CreateSubmitResponse
type CreateSubmitResponse struct {
	Message       string `json:"message"        example:"Submitted successfully"`
	RequestID     int    `json:"request_id"     example:"123"`
	DocNumber     string `json:"doc_number"     example:"PQ25100001"`
	CreatedAt     string `json:"created_at"     example:"2025-10-12T15:12:00Z"`
	CreatedBy     string `json:"created_by"     example:"E101"`
	OriginStatus  string `json:"origin_status"  example:"SUBMITTED"`
	HRStatus      string `json:"hr_status"      example:"NONE"`
	OverallStatus string `json:"overall_status" example:"IN_PROGRESS"`
}

// CreateSubmitResponse
type CreateManpowerRequestInput struct {
	// ข้อมูลแผนก/ฝ่าย/ตำแหน่งที่ต้องการขอ
	RequestingDeptID    int  `json:"requesting_dept_id" binding:"required"`
	RequestingSectionID *int `json:"requesting_section_id"`
	RequestingPosID     int  `json:"requesting_pos_id" binding:"required"`

	RequiredPositionName  string  `json:"required_position_name" binding:"required"`
	NumRequired           int     `json:"num_required" binding:"required"`
	EmploymentTypeID      int     `json:"employment_type_id" binding:"required"`
	ContractTypeID        int     `json:"contract_type_id" binding:"required"`
	ReasonID              int     `json:"reason_id" binding:"required"`
	MinAge                *int    `json:"min_age"`
	MaxAge                *int    `json:"max_age"`
	GenderID              *int    `json:"gender_id"`
	NationalityID         *int    `json:"nationality_id"`
	ExperienceID          *int    `json:"experience_id"`
	EducationLevelID      *int    `json:"education_level_id"`
	SpecialQualifications string  `json:"special_qualifications"`
	TargetHireDate        *string `json:"target_hire_date"` // รูปแบบ YYYY-MM-DD
}

// DeleteManpowerRequestHandler godoc
// @Summary      Delete manpower request
// @Description  ลบใบคำขออัตรากำลังตาม ID
// @Tags         Requests
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "Request ID"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /user/requests/{id} [delete]
func DeleteManpowerRequestHandler(c *gin.Context) {
	requestID := c.Param("id")
	if requestID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request ID is required"})
		return
	}

	// Get user info from JWT
	empID := c.GetString(mw.CtxEmployeeID)
	deptID := c.GetInt(mw.CtxDeptID)
	if empID == "" || deptID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing auth claims"})
		return
	}

	// Check if request exists and belongs to user's department
	var exists bool
	var requestDeptID int
	err := database.DB.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM manpower_requests WHERE request_id = $1),
		       (SELECT requesting_dept_id FROM manpower_requests WHERE request_id = $1)
	`, requestID).Scan(&exists, &requestDeptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// Only allow deletion of requests from user's own department
	if requestDeptID != deptID {
		c.JSON(http.StatusForbidden, gin.H{"error": "ไม่สามารถลบคำขอของแผนกอื่นได้"})
		return
	}

	// Delete the request
	_, err = database.DB.Exec(`DELETE FROM manpower_requests WHERE request_id = $1`, requestID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Request deleted successfully",
	})
}

// GetManpowerRequestsHandler godoc
// @Summary      Get all manpower requests
// @Description  ดึงรายการ manpower requests ตามสิทธิ์ (Admin/Approve เห็นทั้งหมด, User เห็นเฉพาะกอง/แผนกตัวเอง)
// @Tags         Requests
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  map[string]interface{}  "data: []ManpowerRequest"
// @Failure      500  {object}  map[string]string
// @Router       /user/requests [get]
func GetManpowerRequestsHandler(c *gin.Context) {
	role := c.GetString(mw.CtxRoleName)
	deptID := c.GetInt(mw.CtxDeptID)
	secID := c.GetInt(mw.CtxSectionID)

	baseSelect := `
SELECT
    mr.request_id,
    mr.doc_number,
    mr.doc_date,
    mr.requesting_dept_id,
    d.dept_name,
    mr.requesting_section_id,
    s.section_name,
    mr.requesting_pos_id,
    p.pos_name,
    mr.employee_id,
    (e.first_name || ' ' || e.last_name) AS requester_name,
    et.et_name AS employment_type_name,
    ct.ct_name AS contract_type_name,
    rr.rr_name AS reason_name,
    mr.required_position_name,
    mr.num_required,
    mr.min_age,
    mr.max_age,
    COALESCE(g.gender_name,'') AS gender_name,
    COALESCE(n.nat_name,'')    AS nat_name,
    COALESCE(exp.exp_name,'')  AS exp_name,
    COALESCE(edu.edu_name,'')  AS edu_name,
    mr.special_qualifications,
    mr.origin_status,
    mr.hr_status,
    mr.overall_status,
    mr.target_hire_date,
    mr.created_at,
    mr.updated_at
FROM manpower_requests mr
LEFT JOIN departments d   ON mr.requesting_dept_id    = d.dept_id
LEFT JOIN sections   s    ON mr.requesting_section_id = s.section_id
LEFT JOIN positions  p    ON mr.requesting_pos_id     = p.pos_id
LEFT JOIN employees  e    ON mr.employee_id           = e.employee_id
LEFT JOIN employment_types et ON mr.employment_type_id = et.et_id
LEFT JOIN contract_types   ct ON mr.contract_type_id   = ct.ct_id
LEFT JOIN request_reasons  rr ON mr.reason_id          = rr.rr_id
LEFT JOIN genders g           ON mr.gender_id          = g.gender_id
LEFT JOIN nationalities n     ON mr.nationality_id     = n.nat_id
LEFT JOIN experiences exp     ON mr.experience_id      = exp.exp_id
LEFT JOIN education_levels edu ON mr.education_level_id= edu.edu_id
`

	var (
		query string
		args  []interface{}
	)

	if role == "Admin" || role == "Approve" {
		// เห็นทั้งหมด
		query = baseSelect + " ORDER BY mr.created_at DESC"
	} else {
		// ผู้ใช้ทั่วไป: ถ้ามี section_id ให้กรอง section ก่อน ไม่งั้นกรองตาม department
		if secID > 0 {
			query = baseSelect + " WHERE mr.requesting_section_id = $1 ORDER BY mr.created_at DESC"
			args = append(args, secID)
		} else {
			query = baseSelect + " WHERE mr.requesting_dept_id = $1 ORDER BY mr.created_at DESC"
			args = append(args, deptID)
		}
	}

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		log.Println("Error querying manpower_requests:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query error"})
		return
	}
	defer rows.Close()

	var requests []models.ManpowerRequest

	for rows.Next() {
		var r models.ManpowerRequest
		err := rows.Scan(
			&r.RequestID,
			&r.DocNumber,
			&r.DocDate,
			&r.DepartmentID,
			&r.DepartmentName,
			&r.SectionID,
			&r.SectionName,
			&r.PositionID,
			&r.PositionName,
			&r.EmployeeID,
			&r.RequesterName,
			&r.EmploymentType,
			&r.ContractType,
			&r.Reason,
			&r.RequiredPositionName,
			&r.NumRequired,
			&r.MinAge,
			&r.MaxAge,
			&r.Gender,
			&r.Nationality,
			&r.Experience,
			&r.EducationLevel,
			&r.SpecialQualifications,
			&r.OriginStatus,
			&r.HRStatus,
			&r.OverallStatus,
			&r.TargetHireDate,
			&r.CreatedAt,
			&r.UpdatedAt,
		)
		if err != nil {
			if err == sql.ErrNoRows {
				continue
			}
			log.Println("Scan error:", err)
			continue
		}
		//display
		r.DisplayStatus = mapStatusForRole(role, r.OriginStatus, r.HRStatus, r.OverallStatus)
		requests = append(requests, r)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    requests,
	})
}

// GetManpowerRequestByIDHandler godoc
// @Summary      Get manpower request by ID
// @Description  ดึงรายละเอียดของ manpower request ตาม ID
// @Tags         Requests
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "Request ID"
// @Success      200  {object}  map[string]interface{}  "data: ManpowerRequest"
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /user/requests/{id} [get]
func GetManpowerRequestByIDHandler(c *gin.Context) {
	requestID := c.Param("id")
	role := c.GetString(mw.CtxRoleName)
	deptID := c.GetInt(mw.CtxDeptID)
	secID := c.GetInt(mw.CtxSectionID)

	baseSelect := `
SELECT
    mr.request_id,
    mr.doc_number,
    mr.doc_date,
    mr.requesting_dept_id,
    d.dept_name,
    mr.requesting_section_id,
    s.section_name,
    mr.requesting_pos_id,
    p.pos_name,
    mr.employee_id,
    (e.first_name || ' ' || e.last_name) AS requester_name,
    et.et_name AS employment_type_name,
    ct.ct_name AS contract_type_name,
    rr.rr_name AS reason_name,
    mr.required_position_name,
    mr.num_required,
    mr.min_age,
    mr.max_age,
    COALESCE(g.gender_name,'') AS gender_name,
    COALESCE(n.nat_name,'')    AS nat_name,
    COALESCE(exp.exp_name,'')  AS exp_name,
    COALESCE(edu.edu_name,'')  AS edu_name,
    mr.special_qualifications,
    mr.origin_status,
    mr.hr_status,
    mr.overall_status,
    mr.target_hire_date,
    mr.created_at,
    mr.updated_at
FROM manpower_requests mr
LEFT JOIN departments d   ON mr.requesting_dept_id    = d.dept_id
LEFT JOIN sections   s    ON mr.requesting_section_id = s.section_id
LEFT JOIN positions  p    ON mr.requesting_pos_id     = p.pos_id
LEFT JOIN employees  e    ON mr.employee_id           = e.employee_id
LEFT JOIN employment_types et ON mr.employment_type_id = et.et_id
LEFT JOIN contract_types   ct ON mr.contract_type_id   = ct.ct_id
LEFT JOIN request_reasons  rr ON mr.reason_id          = rr.rr_id
LEFT JOIN genders g           ON mr.gender_id          = g.gender_id
LEFT JOIN nationalities n     ON mr.nationality_id     = n.nat_id
LEFT JOIN experiences exp     ON mr.experience_id      = exp.exp_id
LEFT JOIN education_levels edu ON mr.education_level_id= edu.edu_id
WHERE mr.request_id = $1
`

	var (
		query string
		args  []interface{}
	)

	// กรองตาม role
	if role == "Admin" || role == "Approve" {
		// เห็นทั้งหมด
		query = baseSelect
		args = append(args, requestID)
	} else {
		// User: กรองตาม section หรือ department
		if secID > 0 {
			query = baseSelect + " AND mr.requesting_section_id = $2"
			args = append(args, requestID, secID)
		} else {
			query = baseSelect + " AND mr.requesting_dept_id = $2"
			args = append(args, requestID, deptID)
		}
	}

	var r models.ManpowerRequest
	err := database.DB.QueryRow(query, args...).Scan(
		&r.RequestID,
		&r.DocNumber,
		&r.DocDate,
		&r.DepartmentID,
		&r.DepartmentName,
		&r.SectionID,
		&r.SectionName,
		&r.PositionID,
		&r.PositionName,
		&r.EmployeeID,
		&r.RequesterName,
		&r.EmploymentType,
		&r.ContractType,
		&r.Reason,
		&r.RequiredPositionName,
		&r.NumRequired,
		&r.MinAge,
		&r.MaxAge,
		&r.Gender,
		&r.Nationality,
		&r.Experience,
		&r.EducationLevel,
		&r.SpecialQualifications,
		&r.OriginStatus,
		&r.HRStatus,
		&r.OverallStatus,
		&r.TargetHireDate,
		&r.CreatedAt,
		&r.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
			return
		}
		log.Println("Error querying request by ID:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query error"})
		return
	}

	// แปลงสถานะสำหรับแสดงผล
	r.DisplayStatus = mapStatusForRole(role, r.OriginStatus, r.HRStatus, r.OverallStatus)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    r,
	})
}

// CreateAndSubmitManpowerRequestHandler godoc
// @Summary      Create & submit manpower request
// @Description  ผู้ใช้สร้างคำขอและส่งเข้ากระบวนการอนุมัติทันที (origin_status=SUBMITTED)
// @Tags         Requests
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      CreateManpowerRequestInput  true  "payload"
// @Success      201   {object}  CreateSubmitResponse
// @Failure      400   {object}  map[string]string
// @Failure      401   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /user/requests/submit [post]
func CreateAndSubmitManpowerRequestHandler(c *gin.Context) {
	empID := c.GetString(mw.CtxEmployeeID)
	// ไม่ต้องใช้ deptID, secID, posID จาก JWT อีกต่อไป เพราะจะใช้จาก input แทน
	if empID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing auth claims"})
		return
	}

	var input CreateManpowerRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	if input.NumRequired <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "num_required must be > 0"})
		return
	}

	// target_hire_date
	var hireDate sql.NullTime
	if input.TargetHireDate != nil && *input.TargetHireDate != "" {
		if t, err := time.Parse("2006-01-02", *input.TargetHireDate); err == nil {
			hireDate.Valid = true
			hireDate.Time = t
		}
	}

	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "begin tx failed"})
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	// running doc no
	var lastID int
	if err = tx.QueryRow(`SELECT COALESCE(MAX(request_id),0) FROM manpower_requests`).Scan(&lastID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "doc no gen failed"})
		return
	}
	docNo := generateDocNo(lastID + 1)

	// INSERT + set origin_status=SUBMITTED, hr_status=NONE, overall=IN_PROGRESS
	const qInsert = `
      INSERT INTO manpower_requests (
        doc_number, employee_id, doc_date,
        requesting_dept_id, requesting_section_id, requesting_pos_id,
        employment_type_id, contract_type_id, reason_id,
        required_position_name, num_required,
        min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
        special_qualifications, origin_status, hr_status, overall_status,
        target_hire_date, created_at, updated_at
      )
      VALUES (
        $1,$2,(NOW() AT TIME ZONE 'Asia/Bangkok')::DATE,
        $3,$4,$5,
        $6,$7,$8,
        $9,$10,
        $11,$12,$13,$14,$15,$16,
        $17,'SUBMITTED','NONE','IN_PROGRESS',
        $18,NOW(),NOW()
      )
      RETURNING request_id, doc_number, created_at
    `

	var newID int
	var createdAt time.Time
	var newDoc string
	if err = tx.QueryRow(qInsert,
		docNo, empID,
		input.RequestingDeptID, input.RequestingSectionID, input.RequestingPosID,
		input.EmploymentTypeID, input.ContractTypeID, input.ReasonID,
		input.RequiredPositionName, input.NumRequired,
		input.MinAge, input.MaxAge, input.GenderID, input.NationalityID,
		input.ExperienceID, input.EducationLevelID,
		input.SpecialQualifications,
		hireDate,
	).Scan(&newID, &newDoc, &createdAt); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// บันทึกประวัติการส่ง (step=0, action=SUBMIT)
	_, err = tx.Exec(`
        INSERT INTO approval_history (request_id, approver_id, step, action, notes)
        VALUES ($1,$2,0,'SUBMIT','user submitted the request')
    `, newID, empID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save history failed"})
		return
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Submitted successfully",
		"request_id":     newID,
		"doc_number":     newDoc,
		"created_at":     createdAt,
		"created_by":     empID,
		"origin_status":  "SUBMITTED",
		"hr_status":      "NONE",
		"overall_status": "IN_PROGRESS",
		// UI แปลสถานะฝั่งต้นสังกัด: “รอผู้จัดการแผนก”
	})
}

func nullIfZero(v int) interface{} {
	if v == 0 {
		return nil
	}
	return v
}

func generateDocNo(id int) string {
	now := time.Now()
	return fmt.Sprintf("PQ%s%04d", now.Format("0601"), id) // e.g. PQ25100001
}

// func CreateManpowerRequestHandler(c *gin.Context) {
// 	empID := c.GetString(mw.CtxEmployeeID)
// 	deptID := c.GetInt(mw.CtxDeptID)
// 	secID  := c.GetInt(mw.CtxSectionID)   // NEW
// 	posID := c.GetInt(mw.CtxPosID)

// 	if empID == "" || deptID == 0 || posID == 0 {
// 		c.JSON(http.StatusUnauthorized, gin.H{"error":"missing auth claims"})
// 		return
// 	}

// 	var input CreateManpowerRequestInput
// 	if err := c.ShouldBindJSON(&input); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
// 		return
// 	}
// 	if input.NumRequired <= 0 {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "num_required must be > 0"})
// 		return
// 	}

// 	var lastID int
// 	if err := database.DB.QueryRow(`SELECT COALESCE(MAX(request_id),0) FROM manpower_requests`).Scan(&lastID); err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate document number"})
// 		return
// 	}
// 	docNo := generateDocNo(lastID + 1)

// 	var hireDate sql.NullTime
// 	if input.TargetHireDate != nil && *input.TargetHireDate != "" {
// 		if t, err := time.Parse("2006-01-02", *input.TargetHireDate); err == nil {
// 			hireDate.Valid = true
// 			hireDate.Time = t
// 		}
// 	}

// 	const q = `
// 		INSERT INTO manpower_requests (
// 			doc_number, employee_id, doc_date,
// 			requesting_dept_id, requesting_section_id, requesting_pos_id,
// 			employment_type_id, contract_type_id, reason_id,
// 			required_position_name, num_required,
// 			min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
// 			special_qualifications, origin_status, hr_status, overall_status,
// 			target_hire_date, created_at, updated_at
// 		)
// 		VALUES (
// 			$1,$2,CURRENT_DATE,
// 			$3,$4,$5,
// 			$6,$7,$8,
// 			$9,$10,
// 			$11,$12,$13,$14,$15,$16,
// 			$17,'DRAFT','NONE','IN_PROGRESS',
// 			$18,NOW(),NOW()
// 		)
// 		RETURNING request_id, doc_number, created_at
// 	`

// 	var newID int
// 	var createdAt time.Time
// 	var newDoc string
// 	if err := database.DB.QueryRow(q,
// 		docNo, empID,
// 		deptID, nullIfZero(secID), posID, // <== section ใส่เป็น NULL ถ้าไม่มี
// 		input.EmploymentTypeID, input.ContractTypeID, input.ReasonID,
// 		input.RequiredPositionName, input.NumRequired,
// 		input.MinAge, input.MaxAge, input.GenderID, input.NationalityID,
// 		input.ExperienceID, input.EducationLevelID,
// 		input.SpecialQualifications,
// 		hireDate,
// 	).Scan(&newID, &newDoc, &createdAt); err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	c.JSON(http.StatusCreated, gin.H{
// 		"message":    "Request created successfully",
// 		"request_id": newID,
// 		"doc_number": newDoc,
// 		"created_at": createdAt,
// 		"created_by": empID,
// 		"status":     "DRAFT",
// 	})
// }

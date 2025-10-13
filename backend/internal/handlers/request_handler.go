package handlers

import (
	"fmt"
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
	mw "mantest/backend/internal/middlewares"
	"net/http"
	"strconv"
	"time"
	"database/sql"

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

// CreateManpowerRequestInput (ใช้สำหรับรับข้อมูลจาก UserRForm.jsx)
type CreateManpowerRequestInput struct {
    RequiredPositionName string  `json:"required_position_name" binding:"required"`
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

// GetManpowerRequestsHandler (Used for list views: user/approver)
func GetManpowerRequestsHandler(c *gin.Context) {
	role := c.GetString(mw.CtxRoleName)
	deptID := c.GetInt(mw.CtxDeptID)
	secID  := c.GetInt(mw.CtxSectionID)

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
		// สมมติว่า mapStatusForRole ถูก Implement ไว้ในไฟล์อื่น (เช่น utils.go)
		// r.DisplayStatus = mapStatusForRole(role, r.OriginStatus, r.HRStatus, r.OverallStatus)
		requests = append(requests, r)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    requests,
	})
}

// CreateAndSubmitManpowerRequestHandler (Used by UserRForm.jsx to submit a new request)
func CreateAndSubmitManpowerRequestHandler(c *gin.Context) {
    empID := c.GetString(mw.CtxEmployeeID)
    deptID := c.GetInt(mw.CtxDeptID)
    secID  := c.GetInt(mw.CtxSectionID)
    posID  := c.GetInt(mw.CtxPosID)
    if empID == "" || deptID == 0 || posID == 0 {
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
        $1,$2,CURRENT_DATE,
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
        deptID, nullIfZero(secID), posID,
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
        "message":     "Submitted successfully",
        "request_id":  newID,
        "doc_number":  newDoc,
        "created_at":  createdAt,
        "created_by":  empID,
        "origin_status": "SUBMITTED",
        "hr_status":     "NONE",
        "overall_status":"IN_PROGRESS",
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

// GetManpowerRequestByIDHandler (Fixed with COALESCE for nullable fields)
func GetManpowerRequestByIDHandler(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request ID is required"})
		return
	}

	requestID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	query := `
		SELECT
			mr.request_id,
			mr.doc_number,
			mr.doc_date,
			mr.requesting_dept_id,
			d.dept_name,
			mr.requesting_section_id,
			COALESCE(s.section_name, '') AS section_name, 
			mr.requesting_pos_id,
			p.pos_name,
			mr.employee_id,
			(e.first_name || ' ' || e.last_name) AS requester_name,
			et.et_name AS employment_type_name,
			ct.ct_name AS contract_type_name,
			rr.rr_name AS reason_name,
			mr.required_position_name,
			COALESCE(mr.min_age, 0) AS min_age, 
			COALESCE(mr.max_age, 0) AS max_age, 
			COALESCE(g.gender_name,'') AS gender_name,
			COALESCE(n.nat_name,'')    AS nat_name,
			COALESCE(exp.exp_name,'')  AS exp_name,
			COALESCE(edu.edu_name,'')  AS edu_name,
			COALESCE(mr.special_qualifications, '') AS special_qualifications, 
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

	var r models.ManpowerRequest
	err = database.DB.QueryRow(query, requestID).Scan(
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
			c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
			return
		}
		log.Printf("Error querying request by ID: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    r,
	})
}

// DeleteManpowerRequestHandler (For user to delete their own requests)
func DeleteManpowerRequestHandler(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request ID is required"})
		return
	}

	requestID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	// Get user info from context
	empID := c.GetString(mw.CtxEmployeeID)
	if empID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Check if the request belongs to the user and is in a deletable state
	var ownerID string
	var status string
	err = database.DB.QueryRow(`
		SELECT employee_id, overall_status
		FROM manpower_requests
		WHERE request_id = $1
	`, requestID).Scan(&ownerID, &status)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
			return
		}
		log.Printf("Error querying request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Only allow deletion if the user owns the request and it's not approved
	if ownerID != empID {
		log.Printf("Forbidden: User %s tried to delete request %d owned by %s", empID, requestID, ownerID)
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own requests"})
		return
	}

	if status == "APPROVED" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete approved requests"})
		return
	}

	// Delete the request
	_, err = database.DB.Exec(`DELETE FROM manpower_requests WHERE request_id = $1`, requestID)
	if err != nil {
		log.Printf("Error deleting request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Request deleted successfully",
	})
}
package handlers

import (
	"fmt"
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
	mw "mantest/backend/internal/middlewares"
	"net/http"
	// "strconv"
	"time"
	"database/sql"

	"github.com/gin-gonic/gin"
)

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

func GetManpowerRequestsHandler(c *gin.Context) {
	query := `
	SELECT
		mr.request_id,
		mr.doc_number,
		mr.doc_date,
		mr.requesting_dept_id,
		d.dept_name,
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
		g.gender_name,
		n.nat_name,
		exp.exp_name,
		edu.edu_name,
		mr.special_qualifications,
		mr.origin_status,
		mr.hr_status,
		mr.overall_status,
		mr.target_hire_date,
		mr.created_at,
		mr.updated_at
	FROM manpower_requests mr
	LEFT JOIN departments d ON mr.requesting_dept_id = d.dept_id
	LEFT JOIN positions p ON mr.requesting_pos_id = p.pos_id
	LEFT JOIN employees e ON mr.employee_id = e.employee_id
	LEFT JOIN employment_types et ON mr.employment_type_id = et.et_id
	LEFT JOIN contract_types ct ON mr.contract_type_id = ct.ct_id
	LEFT JOIN request_reasons rr ON mr.reason_id = rr.rr_id
	LEFT JOIN genders g ON mr.gender_id = g.gender_id
	LEFT JOIN nationalities n ON mr.nationality_id = n.nat_id
	LEFT JOIN experiences exp ON mr.experience_id = exp.exp_id
	LEFT JOIN education_levels edu ON mr.education_level_id = edu.edu_id
	ORDER BY mr.created_at DESC;
	`

	rows, err := database.DB.Query(query)
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
		requests = append(requests, r)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    requests,
	})
}

func CreateManpowerRequestHandler(c *gin.Context) {
	empID := c.GetString(mw.CtxEmployeeID)
	deptID := c.GetInt(mw.CtxDeptID)
	posID := c.GetInt(mw.CtxPosID)

	if empID == "" || deptID == 0 || posID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error":"missing auth claims"})
		return
	}

	fmt.Println(empID)

	var input CreateManpowerRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}
	if input.NumRequired <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "num_required must be > 0"})
		return
	}

	// running doc no (ง่าย ๆ)
	var lastID int
	if err := database.DB.QueryRow(`SELECT COALESCE(MAX(request_id),0) FROM manpower_requests`).Scan(&lastID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate document number"})
		return
	}
	docNo := generateDocNo(lastID + 1)

	// parse target_hire_date
	var hireDate sql.NullTime
	if input.TargetHireDate != nil && *input.TargetHireDate != "" {
		if t, err := time.Parse("2006-01-02", *input.TargetHireDate); err == nil {
			hireDate.Valid = true
			hireDate.Time = t
		}
	}

	// INSERT
	const q = `
		INSERT INTO manpower_requests (
			doc_number, employee_id, doc_date,
			requesting_dept_id, requesting_pos_id,
			employment_type_id, contract_type_id, reason_id,
			required_position_name, num_required,
			min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
			special_qualifications, origin_status, hr_status, overall_status,
			target_hire_date, created_at, updated_at
		)
		VALUES (
			$1,$2,CURRENT_DATE,
			$3,$4,$5,$6,$7,
			$8,$9,
			$10,$11,$12,$13,$14,$15,
			$16,'DRAFT','NONE','IN_PROGRESS',
			$17,NOW(),NOW()
		)
		RETURNING request_id, doc_number, created_at
	`

	var newID int
	var createdAt time.Time
	var newDoc string
	if err := database.DB.QueryRow(q,
		docNo, empID,
		deptID, posID,
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

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Request created successfully",
		"request_id": newID,
		"doc_number": newDoc,
		"created_at": createdAt,
		"created_by": empID,
		"status":     "DRAFT",
	})
}

func generateDocNo(id int) string {
	now := time.Now()
	return fmt.Sprintf("PQ%s%04d", now.Format("0601"), id) // e.g. PQ25100001
}
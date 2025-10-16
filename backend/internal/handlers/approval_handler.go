// handlers/approval_handler.go
package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"time"

	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
	mw "mantest/backend/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func GetRequestsForApprovalHandler(c *gin.Context) {
	role := c.GetString(mw.CtxRoleName)
	deptID := c.GetInt(mw.CtxDeptID)
	secID := c.GetInt(mw.CtxSectionID)
	posID := c.GetInt(mw.CtxPosID)

	if role == "" || deptID == 0 || posID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing auth claims"})
		return
	}

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
		COALESCE(n.nat_name,'') 	AS nat_name,
		COALESCE(exp.exp_name,'') 	AS exp_name,
		COALESCE(edu.edu_name,'') 	AS edu_name,
		mr.special_qualifications,
		mr.origin_status,
		mr.hr_status,
		mr.management_status,
		mr.overall_status,
		mr.target_hire_date,
		mr.created_at,
		mr.updated_at
	FROM manpower_requests mr
	LEFT JOIN departments d 	ON mr.requesting_dept_id 		= d.dept_id
	LEFT JOIN sections 	s 		ON mr.requesting_section_id = s.section_id
	LEFT JOIN positions 	p 		ON mr.requesting_pos_id 		= p.pos_id
	LEFT JOIN employees 	e 		ON mr.employee_id 				= e.employee_id
	LEFT JOIN employment_types et ON mr.employment_type_id = et.et_id
	LEFT JOIN contract_types 	ct ON mr.contract_type_id 	= ct.ct_id
	LEFT JOIN request_reasons 	rr ON mr.reason_id 				= rr.rr_id
	LEFT JOIN genders g 			ON mr.gender_id 				= g.gender_id
	LEFT JOIN nationalities n 	ON mr.nationality_id 		= n.nat_id
	LEFT JOIN experiences exp 		ON mr.experience_id 			= exp.exp_id
	LEFT JOIN education_levels edu ON mr.education_level_id= edu.edu_id
	`

	var query string
	var args []interface{}

	var posName string
	if err := database.DB.QueryRow(`SELECT pos_name FROM positions WHERE pos_id=$1`, posID).Scan(&posName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get position"})
		return
	}

	var hrDeptID int
	if err := database.DB.QueryRow(`SELECT dept_id FROM departments WHERE dept_name=$1`, deptHRName).Scan(&hrDeptID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get HR department"})
		return
	}
	var mgmtDeptID int
	if err := database.DB.QueryRow(`SELECT dept_id FROM departments WHERE dept_name=$1`, deptMgmtName).Scan(&mgmtDeptID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get Management department"})
		return
	}

	// This part is from the first code block and is kept as is.
	// The logic for fetching requests for a specific user role.
	var whereClause string
	if deptID == mgmtDeptID {
		// Executive Department sees items waiting for management approval
		whereClause = "WHERE mr.management_status = 'WAITING_MANAGEMENT'"
	} else if deptID == hrDeptID {
		// HR can approve only non-HR department requests once origin lane completed
		// Exclude HR-originating requests explicitly
		args = append(args, hrDeptID)
		switch posName {
		case posRecruiter:
			whereClause = "WHERE mr.hr_status = 'WAITING_RECRUITER' AND mr.requesting_dept_id <> $1"
		case posManager:
			whereClause = "WHERE mr.hr_status = 'WAITING_HR_MANAGER' AND mr.requesting_dept_id <> $1"
		case posDirector:
			whereClause = "WHERE mr.hr_status = 'WAITING_HR_DIRECTOR' AND mr.requesting_dept_id <> $1"
		default:
			whereClause = "WHERE 1=0"
		}
	} else {
		// Non-HR originators: department lane approvals
		switch posName {
		case posManager:
			whereClause = "WHERE mr.origin_status = 'SUBMITTED' AND mr.requesting_dept_id = $1"
			args = append(args, deptID)
			if secID > 0 {
				whereClause += " AND mr.requesting_section_id = $2"
				args = append(args, secID)
			}
		case posDirector:
			whereClause = "WHERE mr.origin_status = 'MGR_APPROVED' AND mr.requesting_dept_id = $1"
			args = append(args, deptID)
		default:
			whereClause = "WHERE 1=0"
		}
	}

	query = baseSelect + " " + whereClause + " ORDER BY mr.created_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		log.Println("Error querying requests for approval:", err)
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
			&r.ManagementStatus,
			&r.OverallStatus,
			&r.TargetHireDate,
			&r.CreatedAt,
			&r.UpdatedAt,
		)
		if err != nil {
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

// DecideResponse from the second code block (no ManagementStatus)
type DecideResponse struct {
	Message       string `json:"message" example:"decision stored"`
	RequestID     int    `json:"request_id" example:"15"`
	DocNumber     string `json:"doc_number" example:"PQ24110026"`
	OriginStatus  string `json:"origin_status" example:"DIR_APPROVED"`
	HRStatus      string `json:"hr_status" example:"WAITING_RECRUITER"`
	OverallStatus string `json:"overall_status" example:"IN_PROGRESS"`
}

type DecideRequest struct {
	Action string `json:"action" binding:"required"`
	Notes  string `json:"notes"`
}

// Constants from the second code block (no deptMgmtName)
const (
	posManager   = "ผู้จัดการ"
	posDirector  = "ผู้อำนวยการฝ่าย"
	posRecruiter = "เจ้าหน้าที่ HR"

	deptHRName   = "ฝ่ายทรัพยากรบุคคล"
	deptMgmtName = "ฝ่ายบริหาร"
)

// resolveActorRoleForRequest from the second code block (no MGMT role)
func resolveActorRoleForRequest(
	reqDeptID int, reqSectionID sql.NullInt64,
	actorDeptID, actorSectionID, actorPosID int,
) (string, error) {

	var posName string
	if err := database.DB.QueryRow(
		`SELECT pos_name FROM positions WHERE pos_id=$1`,
		actorPosID,
	).Scan(&posName); err != nil {
		return "", err
	}

	var hrDeptID int
	if err := database.DB.QueryRow(
		`SELECT dept_id FROM departments WHERE dept_name=$1`, deptHRName,
	).Scan(&hrDeptID); err != nil {
		return "", err
	}
	var mgmtDeptID int
	if err := database.DB.QueryRow(
		`SELECT dept_id FROM departments WHERE dept_name=$1`, deptMgmtName,
	).Scan(&mgmtDeptID); err != nil {
		return "", err
	}

	if actorDeptID == hrDeptID {
		switch posName {
		case posRecruiter:
			return "RECRUITER", nil
		case posManager:
			return "HRMGR", nil
		case posDirector:
			return "HRDIR", nil
		}
		return "", nil
	}
	if actorDeptID == mgmtDeptID {
		// Any position in Executive Department can approve at the management step
		return "MGMT", nil
	}

	if actorDeptID != reqDeptID {
		return "", nil
	}
	if reqSectionID.Valid && actorSectionID != 0 && int(reqSectionID.Int64) != actorSectionID && posName == posManager {
		return "", nil
	}

	switch posName {
	case posManager:
		return "MGR", nil
	case posDirector:
		return "DIR", nil
	default:
		return "", nil
	}
}

// DecideManpowerRequestHandler godoc
// @Summary      Approve/Reject/Return a request
// @Description  ผู้อนุมัติตาม lane ของตัวเอง ทำการตัดสินใจในคำขอ (APPROVE / REJECT / RETURN)
// @Tags         Approvals
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      int            true  "request_id"
// @Param        body  body      DecideRequest  true  "action: APPROVE | REJECT | RETURN"
// @Success      200   {object}  DecideResponse
// @Failure      400   {object}  map[string]string
// @Failure      401   {object}  map[string]string
// @Failure      403   {object}  map[string]string
// @Failure      404   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /user/requests/{id}/decide [post]
func DecideManpowerRequestHandler(c *gin.Context) {
	idStr := c.Param("id")
	reqID, err := strconv.Atoi(idStr)
	if err != nil || reqID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// auth claims from middleware
	empID := c.GetString(mw.CtxEmployeeID)
	deptID := c.GetInt(mw.CtxDeptID)
	secID := c.GetInt(mw.CtxSectionID)
	posID := c.GetInt(mw.CtxPosID)

	if empID == "" || deptID == 0 || posID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing auth claims"})
		return
	}

	var body DecideRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	action := body.Action // APPROVE / REJECT / RETURN

	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "begin tx failed"})
		return
	}
	defer func() {
		_ = tx.Rollback()
	}()

	// lock row (fetch columns based on second code block's logic)
	var (
		docNo         string
		reqDeptID     int
		reqSectionID  sql.NullInt64
		originStatus  string
		hrStatus      string
		mgmtStatus    string
		overallStatus string
	)
	err = tx.QueryRow(`
		SELECT doc_number, requesting_dept_id, requesting_section_id,
			   origin_status, hr_status, management_status, overall_status
		FROM manpower_requests
		WHERE request_id=$1
		FOR UPDATE
	`, reqID).Scan(&docNo, &reqDeptID, &reqSectionID, &originStatus, &hrStatus, &mgmtStatus, &overallStatus)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}

	actorLane, err := resolveActorRoleForRequest(reqDeptID, reqSectionID, deptID, secID, posID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "role resolve failed"})
		return
	}
	if actorLane == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "no permission for this step"})
		return
	}

	// Logic for computing next statuses
	newOrigin := originStatus
	newHR := hrStatus
	newMgmt := mgmtStatus
	newOverall := overallStatus
	var step int

	switch actorLane {
	case "MGR":
		if originStatus != "SUBMITTED" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "not waiting manager"})
			return
		}
		step = 1
		switch action {
		case "APPROVE":
			newOrigin = "MGR_APPROVED"
			// Do not advance HR lane here. HR starts after director approval.
		case "REJECT":
			newOrigin = "MGR_REJECTED"
			newOverall = "REJECTED" // from second block
		case "RETURN":
			newOrigin = "RETURNED"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action"})
			return
		}

	case "DIR":
		if originStatus != "MGR_APPROVED" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "not waiting director"})
			return
		}
		step = 2
		switch action {
		case "APPROVE":
			newOrigin = "DIR_APPROVED"
			// เริ่มเข้าสู่ HR lane หลัง ผอ.ฝ่าย อนุมัติ
			// ครอบคลุมกรณีเริ่มต้นที่ตั้ง hr_status เป็น IN_PROGRESS ด้วย
			if newHR == "NONE" || newHR == "HR_INTAKE" || newHR == "IN_PROGRESS" {
				newHR = "WAITING_RECRUITER"
			}
		case "REJECT":
			newOrigin = "DIR_REJECTED"
			newOverall = "REJECTED" // from second block
		case "RETURN":
			newOrigin = "RETURNED"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action"})
			return
		}

	case "RECRUITER":
		if hrStatus != "WAITING_RECRUITER" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "not waiting recruiter"})
			return
		}
		step = 3
		switch action {
		case "APPROVE":
			newHR = "WAITING_HR_MANAGER"
		case "REJECT":
			newHR = "RECRUITER_REJECTED"
			newOverall = "REJECTED" // from second block
		case "RETURN":
			newHR = "RETURNED"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action"})
			return
		}

	case "HRMGR":
		if hrStatus != "WAITING_HR_MANAGER" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "not waiting hr manager"})
			return
		}
		step = 4
		switch action {
		case "APPROVE":
			newHR = "WAITING_HR_DIRECTOR"
		case "REJECT":
			newHR = "HR_MANAGER_REJECTED"
			newOverall = "REJECTED" // from second block
		case "RETURN":
			newHR = "RETURNED"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action"})
			return
		}

	case "HRDIR":
		if hrStatus != "WAITING_HR_DIRECTOR" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "not waiting hr director"})
			return
		}
		step = 5
		switch action {
		case "APPROVE":
			// HR final approval completes HR lane only; forward to Executive
			newHR = "HR_DIRECTOR_APPROVED"
			newMgmt = "WAITING_MANAGEMENT"
			newOverall = "WAITING_MANAGEMENT"
		case "REJECT":
			newHR = "HR_DIRECTOR_REJECTED"
			newOverall = "REJECTED"
		case "RETURN":
			newHR = "RETURNED"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action"})
			return
		}
	case "MGMT":
		if mgmtStatus != "WAITING_MANAGEMENT" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "not waiting management"})
			return
		}
		step = 6
		switch action {
		case "APPROVE":
			newMgmt = "MGMT_APPROVED"
			newOverall = "APPROVED"
		case "REJECT":
			newMgmt = "MGMT_REJECTED"
			newOverall = "REJECTED"
		case "RETURN":
			newMgmt = "RETURNED"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action"})
			return
		}

	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// update request (UPDATE statement from second code block)
	if _, err := tx.Exec(`
		UPDATE manpower_requests
		SET origin_status=$1, hr_status=$2, management_status=$3, overall_status=$4, updated_at=NOW()
		WHERE request_id=$5
	`, newOrigin, newHR, newMgmt, newOverall, reqID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}

	// write history
	if _, err := tx.Exec(`
		INSERT INTO approval_history (request_id, approver_id, step, action, notes, approval_time)
		VALUES ($1,$2,$3,$4,$5,$6)
	`, reqID, empID, step, action, body.Notes, time.Now()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "history failed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	// JSON Response from second code block
	c.JSON(http.StatusOK, gin.H{
		"message":        "decision stored",
		"request_id":     reqID,
		"doc_number":     docNo,
		"origin_status":  newOrigin,
		"hr_status":      newHR,
		"overall_status": newOverall,
	})
}
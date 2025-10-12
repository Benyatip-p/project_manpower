// handlers/approval_handler.go
package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"mantest/backend/internal/database"
	mw "mantest/backend/internal/middlewares"

	"github.com/gin-gonic/gin"
)

type DecideRequest struct {
	Action string `json:"action" binding:"required"` // APPROVE / REJECT / RETURN
	Notes  string `json:"notes"`
}

// ===== helper: check actor's role for that request =====

const (
	posManager   = "ผู้จัดการ"
	posDirector  = "ผู้อำนวยการฝ่าย"
	posRecruiter = "เจ้าหน้าที่ HR"

	deptHRName = "ฝ่ายทรัพยากรบุคคล"
)

// resolveActorRole returns which lane the actor belongs to for THIS request,
// one of: "MGR","DIR","RECRUITER","HRMGR","HRDIR", or "" if not allowed.
func resolveActorRoleForRequest(
	reqDeptID int, reqSectionID sql.NullInt64,
	actorDeptID, actorSectionID, actorPosID int,
) (string, error) {

	// get position name for actor
	var posName string
	if err := database.DB.QueryRow(
		`SELECT pos_name FROM positions WHERE pos_id=$1`,
		actorPosID,
	).Scan(&posName); err != nil {
		return "", err
	}

	// get whether actor in HR department
	var hrDeptID int
	if err := database.DB.QueryRow(
		`SELECT dept_id FROM departments WHERE dept_name=$1`, deptHRName,
	).Scan(&hrDeptID); err != nil {
		return "", err
	}

	// HR lane
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

	// Origin lane (same department as request)
	if actorDeptID != reqDeptID {
		return "", nil
	}
	// if request has section, manager must match same section (if your policy wants that)
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

// ===== handler =====

func DecideManpowerRequestHandler(c *gin.Context) {
	// path param
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

	// lock row
	var (
		docNo               string
		reqDeptID           int
		reqSectionID        sql.NullInt64
		originStatus        string
		hrStatus            string
		overallStatus       string
	)
	err = tx.QueryRow(`
		SELECT doc_number, requesting_dept_id, requesting_section_id,
		       origin_status, hr_status, overall_status
		FROM manpower_requests
		WHERE request_id=$1
		FOR UPDATE
	`, reqID).Scan(&docNo, &reqDeptID, &reqSectionID, &originStatus, &hrStatus, &overallStatus)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
		return
	}

	// figure out who the actor is for this request
	actorLane, err := resolveActorRoleForRequest(reqDeptID, reqSectionID, deptID, secID, posID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "role resolve failed"})
		return
	}
	if actorLane == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "no permission for this step"})
		return
	}

	// compute next statuses
	newOrigin := originStatus
	newHR := hrStatus
	newOverall := overallStatus
	var step int // approval_history.step
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
			if newHR == "NONE" || newHR == "HR_INTAKE" {
				newHR = "WAITING_RECRUITER"
			}
		case "REJECT":
			newOrigin = "MGR_REJECTED"
			newOverall = "REJECTED"
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
			// เมื่อ ผอ.ฝ่ายต้นสังกัดอนุมัติแล้ว ถ้ายังไม่เริ่มฝั่ง HR ให้ตั้งเป็น WAITING_RECRUITER
			if newHR == "NONE" {
				newHR = "WAITING_RECRUITER"
			}
		case "REJECT":
			newOrigin = "DIR_REJECTED"
			newOverall = "REJECTED"
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
			// newHR = "RECRUITER_APPROVED"
			newHR = "WAITING_HR_MANAGER"
		case "REJECT":
			newHR = "RECRUITER_REJECTED"
			newOverall = "REJECTED"
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
			newHR = "HR_MANAGER_APPROVED"
			newHR = "WAITING_HR_DIRECTOR"
		case "REJECT":
			newHR = "HR_MANAGER_REJECTED"
			newOverall = "REJECTED"
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
			newHR = "HR_DIRECTOR_APPROVED"
			newOverall = "APPROVED"
		case "REJECT":
			newHR = "HR_DIRECTOR_REJECTED"
			newOverall = "REJECTED"
		case "RETURN":
			newHR = "RETURNED"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action"})
			return
		}
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// update request
	if _, err := tx.Exec(`
		UPDATE manpower_requests
		SET origin_status=$1, hr_status=$2, overall_status=$3, updated_at=NOW()
		WHERE request_id=$4
	`, newOrigin, newHR, newOverall, reqID); err != nil {
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

	c.JSON(http.StatusOK, gin.H{
		"message":         "decision stored",
		"request_id":      reqID,
		"doc_number":      docNo,
		"origin_status":   newOrigin,
		"hr_status":       newHR,
		"overall_status":  newOverall,
	})
}

package handlers

import (
	"fmt"
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/models"
	"mantest/backend/internal/services"
	"net/http"
	"strconv"
	"time"
	"database/sql"

	"github.com/gin-gonic/gin"
)

type ManpowerRequest struct {
	DocumentDate          string `json:"documentDate"`
	Department            string `json:"department"` // Name
	Section               string `json:"section"`    // Name
	EmploymentType        string `json:"employmentType"` // Name
	ContractType          string `json:"contractType"`   // Name
	RequestReason         string `json:"requestReason"`  // Name
	RequesterName         string `json:"requesterName"`
	PositionId            string `json:"positionId"`     // Code
	PositionRequire       string `json:"positionRequire"` // Name (position name)
	AgeFrom               string `json:"ageFrom"`
	AgeTo                 string `json:"ageTo"`
	Gender                string `json:"gender"`      // Name
	Nationality           string `json:"nationality"` // Name
	Experience            string `json:"experience"`  // Name
	EducationLevel        string `json:"educationLevel"` // Name
	SpecialQualifications string `json:"specialQualifications"`
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


func parseDate(dateStr string) (time.Time, error) {
	return time.Parse("02/01/2006", dateStr)
}

func lookupName(c *gin.Context, tableName, name string) (int, error) {
	id, err := services.GetIDByName(tableName, name)
	if err != nil {
		log.Printf("Lookup Error: Failed to find ID for %s '%s': %v", tableName, name, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid selection for %s: %s", tableName, name)})
		return 0, err
	}
	return id, nil
}

func CreateManpowerRequestHandler(c *gin.Context) {
	var req ManpowerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	employeeID := "E003" 
	docNumber := time.Now().Format("20060102-1") 
	
	deptID, err := lookupName(c, "department", req.Department)
	if err != nil { return }
	
	posID, err := lookupName(c, "position", req.PositionRequire)
	if err != nil { return }
	
	etID, err := lookupName(c, "employment_type", req.EmploymentType)
	if err != nil { return }
	
	ctID, err := lookupName(c, "contract_type", req.ContractType)
	if err != nil { return }

	rrID, err := lookupName(c, "request_reason", req.RequestReason)
	if err != nil { return }
	
	genderID, err := lookupName(c, "gender", req.Gender)
	if err != nil { return }

	natID, err := lookupName(c, "nationality", req.Nationality)
	if err != nil { return }

	expID, err := lookupName(c, "experience", req.Experience)
	if err != nil { return }

	eduID, err := lookupName(c, "education_level", req.EducationLevel)
	if err != nil { return }

	docDate, err := parseDate(req.DocumentDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Expected DD/MM/YYYY."})
		return
	}
    
    minAge, err := strconv.Atoi(req.AgeFrom)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid value for Age From: '%s'", req.AgeFrom)})
        return
    }

    maxAge, err := strconv.Atoi(req.AgeTo)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid value for Age To: '%s'", req.AgeTo)})
        return
    }

	query := `
		INSERT INTO manpower_requests (
			doc_number, employee_id, doc_date, requesting_dept_id, requesting_pos_id,
			employment_type_id, contract_type_id, reason_id, 
			required_position_code, required_position_name, min_age, max_age, 
			gender_id, nationality_id, experience_id, education_level_id, 
			special_qualifications
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING request_id
	`
	
	var newRequestID int
	err = database.DB.QueryRow(query,
		docNumber,
		employeeID,
		docDate,
		deptID, 
		posID, 
		etID,   
		ctID,   
		rrID,   
		req.PositionId, 
		req.PositionRequire, 
		minAge, 
		maxAge, 
		genderID, 
		natID,    
		expID,    
		eduID,    
		req.SpecialQualifications,
	).Scan(&newRequestID)

	if err != nil {
		log.Printf("SQL INSERT Error: %v", err)
		if err.Error() == "pq: duplicate key value violates unique constraint \"manpower_requests_doc_number_key\"" {
			c.JSON(http.StatusConflict, gin.H{"error": "Document number already exists. Please try again."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save manpower request to database."})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Manpower request received and saved successfully!",
		"id":      newRequestID,
	})
}
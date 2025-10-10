package handlers

import (
	"fmt"
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Placeholder for ManpowerRequest model (Ensure this matches the keys sent by Frontend)
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

// Helper function to parse DD/MM/YYYY to go time.Time
func parseDate(dateStr string) (time.Time, error) {
	return time.Parse("02/01/2006", dateStr)
}

// Helper function to convert lookup name to ID
func lookupName(c *gin.Context, tableName, name string) (int, error) {
	id, err := services.GetIDByName(tableName, name)
	if err != nil {
		// Log the error but send a user-friendly error response
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

	// 1. --- Input Validation and ID Lookup ---
	employeeID := "E003" // Assuming user@example.com is E003
	docNumber := time.Now().Format("20060102-1") // Mock doc number
	
	// Convert Names (from Frontend) to IDs (for DB)
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
    
    // --- START AGE CONVERSION FIX: Convert string to int ---
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
    // --- END AGE CONVERSION FIX ---

	// 2. --- Database INSERT ---
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
		deptID, // ID
		posID,  // ID
		etID,   // ID
		ctID,   // ID
		rrID,   // ID
		req.PositionId, // Code
		req.PositionRequire, // Name (for redundant storage in MR table)
		minAge, // CONVERTED INT
		maxAge, // CONVERTED INT
		genderID, // ID
		natID,    // ID
		expID,    // ID
		eduID,    // ID
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
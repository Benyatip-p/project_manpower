package handlers

import (
	"log"
	"mantest/backend/internal/models"
	"mantest/backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetMasterDataHandler(c *gin.Context) {
	tables := map[string]string{
		"departments":     "department",
		"positions":       "position",
		"sections":        "section",
		"employmentTypes": "employment_type",
		"contractTypes":   "contract_type",
		"requestReasons":  "request_reason",
		"genders":         "gender",
		"nationalities":   "nationality",
		"experiences":     "experience",
		"educationLevels": "education_level",
        "roles":           "role", 
	}

	data := make(map[string][]models.MasterDataItem)
	
	for jsonKey, dbTableName := range tables {
		items, err := services.GetMasterDataByType(dbTableName)
		if err != nil {
			log.Printf("Failed to fetch master data for %s: %v", dbTableName, err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch master data: " + dbTableName})
            return
		}
		data[jsonKey] = items
	}
	
    response := models.MasterDataResponse{
        Departments: data["departments"],
        Positions: data["positions"],
        Sections: data["sections"],
        EmploymentTypes: data["employmentTypes"],
        ContractTypes: data["contractTypes"],
        RequestReasons: data["requestReasons"],
        Genders: data["genders"],
        Nationalities: data["nationalities"],
        Experiences: data["experiences"],
        EducationLevels: data["educationLevels"],
        Roles: data["roles"],
    }


	c.JSON(http.StatusOK, response)
}
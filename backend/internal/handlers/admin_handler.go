// backend/internal/handlers/admin_handler.go
package handlers

import (
	"mantest/backend/internal/models"
	"mantest/backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetEmployeesHandler (Existing)
func GetEmployeesHandler(c *gin.Context) {
	employees, err := services.GetAllEmployees()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employee list"})
		return
	}
	c.JSON(http.StatusOK, employees)
}

// CreateEmployeeHandler (NEW)
func CreateEmployeeHandler(c *gin.Context) {
	var req models.NewEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	err := services.CreateNewEmployee(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Employee created successfully!",
	})
}
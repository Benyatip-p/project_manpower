package handlers

import (
	"mantest/backend/internal/models"
	"mantest/backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"log"
)

func GetEmployeesHandler(c *gin.Context) {
	// Get user context for logging
	role := c.GetString("role_name")
	deptID := c.GetInt("dept_id")
	employeeID := c.GetString("employee_id")

	log.Printf("GetEmployees request: employeeID=%s, role=%s, deptID=%d", employeeID, role, deptID)

	employees, err := services.GetAllEmployees()
	if err != nil {
		log.Printf("Error fetching employees: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employee list"})
		return
	}

	log.Printf("Returning %d employees for admin user", len(employees))
	c.JSON(http.StatusOK, employees)
}

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

func UpdateEmployeeHandler(c *gin.Context) {
	employeeID := c.Param("id")

	var req models.UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}

	err := services.UpdateEmployee(employeeID, &req)
	if err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Employee updated successfully!",
	})
}

func DeleteEmployeeHandler(c *gin.Context) {
	employeeID := c.Param("id")
	role := c.GetString("role_name")
	deptID := c.GetInt("dept_id")
	currentEmployeeID := c.GetString("employee_id")

	log.Printf("DeleteEmployee attempt: targetEmployeeID=%s, currentEmployeeID=%s, role=%s, deptID=%d",
		employeeID, currentEmployeeID, role, deptID)

	err := services.DeleteEmployee(employeeID)
	if err != nil {
		log.Printf("DeleteEmployee error for %s: %v", employeeID, err)
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Successfully deleted employee %s", employeeID)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Employee deleted successfully!",
	})
}

// GetNextEmployeeIDHandler ดึงรหัสพนักงานถัดไปที่จะถูกสร้าง
func GetNextEmployeeIDHandler(c *gin.Context) {
	nextID, err := services.GenerateEmployeeID()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate employee ID"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"next_employee_id": nextID,
	})
}

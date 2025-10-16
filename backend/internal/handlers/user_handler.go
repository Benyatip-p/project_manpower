package handlers

import (
	"mantest/backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetUserProfileHandler จัดการคำขอเพื่อดึงข้อมูลโปรไฟล์ผู้ใช้ตามอีเมลที่ระบุใน query parameter
func GetUserProfileHandler(c *gin.Context) {
	userEmail := c.Query("email")
	if userEmail == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email query parameter is required"})
		return
	}

	profile, err := services.GetUserProfileByEmail(userEmail)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, profile)
}
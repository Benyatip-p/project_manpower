package handlers

import (
	"mantest/backend/internal/models"
	"mantest/backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

// LoginHandler godoc
// @Summary      Login and get JWT token
// @Description  ตรวจสอบผู้ใช้และคืน JWT token (แนบใน Authorization: Bearer <token>)
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        body  body      models.LoginRequest  true  "email & password"
// @Success      200   {object}  models.AuthResponse
// @Failure      400   {object}  map[string]string
// @Failure      401   {object}  map[string]string
// @Router       /login [post]
func LoginHandler(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	token, roleName, email, err := services.Authenticate(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication Fail: Please check user or Password"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		Role:  roleName,
		Email: email,
	})
}

// ตรวจสอบผู้ใช้และคืน JWT token (แนบใน Authorization: Bearer <token>)
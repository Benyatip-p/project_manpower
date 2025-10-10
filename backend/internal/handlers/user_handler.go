package handlers

import (
	"mantest/backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetUserProfileHandler(c *gin.Context) {
	// In a real app, you would get the email from the JWT token after implementing middleware
	// For now, we'll get it from a query parameter for simplicity.
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
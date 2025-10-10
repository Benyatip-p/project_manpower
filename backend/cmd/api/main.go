package main

import (
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/handlers"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	database.InitDB()
	router := gin.Default()

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowCredentials = true
	config.AddAllowHeaders("Authorization")

	router.Use(cors.New(config))

	router.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API Server is running!")
	})

	api := router.Group("/api")
	{
		api.POST("/login", handlers.LoginHandler)
		api.GET("/user/profile", handlers.GetUserProfileHandler)
		api.POST("/request", handlers.CreateManpowerRequestHandler)
        
        api.GET("/masterdata", handlers.GetMasterDataHandler)
        
        admin := api.Group("/admin")
        {
            admin.GET("/employees", handlers.GetEmployeesHandler)
            admin.POST("/employees", handlers.CreateEmployeeHandler) 
        }
	}

	log.Println("Server is running on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
package main

// @title Manpower API
// @version 1.0
// @description This is a manpower management system API.
// @host localhost:8080
// @BasePath /api

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

// @tag.name Auth

// @tag.name Requests

// @tag.name Approvals

// @tag.name Dashboard

import (
	"log"
	"mantest/backend/internal/database"
	"mantest/backend/internal/handlers"
	"mantest/backend/internal/middlewares"
	"net/http"
	
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "mantest/backend/docs" 
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
	router.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	
	api := router.Group("/api")
	{
		api.POST("/login", handlers.LoginHandler)

		api.GET("/user/profile", handlers.GetUserProfileHandler)
		api.GET("/masterdata", handlers.GetMasterDataHandler)
		api.GET("/dashboard/overview", handlers.GetDashboardOverview)
		protected := api.Group("/")
		protected.Use(middlewares.JWTAuth())
		{
			// protected.GET("/user/profile", handlers.GetUserProfileHandler)
			// protected.GET("/masterdata", handlers.GetMasterDataHandler)

			user := protected.Group("/user")
			{
				user.GET("/requests", handlers.GetManpowerRequestsHandler)
				// user.POST("/requests", handlers.CreateManpowerRequestHandler)

				user.POST("/requests/submit", handlers.CreateAndSubmitManpowerRequestHandler)
				user.POST("/requests/:id/decide", handlers.DecideManpowerRequestHandler)
			}

			// approve := protected.Group("/approve")
			// {
			// 	approve.GET("/requests", handlers.GetManpowerRequestsHandler)
				// user.POST("/requests", handlers.CreateManpowerRequestHandler)
			// }

			admin := protected.Group("/admin")
			{
				admin.GET("/employees", handlers.GetEmployeesHandler)
				admin.POST("/employees", handlers.CreateEmployeeHandler) 
			}
		}
	}

	log.Println("Server is running on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
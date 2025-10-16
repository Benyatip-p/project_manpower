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

	_ "mantest/backend/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
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

		protected := api.Group("/")
		protected.Use(middlewares.JWTAuth())
		{
			// Dashboard (ต้องใช้ JWT)
			protected.GET("/dashboard/overview", handlers.GetDashboardOverview)

			user := protected.Group("/user")
			{
				user.GET("/requests", handlers.GetManpowerRequestsHandler)
				user.GET("/requests/:id", handlers.GetManpowerRequestByIDHandler)
				user.DELETE("/requests/:id", handlers.DeleteManpowerRequestHandler)

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
				admin.GET("/next-employee-id", handlers.GetNextEmployeeIDHandler)
				admin.POST("/employees", handlers.CreateEmployeeHandler)
				admin.PUT("/employees/:id", handlers.UpdateEmployeeHandler)
				admin.DELETE("/employees/:id", handlers.DeleteEmployeeHandler)
			}
		}
	}

	log.Println("Server is running on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

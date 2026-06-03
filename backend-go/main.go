package main

import (
	"log"
	"net/http"
	"os"

	"health-platform/database"
	"health-platform/handlers"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/rs/cors"
)

func main() {
	// Initialize database
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/health.db"
	}

	if err := database.InitDB(dbPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	log.Println("Database initialized successfully")

	// Create router
	r := chi.NewRouter()

	// Middleware
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)

	// CORS - allow all origins for development
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})
	r.Use(c.Handler)

	// Serve uploaded files
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Health data routes
		r.Route("/health", func(r chi.Router) {
			r.Get("/", handlers.ListHealthRecords)
			r.Post("/", handlers.CreateHealthRecord)
			r.Get("/trend", handlers.GetTrendData)
			r.Post("/sync", handlers.SyncHealthData)
		})

		// Pregnancy routes
		r.Route("/pregnancy", func(r chi.Router) {
			r.Get("/", handlers.GetPregnancyInfo)
			r.Put("/", handlers.UpdatePregnancyInfo)
			r.Get("/week/{week}", handlers.GetWeekInfoHandler)
			r.Get("/checkup-schedule", handlers.GetCheckupSchedule)
		})

		// Report routes
		r.Route("/report", func(r chi.Router) {
			r.Post("/upload", handlers.UploadReport)
			r.Get("/", handlers.ListReports)
			r.Get("/{id}", handlers.GetReport)
			r.Post("/{id}/reparse", handlers.ReparseReport)
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("Server starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

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

	log.Println("Database initialized successfully")

	// Create router
	r := chi.NewRouter()

	// Middleware
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)

	// CORS - read allowed origins from env, default to localhost dev origins
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:4173", "http://localhost:3000"}
	if envOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); envOrigins != "" {
		allowedOrigins = strings.Split(envOrigins, ",")
	}
	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})
	r.Use(c.Handler)

	// Serve uploaded files with Content-Disposition to prevent inline display
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Disposition", "attachment")
		http.FileServer(http.Dir("./uploads")).ServeHTTP(w, r)
	})))

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

	// Graceful shutdown
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	srv := &http.Server{Addr: ":" + port, Handler: r}

	go func() {
		log.Printf("Server starting on port %s...", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced shutdown: %v", err)
	}

	log.Println("Closing database...")
	database.CloseDB()
	log.Println("Server exited")
}

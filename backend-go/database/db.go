package database

import (
	"database/sql"
	"fmt"
	"math"
	"math/rand"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"

	"github.com/google/uuid"
)

var DB *sql.DB

func InitDB(dbPath string) error {
	// Ensure directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(5 * time.Minute)

	// Enable WAL mode and foreign keys
	if _, err := DB.Exec("PRAGMA journal_mode=WAL"); err != nil {
		return fmt.Errorf("failed to set WAL mode: %w", err)
	}
	if _, err := DB.Exec("PRAGMA foreign_keys=ON"); err != nil {
		return fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	// Create tables
	if err := createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	// Insert demo data
	if err := insertDemoData(); err != nil {
		return fmt.Errorf("failed to insert demo data: %w", err)
	}

	return nil
}

func createTables() error {
	ddl := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		phone TEXT,
		email TEXT,
		avatar TEXT,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE IF NOT EXISTS health_records (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id),
		type TEXT NOT NULL CHECK(type IN ('heart_rate', 'steps', 'sleep', 'blood_oxygen', 'weight', 'blood_pressure', 'blood_sugar', 'temperature')),
		value REAL NOT NULL,
		unit TEXT NOT NULL,
		recorded_at TEXT NOT NULL,
		source TEXT NOT NULL CHECK(source IN ('manual', 'apple_watch', 'iphone')),
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE IF NOT EXISTS pregnancy_info (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
		due_date TEXT NOT NULL,
		last_period_date TEXT NOT NULL,
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		updated_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE IF NOT EXISTS report_records (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL REFERENCES users(id),
		pregnancy_week INTEGER NOT NULL CHECK(pregnancy_week >= 1 AND pregnancy_week <= 42),
		report_type TEXT NOT NULL,
		image_url TEXT NOT NULL,
		ocr_result TEXT NOT NULL DEFAULT '[]',
		parsed_at TEXT,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE INDEX IF NOT EXISTS idx_health_records_user_type ON health_records(user_id, type);
	CREATE INDEX IF NOT EXISTS idx_health_records_recorded_at ON health_records(recorded_at);
	CREATE INDEX IF NOT EXISTS idx_report_records_user ON report_records(user_id);
	`
	_, err := DB.Exec(ddl)
	return err
}

func insertDemoData() error {
	// Insert demo user
	_, err := DB.Exec(`
		INSERT OR IGNORE INTO users (id, name, phone, email) VALUES ('demo-user-001', '准妈妈小美', '13800138000', 'demo@health.com')
	`)
	if err != nil {
		return err
	}

	// Insert pregnancy info
	_, err = DB.Exec(`
		INSERT OR IGNORE INTO pregnancy_info (id, user_id, due_date, last_period_date) VALUES ('preg-001', 'demo-user-001', '2026-12-15', '2026-03-10')
	`)
	if err != nil {
		return err
	}

	// Check if demo health records already exist
	var count int
	err = DB.QueryRow("SELECT COUNT(*) FROM health_records WHERE user_id = 'demo-user-001'").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	// Insert sample health records for the last 7 days
	type healthType struct {
		typeName string
		min      float64
		max      float64
		unit     string
	}

	healthTypes := []healthType{
		{"heart_rate", 65, 85, "bpm"},
		{"steps", 3000, 8000, "步"},
		{"sleep", 6, 9, "小时"},
		{"blood_oxygen", 95, 99, "%"},
		{"weight", 58, 62, "kg"},
		{"blood_pressure", 110, 130, "mmHg"},
		{"blood_sugar", 4.0, 6.5, "mmol/L"},
		{"temperature", 36.2, 36.8, "°C"},
	}

	sources := []string{"manual", "apple_watch", "iphone"}
	now := time.Now()

	tx, err := DB.Begin()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare(`
		INSERT INTO health_records (id, user_id, type, value, unit, recorded_at, source)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	for dayOffset := 6; dayOffset >= 0; dayOffset-- {
		date := now.AddDate(0, 0, -dayOffset)
		dateStr := date.Format("2006-01-02")

		for _, ht := range healthTypes {
			var value float64
			if ht.typeName == "blood_sugar" || ht.typeName == "temperature" {
				value = math.Round((ht.min+r.Float64()*(ht.max-ht.min))*10) / 10
			} else {
				value = math.Round(ht.min + r.Float64()*(ht.max-ht.min))
			}

			hour := r.Intn(14) + 7
			minute := r.Intn(60)
			recordedAt := fmt.Sprintf("%sT%02d:%02d:00", dateStr, hour, minute)

			id := uuid.New().String()
			source := sources[r.Intn(len(sources))]

			_, err := stmt.Exec(id, "demo-user-001", ht.typeName, value, ht.unit, recordedAt, source)
			if err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit()
}

// CloseDB closes the database connection
func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}

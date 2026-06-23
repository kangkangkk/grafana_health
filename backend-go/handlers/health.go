package handlers

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"health-platform/database"
	"health-platform/models"

	"github.com/google/uuid"
)

var validTypes = []string{"heart_rate", "steps", "sleep", "blood_oxygen", "weight", "blood_pressure", "blood_sugar", "temperature"}
var validSources = []string{"manual", "apple_watch", "iphone"}

var typeUnits = map[string]string{
	"heart_rate":     "bpm",
	"steps":          "步",
	"sleep":          "小时",
	"blood_oxygen":   "%",
	"weight":         "kg",
	"blood_pressure": "mmHg",
	"blood_sugar":    "mmol/L",
	"temperature":    "°C",
}

func isValidType(t string) bool {
	for _, vt := range validTypes {
		if vt == t {
			return true
		}
	}
	return false
}

func isValidSource(s string) bool {
	for _, vs := range validSources {
		if vs == s {
			return true
		}
	}
	return false
}

// ListHealthRecords handles GET /api/health
func ListHealthRecords(w http.ResponseWriter, r *http.Request) {
	userID := "demo-user-001"
	startDate := r.URL.Query().Get("startDate")
	endDate := r.URL.Query().Get("endDate")
	recordType := r.URL.Query().Get("type")

	query := "SELECT id, user_id, type, value, unit, recorded_at, source, created_at FROM health_records WHERE user_id = ?"
	args := []interface{}{userID}

	if startDate != "" {
		query += " AND recorded_at >= ?"
		args = append(args, startDate)
	}
	if endDate != "" {
		query += " AND recorded_at <= ?"
		args = append(args, endDate)
	}
	if recordType != "" {
		if !isValidType(recordType) {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid type. Valid types: %v", validTypes))
			return
		}
		query += " AND type = ?"
		args = append(args, recordType)
	}

	query += " ORDER BY recorded_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list health records")
		return
	}
	defer rows.Close()

	var records []models.HealthRecord
	for rows.Next() {
		var rec models.HealthRecord
		if err := rows.Scan(&rec.ID, &rec.UserID, &rec.Type, &rec.Value, &rec.Unit, &rec.RecordedAt, &rec.Source, &rec.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to scan health records")
			return
		}
		records = append(records, rec)
	}

	if records == nil {
		records = []models.HealthRecord{}
	}

	writeData(w, records)
}

// CreateHealthRecord handles POST /api/health
func CreateHealthRecord(w http.ResponseWriter, r *http.Request) {
	userID := "demo-user-001"

	var req models.HealthCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if !isValidType(req.Type) {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid type. Valid types: %v", validTypes))
		return
	}
	// Validate value range based on type
	if req.Value < 0 {
		writeError(w, http.StatusBadRequest, "Value cannot be negative")
		return
	}
	// Reasonable upper bounds per type
	maxValues := map[string]float64{
		"heart_rate": 250, "steps": 100000, "sleep": 24,
		"blood_oxygen": 100, "weight": 500, "blood_pressure": 300,
		"blood_sugar": 50, "temperature": 50,
	}
	if maxVal, ok := maxValues[req.Type]; ok && req.Value > maxVal {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Value %.2f exceeds maximum allowed %.2f for type %s", req.Value, maxVal, req.Type))
		return
	}
	if req.RecordedAt == "" {
		writeError(w, http.StatusBadRequest, "recordedAt is required")
		return
	}

	source := req.Source
	if !isValidSource(source) {
		source = "manual"
	}

	unit := req.Unit
	if unit == "" {
		unit = typeUnits[req.Type]
	}

	id := uuid.New().String()

	_, err := database.DB.Exec(`
		INSERT INTO health_records (id, user_id, type, value, unit, recorded_at, source)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, id, userID, req.Type, req.Value, unit, req.RecordedAt, source)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create health record")
		return
	}

	var rec models.HealthRecord
	err = database.DB.QueryRow(`
		SELECT id, user_id, type, value, unit, recorded_at, source, created_at
		FROM health_records WHERE id = ?
	`, id).Scan(&rec.ID, &rec.UserID, &rec.Type, &rec.Value, &rec.Unit, &rec.RecordedAt, &rec.Source, &rec.CreatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to retrieve created record")
		return
	}

	w.WriteHeader(http.StatusCreated)
	writeData(w, rec)
}

// GetTrendData handles GET /api/health/trend
func GetTrendData(w http.ResponseWriter, r *http.Request) {
	userID := "demo-user-001"
	recordType := r.URL.Query().Get("type")
	daysStr := r.URL.Query().Get("days")

	if !isValidType(recordType) {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("Invalid type. Valid types: %v", validTypes))
		return
	}

	days := 7
	if daysStr != "" {
		d, err := strconv.Atoi(daysStr)
		if err == nil && d >= 1 {
			days = d
		}
		if days > 90 {
			days = 90
		}
	}

	rows, err := database.DB.Query(`
		SELECT date(recorded_at) as date,
		       AVG(value) as avgValue,
		       MIN(value) as minValue,
		       MAX(value) as maxValue,
		       COUNT(*) as count
		FROM health_records
		WHERE user_id = ? AND type = ?
		  AND recorded_at >= datetime('now', '-' || ? || ' days')
		GROUP BY date(recorded_at)
		ORDER BY date ASC
	`, userID, recordType, days)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get trend data")
		return
	}
	defer rows.Close()

	var trends []models.TrendDataPoint
	for rows.Next() {
		var t models.TrendDataPoint
		if err := rows.Scan(&t.Date, &t.AvgValue, &t.MinValue, &t.MaxValue, &t.Count); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to scan trend data")
			return
		}
		trends = append(trends, t)
	}

	if trends == nil {
		trends = []models.TrendDataPoint{}
	}

	writeData(w, trends)
}

// SyncHealthData handles POST /api/health/sync
func SyncHealthData(w http.ResponseWriter, r *http.Request) {
	userID := "demo-user-001"
	now := time.Now()

	type syncType struct {
		typeName string
		min      float64
		max      float64
		unit     string
	}

	syncTypes := []syncType{
		{"heart_rate", 65, 85, "bpm"},
		{"steps", 3000, 8000, "步"},
		{"sleep", 6, 9, "小时"},
		{"blood_oxygen", 95, 99, "%"},
	}

	sources := []string{"apple_watch", "iphone"}
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	tx, err := database.DB.Begin()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to sync health data")
		return
	}

	stmt, err := tx.Prepare(`
		INSERT INTO health_records (id, user_id, type, value, unit, recorded_at, source)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		tx.Rollback()
		writeError(w, http.StatusInternalServerError, "Failed to sync health data")
		return
	}
	defer stmt.Close()

	insertedCount := 0

	for dayOffset := 6; dayOffset >= 0; dayOffset-- {
		date := now.AddDate(0, 0, -dayOffset)
		dateStr := date.Format("2006-01-02")

		for _, st := range syncTypes {
			var value float64
			if st.typeName == "sleep" {
				value = math.Round((st.min+rng.Float64()*(st.max-st.min))*10) / 10
			} else {
				value = math.Round(st.min + rng.Float64()*(st.max-st.min))
			}

			hour := rng.Intn(14) + 7
			minute := rng.Intn(60)
			recordedAt := fmt.Sprintf("%sT%02d:%02d:00", dateStr, hour, minute)

			id := uuid.New().String()
			source := sources[rng.Intn(len(sources))]

			_, err := stmt.Exec(id, userID, st.typeName, value, st.unit, recordedAt, source)
			if err != nil {
				tx.Rollback()
				writeError(w, http.StatusInternalServerError, "Failed to sync health data")
				return
			}
			insertedCount++
		}
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to sync health data")
		return
	}

	writeData(w, map[string]interface{}{
		"syncedRecords": insertedCount,
		"message":       "Apple设备数据同步成功",
	})
}

// Helper functions shared across handlers

func writeData(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"data": data})
}

func writeError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

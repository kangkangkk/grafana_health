package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"health-platform/data"
	"health-platform/database"
	"health-platform/models"

	"github.com/go-chi/chi/v5"
)

// GetPregnancyInfo handles GET /api/pregnancy
func GetPregnancyInfo(w http.ResponseWriter, r *http.Request) {
	userID := "demo-user-001"

	var info models.PregnancyInfo
	err := database.DB.QueryRow(`
		SELECT id, user_id, due_date, last_period_date, created_at, updated_at
		FROM pregnancy_info WHERE user_id = ?
	`, userID).Scan(&info.ID, &info.UserID, &info.DueDate, &info.LastPeriodDate, &info.CreatedAt, &info.UpdatedAt)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Pregnancy info not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get pregnancy info")
		return
	}

	// Calculate current week and day
	lastPeriodDate, err := time.Parse("2006-01-02", info.LastPeriodDate)
	if err == nil {
		diff := time.Since(lastPeriodDate)
		diffDays := int(diff.Hours() / 24)
		info.CurrentWeek = diffDays / 7
		info.CurrentDay = diffDays % 7
		if info.CurrentWeek < 1 {
			info.CurrentWeek = 1
		}
		if info.CurrentWeek > 40 {
			info.CurrentWeek = 40
		}
	}

	writeData(w, info)
}

// UpdatePregnancyInfo handles PUT /api/pregnancy
func UpdatePregnancyInfo(w http.ResponseWriter, r *http.Request) {
	userID := "demo-user-001"

	var req models.PregnancyUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.DueDate == "" && req.LastPeriodDate == "" {
		writeError(w, http.StatusBadRequest, "At least one of dueDate or lastPeriodDate is required")
		return
	}

	// Get existing
	var existing models.PregnancyInfo
	err := database.DB.QueryRow(`
		SELECT id, user_id, due_date, last_period_date, created_at, updated_at
		FROM pregnancy_info WHERE user_id = ?
	`, userID).Scan(&existing.ID, &existing.UserID, &existing.DueDate, &existing.LastPeriodDate, &existing.CreatedAt, &existing.UpdatedAt)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Pregnancy info not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get pregnancy info")
		return
	}

	newDueDate := req.DueDate
	if newDueDate == "" {
		newDueDate = existing.DueDate
	}
	newLastPeriodDate := req.LastPeriodDate
	if newLastPeriodDate == "" {
		newLastPeriodDate = existing.LastPeriodDate
	}

	_, err = database.DB.Exec(`
		UPDATE pregnancy_info SET due_date = ?, last_period_date = ?, updated_at = datetime('now') WHERE user_id = ?
	`, newDueDate, newLastPeriodDate, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update pregnancy info")
		return
	}

	// Get updated
	var info models.PregnancyInfo
	err = database.DB.QueryRow(`
		SELECT id, user_id, due_date, last_period_date, created_at, updated_at
		FROM pregnancy_info WHERE user_id = ?
	`, userID).Scan(&info.ID, &info.UserID, &info.DueDate, &info.LastPeriodDate, &info.CreatedAt, &info.UpdatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get updated pregnancy info")
		return
	}

	// Calculate current week
	lpd, err := time.Parse("2006-01-02", newLastPeriodDate)
	if err == nil {
		diff := time.Since(lpd)
		diffDays := int(diff.Hours() / 24)
		info.CurrentWeek = diffDays / 7
		info.CurrentDay = diffDays % 7
		if info.CurrentWeek < 1 {
			info.CurrentWeek = 1
		}
		if info.CurrentWeek > 40 {
			info.CurrentWeek = 40
		}
	}

	writeData(w, info)
}

// GetWeekInfoHandler handles GET /api/pregnancy/week/{week}
func GetWeekInfoHandler(w http.ResponseWriter, r *http.Request) {
	weekStr := chi.URLParam(r, "week")
	week, err := strconv.Atoi(weekStr)
	if err != nil || week < 1 || week > 40 {
		writeError(w, http.StatusBadRequest, "Week must be between 1 and 40")
		return
	}

	weekInfo := data.GetWeekInfo(week)
	if weekInfo == nil {
		writeError(w, http.StatusNotFound, fmt.Sprintf("Week %d data not found", week))
		return
	}

	writeData(w, weekInfo)
}

// GetCheckupSchedule handles GET /api/pregnancy/checkup-schedule
func GetCheckupSchedule(w http.ResponseWriter, r *http.Request) {
	userID := "demo-user-001"

	var lastPeriodDateStr string
	err := database.DB.QueryRow(`
		SELECT last_period_date FROM pregnancy_info WHERE user_id = ?
	`, userID).Scan(&lastPeriodDateStr)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Pregnancy info not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get pregnancy info")
		return
	}

	lastPeriodDate, err := time.Parse("2006-01-02", lastPeriodDateStr)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Invalid last period date")
		return
	}

	schedule := data.GetCheckupSchedule()

	type checkupWithDate struct {
		models.CheckupItem
		Date string `json:"date"`
	}

	var result []checkupWithDate
	for _, item := range schedule {
		checkupDate := lastPeriodDate.AddDate(0, 0, item.Week*7)
		result = append(result, checkupWithDate{
			CheckupItem: item,
			Date:        checkupDate.Format("2006-01-02"),
		})
	}

	writeData(w, result)
}

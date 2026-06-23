package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"health-platform/database"
	"health-platform/models"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

const uploadsDir = "./uploads"
const maxUploadSize = 10 << 20 // 10MB

var allowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
}

// simulateOcrParsing generates mock medical report items based on pregnancy week
func simulateOcrParsing(pregnancyWeek int) []models.OcrItem {
	rng := rand.New(rand.NewSource(int64(pregnancyWeek) * 1000))
	var items []models.OcrItem

	// Blood routine
	items = append(items, models.OcrItem{
		Name:           "血红蛋白",
		Value:          fmt.Sprintf("%.1f", 110+rng.Float64()*30),
		Unit:           "g/L",
		ReferenceRange: "110-150 g/L",
		IsAbnormal:     rng.Float64() > 0.8,
		Interpretation: "正常",
	})
	items = append(items, models.OcrItem{
		Name:           "白细胞计数",
		Value:          fmt.Sprintf("%.1f", 5+rng.Float64()*8),
		Unit:           "×10⁹/L",
		ReferenceRange: "4-10 ×10⁹/L",
		IsAbnormal:     rng.Float64() > 0.85,
		Interpretation: "正常",
	})
	items = append(items, models.OcrItem{
		Name:           "血小板计数",
		Value:          fmt.Sprintf("%.0f", 150+rng.Float64()*100),
		Unit:           "×10⁹/L",
		ReferenceRange: "100-300 ×10⁹/L",
		IsAbnormal:     false,
		Interpretation: "正常",
	})

	// Urine routine
	items = append(items, models.OcrItem{
		Name:           "尿蛋白",
		Value:          func() string { if rng.Float64() > 0.8 { return "±" }; return "-" }(),
		Unit:           "",
		ReferenceRange: "阴性",
		IsAbnormal:     rng.Float64() > 0.8,
		Interpretation: "正常",
	})

	// Blood sugar
	items = append(items, models.OcrItem{
		Name:           "空腹血糖",
		Value:          fmt.Sprintf("%.1f", 4.0+rng.Float64()*2.5),
		Unit:           "mmol/L",
		ReferenceRange: "3.9-6.1 mmol/L",
		IsAbnormal:     rng.Float64() > 0.8,
		Interpretation: "正常",
	})

	// Blood pressure
	items = append(items, models.OcrItem{
		Name:           "收缩压",
		Value:          fmt.Sprintf("%.0f", 110+rng.Float64()*20),
		Unit:           "mmHg",
		ReferenceRange: "90-140 mmHg",
		IsAbnormal:     false,
		Interpretation: "正常",
	})
	items = append(items, models.OcrItem{
		Name:           "舒张压",
		Value:          fmt.Sprintf("%.0f", 65+rng.Float64()*15),
		Unit:           "mmHg",
		ReferenceRange: "60-90 mmHg",
		IsAbnormal:     false,
		Interpretation: "正常",
	})

	// Week-specific items
	if pregnancyWeek >= 12 && pregnancyWeek <= 20 {
		items = append(items, models.OcrItem{
			Name:           "NT值",
			Value:          fmt.Sprintf("%.2f", 1.5+rng.Float64()*1.5),
			Unit:           "mm",
			ReferenceRange: "<2.5 mm",
			IsAbnormal:     rng.Float64() > 0.9,
			Interpretation: "正常",
		})
	}

	if pregnancyWeek >= 15 && pregnancyWeek <= 20 {
		items = append(items, models.OcrItem{
			Name:           "AFP",
			Value:          fmt.Sprintf("%.1f", 20+rng.Float64()*40),
			Unit:           "MoM",
			ReferenceRange: "0.5-2.0 MoM",
			IsAbnormal:     false,
			Interpretation: "正常",
		})
		items = append(items, models.OcrItem{
			Name:           "Free β-hCG",
			Value:          fmt.Sprintf("%.2f", 0.5+rng.Float64()*2.5),
			Unit:           "MoM",
			ReferenceRange: "0.5-2.0 MoM",
			IsAbnormal:     rng.Float64() > 0.85,
			Interpretation: "正常",
		})
	}

	if pregnancyWeek >= 24 && pregnancyWeek <= 28 {
		items = append(items, models.OcrItem{
			Name:           "餐后1小时血糖",
			Value:          fmt.Sprintf("%.1f", 6.0+rng.Float64()*4),
			Unit:           "mmol/L",
			ReferenceRange: "<10.0 mmol/L",
			IsAbnormal:     rng.Float64() > 0.8,
			Interpretation: "正常",
		})
		items = append(items, models.OcrItem{
			Name:           "餐后2小时血糖",
			Value:          fmt.Sprintf("%.1f", 5.0+rng.Float64()*4),
			Unit:           "mmol/L",
			ReferenceRange: "<8.5 mmol/L",
			IsAbnormal:     rng.Float64() > 0.8,
			Interpretation: "正常",
		})
	}

	if pregnancyWeek >= 28 {
		items = append(items, models.OcrItem{
			Name:           "总蛋白",
			Value:          fmt.Sprintf("%.1f", 55+rng.Float64()*20),
			Unit:           "g/L",
			ReferenceRange: "60-80 g/L",
			IsAbnormal:     rng.Float64() > 0.7,
			Interpretation: "正常",
		})
		items = append(items, models.OcrItem{
			Name:           "白蛋白",
			Value:          fmt.Sprintf("%.1f", 30+rng.Float64()*15),
			Unit:           "g/L",
			ReferenceRange: "35-50 g/L",
			IsAbnormal:     rng.Float64() > 0.7,
			Interpretation: "正常",
		})
	}

	// Mark abnormal items
	for i := range items {
		if items[i].IsAbnormal {
			items[i].Interpretation = "偏高"
		}
	}

	return items
}

// UploadReport handles POST /api/report/upload
func UploadReport(w http.ResponseWriter, r *http.Request) {
	// Limit request size
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeError(w, http.StatusBadRequest, "File too large or invalid form data")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		writeError(w, http.StatusBadRequest, "No image file uploaded")
		return
	}
	defer file.Close()

	// Read first 512 bytes to detect real content type
	headBytes := make([]byte, 512)
	n, err := io.ReadFull(file, headBytes)
	if err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		writeError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}
	detectedType := http.DetectContentType(headBytes[:n])
	if !allowedImageTypes[detectedType] {
		writeError(w, http.StatusBadRequest, "Only image files are allowed (detected: "+detectedType+")")
		return
	}

	// Seek back to start for copying
	if seeker, ok := file.(io.Seeker); ok {
		seeker.Seek(0, io.SeekStart)
	}

	// Ensure uploads directory exists
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create uploads directory")
		return
	}

	// Save file
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".png"
	}
	filename := uuid.New().String() + ext
	filePath := filepath.Join(uploadsDir, filename)

	dst, err := os.Create(filePath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	// Get form values
	pregnancyWeekStr := r.FormValue("pregnancyWeek")
	reportType := r.FormValue("reportType")

	week := 20
	if pregnancyWeekStr != "" {
		parsedWeek, err := strconv.Atoi(pregnancyWeekStr)
		if err != nil || parsedWeek < 1 || parsedWeek > 42 {
			writeError(w, http.StatusBadRequest, "pregnancyWeek must be between 1 and 42")
			return
		}
		week = parsedWeek
	}

	if reportType == "" {
		reportType = "常规产检报告"
	}

	userID := "demo-user-001"
	id := uuid.New().String()
	imageURL := "/uploads/" + filename
	ocrResult := simulateOcrParsing(week)
	ocrJSON, _ := json.Marshal(ocrResult)

	_, err = database.DB.Exec(`
		INSERT INTO report_records (id, user_id, pregnancy_week, report_type, image_url, ocr_result, parsed_at)
		VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
	`, id, userID, week, reportType, imageURL, string(ocrJSON))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to save report record")
		return
	}

	// Retrieve the record
	var rec models.ReportRecord
	var ocrResultStr string
	err = database.DB.QueryRow(`
		SELECT id, user_id, pregnancy_week, report_type, image_url, ocr_result, parsed_at, created_at
		FROM report_records WHERE id = ?
	`, id).Scan(&rec.ID, &rec.UserID, &rec.PregnancyWeek, &rec.ReportType, &rec.ImageURL, &ocrResultStr, &rec.ParsedAt, &rec.CreatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to retrieve uploaded report")
		return
	}

	json.Unmarshal([]byte(ocrResultStr), &rec.OcrResult)

	w.WriteHeader(http.StatusCreated)
	writeData(w, rec)
}

// ListReports handles GET /api/report
func ListReports(w http.ResponseWriter, r *http.Request) {
	userID := "demo-user-001"

	rows, err := database.DB.Query(`
		SELECT id, user_id, pregnancy_week, report_type, image_url, ocr_result, parsed_at, created_at
		FROM report_records WHERE user_id = ? ORDER BY created_at DESC
	`, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list reports")
		return
	}
	defer rows.Close()

	var records []models.ReportRecord
	for rows.Next() {
		var rec models.ReportRecord
		var ocrResultStr string
		if err := rows.Scan(&rec.ID, &rec.UserID, &rec.PregnancyWeek, &rec.ReportType, &rec.ImageURL, &ocrResultStr, &rec.ParsedAt, &rec.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to scan report records")
			return
		}
		json.Unmarshal([]byte(ocrResultStr), &rec.OcrResult)
		if rec.OcrResult == nil {
			rec.OcrResult = []models.OcrItem{}
		}
		records = append(records, rec)
	}

	if records == nil {
		records = []models.ReportRecord{}
	}

	writeData(w, records)
}

// GetReport handles GET /api/report/{id}
func GetReport(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var rec models.ReportRecord
	var ocrResultStr string
	err := database.DB.QueryRow(`
		SELECT id, user_id, pregnancy_week, report_type, image_url, ocr_result, parsed_at, created_at
		FROM report_records WHERE id = ?
	`, id).Scan(&rec.ID, &rec.UserID, &rec.PregnancyWeek, &rec.ReportType, &rec.ImageURL, &ocrResultStr, &rec.ParsedAt, &rec.CreatedAt)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Report not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get report")
		return
	}

	json.Unmarshal([]byte(ocrResultStr), &rec.OcrResult)
	if rec.OcrResult == nil {
		rec.OcrResult = []models.OcrItem{}
	}

	writeData(w, rec)
}

// ReparseReport handles POST /api/report/{id}/reparse
func ReparseReport(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// Get existing record
	var pregnancyWeek int
	err := database.DB.QueryRow(`
		SELECT pregnancy_week FROM report_records WHERE id = ?
	`, id).Scan(&pregnancyWeek)
	if err == sql.ErrNoRows {
		writeError(w, http.StatusNotFound, "Report not found")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get report")
		return
	}

	// Generate new OCR result
	ocrResult := simulateOcrParsing(pregnancyWeek)
	ocrJSON, _ := json.Marshal(ocrResult)

	_, err = database.DB.Exec(`
		UPDATE report_records SET ocr_result = ?, parsed_at = datetime('now') WHERE id = ?
	`, string(ocrJSON), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to reparse report")
		return
	}

	// Get updated record
	var rec models.ReportRecord
	var ocrResultStr string
	err = database.DB.QueryRow(`
		SELECT id, user_id, pregnancy_week, report_type, image_url, ocr_result, parsed_at, created_at
		FROM report_records WHERE id = ?
	`, id).Scan(&rec.ID, &rec.UserID, &rec.PregnancyWeek, &rec.ReportType, &rec.ImageURL, &ocrResultStr, &rec.ParsedAt, &rec.CreatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to retrieve reparsed report")
		return
	}

	json.Unmarshal([]byte(ocrResultStr), &rec.OcrResult)
	if rec.OcrResult == nil {
		rec.OcrResult = []models.OcrItem{}
	}

	writeData(w, rec)
}

// init ensures uploads directory exists
func init() {
	os.MkdirAll(uploadsDir, 0755)
}



package models

type User struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	Avatar    string `json:"avatar"`
	CreatedAt string `json:"created_at"`
}

type HealthRecord struct {
	ID         string  `json:"id"`
	UserID     string  `json:"user_id"`
	Type       string  `json:"type"`
	Value      float64 `json:"value"`
	Unit       string  `json:"unit"`
	RecordedAt string  `json:"recorded_at"`
	Source     string  `json:"source"`
	CreatedAt  string  `json:"created_at"`
}

type PregnancyInfo struct {
	ID             string `json:"id"`
	UserID         string `json:"user_id"`
	DueDate        string `json:"due_date"`
	LastPeriodDate string `json:"last_period_date"`
	CurrentWeek    int    `json:"current_week"`
	CurrentDay     int    `json:"current_day"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
}

type WeekInfo struct {
	Week           int      `json:"week"`
	BabySize       string   `json:"babySize"`
	BabySizeCn     string   `json:"babySizeCn"`
	BabyWeight     string   `json:"babyWeight"`
	BabyLength     string   `json:"babyLength"`
	Developments   []string `json:"developments"`
	MotherChanges  []string `json:"motherChanges"`
	DietAdvice     []string `json:"dietAdvice"`
	ExerciseAdvice []string `json:"exerciseAdvice"`
	Warnings       []string `json:"warnings"`
	CheckupItems   []string `json:"checkupItems"`
}

type OcrItem struct {
	Name           string `json:"name"`
	Value          string `json:"value"`
	Unit           string `json:"unit"`
	ReferenceRange string `json:"referenceRange"`
	IsAbnormal     bool   `json:"isAbnormal"`
	Interpretation string `json:"interpretation"`
}

type ReportRecord struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	PregnancyWeek int       `json:"pregnancy_week"`
	ReportType    string    `json:"report_type"`
	ImageURL      string    `json:"image_url"`
	OcrResult     []OcrItem `json:"ocr_result"`
	ParsedAt      string    `json:"parsed_at"`
	CreatedAt     string    `json:"created_at"`
}

type CheckupItem struct {
	Week        int    `json:"week"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IsRequired  bool   `json:"isRequired"`
}

type TrendDataPoint struct {
	Date      string  `json:"date"`
	AvgValue  float64 `json:"avgValue"`
	MinValue  float64 `json:"minValue"`
	MaxValue  float64 `json:"maxValue"`
	Count     int     `json:"count"`
}

type SyncRequest struct {
	DeviceType string   `json:"deviceType"`
	DataType   []string `json:"dataType"`
}

type PregnancyUpdateRequest struct {
	DueDate        string `json:"dueDate"`
	LastPeriodDate string `json:"lastPeriodDate"`
}

type HealthCreateRequest struct {
	Type       string  `json:"type"`
	Value      float64 `json:"value"`
	Unit       string  `json:"unit"`
	RecordedAt string  `json:"recordedAt"`
	Source     string  `json:"source"`
}

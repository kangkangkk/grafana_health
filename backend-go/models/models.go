package models

type User struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	Avatar    string `json:"avatar"`
	CreatedAt string `json:"createdAt"`
}

type HealthRecord struct {
	ID         string  `json:"id"`
	UserID     string  `json:"userId"`
	Type       string  `json:"type"`
	Value      float64 `json:"value"`
	Unit       string  `json:"unit"`
	RecordedAt string  `json:"recordedAt"`
	Source     string  `json:"source"`
	CreatedAt  string  `json:"createdAt"`
}

type PregnancyInfo struct {
	ID             string `json:"id"`
	UserID         string `json:"userId"`
	DueDate        string `json:"dueDate"`
	LastPeriodDate string `json:"lastPeriodDate"`
	CurrentWeek    int    `json:"currentWeek"`
	CurrentDay     int    `json:"currentDay"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
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
	UserID        string    `json:"userId"`
	PregnancyWeek int       `json:"pregnancyWeek"`
	ReportType    string    `json:"reportType"`
	ImageURL      string    `json:"imageUrl"`
	OcrResult     []OcrItem `json:"ocrResult"`
	ParsedAt      string    `json:"parsedAt"`
	CreatedAt     string    `json:"createdAt"`
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

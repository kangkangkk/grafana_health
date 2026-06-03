import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'data', 'health.db')

const db = new Database(dbPath)

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Create tables
db.exec(`
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
`)

// Insert demo user
db.exec(`
  INSERT OR IGNORE INTO users (id, name, phone, email) VALUES ('demo-user-001', '准妈妈小美', '13800138000', 'demo@health.com');
  INSERT OR IGNORE INTO pregnancy_info (id, user_id, due_date, last_period_date) VALUES ('preg-001', 'demo-user-001', '2026-12-15', '2026-03-10');
`)

// Insert sample health records for the last 7 days
const insertHealthRecord = db.prepare(`
  INSERT OR IGNORE INTO health_records (id, user_id, type, value, unit, recorded_at, source)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const now = new Date()
const healthTypes = [
  { type: 'heart_rate', min: 65, max: 85, unit: 'bpm' },
  { type: 'steps', min: 3000, max: 8000, unit: '步' },
  { type: 'sleep', min: 6, max: 9, unit: '小时' },
  { type: 'blood_oxygen', min: 95, max: 99, unit: '%' },
  { type: 'weight', min: 58, max: 62, unit: 'kg' },
  { type: 'blood_pressure', min: 110, max: 130, unit: 'mmHg' },
  { type: 'blood_sugar', min: 4.0, max: 6.5, unit: 'mmol/L' },
  { type: 'temperature', min: 36.2, max: 36.8, unit: '°C' },
]

const sources: ('manual' | 'apple_watch' | 'iphone')[] = ['manual', 'apple_watch', 'iphone']

// Check if demo health records already exist
const existingRecords = db.prepare("SELECT COUNT(*) as count FROM health_records WHERE user_id = 'demo-user-001'").get() as { count: number }

if (existingRecords.count === 0) {
  const insertMany = db.transaction(() => {
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(now)
      date.setDate(date.getDate() - dayOffset)
      const dateStr = date.toISOString().split('T')[0]

      for (const ht of healthTypes) {
        const value = ht.type === 'blood_sugar' || ht.type === 'temperature'
          ? Math.round((ht.min + Math.random() * (ht.max - ht.min)) * 10) / 10
          : Math.round(ht.min + Math.random() * (ht.max - ht.min))

        const hour = Math.floor(Math.random() * 14) + 7 // 7-21点
        const minute = Math.floor(Math.random() * 60)
        const recordedAt = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

        insertHealthRecord.run(
          uuidv4(),
          'demo-user-001',
          ht.type,
          value,
          ht.unit,
          recordedAt,
          sources[Math.floor(Math.random() * sources.length)]
        )
      }
    }
  })
  insertMany()
}

export default db

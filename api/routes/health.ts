import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const router = Router()

const VALID_TYPES = ['heart_rate', 'steps', 'sleep', 'blood_oxygen', 'weight', 'blood_pressure', 'blood_sugar', 'temperature'] as const
const VALID_SOURCES = ['manual', 'apple_watch', 'iphone'] as const

const TYPE_UNITS: Record<string, string> = {
  heart_rate: 'bpm',
  steps: '步',
  sleep: '小时',
  blood_oxygen: '%',
  weight: 'kg',
  blood_pressure: 'mmHg',
  blood_sugar: 'mmol/L',
  temperature: '°C',
}

/**
 * GET /api/health - List health records
 * Query params: startDate, endDate, type
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const { startDate, endDate, type } = req.query
    const userId = 'demo-user-001'

    let sql = 'SELECT * FROM health_records WHERE user_id = ?'
    const params: unknown[] = [userId]

    if (startDate) {
      sql += ' AND recorded_at >= ?'
      params.push(String(startDate))
    }
    if (endDate) {
      sql += ' AND recorded_at <= ?'
      params.push(String(endDate))
    }
    if (type) {
      if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
        res.status(400).json({ error: `Invalid type. Valid types: ${VALID_TYPES.join(', ')}` })
        return
      }
      sql += ' AND type = ?'
      params.push(String(type))
    }

    sql += ' ORDER BY recorded_at DESC'

    const records = db.prepare(sql).all(...params)
    res.json({ data: records })
  } catch (error) {
    console.error('Error listing health records:', error)
    res.status(500).json({ error: 'Failed to list health records' })
  }
})

/**
 * POST /api/health - Create health record
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const { type, value, unit, recordedAt, source } = req.body
    const userId = 'demo-user-001'

    if (!type || !VALID_TYPES.includes(type)) {
      res.status(400).json({ error: `Invalid type. Valid types: ${VALID_TYPES.join(', ')}` })
      return
    }
    if (value === undefined || value === null || typeof value !== 'number') {
      res.status(400).json({ error: 'Value must be a number' })
      return
    }
    if (!recordedAt) {
      res.status(400).json({ error: 'recordedAt is required' })
      return
    }

    const recordSource = source && VALID_SOURCES.includes(source) ? source : 'manual'
    const recordUnit = unit || TYPE_UNITS[type] || ''
    const id = uuidv4()

    db.prepare(`
      INSERT INTO health_records (id, user_id, type, value, unit, recorded_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, type, value, recordUnit, recordedAt, recordSource)

    const record = db.prepare('SELECT * FROM health_records WHERE id = ?').get(id)
    res.status(201).json({ data: record })
  } catch (error) {
    console.error('Error creating health record:', error)
    res.status(500).json({ error: 'Failed to create health record' })
  }
})

/**
 * GET /api/health/trend - Get trend data
 * Query params: type, days
 */
router.get('/trend', (req: Request, res: Response): void => {
  try {
    const { type, days } = req.query
    const userId = 'demo-user-001'

    if (!type || !VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      res.status(400).json({ error: `Invalid type. Valid types: ${VALID_TYPES.join(', ')}` })
      return
    }

    const numDays = days ? Math.min(Math.max(parseInt(String(days), 10), 1), 90) : 7

    const records = db.prepare(`
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
    `).all(userId, String(type), numDays)

    res.json({ data: records })
  } catch (error) {
    console.error('Error getting trend data:', error)
    res.status(500).json({ error: 'Failed to get trend data' })
  }
})

/**
 * POST /api/health/sync - Simulate Apple device sync
 * Generate 7 days of random health data for heart_rate, steps, sleep, blood_oxygen
 */
router.post('/sync', (req: Request, res: Response): void => {
  try {
    const userId = 'demo-user-001'
    const now = new Date()

    const syncTypes = [
      { type: 'heart_rate', min: 65, max: 85, unit: 'bpm' },
      { type: 'steps', min: 3000, max: 8000, unit: '步' },
      { type: 'sleep', min: 6, max: 9, unit: '小时' },
      { type: 'blood_oxygen', min: 95, max: 99, unit: '%' },
    ]

    const sources: ('apple_watch' | 'iphone')[] = ['apple_watch', 'iphone']
    const insertStmt = db.prepare(`
      INSERT INTO health_records (id, user_id, type, value, unit, recorded_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertedIds: string[] = []

    const insertMany = db.transaction(() => {
      for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const date = new Date(now)
        date.setDate(date.getDate() - dayOffset)
        const dateStr = date.toISOString().split('T')[0]

        for (const st of syncTypes) {
          const value = st.type === 'sleep'
            ? Math.round((st.min + Math.random() * (st.max - st.min)) * 10) / 10
            : Math.round(st.min + Math.random() * (st.max - st.min))

          const hour = Math.floor(Math.random() * 14) + 7
          const minute = Math.floor(Math.random() * 60)
          const recordedAt = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`

          const id = uuidv4()
          const source = sources[Math.floor(Math.random() * sources.length)]

          insertStmt.run(id, userId, st.type, value, st.unit, recordedAt, source)
          insertedIds.push(id)
        }
      }
    })

    insertMany()

    res.json({ data: { syncedRecords: insertedIds.length, message: 'Apple设备数据同步成功' } })
  } catch (error) {
    console.error('Error syncing health data:', error)
    res.status(500).json({ error: 'Failed to sync health data' })
  }
})

export default router

import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

const router = Router()

/**
 * Simulate OCR parsing based on pregnancy week
 */
function simulateOcrParsing(pregnancyWeek: number): Array<{ item: string; value: string; reference: string; status: 'normal' | 'high' | 'low' }> {
  const items: Array<{ item: string; value: string; reference: string; status: 'normal' | 'high' | 'low' }> = []

  // Blood routine
  items.push({
    item: '血红蛋白',
    value: (110 + Math.random() * 30).toFixed(1),
    reference: '110-150 g/L',
    status: Math.random() > 0.2 ? 'normal' : 'low',
  })
  items.push({
    item: '白细胞计数',
    value: (5 + Math.random() * 8).toFixed(1),
    reference: '4-10 ×10⁹/L',
    status: Math.random() > 0.15 ? 'normal' : 'high',
  })
  items.push({
    item: '血小板计数',
    value: (150 + Math.random() * 100).toFixed(0),
    reference: '100-300 ×10⁹/L',
    status: 'normal',
  })

  // Urine routine
  items.push({
    item: '尿蛋白',
    value: Math.random() > 0.8 ? '±' : '-',
    reference: '阴性',
    status: Math.random() > 0.8 ? 'high' : 'normal',
  })

  // Blood sugar
  items.push({
    item: '空腹血糖',
    value: (4.0 + Math.random() * 2.5).toFixed(1),
    reference: '3.9-6.1 mmol/L',
    status: Math.random() > 0.2 ? 'normal' : 'high',
  })

  // Blood pressure
  items.push({
    item: '收缩压',
    value: (110 + Math.random() * 20).toFixed(0),
    reference: '90-140 mmHg',
    status: 'normal',
  })
  items.push({
    item: '舒张压',
    value: (65 + Math.random() * 15).toFixed(0),
    reference: '60-90 mmHg',
    status: 'normal',
  })

  // Week-specific items
  if (pregnancyWeek >= 12 && pregnancyWeek <= 20) {
    items.push({
      item: 'NT值',
      value: (1.5 + Math.random() * 1.5).toFixed(2),
      reference: '<2.5 mm',
      status: Math.random() > 0.1 ? 'normal' : 'high',
    })
  }

  if (pregnancyWeek >= 15 && pregnancyWeek <= 20) {
    items.push({
      item: 'AFP',
      value: (20 + Math.random() * 40).toFixed(1),
      reference: '0.5-2.0 MoM',
      status: 'normal',
    })
    items.push({
      item: 'Free β-hCG',
      value: (0.5 + Math.random() * 2.5).toFixed(2),
      reference: '0.5-2.0 MoM',
      status: Math.random() > 0.15 ? 'normal' : 'high',
    })
  }

  if (pregnancyWeek >= 24 && pregnancyWeek <= 28) {
    items.push({
      item: '餐后1小时血糖',
      value: (6.0 + Math.random() * 4).toFixed(1),
      reference: '<10.0 mmol/L',
      status: Math.random() > 0.2 ? 'normal' : 'high',
    })
    items.push({
      item: '餐后2小时血糖',
      value: (5.0 + Math.random() * 4).toFixed(1),
      reference: '<8.5 mmol/L',
      status: Math.random() > 0.2 ? 'normal' : 'high',
    })
  }

  if (pregnancyWeek >= 28) {
    items.push({
      item: '总蛋白',
      value: (55 + Math.random() * 20).toFixed(1),
      reference: '60-80 g/L',
      status: Math.random() > 0.3 ? 'normal' : 'low',
    })
    items.push({
      item: '白蛋白',
      value: (30 + Math.random() * 15).toFixed(1),
      reference: '35-50 g/L',
      status: Math.random() > 0.3 ? 'normal' : 'low',
    })
  }

  return items
}

/**
 * POST /api/report/upload - Upload report image and simulate OCR parsing
 */
router.post('/upload', upload.single('image'), (req: Request, res: Response): void => {
  try {
    const file = req.file
    const { pregnancyWeek, reportType } = req.body

    if (!file) {
      res.status(400).json({ error: 'No image file uploaded' })
      return
    }

    const week = pregnancyWeek ? parseInt(pregnancyWeek, 10) : 20
    if (isNaN(week) || week < 1 || week > 42) {
      res.status(400).json({ error: 'pregnancyWeek must be between 1 and 42' })
      return
    }

    const userId = 'demo-user-001'
    const id = uuidv4()
    const imageUrl = `/uploads/${file.filename}`
    const type = reportType || '常规产检报告'
    const ocrResult = JSON.stringify(simulateOcrParsing(week))

    db.prepare(`
      INSERT INTO report_records (id, user_id, pregnancy_week, report_type, image_url, ocr_result, parsed_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(id, userId, week, type, imageUrl, ocrResult)

    const record = db.prepare('SELECT * FROM report_records WHERE id = ?').get(id) as Record<string, any> | undefined
    if (!record) {
      res.status(500).json({ error: 'Failed to retrieve uploaded report' })
      return
    }
    const parsedRecord = {
      ...record,
      ocr_result: JSON.parse(record.ocr_result),
    }

    res.status(201).json({ data: parsedRecord })
  } catch (error) {
    console.error('Error uploading report:', error)
    res.status(500).json({ error: 'Failed to upload report' })
  }
})

/**
 * GET /api/report - List reports
 */
router.get('/', (_req: Request, res: Response): void => {
  try {
    const userId = 'demo-user-001'
    const records = db.prepare(
      'SELECT * FROM report_records WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId)

    const parsedRecords = (records as Record<string, any>[]).map((record) => ({
      ...record,
      ocr_result: JSON.parse(record.ocr_result),
    }))

    res.json({ data: parsedRecords })
  } catch (error) {
    console.error('Error listing reports:', error)
    res.status(500).json({ error: 'Failed to list reports' })
  }
})

/**
 * GET /api/report/:id - Get report detail
 */
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const record = db.prepare('SELECT * FROM report_records WHERE id = ?').get(id) as Record<string, any> | undefined

    if (!record) {
      res.status(404).json({ error: 'Report not found' })
      return
    }

    const parsedRecord = {
      ...record,
      ocr_result: JSON.parse(record.ocr_result),
    }

    res.json({ data: parsedRecord })
  } catch (error) {
    console.error('Error getting report:', error)
    res.status(500).json({ error: 'Failed to get report' })
  }
})

/**
 * POST /api/report/:id/reparse - Reparse report
 */
router.post('/:id/reparse', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const record = db.prepare('SELECT * FROM report_records WHERE id = ?').get(id) as Record<string, any> | undefined

    if (!record) {
      res.status(404).json({ error: 'Report not found' })
      return
    }

    const ocrResult = JSON.stringify(simulateOcrParsing(record.pregnancy_week))

    db.prepare(`
      UPDATE report_records SET ocr_result = ?, parsed_at = datetime('now') WHERE id = ?
    `).run(ocrResult, id)

    const updated = db.prepare('SELECT * FROM report_records WHERE id = ?').get(id) as Record<string, any> | undefined
    if (!updated) {
      res.status(500).json({ error: 'Failed to retrieve reparsed report' })
      return
    }
    const parsedRecord = {
      ...updated,
      ocr_result: JSON.parse(updated.ocr_result),
    }

    res.json({ data: parsedRecord })
  } catch (error) {
    console.error('Error reparsing report:', error)
    res.status(500).json({ error: 'Failed to reparse report' })
  }
})

export default router

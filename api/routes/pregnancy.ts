import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { pregnancyWeeks } from '../data/pregnancyWeeks.js'

const router = Router()

/**
 * GET /api/pregnancy - Get pregnancy info for demo user
 */
router.get('/', (_req: Request, res: Response): void => {
  try {
    const userId = 'demo-user-001'
    const info = db.prepare('SELECT * FROM pregnancy_info WHERE user_id = ?').get(userId) as Record<string, any> | undefined

    if (!info) {
      res.status(404).json({ error: 'Pregnancy info not found' })
      return
    }

    // Calculate current week
    const lastPeriodDate = new Date(info.last_period_date)
    const now = new Date()
    const diffMs = now.getTime() - lastPeriodDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const currentWeek = Math.max(1, Math.min(40, Math.ceil(diffDays / 7)))

    res.json({ data: { ...info, currentWeek } })
  } catch (error) {
    console.error('Error getting pregnancy info:', error)
    res.status(500).json({ error: 'Failed to get pregnancy info' })
  }
})

/**
 * PUT /api/pregnancy - Update pregnancy info
 */
router.put('/', (req: Request, res: Response): void => {
  try {
    const userId = 'demo-user-001'
    const { dueDate, lastPeriodDate } = req.body

    if (!dueDate && !lastPeriodDate) {
      res.status(400).json({ error: 'At least one of dueDate or lastPeriodDate is required' })
      return
    }

    const existing = db.prepare('SELECT * FROM pregnancy_info WHERE user_id = ?').get(userId) as Record<string, any> | undefined
    if (!existing) {
      res.status(404).json({ error: 'Pregnancy info not found' })
      return
    }

    const newDueDate = dueDate || existing.due_date
    const newLastPeriodDate = lastPeriodDate || existing.last_period_date

    db.prepare(`
      UPDATE pregnancy_info
      SET due_date = ?, last_period_date = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(newDueDate, newLastPeriodDate, userId)

    const updated = db.prepare('SELECT * FROM pregnancy_info WHERE user_id = ?').get(userId) as Record<string, any> | undefined

    // Calculate current week
    const lpd = new Date(newLastPeriodDate)
    const now = new Date()
    const diffMs = now.getTime() - lpd.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const currentWeek = Math.max(1, Math.min(40, Math.ceil(diffDays / 7)))

    res.json({ data: { ...updated, currentWeek } })
  } catch (error) {
    console.error('Error updating pregnancy info:', error)
    res.status(500).json({ error: 'Failed to update pregnancy info' })
  }
})

/**
 * GET /api/pregnancy/week/:week - Get week info
 */
router.get('/week/:week', (req: Request, res: Response): void => {
  try {
    const week = parseInt(req.params.week, 10)

    if (isNaN(week) || week < 1 || week > 40) {
      res.status(400).json({ error: 'Week must be between 1 and 40' })
      return
    }

    const weekData = pregnancyWeeks.find(w => w.week === week)

    if (!weekData) {
      res.status(404).json({ error: `Week ${week} data not found` })
      return
    }

    res.json({ data: weekData })
  } catch (error) {
    console.error('Error getting week info:', error)
    res.status(500).json({ error: 'Failed to get week info' })
  }
})

/**
 * GET /api/pregnancy/checkup-schedule - Get checkup schedule
 */
router.get('/checkup-schedule', (_req: Request, res: Response): void => {
  try {
    const userId = 'demo-user-001'
    const info = db.prepare('SELECT * FROM pregnancy_info WHERE user_id = ?').get(userId) as Record<string, any> | undefined

    if (!info) {
      res.status(404).json({ error: 'Pregnancy info not found' })
      return
    }

    const lastPeriodDate = new Date(info.last_period_date)

    const schedule = [
      { week: 6, name: '早孕B超', description: '确认宫内妊娠，检查胎心', items: ['B超', '血HCG'] },
      { week: 8, name: 'B超确认胎心', description: '确认胚胎发育正常', items: ['B超'] },
      { week: 12, name: '建卡产检', description: '全面基础检查，建立孕产妇保健手册', items: ['NT检查', '血常规', '尿常规', '肝功能'] },
      { week: 16, name: '唐氏筛查', description: '筛查胎儿染色体异常风险', items: ['唐氏筛查', '血常规'] },
      { week: 20, name: '大排畸B超', description: '详细检查胎儿各器官发育', items: ['大排畸B超', '血常规'] },
      { week: 24, name: '糖耐量测试', description: '筛查妊娠期糖尿病', items: ['糖耐量测试', '血常规', '尿常规'] },
      { week: 28, name: '妊娠高血压筛查', description: '筛查妊娠期高血压疾病', items: ['血压监测', '尿蛋白', '血常规'] },
      { week: 30, name: '常规产检', description: '评估胎儿发育情况', items: ['B超', '胎心监护'] },
      { week: 32, name: '胎位检查', description: '检查胎儿位置和发育', items: ['B超', '胎位检查'] },
      { week: 34, name: '常规产检', description: '评估胎儿体重和发育', items: ['胎心监护', '血常规'] },
      { week: 36, name: 'B族链球菌筛查', description: '筛查B族链球菌感染', items: ['B族链球菌筛查', '胎心监护'] },
      { week: 37, name: '胎心监护', description: '评估胎儿宫内状况', items: ['胎心监护', '宫颈检查'] },
      { week: 38, name: '宫颈检查', description: '评估宫颈成熟度', items: ['宫颈检查', '胎心监护'] },
      { week: 39, name: '待产检查', description: '评估分娩准备情况', items: ['B超', '胎心监护'] },
      { week: 40, name: '待产检查', description: '随时准备分娩', items: ['胎心监护', '宫颈评估'] },
    ]

    // Calculate dates for each checkup
    const scheduleWithDates = schedule.map(item => {
      const checkupDate = new Date(lastPeriodDate)
      checkupDate.setDate(checkupDate.getDate() + item.week * 7)
      return {
        ...item,
        date: checkupDate.toISOString().split('T')[0],
      }
    })

    res.json({ data: scheduleWithDates })
  } catch (error) {
    console.error('Error getting checkup schedule:', error)
    res.status(500).json({ error: 'Failed to get checkup schedule' })
  }
})

export default router

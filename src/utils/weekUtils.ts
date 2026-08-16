import type { ScheduleData } from '../types/schedule'

function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y || 2000, (m || 1) - 1, d || 1)
}

function toLocalDateString(d: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function getCurrentWeek(startDate: string, totalWeeks: number): number {
  const start = parseDateOnly(startDate)
  const now = new Date()
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const diffDays = Math.floor((nowMidnight - startMidnight) / 86400000)
  const week = Math.floor(diffDays / 7) + 1
  return Math.max(1, Math.min(week, totalWeeks))
}

export function getWeekDateRange(startDate: string, weekNum: number): string {
  const monday = parseDateOnly(startDate)
  monday.setDate(monday.getDate() + (weekNum - 1) * 7)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const format = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}`
  return `${format(monday)} - ${format(sunday)}`
}

export function isCourseActiveThisWeek(
  course: { weeks: number[]; weekType: 'all' | 'odd' | 'even' | 'custom' },
  currentWeek: number
): boolean {
  if (course.weeks.length === 0) return true
  const weekInList = course.weeks.includes(currentWeek)
  if (!weekInList) return false

  if (course.weekType === 'odd' && currentWeek % 2 === 0) return false
  if (course.weekType === 'even' && currentWeek % 2 === 1) return false

  return true
}

export function getDefaultSchedule(): ScheduleData {
  const now = new Date()
  const month = now.getMonth()
  // 2月–8月属于当年春季学期；9月–次年1月属于秋季学期（1月归上一年9月开学）
  const isSpring = month >= 1 && month <= 7
  const year = isSpring || month >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const semStartMonth = isSpring ? 2 : 9

  const startDate = new Date(year, semStartMonth - 1, 1)
  while (startDate.getDay() !== 1) {
    startDate.setDate(startDate.getDate() + 1)
  }

  return {
    id: 'default',
    name: '不上课表',
    semester: `${year}年${isSpring ? '春季' : '秋季'}学期`,
    startDate: toLocalDateString(startDate),
    totalWeeks: 18,
    courses: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

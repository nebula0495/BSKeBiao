import type { ScheduleData } from '../types/schedule'

export function getCurrentWeek(startDate: string, totalWeeks: number): number {
  const start = new Date(startDate)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const week = Math.floor(diffDays / 7) + 1
  return Math.max(1, Math.min(week, totalWeeks))
}

export function getWeekDateRange(startDate: string, weekNum: number): string {
  const start = new Date(startDate)
  const monday = new Date(start)
  monday.setDate(start.getDate() + (weekNum - 1) * 7)

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
  const semesterMonths = [2, 9]
  let semStartMonth = semesterMonths[0]
  for (const m of semesterMonths) {
    if (now.getMonth() >= m - 1) semStartMonth = m
  }

  const startDate = new Date(now.getFullYear(), semStartMonth - 1, 1)
  while (startDate.getDay() !== 1) {
    startDate.setDate(startDate.getDate() + 1)
  }

  return {
    id: 'default',
    name: '不上课表',
    semester: `${now.getFullYear()}年${semStartMonth === 2 ? '春季' : '秋季'}学期`,
    startDate: startDate.toISOString().split('T')[0],
    totalWeeks: 18,
    courses: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

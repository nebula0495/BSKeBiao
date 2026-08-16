import type { ScheduleData, TimeSlotTemplate } from '../types/schedule'
import { getDefaultTimeTemplate } from '../types/schedule'
import { getDefaultSchedule } from './weekUtils'

const STORAGE_KEY = 'kebiao_schedule'
const TEMPLATE_KEY = 'kebiao_timetemplate'

export function loadSchedule(): ScheduleData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeSchedule(JSON.parse(raw))
  } catch {
    return null
  }
}

function normalizeSchedule(data: unknown): ScheduleData | null {
  if (typeof data !== 'object' || data === null) return null
  const d = data as Partial<ScheduleData>
  if (!Array.isArray(d.courses)) return null

  return {
    ...getDefaultSchedule(),
    ...d,
    totalWeeks: Math.max(1, Math.min(30, Number(d.totalWeeks) || 18)),
    courses: d.courses.map(c => {
      const wt = c.weekType
      return {
        id: String(c.id ?? `course_${Math.random().toString(36).slice(2)}`),
        name: String(c.name ?? ''),
        teacher: String(c.teacher ?? ''),
        location: String(c.location ?? ''),
        dayOfWeek: Math.max(1, Math.min(7, Number(c.dayOfWeek) || 1)),
        startTime: String(c.startTime ?? '08:00'),
        endTime: String(c.endTime ?? '09:40'),
        weeks: Array.isArray(c.weeks) ? c.weeks.filter(w => Number.isInteger(w) && w > 0) : [],
        weekType: wt === 'odd' || wt === 'even' || wt === 'custom' ? wt : 'all',
        color: typeof c.color === 'string' ? c.color : '',
        note: String(c.note ?? ''),
      }
    }),
  } as ScheduleData
}

export function saveSchedule(schedule: ScheduleData): void {
  schedule.updatedAt = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule))
}

export function clearSchedule(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function loadTimeTemplate(): TimeSlotTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY)
    if (!raw) return getDefaultTimeTemplate()
    const parsed = JSON.parse(raw) as TimeSlotTemplate[]
    return parsed.length > 0 ? parsed : getDefaultTimeTemplate()
  } catch {
    return getDefaultTimeTemplate()
  }
}

export function saveTimeTemplate(template: TimeSlotTemplate[]): void {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(template))
}

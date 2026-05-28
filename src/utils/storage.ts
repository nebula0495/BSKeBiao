import type { ScheduleData, TimeSlotTemplate } from '../types/schedule'
import { getDefaultTimeTemplate } from '../types/schedule'

const STORAGE_KEY = 'kebiao_schedule'
const TEMPLATE_KEY = 'kebiao_timetemplate'

export function loadSchedule(): ScheduleData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ScheduleData
  } catch {
    return null
  }
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

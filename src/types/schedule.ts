export interface Course {
  id: string
  name: string
  teacher: string
  location: string
  dayOfWeek: number
  startTime: string
  endTime: string
  weeks: number[]
  weekType: 'all' | 'odd' | 'even' | 'custom'
  color: string
  note: string
}

export interface ScheduleData {
  id: string
  name: string
  semester: string
  startDate: string
  totalWeeks: number
  courses: Course[]
  createdAt: string
  updatedAt: string
}

export interface ParsedCourse {
  name: string
  teacher: string
  location: string
  dayOfWeek: number
  timeSlot: string
  weeks: number[]
  rawText: string
}

export interface ParseResult {
  courses: ParsedCourse[]
  confidence: number
  warnings: string[]
}

export interface TimeSlotTemplate {
  period: number
  startTime: string
  endTime: string
}

export function getDefaultTimeTemplate(): TimeSlotTemplate[] {
  return [
    { period: 1, startTime: '08:00', endTime: '08:45' },
    { period: 2, startTime: '08:55', endTime: '09:40' },
    { period: 3, startTime: '10:10', endTime: '10:55' },
    { period: 4, startTime: '11:05', endTime: '11:50' },
    { period: 5, startTime: '14:00', endTime: '14:45' },
    { period: 6, startTime: '14:55', endTime: '15:40' },
    { period: 7, startTime: '16:00', endTime: '16:45' },
    { period: 8, startTime: '16:55', endTime: '17:40' },
    { period: 9, startTime: '19:00', endTime: '19:45' },
    { period: 10, startTime: '19:55', endTime: '20:40' },
    { period: 11, startTime: '20:50', endTime: '21:35' },
    { period: 12, startTime: '21:45', endTime: '22:30' },
  ]
}

export const DAY_LABELS: Record<number, string> = {
  1: '周一', 2: '周二', 3: '周三', 4: '周四',
  5: '周五', 6: '周六', 7: '周日',
}

export const DAY_SHORT_LABELS: Record<number, string> = {
  1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日',
}

export const COURSE_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#06B6D4', '#3B82F6', '#A855F7', '#D946EF',
]

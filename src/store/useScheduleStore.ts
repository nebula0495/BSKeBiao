import { create } from 'zustand'
import type { Course, ScheduleData } from '../types/schedule'
import { loadSchedule, saveSchedule } from '../utils/storage'
import { getDefaultSchedule, getCurrentWeek } from '../utils/weekUtils'

interface ScheduleState {
  schedule: ScheduleData
  currentWeek: number
  isLoading: boolean

  setCurrentWeek: (week: number) => void
  addCourse: (course: Course) => void
  updateCourse: (id: string, updates: Partial<Course>) => void
  deleteCourse: (id: string) => void
  setCourses: (courses: Course[]) => void
  updateScheduleInfo: (info: Partial<Pick<ScheduleData, 'name' | 'semester' | 'startDate' | 'totalWeeks'>>) => void
  resetSchedule: () => void
}

export const useScheduleStore = create<ScheduleState>((set, get) => {
  const saved = loadSchedule()
  const schedule = saved || getDefaultSchedule()
  const currentWeek = getCurrentWeek(schedule.startDate, schedule.totalWeeks)

  return {
    schedule,
    currentWeek,
    isLoading: false,

    setCurrentWeek: (week: number) => {
      const { schedule } = get()
      const clamped = Math.max(1, Math.min(week, schedule.totalWeeks))
      set({ currentWeek: clamped })
    },

    addCourse: (course: Course) => {
      const { schedule } = get()
      const newSchedule = {
        ...schedule,
        courses: [...schedule.courses, course],
      }
      saveSchedule(newSchedule)
      set({ schedule: newSchedule })
    },

    updateCourse: (id: string, updates: Partial<Course>) => {
      const { schedule } = get()
      const newSchedule = {
        ...schedule,
        courses: schedule.courses.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }
      saveSchedule(newSchedule)
      set({ schedule: newSchedule })
    },

    deleteCourse: (id: string) => {
      const { schedule } = get()
      const newSchedule = {
        ...schedule,
        courses: schedule.courses.filter((c) => c.id !== id),
      }
      saveSchedule(newSchedule)
      set({ schedule: newSchedule })
    },

    setCourses: (courses: Course[]) => {
      const { schedule } = get()
      const newSchedule = { ...schedule, courses }
      saveSchedule(newSchedule)
      set({ schedule: newSchedule })
    },

    updateScheduleInfo: (info) => {
      const { schedule, currentWeek } = get()
      const newSchedule = { ...schedule, ...info }
      saveSchedule(newSchedule)
      const totalWeeks = newSchedule.totalWeeks
      set({
        schedule: newSchedule,
        ...(currentWeek > totalWeeks && { currentWeek: totalWeeks }),
      })
    },

    resetSchedule: () => {
      const newSchedule = getDefaultSchedule()
      saveSchedule(newSchedule)
      set({
        schedule: newSchedule,
        currentWeek: getCurrentWeek(newSchedule.startDate, newSchedule.totalWeeks),
      })
    },
  }
})

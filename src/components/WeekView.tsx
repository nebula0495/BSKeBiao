import { useMemo } from 'react'
import { useScheduleStore } from '../store'
import { isCourseActiveThisWeek } from '../utils/weekUtils'
import { DAY_LABELS, COURSE_COLORS } from '../types/schedule'
import type { Course } from '../types/schedule'

interface Props {
  currentWeek: number
  onEditCourse: (courseId: string) => void
}

interface DisplayCourse extends Course {
  colorIndex: number
}

export default function WeekView({ currentWeek, onEditCourse }: Props) {
  const { schedule } = useScheduleStore()

  const coursesByDay = useMemo(() => {
    const active = schedule.courses.filter(c =>
      isCourseActiveThisWeek(c, currentWeek)
    )

    const nameColorMap: Record<string, number> = {}
    let nextColor = 0

    const withColor = active.map(c => {
      if (c.color) {
        return { ...c, colorIndex: -1 }
      }
      if (!(c.name in nameColorMap)) {
        nameColorMap[c.name] = nextColor % COURSE_COLORS.length
        nextColor++
      }
      return {
        ...c,
        color: COURSE_COLORS[nameColorMap[c.name]],
        colorIndex: nameColorMap[c.name],
      }
    }) as DisplayCourse[]

    const grouped: Record<number, DisplayCourse[]> = {}
    for (let day = 1; day <= 7; day++) {
      grouped[day] = withColor
        .filter(c => c.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
    return grouped
  }, [schedule.courses, currentWeek])

  const hasAnyCourse = Object.values(coursesByDay).some(arr => arr.length > 0)

  if (!hasAnyCourse) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <p style={styles.emptyTitle}>第 {currentWeek} 周暂无课程</p>
        <p style={styles.emptyDesc}>点击右下角 + 按钮添加课程，或从学校官网导入课表</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {[1, 2, 3, 4, 5, 6, 7].map(day => {
        const dayCourses = coursesByDay[day]
        if (dayCourses.length === 0) return null

        return (
          <div key={day} style={styles.daySection}>
            <div style={styles.dayHeader}>
              <span style={styles.dayLabel}>{DAY_LABELS[day]}</span>
              <span style={styles.courseCount}>{dayCourses.length} 节课</span>
            </div>
            <div style={styles.courseList}>
              {dayCourses.map(course => (
                <div
                  key={course.id}
                  onClick={() => onEditCourse(course.id)}
                  style={{
                    ...styles.courseCard,
                    background: course.color + '12',
                    borderLeftColor: course.color,
                  }}
                  className="animate-fadeIn"
                >
                  <div style={styles.courseTop}>
                    <span style={{ ...styles.courseName, color: course.color }}>
                      {course.name}
                    </span>
                    <span style={styles.courseTime}>
                      {course.startTime} - {course.endTime}
                    </span>
                  </div>
                  <div style={styles.courseBottom}>
                    {course.location ? (
                      <span style={styles.courseDetail}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {course.location}
                      </span>
                    ) : null}
                    {course.teacher ? (
                      <span style={styles.courseDetail}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        {course.teacher}
                      </span>
                    ) : null}
                  </div>
                  {course.weeks.length > 0 && course.weeks.length < schedule.totalWeeks ? (
                    <div style={styles.weekTags}>
                      <span style={styles.weekTag}>
                        {formatWeekRanges(course.weeks)} 周
                      </span>
                      {course.weekType !== 'all' ? (
                        <span style={styles.weekTag}>
                          {course.weekType === 'odd' ? '单周' : '双周'}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatWeekRanges(weeks: number[]): string {
  if (weeks.length === 0) return ''
  const sorted = [...weeks].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let end = sorted[0]
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`)
      start = sorted[i]
      end = sorted[i]
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`)
  return ranges.join(',')
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  daySection: {
    background: 'white',
    borderRadius: 16,
    padding: '12px 14px 14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: '1px solid #F3F4F6',
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1F2937',
  },
  courseCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  courseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  courseCard: {
    padding: '12px',
    borderRadius: 12,
    borderLeft: '3px solid',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  courseTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    fontWeight: 600,
    flex: 1,
  },
  courseTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: 500,
    flexShrink: 0,
    marginLeft: 8,
  },
  courseBottom: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  courseDetail: {
    fontSize: 11,
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  weekTags: {
    display: 'flex',
    gap: 6,
    marginTop: 6,
  },
  weekTag: {
    fontSize: 10,
    color: '#6B7280',
    background: '#F3F4F6',
    padding: '2px 8px',
    borderRadius: 10,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    background: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#6B7280',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 1.5,
  },
}

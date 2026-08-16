import { useMemo } from 'react'
import { useScheduleStore } from '../store'
import { isCourseActiveThisWeek } from '../utils/weekUtils'
import { COURSE_COLORS } from '../types/schedule'
import type { Course } from '../types/schedule'

interface Props {
  currentWeek: number
  dayOfWeek: number
  onEditCourse: (courseId: string) => void
}

export default function DayView({ currentWeek, dayOfWeek, onEditCourse }: Props) {
  const { schedule } = useScheduleStore()

  const dayCourses = useMemo(() => {
    const active = schedule.courses.filter(c =>
      isCourseActiveThisWeek(c, currentWeek) && c.dayOfWeek === dayOfWeek
    )

    const nameColorMap: Record<string, number> = {}
    let nextColor = 0

    const withColor = active.map(c => {
      if (c.color) return c
      if (!(c.name in nameColorMap)) {
        nameColorMap[c.name] = nextColor % COURSE_COLORS.length
        nextColor++
      }
      return { ...c, color: COURSE_COLORS[nameColorMap[c.name]] }
    })

    return withColor.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [schedule.courses, currentWeek, dayOfWeek])

  if (dayCourses.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <p style={styles.emptyTitle}>今天没有课程</p>
        <p style={styles.emptyDesc}>好好休息一下吧 ☀️</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {dayCourses.map(course => (
        <div
          key={course.id}
          onClick={() => onEditCourse(course.id)}
          style={{
            ...styles.card,
            background: course.color + '10',
            borderLeftColor: course.color,
          }}
          className="animate-fadeIn"
        >
          <div style={styles.timeColumn}>
            <span style={styles.timeStart}>{course.startTime}</span>
            <div style={styles.timeLine} />
            <span style={styles.timeEnd}>{course.endTime}</span>
          </div>
          <div style={styles.cardContent}>
            <div style={{ ...styles.courseName, color: course.color }}>
              {course.name}
            </div>
            <div style={styles.cardMeta}>
              {course.location ? (
                <span style={styles.metaItem}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {course.location}
                </span>
              ) : null}
              {course.teacher ? (
                <span style={styles.metaItem}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {course.teacher}
                </span>
              ) : null}
            </div>
            {course.weeks.length > 0 && course.weeks.length < schedule.totalWeeks ? (
              <div style={styles.weekTags}>
                <span style={styles.weekTag}>{formatWeekRanges(course.weeks)} 周</span>
                {course.weekType === 'odd' ? <span style={styles.weekTag}>单周</span> : null}
                {course.weekType === 'even' ? <span style={styles.weekTag}>双周</span> : null}
              </div>
            ) : null}
          </div>
        </div>
      ))}

      <div style={styles.tip}>
        <p style={styles.tipText}>共 {dayCourses.length} 节课</p>
      </div>
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
    if (sorted[i] === end + 1) { end = sorted[i] }
    else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`)
      start = sorted[i]; end = sorted[i]
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`)
  return ranges.join(',')
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    display: 'flex', alignItems: 'stretch', padding: '14px',
    borderRadius: 14, borderLeft: '4px solid', cursor: 'pointer',
    background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'transform 0.15s',
  },
  timeColumn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: 52, flexShrink: 0, marginRight: 14,
  },
  timeStart: { fontSize: 13, fontWeight: 600, color: '#22C55E' },
  timeLine: {
    width: 2, flex: 1, minHeight: 16, background: '#DCFCE7',
    margin: '4px 0', borderRadius: 1,
  },
  timeEnd: { fontSize: 11, color: '#9CA3AF' },
  cardContent: { flex: 1, minWidth: 0 },
  courseName: { fontSize: 16, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 },
  cardMeta: { display: 'flex', flexWrap: 'wrap', gap: '4px 14px' },
  metaItem: { fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 },
  weekTags: { display: 'flex', gap: 6, marginTop: 8 },
  weekTag: {
    fontSize: 10, color: '#6B7280', background: '#F3F4F6',
    padding: '2px 8px', borderRadius: 10,
  },
  tip: { textAlign: 'center', paddingTop: 4 },
  tipText: { fontSize: 12, color: '#D1D5DB' },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '70px 20px',
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36, background: '#F3F4F6',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: '#9CA3AF', marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: '#D1D5DB' },
}

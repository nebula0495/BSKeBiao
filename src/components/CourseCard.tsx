import { CSSProperties } from 'react'
import type { Course } from '../types/schedule'

interface Props {
  course: Course
  style?: CSSProperties
  onClick?: () => void
}

export default function CourseCard({ course, style, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.card,
        background: course.color + '15',
        borderLeftColor: course.color,
        ...style,
      }}
      className="animate-fadeIn"
    >
      <div style={{ ...styles.nameDot, background: course.color }} />
      <div style={styles.content}>
        <div style={styles.name}>{course.name}</div>
        {course.location ? (
          <div style={styles.detail}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {course.location}
          </div>
        ) : null}
        {course.teacher ? (
          <div style={styles.detail}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            {course.teacher}
          </div>
        ) : null}
        {course.note ? (
          <div style={styles.note}>{course.note}</div>
        ) : null}
      </div>
      <div style={styles.time}>
        <span>{course.startTime}</span>
        <span style={styles.timeSep}>-</span>
        <span>{course.endTime}</span>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px',
    borderRadius: 12,
    borderLeft: '3px solid',
    marginBottom: 8,
    position: 'relative',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  nameDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 3,
    marginRight: 10,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1F2937',
    lineHeight: 1.3,
    marginBottom: 4,
  },
  detail: {
    fontSize: 11,
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  note: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 3,
    fontStyle: 'italic',
  },
  time: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 500,
    textAlign: 'right',
    flexShrink: 0,
    marginLeft: 8,
    lineHeight: 1.4,
  },
  timeSep: {
    display: 'block',
    textAlign: 'center',
    fontSize: 9,
  },
}

import { useState, useRef, useEffect, useCallback } from 'react'
import SplashScreen from './components/SplashScreen'
import DayView from './components/DayView'
import WeekPicker from './components/WeekPicker'
import WebViewModal from './components/WebViewModal'
import CourseEditor from './components/CourseEditor'
import SemesterSettings from './components/SemesterSettings'
import TimeSlotEditor from './components/TimeSlotEditor'
import { useScheduleStore } from './store'
import { DAY_LABELS, DAY_SHORT_LABELS } from './types/schedule'
import { getWeekDateRange } from './utils/weekUtils'

export default function App() {
  const { schedule, currentWeek } = useScheduleStore()

  const todayNum = new Date().getDay()
  const todayIndex = todayNum === 0 ? 7 : todayNum

  const [splashDone, setSplashDone] = useState(false)
  const [selectedDay, setSelectedDay] = useState(todayIndex)
  const [showImport, setShowImport] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTimeEditor, setShowTimeEditor] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)

  const dayBarRef = useRef<HTMLDivElement>(null)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchDeltaX, setTouchDeltaX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const dateRange = getWeekDateRange(schedule.startDate, currentWeek)

  useEffect(() => {
    if (splashDone && dayBarRef.current) {
      const activeEl = dayBarRef.current.children[selectedDay - 1] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [selectedDay, splashDone])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchDeltaX(0)
    setIsSwiping(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) return
    const dx = e.touches[0].clientX - touchStartX
    setTouchDeltaX(dx)
  }, [isSwiping, touchStartX])

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false)
    if (Math.abs(touchDeltaX) > 50) {
      if (touchDeltaX > 0 && selectedDay > 1) {
        setSelectedDay(prev => prev - 1)
      } else if (touchDeltaX < 0 && selectedDay < 7) {
        setSelectedDay(prev => prev + 1)
      }
    }
    setTouchDeltaX(0)
  }, [touchDeltaX, selectedDay])

  const handleEditCourse = (courseId: string) => {
    setEditingCourseId(courseId)
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setEditingCourseId(null)
  }

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />
  }

  return (
    <>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>{schedule.name}</h1>
            <p style={styles.subtitle}>{schedule.semester}</p>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.iconBtn} onClick={() => setShowTimeEditor(true)} title="时间设置">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>
            <button style={styles.iconBtn} onClick={() => setShowImport(true)} title="导入课表">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </button>
            <button style={styles.iconBtn} onClick={() => setShowSettings(true)} title="设置">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>

        <WeekPicker />

        <div style={styles.dateRange}>{dateRange}</div>

        <div ref={dayBarRef} style={styles.dayBar}>
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                ...styles.dayBtn,
                ...(day === selectedDay ? styles.dayBtnActive : {}),
              }}
            >
              <span style={{
                ...styles.dayShort,
                ...(day === selectedDay ? styles.dayShortActive : {}),
                ...(day === todayIndex && day !== selectedDay ? { color: '#22C55E' } : {}),
              }}>
                {DAY_SHORT_LABELS[day]}
              </span>
              <span style={{
                ...styles.dayName,
                ...(day === selectedDay ? styles.dayNameActive : {}),
              }}>
                {DAY_LABELS[day]}
              </span>
              {day === todayIndex && (
                <span style={{
                  ...styles.todayDot,
                  ...(day === selectedDay ? { background: 'white' } : {}),
                }} />
              )}
            </button>
          ))}
        </div>
      </header>

      <main
        style={styles.main}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={styles.dayHeader}>
          <span style={styles.dayHeaderLabel}>{DAY_LABELS[selectedDay]}</span>
          <span style={styles.dayHeaderWeek}>第 {currentWeek} 周</span>
        </div>
        <DayView
          key={`${currentWeek}-${selectedDay}`}
          currentWeek={currentWeek}
          dayOfWeek={selectedDay}
          onEditCourse={handleEditCourse}
        />
      </main>

      <div style={styles.fab}>
        <button style={styles.fabBtn} onClick={() => { setEditingCourseId(null); setShowEditor(true) }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {showImport && <WebViewModal onClose={() => setShowImport(false)} />}
      {showEditor && <CourseEditor courseId={editingCourseId} onClose={handleCloseEditor} />}
      {showSettings && <SemesterSettings onClose={() => setShowSettings(false)} />}
      {showTimeEditor && <TimeSlotEditor onClose={() => setShowTimeEditor(false)} />}
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    background: 'linear-gradient(135deg, #A8E6CF 0%, #22C55E 100%)',
    padding: '14px 14px 0',
    paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
    color: 'white', flexShrink: 0, position: 'relative', zIndex: 10,
  },
  headerTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' },
  subtitle: { fontSize: 12, opacity: 0.75, marginTop: 1 },
  headerActions: { display: 'flex', gap: 2 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer',
  },
  dateRange: {
    textAlign: 'center', fontSize: 11, opacity: 0.6, marginTop: 2,
  },
  dayBar: {
    display: 'flex', gap: 0, marginTop: 10, overflowX: 'auto',
    scrollbarWidth: 'none', paddingBottom: 0,
  },
  dayBtn: {
    flex: '0 0 calc(100% / 7)', display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '10px 0 8px', border: 'none', cursor: 'pointer', background: 'transparent',
    borderRadius: '12px 12px 0 0', transition: 'background 0.2s',
    position: 'relative' as const,
  },
  dayBtnActive: { background: 'rgba(255,255,255,0.2)' },
  dayShort: { fontSize: 18, fontWeight: 700, opacity: 0.55, transition: 'all 0.2s' },
  dayShortActive: { opacity: 1 },
  dayName: { fontSize: 10, opacity: 0.55, marginTop: 2, transition: 'all 0.2s', fontWeight: 500 },
  dayNameActive: { opacity: 1 },
  todayDot: {
    width: 4, height: 4, borderRadius: 2, background: '#FBBF24',
    position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
  },
  main: {
    flex: 1, overflow: 'auto', padding: '10px 12px 80px', background: '#F5F5F7',
    userSelect: 'none', WebkitUserSelect: 'none',
  },
  dayHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: 12,
  },
  dayHeaderLabel: { fontSize: 20, fontWeight: 800, color: '#1F2937' },
  dayHeaderWeek: { fontSize: 12, color: '#9CA3AF', fontWeight: 500 },
  fab: {
    position: 'fixed', bottom: 'calc(24px + env(safe-area-inset-bottom, 16px))',
    right: 'calc(50% - 224px)', zIndex: 20,
  },
  fabBtn: {
    width: 52, height: 52, borderRadius: 26,
    background: 'linear-gradient(135deg, #A8E6CF 0%, #22C55E 100%)',
    boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer',
  },
}

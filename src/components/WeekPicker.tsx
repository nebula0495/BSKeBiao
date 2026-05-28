import { useScheduleStore } from '../store'
import { getWeekDateRange } from '../utils/weekUtils'

export default function WeekPicker() {
  const { schedule, currentWeek, setCurrentWeek } = useScheduleStore()

  const weekLabel = `第 ${currentWeek} 周`
  const dateRange = getWeekDateRange(schedule.startDate, currentWeek)

  const canGoPrev = currentWeek > 1
  const canGoNext = currentWeek < schedule.totalWeeks

  return (
    <div style={styles.container}>
      <button
        style={{ ...styles.arrow, opacity: canGoPrev ? 1 : 0.3 }}
        onClick={() => canGoPrev && setCurrentWeek(currentWeek - 1)}
        disabled={!canGoPrev}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div style={styles.center}>
        <span style={styles.weekLabel}>{weekLabel}</span>
        <span style={styles.dateLabel}>{dateRange}</span>
      </div>

      <button
        style={{ ...styles.arrow, opacity: canGoNext ? 1 : 0.3 }}
        onClick={() => canGoNext && setCurrentWeek(currentWeek + 1)}
        disabled={!canGoNext}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0 4px',
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  weekLabel: {
    fontSize: 18,
    fontWeight: 700,
  },
  dateLabel: {
    fontSize: 12,
    opacity: 0.75,
  },
}

import { useState, useEffect, useRef } from 'react'
import { useScheduleStore } from '../store'
import { loadTimeTemplate, saveTimeTemplate } from '../utils/storage'
import type { TimeSlotTemplate } from '../types/schedule'

interface Props {
  onClose: () => void
}

export default function TimeSlotEditor({ onClose }: Props) {
  const { schedule, setCourses } = useScheduleStore()
  const [slots, setSlots] = useState<TimeSlotTemplate[]>(() => loadTimeTemplate())
  const [activeCount, setActiveCount] = useState(() => {
    const loaded = loadTimeTemplate()
    return loaded.length || 12
  })
  const [appliedCount, setAppliedCount] = useState<number | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 打开编辑器时已保存的模板：已有课程的时间是按它录入的，映射节次要以它为准
  const prevTemplate = useRef(loadTimeTemplate()).current

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  const updateSlot = (period: number, field: 'startTime' | 'endTime', value: string) => {
    setAppliedCount(null)
    setSlots(prev =>
      prev.map(s => (s.period === period ? { ...s, [field]: value } : s))
    )
  }

  const handleApplyToCourses = () => {
    const newTemplate = slots.slice(0, activeCount)

    const oldTimeToPeriod: Record<string, number> = {}
    for (const tpl of prevTemplate) {
      oldTimeToPeriod[tpl.startTime] = tpl.period
    }

    const periodToTimes: Record<number, { startTime: string; endTime: string }> = {}
    for (const tpl of newTemplate) {
      periodToTimes[tpl.period] = { startTime: tpl.startTime, endTime: tpl.endTime }
    }

    let changedCount = 0
    const updatedCourses = schedule.courses.map(course => {
      const period = oldTimeToPeriod[course.startTime]
      if (period !== undefined && periodToTimes[period] && periodToTimes[period + 1]) {
        changedCount++
        return {
          ...course,
          startTime: periodToTimes[period].startTime,
          endTime: periodToTimes[period + 1].endTime,
        }
      }
      return course
    })

    setCourses(updatedCourses)
    saveTimeTemplate(newTemplate)
    setAppliedCount(changedCount)

    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setAppliedCount(null), 2500)
  }

  const handleSave = () => {
    saveTimeTemplate(slots.slice(0, activeCount))
    onClose()
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={e => e.stopPropagation()} className="animate-slideUp">
        <div style={styles.handle} />
        <h2 style={styles.title}>批量设置上课时间</h2>
        <p style={styles.desc}>设置每节课的上课与下课时间，每门课两节连上</p>

        <div style={styles.countRow}>
          <label style={styles.label}>每天节课数</label>
          <div style={styles.countBtns}>
            {[4, 6, 8, 10, 12].map(n => (
              <button
                key={n}
                style={{
                  ...styles.countBtn,
                  ...(activeCount === n ? styles.countBtnActive : {}),
                }}
                onClick={() => { setActiveCount(n); setAppliedCount(null) }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.slotList}>
          {slots.slice(0, activeCount).map(slot => (
            <div key={slot.period} style={styles.slotRow}>
              <span style={styles.periodLabel}>第 {slot.period} 节</span>
              <input
                type="time"
                style={styles.timeInput}
                value={slot.startTime}
                onChange={e => updateSlot(slot.period, 'startTime', e.target.value)}
              />
              <span style={styles.sep}>至</span>
              <input
                type="time"
                style={styles.timeInput}
                value={slot.endTime}
                onChange={e => updateSlot(slot.period, 'endTime', e.target.value)}
              />
            </div>
          ))}
        </div>

        {schedule.courses.length > 0 && (
          <button
            style={appliedCount !== null ? styles.applyDoneBtn : styles.applyBtn}
            onClick={handleApplyToCourses}
            disabled={appliedCount !== null}
          >
            {appliedCount !== null ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {appliedCount > 0 ? `已更新 ${appliedCount} 门课程` : '没有匹配到可更新的课程'}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <path d="M7 23l-4-4 4-4"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                应用到已有课程
              </>
            )}
          </button>
        )}

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>取消</button>
          <button style={styles.saveBtn} onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    width: '100%', maxWidth: 480, maxHeight: '90vh', background: 'white',
    borderRadius: '20px 20px 0 0',
    padding: '20px 16px calc(20px + env(safe-area-inset-bottom, 16px))',
    overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14,
  },
  handle: { width: 36, height: 4, borderRadius: 2, background: '#E5E7EB', margin: '0 auto 4px' },
  title: { fontSize: 20, fontWeight: 700 },
  desc: { fontSize: 13, color: '#6B7280', marginTop: -8 },
  countRow: { display: 'flex', alignItems: 'center', gap: 12 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0 },
  countBtns: { display: 'flex', gap: 6 },
  countBtn: {
    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    background: '#F3F4F6', color: '#6B7280', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
  },
  countBtnActive: { background: '#22C55E', color: 'white', fontWeight: 600 },
  slotList: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflow: 'auto' },
  slotRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', background: '#F9FAFB', borderRadius: 10,
  },
  periodLabel: { fontSize: 13, fontWeight: 600, color: '#22C55E', width: 52, flexShrink: 0 },
  timeInput: {
    padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB',
    fontSize: 13, background: 'white', flex: 1, minWidth: 0,
  },
  sep: { fontSize: 13, color: '#9CA3AF', flexShrink: 0 },
  applyBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px', borderRadius: 12,
    background: '#FEF3C7', color: '#92400E',
    fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  applyDoneBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px', borderRadius: 12,
    background: '#F0FDF4', color: '#166534',
    fontSize: 14, fontWeight: 600, border: 'none', cursor: 'default',
    transition: 'all 0.2s',
  },
  actions: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    paddingTop: 8, borderTop: '1px solid #F3F4F6',
  },
  cancelBtn: {
    padding: '12px 20px', borderRadius: 10, background: '#F3F4F6',
    color: '#374151', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
  },
  saveBtn: {
    padding: '12px 24px', borderRadius: 10,
    background: 'linear-gradient(135deg, #A8E6CF 0%, #22C55E 100%)',
    color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
  },
}

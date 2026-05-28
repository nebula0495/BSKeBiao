import { useState } from 'react'
import { useScheduleStore } from '../store'
import { clearSchedule } from '../utils/storage'

interface Props {
  onClose: () => void
}

export default function SemesterSettings({ onClose }: Props) {
  const { schedule, updateScheduleInfo, resetSchedule } = useScheduleStore()

  const [name, setName] = useState(schedule.name)
  const [semester, setSemester] = useState(schedule.semester)
  const [startDate, setStartDate] = useState(schedule.startDate)
  const [totalWeeks, setTotalWeeks] = useState(schedule.totalWeeks)

  const handleSave = () => {
    updateScheduleInfo({
      name: name.trim() || schedule.name,
      semester: semester.trim() || schedule.semester,
      startDate,
      totalWeeks: Math.max(1, Math.min(30, totalWeeks)),
    })
    onClose()
  }

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？课表和设置都将被清空，此操作不可撤销！')) {
      clearSchedule()
      resetSchedule()
      onClose()
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={e => e.stopPropagation()} className="animate-slideUp">
        <div style={styles.handle} />
        <h2 style={styles.title}>不上课表设置</h2>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>课表名称</label>
            <input
              style={styles.input}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>学期</label>
            <input
              style={styles.input}
              type="text"
              placeholder="例如：2025年春季学期"
              value={semester}
              onChange={e => setSemester(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>开学日期（第一周周一）</label>
            <input
              style={styles.input}
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>总周数</label>
            <input
              style={styles.input}
              type="number"
              min={1}
              max={30}
              value={totalWeeks}
              onChange={e => setTotalWeeks(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.resetBtn} onClick={handleReset}>
            重置数据
          </button>
          <div style={styles.rightActions}>
            <button style={styles.cancelBtn} onClick={onClose}>取消</button>
            <button style={styles.saveBtn} onClick={handleSave}>保存</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90vh',
    background: 'white',
    borderRadius: '20px 20px 0 0',
    padding: '20px 16px calc(20px + env(safe-area-inset-bottom, 16px))',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: '#E5E7EB',
    margin: '0 auto 4px',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '11px 14px',
    borderRadius: 10,
    border: '1.5px solid #E5E7EB',
    fontSize: 14,
    background: '#F9FAFB',
    width: '100%',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTop: '1px solid #F3F4F6',
  },
  rightActions: {
    display: 'flex',
    gap: 10,
    marginLeft: 'auto',
  },
  cancelBtn: {
    padding: '12px 20px',
    borderRadius: 10,
    background: '#F3F4F6',
    color: '#374151',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '12px 24px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #A8E6CF 0%, #22C55E 100%)',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  resetBtn: {
    padding: '12px 16px',
    borderRadius: 10,
    background: '#FEF2F2',
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
}

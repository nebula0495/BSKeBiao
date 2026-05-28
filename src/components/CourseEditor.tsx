import { useState, useEffect } from 'react'
import { useScheduleStore } from '../store'
import type { Course } from '../types/schedule'
import { COURSE_COLORS } from '../types/schedule'
import { loadTimeTemplate } from '../utils/storage'

interface Props {
  courseId: string | null
  onClose: () => void
}

const defaultCourse = (): Partial<Course> => ({
  name: '',
  teacher: '',
  location: '',
  dayOfWeek: 1,
  startTime: '08:00',
  endTime: '09:40',
  weeks: Array.from({ length: 18 }, (_, i) => i + 1),
  weekType: 'all',
  color: COURSE_COLORS[0],
  note: '',
})

export default function CourseEditor({ courseId, onClose }: Props) {
  const { schedule, addCourse, updateCourse, deleteCourse } = useScheduleStore()
  const isEditing = courseId !== null
  const existingCourse = courseId ? schedule.courses.find(c => c.id === courseId) : null

  const [form, setForm] = useState<Partial<Course>>(
    existingCourse ? { ...existingCourse } : defaultCourse()
  )

  useEffect(() => {
    if (existingCourse) {
      setForm({ ...existingCourse })
    }
  }, [courseId])

  const handleChange = (field: keyof Course, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleWeekTypeChange = (type: Course['weekType']) => {
    if (type === 'all') {
      setForm(prev => ({
        ...prev,
        weekType: type,
        weeks: Array.from({ length: schedule.totalWeeks }, (_, i) => i + 1),
      }))
    } else if (type === 'odd') {
      setForm(prev => ({
        ...prev,
        weekType: type,
        weeks: Array.from({ length: schedule.totalWeeks }, (_, i) => i + 1).filter(w => w % 2 === 1),
      }))
    } else if (type === 'even') {
      setForm(prev => ({
        ...prev,
        weekType: type,
        weeks: Array.from({ length: schedule.totalWeeks }, (_, i) => i + 1).filter(w => w % 2 === 0),
      }))
    } else {
      setForm(prev => ({ ...prev, weekType: type }))
    }
  }

  const toggleWeek = (week: number) => {
    setForm(prev => {
      const current = prev.weeks || []
      const newWeeks = current.includes(week)
        ? current.filter(w => w !== week)
        : [...current, week].sort((a, b) => a - b)
      return { ...prev, weeks: newWeeks, weekType: 'custom' as const }
    })
  }

  const handleSave = () => {
    if (!form.name?.trim()) return

    const course: Course = {
      id: existingCourse?.id || `course_${Date.now()}`,
      name: form.name || '',
      teacher: form.teacher || '',
      location: form.location || '',
      dayOfWeek: form.dayOfWeek || 1,
      startTime: form.startTime || '08:00',
      endTime: form.endTime || '09:40',
      weeks: form.weeks || [],
      weekType: form.weekType || 'all',
      color: form.color || COURSE_COLORS[0],
      note: form.note || '',
    }

    if (isEditing) {
      updateCourse(course.id, course)
    } else {
      addCourse(course)
    }
    onClose()
  }

  const handleDelete = () => {
    if (courseId && confirm('确定要删除这门课程吗？')) {
      deleteCourse(courseId)
      onClose()
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={e => e.stopPropagation()} className="animate-slideUp">
        <div style={styles.handle} />
        <h2 style={styles.title}>{isEditing ? '编辑课程' : '添加课程'}</h2>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>课程名称 *</label>
            <input
              style={styles.input}
              type="text"
              placeholder="例如：高等数学"
              value={form.name || ''}
              onChange={e => handleChange('name', e.target.value)}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>教师</label>
              <input
                style={styles.input}
                type="text"
                placeholder="教师姓名"
                value={form.teacher || ''}
                onChange={e => handleChange('teacher', e.target.value)}
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>教室</label>
              <input
                style={styles.input}
                type="text"
                placeholder="例如：A201"
                value={form.location || ''}
                onChange={e => handleChange('location', e.target.value)}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>星期</label>
              <select
                style={styles.select}
                value={form.dayOfWeek || 1}
                onChange={e => handleChange('dayOfWeek', parseInt(e.target.value))}
              >
                <option value={1}>周一</option>
                <option value={2}>周二</option>
                <option value={3}>周三</option>
                <option value={4}>周四</option>
                <option value={5}>周五</option>
                <option value={6}>周六</option>
                <option value={7}>周日</option>
              </select>
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>开始时间</label>
              <input
                style={styles.input}
                type="time"
                value={form.startTime || '08:00'}
                onChange={e => handleChange('startTime', e.target.value)}
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>结束时间</label>
              <input
                style={styles.input}
                type="time"
                value={form.endTime || '09:40'}
                onChange={e => handleChange('endTime', e.target.value)}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>快速选择节次（每门课两节连上）</label>
            <div style={styles.quickSlots}>
              {(() => {
                const tpl = loadTimeTemplate()
                const pairs: { period: number; start: string; end: string }[] = []
                for (let i = 0; i < tpl.length - 1; i += 2) {
                  pairs.push({
                    period: tpl[i].period,
                    start: tpl[i].startTime,
                    end: tpl[i + 1].endTime,
                  })
                }
                return pairs.slice(0, 6).map(pair => {
                  const isActive = form.startTime === pair.start && form.endTime === pair.end
                  return (
                    <button
                      key={pair.period}
                      style={{
                        ...styles.quickSlotBtn,
                        ...(isActive ? styles.quickSlotBtnActive : {}),
                      }}
                      onClick={() => {
                        handleChange('startTime', pair.start)
                        handleChange('endTime', pair.end)
                      }}
                    >
                      第{pair.period}-{pair.period + 1}节
                    </button>
                  )
                })
              })()}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>颜色</label>
            <div style={styles.colorRow}>
              {COURSE_COLORS.map(color => (
                <button
                  key={color}
                  style={{
                    ...styles.colorDot,
                    background: color,
                    boxShadow: form.color === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : 'none',
                  }}
                  onClick={() => handleChange('color', color)}
                />
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>周数设置</label>
            <div style={styles.weekTypeRow}>
              {(['all', 'odd', 'even', 'custom'] as const).map(type => (
                <button
                  key={type}
                  style={{
                    ...styles.weekTypeBtn,
                    ...(form.weekType === type ? styles.weekTypeActive : {}),
                  }}
                  onClick={() => handleWeekTypeChange(type)}
                >
                  {{ all: '全部周', odd: '单周', even: '双周', custom: '自定义' }[type]}
                </button>
              ))}
            </div>
          </div>

          {form.weekType === 'custom' && (
            <div style={styles.weekGrid}>
              {Array.from({ length: schedule.totalWeeks }, (_, i) => i + 1).map(week => {
                const active = form.weeks?.includes(week)
                return (
                  <button
                    key={week}
                    style={{
                      ...styles.weekCell,
                      ...(active ? styles.weekCellActive : {}),
                    }}
                    onClick={() => toggleWeek(week)}
                  >
                    {week}
                  </button>
                )
              })}
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>备注</label>
            <input
              style={styles.input}
              type="text"
              placeholder="可选备注信息"
              value={form.note || ''}
              onChange={e => handleChange('note', e.target.value)}
            />
          </div>
        </div>

        <div style={styles.actions}>
          {isEditing && (
            <button style={styles.deleteBtn} onClick={handleDelete}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              删除
            </button>
          )}
          <div style={styles.rightActions}>
            <button style={styles.cancelBtn} onClick={onClose}>取消</button>
            <button style={styles.saveBtn} onClick={handleSave}>
              {isEditing ? '保存修改' : '添加课程'}
            </button>
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
    maxHeight: '92vh',
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
  select: {
    padding: '11px 14px',
    borderRadius: 10,
    border: '1.5px solid #E5E7EB',
    fontSize: 14,
    background: '#F9FAFB',
    width: '100%',
    appearance: 'none',
    WebkitAppearance: 'none',
  },
  row: {
    display: 'flex',
    gap: 10,
  },
  colorRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  weekTypeRow: {
    display: 'flex',
    gap: 8,
  },
  weekTypeBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    background: '#F3F4F6',
    color: '#6B7280',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  weekTypeActive: {
    background: '#F0FDF4',
    color: '#22C55E',
    fontWeight: 600,
  },
  weekGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  weekCell: {
    width: 'calc(16.66% - 5px)',
    padding: '8px 0',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    background: '#F3F4F6',
    color: '#6B7280',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'center',
  },
  weekCellActive: {
    background: '#22C55E',
    color: 'white',
    fontWeight: 600,
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
  deleteBtn: {
    padding: '12px 16px',
    borderRadius: 10,
    background: '#FEF2F2',
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  quickSlots: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickSlotBtn: {
    padding: '7px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    background: '#F3F4F6',
    color: '#6B7280',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  quickSlotBtnActive: {
    background: '#F0FDF4',
    color: '#22C55E',
    fontWeight: 600,
  },
}

import { useState, useRef } from 'react'
import { useScheduleStore } from '../store'
import { parseHTMLSchedule } from '../utils/parser'
import { extractTextFromDoc } from '../utils/docExtractor'
import type { Course, ParsedCourse } from '../types/schedule'
import { COURSE_COLORS, DAY_SHORT_LABELS } from '../types/schedule'

function deduceWeekType(weeks: number[]): 'all' | 'odd' | 'even' | 'custom' {
  if (weeks.length === 0) return 'all'
  const allOdd = weeks.every(w => w % 2 === 1)
  const allEven = weeks.every(w => w % 2 === 0)
  if (allOdd) return 'odd'
  if (allEven) return 'even'
  return 'custom'
}

interface Props {
  onClose: () => void
}

export default function WebViewModal({ onClose }: Props) {
  const { schedule, setCourses } = useScheduleStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [importedFileName, setImportedFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parseResult, setParseResult] = useState<{
    courses: ParsedCourse[]
    confidence: number
    warnings: string[]
  } | null>(null)
  const [selectAll, setSelectAll] = useState(true)
  const [selectedIndices, setSelectedIndices] = useState(new Set<number>())
  const [importDone, setImportDone] = useState(false)

  const applyParseResult = (result: { courses: ParsedCourse[]; confidence: number; warnings: string[] }) => {
    setError('')
    setParseResult(result)
    setSelectedIndices(new Set(result.courses.map((_, i) => i)))
    setSelectAll(true)
  }

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'docx' && ext !== 'doc') {
      setError('仅支持 .docx 或 .doc 格式的 Word 文档')
      return
    }
    setImportedFileName(file.name)
    setLoading(true)
    setError('')

    try {
      const arrayBuffer = await file.arrayBuffer()

      let htmlText = ''
      let usedMammoth = false
      let docRawText = ''

      try {
        const { convertToHtml } = await import('mammoth')
        const result = await convertToHtml({ arrayBuffer })
        htmlText = result.value
        usedMammoth = true
      } catch (mammothErr) {
        const msg = mammothErr instanceof Error ? mammothErr.message : String(mammothErr)
        const isZipError = msg.includes('zip') || msg.includes('central directory') || msg.includes('jszip')

        if (!isZipError) {
          setError('文档解析失败：' + msg)
          setLoading(false)
          return
        }

        docRawText = extractTextFromDoc(arrayBuffer)
        if (!docRawText || docRawText.trim().length < 5) {
          setError(
            '无法解析此文件。\n如果这是 .doc 文件（旧版格式），请用 Word 打开后另存为 .docx 格式再导入。\n路径：文件 → 另存为 → 文件类型选择 "Word 文档 (*.docx)"'
          )
          setLoading(false)
          return
        }

        htmlText = `<div>${docRawText.replace(/\n/g, '<br>')}</div>`
      }

      const parseResult = parseHTMLSchedule(htmlText)
      if (!usedMammoth && parseResult.courses.length === 0) {
        if (docRawText && docRawText.trim().length >= 5) {
          setError(
            `已从旧版 .doc 文件中提取到文本但未能识别出课表，请用 Word 另存为 .docx 格式再导入。\n提取到的内容预览：\n${docRawText.substring(0, 200)}...`
          )
        } else {
          setError(
            '无法解析此文件。\n如果这是 .doc 文件（旧版格式），请用 Word 打开后另存为 .docx 格式再导入。\n路径：文件 → 另存为 → 文件类型选择 "Word 文档 (*.docx)"'
          )
        }
        setLoading(false)
        return
      }

      if (parseResult.courses.length === 0) {
        setParseResult(parseResult)
        setSelectedIndices(new Set())
        setSelectAll(false)
      } else {
        applyParseResult(parseResult)
      }
    } catch (e) {
      setError('文档解析失败：' + (e instanceof Error ? e.message : '请确保文件是有效的 Word 课表文档'))
    } finally {
      setLoading(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const toggleSelectAll = () => {
    if (!parseResult) return
    if (selectAll) {
      setSelectedIndices(new Set())
      setSelectAll(false)
    } else {
      setSelectedIndices(new Set(parseResult.courses.map((_, i) => i)))
      setSelectAll(true)
    }
  }

  const toggleCourse = (index: number) => {
    const newSet = new Set(selectedIndices)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setSelectedIndices(newSet)
    setSelectAll(newSet.size === (parseResult?.courses.length ?? 0))
  }

  const handleImport = () => {
    if (!parseResult) return

    const nameColorMap: Record<string, number> = {}
    let nextColor = 0

    const newCourses: Course[] = []
    parseResult.courses.forEach((pc, idx) => {
      if (!selectedIndices.has(idx)) return

      if (!(pc.name in nameColorMap)) {
        nameColorMap[pc.name] = nextColor % COURSE_COLORS.length
        nextColor++
      }

      const [startTime, endTime] = pc.timeSlot.split('-')

      newCourses.push({
        id: `imported_${Date.now()}_${idx}`,
        name: pc.name,
        teacher: pc.teacher,
        location: pc.location,
        dayOfWeek: pc.dayOfWeek,
        startTime: startTime || '08:00',
        endTime: endTime || '09:40',
        weeks: pc.weeks,
        weekType: deduceWeekType(pc.weeks),
        color: COURSE_COLORS[nameColorMap[pc.name]],
        note: '',
      })
    })

    setCourses([...schedule.courses, ...newCourses])

    setImportDone(true)
    setTimeout(() => onClose(), 1200)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={e => e.stopPropagation()} className="animate-slideUp">
        <div style={styles.handle} />

        {importDone ? (
          <div style={styles.successWrap}>
            <div style={styles.checkmark}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p style={styles.successText}>导入成功！</p>
          </div>
        ) : !parseResult ? (
          <>
            <h2 style={styles.sheetTitle}>导入课表</h2>
            <p style={styles.sheetDesc}>选择从学校教务系统导出的 Word 文档</p>

            {error && (
              <div style={styles.errorBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={styles.errorText}>{error}</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <div
              style={{
                ...styles.dropZone,
                ...(dragOver ? styles.dropZoneActive : {}),
                ...(loading ? { pointerEvents: 'none', opacity: 0.7 } : {}),
              }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {loading ? (
                <div style={styles.dropContent}>
                  <div style={styles.loadingSpinner} />
                  <span style={styles.dropText}>正在解析文档...</span>
                </div>
              ) : importedFileName ? (
                <div style={styles.dropContent}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <span style={styles.dropText}>{importedFileName}</span>
                  <span style={styles.dropSub}>点击重新选择文件</span>
                </div>
              ) : (
                <div style={styles.dropContent}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span style={styles.dropText}>点击选择或拖放 .docx / .doc 文件</span>
                  <span style={styles.dropSub}>支持学校导出的 Word 课表文档</span>
                </div>
              )}
            </div>

            <div style={styles.hint}>
              <p style={styles.hintTitle}>💡 使用提示</p>
              <p style={styles.hintText}>
                1. 从学校教务系统导出课表为 Word 文档<br />
                2. 点击上方区域选择文件，或直接拖放<br />
                3. 系统自动识别表格中的课程信息<br />
                4. 支持 .docx（推荐）和 .doc 格式
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 style={styles.sheetTitle}>确认导入</h2>
            <div style={styles.confidenceBar}>
              <span style={styles.confidenceLabel}>识别置信度</span>
              <span style={{
                ...styles.confidenceValue,
                color: parseResult.confidence > 70 ? '#22C55E' : parseResult.confidence > 40 ? '#F59E0B' : '#EF4444',
              }}>
                {parseResult.confidence}%
              </span>
            </div>

            {parseResult.courses.length === 0 ? (
              <div style={styles.emptyResult}>
                <p style={styles.emptyResultText}>未能识别到课程数据</p>
                {parseResult.warnings.map((w, i) => (
                  <p key={i} style={{ fontSize: 12, color: '#991B1B', marginTop: 4 }}>⚠️ {w}</p>
                ))}
                <button style={styles.btnSecondary} onClick={() => setParseResult(null)}>
                  返回重试
                </button>
              </div>
            ) : (
              <>
                <div style={styles.resultHeader}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      style={styles.checkbox}
                    />
                    <span>全选 ({selectedIndices.size}/{parseResult.courses.length})</span>
                  </label>
                </div>

                <div style={styles.resultList}>
                  {parseResult.courses.map((course, idx) => (
                    <label key={idx} style={styles.resultItem}>
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(idx)}
                        onChange={() => toggleCourse(idx)}
                        style={styles.checkbox}
                      />
                      <div style={styles.resultContent}>
                        <div style={styles.resultName}>{course.name || '(未识别)'}</div>
                        <div style={styles.resultMeta}>
                          <span>周{DAY_SHORT_LABELS[course.dayOfWeek] || course.dayOfWeek}</span>
                          <span>{course.timeSlot}</span>
                          {course.location ? <span>📍{course.location}</span> : null}
                          {course.teacher ? <span>👤{course.teacher}</span> : null}
                          {course.weeks.length > 0 ? <span>📅{course.weeks.length}周</span> : null}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {parseResult.warnings.length > 0 && (
                  <div style={styles.warnings}>
                    {parseResult.warnings.map((w, i) => (
                      <p key={i} style={styles.warningItem}>⚠️ {w}</p>
                    ))}
                  </div>
                )}

                <div style={styles.actionRow}>
                  <button style={styles.btnSecondary} onClick={() => {
                    setParseResult(null)
                    setImportedFileName('')
                  }}>
                    重新解析
                  </button>
                  <button
                    style={{ ...styles.btn, ...(selectedIndices.size === 0 ? styles.btnDisabled : {}) }}
                    onClick={handleImport}
                    disabled={selectedIndices.size === 0}
                  >
                    导入 {selectedIndices.size} 门课程
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '90vh', background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 16px calc(20px + env(safe-area-inset-bottom, 16px))', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, background: '#E5E7EB', margin: '0 auto 4px' },
  sheetTitle: { fontSize: 20, fontWeight: 700 },
  sheetDesc: { fontSize: 13, color: '#6B7280', marginTop: -8 },
  errorBox: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA' },
  errorText: { fontSize: 12, color: '#991B1B', lineHeight: 1.5, whiteSpace: 'pre-wrap', flex: 1 },
  dropZone: { border: '2px dashed #D1D5DB', borderRadius: 14, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#FAFAFA' },
  dropZoneActive: { borderColor: '#22C55E', background: '#F0FDF4' },
  dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  dropText: { fontSize: 14, color: '#6B7280', fontWeight: 500 },
  dropSub: { fontSize: 12, color: '#9CA3AF' },
  loadingSpinner: { width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#22C55E', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  btn: { padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #A8E6CF 0%, #22C55E 100%)', color: 'white', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', width: '100%' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  btnSecondary: { padding: '14px 20px', borderRadius: 12, background: '#F3F4F6', color: '#374151', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', flex: 1 },
  hint: { background: '#FFFBEB', borderRadius: 12, padding: 14 },
  hintTitle: { fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 6 },
  hintText: { fontSize: 12, color: '#78716C', lineHeight: 1.6 },
  confidenceBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10 },
  confidenceLabel: { fontSize: 13, color: '#6B7280' },
  confidenceValue: { fontSize: 16, fontWeight: 700 },
  resultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  checkbox: { width: 18, height: 18, accentColor: '#22C55E', cursor: 'pointer' },
  resultList: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflow: 'auto' },
  resultItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px', background: '#F9FAFB', borderRadius: 10, cursor: 'pointer' },
  resultContent: { flex: 1, minWidth: 0 },
  resultName: { fontSize: 13, fontWeight: 600, color: '#1F2937' },
  resultMeta: { display: 'flex', flexWrap: 'wrap', gap: '4px 8px', fontSize: 11, color: '#6B7280', marginTop: 4 },
  emptyResult: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 8 },
  emptyResultText: { fontSize: 14, color: '#9CA3AF' },
  warnings: { background: '#FEF2F2', borderRadius: 10, padding: 10 },
  warningItem: { fontSize: 12, color: '#991B1B', lineHeight: 1.5 },
  actionRow: { display: 'flex', gap: 10 },
  successWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' },
  checkmark: { width: 72, height: 72, borderRadius: 36, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successText: { fontSize: 18, fontWeight: 700, color: '#22C55E' },
}

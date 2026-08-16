import type { ParsedCourse, ParseResult } from '../types/schedule'

export function parseHTMLSchedule(html: string): ParseResult {
  const warnings: string[] = []
  const courses: ParsedCourse[] = []

  try {
    const cleaned = cleanHTML(html)

    const tableCourses = tryParseTable(cleaned, warnings)
    courses.push(...tableCourses)

    if (courses.length === 0) {
      const listCourses = tryParseList(cleaned, warnings)
      courses.push(...listCourses)
    }

    if (courses.length === 0) {
      const textCourses = tryParsePlainText(cleaned, warnings)
      courses.push(...textCourses)
    }

    if (courses.length === 0) {
      warnings.push('未能在页面中找到课表数据，请尝试复制课表文字后手动添加')
      return { courses: [], confidence: 0, warnings }
    }

    const confidence = calculateConfidence(courses, warnings)
    return { courses, confidence, warnings }
  } catch (e) {
    warnings.push('解析过程中出现异常：' + (e instanceof Error ? e.message : String(e)))
    return { courses: [], confidence: 0, warnings }
  }
}

function cleanHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&ensp;/g, ' ')
    .replace(/&emsp;/g, ' ')
    .replace(/&middot;/g, '·')
}

function tryParseTable(html: string, warnings: string[]): ParsedCourse[] {
  const courses: ParsedCourse[] = []

  const tableRegex = /<\s*table[\s\S]*?<\/\s*table>/gi
  const tableMatches = html.match(tableRegex)

  if (!tableMatches) return courses

  for (const tableHtml of tableMatches) {
    const trRegex = /<\s*tr[\s\S]*?<\/\s*tr>/gi
    const rows = tableHtml.match(trRegex)
    if (!rows || rows.length < 2) continue

    const headerRow = rows[0]
    const headers = extractTdContent(headerRow)
    const dayMapping = detectDayColumns(headers)

    if (Object.keys(dayMapping).length === 0) continue

    for (let i = 1; i < rows.length; i++) {
      const cells = extractTdContent(rows[i])
      if (cells.length < 2) continue

      const firstCellText = cells[0].trim()
      const timeSlotInfo = extractTimeSlot(firstCellText)

      const rowWeeksFromHeader = extractWeekNumbers(firstCellText)

      if (!timeSlotInfo) continue

      for (const [colIdx, dayOfWeek] of Object.entries(dayMapping)) {
        const idx = parseInt(colIdx)
        if (idx >= cells.length) continue

        const cellText = cells[idx].trim()
        if (!cellText || cellText === '无' || cellText === '-' || cellText === '　' ||
            /^(上午|下午|早晨|晚上|早自习|晚自习|午休)$/.test(cellText)) continue

        const parsed = parseCourseCell(cellText, dayOfWeek, timeSlotInfo, rowWeeksFromHeader)
        if (parsed.length > 0) {
          courses.push(...parsed)
        }
      }
    }
  }

  return courses
}

function tryParseList(html: string, warnings: string[]): ParsedCourse[] {
  const courses: ParsedCourse[] = []
  const text = html.replace(/<[^>]+>/g, '\n').replace(/[ \t]+/g, ' ')

  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 3)

  if (lines.length > 0) {
    const day = extractDayOfWeek(lines[0])
    if (day > 0) {
      const timeSlot = extractTimeSlot(lines.length > 1 ? lines[1] : lines[0])
      if (timeSlot) {
        for (const line of lines) {
          const parsed = parseSingleLine(line)
          if (parsed) courses.push(parsed)
        }
      }
    }
  }

  if (courses.length === 0) {
    for (const line of lines) {
      const parsed = parseSingleLine(line)
      if (parsed) courses.push(parsed)
    }
  }

  return courses
}

function tryParsePlainText(text: string, warnings: string[]): ParsedCourse[] {
  const courses: ParsedCourse[] = []
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 2)
  for (const line of lines) {
    const parsed = parseSingleLine(line)
    if (parsed) courses.push(parsed)
  }
  return courses
}

function extractTdContent(html: string): string[] {
  const tdRegex = /<\s*t[dh][^>]*>([\s\S]*?)<\s*\/\s*t[dh]>/gi
  const result: string[] = []
  let match: RegExpExecArray | null
  while ((match = tdRegex.exec(html)) !== null) {
    result.push(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '))
  }
  return result
}

function detectDayColumns(headers: string[]): Record<number, number> {
  const mapping: Record<number, number> = {}
  const dayKeywords = [
    { keys: ['星期一', '周一', '月', 'Mon', 'Monday'], day: 1 },
    { keys: ['星期二', '周二', '火', 'Tue', 'Tuesday'], day: 2 },
    { keys: ['星期三', '周三', '水', 'Wed', 'Wednesday'], day: 3 },
    { keys: ['星期四', '周四', '木', 'Thu', 'Thursday'], day: 4 },
    { keys: ['星期五', '周五', '金', 'Fri', 'Friday'], day: 5 },
    { keys: ['星期六', '周六', '土', 'Sat', 'Saturday'], day: 6 },
    { keys: ['星期日', '星期天', '周日', '日', 'Sun', 'Sunday'], day: 7 },
  ]

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].trim()
    if (/节次|时间|课程|时段/.test(header)) {
      continue
    }
    for (const { keys, day } of dayKeywords) {
      if (keys.some(k => header.includes(k))) {
        mapping[i] = day
        break
      }
    }
  }

  if (Object.keys(mapping).length === 0 && headers.length >= 8) {
    for (let i = 1; i <= 7 && i < headers.length; i++) {
      mapping[i] = i
    }
  }

  return mapping
}

function extractTimeSlot(text: string): { startTime: string; endTime: string } | null {
  const cleaned = text.replace(/<[^>]+>/g, '').trim()

  const timeRangeRegex = /(\d{1,2}:\d{2})\s*[-~至到—]\s*(\d{1,2}:\d{2})/
  let match = cleaned.match(timeRangeRegex)
  if (match) {
    const pad = (t: string) => {
      const [h, m] = t.split(':')
      return `${h.padStart(2, '0')}:${m}`
    }
    return { startTime: pad(match[1]), endTime: pad(match[2]) }
  }

  const singleTimeRegex = /(\d{1,2}):(\d{2})/
  const sMatch = cleaned.match(singleTimeRegex)
  if (sMatch) {
    const hour = parseInt(sMatch[1])
    const minute = sMatch[2]
    const startTime = `${hour.toString().padStart(2, '0')}:${minute}`
    const endHour = hour + 1
    const endMinute = minute === '45' ? '40' : minute === '40' ? '35' : minute
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute}`
    return { startTime, endTime }
  }

  const periodRangeRegex = /第?\s*(\d+)\s*[-~至—]\s*(\d+)\s*[节大]/
  let pMatch = cleaned.match(periodRangeRegex)
  if (pMatch) {
    const start = parseInt(pMatch[1])
    const end = parseInt(pMatch[2])
    const startTime = periodToTime(start)
    const endTime = periodToEndTime(end)
    if (startTime && endTime) return { startTime, endTime }
  }

  const periodListRegex = /第?\s*(\d+)\s*[,，、]\s*(\d+)\s*[节]/
  let plMatch = cleaned.match(periodListRegex)
  if (plMatch) {
    const start = parseInt(plMatch[1])
    const end = parseInt(plMatch[2])
    const startTime = periodToTime(start)
    const endTime = periodToEndTime(end)
    if (startTime && endTime) return { startTime, endTime }
  }

  const singlePeriodRegex = /第?\s*(\d+)\s*[节]/
  let spMatch = cleaned.match(singlePeriodRegex)
  if (spMatch) {
    const num = parseInt(spMatch[1])
    if (num >= 1 && num <= 12) {
      const startTime = periodToTime(num)
      const endTime = periodToEndTime(num)
      if (startTime && endTime) return { startTime, endTime }
    }
  }

  return null
}

function periodToTime(period: number): string {
  const timeSlots: Record<number, string> = {
    1: '08:00', 2: '08:55', 3: '10:10', 4: '11:05',
    5: '14:00', 6: '14:55', 7: '16:00', 8: '16:55',
    9: '19:00', 10: '19:55', 11: '20:50', 12: '21:45',
  }
  return timeSlots[period] || '08:00'
}

function periodToEndTime(period: number): string {
  const timeSlots: Record<number, string> = {
    1: '08:45', 2: '09:40', 3: '10:55', 4: '11:50',
    5: '14:45', 6: '15:40', 7: '16:45', 8: '17:40',
    9: '19:45', 10: '20:40', 11: '21:35', 12: '22:30',
  }
  return timeSlots[period] || '09:40'
}

function parseCourseCell(
  text: string,
  dayOfWeek: number,
  timeSlot: { startTime: string; endTime: string },
  rowWeeks: number[]
): ParsedCourse[] {
  const results: ParsedCourse[] = []

  const segments = text.split(/<br\s*\/?>/i)
  const meaningful = segments.filter(s => s.trim().length > 1)
  if (meaningful.length > 1) {
    for (const seg of meaningful) {
      const parsed = parseSegmentWithSmartSplit(seg.trim(), dayOfWeek, timeSlot, rowWeeks)
      if (parsed) results.push(parsed)
    }
    if (results.length > 0) return results
  }

  const lines = text.split(/[\n\r]+/).filter(Boolean)
  if (lines.length > 1) {
    for (const line of lines) {
      const parsed = parseSegmentWithSmartSplit(line.trim(), dayOfWeek, timeSlot, rowWeeks)
      if (parsed) results.push(parsed)
    }
    if (results.length > 0) return results
  }

  const parsed = parseSegmentWithSmartSplit(text.trim(), dayOfWeek, timeSlot, rowWeeks)
  if (parsed) results.push(parsed)
  return results
}

function parseSegmentWithSmartSplit(
  text: string,
  dayOfWeek: number,
  timeSlot: { startTime: string; endTime: string },
  rowWeeks: number[]
): ParsedCourse | null {
  if (!text || text.length < 2) return null

  const weeks = extractWeekNumbers(text)
  const mergedWeeks = weeks.length > 0 ? weeks : rowWeeks

  const location = extractLocation(text)

  let cleaned = text
    .replace(/[（(][^）)]*[）)]/g, ' ')
    .replace(/周[一-日]/g, ' ')
    .replace(/星期[一-日]/g, ' ')
    .replace(/第?\s*\d+\s*[-~至到—]\s*\d+\s*周/g, ' ')
    .replace(/第?\s*\d+\s*周/g, ' ')
    .replace(/(\d{1,2}:\d{2})\s*[-~至到—]\s*(\d{1,2}:\d{2})/g, ' ')
    .replace(/\d{1,2}:\d{2}/g, ' ')
    .replace(/第?\s*\d+\s*[-~至—]\s*\d+\s*[节大]/g, ' ')
    .replace(/第?\s*\d+\s*[节大]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (location) {
    cleaned = cleaned.replace(location, ' ')
  }

  const parts = cleaned
    .split(/\s+/)
    .map(p => p.trim())
    .filter(p => p.length >= 2)

  const nonEmptyParts = parts.filter(p => !/^[A-Za-z0-9]+$/.test(p))

  let name = ''
  let teacher = ''

  const chineseParts = nonEmptyParts.filter(p => /[\u4e00-\u9fff]/.test(p))

  if (chineseParts.length === 1) {
    name = chineseParts[0]
  } else if (chineseParts.length >= 2) {
    const sorted = [...chineseParts].sort((a, b) => b.length - a.length)
    name = sorted[0]

    const remaining = chineseParts.filter(p => p !== name)
    const shortName = remaining.find(p =>
      /^[\u4e00-\u9fff]{2,3}$/.test(p) &&
      !/大学|学院|专业|班级|教室|周数|课程|学期|实验|教学|楼/.test(p)
    )
    if (shortName) {
      teacher = shortName
    }
  }

  if (!name && cleaned.length >= 2 && cleaned.length <= 30) {
    name = cleaned
  }

  if (!name || name.length < 2) return null

  const explicitTeacher = extractTeacherExplicit(text, name)
  if (explicitTeacher) teacher = explicitTeacher

  return {
    name,
    teacher: teacher || '',
    location: location || '',
    dayOfWeek,
    timeSlot: `${timeSlot.startTime}-${timeSlot.endTime}`,
    weeks: mergedWeeks,
    rawText: text,
  }
}

function parseSingleLine(line: string): ParsedCourse | null {
  const dayOfWeek = extractDayOfWeek(line)
  if (dayOfWeek === 0) return null

  const timeSlot = extractTimeSlot(line)
  if (!timeSlot) return null

  return parseSegmentWithSmartSplit(line, dayOfWeek, timeSlot, [])
}

function extractDayOfWeek(text: string): number {
  const dayMap: Record<string, number> = {
    '周一': 1, '星期一': 1, '月曜': 1,
    '周二': 2, '星期二': 2, '火曜': 2,
    '周三': 3, '星期三': 3, '水曜': 3,
    '周四': 4, '星期四': 4, '木曜': 4,
    '周五': 5, '星期五': 5, '金曜': 5,
    '周六': 6, '星期六': 6, '土曜': 6,
    '周日': 7, '星期日': 7, '星期天': 7, '日曜': 7,
  }
  for (const [key, day] of Object.entries(dayMap)) {
    if (text.includes(key)) return day
  }
  return 0
}

function extractLocation(text: string): string {
  const sortedPatterns = [
    /(\d{2,3})\s*[-—]\s*(\d{3,4})(?!\s*周)/,
    /([A-Za-z]{1,3})\s*[-—]?\s*(\d{3,4})/,
    /([A-Za-z]{1,3})\s*楼?\s*(\d{3,4})/,
    /教学(\d{1,2})号楼?\s*(\d{3,4})/,
    /((?:一|二|三|四|五|六|七|八|九|十)+)教\s*(\d{3,4})/,
    /((?:一|二|三|四|五|六|七|八|九|十)+)教\s*(\d{2,3})/,
    /([A-Za-z]+)\s*(\d{3,4})/,
    /([\u4e00-\u9fff]{2,4})(\d{3,4})/,
    /(实验楼?\s*[A-Za-z]?\s*\d{2,4})/i,
    /((?:实验|多媒体|阶梯|语音)\S{2,6})/,
    /([A-Za-z]+[\d-]+)/,
    /(\d{2,3})\s+(\d{3,4})(?!\s*周)/,
  ]

  for (const pattern of sortedPatterns) {
    const match = text.match(pattern)
    if (match) {
      const found = match[0].replace(/\s+/g, '')
      return found
    }
  }

  return ''
}

function extractTeacherExplicit(text: string, courseName: string): string {
  const patterns = [
    /([\u4e00-\u9fff]{2,4})老师/,
    /教师[：:]\s*([\u4e00-\u9fff]{2,4})/,
    /讲师[：:]\s*([\u4e00-\u9fff]{2,4})/,
    /教授[：:]\s*([\u4e00-\u9fff]{2,4})/,
    /任课教师[：:]\s*([\u4e00-\u9fff]{2,4})/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const t = match[1]
      if (t !== courseName && !courseName.includes(t)) return t
    }
  }

  return ''
}

function extractWeekNumbers(text: string): number[] {
  const weeks: number[] = []

  const rangeWithWeek = /(\d+)\s*[-~至到—]\s*(\d+)\s*周/
  let match = text.match(rangeWithWeek)
  if (match) {
    const start = parseInt(match[1])
    const end = parseInt(match[2])
    if (start > 0 && end <= 25 && start <= end) {
      for (let i = start; i <= end; i++) weeks.push(i)
    }
  }

  const rawWeekRange = /周\s*[：:]*\s*(\d+)\s*[-~至到—]\s*(\d+)/
  let rMatch = text.match(rawWeekRange)
  if (rMatch && weeks.length === 0) {
    const start = parseInt(rMatch[1])
    const end = parseInt(rMatch[2])
    if (start > 0 && end <= 25 && start <= end) {
      for (let i = start; i <= end; i++) weeks.push(i)
    }
  }

  const commaWithWeek = /(\d+(?:[,，、]\d+)+)\s*周/
  let cMatch = text.match(commaWithWeek)
  if (cMatch) {
    const nums = cMatch[1].split(/[,，、]+/)
    for (const n of nums) {
      const w = parseInt(n)
      if (w > 0 && w <= 25 && !weeks.includes(w)) weeks.push(w)
    }
  }

  const singleWeekPattern = /第?\s*(\d+)\s*周/g
  let sMatch
  while ((sMatch = singleWeekPattern.exec(text)) !== null) {
    const w = parseInt(sMatch[1])
    if (w > 0 && w <= 25 && !weeks.includes(w)) {
      weeks.push(w)
    }
  }

  if (weeks.length === 0) {
    // 先剔除“第X-Y节”类节次描述，避免把节次区间误判为周数
    const textWithoutPeriods = text.replace(/第\s*\d+(?:\s*[-~至到—]\s*\d+)?\s*[节大]/g, ' ')
    const bareRange = /(\d{1,2})\s*[-~至到—]\s*(\d{1,2})(?![\d:])/g
    for (const bMatch of textWithoutPeriods.matchAll(bareRange)) {
      const start = parseInt(bMatch[1])
      const end = parseInt(bMatch[2])
      if (start >= 1 && start <= 25 && end >= 1 && end <= 25 && start < end) {
        for (let i = start; i <= end; i++) {
          if (!weeks.includes(i)) weeks.push(i)
        }
      }
    }
  }

  const allWeekPattern = /全周|每周|所有周|全部周|全学期/
  if (allWeekPattern.test(text) && weeks.length === 0) {
    for (let i = 1; i <= 18; i++) weeks.push(i)
  }

  return weeks.sort((a, b) => a - b)
}

function calculateConfidence(courses: ParsedCourse[], warnings: string[]): number {
  if (courses.length === 0) return 0

  let score = 100

  const hasEmptyNames = courses.filter(c => !c.name).length
  score -= hasEmptyNames * 10

  const hasEmptyLocations = courses.filter(c => !c.location).length
  score -= hasEmptyLocations * 5

  const hasEmptyWeeks = courses.filter(c => c.weeks.length === 0).length
  score -= hasEmptyWeeks * 8

  const hasEmptyTeacher = courses.filter(c => !c.teacher).length
  score -= hasEmptyTeacher * 3

  if (hasEmptyWeeks > 0) warnings.push('部分课程未能识别出具体周数')
  if (hasEmptyLocations > 0) warnings.push('部分课程未能识别出教室信息')
  if (hasEmptyTeacher > 0) warnings.push('部分课程未能识别出教师信息')

  return Math.max(0, Math.min(100, score))
}

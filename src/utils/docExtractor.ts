export function extractTextFromDoc(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer)
  const chunks: string[] = []

  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0x0D && bytes[i + 1] === 0x00) {
      i++
      continue
    }

    if (bytes[i] >= 0x0E && bytes[i] <= 0x40) continue

    const utf16Str = tryExtractUTF16Chunk(bytes, i)
    if (utf16Str && utf16Str.length >= 2) {
      chunks.push(utf16Str)
      i += utf16Str.length * 2
      continue
    }

    const asciiStr = tryExtractASCIIChunk(bytes, i)
    if (asciiStr.length >= 2) {
      chunks.push(asciiStr)
      i += asciiStr.length
      continue
    }
  }

  const unique = [...new Set(chunks)]
  return unique.join('\n')
}

function tryExtractUTF16Chunk(bytes: Uint8Array, start: number): string | null {
  const chars: number[] = []

  for (let i = start; i < bytes.length - 1; i += 2) {
    const low = bytes[i]
    const high = bytes[i + 1]

    if (low === 0 && high === 0) break

    const codeUnit = low | (high << 8)

    if (
      (codeUnit >= 0x4E00 && codeUnit <= 0x9FFF) ||
      (codeUnit >= 0x3400 && codeUnit <= 0x4DBF) ||
      (codeUnit >= 0xF900 && codeUnit <= 0xFAFF) ||
      (codeUnit >= 0x0020 && codeUnit <= 0x007E) ||
      (codeUnit >= 0xFF00 && codeUnit <= 0xFFEF) ||
      codeUnit === 0x3001 || codeUnit === 0x3002 ||
      (codeUnit >= 0x3000 && codeUnit <= 0x303F) ||
      (codeUnit >= 0x2000 && codeUnit <= 0x206F) ||
      codeUnit === 0x0009 || codeUnit === 0x000A || codeUnit === 0x000D ||
      codeUnit === 0xFF08 || codeUnit === 0xFF09 ||
      (codeUnit >= 0x0028 && codeUnit <= 0x0029)
    ) {
      chars.push(codeUnit)
    } else {
      if (chars.length >= 2) break
      return null
    }
  }

  if (chars.length < 2) return null

  return String.fromCharCode(...chars)
}

function tryExtractASCIIChunk(bytes: Uint8Array, start: number): string {
  const chars: number[] = []

  for (let i = start; i < bytes.length; i++) {
    const b = bytes[i]
    if (
      (b >= 0x61 && b <= 0x7A) ||
      (b >= 0x41 && b <= 0x5A) ||
      (b >= 0x30 && b <= 0x39) ||
      b === 0x20 || b === 0x2D || b === 0x2F ||
      b === 0x28 || b === 0x29 || b === 0x28
    ) {
      chars.push(b)
    } else {
      break
    }
  }

  return String.fromCharCode(...chars)
}

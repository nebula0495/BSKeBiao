const fs = require('fs')
const path = require('path')

function createPNG(size, outputPath) {
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  ])

  const widthBuf = Buffer.allocUnsafe(4)
  widthBuf.writeUInt32BE(size, 0)
  const heightBuf = Buffer.allocUnsafe(4)
  heightBuf.writeUInt32BE(size, 0)

  const ihdr = Buffer.concat([
    widthBuf,
    heightBuf,
    Buffer.from([0x08, 0x02, 0x00, 0x00, 0x00]),
  ])

  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdr]))

  const IDAT = createImageData(size, size)

  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), IDAT]))

  const iendCrc = crc32(Buffer.from('IEND'))

  const result = Buffer.concat([
    header,
    ihdr,
    crcBuf(ihdrCrc),
    chunkLenBuf(IDAT.length),
    Buffer.from('IDAT'),
    IDAT,
    crcBuf(idatCrc),
    chunkLenBuf(0),
    Buffer.from('IEND'),
    crcBuf(iendCrc),
  ])

  fs.writeFileSync(outputPath, result)
  console.log(`Created ${outputPath} (${size}x${size})`)
}

function createImageData(w, h) {
  const rawData = []
  rawData.push(0)
  for (let y = 0; y < h; y++) {
    rawData.push(0)
    for (let x = 0; x < w; x++) {
      const cx = x / w - 0.5
      const cy = y / h - 0.5
      const r = Math.sqrt(cx * cx + cy * cy)
      const inCircle = r < 0.4
      const isBorder = Math.abs(r - 0.4) < 0.02

      if (isBorder) {
        rawData.push(0xFF, 0xFF, 0xFF, 0xFF)
      } else if (inCircle) {
        const dist = r / 0.4
        const gradientR = Math.round(0x4F + dist * (0x7C - 0x4F))
        const gradientG = Math.round(0x46 + dist * (0x3A - 0x46))
        const gradientB = Math.round(0xE5 + dist * (0xED - 0xE5))
        rawData.push(gradientR, gradientG, gradientB, 0xFF)
      } else {
        rawData.push(0x4F, 0x46, 0xE5, 0xFF)
      }
    }
  }

  const uncompressed = Buffer.from(rawData)
  const compressed = deflate(uncompressed)
  return compressed
}

function deflate(data) {
  const zlib = require('zlib')
  return zlib.deflateSync(data)
}

const crcTable = []
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  crcTable[n] = c
}

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function crcBuf(value) {
  const buf = Buffer.allocUnsafe(4)
  buf.writeUInt32BE(value, 0)
  return buf
}

function chunkLenBuf(len) {
  const buf = Buffer.allocUnsafe(4)
  buf.writeUInt32BE(len, 0)
  return buf
}

const publicDir = path.join(__dirname, '..', 'public')
createPNG(192, path.join(publicDir, 'icon-192.png'))
createPNG(512, path.join(publicDir, 'icon-512.png'))
